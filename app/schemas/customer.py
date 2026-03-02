from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime


class CustomerBase(BaseModel):
    """Base customer schema."""
    full_name: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., min_length=9, max_length=20, description="Phone number (Azerbaijan format)")
    email: Optional[EmailStr] = None
    
    # Shipping Address
    city: str = Field(..., description="City (e.g., Bakı, Gəncə, Sumqayıt)")
    district: Optional[str] = Field(None, description="District/rayon")
    address_line: str = Field(..., min_length=5, max_length=200, description="Full street address")
    postal_code: Optional[str] = None
    
    # Delivery Notes
    delivery_notes: Optional[str] = Field(None, max_length=200, description="e.g., '3rd floor, apartment 12'")


class CustomerCreate(CustomerBase):
    """Schema for creating customer."""
    pass


class CustomerResponse(CustomerBase):
    """Schema for customer response."""
    id: int
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True
