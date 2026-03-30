from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import Optional
from datetime import datetime
from app.models.shop import SubscriptionPlan, SubscriptionStatus
import re


class ShopBase(BaseModel):
    """Base shop schema."""
    name: str = Field(..., min_length=2, max_length=100, description="Shop name (e.g., 'Cheechak Boutique')")
    description: Optional[str] = Field(None, max_length=500)
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = None
    address: Optional[str] = Field(None, max_length=200)
    whatsapp_number: Optional[str] = None
    primary_color: str = "#4f46e5"


class ShopCreate(ShopBase):
    """Schema for creating a shop."""
    subdomain: str = Field(
        ..., 
        min_length=3, 
        max_length=30,
        description="Subdomain (e.g., 'cheechak' for cheechak.1line.az)",
        pattern="^[a-z0-9-]+$"
    )
    
    @field_validator('subdomain')
    @classmethod
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
    whatsapp_number: Optional[str] = None
    primary_color: Optional[str] = None
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    allow_cod: Optional[bool] = None
    allow_online_payment: Optional[bool] = None
    plan_type: Optional[SubscriptionPlan] = None
    subscription_status: Optional[SubscriptionStatus] = None
    subscription_expires_at: Optional[datetime] = None
    trial_ends_at: Optional[datetime] = None


class ShopResponse(ShopBase):
    """Schema for shop response."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    subdomain: str
    slug: str
    logo_url: Optional[str]
    banner_url: Optional[str]
    plan_type: SubscriptionPlan
    subscription_status: SubscriptionStatus
    trial_ends_at: Optional[datetime]
    subscription_expires_at: Optional[datetime]
    setup_token: Optional[str]
    onboarding_completed: bool
    custom_domain: Optional[str]
    allow_cod: bool
    allow_online_payment: bool
    is_active: bool
    owner_id: int
    created_at: datetime


class ShopPublicResponse(BaseModel):
    """Public shop info (for storefront, no sensitive data)."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    subdomain: str
    description: Optional[str]
    logo_url: Optional[str]
    banner_url: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    address: Optional[str]
    primary_color: str
    subscription_status: SubscriptionStatus
    allow_cod: bool
    allow_online_payment: bool
