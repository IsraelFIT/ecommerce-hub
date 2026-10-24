import hmac
import hashlib
import httpx
from typing import Dict, Any, List, Optional
import os
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import settings, Settings
from app.models.tenant import Tenant
from app.models.order import Order
from app.models.bank import Bank
from app.schemas.payment import CheckoutSessionResponse, SplitDetails
from app.payments.base import PaymentProvider


class PaystackPaymentProvider(PaymentProvider):
    """
    Paystack subaccount split-payment strategy provider.
    """

    def __init__(self, secret_key: str = "", webhook_secret: str = ""):
        # Check fresh environment or re-read settings to guarantee updated .env keys
        fresh_settings = Settings()
        self.secret_key = (
            secret_key
            or os.getenv("PAYSTACK_SECRET_KEY")
            or fresh_settings.PAYSTACK_SECRET_KEY
            or ""
        ).strip()
        self.webhook_secret = (
            webhook_secret
            or os.getenv("PAYSTACK_WEBHOOK_SECRET")
            or fresh_settings.PAYSTACK_WEBHOOK_SECRET
            or self.secret_key
        ).strip()
        self.base_url = (
            os.getenv("PAYSTACK_API_URL")
            or fresh_settings.PAYSTACK_API_URL
            or settings.PAYSTACK_API_URL
            or "https://api.paystack.co"
        ).strip().rstrip("/")

    def calculate_split(self, order: Order, tenant: Tenant) -> SplitDetails:
        total = float(order.total_amount)
        platform_fee = round(total * (settings.PLATFORM_FEE_PERCENTAGE / 100.0), 2)
        tenant_payout = round(total - platform_fee, 2)

        return SplitDetails(
            total_amount=total,
            platform_fee=platform_fee,
            tenant_payout=tenant_payout,
            subaccount_code=tenant.paystack_subaccount_code,
            currency=order.currency,
        )

    async def create_checkout_session(
        self,
        order: Order,
        tenant: Tenant,
        callback_url: str,
    ) -> CheckoutSessionResponse:
        split = self.calculate_split(order, tenant)
        
        # Paystack expects amounts in lowest currency unit (e.g. kobo/cents * 100)
        amount_kobo = int(split.total_amount * 100)
        platform_fee_kobo = int(split.platform_fee * 100)

        payload: Dict[str, Any] = {
            "email": order.customer_email,
            "amount": amount_kobo,
            "reference": order.gateway_reference,
            "callback_url": callback_url,
            "metadata": {
                "order_id": str(order.id),
                "tenant_id": str(tenant.id),
                "tenant_slug": tenant.slug,
            },
        }

        # Route to tenant subaccount if configured
        if tenant.paystack_subaccount_code:
            payload["subaccount"] = tenant.paystack_subaccount_code
            payload["transaction_charge"] = platform_fee_kobo
            payload["bearer"] = "subaccount"

        is_real_key = bool(
            self.secret_key and not self.secret_key.startswith("sk_test_placeholder")
        )

        if is_real_key:
            headers = {
                "Authorization": f"Bearer {self.secret_key}",
                "Content-Type": "application/json",
            }
            try:
                async with httpx.AsyncClient(timeout=15.0) as client:
                    res = await client.post(
                        f"{self.base_url}/transaction/initialize",
                        json=payload,
                        headers=headers,
                    )
                    if res.status_code == 200:
                        data = res.json().get("data", {})
                        auth_url = data.get("authorization_url", "")
                        if auth_url:
                            return CheckoutSessionResponse(
                                checkout_url=auth_url,
                                reference=order.gateway_reference,
                                gateway="paystack",
                                split_details=split,
                            )

                    # If Paystack rejected the request with real keys, provide exact error
                    try:
                        err_json = res.json()
                        err_msg = err_json.get("message") or str(err_json)
                    except Exception:
                        err_msg = res.text
                    print(f"❌ [Paystack API Initialization Error {res.status_code}]: {err_msg}")
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Paystack API Error: {err_msg}",
                    )
            except httpx.RequestError as exc:
                print(f"❌ [Paystack Network Error]: {exc}")
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Unable to reach Paystack servers ({exc}). Please verify your internet connection or retry.",
                )

        # Mock fallback for sandbox/local testing when no real keys are set
        mock_checkout_url = f"https://checkout.paystack.com/{order.gateway_reference}"
        return CheckoutSessionResponse(
            checkout_url=mock_checkout_url,
            reference=order.gateway_reference,
            gateway="paystack",
            split_details=split,
        )

    async def verify_webhook_signature(
        self,
        raw_body: bytes,
        signature_header: str,
    ) -> bool:
        if not self.webhook_secret or not signature_header:
            return True  # Allow in development if not configured
        
        computed_hash = hmac.new(
            self.webhook_secret.encode("utf-8"),
            msg=raw_body,
            digestmod=hashlib.sha512,
        ).hexdigest()

        return hmac.compare_digest(computed_hash, signature_header)

    async def parse_webhook_event(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        data = payload.get("data", {})
        return {
            "event_id": str(data.get("id", "")),
            "event_type": payload.get("event", ""),
            "reference": data.get("reference", ""),
            "status": "paid" if payload.get("event") == "charge.success" else "failed",
            "amount": float(data.get("amount", 0)) / 100.0,
            "metadata": data.get("metadata", {}),
        }

    async def verify_transaction(self, reference: str) -> Dict[str, Any]:
        """
        Verify Paystack transaction status via API or development fallback.
        """
        if self.secret_key and not self.secret_key.startswith("sk_test_placeholder"):
            headers = {"Authorization": f"Bearer {self.secret_key}"}
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(
                    f"{self.base_url}/transaction/verify/{reference}",
                    headers=headers,
                )
                if res.status_code == 200:
                    data = res.json().get("data", {})
                    return {
                        "status": "paid" if data.get("status") == "success" else data.get("status", "failed"),
                        "amount": float(data.get("amount", 0)) / 100.0,
                        "gateway": "paystack",
                        "raw": data,
                    }
        # Development / sandbox mock verification
        return {"status": "paid", "amount": 0.0, "gateway": "paystack"}

    async def fetch_banks_from_paystack(self, country: str = "nigeria") -> List[Dict[str, Any]]:
        """
        Direct call to Paystack Miscellaneous Bank API per official documentation:
        https://paystack.com/docs/api/miscellaneous/#bank
        Supports cursor-based pagination to retrieve all active banks for the specified country.
        """
        clean_country = country.strip().lower()
        headers: Dict[str, str] = {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        if self.secret_key:
            headers["Authorization"] = f"Bearer {self.secret_key}"

        all_banks: List[Dict[str, Any]] = []
        next_cursor: Optional[str] = None
        page_count = 0
        max_pages = 10

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                while page_count < max_pages:
                    page_count += 1
                    params: Dict[str, Any] = {
                        "country": clean_country,
                        "use_cursor": "true",
                        "perPage": 100,
                    }
                    if next_cursor:
                        params["next"] = next_cursor

                    res = await client.get(
                        f"{self.base_url}/bank",
                        params=params,
                        headers=headers,
                    )
                    if res.status_code != 200:
                        break

                    body = res.json()
                    if not body.get("status"):
                        break

                    data = body.get("data", [])
                    if not data:
                        break

                    all_banks.extend(data)
                    meta = body.get("meta") or {}
                    next_cursor = meta.get("next")
                    if not next_cursor:
                        break
        except Exception:
            # Fallback to standard request if cursor pagination encountered an error
            if not all_banks:
                try:
                    async with httpx.AsyncClient(timeout=10.0) as client:
                        res = await client.get(
                            f"{self.base_url}/bank?country={clean_country}&perPage=100",
                            headers=headers,
                        )
                        if res.status_code == 200:
                            body = res.json()
                            all_banks = body.get("data", [])
                except Exception:
                    pass

        return all_banks

    async def list_banks(
        self,
        db: Optional[AsyncSession] = None,
        country: str = "nigeria",
        force_refresh: bool = False,
    ) -> List[Dict[str, Any]]:
        """
        Retrieve settlement banks list for automated subaccount setup.
        Checks the database first so queries are zero-latency and offline-tolerant.
        Updates from Paystack API if DB is empty, cache is older than 7 days, or force_refresh=True.
        """
        clean_country = country.strip().lower()

        # 1. Check local database cache if DB session is provided
        if db is not None and not force_refresh:
            try:
                stmt = (
                    select(Bank)
                    .where(
                        Bank.country == clean_country,
                        Bank.is_deleted == False,
                        Bank.active == True,
                    )
                    .order_by(Bank.name.asc())
                )
                result = await db.execute(stmt)
                cached_banks = result.scalars().all()

                if cached_banks:
                    unique_banks = []
                    seen_codes = set()
                    for b in cached_banks:
                        if b.code not in seen_codes:
                            seen_codes.add(b.code)
                            unique_banks.append({
                                "name": b.name,
                                "code": b.code,
                                "slug": b.slug,
                                "id": b.paystack_id or str(b.id),
                            })
                    return unique_banks
            except Exception:
                pass

        # 2. Fetch fresh bank list from Paystack API
        fetched = await self.fetch_banks_from_paystack(country=clean_country)

        # 3. Persist / upsert fresh banks to database if DB session is available
        if fetched and db is not None:
            try:
                # Pre-load all existing banks for this country in ONE single query for O(1) in-memory resolution
                existing_stmt = select(Bank).where(Bank.country == clean_country)
                existing_rows = (await db.execute(existing_stmt)).scalars().all()
                existing_by_pid = {b.paystack_id: b for b in existing_rows if b.paystack_id}
                existing_by_code = {b.code: b for b in existing_rows}

                for b in fetched:
                    code = str(b.get("code") or "").strip()
                    name = (b.get("name") or "").strip()
                    pid = int(b.get("id")) if b.get("id") else None
                    if not code or not name:
                        continue

                    existing = existing_by_pid.get(pid) if pid else existing_by_code.get(code)
                    if existing:
                        existing.name = name
                        existing.slug = b.get("slug")
                        existing.longcode = b.get("longcode")
                        existing.gateway = b.get("gateway")
                        existing.pay_with_bank = bool(b.get("pay_with_bank", False))
                        existing.supports_transfer = bool(b.get("supports_transfer", True))
                        existing.active = bool(b.get("active", True))
                        existing.is_deleted = bool(b.get("is_deleted", False))
                        existing.currency = b.get("currency") or "NGN"
                        existing.bank_type = b.get("type") or "nuban"
                        if pid:
                            existing.paystack_id = pid
                    else:
                        new_bank = Bank(
                            name=name,
                            code=code,
                            slug=b.get("slug"),
                            longcode=b.get("longcode"),
                            gateway=b.get("gateway"),
                            pay_with_bank=bool(b.get("pay_with_bank", False)),
                            supports_transfer=bool(b.get("supports_transfer", True)),
                            active=bool(b.get("active", True)),
                            is_deleted=bool(b.get("is_deleted", False)),
                            country=clean_country,
                            currency=b.get("currency") or "NGN",
                            bank_type=b.get("type") or "nuban",
                            paystack_id=pid,
                        )
                        db.add(new_bank)
                        if pid:
                            existing_by_pid[pid] = new_bank

                await db.commit()

                # Query and return fresh persisted list from DB deduplicated by code
                stmt = (
                    select(Bank)
                    .where(
                        Bank.country == clean_country,
                        Bank.is_deleted == False,
                        Bank.active == True,
                    )
                    .order_by(Bank.name.asc())
                )
                result = await db.execute(stmt)
                db_banks = result.scalars().all()
                unique_banks = []
                seen_codes = set()
                for b in db_banks:
                    if b.code not in seen_codes:
                        seen_codes.add(b.code)
                        unique_banks.append({
                            "name": b.name,
                            "code": b.code,
                            "slug": b.slug,
                            "id": b.paystack_id or str(b.id),
                        })
                if unique_banks:
                    return unique_banks
            except Exception:
                try:
                    await db.rollback()
                except Exception:
                    pass

        # 4. If fetched directly from Paystack (without DB sync or before DB write)
        if fetched:
            unique_banks = []
            seen_codes = set()
            for b in fetched:
                if b.get("is_deleted") is not True and b.get("active") is not False:
                    code = str(b.get("code"))
                    if code not in seen_codes:
                        seen_codes.add(code)
                        unique_banks.append({
                            "name": b.get("name"),
                            "code": code,
                            "slug": b.get("slug"),
                            "id": b.get("id"),
                        })
            return unique_banks

        # 5. Default fallback list of major Nigerian banks
        return [
            {"name": "Access Bank", "code": "044", "slug": "access-bank"},
            {"name": "Access Bank (Diamond)", "code": "063", "slug": "diamond-bank"},
            {"name": "Ecobank Nigeria", "code": "050", "slug": "ecobank-nigeria"},
            {"name": "Fidelity Bank", "code": "070", "slug": "fidelity-bank"},
            {"name": "First Bank of Nigeria", "code": "011", "slug": "first-bank-of-nigeria"},
            {"name": "First City Monument Bank (FCMB)", "code": "214", "slug": "first-city-monument-bank"},
            {"name": "Guaranty Trust Bank (GTBank)", "code": "058", "slug": "guaranty-trust-bank"},
            {"name": "Heritage Bank", "code": "030", "slug": "heritage-bank"},
            {"name": "Jaiz Bank", "code": "301", "slug": "jaiz-bank"},
            {"name": "Keystone Bank", "code": "082", "slug": "keystone-bank"},
            {"name": "Kuda Bank", "code": "50211", "slug": "kuda-bank"},
            {"name": "Moniepoint MFB", "code": "50515", "slug": "moniepoint-mfb"},
            {"name": "OPay Digital Services", "code": "999992", "slug": "opay"},
            {"name": "Palmpay", "code": "999991", "slug": "palmpay"},
            {"name": "Polaris Bank", "code": "076", "slug": "polaris-bank"},
            {"name": "Providus Bank", "code": "101", "slug": "providus-bank"},
            {"name": "Stanbic IBTC Bank", "code": "221", "slug": "stanbic-ibtc-bank"},
            {"name": "Standard Chartered Bank", "code": "068", "slug": "standard-chartered-bank"},
            {"name": "Sterling Bank", "code": "232", "slug": "sterling-bank"},
            {"name": "Union Bank of Nigeria", "code": "032", "slug": "union-bank-of-nigeria"},
            {"name": "United Bank For Africa (UBA)", "code": "033", "slug": "united-bank-for-africa"},
            {"name": "Unity Bank", "code": "215", "slug": "unity-bank"},
            {"name": "Wema Bank", "code": "035", "slug": "wema-bank"},
            {"name": "Zenith Bank", "code": "057", "slug": "zenith-bank"},
        ]

    async def resolve_account(self, account_number: str, bank_code: str) -> Dict[str, Any]:
        """
        Verify NUBAN account number and resolve account holder name per Paystack documentation:
        https://paystack.com/docs/api/miscellaneous/#resolve-account-number
        """
        clean_acc = account_number.strip()
        clean_code = bank_code.strip()
        if self.secret_key and not self.secret_key.startswith("sk_test_placeholder"):
            headers = {
                "Authorization": f"Bearer {self.secret_key}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            }
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    res = await client.get(
                        f"{self.base_url}/bank/resolve",
                        params={"account_number": clean_acc, "bank_code": clean_code},
                        headers=headers,
                    )
                    data = res.json()
                    if res.status_code == 200 and data.get("status"):
                        acc_data = data.get("data", {})
                        return {
                            "account_number": str(acc_data.get("account_number", clean_acc)),
                            "account_name": acc_data.get("account_name", ""),
                            "bank_id": acc_data.get("bank_id"),
                        }
                    else:
                        detail_msg = data.get("message", "Unable to resolve account number with bank")
                        if "limit of 3 live bank resolves exceeded" in detail_msg.lower() and self.secret_key.startswith("sk_test_"):
                            return {
                                "account_number": clean_acc,
                                "account_name": "TEST VERIFIED ACCOUNT (Test Mode Active)",
                                "bank_id": None,
                            }
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=detail_msg,
                        )
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Paystack verification connection failed: {str(e)}",
                )

        # Mock fallback for test environment
        return {
            "account_number": clean_acc,
            "account_name": "VERIFIED STORE MERCHANT",
            "bank_id": 1,
        }

    async def create_subaccount(
        self,
        business_name: str,
        settlement_bank: str,
        account_number: str,
        percentage_charge: float = 2.5,
        description: Optional[str] = None,
        primary_contact_email: Optional[str] = None,
        primary_contact_name: Optional[str] = None,
        primary_contact_phone: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Automatically create Paystack subaccount per official documentation:
        https://paystack.com/docs/api/subaccount/#create
        """
        clean_acc = account_number.strip()
        clean_bank = settlement_bank.strip()
        clean_biz = business_name.strip()

        if self.secret_key and not self.secret_key.startswith("sk_test_placeholder"):
            headers = {
                "Authorization": f"Bearer {self.secret_key}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            }
            payload: Dict[str, Any] = {
                "business_name": clean_biz,
                "settlement_bank": clean_bank,
                "account_number": clean_acc,
                "percentage_charge": percentage_charge,
                "description": description or f"Automated payout subaccount for {clean_biz}",
            }
            if primary_contact_email:
                payload["primary_contact_email"] = primary_contact_email
            if primary_contact_name:
                payload["primary_contact_name"] = primary_contact_name
            if primary_contact_phone:
                payload["primary_contact_phone"] = primary_contact_phone
            if metadata:
                payload["metadata"] = metadata

            try:
                async with httpx.AsyncClient(timeout=15.0) as client:
                    res = await client.post(
                        f"{self.base_url}/subaccount",
                        json=payload,
                        headers=headers,
                    )
                    data = res.json()
                    if res.status_code in (200, 201) and data.get("status"):
                        sub_data = data.get("data", {})
                        return {
                            "subaccount_code": sub_data.get("subaccount_code"),
                            "business_name": sub_data.get("business_name", clean_biz),
                            "settlement_bank": sub_data.get("settlement_bank", clean_bank),
                            "account_number": sub_data.get("account_number", clean_acc),
                            "percentage_charge": percentage_charge,
                            "id": sub_data.get("id"),
                            "is_verified": sub_data.get("is_verified", True),
                        }
                    else:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=data.get("message", "Failed to create Paystack subaccount"),
                        )
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Paystack subaccount creation connection error: {str(e)}",
                )

        # Development / sandbox mock subaccount code
        import hashlib
        mock_hash = hashlib.md5(f"{clean_bank}-{clean_acc}".encode()).hexdigest()[:8].upper()
        mock_code = f"ACCT_{mock_hash}"
        return {
            "subaccount_code": mock_code,
            "business_name": clean_biz,
            "settlement_bank": clean_bank,
            "account_number": clean_acc,
            "percentage_charge": percentage_charge,
        }

