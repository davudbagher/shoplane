from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class SubscriptionPlan(str, enum.Enum):
    """Subscription plan types."""
    BASE = "base"      # 49 AZN/month
    PRO = "pro"        # 79 AZN/month


class Shop(Base):
    """Multi-tenant shop model - each shop gets a subdomain."""
    __tablename__ = "shops"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Identity
    name = Column(String, nullable=False)  # e.g., "Cheechak Boutique"
    subdomain = Column(String, unique=True, index=True, nullable=False)  # e.g., "cheechak"
    slug = Column(String, unique=True, index=True, nullable=False)
    
    # Branding
    description = Column(String, nullable=True)
    logo_url = Column(String, nullable=True)
    banner_url = Column(String, nullable=True)
    
    # Contact
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    address = Column(String, nullable=True)
    
    # Subscription
    subscription_plan = Column(SQLEnum(SubscriptionPlan), default=SubscriptionPlan.BASE)
    subscription_active = Column(Boolean, default=True)
    subscription_expires_at = Column(DateTime(timezone=True), nullable=True)
    
    # Custom Domain (Pro feature)
    custom_domain = Column(String, unique=True, nullable=True)  # e.g., "cheechak.az"
    custom_domain_verified = Column(Boolean, default=False)
    
    # Settings
    is_active = Column(Boolean, default=True)
    allow_cod = Column(Boolean, default=True)  # Cash on delivery
    allow_online_payment = Column(Boolean, default=False)  # MilliKart/BirBank/Pasha
    
    # Owner
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    owner = relationship("User", back_populates="shops")
    products = relationship("Product", back_populates="shop", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="shop", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Shop {self.subdomain}.1link.az>"