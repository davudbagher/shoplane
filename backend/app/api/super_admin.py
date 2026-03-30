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
from app.schemas.shop import ShopResponse, ShopCreate
from app.schemas.user import UserResponse, UserCreate
from app.schemas.lead import LeadResponse, LeadCreate
from app.utils.security import get_password_hash
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/super-admin", tags=["Platform Admin - Kitchen"])


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
    """List all leads for the Kitchen dashboard."""
    return db.query(Lead).order_by(Lead.created_at.desc()).all()


def verify_super_admin(current_user: User = Depends(get_current_user)):
    """Security dependency to ensure only the platform owner can access these."""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Only platform administrators can access the Kitchen."
        )
    return current_user


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
    expired_shops = db.query(Shop).filter(SubscriptionStatus.EXPIRED == Shop.subscription_status).count()
    new_leads = db.query(Lead).filter(Lead.status == LeadStatus.PENDING).count()
    
    return {
        "total_shops": total_shops,
        "active_shops": active_shops,
        "trial_shops": trial_shops,
        "expired_shops": expired_shops,
        "new_leads": new_leads
    }
