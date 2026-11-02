"""
Test access control and hardening
Tests for: shop ownership, image uploads, setup links, coupons at checkout
"""
import io
from datetime import datetime, timedelta, timezone
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.api import upload
from app.models.coupon import Coupon
from app.models.order import Order, OrderStatus, PaymentMethod, PaymentStatus
from app.models.order_item import OrderItem
from app.models.customer import Customer
from app.models.product import Product
from app.models.shop import Shop
from app.models.user import User
from app.utils.security import create_access_token, get_password_hash, verify_password


@pytest.fixture
def stranger_headers(db_session):
    """Auth headers for a logged-in merchant who does not own test_shop."""
    user = User(
        email="stranger@example.com",
        full_name="Other Merchant",
        hashed_password=get_password_hash("strangerpass123"),
        is_active=True,
        is_superuser=False,
    )
    db_session.add(user)
    db_session.commit()
    token = create_access_token(data={"sub": user.email})
    return {"Authorization": f"Bearer {token}"}


def owner_routes(shop_id: int):
    return [
        ("get", f"/admin/orders/{shop_id}/orders"),
        ("get", f"/admin/orders/{shop_id}/orders/1"),
        ("put", f"/admin/orders/{shop_id}/orders/1/status"),
        ("get", f"/admin/orders/{shop_id}/stats"),
        ("post", f"/admin/orders/{shop_id}/orders/1/cancel"),
        ("get", f"/admin/shops/{shop_id}"),
        ("put", f"/admin/shops/{shop_id}"),
        ("delete", f"/admin/shops/{shop_id}"),
        ("get", f"/admin/shops/{shop_id}/payment-settings"),
        ("put", f"/admin/shops/{shop_id}/payment-settings"),
        ("get", f"/admin/shops/{shop_id}/categories"),
        ("post", f"/admin/shops/{shop_id}/categories"),
        ("delete", f"/admin/shops/{shop_id}/categories/1"),
    ]


