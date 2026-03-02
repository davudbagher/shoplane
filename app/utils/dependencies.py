from typing import Optional
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.shop import Shop
from app.utils.security import decode_access_token
from app.config import settings

# HTTP Bearer token scheme
security = HTTPBearer()


def get_subdomain(request: Request) -> Optional[str]:
    """
    Extract subdomain from request host.
    
    Examples:
        - cheechak.1link.az → "cheechak"
        - fitbaku.1link.az → "fitbaku"
        - admin.1link.az → "admin"
        - 1link.az → None
        - localhost:8000 → None
    """
    host = request.headers.get("host", "").split(":")[0]  # Remove port
    
    # Handle localhost development
    if "localhost" in host or "127.0.0.1" in host:
        # Check for subdomain in query params for local testing
        subdomain = request.query_params.get("subdomain")
        return subdomain
    
    # Split host into parts
    parts = host.split(".")
    
    # If we have subdomain.1link.az format
    if len(parts) >= 3 and parts[-2] == settings.BASE_DOMAIN.split(".")[0]:
        subdomain = parts[0]
        
        # Don't treat www or admin as shop subdomains
        if subdomain in ["www", "admin", settings.ADMIN_SUBDOMAIN]:
            return None
        
        return subdomain
    
    return None


def get_current_shop(
    request: Request,
    db: Session = Depends(get_db)
) -> Shop:
    """
    Get the current shop based on subdomain.
    Used in storefront API routes.
    
    Raises:
        HTTPException: If subdomain not found or shop doesn't exist
    """
    subdomain = get_subdomain(request)
    
    if not subdomain:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No shop subdomain detected"
        )
    
    shop = db.query(Shop).filter(
        Shop.subdomain == subdomain,
        Shop.is_active == True
    ).first()
    
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Shop '{subdomain}' not found or inactive"
        )
    
    return shop


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Get current authenticated user from JWT token.
    Used in admin/protected routes.
    
    Raises:
        HTTPException: If token invalid or user not found
    """
    token = credentials.credentials
    
    # Decode token to get user email
    email = decode_access_token(token)
    
    if email is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user from database
    user = db.query(User).filter(User.email == email).first()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    
    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Ensure user is active.
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    return current_user


def verify_shop_owner(
    shop_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Shop:
    """
    Verify that the current user owns the specified shop.
    
    Args:
        shop_id: ID of shop to verify
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Shop object if user is owner
    
    Raises:
        HTTPException: If shop not found or user is not owner
    """
    shop = db.query(Shop).filter(Shop.id == shop_id).first()
    
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop not found"
        )
    
    if shop.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this shop"
        )
    
    return shop
