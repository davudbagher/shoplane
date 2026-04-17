"""
Test Models and Database Integrity
Tests for: SQLAlchemy models, relationships, constraints
"""
import pytest
from sqlalchemy.exc import IntegrityError
from app.models.user import User
from app.models.shop import Shop
from app.models.product import Product
from app.models.customer import Customer
from app.models.order import Order, OrderStatus, PaymentStatus, PaymentMethod
from app.models.order_item import OrderItem
from app.models.coupon import Coupon
from app.models.lead import Lead
from datetime import datetime, timezone
from decimal import Decimal


class TestUserModel:
    """Test User model."""

    def test_create_user(self, db_session):
        """Test creating a user."""
        from app.utils.security import get_password_hash
        user = User(
            email="model_test@example.com",
            full_name="Model Test User",
            phone="+994501111111",
            hashed_password=get_password_hash("password123"),
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        
        assert user.id is not None
        assert user.email == "model_test@example.com"
        assert user.is_active is True
        assert user.is_superuser is False

    def test_user_repr(self, db_session):
        """Test user string representation."""
        from app.utils.security import get_password_hash
        user = User(
            email="repr@example.com",
            full_name="Repr User",
            phone="+994502222222",
            hashed_password=get_password_hash("password123"),
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        
        assert repr(user).startswith("<User")

    def test_user_unique_email_constraint(self, db_session):
        """Test that email must be unique."""
        from app.utils.security import get_password_hash
        user1 = User(
            email="unique@example.com",
            full_name="User 1",
            phone="+994503333331",
            hashed_password=get_password_hash("password123"),
        )
        user2 = User(
            email="unique@example.com",  # Same email
            full_name="User 2",
            phone="+994503333332",
            hashed_password=get_password_hash("password123"),
        )
        db_session.add(user1)
        db_session.commit()
        
        db_session.add(user2)
        with pytest.raises(IntegrityError):
            db_session.commit()


class TestShopModel:
    """Test Shop model."""

    def test_create_shop(self, db_session, test_user: User):
        """Test creating a shop."""
        shop = Shop(
            name="Model Test Shop",
            subdomain="modeltest",
            slug="model-test",
            owner_id=test_user.id,
            is_active=True,
        )
        db_session.add(shop)
        db_session.commit()
        db_session.refresh(shop)
        
        assert shop.id is not None
        assert shop.name == "Model Test Shop"
        assert shop.plan_type == "STANDARD"  # Default
        assert shop.subscription_status == "TRIAL"  # Default

    def test_shop_unique_subdomain(self, db_session, test_user: User):
        """Test that subdomain must be unique."""
        shop1 = Shop(
            name="Shop 1",
            subdomain="duplicatesub",
            slug="shop-1",
            owner_id=test_user.id,
            is_active=True,
        )
        shop2 = Shop(
            name="Shop 2",
            subdomain="duplicatesub",  # Same subdomain
            slug="shop-2",
            owner_id=test_user.id,
            is_active=True,
        )
        db_session.add(shop1)
        db_session.commit()
        
        db_session.add(shop2)
        with pytest.raises(IntegrityError):
            db_session.commit()

    def test_shop_relationships(self, db_session, test_user: User):
        """Test shop relationships."""
        shop = Shop(
            name="Relationship Shop",
            subdomain="relshop",
            slug="rel-shop",
            owner_id=test_user.id,
            is_active=True,
        )
        db_session.add(shop)
        db_session.commit()
        db_session.refresh(shop)
        
        # Should have owner relationship
        assert shop.owner is not None
        assert shop.owner.email == test_user.email


class TestProductModel:
    """Test Product model."""

    def test_create_product(self, db_session, test_shop: Shop):
        """Test creating a product."""
        product = Product(
            name="Model Test Product",
            slug="model-test-product",
            price=49.99,
            inventory_count=20,
            shop_id=test_shop.id,
        )
        db_session.add(product)
        db_session.commit()
        db_session.refresh(product)
        
        assert product.id is not None
        assert product.is_in_stock is True

    def test_product_stock_properties(self, db_session, test_shop: Shop):
        """Test product stock calculation properties."""
        # In stock product
        product1 = Product(
            name="In Stock",
            slug="in-stock",
            price=10.00,
            inventory_count=15,
            track_inventory=True,
            shop_id=test_shop.id,
        )
        db_session.add(product1)
        db_session.commit()
        
        assert product1.is_in_stock is True
        assert product1.is_low_stock is False
        
        # Low stock product
        product2 = Product(
            name="Low Stock",
            slug="low-stock",
            price=10.00,
            inventory_count=3,
            track_inventory=True,
            low_stock_threshold=5,
            shop_id=test_shop.id,
        )
        db_session.add(product2)
        db_session.commit()
        
        assert product2.is_in_stock is True
        assert product2.is_low_stock is True
        
        # Out of stock product
        product3 = Product(
            name="Out of Stock",
            slug="out-of-stock",
            price=10.00,
            inventory_count=0,
            track_inventory=True,
            shop_id=test_shop.id,
        )
        db_session.add(product3)
        db_session.commit()
        
        assert product3.is_in_stock is False
        assert product3.is_low_stock is False

    def test_product_backorder(self, db_session, test_shop: Shop):
        """Test product with backorder enabled."""
        product = Product(
            name="Backorder Product",
            slug="backorder-product",
            price=10.00,
            inventory_count=0,
            track_inventory=True,
            allow_backorder=True,
            shop_id=test_shop.id,
        )
        db_session.add(product)
        db_session.commit()
        
        # Should be considered in stock because backorder is allowed
        assert product.is_in_stock is True

    def test_product_no_inventory_tracking(self, db_session, test_shop: Shop):
        """Test product that doesn't track inventory."""
        product = Product(
            name="Digital Product",
            slug="digital-product",
            price=10.00,
            inventory_count=0,
            track_inventory=False,  # Don't track
            shop_id=test_shop.id,
        )
        db_session.add(product)
        db_session.commit()
        
        # Should be considered in stock because inventory isn't tracked
        assert product.is_in_stock is True
        assert product.is_low_stock is False


class TestOrderModel:
    """Test Order model."""

    def test_create_order(self, db_session, test_shop: Shop, test_customer: Customer):
        """Test creating an order."""
        order = Order(
            order_number="ORD-MODEL-001",
            shop_id=test_shop.id,
            customer_id=test_customer.id,
            status=OrderStatus.PENDING,
            payment_method=PaymentMethod.CASH_ON_DELIVERY,
            payment_status=PaymentStatus.PENDING,
            subtotal=Decimal("100.00"),
            shipping_fee=Decimal("5.00"),
            discount=Decimal("10.00"),
            total=Decimal("95.00"),
            customer_name=test_customer.full_name,
            customer_phone=test_customer.phone,
            shipping_city=test_customer.city,
            shipping_address=test_customer.address_line,
        )
        db_session.add(order)
        db_session.commit()
        db_session.refresh(order)
        
        assert order.id is not None
        assert order.total == Decimal("95.00")

    def test_order_properties(self, db_session, test_shop: Shop, test_customer: Customer):
        """Test order property methods."""
        order = Order(
            order_number="ORD-PROP-001",
            shop_id=test_shop.id,
            customer_id=test_customer.id,
            status=OrderStatus.PENDING,
            payment_method=PaymentMethod.CASH_ON_DELIVERY,
            payment_status=PaymentStatus.PENDING,
            subtotal=Decimal("50.00"),
            shipping_fee=Decimal("0.00"),
            discount=Decimal("0.00"),
            total=Decimal("50.00"),
            customer_name=test_customer.full_name,
            customer_phone=test_customer.phone,
            shipping_city=test_customer.city,
            shipping_address=test_customer.address_line,
        )
        db_session.add(order)
        db_session.commit()
        
        assert order.is_cod is True
        assert order.is_paid is False
        assert order.can_be_cancelled is True

    def test_order_cancelled_cannot_cancel_again(self, db_session, test_shop: Shop, test_customer: Customer):
        """Test that cancelled order cannot be cancelled again."""
        order = Order(
            order_number="ORD-CANCEL-001",
            shop_id=test_shop.id,
            customer_id=test_customer.id,
            status=OrderStatus.CANCELLED,
            payment_method=PaymentMethod.CASH_ON_DELIVERY,
            payment_status=PaymentStatus.CANCELLED,
            subtotal=Decimal("30.00"),
            shipping_fee=Decimal("0.00"),
            discount=Decimal("0.00"),
            total=Decimal("30.00"),
            customer_name=test_customer.full_name,
            customer_phone=test_customer.phone,
            shipping_city=test_customer.city,
            shipping_address=test_customer.address_line,
        )
        db_session.add(order)
        db_session.commit()
        
        assert order.can_be_cancelled is False


class TestOrderItemModel:
    """Test OrderItem model."""

    def test_create_order_item(self, db_session, test_shop: Shop, test_customer: Customer, test_product: Product):
        """Test creating an order item."""
        # Create order first
        order = Order(
            order_number="ORD-ITEM-001",
            shop_id=test_shop.id,
            customer_id=test_customer.id,
            status=OrderStatus.PENDING,
            payment_method=PaymentMethod.CASH_ON_DELIVERY,
            payment_status=PaymentStatus.PENDING,
            subtotal=Decimal("100.00"),
            shipping_fee=Decimal("0.00"),
            discount=Decimal("0.00"),
            total=Decimal("100.00"),
            customer_name=test_customer.full_name,
            customer_phone=test_customer.phone,
            shipping_city=test_customer.city,
            shipping_address=test_customer.address_line,
        )
        db_session.add(order)
        db_session.commit()
        db_session.refresh(order)
        
        # Create order item
        item = OrderItem(
            order_id=order.id,
            product_id=test_product.id,
            product_name=test_product.name,
            quantity=2,
            unit_price=Decimal("50.00"),
            total_price=Decimal("100.00"),
        )
        db_session.add(item)
        db_session.commit()
        db_session.refresh(item)
        
        assert item.id is not None
        assert item.quantity == 2
        assert item.total_price == Decimal("100.00")

    def test_order_item_cascade_delete(self, db_session, test_shop: Shop, test_customer: Customer, test_product: Product):
        """Test that order items are deleted when order is deleted."""
        # Create order with item
        order = Order(
            order_number="ORD-CASCADE-001",
            shop_id=test_shop.id,
            customer_id=test_customer.id,
            status=OrderStatus.PENDING,
            payment_method=PaymentMethod.CASH_ON_DELIVERY,
            payment_status=PaymentStatus.PENDING,
            subtotal=Decimal("50.00"),
            shipping_fee=Decimal("0.00"),
            discount=Decimal("0.00"),
            total=Decimal("50.00"),
            customer_name=test_customer.full_name,
            customer_phone=test_customer.phone,
            shipping_city=test_customer.city,
            shipping_address=test_customer.address_line,
        )
        db_session.add(order)
        db_session.commit()
        db_session.refresh(order)
        
        item = OrderItem(
            order_id=order.id,
            product_id=test_product.id,
            product_name=test_product.name,
            quantity=1,
            unit_price=Decimal("50.00"),
            total_price=Decimal("50.00"),
        )
        db_session.add(item)
        db_session.commit()
        db_session.refresh(item)
        
        item_id = item.id
        order_id = order.id
        
        # Delete order
        db_session.delete(order)
        db_session.commit()
        
        # Verify item is also deleted (cascade)
        from sqlalchemy import text
        result = db_session.execute(text(f"SELECT id FROM order_items WHERE id = {item_id}"))
        assert result.fetchone() is None


class TestCouponModel:
    """Test Coupon model."""

    def test_create_coupon(self, db_session, test_shop: Shop):
        """Test creating a coupon."""
        coupon = Coupon(
            code="MODEL50",
            discount_type="percentage",
            discount_value=50.0,
            scope="all_products",
            is_active=True,
            shop_id=test_shop.id,
            usage_limit=100,
        )
        db_session.add(coupon)
        db_session.commit()
        db_session.refresh(coupon)
        
        assert coupon.id is not None
        assert coupon.code == "MODEL50"

    def test_coupon_usage_limit(self, db_session, test_shop: Shop):
        """Test coupon usage limit tracking."""
        coupon = Coupon(
            code="LIMITED10",
            discount_type="fixed_amount",
            discount_value=10.0,
            scope="all_products",
            is_active=True,
            shop_id=test_shop.id,
            usage_limit=10,
            usage_count=9,
        )
        db_session.add(coupon)
        db_session.commit()
        
        # Simulate one more usage
        coupon.usage_count += 1
        db_session.commit()
        
        assert coupon.usage_count == 10


class TestLeadModel:
    """Test Lead model."""

    def test_create_lead(self, db_session):
        """Test creating a lead."""
        lead = Lead(
            full_name="Lead Person",
            email="lead@example.com",
            phone="+994504444444",
            shop_name="Future Shop",
            status="PENDING",
        )
        db_session.add(lead)
        db_session.commit()
        db_session.refresh(lead)
        
        assert lead.id is not None
        assert lead.status == "PENDING"

    def test_lead_screening_status(self, db_session):
        """Test lead screening status field."""
        lead = Lead(
            full_name="Screened Lead",
            email="screened@example.com",
            phone="+994505555555",
            shop_name="Screened Shop",
            screening_status="QUALIFIED",
        )
        db_session.add(lead)
        db_session.commit()
        
        assert lead.screening_status == "QUALIFIED"


class TestDatabaseConstraints:
    """Test database-level constraints."""

    def test_order_shop_foreign_key(self, db_session, test_customer: Customer):
        """Test that order requires valid shop."""
        order = Order(
            order_number="ORD-FK-001",
            shop_id=99999,  # Non-existent shop
            customer_id=test_customer.id,
            status=OrderStatus.PENDING,
            payment_method=PaymentMethod.CASH_ON_DELIVERY,
            payment_status=PaymentStatus.PENDING,
            subtotal=Decimal("10.00"),
            shipping_fee=Decimal("0.00"),
            discount=Decimal("0.00"),
            total=Decimal("10.00"),
            customer_name=test_customer.full_name,
            customer_phone=test_customer.phone,
            shipping_city=test_customer.city,
            shipping_address=test_customer.address_line,
        )
        db_session.add(order)
        with pytest.raises(IntegrityError):
            db_session.commit()

    def test_product_shop_foreign_key(self, db_session):
        """Test that product requires valid shop."""
        product = Product(
            name="FK Product",
            slug="fk-product",
            price=10.00,
            inventory_count=5,
            shop_id=99999,  # Non-existent shop
        )
        db_session.add(product)
        with pytest.raises(IntegrityError):
            db_session.commit()

    def test_order_item_order_foreign_key(self, db_session, test_product: Product):
        """Test that order item requires valid order."""
        item = OrderItem(
            order_id=99999,  # Non-existent order
            product_id=test_product.id,
            product_name=test_product.name,
            quantity=1,
            unit_price=Decimal("10.00"),
            total_price=Decimal("10.00"),
        )
        db_session.add(item)
        with pytest.raises(IntegrityError):
            db_session.commit()
