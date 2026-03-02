from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime
from app.models.shop import SubscriptionPlan
import re


class ShopBase(BaseModel):
    """Base shop schema."""
    name: str = Field(..., min_length=2, max_length=100, description="Shop name (e.g., 'Cheechak Boutique')")
    description: Optional[str] = Field(None, max_length=500)
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = None
    address: Optional[str] = Field(None, max_length=200)


class ShopCreate(ShopBase):
    """Schema for creating a shop."""
    subdomain: str = Field(
        ..., 
        min_length=3, 
        max_length=30,
        description="Subdomain (e.g., 'cheechak' for cheechak.1link.az)",
        pattern="^[a-z0-9-]+$"
    )
    
    @validator('subdomain')
    def validate_subdomain(cls, v):
        """Validate subdomain format."""
        if not re.match(r'^[a-z0-9-]+$', v):
            raise ValueError('Subdomain can only contain lowercase letters, numbers, and hyphens')
        
        # Reserved subdomains
        reserved = ['admin', 'api', 'www', 'app', 'dashboard', 'mail', 'ftp', 'blog']
        if v in reserved:
            raise ValueError(f'Subdomain "{v}" is reserved')
        
        return v


class ShopUpdate(BaseModel):
    """Schema for updating shop details."""
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = None
    address: Optional[str] = Field(None, max_length=200)
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    allow_cod: Optional[bool] = None
    allow_online_payment: Optional[bool] = None


class ShopResponse(ShopBase):
    """Schema for shop response."""
    id: int
    subdomain: str
    slug: str
    logo_url: Optional[str]
    banner_url: Optional[str]
    subscription_plan: SubscriptionPlan
    subscription_active: bool
    custom_domain: Optional[str]
    allow_cod: bool
    allow_online_payment: bool
    is_active: bool
    owner_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class ShopPublicResponse(BaseModel):
    """Public shop info (for storefront, no sensitive data)."""
    id: int
    name: str
    subdomain: str
    description: Optional[str]
    logo_url: Optional[str]
    banner_url: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    address: Optional[str]
    allow_cod: bool
    allow_online_payment: bool
    
    class Config:
        from_attributes = True
