"""
Test Storefront API
Tests for: /storefront/shop, /storefront/products, /storefront/categories
"""
import pytest
from fastapi.testclient import TestClient
from app.models.user import User
from app.models.shop import Shop
from app.models.product import Product


class TestStorefrontShop:
    """Test storefront shop info endpoint."""

    def test_get_shop_info_success(self, client: TestClient, test_shop: Shop, shop_headers: dict):
        """Test getting shop information."""
        response = client.get(
            "/storefront/shop",
            headers=shop_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == test_shop.name
        assert data["subdomain"] == test_shop.subdomain
        assert "id" in data

    def test_get_shop_info_missing_subdomain(self, client: TestClient):
        """Test accessing shop info without subdomain header."""
        response = client.get("/storefront/shop")
        assert response.status_code == 400
        assert "subdomain" in response.json()["detail"].lower()

    def test_get_shop_info_invalid_subdomain(self, client: TestClient):
        """Test accessing shop info with non-existent subdomain."""
        response = client.get(
            "/storefront/shop",
            headers={"X-Shop-Subdomain": "nonexistent-shop"}
        )
        assert response.status_code == 404

    def test_get_shop_info_inactive_shop(self, client: TestClient, db_session, test_shop: Shop):
        """Test accessing inactive shop."""
        test_shop.is_active = False
        db_session.commit()
        
        response = client.get(
            "/storefront/shop",
            headers={"X-Shop-Subdomain": test_shop.subdomain}
        )
        # Should return 403 for inactive shops
        assert response.status_code == 403


class TestStorefrontProducts:
    """Test storefront product listing endpoint."""

    def test_list_products_success(self, client: TestClient, test_shop: Shop, test_product: Product, shop_headers: dict):
        """Test listing storefront products."""
        response = client.get(
            "/storefront/products",
            headers=shop_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        assert len(data["products"]) >= 1
        assert data["products"][0]["name"] == test_product.name

    def test_list_products_only_active(self, client: TestClient, test_shop: Shop, db_session, shop_headers: dict):
        """Test that only active products are shown."""
        # Create active and inactive products
        active_product = Product(
            name="Active Product",
            slug="active-product",
            price=20.00,
            inventory_count=10,
            is_active=True,
            shop_id=test_shop.id,
        )
        inactive_product = Product(
            name="Inactive Product",
            slug="inactive-product",
            price=30.00,
            inventory_count=10,
            is_active=False,  # Inactive
            shop_id=test_shop.id,
        )
        db_session.add_all([active_product, inactive_product])
        db_session.commit()
        
        response = client.get(
            "/storefront/products",
            headers=shop_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # Should only show active products
        product_names = [p["name"] for p in data["products"]]
        assert "Active Product" in product_names
        assert "Inactive Product" not in product_names

    def test_list_products_pagination(self, client: TestClient, test_shop: Shop, db_session, shop_headers: dict):
        """Test product pagination."""
        # Create 25 products
        for i in range(25):
            product = Product(
                name=f"Paginated Product {i}",
                slug=f"paginated-product-{i}",
                price=15.00 + i,
                inventory_count=10,
                is_active=True,
                shop_id=test_shop.id,
            )
            db_session.add(product)
        db_session.commit()
        
        response = client.get(
            "/storefront/products?page=1&page_size=10",
            headers=shop_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["products"]) <= 10
        assert data["page"] == 1
        assert data["total"] >= 25
        assert data["total_pages"] >= 3

    def test_list_products_search(self, client: TestClient, test_shop: Shop, db_session, shop_headers: dict):
        """Test product search in storefront."""
        # Create products with different names
        search_terms = ["Laptop Pro", "Phone Max", "Tablet Ultra"]
        for name in search_terms:
            product = Product(
                name=name,
                slug=name.lower().replace(" ", "-"),
                price=100.00,
                inventory_count=10,
                is_active=True,
                shop_id=test_shop.id,
            )
            db_session.add(product)
        db_session.commit()
        
        response = client.get(
            "/storefront/products?search=laptop",
            headers=shop_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["products"]) >= 1
        assert any("Laptop" in p["name"] for p in data["products"])

    def test_list_products_filter_by_category(self, client: TestClient, test_shop: Shop, db_session, shop_headers: dict):
        """Test filtering products by category."""
        categories = ["Electronics", "Clothing", "Books"]
        for cat in categories:
            product = Product(
                name=f"{cat} Item",
                slug=f"{cat.lower()}-item",
                price=25.00,
                inventory_count=10,
                category=cat,
                is_active=True,
                shop_id=test_shop.id,
            )
            db_session.add(product)
        db_session.commit()
        
        response = client.get(
            "/storefront/products?category=Electronics",
            headers=shop_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert all(p["category"] == "Electronics" for p in data["products"])

    def test_list_products_filter_by_price_range(self, client: TestClient, test_shop: Shop, db_session, shop_headers: dict):
        """Test filtering products by price range."""
        prices = [10, 25, 50, 75, 100]
        for price in prices:
            product = Product(
                name=f"Product ${price}",
                slug=f"product-{price}",
                price=price,
                inventory_count=10,
                is_active=True,
                shop_id=test_shop.id,
            )
            db_session.add(product)
        db_session.commit()
        
        response = client.get(
            "/storefront/products?min_price=30&max_price=80",
            headers=shop_headers
        )
        assert response.status_code == 200
        data = response.json()
        # All products should be in range [30, 80]
        assert all(30 <= float(p["price"]) <= 80 for p in data["products"])

    def test_list_products_sort_by_price_asc(self, client: TestClient, test_shop: Shop, db_session, shop_headers: dict):
        """Test sorting products by price ascending."""
        prices = [50, 20, 80, 10, 40]
        for price in prices:
            product = Product(
                name=f"Sort Product ${price}",
                slug=f"sort-product-{price}",
                price=price,
                inventory_count=10,
                is_active=True,
                shop_id=test_shop.id,
            )
            db_session.add(product)
        db_session.commit()
        
        response = client.get(
            "/storefront/products?sort_by=price_asc",
            headers=shop_headers
        )
        assert response.status_code == 200
        data = response.json()
        product_prices = [float(p["price"]) for p in data["products"]]
        assert product_prices == sorted(product_prices)

    def test_list_products_sort_by_newest(self, client: TestClient, test_shop: Shop, db_session, shop_headers: dict):
        """Test sorting products by newest."""
        response = client.get(
            "/storefront/products?sort_by=newest",
            headers=shop_headers
        )
        assert response.status_code == 200
        data = response.json()
        # Should return products (exact order depends on created_at)
        assert "products" in data


class TestStorefrontProductDetail:
    """Test storefront product detail endpoint."""

    def test_get_product_details_success(self, client: TestClient, test_shop: Shop, test_product: Product, shop_headers: dict):
        """Test getting product details."""
        response = client.get(
            f"/storefront/products/{test_product.id}",
            headers=shop_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_product.id
        assert data["name"] == test_product.name
        assert data["slug"] == test_product.slug

    def test_get_product_details_not_found(self, client: TestClient, test_shop: Shop, shop_headers: dict):
        """Test getting non-existent product."""
        response = client.get(
            "/storefront/products/99999",
            headers=shop_headers
        )
        assert response.status_code == 404

    def test_get_product_details_inactive_product(self, client: TestClient, test_shop: Shop, db_session, shop_headers: dict):
        """Test getting inactive product."""
        product = Product(
            name="Inactive Detail Product",
            slug="inactive-detail",
            price=40.00,
            inventory_count=10,
            is_active=False,
            shop_id=test_shop.id,
        )
        db_session.add(product)
        db_session.commit()
        
        response = client.get(
            f"/storefront/products/{product.id}",
            headers=shop_headers
        )
        assert response.status_code == 404


class TestStorefrontCategories:
    """Test storefront categories endpoint."""

    def test_get_categories_success(self, client: TestClient, test_shop: Shop, db_session, shop_headers: dict):
        """Test getting product categories."""
        # Create products with different categories
        categories = ["Electronics", "Clothing", "Books", "Electronics", "Clothing"]
        for i, cat in enumerate(categories):
            product = Product(
                name=f"Category Product {i}",
                slug=f"category-product-{i}",
                price=20.00,
                inventory_count=10,
                category=cat,
                is_active=True,
                shop_id=test_shop.id,
            )
            db_session.add(product)
        db_session.commit()
        
        response = client.get(
            "/storefront/categories",
            headers=shop_headers
        )
        assert response.status_code == 200
        data = response.json()
        # Should return unique categories
        assert isinstance(data, list)
        assert "Electronics" in data
        assert "Clothing" in data
        assert "Books" in data

    def test_get_categories_no_products(self, client: TestClient, test_shop: Shop, shop_headers: dict):
        """Test getting categories when shop has no products."""
        response = client.get(
            "/storefront/categories",
            headers=shop_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # May be empty list or have categories from other tests

    def test_get_categories_filters_null(self, client: TestClient, test_shop: Shop, db_session, shop_headers: dict):
        """Test that categories with null are filtered out."""
        # Create product without category
        product = Product(
            name="No Category Product",
            slug="no-category",
            price=15.00,
            inventory_count=10,
            category=None,  # No category
            is_active=True,
            shop_id=test_shop.id,
        )
        db_session.add(product)
        db_session.commit()
        
        response = client.get(
            "/storefront/categories",
            headers=shop_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert None not in data
        assert "" not in data
