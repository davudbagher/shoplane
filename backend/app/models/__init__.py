"""
Import all models here so Alembic can detect them for migrations.
"""
from app.models.user import User
from app.models.shop import Shop, SubscriptionPlan
from app.models.product import Product
from app.models.customer import Customer
from app.models.order import Order, OrderStatus, PaymentMethod
from app.models.order_item import OrderItem
from app.models.coupon import Coupon

__all__ = [
    "User",
    "Shop",
    "SubscriptionPlan",
    "Product",
    "Customer",
    "Order",
    "OrderStatus",
    "PaymentMethod",
    "OrderItem",
    "Coupon",
]