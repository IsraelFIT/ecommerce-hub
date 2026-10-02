import uuid
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.tenant import Tenant, BackendType
from app.schemas.tenant import TenantCreate


async def provision_new_tenant(
    session: AsyncSession,
    tenant_in: TenantCreate,
) -> Tenant:
    """
    Provisions a new tenant in the Core Registry.
    Initializes branding defaults, slug reservation, and sets up RLS scope.
    """
    tenant = Tenant(
        name=tenant_in.name,
        slug=tenant_in.slug.lower().strip(),
        custom_domain=tenant_in.custom_domain,
        backend_type=tenant_in.backend_type,
        default_gateway=tenant_in.default_gateway,
        branding_config=tenant_in.branding_config.model_dump(),
        paystack_subaccount_code=tenant_in.paystack_subaccount_code,
        stripe_account_id=tenant_in.stripe_account_id,
        sanity_dataset=tenant_in.sanity_dataset,
        sanity_project_id=tenant_in.sanity_project_id,
    )

    session.add(tenant)
    await session.commit()
    await session.refresh(tenant)
    return tenant
