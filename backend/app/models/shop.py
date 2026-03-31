from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class SubscriptionPlan(str, enum.Enum):
    """Subscription plan types."""
    STANDARD = "standard"  # 29 AZN/month
    PRO = "pro"           # 39 AZN/month


class SubscriptionStatus(str, enum.Enum):
    """Status of the shop subscription."""
    TRIAL = "trial"          # 14-day initial period
    ACTIVE = "active"        # Paid and current
    PAST_DUE = "past_due"    # Grace period or unpaid
    EXPIRED = "expired"      # Handled by "Kill Switch"


class Shop(Base):
    """Multi-tenant shop model - each shop gets a subdomain."""
    __tablename__ = "shops"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Identity
    name = Column(String, nullable=False)  # e.g., "Cheechak Boutique"
    subdomain = Column(String, unique=True, index=True, nullable=False)  # e.g., "cheechak"
    slug = Column(String, unique=True, index=True, nullable=False)
    
    # Branding
    description = Column(Text, nullable=True)
    logo_url = Column(String, nullable=True)
    banner_url = Column(String, nullable=True)
    primary_color = Column(String, default="#4f46e5")  # Merchant's brand color
    
    # Contact
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    address = Column(String, nullable=True)
    whatsapp_number = Column(String, nullable=True) # For direct "Kitchen" communication
    
    # Onboarding
    setup_token = Column(String, unique=True, index=True, nullable=True) # Single-use setup link
    onboarding_completed = Column(Boolean, default=False)
    
    # Subscription & Billing
    plan_type = Column(SQLEnum(SubscriptionPlan), default=SubscriptionPlan.STANDARD)
    subscription_status = Column(SQLEnum(SubscriptionStatus), default=SubscriptionStatus.TRIAL)
    trial_ends_at = Column(DateTime(timezone=True), nullable=True)
    subscription_expires_at = Column(DateTime(timezone=True), nullable=True)
    
    # Custom Domain (Pro feature)
    custom_domain = Column(String, unique=True, nullable=True)  # e.g., "cheechak.az"
    custom_domain_verified = Column(Boolean, default=False)
    
    # Settings
    is_active = Column(Boolean, default=True)
    allow_cod = Column(Boolean, default=True)  # Cash on delivery
    allow_online_payment = Column(Boolean, default=False)  # MilliKart/BirBank/Pasha

    # MilliKart Payment Integration (Shop Owner's Own Account)
    # Shop owners connect their own MilliKart account to receive payments directly
    millikart_enabled = Column(Boolean, default=False)  # Whether online payment via MilliKart is enabled
    millikart_iban = Column(String, nullable=True)  # Shop owner's IBAN for receiving payments
    millikart_account_info = Column(Text, nullable=True)  # MilliKart account details (JSON or text)
    millikart_payment_link = Column(String, nullable=True)  # Direct payment link for checkout

    # Credentials & Setup (Stored for Kitchen admin)
    setup_token = Column(String, unique=True, index=True, nullable=True)  # Token for password setup
    temporary_password = Column(String, nullable=True)  # Initial temp password (stored for admin reference)
    credentials_sent = Column(Boolean, default=False)  # Track if credentials were sent to merchant
    credentials_sent_at = Column(DateTime(timezone=True), nullable=True)  # When credentials were sent
    seo_setup_completed = Column(Boolean, default=False)  # Track if SEO was configured

    # Owner
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    owner = relationship("User", back_populates="shops")
    products = relationship("Product", back_populates="shop", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="shop", cascade="all, delete-orphan")
    coupons = relationship("Coupon", back_populates="shop", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Shop {self.subdomain}.1line.az>"