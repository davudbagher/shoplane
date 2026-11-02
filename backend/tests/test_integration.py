"""
End-to-End Integration Tests
Tests complete user workflows across multiple endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from app.models.user import User
from app.models.shop import Shop
from app.models.product import Product
from app.models.customer import Customer
from app.models.order import Order, OrderStatus, PaymentStatus, PaymentMethod
from app.models.order_item import OrderItem
from app.models.coupon import Coupon
from decimal import Decimal
from datetime import datetime, timezone, timedelta


class TestMerchantOnboardingFlow:
    """Test complete merchant onboarding workflow."""

    def test_full_merchant_flow(self, client: TestClient, db_session):
        """Test: Register → Create Shop → Add Product → Verify Setup."""
        # Step 1: User Registration
        register_response = client.post(
            "/auth/register",
            json={
                "full_name": "New Merchant",
                "email": "merchant@example.com",
                "phone": "+994501111111",
                "password": "merchantpass123"
            }
        )
        assert register_response.status_code == 201
        user_data = register_response.json()
        assert user_data["email"] == "merchant@example.com"

        # Step 2: Login
        login_response = client.post(
            "/auth/login",
            json={
                "email": "merchant@example.com",
                "password": "merchantpass123"
            }
        )
        assert login_response.status_code == 200
        token_data = login_response.json()
        auth_headers = {"Authorization": f"Bearer {token_data['access_token']}"}

        # Step 3: Create Shop
        shop_response = client.post(
            "/admin/shops",
            json={
                "name": "My First Shop",
                "subdomain": "myfirstshop",
                "description": "Welcome to my shop!"
            },
            headers=auth_headers
        )
        assert shop_response.status_code == 201
        shop_data = shop_response.json()
        shop_id = shop_data["id"]

        # Step 4: Add Product
        product_response = client.post(
            f"/admin/shops/{shop_id}/products",
            json={
                "name": "First Product",
                "description": "Our flagship product",
                "price": 99.99,
                "inventory_count": 50,
                "category": "Featured"
            },
            headers=auth_headers
        )
        assert product_response.status_code == 201
        product_data = product_response.json()
        assert product_data["name"] == "First Product"

        # Step 5: Verify shop setup
        shops_response = client.get("/admin/shops", headers=auth_headers)
        assert shops_response.status_code == 200
        shops_data = shops_response.json()
        assert len(shops_data) >= 1
        assert any(s["name"] == "My First Shop" for s in shops_data)


class TestCompleteCheckoutFlow:
    """Test complete customer checkout workflow."""

    def test_customer_checkout_flow(self, client: TestClient, test_shop: Shop, db_session):
        """Test: Browse Products → Add to Cart → Checkout → Order Tracking."""
        # Create products
        product1 = Product(
            name="Checkout Test Product",
            slug="checkout-test-product",
            price=45.00,
            inventory_count=100,
            track_inventory=True,
            shop_id=test_shop.id,
        )
        db_session.add(product1)
        db_session.commit()
        db_session.refresh(product1)

        # Create coupon
        coupon = Coupon(
            code="CHECKOUT10",
            discount_type="percentage",
            discount_value=10.0,
            scope="all_products",
            is_active=True,
            shop_id=test_shop.id,
        )
        db_session.add(coupon)
        db_session.commit()

        shop_headers = {"X-Shop-Subdomain": test_shop.subdomain}

        # Step 1: Browse products
        products_response = client.get(
            "/storefront/products",
            headers=shop_headers
        )
        assert products_response.status_code == 200
        products_data = products_response.json()
        assert len(products_data["products"]) >= 1

        # Step 2: Validate coupon
        coupon_response = client.post(
            "/storefront/validate-coupon",
            json={
                "code": "CHECKOUT10",
                "items": [{"product_id": product1.id, "quantity": 2, "price": 45.00}]
            },
            headers=shop_headers
        )
        assert coupon_response.status_code == 200
        coupon_data = coupon_response.json()
        assert coupon_data["is_valid"] is True
        assert float(coupon_data["discount_amount"]) == 9.0  # 10% of 90

        # Step 3: Create order (checkout)
        order_response = client.post(
            "/storefront/orders",
            json={
                "customer_full_name": "Checkout Customer",
                "customer_phone": "+994502222222",
                "customer_email": "checkout@example.com",
                "shipping_city": "Bakı",
                "shipping_district": "Nəsimi",
                "shipping_address": "Checkout Street 123",
                "payment_method": "cash_on_delivery",
                "items": [{"product_id": product1.id, "quantity": 2}],
                "discount_code": "CHECKOUT10"
            },
            headers=shop_headers
        )
        assert order_response.status_code == 201
        order_data = order_response.json()
        order_number = order_data["order_number"]

        # Verify order details
        assert order_data["customer_name"] == "Checkout Customer"
        assert order_data["customer_phone"] == "+994502222222"
        assert float(order_data["subtotal"]) == 90.00  # 45 * 2
        assert float(order_data["discount"]) == 9.00   # 10% off
        assert float(order_data["total"]) == 81.00     # 90 - 9

        # Step 4: Track order
        track_response = client.get(
            f"/storefront/orders/{order_number}?phone=%2B994502222222",
            headers=shop_headers
        )
        assert track_response.status_code == 200
        track_data = track_response.json()
        assert track_data["order_number"] == order_number
        assert track_data["status"] == "pending"

        # Verify inventory was reduced
        db_session.refresh(product1)
        assert product1.inventory_count == 98  # 100 - 2


class TestOrderManagementFlow:
    """Test shop owner order management workflow."""

    def test_order_management_flow(self, client: TestClient, auth_headers: dict, test_shop: Shop, db_session):
        """Test: Create Order → List Orders → Update Status → View Details."""
        # Create customer
        customer = Customer(
            full_name="Management Test Customer",
            phone="+994503333333",
            email="management@example.com",
            city="Bakı",
            address_line="Management Street 456",
        )
        db_session.add(customer)
        db_session.commit()

        # Create order
        order = Order(
            order_number="ORD-MGMT-001",
            shop_id=test_shop.id,
            customer_id=customer.id,
            status=OrderStatus.PENDING,
            payment_method=PaymentMethod.CASH_ON_DELIVERY,
            payment_status=PaymentStatus.PENDING,
            subtotal=Decimal("150.00"),
            shipping_fee=Decimal("0.00"),
            discount=Decimal("0.00"),
            total=Decimal("150.00"),
            customer_name=customer.full_name,
            customer_phone=customer.phone,
            shipping_city=customer.city,
            shipping_address=customer.address_line,
        )
        db_session.add(order)
        db_session.commit()
        db_session.refresh(order)

        # Step 1: List orders
        list_response = client.get(
            f"/admin/orders/{test_shop.id}/orders",
            headers=auth_headers
        )
        assert list_response.status_code == 200
        list_data = list_response.json()
        assert "orders" in list_data
        assert len(list_data["orders"]) >= 1

        # Step 2: Update order status to confirmed
        confirm_response = client.put(
            f"/admin/orders/{test_shop.id}/orders/{order.id}/status",
            json={"status": "confirmed"},
            headers=auth_headers
        )
        assert confirm_response.status_code == 200
        assert confirm_response.json()["status"] == "confirmed"

        # Step 3: Update to processing
        process_response = client.put(
            f"/admin/orders/{test_shop.id}/orders/{order.id}/status",
            json={"status": "processing"},
            headers=auth_headers
        )
        assert process_response.status_code == 200
        assert process_response.json()["status"] == "processing"

        # Step 4: Update to shipped
        ship_response = client.put(
            f"/admin/orders/{test_shop.id}/orders/{order.id}/status",
            json={"status": "shipped"},
            headers=auth_headers
        )
        assert ship_response.status_code == 200
        assert ship_response.json()["status"] == "shipped"

        # Step 5: Update to delivered
        deliver_response = client.put(
            f"/admin/orders/{test_shop.id}/orders/{order.id}/status",
            json={"status": "delivered"},
            headers=auth_headers
        )
        assert deliver_response.status_code == 200
        assert deliver_response.json()["status"] == "delivered"

        # Step 6: Check order stats
        stats_response = client.get(
            f"/admin/orders/{test_shop.id}/stats",
            headers=auth_headers
        )
        assert stats_response.status_code == 200
        stats_data = stats_response.json()
        assert "total_orders" in stats_data
        assert "total_revenue" in stats_data


class TestCouponLifecycle:
    """Test complete coupon lifecycle."""

    def test_coupon_lifecycle(self, client: TestClient, auth_headers: dict, test_shop: Shop, db_session):
        """Test: Create → Validate → Use → Track Usage → Deactivate."""
        # Step 1: Create coupon
        create_response = client.post(
            f"/admin/shops/{test_shop.id}/coupons",
            json={
                "code": "LIFECYCLE25",
                "discount_type": "percentage",
                "discount_value": 25.0,
                "scope": "all_products",
                "is_active": True,
                "usage_limit": 10
            },
            headers=auth_headers
        )
        assert create_response.status_code == 201
        coupon_data = create_response.json()
        coupon_id = coupon_data["id"]

        # Step 2: List coupons
        list_response = client.get(
            f"/admin/shops/{test_shop.id}/coupons",
            headers=auth_headers
        )
        assert list_response.status_code == 200
        list_data = list_response.json()
        assert any(c["code"] == "LIFECYCLE25" for c in list_data)

        # Step 3: Create product for testing
        product = Product(
            name="Coupon Test Product",
            slug="coupon-lifecycle-product",
            price=80.00,
            inventory_count=50,
            shop_id=test_shop.id,
        )
        db_session.add(product)
        db_session.commit()
        db_session.refresh(product)

        shop_headers = {"X-Shop-Subdomain": test_shop.subdomain}

        # Step 4: Validate coupon (before use)
        validate_response = client.post(
            "/storefront/validate-coupon",
            json={
                "code": "LIFECYCLE25",
                "items": [{"product_id": product.id, "quantity": 1, "price": 80.00}]
            },
            headers=shop_headers
        )
        assert validate_response.status_code == 200
        assert validate_response.json()["is_valid"] is True
        assert float(validate_response.json()["discount_amount"]) == 20.0  # 25% of 80

        # Step 5: Use coupon in order
        order_response = client.post(
            "/storefront/orders",
            json={
                "customer_full_name": "Coupon User",
                "customer_phone": "+994504444444",
                "shipping_city": "Bakı",
                "shipping_address": "Coupon Street 789",
                "payment_method": "cash_on_delivery",
                "items": [{"product_id": product.id, "quantity": 1}],
                "discount_code": "LIFECYCLE25"
            },
            headers=shop_headers
        )
        assert order_response.status_code == 201
        order_data = order_response.json()
        assert float(order_data["discount"]) == 20.0

        # Step 6: Check coupon usage count
        get_response = client.get(
            f"/admin/shops/{test_shop.id}/coupons/{coupon_id}",
            headers=auth_headers
        )
        assert get_response.status_code == 200
        assert get_response.json()["usage_count"] == 1

        # Step 7: Deactivate coupon
        deactivate_response = client.put(
            f"/admin/shops/{test_shop.id}/coupons/{coupon_id}",
            json={"is_active": False},
            headers=auth_headers
        )
        assert deactivate_response.status_code == 200
        assert deactivate_response.json()["is_active"] is False

        # Step 8: Verify deactivated coupon doesn't work
        validate_again = client.post(
            "/storefront/validate-coupon",
            json={
                "code": "LIFECYCLE25",
                "items": [{"product_id": product.id, "quantity": 1, "price": 80.00}]
            },
            headers=shop_headers
        )
        assert validate_again.status_code == 200
        assert validate_again.json()["is_valid"] is False


class TestMultiShopIsolation:
    """Test that shops are properly isolated."""

    def test_shop_isolation(self, client: TestClient, db_session):
        """Test that shops cannot access each other's data."""
        from app.utils.security import get_password_hash, create_access_token

        # Create two users
        user1 = User(
            email="owner1@shop1.com",
            full_name="Shop 1 Owner",
            phone="+994505555551",
            hashed_password=get_password_hash("password123"),
        )
        user2 = User(
            email="owner2@shop2.com",
            full_name="Shop 2 Owner",
            phone="+994505555552",
            hashed_password=get_password_hash("password123"),
        )
        db_session.add_all([user1, user2])
        db_session.commit()

        # Create two shops
        shop1 = Shop(
            name="Shop 1",
            subdomain="shop1",
            slug="shop-1",
            owner_id=user1.id,
            is_active=True,
        )
        shop2 = Shop(
            name="Shop 2",
            subdomain="shop2",
            slug="shop-2",
            owner_id=user2.id,
            is_active=True,
        )
        db_session.add_all([shop1, shop2])
        db_session.commit()

        # Add products to each shop
        product1 = Product(
            name="Shop 1 Product",
            slug="shop1-product",
            price=50.00,
            inventory_count=10,
            shop_id=shop1.id,
        )
        product2 = Product(
            name="Shop 2 Product",
            slug="shop2-product",
            price=60.00,
            inventory_count=10,
            shop_id=shop2.id,
        )
        db_session.add_all([product1, product2])
        db_session.commit()

        # Get auth tokens
        token1 = create_access_token(data={"sub": user1.email})
        token2 = create_access_token(data={"sub": user2.email})
        headers1 = {"Authorization": f"Bearer {token1}"}
        headers2 = {"Authorization": f"Bearer {token2}"}

        # User 1 lists their products
        response1 = client.get(
            f"/admin/shops/{shop1.id}/products",
            headers=headers1
        )
        assert response1.status_code == 200
        products1 = response1.json()["products"]
        assert all(p["shop_id"] == shop1.id for p in products1)

        # User 2 lists their products
        response2 = client.get(
            f"/admin/shops/{shop2.id}/products",
            headers=headers2
        )
        assert response2.status_code == 200
        products2 = response2.json()["products"]
        assert all(p["shop_id"] == shop2.id for p in products2)

        # Shop 1 storefront should only see Shop 1 products
        shop1_headers = {"X-Shop-Subdomain": shop1.subdomain}
        storefront1 = client.get("/storefront/products", headers=shop1_headers)
        assert storefront1.status_code == 200
        assert all(p["shop_id"] == shop1.id for p in storefront1.json()["products"])

        # Shop 2 storefront should only see Shop 2 products
        shop2_headers = {"X-Shop-Subdomain": shop2.subdomain}
        storefront2 = client.get("/storefront/products", headers=shop2_headers)
        assert storefront2.status_code == 200
        assert all(p["shop_id"] == shop2.id for p in storefront2.json()["products"])


