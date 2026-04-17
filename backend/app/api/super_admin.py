from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta, timezone
import uuid
import secrets

from app.database import get_db
from app.models.user import User
from app.models.shop import Shop, SubscriptionPlan, SubscriptionStatus
from app.models.lead import Lead, LeadStatus
from app.schemas.shop import ShopResponse, ShopCreate, ShopUpdate
from app.schemas.user import UserResponse, UserCreate
from app.schemas.lead import LeadResponse, LeadCreate
from app.utils.security import get_password_hash
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/super-admin", tags=["Platform Admin - Kitchen"])


def verify_super_admin(current_user: User = Depends(get_current_user)):
    """Security dependency to ensure only the platform owner can access these."""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Only platform administrators can access the Kitchen."
        )
    return current_user


@router.post("/leads", response_model=LeadResponse, status_code=status.HTTP_201_CREATED)
def create_lead(
    lead_data: LeadCreate,
    db: Session = Depends(get_db)
):
    """Public Lead Intake from landing page."""
    new_lead = Lead(**lead_data.model_dump())
    db.add(new_lead)
    db.commit()
    db.refresh(new_lead)
    return new_lead


@router.get("/leads", response_model=List[LeadResponse])
def list_leads(
    db: Session = Depends(get_db),
    admin: User = Depends(verify_super_admin)
):
    """List all PENDING leads for the Kitchen dashboard."""
    return db.query(Lead).filter(Lead.status == LeadStatus.PENDING).order_by(Lead.created_at.desc()).all()


@router.delete("/leads/{lead_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(verify_super_admin)
):
    """
    Delete/cancel a pending lead.
    
    Use this when:
    - Lead was spam/fake
    - Lead changed their mind
    - Lead was created by mistake
    """
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    if lead.status != LeadStatus.PENDING:
        raise HTTPException(
            status_code=400,
            detail="Can only delete pending leads. This lead has already been processed."
        )
    
    db.delete(lead)
    db.commit()
    
    return None


@router.post("/onboard", response_model=ShopResponse)
def onboard_merchant(
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    admin: User = Depends(verify_super_admin)
):
    """
    White-Glove Onboarding:
    1. Create a new User (Owner) with a random password.
    2. Create a new Shop for that user.
    3. Generate a setup_token for the merchant to set their own password later.
    """
    email = payload.get("email")
    full_name = payload.get("full_name")
    shop_name = payload.get("shop_name")
    subdomain = payload.get("subdomain").lower().strip()
    plan_type = payload.get("plan_type", "standard")

    # 1. Validate subdomain
    existing_shop = db.query(Shop).filter(Shop.subdomain == subdomain).first()
    if existing_shop:
        raise HTTPException(status_code=400, detail=f"Subdomain '{subdomain}' already exists")

    # 2. Check if user exists, or create new
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Create user with a dummy password - they will reset via token
        temp_password = secrets.token_urlsafe(16)
        user = User(
            email=email,
            full_name=full_name,
            hashed_password=get_password_hash(temp_password),
            is_active=True
        )
        db.add(user)
        db.flush() # Get user.id

    # 3. Create Shop
    setup_token = secrets.token_urlsafe(32)
    # Default trial is 14 days
    trial_end = datetime.now(timezone.utc) + timedelta(days=14)

    new_shop = Shop(
        name=shop_name,
        subdomain=subdomain,
        slug=subdomain,
        owner_id=user.id,
        plan_type=SubscriptionPlan.PRO if plan_type == "pro" else SubscriptionPlan.STANDARD,
        subscription_status=SubscriptionStatus.TRIAL,
        trial_ends_at=trial_end,
        subscription_expires_at=trial_end, # Start with trial period
        setup_token=setup_token,
        onboarding_completed=False,
        is_active=True
    )

    db.add(new_shop)
    db.commit()
    db.refresh(new_shop)

    return new_shop