class TestShopOwnership:
    """Every owner-only route must reject anonymous callers and other merchants."""

    def test_anonymous_is_rejected(self, client: TestClient, test_shop: Shop):
        for method, url in owner_routes(test_shop.id):
            response = client.request(method, url, json={})
            assert response.status_code == 401, f"{method} {url}"

    def test_other_merchant_is_rejected(self, client: TestClient, test_shop: Shop, stranger_headers: dict):
        for method, url in owner_routes(test_shop.id):
            response = client.request(method, url, json={}, headers=stranger_headers)
            assert response.status_code == 403, f"{method} {url}"

    def test_owner_is_allowed(self, client: TestClient, test_shop: Shop, auth_headers: dict):
        response = client.get(f"/admin/orders/{test_shop.id}/orders", headers=auth_headers)
        assert response.status_code == 200

    def test_superuser_is_allowed(self, client: TestClient, test_shop: Shop, test_superuser: User):
        token = create_access_token(data={"sub": test_superuser.email})
        response = client.get(
            f"/admin/shops/{test_shop.id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200

    def test_setup_token_not_in_shop_response(self, client: TestClient, test_shop: Shop, auth_headers: dict):
        response = client.get(f"/admin/shops/{test_shop.id}", headers=auth_headers)
        assert "setup_token" not in response.json()


def image_bytes(image_format: str = "PNG") -> bytes:
    buffer = io.BytesIO()
    Image.new("RGB", (4, 4), "red").save(buffer, format=image_format)
    return buffer.getvalue()


class TestImageUpload:
    """Test authenticated and public image uploads."""

    @pytest.fixture(autouse=True)
    def temp_upload_dir(self, tmp_path, monkeypatch):
        monkeypatch.setattr(upload, "UPLOAD_DIR", str(tmp_path))

    def test_admin_upload_requires_login(self, client: TestClient):
        response = client.post("/admin/upload", files={"file": ("a.png", image_bytes(), "image/png")})
        assert response.status_code == 401

    def test_admin_upload_success(self, client: TestClient, auth_headers: dict):
        response = client.post(
            "/admin/upload",
            files={"file": ("a.png", image_bytes(), "image/png")},
            headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["url"].endswith(".png")

    def test_public_upload_works_without_login(self, client: TestClient):
        response = client.post("/public/upload", files={"file": ("logo.png", image_bytes(), "image/png")})
        assert response.status_code == 200

    def test_extension_comes_from_contents_not_filename(self, client: TestClient):
        response = client.post("/public/upload", files={"file": ("shell.php", image_bytes("JPEG"), "image/jpeg")})
        assert response.status_code == 200
        assert response.json()["url"].endswith(".jpg")

    def test_rejects_html_pretending_to_be_image(self, client: TestClient):
        response = client.post("/public/upload", files={"file": ("x.png", b"<script>alert(1)</script>", "image/png")})
        assert response.status_code == 400

    def test_rejects_svg(self, client: TestClient):
        svg = b'<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'
        response = client.post("/public/upload", files={"file": ("x.svg", svg, "image/svg+xml")})
        assert response.status_code == 400

    def test_rejects_oversized_public_upload(self, client: TestClient):
        response = client.post("/public/upload", files={"file": ("big.png", b"0" * 2097153, "image/png")})
        assert response.status_code == 413


class TestSetupPassword:
    """Test the single-use merchant setup link."""

    def test_sets_password_and_burns_token(self, client: TestClient, test_shop: Shop, test_user: User, db_session):
        test_shop.setup_token = "t" * 43
        db_session.commit()

        response = client.post("/auth/setup-password", json={"token": "t" * 43, "password": "brandnewpass1"})
        assert response.status_code == 200
        assert response.json()["email"] == test_user.email

        db_session.refresh(test_user)
        db_session.refresh(test_shop)
        assert verify_password("brandnewpass1", test_user.hashed_password)
        assert test_shop.setup_token is None

        response = client.post("/auth/setup-password", json={"token": "t" * 43, "password": "anotherpass12"})
        assert response.status_code == 400

    def test_rejects_unknown_token(self, client: TestClient):
        response = client.post("/auth/setup-password", json={"token": "x" * 43, "password": "brandnewpass1"})
        assert response.status_code == 400

    def test_rejects_short_password(self, client: TestClient, test_shop: Shop, db_session):
        test_shop.setup_token = "t" * 43
        db_session.commit()
        response = client.post("/auth/setup-password", json={"token": "t" * 43, "password": "short"})
        assert response.status_code == 422


class TestCheckoutCoupons:
    """Checkout must apply the same coupon rules as /validate-coupon."""

    @pytest.mark.parametrize("fields", [
        {"ends_at": datetime.now(timezone.utc) - timedelta(days=1)},
        {"starts_at": datetime.now(timezone.utc) + timedelta(days=1)},
        {"is_active": False},
    ])
    def test_dead_coupon_gives_no_discount(
        self, client: TestClient, test_shop: Shop, test_product: Product, db_session, shop_headers: dict, fields: dict
    ):
        coupon = Coupon(
            code="DEAD50",
            discount_type="percentage",
            discount_value=50.0,
            scope="all_products",
            shop_id=test_shop.id,
            **{"is_active": True, **fields},
        )
        db_session.add(coupon)
        db_session.commit()

        response = client.post(
            "/storefront/orders",
            json={
                "customer_full_name": "Coupon Customer",
                "customer_phone": "+994501234567",
                "shipping_city": "Bakı",
                "shipping_address": "Coupon Street 1",
                "payment_method": "cash_on_delivery",
                "discount_code": "DEAD50",
                "items": [{"product_id": test_product.id, "quantity": 1}],
            },
            headers=shop_headers
        )
        assert response.status_code == 201
        assert float(response.json()["discount"]) == 0.0


class TestProductDeletion:
    """Merchants can delete a sold product without losing the order history."""

    def test_delete_product_with_orders(
        self, client: TestClient, test_shop: Shop, test_product: Product, auth_headers: dict, db_session
    ):
        customer = Customer(full_name="Buyer", phone="+994501111111", city="Bakı", address_line="Street 1")
        db_session.add(customer)
        db_session.commit()
        order = Order(
            order_number="ORD-DELETE-001",
            shop_id=test_shop.id,
            customer_id=customer.id,
            status=OrderStatus.PENDING,
            payment_method=PaymentMethod.CASH_ON_DELIVERY,
            payment_status=PaymentStatus.PENDING,
            subtotal=Decimal("29.99"),
            total=Decimal("29.99"),
            customer_name="Buyer",
            customer_phone="+994501111111",
            shipping_address="Street 1",
            shipping_city="Bakı",
        )
        db_session.add(order)
        db_session.commit()
        db_session.add(OrderItem(
            order_id=order.id,
            product_id=test_product.id,
            product_name=test_product.name,
            quantity=1,
            unit_price=Decimal("29.99"),
            total_price=Decimal("29.99"),
        ))
        db_session.commit()

        response = client.delete(
            f"/admin/shops/{test_shop.id}/products/{test_product.id}",
            headers=auth_headers
        )
        assert response.status_code == 204

        response = client.get(f"/admin/orders/{test_shop.id}/orders/{order.id}", headers=auth_headers)
        assert response.status_code == 200
        item = response.json()["items"][0]
        assert item["product_id"] is None
        assert item["product_name"] == "Test Product"


class TestRealWorldInputs:
    """Inputs that broke against real data."""

    def test_real_azerbaijani_iban_is_accepted(self, client: TestClient, test_shop: Shop, auth_headers: dict):
        response = client.put(
            f"/admin/shops/{test_shop.id}/payment-settings",
            json={"millikart_enabled": True, "millikart_iban": "AZ21NABZ00000000137010001944"},
            headers=auth_headers
        )
        assert response.status_code == 200

    def test_cors_allows_shop_subdomain(self, client: TestClient):
        response = client.options(
            "/health",
            headers={"Origin": "https://cheechak.1line.az", "Access-Control-Request-Method": "GET"}
        )
        assert response.headers.get("access-control-allow-origin") == "https://cheechak.1line.az"

    def test_cors_blocks_lookalike_domain(self, client: TestClient):
        response = client.options(
            "/health",
            headers={"Origin": "https://evil1line.az", "Access-Control-Request-Method": "GET"}
        )
        assert "access-control-allow-origin" not in response.headers
