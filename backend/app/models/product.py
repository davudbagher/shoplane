from sqlalchemy import Column, Integer, String, Text, Numeric, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Product(Base):
    """Product model with inventory tracking."""
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Basic Info
    name = Column(String, nullable=False, index=True)
    slug = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    
    # Pricing (in AZN)
    price = Column(Numeric(10, 2), nullable=False, index=True)
    compare_at_price = Column(Numeric(10, 2), nullable=True)  # Original price for discounts
    cost_per_item = Column(Numeric(10, 2), nullable=True)  # Cost for profit tracking
    
    # Inventory
    inventory_count = Column(Integer, default=0, nullable=False)
    track_inventory = Column(Boolean, default=True)
    allow_backorder = Column(Boolean, default=False)  # Sell even when out of stock
    low_stock_threshold = Column(Integer, default=5)
    
    # Media
    images = Column(JSON, default=list)  # List of image URLs
    
    # Variants (New)
    variants = Column(JSON, default=list)  # List of {color, size, stock, sold} dicts
    
    # Organization
    category = Column(String, nullable=True, index=True)
    tags = Column(JSON, default=list)  # List of tags
    
    # SEO
    meta_title = Column(String, nullable=True)
    meta_description = Column(String, nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True, index=True)
    is_featured = Column(Boolean, default=False)
    is_new_arrival = Column(Boolean, default=False)
    
    # Multi-tenant isolation
    shop_id = Column(Integer, ForeignKey("shops.id"), nullable=False, index=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    shop = relationship("Shop", back_populates="products")
    order_items = relationship("OrderItem", back_populates="product")
    
    @property
    def is_in_stock(self) -> bool:
        """Check if product is in stock."""
        if not self.track_inventory:
            return True
        return self.inventory_count > 0 or self.allow_backorder
    
    @property
    def is_low_stock(self) -> bool:
        """Check if product is low on stock."""
        if not self.track_inventory:
            return False
        return 0 < self.inventory_count <= self.low_stock_threshold
    
    def __repr__(self):
        return f"<Product {self.name} (Shop {self.shop_id})>"