class TestSubscriptionKillSwitch:
    """Test subscription-based access control."""

    def test_expired_shop_access(self, client: TestClient, test_shop: Shop, db_session):
        """Test that expired shops are inaccessible."""
        shop_headers = {"X-Shop-Subdomain": test_shop.subdomain}

        # Shop should be accessible when active
        response1 = client.get("/storefront/shop", headers=shop_headers)
        assert response1.status_code == 200

        # Deactivate shop (simulate expired subscription)
        test_shop.is_active = False
        db_session.commit()

        # Shop should now be inaccessible
        response2 = client.get("/storefront/shop", headers=shop_headers)
        assert response2.status_code == 403

        # Reactivate for other tests
        test_shop.is_active = True
        db_session.commit()

    def test_admin_access_expired_shop(self, client: TestClient, auth_headers: dict, test_shop: Shop, db_session):
        """Test admin access to expired shop."""
        # Deactivate shop
        test_shop.is_active = False
        db_session.commit()

        # Admin should still be able to access shop settings
        response = client.get(
            f"/admin/shops/{test_shop.id}",
            headers=auth_headers
        )
        # Should succeed (admin needs to manage even expired shops)
        assert response.status_code == 200

        # Reactivate
        test_shop.is_active = True
        db_session.commit()


class TestDataIntegrity:
    """Test data integrity across operations."""

    def test_order_preserves_product_snapshot(self, client: TestClient, test_shop: Shop, db_session):
        """Test that order preserves product data even after product is deleted."""
        # Create product
        product = Product(
            name="Snapshot Product",
            slug="snapshot-product",
            price=75.00,
            inventory_count=20,
            shop_id=test_shop.id,
        )
        db_session.add(product)
        db_session.commit()
        db_session.refresh(product)

        # Create customer
        customer = Customer(
            full_name="Snapshot Customer",
            phone="+994506666666",
            city="Bakı",
            address_line="Snapshot Street 321",
        )
        db_session.add(customer)
        db_session.commit()

        # Create order with item
        order = Order(
            order_number="ORD-SNAPSHOT-001",
            shop_id=test_shop.id,
            customer_id=customer.id,
            status=OrderStatus.PENDING,
            payment_method=PaymentMethod.CASH_ON_DELIVERY,
            payment_status=PaymentStatus.PENDING,
            subtotal=Decimal("75.00"),
            shipping_fee=Decimal("0.00"),
            discount=Decimal("0.00"),
            total=Decimal("75.00"),
            customer_name=customer.full_name,
            customer_phone=customer.phone,
            shipping_city=customer.city,
            shipping_address=customer.address_line,
        )
        db_session.add(order)
        db_session.commit()
        db_session.refresh(order)

        order_item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            product_name=product.name,
            quantity=1,
            unit_price=Decimal("75.00"),
            total_price=Decimal("75.00"),
        )
        db_session.add(order_item)
        db_session.commit()
        db_session.refresh(order_item)

        # Save order item details
        item_name = order_item.product_name
        item_price = order_item.unit_price

        # Delete product
        db_session.delete(product)
        db_session.commit()

        # Order item should still have product data
        assert order_item.product_name == item_name
        assert order_item.unit_price == item_price
