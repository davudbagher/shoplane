from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from datetime import datetime
from app.models.lead import LeadStatus


class LeadBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: Optional[str] = None
    whatsapp: str = Field(..., min_length=7, max_length=20)
    shop_name: Optional[str] = Field(None, max_length=100)
    category: Optional[str] = Field(None, max_length=50)
    notes: Optional[str] = Field(None, max_length=500)


class LeadCreate(LeadBase):
    """Schema for creating a lead (public intake)."""
    pass


class LeadUpdate(BaseModel):
    """Schema for updating a lead status or notes."""
    status: Optional[LeadStatus] = None
    notes: Optional[str] = None


class LeadResponse(LeadBase):
    """Schema for lead response (Kitchen view)."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: LeadStatus
    created_at: datetime
    updated_at: Optional[datetime]
