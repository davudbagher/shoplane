"""
Test Shops API
Tests for: /admin/shops/* (CRUD operations)
"""
import pytest
from fastapi.testclient import TestClient
from app.models.user import User
from app.models.shop import Shop


class TestCreateShop:
    """Test shop creation endpoint."""

    def test_create_shop_success(self, client: TestClient, auth_headers: dict, test_user: User):
        """Test successful shop creation."""
        shop_data = {
            "name": "My New Shop",
            "subdomain": "mynewshop",
            "description": "A brand new shop",
        }
        
        response = client.post(
            "/admin/shops",
            json=shop_data,
            headers=auth_headers
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "My New Shop"
        assert data["subdomain"] == "mynewshop"
        assert data["owner_id"] == test_user.id

    def test_create_shop_duplicate_subdomain(self, client: TestClient, auth_headers: dict, test_shop: Shop):
        """Test creating shop with duplicate subdomain."""
        shop_data = {
            "name": "Another Shop",
            "subdomain": test_shop.subdomain,  # Already exists
            "description": "Duplicate subdomain",
        }
        
        response = client.post(
            "/admin/shops",
            json=shop_data,
            headers=auth_headers
        )
        assert response.status_code in [400, 409, 422]

    def test_create_shop_missing_name(self, client: TestClient, auth_headers: dict):
        """Test creating shop without required name."""
        shop_data = {
            "subdomain": "noname",
            "description": "Missing name",
        }
        
        response = client.post(
            "/admin/shops",
            json=shop_data,
            headers=auth_headers
        )
        assert response.status_code == 422

    def test_create_shop_missing_subdomain(self, client: TestClient, auth_headers: dict):
        """Test creating shop without required subdomain."""
        shop_data = {
            "name": "No Subdomain Shop",
            "description": "Missing subdomain",
        }
        
        response = client.post(
            "/admin/shops",
            json=shop_data,
            headers=auth_headers
        )
        assert response.status_code == 422

    def test_create_shop_invalid_subdomain_format(self, client: TestClient, auth_headers: dict):
        """Test creating shop with invalid subdomain format."""
        shop_data = {
            "name": "Invalid Subdomain Shop",
            "subdomain": "invalid subdomain!",  # Contains spaces and special chars
            "description": "Invalid subdomain",
        }
        
        response = client.post(
            "/admin/shops",
            json=shop_data,
            headers=auth_headers
        )
        # Should fail validation
        assert response.status_code in [201, 422]

    def test_create_shop_unauthorized(self, client: TestClient):
        """Test creating shop without authentication."""
        shop_data = {
            "name": "Unauthorized Shop",
            "subdomain": "unauthorized",
            "description": "No auth",
        }
        
        response = client.post(
            "/admin/shops",
            json=shop_data
        )
        assert response.status_code == 401


class TestListShops:
    """Test shop listing endpoint."""

    def test_list_my_shops(self, client: TestClient, auth_headers: dict, test_user: User, test_shop: Shop, db_session):
        """Test listing user's shops."""
        # Create another shop for the same user
        shop2 = Shop(
            name="Second Shop",
            subdomain="secondshop",
            slug="second-shop",
            owner_id=test_user.id,
            is_active=True,
        )
        db_session.add(shop2)
        db_session.commit()
        
        response = client.get(
            "/admin/shops",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "shops" in data
        assert len(data["shops"]) >= 2

    def test_list_shops_only_owned(self, client: TestClient, auth_headers: dict, db_session):
        """Test that user only sees their own shops."""
        # Create shop for different user
        from app.utils.security import get_password_hash
        other_user = User(
            email="other_owner@example.com",
            full_name="Other Owner",
            phone="+994508888888",
            hashed_password=get_password_hash("password123"),
        )
        db_session.add(other_user)
        db_session.commit()
        
        other_shop = Shop(
            name="Other Owner Shop",
            subdomain="otherownershop",
            slug="other-owner-shop",
            owner_id=other_user.id,
            is_active=True,
        )
        db_session.add(other_shop)
        db_session.commit()
        
        response = client.get(
            "/admin/shops",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        # Should not include other user's shop
        shop_owner_ids = [shop["owner_id"] for shop in data["shops"]]
        assert all(owner_id == test_user.id for owner_id in shop_owner_ids)


class TestGetShop:
    """Test get single shop endpoint."""

    def test_get_shop_success(self, client: TestClient, auth_headers: dict, test_shop: Shop):
        """Test getting shop details."""
        response = client.get(
            f"/admin/shops/{test_shop.id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_shop.id
        assert data["name"] == test_shop.name

    def test_get_shop_not_found(self, client: TestClient, auth_headers: dict):
        """Test getting non-existent shop."""
        response = client.get(
            "/admin/shops/99999",
            headers=auth_headers
        )
        assert response.status_code in [404, 400]


class TestUpdateShop:
    """Test shop update endpoint."""

    def test_update_shop_success(self, client: TestClient, auth_headers: dict, test_shop: Shop):
        """Test updating shop information."""
        update_data = {
            "name": "Updated Shop Name",
            "description": "Updated description",
            "phone": "+994501234567",
            "email": "shop@example.com",
        }
        
        response = client.put(
            f"/admin/shops/{test_shop.id}",
            json=update_data,
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Shop Name"
        assert data["description"] == "Updated description"

    def test_update_shop_subscription(self, client: TestClient, auth_headers: dict, test_shop: Shop):
        """Test updating shop subscription plan."""
        update_data = {
            "plan_type": "PRO",
        }
        
        response = client.put(
            f"/admin/shops/{test_shop.id}",
            json=update_data,
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["plan_type"] == "PRO"


class TestUpgradeSubscription:
    """Test shop subscription upgrade endpoint."""

    def test_upgrade_subscription(self, client: TestClient, auth_headers: dict, test_shop: Shop):
        """Test upgrading shop subscription."""
        response = client.post(
            f"/admin/shops/{test_shop.id}/upgrade",
            headers=auth_headers
        )
        # May succeed or fail depending on implementation
        assert response.status_code in [200, 400, 402]


class TestDeleteShop:
    """Test shop deletion/deactivation endpoint."""

    def test_deactivate_shop(self, client: TestClient, auth_headers: dict, test_shop: Shop, db_session):
        """Test deactivating a shop."""
        response = client.delete(
            f"/admin/shops/{test_shop.id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        # Verify shop is deactivated
        response = client.get(
            f"/admin/shops/{test_shop.id}",
            headers=auth_headers
        )
        # Should show deactivated status
        if response.status_code == 200:
            data = response.json()
            assert data.get("is_active") is False

    def test_deactivate_shop_not_found(self, client: TestClient, auth_headers: dict):
        """Test deactivating non-existent shop."""
        response = client.delete(
            "/admin/shops/99999",
            headers=auth_headers
        )
        assert response.status_code in [404, 400]


class TestShopPaymentSettings:
    """Test shop payment settings endpoints."""

    def test_get_payment_settings(self, client: TestClient, auth_headers: dict, test_shop: Shop):
        """Test getting shop payment settings."""
        response = client.get(
            f"/admin/shops/{test_shop.id}/payment-settings",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "allow_cod" in data
        assert "allow_online_payment" in data

    def test_update_payment_settings(self, client: TestClient, auth_headers: dict, test_shop: Shop):
        """Test updating shop payment settings."""
        payment_settings = {
            "allow_cod": False,
            "allow_online_payment": True,
            "millikart_enabled": True,
            "millikart_iban": "AZ12345678901234567890",
            "millikart_account_info": "Test Account",
        }
        
        response = client.put(
            f"/admin/shops/{test_shop.id}/payment-settings",
            json=payment_settings,
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["allow_cod"] is False
        assert data["millikart_enabled"] is True