@router.post("/leads/{lead_id}/create-shop", response_model=dict)
def create_shop_from_lead(
    lead_id: int,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    admin: User = Depends(verify_super_admin)
):
    """
    Create a shop from an existing lead with all their onboarding data.
    
    This automatically configures:
    - Shop details (name, subdomain, contact info)
    - Payment methods (COD, MilliKart, etc.)
    - Delivery options (courier, pickup, cities)
    - Brand identity (logo, colors)
    - Business info (tax ID, IBAN if provided)
    
    Returns:
    - Shop details
    - Login credentials (email, temporary password)
    - Setup token for password reset
    """
    # Get lead
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Check if shop already exists
    subdomain = payload.get("subdomain", lead.shop_name.lower().replace(' ', '').replace('ı', 'i').replace('ə', 'e').replace('ö', 'o').replace('ü', 'u').replace('ğ', 'g').replace('ç', 'c').replace('ş', 's') + str(lead.id))
    subdomain = subdomain[:30].strip('-')
    
    existing_shop = db.query(Shop).filter(Shop.subdomain == subdomain).first()
    if existing_shop:
        raise HTTPException(status_code=400, detail=f"Subdomain '{subdomain}' already exists")
    
    # Generate temporary password
    temp_password = secrets.token_urlsafe(12)
    
    # Check if user already exists with this email
    user = db.query(User).filter(User.email == (lead.email or f"{subdomain}@1line.az")).first()
    
    if not user:
        # Create new user (shop owner)
        user = User(
            email=lead.email or f"{subdomain}@1line.az",
            full_name=lead.full_name,
            phone=lead.phone or lead.whatsapp,
            hashed_password=get_password_hash(temp_password),
            is_active=True,
            is_superuser=False
        )
        db.add(user)
        db.flush()
    else:
        # User exists - update their info if needed
        user.full_name = lead.full_name
        if lead.phone:
            user.phone = lead.phone
        # Don't change password for existing users
        temp_password = None  # No temp password needed
    
    # Generate setup token
    setup_token = secrets.token_urlsafe(32)
    trial_end = datetime.now(timezone.utc) + timedelta(days=14)
    
    # Create shop with lead data
    shop = Shop(
        # Basic Info
        name=lead.shop_name or "My Shop",
        subdomain=subdomain,
        slug=subdomain,
        description=lead.business_description,
        logo_url=lead.logo_url,
        banner_url=lead.banner_url,
        primary_color=lead.primary_color or "#0ea5e9",
        
        # Contact Info
        phone=lead.phone or lead.whatsapp,
        email=lead.email,
        address=lead.location_address,
        whatsapp_number=lead.whatsapp,
        
        # Subscription
        owner_id=user.id,
        plan_type=SubscriptionPlan.PRO,  # Start with PRO trial
        subscription_status=SubscriptionStatus.TRIAL,
        trial_ends_at=trial_end,
        subscription_expires_at=trial_end,
        
        # Setup
        setup_token=setup_token,
        onboarding_completed=True,  # Pre-configured from lead data
        is_active=True,
        
        # Payment Methods (from lead preferences)
        allow_cod=lead.want_cod if hasattr(lead, 'want_cod') else True,
        allow_online_payment=(lead.want_millikart or lead.want_birbank or lead.want_pasha_pay) if hasattr(lead, 'want_millikart') else False,
        
        # MilliKart (if they want it and provided IBAN)
        millikart_enabled=lead.want_millikart if hasattr(lead, 'want_millikart') else False,
        millikart_iban=lead.iban if hasattr(lead, 'iban') else None,
    )
    
    db.add(shop)
    db.flush()
    
    # Update lead status
    lead.status = LeadStatus.ONBOARDED
    lead.screening_status = "approved"
    lead.notes = f"Shop created by {admin.email} on {datetime.now().strftime('%Y-%m-%d %H:%M')}"
    
    # Store temporary password in shop for admin reference
    shop.temporary_password = temp_password
    
    db.commit()
    db.refresh(shop)
    
    # Return shop details with credentials
    return {
        "shop": {
            "id": shop.id,
            "name": shop.name,
            "subdomain": shop.subdomain,
            "url": f"https://{shop.subdomain}.1line.az",
            "admin_url": f"http://localhost:5173/admin/dashboard"
        },
        "owner": {
            "name": user.full_name,
            "email": user.email,
            "phone": user.phone
        },
        "credentials": {
            "email": user.email,
            "temporary_password": temp_password or "Use your existing password",
            "setup_token": setup_token,
            "setup_url": f"http://localhost:5173/setup?token={setup_token}"
        },
        "whatsapp_message": f"""Salam {lead.full_name}! 🎉

Təbriklər! Onlayn mağazanız hazırdır:

🏪 Mağaza Adı: {shop.name}
🌐 Sayt: https://{shop.subdomain}.1line.az
📧 Email: {user.email}
{f"🔑 Şifrə: {temp_password}" if temp_password else "🔑 Şifrə: Qeydiyyat zamanı təyin etdiyiniz şifrə"}

İdarəetmə paneli: http://localhost:5173/admin/dashboard

Suallarınız olarsa, bizə müraciət edin! 🚀""",
        "message": f"Shop created successfully! Credentials stored. You can send them via WhatsApp or copy from Kitchen."
    }


