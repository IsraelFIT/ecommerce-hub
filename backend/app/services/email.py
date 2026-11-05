import asyncio
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any, Dict, List, Optional
import httpx

from app.config import settings

logger = logging.getLogger("app.email")


def _get_html_wrapper(title: str, content: str) -> str:
    """Wraps email body in a clean, responsive HTML card layout."""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  <style>
    body {{
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
    }}
    .wrapper {{
      width: 100%;
      background-color: #f8fafc;
      padding: 32px 16px;
    }}
    .container {{
      max-width: 580px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
    }}
    .header {{
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      padding: 28px 32px;
      text-align: center;
    }}
    .header h1 {{
      margin: 0;
      color: #ffffff;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.025em;
    }}
    .body {{
      padding: 32px;
      line-height: 1.6;
    }}
    .btn {{
      display: inline-block;
      padding: 12px 28px;
      background-color: #059669;
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      border-radius: 10px;
      margin: 20px 0;
    }}
    .otp-box {{
      background-color: #f1f5f9;
      border: 2px dashed #cbd5e1;
      border-radius: 12px;
      padding: 16px;
      text-align: center;
      margin: 24px 0;
    }}
    .otp-code {{
      font-size: 32px;
      font-weight: 800;
      letter-spacing: 6px;
      color: #0f172a;
      font-family: monospace;
      margin: 0;
    }}
    .receipt-table {{
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 14px;
    }}
    .receipt-table th {{
      text-align: left;
      padding: 10px;
      border-bottom: 2px solid #e2e8f0;
      color: #64748b;
      font-weight: 600;
    }}
    .receipt-table td {{
      padding: 12px 10px;
      border-bottom: 1px solid #f1f5f9;
    }}
    .total-row td {{
      font-weight: 700;
      font-size: 16px;
      border-top: 2px solid #e2e8f0;
      border-bottom: none;
      color: #0f172a;
    }}
    .footer {{
      background-color: #f8fafc;
      padding: 20px 32px;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
      border-top: 1px solid #f1f5f9;
    }}
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>{title}</h1>
      </div>
      <div class="body">
        {content}
      </div>
      <div class="footer">
        <p style="margin: 0;">Sent by {settings.EMAIL_FROM_NAME}. Powered by Ecommerce Hub.</p>
      </div>
    </div>
  </div>
