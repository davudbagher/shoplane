from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Customer(Base):
    """Customer information for orders (not registered users)."""
    __tablename__ = "customers"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Contact Info
    full_name = Column(String, nullable=False)
    phone = Column(String, nullable=False, index=True)
    email = Column(String, nullable=True)
    
    # Shipping Address (for Azerbaijan)
    city = Column(String, nullable=False)  # Bakı, Gəncə, Sumqayıt, etc.
    district = Column(String, nullable=True)  # rayon/district
    address_line = Column(String, nullable=False)  # Full street address
    postal_code = Column(String, nullable=True)
    
    # Delivery Notes
    delivery_notes = Column(String, nullable=True)  # "3rd floor, apartment 12"
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    orders = relationship("Order", back_populates="customer")  # ← THIS IS THE MISSING LINE!
    
    def __repr__(self):
        return f"<Customer {self.full_name} ({self.phone})>"