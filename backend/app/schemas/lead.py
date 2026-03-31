from pydantic import BaseModel, ConfigDict, Field, EmailStr
from typing import Optional
from datetime import datetime
from app.models.lead import LeadStatus


class LeadBase(BaseModel):
    """Base schema with common fields."""
    # Step 1: Admin Info
    full_name: str = Field(..., min_length=2, max_length=100)
    email: Optional[str] = None
    whatsapp: str = Field(..., min_length=7, max_length=20)
    phone: Optional[str] = None
    
    # Step 2: Company Info
    shop_name: Optional[str] = Field(None, max_length=100)
    shop_name_az: Optional[str] = Field(None, max_length=100)
    category: Optional[str] = Field(None, max_length=50)
    subdomain_preference: Optional[str] = Field(None, max_length=30)
    instagram_url: Optional[str] = Field(None, max_length=200)  # Full Instagram URL
    location_address: Optional[str] = Field(None, max_length=200)
    google_maps_link: Optional[str] = Field(None, max_length=500)
    business_description: Optional[str] = Field(None, max_length=1000)
    
    # Step 3: Brand Identity
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    primary_color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    secondary_color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    
    # Step 4: Payment & Delivery
    want_cod: Optional[bool] = True
    want_millikart: Optional[bool] = False
    want_birbank: Optional[bool] = False
    want_pasha_pay: Optional[bool] = False
    tax_id: Optional[str] = None
    legal_name: Optional[str] = None
    iban: Optional[str] = None
    delivery_courier: Optional[bool] = True
    delivery_pickup: Optional[bool] = False
    delivery_cities: Optional[str] = None
    delivery_notes: Optional[str] = None


class LeadCreate(LeadBase):
    """Schema for creating a lead (multi-step onboarding)."""
    pass


class LeadUpdate(BaseModel):
    """Schema for updating a lead."""
    status: Optional[LeadStatus] = None
    screening_status: Optional[str] = None
    notes: Optional[str] = None


class LeadResponse(LeadBase):
    """Schema for lead response (Kitchen view)."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: LeadStatus
    screening_status: str
    source: str
    notes: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]


class LeadStep1Schema(BaseModel):
    """Step 1: Admin/Owner Information."""
    full_name: str = Field(..., min_length=2, max_length=100)
    email: Optional[str] = None
    whatsapp: str = Field(..., min_length=7, max_length=20)
    phone: Optional[str] = None


class LeadStep2Schema(BaseModel):
    """Step 2: Company Information."""
    shop_name: Optional[str] = None
    shop_name_az: Optional[str] = None
    category: Optional[str] = None
    subdomain_preference: Optional[str] = None
    instagram_url: Optional[str] = None  # Full URL
    location_address: Optional[str] = None
    google_maps_link: Optional[str] = None
    business_description: Optional[str] = None
    current_revenue: Optional[str] = None
    employee_count: Optional[str] = None
    currently_selling_online: bool = False
    other_platforms: Optional[str] = None


class LeadStep3Schema(BaseModel):
    """Step 3: Brand Identity."""
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None


class LeadStep4Schema(BaseModel):
    """Step 4: Payment & Delivery Configuration."""
    # Payment Methods
    want_cod: bool = True
    want_millikart: bool = False
    want_birbank: bool = False
    want_pasha_pay: bool = False
    
    # Business Info (Optional)
    tax_id: Optional[str] = None  # VÖEN
    legal_name: Optional[str] = None
    iban: Optional[str] = None
    
    # Delivery
    delivery_courier: bool = True
    delivery_pickup: bool = False
    delivery_cities: Optional[str] = None
    delivery_notes: Optional[str] = None
