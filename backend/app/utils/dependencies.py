from fastapi import Depends, HTTPException, Header, Request, status
from sqlalchemy.orm import Session
from typing import Optional
from jose import JWTError, jwt

from app.database import get_db
from app.models.shop import Shop
from app.models.user import User
from app.config import settings


# ===== JWT TOKEN AUTHENTICATION (Moved here to avoid circular import) =====

def get_current_user(
    token: str = Depends(lambda: None),  # Will be set by OAuth2PasswordBearer in calling code
    db: Session = Depends(get_db)
) -> User:
    """
    Decode JWT token and return current user.
    Used by ADMIN endpoints that require authentication.
    """
    from fastapi.security import OAuth2PasswordBearer
    from fastapi import Depends as FastAPIDepends
    
    oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")
    token = FastAPIDepends(oauth2_scheme)
    
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
    - Host: 1001xirdavat.1link.az → extracts "1001xirdavat"
    """
    subdomain = None
    
    # Method 1: Check X-Shop-Subdomain header (most reliable for dev)
    if x_shop_subdomain:
        subdomain = x_shop_subdomain.lower().strip()
        print(f"✅ Found subdomain in X-Shop-Subdomain header: {subdomain}")
    
    # Method 2: Extract from Host header (for production)
    if not subdomain:
        host = request.headers.get("host", "")
        if ".1link.az" in host:
            subdomain = host.split(".1link.az")[0].lower().strip()
            print(f"✅ Extracted subdomain from Host header: {subdomain}")
    
    if not subdomain:
        print(f"❌ No subdomain found. Headers: {dict(request.headers)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Shop subdomain required. Set X-Shop-Subdomain header or access via subdomain (e.g., shop.1link.az)"
        )
    
    # Query database for shop
    shop = db.query(Shop).filter(
        Shop.subdomain == subdomain,
        Shop.is_active == True
    ).first()
    
    if not shop:
        print(f"❌ Shop not found in database: {subdomain}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Shop '{subdomain}' not found or inactive"
        )
    
    print(f"✅ Found shop: {shop.name} (ID: {shop.id})")
    return shop


# ===== SHOP OWNERSHIP VERIFICATION (Admin) =====

def verify_shop_owner(
    shop_id: int,
    db: Session = Depends(get_db)
) -> Shop:
    """
    Verify that current user owns the shop.
    Used by ADMIN endpoints.
    
    NOTE: Requires get_current_user to be called first in the endpoint!
    """
    # This will be used in endpoints like:
    # def create_product(shop_id: int, current_user: User = Depends(get_current_user), ...)
    # So we don't need to import get_current_user here
    
    # For now, just return the shop (ownership check happens in endpoint)
    shop = db.query(Shop).filter(Shop.id == shop_id).first()
    
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop not found"
        )
    
    return shop