from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.shop import Shop, SubscriptionPlan
from app.schemas.shop import ShopCreate, ShopUpdate, ShopResponse, MilliKartSettings
from app.utils.dependencies import get_current_user, verify_shop_owner

router = APIRouter()


@router.post("", response_model=ShopResponse, status_code=201)
def create_shop(
    shop_data: ShopCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new shop for the authenticated user."""
    
    # Check if subdomain is already taken
    existing_shop = db.query(Shop).filter(Shop.subdomain == shop_data.subdomain).first()
    if existing_shop:
        raise HTTPException(
            status_code=400,
            detail=f"Subdomain '{shop_data.subdomain}' is already taken"
        )
    
    # Create shop with auto-generated slug (same as subdomain for now)
    new_shop = Shop(
        name=shop_data.name,
        subdomain=shop_data.subdomain,
        slug=shop_data.subdomain,  # ← ADD THIS LINE! Auto-generate slug from subdomain
        description=shop_data.description,
        owner_id=current_user.id,
        subscription_plan=SubscriptionPlan.BASE,  # Default to BASE plan (free)
        subscription_active=True,
        is_active=True,
        allow_cod=True,  # Enable cash on delivery by default (Azerbaijan standard)
        allow_online_payment=False,  # Disabled until payment gateway configured
    )
    
    db.add(new_shop)
    db.commit()
    db.refresh(new_shop)
    
    return new_shop


@router.get("", response_model=List[ShopResponse])
def get_my_shops(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all shops owned by current user.
    
    Most users will have 1 shop, but we allow multiple
    (e.g., someone running both a clothing and electronics store).
    """
    shops = db.query(Shop).filter(Shop.owner_id == current_user.id).all()
    return shops


@router.get("/{shop_id}", response_model=ShopResponse)
def get_shop_details(
    shop_id: int,
    shop: Shop = Depends(verify_shop_owner),
    db: Session = Depends(get_db)
):
    """
    Get detailed shop information.
    
    Used in admin dashboard to display shop settings.
    """
    return shop


@router.put("/{shop_id}", response_model=ShopResponse)
def update_shop(
    shop_id: int,
    shop_data: ShopUpdate,
    shop: Shop = Depends(verify_shop_owner),
    db: Session = Depends(get_db)
):
    """
    Update shop details (name, description, contact info, payment settings).
    
    IMPORTANT: Subdomain cannot be changed after creation (to prevent URL breaking).
    Users can update:
    - Basic info (name, description, contact)
    - Branding (logo, banner)
    - Payment settings (allow_cod, allow_online_payment)
    """
    # Explicit whitelist — subscription/ownership fields must not be user-settable
    UPDATABLE_FIELDS = {
        'name', 'description', 'phone', 'email', 'address', 'whatsapp_number',
        'primary_color', 'logo_url', 'banner_url', 'allow_cod', 'allow_online_payment',
        'millikart_enabled', 'millikart_iban', 'millikart_payment_link',
        'seo_setup_completed', 'onboarding_completed', 'custom_domain',
    }
    for field, value in shop_data.model_dump(exclude_unset=True).items():
        if field in UPDATABLE_FIELDS:
            setattr(shop, field, value)
    
    db.commit()
    db.refresh(shop)
    
    return shop


@router.post("/{shop_id}/upgrade", response_model=ShopResponse)
def upgrade_subscription(
    shop_id: int,
    shop: Shop = Depends(verify_shop_owner),
    db: Session = Depends(get_db)
):
    """
    Upgrade shop from BASE (49 AZN) to PRO (79 AZN) plan.
    
    PRO features (for future implementation):
    - Custom domain support
    - Advanced analytics
    - Priority support
    - Remove platform branding
    """
    if shop.subscription_plan == SubscriptionPlan.PRO:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Shop is already on PRO plan"
        )
    
    shop.subscription_plan = SubscriptionPlan.PRO
    db.commit()
    db.refresh(shop)
    
    return shop


@router.delete("/{shop_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_shop(
    shop_id: int,
    shop: Shop = Depends(verify_shop_owner),
    db: Session = Depends(get_db)
):
    """
    Deactivate shop (soft delete).

    Shop becomes inaccessible to customers but data is preserved.
    Owner can reactivate by contacting support.
    """
    shop.is_active = False
    db.commit()

    return None


@router.get("/{shop_id}/payment-settings", response_model=MilliKartSettings)
def get_payment_settings(
    shop_id: int,
    shop: Shop = Depends(verify_shop_owner),
    db: Session = Depends(get_db)
):
    """
    Get payment gateway settings for the shop.

    Returns MilliKart configuration (IBAN, payment link, etc.)
    Shop owners use this to configure their own payment gateway account.
    """
    return {
        "millikart_enabled": shop.millikart_enabled,
        "millikart_iban": shop.millikart_iban,
        "millikart_account_info": shop.millikart_account_info,
        "millikart_payment_link": shop.millikart_payment_link
    }


@router.put("/{shop_id}/payment-settings", response_model=ShopResponse)
def update_payment_settings(
    shop_id: int,
    payment_settings: MilliKartSettings,
    shop: Shop = Depends(verify_shop_owner),
    db: Session = Depends(get_db)
):
    """
    Update payment gateway settings.

    Shop owners connect their own MilliKart account by providing:
    - IBAN (for receiving payments directly to their bank account)
    - Payment link (generated from MilliKart dashboard for checkout integration)

    This is a ONE-LINK integration:
    1. Shop owner registers at MilliKart merchant portal
    2. Gets their payment link and IBAN
    3. Pastes them here
    4. Customers pay directly to shop owner's account at checkout

    Platform (1line.az) does NOT handle any money - just charges monthly subscription.
    """
    # Update MilliKart settings
    shop.millikart_enabled = payment_settings.millikart_enabled
    shop.millikart_iban = payment_settings.millikart_iban
    shop.millikart_account_info = payment_settings.millikart_account_info
    shop.millikart_payment_link = payment_settings.millikart_payment_link

    # Auto-enable online payment if MilliKart is configured and enabled
    if payment_settings.millikart_enabled and payment_settings.millikart_payment_link:
        shop.allow_online_payment = True
    elif not payment_settings.millikart_enabled:
        shop.allow_online_payment = False

    db.commit()
    db.refresh(shop)

    return shop
