from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, Enum as SQLEnum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum
from datetime import datetime


class PaymentMethod(str, enum.Enum):
    """Payment methods available in Azerbaijan."""
    CASH_ON_DELIVERY = "cash_on_delivery"  # Ödəniş çatdırılarkən
    MILLIKART = "millikart"
    BIRBANK = "birbank"
    PASHA_PAY = "pasha_pay"


class OrderStatus(str, enum.Enum):
    """Order lifecycle statuses."""
    PENDING = "pending"              # Gözləyir - Just created
    CONFIRMED = "confirmed"          # Təsdiqləndi - Shop confirmed
    PROCESSING = "processing"        # Hazırlanır - Being prepared
    SHIPPED = "shipped"              # Göndərildi - Out for delivery
    DELIVERED = "delivered"          # Çatdırıldı - Completed
    CANCELLED = "cancelled"          # Ləğv edildi - Cancelled
    REFUNDED = "refunded"           # Geri qaytarıldı - Refunded


class PaymentStatus(str, enum.Enum):
    """Payment status for orders."""
    PENDING = "pending"          # Gözləyir - Awaiting payment
    COMPLETED = "completed"      # Ödənilib - Payment received
    FAILED = "failed"            # Uğursuz - Payment failed
    REFUNDED = "refunded"        # Geri qaytarıldı - Refunded
    CANCELLED = "cancelled"      # Ləğv edildi - Cancelled


class Order(Base):
    """
    Customer orders with Azerbaijan-specific payment methods.
    
    Supports:
    - Cash on Delivery (most common in Azerbaijan)
    - MilliKart (local card payment)
    - BirBank (mobile banking)
    - Pasha Pay (digital wallet)
    """
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Order Identity
    order_number = Column(String, unique=True, index=True, nullable=False)  # e.g., "ORD-20260302-001"
    
    # Status & Payment
    status = Column(SQLEnum(OrderStatus), default=OrderStatus.PENDING, index=True)
    payment_method = Column(SQLEnum(PaymentMethod), nullable=False)
    payment_status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False)
    
    # Pricing (in AZN - Azerbaijani Manat)
    subtotal = Column(Numeric(10, 2), nullable=False)  # Sum of items
    shipping_fee = Column(Numeric(10, 2), default=0)   # Delivery cost
    discount = Column(Numeric(10, 2), default=0)       # Discount amount
    total = Column(Numeric(10, 2), nullable=False)     # Final total
    
    # Customer Info (denormalized for order history)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    customer_name = Column(String, nullable=False)
    customer_phone = Column(String, nullable=False)
    customer_email = Column(String, nullable=True)
    
    # Shipping Address (Azerbaijan-specific)
    shipping_city = Column(String, nullable=False)           # e.g., "Bakı", "Gəncə", "Sumqayıt"
    shipping_district = Column(String, nullable=True)        # e.g., "Nəsimi", "Yasamal"
    shipping_address = Column(String, nullable=False)        # Full street address
    shipping_postal_code = Column(String, nullable=True)
    delivery_notes = Column(Text, nullable=True)             # e.g., "3rd floor, apartment 12"
    
    # Payment Transaction Reference (for online payments)
    payment_transaction_id = Column(String, nullable=True)   # MilliKart/BirBank transaction ID
    
    # Internal Notes
    admin_notes = Column(Text, nullable=True)  # Private notes for shop owner
    
    # Multi-tenant isolation (CRITICAL for SaaS)
    shop_id = Column(Integer, ForeignKey("shops.id"), nullable=False, index=True)
    
    # Timestamps (Order Lifecycle)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    confirmed_at = Column(DateTime(timezone=True), nullable=True)   # When shop owner confirms
    shipped_at = Column(DateTime(timezone=True), nullable=True)     # When handed to courier
    delivered_at = Column(DateTime(timezone=True), nullable=True)   # When customer receives
    cancelled_at = Column(DateTime(timezone=True), nullable=True)   # If cancelled
    
    # Relationships
    shop = relationship("Shop", back_populates="orders")
    customer = relationship("Customer", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Order {self.order_number} - {self.status.value} - {self.total} AZN>"
    
    @property
    def is_paid(self) -> bool:
        """Check if payment is completed."""
        return self.payment_status == PaymentStatus.COMPLETED
    
    @property
    def is_cod(self) -> bool:
        """Check if order is cash on delivery."""
        return self.payment_method == PaymentMethod.CASH_ON_DELIVERY
    
    @property
    def can_be_cancelled(self) -> bool:
        """Check if order can be cancelled."""
        return self.status not in [OrderStatus.DELIVERED, OrderStatus.CANCELLED]
    
    @property
    def total_items(self) -> int:
        """Get total number of items in order."""
        return sum(item.quantity for item in self.items)


# class OrderItem(Base):
#     """
#     Individual items within an order.
    
#     Denormalized design: We store product name/price at time of order
#     to preserve historical data (even if product is later deleted/changed).
#     """
#     __tablename__ = "order_items"
    
#     id = Column(Integer, primary_key=True, index=True)
    
#     # Foreign keys
#     order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
#     product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    
#     # Denormalized product data (snapshot at time of order)
#     product_name = Column(String(200), nullable=False)
#     product_image = Column(String(500), nullable=True)  # First image URL
    
#     # Quantity and pricing
#     quantity = Column(Integer, nullable=False)
#     unit_price = Column(Numeric(10, 2), nullable=False)  # Price per unit at time of order
#     total_price = Column(Numeric(10, 2), nullable=False)  # unit_price * quantity
    
#     # Relationships
#     order = relationship("Order", back_populates="items")
#     product = relationship("Product")
    
#     def __repr__(self):
#         return f"<OrderItem {self.quantity}x {self.product_name} @ {self.unit_price} AZN>"