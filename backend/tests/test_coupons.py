"""
Test Coupons API
Tests for: /storefront/validate-coupon, /admin/shops/{shop_id}/coupons/*
"""
import pytest
from fastapi.testclient import TestClient
from app.models.user import User
from app.models.shop import Shop
from app.models.product import Product
from app.models.coupon import Coupon
from datetime import datetime, timedelta, timezone
from decimal import Decimal


class TestCouponValidation:
    """Test coupon validation endpoint."""

    def test_validate_valid_coupon(self, client: TestClient, test_shop: Shop, test_coupon: Coupon, shop_headers: dict):
        """Test validating a valid coupon."""
        validation_data = {
            "code": "TEST20",
            "items": [
                {"product_id": 1, "quantity": 2, "price": 29.99}
            ]
        }
        
        response = client.post(
            "/storefront/validate-coupon",
            json=validation_data,
            headers=shop_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_valid"] is True
        assert float(data["discount_amount"]) > 0
        assert "uğur" in data["message"].lower()  # Azerbaijani success message

    def test_validate_invalid_coupon_code(self, client: TestClient, test_shop: Shop, shop_headers: dict):
        """Test validating non-existent coupon."""
        validation_data = {
            "code": "INVALIDCODE",
            "items": [
                {"product_id": 1, "quantity": 1, "price": 50.00}
            ]
        }
        
        response = client.post(
            "/storefront/validate-coupon",
            json=validation_data,
            headers=shop_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_valid"] is False
        assert float(data["discount_amount"]) == 0.0

    def test_validate_expired_coupon(self, client: TestClient, test_shop: Shop, db_session, shop_headers: dict):
        """Test validating expired coupon."""
        expired_coupon = Coupon(
            code="EXPIRED",
            discount_type="percentage",
            discount_value=15.0,
            scope="all_products",
            is_active=True,
            shop_id=test_shop.id,
            ends_at=datetime.now(timezone.utc) - timedelta(days=1),  # Expired yesterday
        )
        db_session.add(expired_coupon)
        db_session.commit()
        
        validation_data = {
            "code": "EXPIRED",
            "items": [
                {"product_id": 1, "quantity": 1, "price": 100.00}
            ]
        }
        
        response = client.post(
            "/storefront/validate-coupon",
            json=validation_data,
            headers=shop_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_valid"] is False

    def test_validate_inactive_coupon(self, client: TestClient, test_shop: Shop, db_session, shop_headers: dict):
        """Test validating inactive coupon."""
        inactive_coupon = Coupon(
            code="INACTIVE",
            discount_type="fixed_amount",
            discount_value=10.0,
            scope="all_products",
            is_active=False,  # Inactive
            shop_id=test_shop.id,
        )
        db_session.add(inactive_coupon)
        db_session.commit()
        
        validation_data = {
            "code": "INACTIVE",
            "items": [
                {"product_id": 1, "quantity": 1, "price": 50.00}
            ]
        }
        
        response = client.post(
            "/storefront/validate-coupon",
            json=validation_data,
            headers=shop_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_valid"] is False

    def test_validate_coupon_usage_limit_reached(self, client: TestClient, test_shop: Shop, db_session, shop_headers: dict):
        """Test validating coupon that reached usage limit."""
        limited_coupon = Coupon(
            code="LIMITED",
            discount_type="percentage",
            discount_value=25.0,
            scope="all_products",
            is_active=True,
            shop_id=test_shop.id,
            usage_limit=5,
            usage_count=5,  # Already used 5 times
        )
        db_session.add(limited_coupon)
        db_session.commit()
        
        validation_data = {
            "code": "LIMITED",
            "items": [
                {"product_id": 1, "quantity": 1, "price": 80.00}
            ]
        }
        
        response = client.post(
            "/storefront/validate-coupon",
            json=validation_data,
            headers=shop_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_valid"] is False

    def test_validate_percentage_coupon_calculation(self, client: TestClient, test_shop: Shop, test_coupon: Coupon, shop_headers: dict):
        """Test percentage discount calculation."""
        # 20% off on 100 AZN = 20 AZN discount
        validation_data = {
            "code": "TEST20",
            "items": [
                {"product_id": 1, "quantity": 1, "price": 100.00}
            ]
        }
        
        response = client.post(
            "/storefront/validate-coupon",
            json=validation_data,
            headers=shop_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_valid"] is True
        assert float(data["discount_amount"]) == 20.0  # 20% of 100

    def test_validate_fixed_amount_coupon(self, client: TestClient, test_shop: Shop, db_session, shop_headers: dict):
        """Test fixed amount discount calculation."""
        fixed_coupon = Coupon(
            code="FIXED10",
            discount_type="fixed_amount",
            discount_value=10.0,
            scope="all_products",
            is_active=True,
            shop_id=test_shop.id,
        )
        db_session.add(fixed_coupon)
        db_session.commit()
        
        validation_data = {
            "code": "FIXED10",
            "items": [
                {"product_id": 1, "quantity": 1, "price": 50.00}
            ]
        }
        
        response = client.post(
            "/storefront/validate-coupon",
            json=validation_data,
            headers=shop_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_valid"] is True
        assert float(data["discount_amount"]) == 10.0

    def test_validate_coupon_scope_specific_products(self, client: TestClient, test_shop: Shop, db_session, shop_headers: dict):
        """Test coupon scoped to specific products."""
        # Create products
        product1 = Product(
            name="Eligible Product",
            slug="eligible",
            price=50.00,
            inventory_count=10,
            shop_id=test_shop.id,
        )
        product2 = Product(
            name="Non-Eligible Product",
            slug="non-eligible",
            price=30.00,
            inventory_count=10,
            shop_id=test_shop.id,
        )
        db_session.add_all([product1, product2])
        db_session.commit()
        db_session.refresh(product1)
        db_session.refresh(product2)
        
        # Coupon only for product1
        scoped_coupon = Coupon(
            code="SCOPED",
            discount_type="percentage",
            discount_value=10.0,
            scope="specific_products",
            applicable_product_ids=[product1.id],
            is_active=True,
            shop_id=test_shop.id,
        )
        db_session.add(scoped_coupon)
        db_session.commit()
        
        # Valid for eligible product
        validation_data = {
            "code": "SCOPED",
            "items": [
                {"product_id": product1.id, "quantity": 1, "price": 50.00}
            ]
        }
        
        response = client.post(
            "/storefront/validate-coupon",
            json=validation_data,
            headers=shop_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_valid"] is True
        
        # Invalid for non-eligible product
        validation_data = {
            "code": "SCOPED",
            "items": [
                {"product_id": product2.id, "quantity": 1, "price": 30.00}
            ]
        }
        
        response = client.post(
            "/storefront/validate-coupon",
            json=validation_data,
            headers=shop_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_valid"] is False


class TestAdminCoupons:
    """Test admin coupon management endpoints."""

    def test_create_coupon_success(self, client: TestClient, auth_headers: dict, test_shop: Shop):
        """Test successful coupon creation."""
        coupon_data = {
            "code": "NEWCOUPON",
            "discount_type": "percentage",
            "discount_value": 15.0,
            "scope": "all_products",
            "is_active": True,
            "usage_limit": 50,
        }
        
        response = client.post(
            f"/admin/shops/{test_shop.id}/coupons",
            json=coupon_data,
            headers=auth_headers
        )
        assert response.status_code == 201
        data = response.json()
        assert data["code"] == "NEWCOUPON"
        assert data["discount_type"] == "percentage"
        assert float(data["discount_value"]) == 15.0

    def test_create_coupon_duplicate_code(self, client: TestClient, auth_headers: dict, test_shop: Shop, test_coupon: Coupon):
        """Test creating coupon with duplicate code."""
        coupon_data = {
            "code": "TEST20",  # Already exists
            "discount_type": "fixed_amount",
            "discount_value": 5.0,
            "scope": "all_products",
            "is_active": True,
        }
        
        response = client.post(
            f"/admin/shops/{test_shop.id}/coupons",
            json=coupon_data,
            headers=auth_headers
        )
        assert response.status_code in [400, 409, 422]

    def test_list_coupons(self, client: TestClient, auth_headers: dict, test_shop: Shop, db_session):
        """Test listing all coupons."""
        # Create multiple coupons
        for i in range(5):
            coupon = Coupon(
                code=f"COUPON{i}",
                discount_type="percentage",
                discount_value=10.0 + i,
                scope="all_products",
                is_active=True,
                shop_id=test_shop.id,
            )
            db_session.add(coupon)
        db_session.commit()
        
        response = client.get(
            f"/admin/shops/{test_shop.id}/coupons",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 5

    def test_get_coupon_by_id(self, client: TestClient, auth_headers: dict, test_shop: Shop, test_coupon: Coupon):
        """Test getting single coupon."""
        response = client.get(
            f"/admin/shops/{test_shop.id}/coupons/{test_coupon.id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == test_coupon.code

    def test_update_coupon(self, client: TestClient, auth_headers: dict, test_shop: Shop, test_coupon: Coupon):
        """Test updating coupon."""
        update_data = {
            "discount_value": 30.0,
            "is_active": False,
        }
        
        response = client.put(
            f"/admin/shops/{test_shop.id}/coupons/{test_coupon.id}",
            json=update_data,
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert float(data["discount_value"]) == 30.0
        assert data["is_active"] is False

    def test_delete_coupon(self, client: TestClient, auth_headers: dict, test_shop: Shop, db_session):
        """Test deleting coupon."""
        # Create coupon to delete
        coupon = Coupon(
            code="DELETEME",
            discount_type="percentage",
            discount_value=5.0,
            scope="all_products",
            is_active=True,
            shop_id=test_shop.id,
        )
        db_session.add(coupon)
        db_session.commit()
        db_session.refresh(coupon)
        
        response = client.delete(
            f"/admin/shops/{test_shop.id}/coupons/{coupon.id}",
            headers=auth_headers
        )
        assert response.status_code == 204
        
        # Verify deletion
        response = client.get(
            f"/admin/shops/{test_shop.id}/coupons/{coupon.id}",
            headers=auth_headers
        )
        assert response.status_code in [404, 400]

    def test_create_coupon_with_dates(self, client: TestClient, auth_headers: dict, test_shop: Shop):
        """Test creating coupon with start and end dates."""
        starts_at = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
        ends_at = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
        
        coupon_data = {
            "code": "DATED",
            "discount_type": "percentage",
            "discount_value": 20.0,
            "scope": "all_products",
            "is_active": True,
            "starts_at": starts_at,
            "ends_at": ends_at,
        }
        
        response = client.post(
            f"/admin/shops/{test_shop.id}/coupons",
            json=coupon_data,
            headers=auth_headers
        )
        assert response.status_code == 201
        data = response.json()
        assert data["code"] == "DATED"
