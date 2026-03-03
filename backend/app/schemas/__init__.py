"""Pydantic schemas for request/response validation."""

from app.schemas.user import (
    UserBase,
    UserCreate,
    UserLogin,
    UserUpdate,
    UserResponse,
    Token,
    TokenData,
)
from app.schemas.shop import (
    ShopBase,
    ShopCreate,
    ShopUpdate,
    ShopResponse,
    ShopPublicResponse,
)
from app.schemas.product import (
    ProductBase,
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    ProductListResponse,
)
from app.schemas.customer import (
    CustomerBase,
    CustomerCreate,
    CustomerResponse,
)
from app.schemas.order import (
    OrderCreate,
    OrderItemCreate,
    OrderItemResponse,
    OrderUpdateStatus,
    OrderResponse,
    OrderListResponse,
    OrderStatsResponse,
)

__all__ = [
    # User
    "UserBase",
    "UserCreate",
    "UserLogin",
    "UserUpdate",
    "UserResponse",
    "Token",
    "TokenData",
    # Shop
    "ShopBase",
    "ShopCreate",
    "ShopUpdate",
    "ShopResponse",
    "ShopPublicResponse",
    # Product
    "ProductBase",
    "ProductCreate",
    "ProductUpdate",
    "ProductResponse",
    "ProductListResponse",
    # Customer
    "CustomerBase",
    "CustomerCreate",
    "CustomerResponse",
    # Order
    "OrderCreate",
    "OrderItemCreate",
    "OrderItemResponse",
    "OrderUpdateStatus",
    "OrderResponse",
    "OrderListResponse",
    "OrderStatsResponse",
]