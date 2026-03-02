from sqlalchemy import Column, Integer, String, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class OrderItem(Base):
    """Individual items in an order."""
    __tablename__ = "order_items"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Order Reference
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    
    # Product Info (denormalized for order history)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    product_name = Column(String, nullable=False)      # Snapshot at order time
    product_image = Column(String, nullable=True)      # First image
    
    # Pricing & Quantity
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)  # Price per item at order time
    total_price = Column(Numeric(10, 2), nullable=False) # quantity * unit_price
    
    # Relationships
    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")
    
    def __repr__(self):
        return f"<OrderItem {self.product_name} x{self.quantity}>"