@router.put("/shops/{shop_id}/edit", response_model=ShopResponse)
def edit_shop(
    shop_id: int,
    shop_data: ShopUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(verify_super_admin)
):
    """
    Edit shop details (Kitchen admin only).
    
    Allows admin to tailor shop settings based on customer needs:
    - Update contact info
    - Configure payment methods
    - Update branding (logo, colors)
    - Mark SEO as completed
    - etc.
    """
    shop = db.query(Shop).filter(Shop.id == shop_id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    # Explicit whitelist — even super-admin edits are scoped to these fields
    # to prevent accidental writes to internal fields (owner_id, id, etc.)
    ADMIN_UPDATABLE_FIELDS = {
        'name', 'description', 'phone', 'email', 'address', 'whatsapp_number',
        'logo_url', 'banner_url', 'primary_color', 'allow_cod', 'allow_online_payment',
        'millikart_enabled', 'millikart_iban', 'millikart_payment_link',
        'seo_setup_completed', 'onboarding_completed', 'custom_domain',
    }
    for field, value in shop_data.model_dump(exclude_unset=True).items():
        if field in ADMIN_UPDATABLE_FIELDS:
            setattr(shop, field, value)
    
    db.commit()
    db.refresh(shop)
    return shop


@router.get("/shops/{shop_id}/credentials")
def get_shop_credentials(
    shop_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(verify_super_admin)
):
    """
    Get stored credentials for a shop (Kitchen admin only).
    
    Returns:
    - Owner email
    - Temporary password (if still stored)
    - Setup token
    - Whether credentials were sent
    """
    shop = db.query(Shop).filter(Shop.id == shop_id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    # Get owner info
    owner = db.query(User).filter(User.id == shop.owner_id).first()
    
    return {
        "shop_id": shop.id,
        "shop_name": shop.name,
        "subdomain": shop.subdomain,
        "owner": {
            "name": owner.full_name,
            "email": owner.email,
            "phone": owner.phone
        },
        "credentials": {
            "email": owner.email,
            "temporary_password": shop.temporary_password,
            "setup_token": shop.setup_token,
            "setup_url": f"http://localhost:5173/setup?token={shop.setup_token}"
        },
        "tracking": {
            "credentials_sent": shop.credentials_sent,
            "credentials_sent_at": shop.credentials_sent_at.isoformat() if shop.credentials_sent_at else None,
            "seo_setup_completed": shop.seo_setup_completed
        },
        "whatsapp_message": f"""Salam {owner.full_name}! 🎉

Təbriklər! Onlayn mağazanız hazırdır:

🏪 Mağaza Adı: {shop.name}
🌐 Sayt: https://{shop.subdomain}.1line.az
📧 Email: {owner.email}
🔑 Şifrə: {shop.temporary_password or 'Setup token ilə təyin edin'}

İdarəetmə paneli: http://localhost:5173/admin/dashboard

Suallarınız olarsa, bizə müraciət edin! 🚀"""
    }


@router.post("/shops/{shop_id}/mark-credentials-sent")
def mark_credentials_sent(
    shop_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(verify_super_admin)
):
    """Mark that credentials were sent to the merchant."""
    shop = db.query(Shop).filter(Shop.id == shop_id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    shop.credentials_sent = True
    shop.credentials_sent_at = datetime.now(timezone.utc)
    
    db.commit()
    
    return {"message": "Credentials sent status updated", "sent_at": shop.credentials_sent_at.isoformat()}


@router.post("/shops/{shop_id}/renew", response_model=ShopResponse)
def renew_subscription(
    shop_id: int,
    days: int = Body(30, embed=True),
    db: Session = Depends(get_db),
    admin: User = Depends(verify_super_admin)
):
    """
    Manual Renewal Engine:
    Add X days (default 30) to a shop's expiry date upon manual payment.
    """
    shop = db.query(Shop).filter(Shop.id == shop_id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    now = datetime.now(timezone.utc)
    
    # If currently active, extend from current expiry. If expired, extend from today.
    base_date = shop.subscription_expires_at if shop.subscription_expires_at and shop.subscription_expires_at > now else now
    
    shop.subscription_expires_at = base_date + timedelta(days=days)
    shop.subscription_status = SubscriptionStatus.ACTIVE
    shop.is_active = True # Ensure it's active
    
    db.commit()
    db.refresh(shop)
    return shop


@router.get("/shops", response_model=List[ShopResponse])
def list_all_shops(
    db: Session = Depends(get_db),
    admin: User = Depends(verify_super_admin)
):
    """List all shops on the platform for management."""
    return db.query(Shop).all()


@router.post("/shops/{shop_id}/toggle-status", response_model=ShopResponse)
def toggle_shop_status(
    shop_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(verify_super_admin)
):
    """Hard kill-switch for platform admin."""
    shop = db.query(Shop).filter(Shop.id == shop_id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
        
    shop.is_active = not shop.is_active
    db.commit()
    db.refresh(shop)
    return shop


@router.get("/stats")
def get_platform_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(verify_super_admin)
):
    """Get high-level stats for the Super-Admin dashboard."""
    total_shops = db.query(Shop).count()
    active_shops = db.query(Shop).filter(Shop.subscription_status == SubscriptionStatus.ACTIVE).count()
    trial_shops = db.query(Shop).filter(Shop.subscription_status == SubscriptionStatus.TRIAL).count()
    expired_shops = db.query(Shop).filter(Shop.subscription_status == SubscriptionStatus.EXPIRED).count()
    new_leads = db.query(Lead).filter(Lead.status == LeadStatus.PENDING).count()
    
    return {
        "total_shops": total_shops,
        "active_shops": active_shops,
        "trial_shops": trial_shops,
        "expired_shops": expired_shops,
        "new_leads": new_leads
    }
