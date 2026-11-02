from fastapi import Depends, HTTPException, Header, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from jose import JWTError, jwt
import logging

from app.database import get_db
from app.models.shop import Shop, SubscriptionStatus
from app.models.user import User
from app.config import settings
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


# ===== JWT TOKEN AUTHENTICATION =====

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Decode JWT token and return current user.
    Used by ADMIN endpoints that require authentication.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    
    return user


# ===== SHOP CONTEXT DETECTION (Public Storefront) =====

def get_current_shop(
    request: Request,
    x_shop_subdomain: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Shop:
    """
    Extract shop from X-Shop-Subdomain header.
    
    This is used by PUBLIC storefront endpoints (no auth required).
    
    Examples:
    - X-Shop-Subdomain: 1001xirdavat → returns shop with subdomain="1001xirdavat"
    - Host: 1001xirdavat.1line.az → extracts "1001xirdavat"
    """
    subdomain = None
    
    # Method 1: Check X-Shop-Subdomain header (most reliable for dev)
    if x_shop_subdomain:
        subdomain = x_shop_subdomain.lower().strip()
        logger.debug("Found subdomain in X-Shop-Subdomain header: %s", subdomain)
    
    # Method 2: Extract from Host header (for production)
    if not subdomain:
        host = request.headers.get("host", "")
        if ".1line.az" in host:
            subdomain = host.split(".1line.az")[0].lower().strip()
            logger.debug("Extracted subdomain from Host header: %s", subdomain)
    
    if not subdomain:
        logger.warning("No subdomain found in request headers")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Shop subdomain required. Set X-Shop-Subdomain header or access via subdomain (e.g., shop.1line.az)"
        )
    
    # Query database for shop
    # We include inactive/expired shops here so the storefront can render the "pressure" overlay
    shop = db.query(Shop).filter(func.lower(Shop.subdomain) == subdomain.lower()).first()
    
    if not shop:
        logger.warning("Shop not found in database: %s", subdomain)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Shop '{subdomain}' not found"
        )
    
    # Custom Domain Lock: If it's a Standard plan but accessing via custom domain, redirect
    # or just log it for now. The plan says redirect to .1line.az
    # This logic is best handled early.
    
    # Check for hard "is_active" flag (manual kill by platform admin)
    if not shop.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Shop is suspended by platform administrator"
        )
    
    logger.debug("Found shop: %s (ID: %d)", shop.name, shop.id)
    return shop


# ===== SHOP OWNERSHIP VERIFICATION (Admin) =====

def verify_shop_owner(
    shop_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Shop:
    """
    Verify that current user owns the shop (platform admins may access any shop).
    Used by ADMIN endpoints.
    """
    shop = db.query(Shop).filter(Shop.id == shop_id).first()

    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop not found"
        )

    if shop.owner_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this shop"
        )

    # Kill Switch for Admin: Block access if expired
    if shop.subscription_status == SubscriptionStatus.EXPIRED:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Subscription expired. Please pay to unlock your dashboard."
        )
        
    return shop