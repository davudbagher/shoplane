"""
Test Orders API
Tests for: /storefront/orders (create), /admin/orders/* (manage)
"""
import pytest
from fastapi.testclient import TestClient
from app.models.user import User
from app.models.shop import Shop
from app.models.product import Product
from app.models.customer import Customer
from app.models.order import Order, OrderStatus, PaymentStatus, PaymentMethod
from app.models.order_item import OrderItem
from decimal import Decimal


class TestCreateOrder:
    """Test order creation (checkout) endpoint."""

    def test_create_order_success(self, client: TestClient, test_shop: Shop, test_product: Product, shop_headers: dict):
        """Test successful order creation."""
        order_data = {
            "customer_full_name": "Test Customer",
            "customer_phone": "+994505555555",
            "customer_email": "customer@example.com",
            "shipping_city": "Bakı",
            "shipping_district": "Nəsimi",
            "shipping_address": "Test Street 123, Apt 5",
            "payment_method": "cash_on_delivery",
            "items": [
                {"product_id": test_product.id, "quantity": 2}
            ]
        }
        
        response = client.post(
            "/storefront/orders",
            json=order_data,
            headers=shop_headers
        )
        assert response.status_code == 201
        data = response.json()
        assert "order_number" in data
        assert data["customer_name"] == "Test Customer"
        assert data["customer_phone"] == "+994505555555"
        assert float(data["subtotal"]) == float(test_product.price * 2)
        assert len(data["items"]) == 1
        assert data["items"][0]["quantity"] == 2

    def test_create_order_multiple_items(self, client: TestClient, test_shop: Shop, db_session, shop_headers: dict):
        """Test order with multiple products."""
        # Create two products
        product1 = Product(
            name="Product 1",
            slug="product-1",
            price=25.00,
            inventory_count=50,
            shop_id=test_shop.id,
        )
        product2 = Product(
            name="Product 2",
            slug="product-2",
            price=35.00,
            inventory_count=30,
            shop_id=test_shop.id,
        )
        db_session.add_all([product1, product2])
        db_session.commit()
        
        order_data = {
            "customer_full_name": "Multi Item Customer",
            "customer_phone": "+994506666666",
            "shipping_city": "Gəncə",
            "shipping_address": "Main Street 456",
            "payment_method": "cash_on_delivery",
            "items": [
                {"product_id": product1.id, "quantity": 1},
                {"product_id": product2.id, "quantity": 3}
            ]
        }
        
        response = client.post(
            "/storefront/orders",
            json=order_data,
            headers=shop_headers
        )
        assert response.status_code == 201
        data = response.json()
        assert len(data["items"]) == 2
        expected_total = (25.00 * 1) + (35.00 * 3)
        assert float(data["subtotal"]) == expected_total

    def test_create_order_insufficient_stock(self, client: TestClient, test_shop: Shop, db_session, shop_headers: dict):
        """Test order with insufficient inventory."""
        product = Product(
            name="Limited Stock",
            slug="limited-stock",
            price=50.00,
            inventory_count=2,
            track_inventory=True,
            allow_backorder=False,
            shop_id=test_shop.id,
        )
        db_session.add(product)
        db_session.commit()
        
        order_data = {
            "customer_full_name": "Greedy Customer",
            "customer_phone": "+994507777777",
            "shipping_city": "Bakı",
            "shipping_address": "Some Street 789",
            "payment_method": "cash_on_delivery",
            "items": [
                {"product_id": product.id, "quantity": 5}  # Only 2 in stock
            ]
        }
        
        response = client.post(
            "/storefront/orders",
            json=order_data,
            headers=shop_headers
        )
        assert response.status_code == 400
        assert "stock" in response.json()["detail"].lower()

    def test_create_order_with_backorder(self, client: TestClient, test_shop: Shop, db_session, shop_headers: dict):
        """Test order with backorder allowed."""
        product = Product(
            name="Backorder Product",
            slug="backorder-product",
            price=40.00,
            inventory_count=0,
            track_inventory=True,
            allow_backorder=True,  # Allows selling out of stock
            shop_id=test_shop.id,
        )
        db_session.add(product)
        db_session.commit()
        
        order_data = {
            "customer_full_name": "Patient Customer",
            "customer_phone": "+994508888888",
            "shipping_city": "Sumqayıt",
            "shipping_address": "Another Street 321",
            "payment_method": "cash_on_delivery",
            "items": [
                {"product_id": product.id, "quantity": 3}
            ]
        }
        
        response = client.post(
            "/storefront/orders",
            json=order_data,
            headers=shop_headers
        )
        assert response.status_code == 201
        data = response.json()
        assert len(data["items"]) == 1

    def test_create_order_invalid_payment_method(self, client: TestClient, test_shop: Shop, test_product: Product, shop_headers: dict):
        """Test order with invalid payment method."""
        order_data = {
            "customer_full_name": "Invalid Payment Customer",
            "customer_phone": "+994509999999",
            "shipping_city": "Bakı",
            "shipping_address": "Payment Street 111",
            "payment_method": "invalid_method",  # Not in enum
            "items": [
                {"product_id": test_product.id, "quantity": 1}
            ]
        }
        
        response = client.post(
            "/storefront/orders",
            json=order_data,
            headers=shop_headers
        )
        assert response.status_code == 422  # Validation error

    def test_create_order_cod_not_allowed(self, client: TestClient, db_session, test_shop: Shop, test_product: Product, shop_headers: dict):
        """Test order when shop doesn't allow COD."""
        # Update shop to disable COD
        test_shop.allow_cod = False
        db_session.commit()
        
        order_data = {
            "customer_full_name": "COD Customer",
            "customer_phone": "+994501234567",
            "shipping_city": "Bakı",
            "shipping_address": "COD Street 222",
            "payment_method": "cash_on_delivery",
            "items": [
                {"product_id": test_product.id, "quantity": 1}
            ]
        }
        
        response = client.post(
            "/storefront/orders",
            json=order_data,
            headers=shop_headers
        )
        assert response.status_code == 400
        assert "cash on delivery" in response.json()["detail"].lower()

    def test_create_order_reduces_inventory(self, client: TestClient, test_shop: Shop, db_session, shop_headers: dict):
        """Test that order creation reduces inventory count."""
        product = Product(
            name="Inventory Test Product",
            slug="inventory-test",
            price=30.00,
            inventory_count=10,
            track_inventory=True,
            shop_id=test_shop.id,
        )
        db_session.add(product)
        db_session.commit()
        db_session.refresh(product)
        
        initial_stock = product.inventory_count
        
        order_data = {
            "customer_full_name": "Inventory Customer",
            "customer_phone": "+994502345678",
            "shipping_city": "Bakı",
            "shipping_address": "Inventory Street 333",
            "payment_method": "cash_on_delivery",
            "items": [
                {"product_id": product.id, "quantity": 3}
            ]
        }
        
        response = client.post(
            "/storefront/orders",
            json=order_data,
            headers=shop_headers
        )
        assert response.status_code == 201
        
        # Check inventory was reduced
        db_session.refresh(product)
        assert product.inventory_count == initial_stock - 3

    def test_create_order_missing_required_fields(self, client: TestClient, test_shop: Shop, shop_headers: dict):
        """Test order creation with missing required fields."""
        order_data = {
            "customer_full_name": "Incomplete Customer",
            # Missing phone, address, items
        }
        
        response = client.post(
            "/storefront/orders",
            json=order_data,
            headers=shop_headers
        )
        assert response.status_code == 422

    def test_create_order_empty_items(self, client: TestClient, test_shop: Shop, shop_headers: dict):
        """Test order creation with empty items list."""
        order_data = {
            "customer_full_name": "Empty Cart Customer",
            "customer_phone": "+994503456789",
            "shipping_city": "Bakı",
            "shipping_address": "Empty Street 444",
            "payment_method": "cash_on_delivery",
            "items": []  # No items
        }
        
        response = client.post(
            "/storefront/orders",
            json=order_data,
            headers=shop_headers
        )
        assert response.status_code == 422

    def test_create_order_nonexistent_product(self, client: TestClient, test_shop: Shop, shop_headers: dict):
        """Test order with non-existent product."""
        order_data = {
            "customer_full_name": "Ghost Product Customer",
            "customer_phone": "+994504567890",
            "shipping_city": "Bakı",
            "shipping_address": "Ghost Street 555",
            "payment_method": "cash_on_delivery",
            "items": [
                {"product_id": 99999, "quantity": 1}  # Doesn't exist
            ]
        }
        
        response = client.post(
            "/storefront/orders",
            json=order_data,
            headers=shop_headers
        )
        assert response.status_code == 404