</body>
</html>"""


async def send_email(
    to_email: str,
    subject: str,
    html_content: str,
    text_content: Optional[str] = None,
) -> bool:
    """
    Sends an email using the configured provider (Resend API, standard SMTP, or console mock).
    Fails safely without raising exceptions to ensure background tasks do not disrupt main API flows.
    """
    provider = (settings.EMAIL_PROVIDER or "auto").lower()
    from_header = f"{settings.EMAIL_FROM_NAME} <{settings.EMAIL_FROM_ADDRESS}>"

    # 1. Resend API (Free tier: 3,000 emails/month, 100/day, no credit card required)
    if (provider == "resend" or (provider == "auto" and settings.RESEND_API_KEY)) and settings.RESEND_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(
                    "https://api.resend.com/emails",
                    headers={
                        "Authorization": f"Bearer {settings.RESEND_API_KEY.strip()}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "from": from_header,
                        "to": [to_email],
                        "subject": subject,
                        "html": html_content,
                        **({"text": text_content} if text_content else {}),
                    },
                )
                if res.status_code in (200, 201):
                    logger.info(f"✅ Email delivered via Resend to [{to_email}] (Subject: '{subject}')")
                    return True
                else:
                    err_msg = res.text
                    try:
                        err_data = res.json()
                        err_msg = err_data.get("message", res.text)
                    except Exception:
                        pass
                    
                    logger.warning(
                        f"⚠️ Resend API returned status {res.status_code} for [{to_email}]: {err_msg}"
                    )
                    # If using Resend sandbox (onboarding@resend.dev) to an unverified recipient in dev, print preview
                    if res.status_code == 403 and "send testing emails to your own email address" in err_msg:
                        logger.info(
                            f"\nℹ️ [Resend Free Tier Testing Notice]:\n"
                            f"With the default test domain 'onboarding@resend.dev', Resend only delivers live emails to your account address.\n"
                            f"To deliver live emails to any customer email address, add and verify your domain at https://resend.com/domains.\n"
                            f"--- [Dev Email Content for {to_email}] ---\n"
                            f"Subject: {subject}\n"
                            f"{text_content or '[HTML content]'}\n"
                            f"-----------------------------------------"
                        )
        except Exception as e:
            logger.error(f"❌ Failed to dispatch email via Resend to [{to_email}]: {e}")

    # 2. Standard SMTP Fallback (Brevo, Gmail, SES, etc.)
    elif (provider == "smtp" or (provider == "auto" and settings.SMTP_HOST)) and settings.SMTP_HOST:
        try:
            def _send_smtp():
                msg = MIMEMultipart("alternative")
                msg["Subject"] = subject
                msg["From"] = from_header
                msg["To"] = to_email

                if text_content:
                    msg.attach(MIMEText(text_content, "plain"))
                msg.attach(MIMEText(html_content, "html"))

                with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
                    if settings.SMTP_USE_TLS:
                        server.starttls()
                    if settings.SMTP_USER and settings.SMTP_PASSWORD:
                        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                    server.send_message(msg)

            await asyncio.to_thread(_send_smtp)
            logger.info(f"✅ Email delivered via SMTP to [{to_email}] (Subject: '{subject}')")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to dispatch email via SMTP to [{to_email}]: {e}")

    # 3. Development / Bootstrap Console Fallback
    logger.info(
        f"\n========== 📧 [DEV EMAIL CONSOLE] ==========\n"
        f"To: {to_email}\n"
        f"From: {from_header}\n"
        f"Subject: {subject}\n"
        f"Body Preview:\n{text_content or '[HTML content rendered]'}\n"
        f"============================================"
    )
    return True


async def send_customer_welcome_email(
    to_email: str,
    customer_name: str,
    store_name: str,
    store_slug: str,
) -> bool:
    """Sends a welcoming onboarding email to a newly registered customer."""
    store_url = f"{settings.FRONTEND_URL}/{store_slug}"
    subject = f"Welcome to {store_name}!"
    body = f"""
      <p>Hello <strong>{customer_name}</strong>,</p>
      <p>Thank you for creating an account with <strong>{store_name}</strong>! We're excited to have you with us.</p>
      <p>You can now browse our exclusive catalog, manage your saved favorites, and track your orders in real time.</p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="{store_url}" class="btn">Explore Storefront</a>
      </div>
      <p style="color: #64748b; font-size: 13px;">If you have any questions or need support, simply reach out to our team at any time.</p>
    """
    html = _get_html_wrapper(title=f"Welcome to {store_name}", content=body)
    text = f"Hello {customer_name},\n\nWelcome to {store_name}! Visit our store at {store_url} to start shopping."
    return await send_email(to_email=to_email, subject=subject, html_content=html, text_content=text)


async def send_tenant_admin_welcome_email(
    to_email: str,
    admin_name: str,
    store_name: str,
    store_slug: str,
) -> bool:
    """Sends an onboarding email to a newly registered store owner/tenant admin."""
    admin_url = f"{settings.FRONTEND_URL}/{store_slug}/admin"
    store_url = f"{settings.FRONTEND_URL}/{store_slug}"
    subject = f"Welcome to Ecommerce Hub - Your store {store_name} is live!"
    body = f"""
      <p>Hello <strong>{admin_name}</strong>,</p>
      <p>Congratulations on launching your digital storefront on <strong>Ecommerce Hub</strong>!</p>
      <p>Your store <strong>{store_name}</strong> has been provisioned and is ready for business:</p>
      <ul style="color: #334155; padding-left: 20px; line-height: 1.8;">
        <li><strong>Storefront URL:</strong> <a href="{store_url}" style="color: #059669;">{store_url}</a></li>
        <li><strong>Admin Portal:</strong> <a href="{admin_url}" style="color: #059669;">{admin_url}</a></li>
      </ul>
      <div style="text-align: center; margin: 28px 0;">
        <a href="{admin_url}" class="btn">Go to Store Admin Dashboard</a>
      </div>
      <p>Next steps to get sales ready:</p>
      <ol style="color: #475569; padding-left: 20px; font-size: 13px; line-height: 1.7;">
        <li>Add your first product in the Admin Catalog.</li>
        <li>Connect your Paystack or Stripe subaccount in Store Settings for split payouts.</li>
        <li>Configure your pickup location or delivery fee.</li>
      </ol>
    """
    html = _get_html_wrapper(title="Store Provisioned Successfully", content=body)
    text = (
        f"Hello {admin_name},\n\n"
        f"Welcome to Ecommerce Hub! Your store '{store_name}' is live.\n"
        f"Storefront: {store_url}\n"
        f"Admin Portal: {admin_url}\n"
    )
    return await send_email(to_email=to_email, subject=subject, html_content=html, text_content=text)


async def send_password_reset_email(
    to_email: str,
    user_name: str,
    otp_code: str,
    expires_in_minutes: int = 10,
) -> bool:
    """Sends a secure 6-digit OTP verification email for password reset."""
    subject = f"{otp_code} is your password reset code"
    body = f"""
      <p>Hello <strong>{user_name}</strong>,</p>
      <p>We received a request to reset the password for your account. Use the verification code below to complete the reset:</p>
      <div class="otp-box">
        <p class="otp-code">{otp_code}</p>
        <p style="margin: 8px 0 0 0; font-size: 12px; color: #64748b;">Valid for {expires_in_minutes} minutes</p>
      </div>
      <p style="color: #64748b; font-size: 13px;">If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
    """
    html = _get_html_wrapper(title="Password Reset Verification", content=body)
    text = f"Hello {user_name},\n\nYour password reset verification code is: {otp_code}\nThis code expires in {expires_in_minutes} minutes."
    return await send_email(to_email=to_email, subject=subject, html_content=html, text_content=text)


async def send_order_confirmation_email(
    to_email: str,
    customer_name: str,
    order_reference: str,
    store_name: str,
    store_slug: str,
    items: List[Dict[str, Any]],
    total_amount: float,
    currency: str = "NGN",
    fulfillment_type: str = "pickup",
    order_id: Optional[str] = None,
) -> bool:
    """Sends a detailed receipt and order confirmation email upon successful payment."""
    subject = f"Order Confirmation #{order_reference} - {store_name}"
    tracking_url = f"{settings.FRONTEND_URL}/{store_slug}/track/{order_id or order_reference}"

    # Build receipt rows
    rows_html = ""
    for item in items:
        name = item.get("product_name") or item.get("name") or "Product Item"
        qty = item.get("quantity", 1)
        price = float(item.get("unit_price") or item.get("price") or 0.0)
        subtotal = qty * price
        rows_html += f"""
          <tr>
            <td>{name}</td>
            <td style="text-align: center;">{qty}</td>
            <td style="text-align: right;">{currency} {subtotal:,.2f}</td>
          </tr>
        """

    body = f"""
      <p>Hello <strong>{customer_name}</strong>,</p>
      <p>Thank you for your purchase! Your order <strong>#{order_reference}</strong> with <strong>{store_name}</strong> has been confirmed and paid successfully.</p>
      
      <table class="receipt-table">
        <thead>
          <tr>
            <th>Item</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows_html}
          <tr class="total-row">
            <td colspan="2">Total Paid ({fulfillment_type.capitalize()})</td>
            <td style="text-align: right;">{currency} {total_amount:,.2f}</td>
          </tr>
        </tbody>
      </table>

      <div style="text-align: center; margin: 24px 0;">
        <a href="{tracking_url}" class="btn">Track Your Order</a>
      </div>
      <p style="color: #64748b; font-size: 13px;">You can view live updates on fulfillment, pickup, and delivery on your order tracking page.</p>
    """
    html = _get_html_wrapper(title=f"Order Confirmed - {store_name}", content=body)
    text = (
        f"Hello {customer_name},\n\n"
        f"Your order #{order_reference} with {store_name} has been confirmed!\n"
        f"Total: {currency} {total_amount:,.2f}\n"
        f"Track here: {tracking_url}\n"
    )
    return await send_email(to_email=to_email, subject=subject, html_content=html, text_content=text)

