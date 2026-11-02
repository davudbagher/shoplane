from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import Optional
from datetime import datetime
from app.models.shop import SubscriptionPlan, SubscriptionStatus
import re


class ShopBase(BaseModel):
    """Base shop schema."""
    name: str = Field(..., min_length=2, max_length=100, description="Shop name (e.g., 'Cheechak Boutique')")
    description: Optional[str] = Field(None, max_length=2000)  # Increased from 500 to 2000 for SEO descriptions
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


class MilliKartSettings(BaseModel):
    """Schema for MilliKart payment settings."""
    millikart_enabled: bool = Field(default=False, description="Enable MilliKart payments")
    millikart_iban: Optional[str] = Field(None, max_length=34, description="Your IBAN for receiving payments (AZ format: AZ2 + 20 digits)")
    millikart_account_info: Optional[str] = Field(None, description="MilliKart account details")
    millikart_payment_link: Optional[str] = Field(None, max_length=500, description="Direct payment link for checkout")

    @field_validator('millikart_iban')
    @classmethod
    def validate_iban(cls, v):
        """Validate Azerbaijan IBAN format."""
        if v is None:
            return v
        # Azerbaijan IBAN: AZ + 2 digits + 20 alphanumeric (usually AZ2 + 20 digits)
        if not re.match(r'^AZ\d{2}[A-Z0-9]{20}$', v.upper()):
            raise ValueError('Invalid IBAN format. Azerbaijan IBAN should be: AZ2 + 20 digits (e.g., AZ20010000000000000000000000)')
        return v.upper()

    @field_validator('millikart_payment_link')
    @classmethod
    def validate_payment_link(cls, v):
        """Validate payment link is a proper URL."""
        if v is None:
            return v
        if not v.startswith('https://'):
            raise ValueError('Payment link must start with https://')
        return v


class ShopResponse(ShopBase):
    """Schema for shop response."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    subdomain: str
    slug: str
    logo_url: Optional[str]
    banner_url: Optional[str]
    plan_type: Optional[SubscriptionPlan] = None
    subscription_status: Optional[SubscriptionStatus] = None
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
    # MilliKart settings
    millikart_enabled: bool
    millikart_iban: Optional[str]
    millikart_payment_link: Optional[str]
    # Credentials tracking
    credentials_sent: bool
    credentials_sent_at: Optional[datetime]
    seo_setup_completed: bool


class ShopUpdate(BaseModel):
    """Schema for updating shop details."""
    name: Optional[str] = None
    description: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    whatsapp_number: Optional[str] = None
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    primary_color: Optional[str] = None
    custom_domain: Optional[str] = None
    allow_cod: Optional[bool] = None
    allow_online_payment: Optional[bool] = None
    millikart_enabled: Optional[bool] = None
    millikart_iban: Optional[str] = None
    millikart_payment_link: Optional[str] = None
    seo_setup_completed: Optional[bool] = None
    onboarding_completed: Optional[bool] = None


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
    subscription_status: Optional[SubscriptionStatus] = None  # Made optional for backwards compatibility
    allow_cod: bool
    allow_online_payment: bool
    # Public payment info
    millikart_enabled: bool
    # Social & branding extras
    instagram_url: Optional[str] = None
