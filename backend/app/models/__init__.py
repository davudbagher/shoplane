"""
Import all models here so Alembic can detect them for migrations.
Note: Category MUST be imported before Shop due to Shop.categories relationship.
"""
from app.models.category import Category
from app.models.user import User
from app.models.shop import Shop, SubscriptionPlan
from app.models.product import Product
from app.models.customer import Customer
from app.models.order import Order, OrderStatus, PaymentMethod
from app.models.order_item import OrderItem
from app.models.coupon import Coupon
from app.models.lead import Lead

__all__ = [
    "Category",
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
    "Lead",
]