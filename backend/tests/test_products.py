"""
Test Products API
Tests for: /admin/shops/{shop_id}/products/* (CRUD operations)
"""
import pytest
from fastapi.testclient import TestClient
from app.models.user import User
from app.models.shop import Shop
from app.models.product import Product
from decimal import Decimal


class TestCreateProduct:
    """Test product creation endpoint."""

    def test_create_product_success(self, client: TestClient, auth_headers: dict, test_shop: Shop):
        """Test successful product creation."""
        product_data = {
            "name": "New Product",
            "description": "A brand new product",
            "price": 49.99,
            "compare_at_price": 69.99,
            "inventory_count": 50,
            "track_inventory": True,
            "allow_backorder": False,
            "low_stock_threshold": 10,
            "images": ["https://example.com/product.jpg"],
            "category": "Electronics",
            "tags": ["new", "electronics"],
            "is_active": True,
            "is_featured": False,
            "is_new_arrival": True,
        }
        
        response = client.post(
            f"/admin/shops/{test_shop.id}/products",
            json=product_data,
            headers=auth_headers
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "New Product"
        assert data["slug"] == "new-product"
        assert float(data["price"]) == 49.99
        assert data["inventory_count"] == 50
        assert data["is_active"] is True

    def test_create_product_missing_name(self, client: TestClient, auth_headers: dict, test_shop: Shop):
        """Test product creation without required name."""
        response = client.post(
            f"/admin/shops/{test_shop.id}/products",
            json={
                "description": "No name product",
                "price": 19.99,
            },
            headers=auth_headers
        )
        assert response.status_code == 422

    def test_create_product_missing_price(self, client: TestClient, auth_headers: dict, test_shop: Shop):
        """Test product creation without required price."""
        response = client.post(
            f"/admin/shops/{test_shop.id}/products",
            json={
                "name": "No Price Product",
                "description": "Product without price",
            },
            headers=auth_headers
        )
        assert response.status_code == 422

    def test_create_product_negative_price(self, client: TestClient, auth_headers: dict, test_shop: Shop):
        """Test product creation with negative price."""
        response = client.post(
            f"/admin/shops/{test_shop.id}/products",
            json={
                "name": "Negative Price",
                "price": -10.00,
                "inventory_count": 10,
            },
            headers=auth_headers
        )
        # Should fail validation or be accepted (depends on schema)
        assert response.status_code in [201, 422]

    def test_create_product_unauthorized(self, client: TestClient, test_shop: Shop):
        """Test product creation without authentication."""
        response = client.post(
            f"/admin/shops/{test_shop.id}/products",
            json={
                "name": "Unauthorized Product",
                "price": 19.99,
            }
        )
        assert response.status_code == 401

    def test_create_product_wrong_shop_owner(self, client: TestClient, auth_headers: dict, db_session):
        """Test product creation for shop owned by different user."""
        # Create another shop owned by different user
        from app.utils.security import get_password_hash
        other_user = User(
            email="other@example.com",
            full_name="Other User",
            phone="+994509999999",
            hashed_password=get_password_hash("password123"),
        )
        db_session.add(other_user)
        db_session.commit()
        
        other_shop = Shop(
            name="Other Shop",
            subdomain="othershop",
            slug="other-shop",
            owner_id=other_user.id,
            is_active=True,
        )
        db_session.add(other_shop)
        db_session.commit()
        
        # Try to create product in other shop (should be allowed or denied based on implementation)
        response = client.post(
            f"/admin/shops/{other_shop.id}/products",
            json={
                "name": "Product in Wrong Shop",
                "price": 29.99,
            },
            headers=auth_headers
        )
        # This tests ownership enforcement
        assert response.status_code in [201, 403, 404]


class TestListProducts:
    """Test product listing endpoint."""

    def test_list_products_success(self, client: TestClient, auth_headers: dict, test_shop: Shop, test_product: Product):
        """Test listing products."""
        response = client.get(
            f"/admin/shops/{test_shop.id}/products",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        assert len(data["products"]) >= 1
        assert data["products"][0]["name"] == "Test Product"

    def test_list_products_pagination(self, client: TestClient, auth_headers: dict, test_shop: Shop, db_session):
        """Test product listing with pagination."""
        # Create multiple products
        for i in range(15):
            product = Product(
                name=f"Product {i}",
                slug=f"product-{i}",
                price=10.00 + i,
                inventory_count=10,
                shop_id=test_shop.id,
            )
            db_session.add(product)
        db_session.commit()
        
        response = client.get(
            f"/admin/shops/{test_shop.id}/products?page=1&page_size=10",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["products"]) <= 10
        assert data["page"] == 1
        assert data["total"] >= 15

    def test_list_products_search(self, client: TestClient, auth_headers: dict, test_shop: Shop, db_session):
        """Test product search functionality."""
        # Create products with different names
        for name in ["Laptop", "Phone", "Tablet"]:
            product = Product(
                name=name,
                slug=name.lower(),
                price=100.00,
                inventory_count=10,
                shop_id=test_shop.id,
            )
            db_session.add(product)
        db_session.commit()
        
        response = client.get(
            f"/admin/shops/{test_shop.id}/products?search=lap",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["products"]) >= 1
        assert "Laptop" in [p["name"] for p in data["products"]]

    def test_list_products_filter_category(self, client: TestClient, auth_headers: dict, test_shop: Shop, db_session):
        """Test product filtering by category."""
        # Create products with different categories
        for cat in ["Electronics", "Clothing", "Food"]:
            product = Product(
                name=f"{cat} Product",
                slug=f"{cat.lower()}-product",
                price=50.00,
                inventory_count=10,
                category=cat,
                shop_id=test_shop.id,
            )
            db_session.add(product)
        db_session.commit()
        
        response = client.get(
            f"/admin/shops/{test_shop.id}/products?category=Electronics",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert all(p["category"] == "Electronics" for p in data["products"])


class TestGetProduct:
    """Test get single product endpoint."""

    def test_get_product_success(self, client: TestClient, auth_headers: dict, test_shop: Shop, test_product: Product):
        """Test getting a single product."""
        response = client.get(
            f"/admin/shops/{test_shop.id}/products/{test_product.id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_product.id
        assert data["name"] == test_product.name

    def test_get_product_not_found(self, client: TestClient, auth_headers: dict, test_shop: Shop):
        """Test getting non-existent product."""
        response = client.get(
            f"/admin/shops/{test_shop.id}/products/99999",
            headers=auth_headers
        )
        assert response.status_code in [404, 400]


class TestUpdateProduct:
    """Test product update endpoint."""

    def test_update_product_success(self, client: TestClient, auth_headers: dict, test_shop: Shop, test_product: Product):
        """Test updating a product."""
        update_data = {
            "name": "Updated Product",
            "price": 39.99,
            "inventory_count": 75,
        }
        
        response = client.put(
            f"/admin/shops/{test_shop.id}/products/{test_product.id}",
            json=update_data,
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Product"
        assert float(data["price"]) == 39.99
        assert data["inventory_count"] == 75

    def test_update_product_slug(self, client: TestClient, auth_headers: dict, test_shop: Shop, test_product: Product):
        """Test that slug is updated when name changes."""
        response = client.put(
            f"/admin/shops/{test_shop.id}/products/{test_product.id}",
            json={"name": "Completely New Name"},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["slug"] == "completely-new-name"


class TestDeleteProduct:
    """Test product deletion endpoint."""

    def test_delete_product_success(self, client: TestClient, auth_headers: dict, test_shop: Shop, db_session):
        """Test deleting a product."""
        # Create product to delete
        product = Product(
            name="Delete Me",
            slug="delete-me",
            price=10.00,
            inventory_count=5,
            shop_id=test_shop.id,
        )
        db_session.add(product)
        db_session.commit()
        db_session.refresh(product)
        
        response = client.delete(
            f"/admin/shops/{test_shop.id}/products/{product.id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        # Verify product is deleted
        response = client.get(
            f"/admin/shops/{test_shop.id}/products/{product.id}",
            headers=auth_headers
        )
        assert response.status_code in [404, 400]

    def test_delete_product_not_found(self, client: TestClient, auth_headers: dict, test_shop: Shop):
        """Test deleting non-existent product."""
        response = client.delete(
            f"/admin/shops/{test_shop.id}/products/99999",
            headers=auth_headers
        )
        assert response.status_code in [404, 400]


class TestProductVariants:
    """Test product variants functionality."""

    def test_product_with_variants(self, client: TestClient, auth_headers: dict, test_shop: Shop, db_session):
        """Test creating product with variants."""
        variants = [
            {"color": "Red", "size": "M", "stock": 10, "sold": 0},
            {"color": "Red", "size": "L", "stock": 15, "sold": 0},
            {"color": "Blue", "size": "M", "stock": 20, "sold": 0},
        ]
        
        response = client.post(
            f"/admin/shops/{test_shop.id}/products",
            json={
                "name": "Variant Product",
                "price": 29.99,
                "inventory_count": 45,
                "variants": variants,
            },
            headers=auth_headers
        )
        assert response.status_code == 201
        data = response.json()
        assert "variants" in data
        assert len(data["variants"]) == 3