class TestOrderWithCoupon:
    """Test order creation with coupon discount."""

    def test_create_order_with_percentage_coupon(self, client: TestClient, test_shop: Shop, test_product: Product, test_coupon, shop_headers: dict):
        """Test order with percentage discount coupon."""
        order_data = {
            "customer_full_name": "Coupon Customer",
            "customer_phone": "+994505678901",
            "shipping_city": "Bakı",
            "shipping_address": "Discount Street 666",
            "payment_method": "cash_on_delivery",
            "items": [
                {"product_id": test_product.id, "quantity": 2}
            ],
            "discount_code": "TEST20"
        }
        
        response = client.post(
            "/storefront/orders",
            json=order_data,
            headers=shop_headers
        )
        assert response.status_code == 201
        data = response.json()
        assert float(data["discount"]) > 0
        assert data["total"] < data["subtotal"]

    def test_create_order_with_invalid_coupon(self, client: TestClient, test_shop: Shop, test_product: Product, shop_headers: dict):
        """Test order with invalid coupon code."""
        order_data = {
            "customer_full_name": "Bad Coupon Customer",
            "customer_phone": "+994506789012",
            "shipping_city": "Bakı",
            "shipping_address": "Invalid Street 777",
            "payment_method": "cash_on_delivery",
            "items": [
                {"product_id": test_product.id, "quantity": 1}
            ],
            "discount_code": "INVALIDCODE"
        }
        
        response = client.post(
            "/storefront/orders",
            json=order_data,
            headers=shop_headers
        )
        # Order should still succeed, just no discount applied
        assert response.status_code == 201


