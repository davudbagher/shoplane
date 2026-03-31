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
    """Potential merchant leads from the landing page onboarding flow."""
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    
    # ===== STEP 1: Admin/Owner Information =====
    full_name = Column(String, nullable=False)
    email = Column(String, nullable=True)
    whatsapp = Column(String, nullable=False)
    phone = Column(String, nullable=True)  # Additional phone number
    
    # ===== STEP 2: Company Information =====
    shop_name = Column(String, nullable=True)
    shop_name_az = Column(String, nullable=True)  # Shop name in Azerbaijani
    category = Column(String, nullable=True)
    subdomain_preference = Column(String, nullable=True)  # Preferred subdomain
    instagram_url = Column(String, nullable=True)  # Full Instagram URL
    location_address = Column(String, nullable=True)  # Physical address
    google_maps_link = Column(String, nullable=True)  # Google Maps URL
    business_description = Column(Text, nullable=True)  # About Us / Business info
    
    # ===== STEP 3: Brand Identity =====
    logo_url = Column(String, nullable=True)  # Uploaded logo
    banner_url = Column(String, nullable=True)  # Uploaded banner
    primary_color = Column(String, nullable=True)  # Brand color (hex)
    secondary_color = Column(String, nullable=True)  # Secondary color (hex)
    
    # ===== STEP 4: Payment & Delivery =====
    # Payment Methods
    want_cod = Column(Boolean, default=True)  # Cash on Delivery
    want_millikart = Column(Boolean, default=False)  # MilliKart
    want_birbank = Column(Boolean, default=False)  # BirBank
    want_pasha_pay = Column(Boolean, default=False)  # Pasha Pay
    
    # Business Registration (Optional)
    tax_id = Column(String, nullable=True)  # VÖEN (optional)
    legal_name = Column(String, nullable=True)  # Legal business name
    iban = Column(String, nullable=True)  # Bank account (optional)
    
    # Delivery Options
    delivery_courier = Column(Boolean, default=True)  # Courier delivery
    delivery_pickup = Column(Boolean, default=False)  # Pickup from store
    delivery_cities = Column(String, nullable=True)  # Cities they deliver to (JSON or comma-separated)
    delivery_notes = Column(Text, nullable=True)  # Delivery instructions/pricing
    
    # ===== Additional Screening Info =====
    current_revenue = Column(String, nullable=True)  # Monthly revenue range
    employee_count = Column(String, nullable=True)  # Number of employees
    currently_selling_online = Column(Boolean, default=False)  # Already selling online?
    other_platforms = Column(String, nullable=True)  # Other platforms they use
    
    # ===== Internal Notes =====
    notes = Column(Text, nullable=True)  # Internal notes from admin
    source = Column(String, default="landing_page")  # Lead source
    screening_status = Column(String, default="pending")  # pending, approved, rejected

    status = Column(SQLEnum(LeadStatus), default=LeadStatus.PENDING)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
