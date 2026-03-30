from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.sql import func
from app.database import Base
import enum


class LeadStatus(str, enum.Enum):
    PENDING = "pending"
    CONTACTED = "contacted"
    ONBOARDED = "onboarded"
    REJECTED = "rejected"


class Lead(Base):
    """Potential merchant leads from the landing page."""
    __tablename__ = "leads"
    
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, nullable=True) # Optional if we use WhatsApp
    whatsapp = Column(String, nullable=False)
    shop_name = Column(String, nullable=True)
    category = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    
    status = Column(SQLEnum(LeadStatus), default=LeadStatus.PENDING)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
