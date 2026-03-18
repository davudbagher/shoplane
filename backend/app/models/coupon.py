from sqlalchemy import Column, Integer, String, Numeric, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Coupon(Base):
    """Coupon model for discounts mapping shop inventories."""
    __tablename__ = "coupons"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True, nullable=False)
    
    discount_type = Column(String, nullable=False)  # 'percentage' or 'fixed_amount'
    discount_value = Column(Numeric(10, 2), nullable=False)
    
    scope = Column(String, default="all_products")  # 'all_products' or 'specific_products'
    applicable_product_ids = Column(JSON, default=list)  # List of product IDs (applicable if scope='specific_products')
    
    starts_at = Column(DateTime(timezone=True), nullable=True)
    ends_at = Column(DateTime(timezone=True), nullable=True)
    
    usage_limit = Column(Integer, nullable=True)
    usage_count = Column(Integer, default=0)
    
    is_active = Column(Boolean, default=True, index=True)
    
    shop_id = Column(Integer, ForeignKey("shops.id"), nullable=False, index=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationship
    shop = relationship("Shop", back_populates="coupons")

    def __repr__(self):
        return f"<Coupon {self.code} (Shop {self.shop_id})>"
