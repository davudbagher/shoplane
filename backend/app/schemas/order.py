from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import List, Optional
from datetime import datetime
from decimal import Decimal
from app.models.order import OrderStatus, PaymentMethod


class OrderItemCreate(BaseModel):
    """Schema for creating order item."""
    product_id: int
    quantity: int = Field(..., gt=0, description="Quantity to order")


class OrderItemResponse(BaseModel):
    """Schema for order item response."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    product_name: str
    product_image: Optional[str]
    quantity: int
    unit_price: Decimal
    total_price: Decimal


class OrderCreate(BaseModel):
    """Schema for creating an order (from storefront)."""
    # Customer info
    customer_full_name: str = Field(..., min_length=2, max_length=100)
    customer_phone: str = Field(..., min_length=9, max_length=20)
    customer_email: Optional[str] = None
    
    # Shipping address
    shipping_city: str
    shipping_district: Optional[str] = None
    shipping_address: str = Field(..., min_length=5, max_length=200)
    shipping_postal_code: Optional[str] = None
    delivery_notes: Optional[str] = Field(None, max_length=200)
    
    # Payment method (Azerbaijan-specific)
    payment_method: PaymentMethod = Field(
        default=PaymentMethod.CASH_ON_DELIVERY,
        description="Payment method: cash_on_delivery, millikart, birbank, or pasha_pay"
    )
    
    # Order items
    items: List[OrderItemCreate] = Field(..., min_length=1, description="At least one product required")
    
    # Optional discount code (for future feature)
    discount_code: Optional[str] = None


class OrderUpdateStatus(BaseModel):
    """Schema for updating order status (admin only)."""
    status: OrderStatus
    admin_notes: Optional[str] = None


class OrderResponse(BaseModel):
    """Schema for order response."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_number: str
    status: OrderStatus
    payment_method: PaymentMethod
    payment_status: str
    
    # Pricing (in AZN)
    subtotal: Decimal
    shipping_fee: Decimal
    discount: Decimal
    total: Decimal
    
    # Customer info
    customer_name: str
    customer_phone: str
    customer_email: Optional[str]
    
    # Shipping
    shipping_city: str
    shipping_district: Optional[str]
    shipping_address: str
    shipping_postal_code: Optional[str]
    delivery_notes: Optional[str]
    
    # Items
    items: List[OrderItemResponse]
    
    # Metadata
    shop_id: int
    created_at: datetime
    updated_at: Optional[datetime]
    confirmed_at: Optional[datetime]
    shipped_at: Optional[datetime]
    delivered_at: Optional[datetime]


class OrderListResponse(BaseModel):
    """Paginated order list response."""
    orders: List[OrderResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class OrderStatsResponse(BaseModel):
    """Order statistics for shop dashboard."""
    total_orders: int
    pending_orders: int
    confirmed_orders: int
    processing_orders: int
    shipped_orders: int
    delivered_orders: int
    cancelled_orders: int
    total_revenue: Decimal  # In AZN
    average_order_value: Decimal  # In AZN