class TestTrackOrder:
    """Test order tracking endpoint."""

    def test_track_order_success(self, client: TestClient, test_shop: Shop, db_session, shop_headers: dict):
        """Test tracking an existing order."""
        # Create an order first
        customer = Customer(
            full_name="Track Customer",
            phone="+994507890123",
            email="track@example.com",
            city="Bakı",
            district="Yasamal",
            address_line="Track Street 888",
        )
        db_session.add(customer)
        db_session.commit()
        
        order = Order(
            order_number="ORD-TEST-001",
            shop_id=test_shop.id,
            customer_id=customer.id,
            status=OrderStatus.PENDING,
            payment_method=PaymentMethod.CASH_ON_DELIVERY,
            payment_status=PaymentStatus.PENDING,
            subtotal=Decimal("50.00"),
            shipping_fee=Decimal("0.00"),
            discount=Decimal("0.00"),
            total=Decimal("50.00"),
            customer_name="Track Customer",
            customer_phone="+994507890123",
            shipping_city="Bakı",
            shipping_address="Track Street 888",
        )
        db_session.add(order)
        db_session.commit()
        
        response = client.get(
            f"/storefront/orders/{order.order_number}",
            params={"phone": customer.phone},
            headers=shop_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["order_number"] == "ORD-TEST-001"

    def test_track_order_wrong_phone(self, client: TestClient, test_shop: Shop, db_session, shop_headers: dict):
        """Test tracking order with wrong phone number."""
        # Create order
        customer = Customer(
            full_name="Wrong Phone Customer",
            phone="+994508901234",
            city="Bakı",
            address_line="Wrong Phone Street 999",
        )
        db_session.add(customer)
        db_session.commit()
        
        order = Order(
            order_number="ORD-TEST-002",
            shop_id=test_shop.id,
            customer_id=customer.id,
            status=OrderStatus.PENDING,
            payment_method=PaymentMethod.CASH_ON_DELIVERY,
            payment_status=PaymentStatus.PENDING,
            subtotal=Decimal("30.00"),
            shipping_fee=Decimal("0.00"),
            discount=Decimal("0.00"),
            total=Decimal("30.00"),
            customer_name="Wrong Phone Customer",
            customer_phone="+994508901234",
            shipping_city="Bakı",
            shipping_address="Wrong Phone Street 999",
        )
        db_session.add(order)
        db_session.commit()
        
        response = client.get(
            f"/storefront/orders/{order.order_number}?phone=%2B994500000000",  # Wrong phone
            headers=shop_headers
        )
        assert response.status_code == 404


class TestAdminOrders:
    """Test admin order management endpoints."""

    def test_admin_list_orders(self, client: TestClient, auth_headers: dict, test_shop: Shop, db_session):
        """Test admin listing orders."""
        # Create orders
        for i in range(5):
            customer = Customer(
                full_name=f"Order Customer {i}",
                phone=f"+99450999999{i}",
                city="Bakı",
                address_line=f"Admin Street {i}",
            )
            db_session.add(customer)
            db_session.commit()
            
            order = Order(
                order_number=f"ORD-ADMIN-{i}",
                shop_id=test_shop.id,
                customer_id=customer.id,
                status=OrderStatus.PENDING,
                payment_method=PaymentMethod.CASH_ON_DELIVERY,
                payment_status=PaymentStatus.PENDING,
                subtotal=Decimal("50.00"),
                shipping_fee=Decimal("0.00"),
                discount=Decimal("0.00"),
                total=Decimal("50.00"),
                customer_name=f"Order Customer {i}",
                customer_phone=f"+99450999999{i}",
                shipping_city="Bakı",
                shipping_address=f"Admin Street {i}",
            )
            db_session.add(order)
        db_session.commit()
        
        response = client.get(
            f"/admin/orders/{test_shop.id}/orders",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "orders" in data
        assert len(data["orders"]) >= 5

    def test_admin_update_order_status(self, client: TestClient, auth_headers: dict, test_shop: Shop, db_session):
        """Test admin updating order status."""
        # Create order
        customer = Customer(
            full_name="Status Update Customer",
            phone="+994501111110",
            city="Bakı",
            address_line="Status Street 111",
        )
        db_session.add(customer)
        db_session.commit()
        
        order = Order(
            order_number="ORD-STATUS-001",
            shop_id=test_shop.id,
            customer_id=customer.id,
            status=OrderStatus.PENDING,
            payment_method=PaymentMethod.CASH_ON_DELIVERY,
            payment_status=PaymentStatus.PENDING,
            subtotal=Decimal("75.00"),
            shipping_fee=Decimal("0.00"),
            discount=Decimal("0.00"),
            total=Decimal("75.00"),
            customer_name="Status Update Customer",
            customer_phone="+994501111110",
            shipping_city="Bakı",
            shipping_address="Status Street 111",
        )
        db_session.add(order)
        db_session.commit()
        db_session.refresh(order)
        
        response = client.put(
            f"/admin/orders/{test_shop.id}/orders/{order.id}/status",
            json={"status": "confirmed"},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "confirmed"

    def test_admin_get_order_stats(self, client: TestClient, auth_headers: dict, test_shop: Shop, db_session):
        """Test admin getting order statistics."""
        response = client.get(
            f"/admin/orders/{test_shop.id}/stats",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_orders" in data
        assert "total_revenue" in data
