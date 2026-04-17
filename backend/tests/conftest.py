"""
Pytest configuration and shared fixtures for backend tests.
Sets up test database, client, and common test data.
"""
import pytest
import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta

# Set test environment variables BEFORE importing app
os.environ["DATABASE_URL"] = "sqlite:///./test_shoplane.db"
os.environ["SECRET_KEY"] = "test-secret-key-for-testing-only"
os.environ["ALGORITHM"] = "HS256"
os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "60"
os.environ["BASE_DOMAIN"] = "test.1line.az"
os.environ["ENVIRONMENT"] = "testing"
os.environ["DEBUG"] = "True"

from app.database import Base, get_db
from app.main import app
from app.models.user import User
from app.models.shop import Shop
from app.models.product import Product
from app.models.customer import Customer
from app.models.order import Order, OrderStatus, PaymentStatus, PaymentMethod
from app.models.order_item import OrderItem
from app.models.coupon import Coupon
from app.models.lead import Lead
from app.utils.security import get_password_hash, create_access_token


# Create test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_shoplane.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Create all tables before tests run."""
    Base.metadata.create_all(bind=engine)
    yield
    # Cleanup: remove test database file
    Base.metadata.drop_all(bind=engine)
    if os.path.exists("./test_shoplane.db"):
        os.remove("./test_shoplane.db")


@pytest.fixture
def db_session():
    """Create a new database session for each test."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db_session):
    """Create a test client with database dependency override."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def test_user(db_session):
    """Create a test user."""
    user = User(
        email="test@example.com",
        full_name="Test User",
        phone="+994501234567",
        hashed_password=get_password_hash("testpassword123"),
        is_active=True,
        is_superuser=False,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_superuser(db_session):
    """Create a test superuser (platform admin)."""
    user = User(
        email="admin@1line.az",
        full_name="Platform Admin",
        phone="+994509876543",
        hashed_password=get_password_hash("adminpassword123"),
        is_active=True,
        is_superuser=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_shop(db_session, test_user):
    """Create a test shop."""
    shop = Shop(
        name="Test Shop",
        subdomain="testshop",
        slug="test-shop",
        description="A test shop for testing",
        owner_id=test_user.id,
        is_active=True,
        plan_type="STANDARD",
        subscription_status="ACTIVE",
        allow_cod=True,
        allow_online_payment=True,
        millikart_enabled=False,
    )
    db_session.add(shop)
    db_session.commit()
    db_session.refresh(shop)
    return shop


@pytest.fixture
def test_product(db_session, test_shop):
    """Create a test product."""
    product = Product(
        name="Test Product",
        slug="test-product",
        description="A test product",
        price=29.99,
        compare_at_price=39.99,
        inventory_count=100,
        track_inventory=True,
        allow_backorder=False,
        low_stock_threshold=5,
        images=["https://example.com/image1.jpg"],
        category="Electronics",
        tags=["test", "electronics"],
        is_active=True,
        is_featured=False,
        is_new_arrival=True,
        shop_id=test_shop.id,
    )
    db_session.add(product)
    db_session.commit()
    db_session.refresh(product)
    return product


@pytest.fixture
def test_customer(db_session):
    """Create a test customer."""
    customer = Customer(
        full_name="Test Customer",
        phone="+994505555555",
        email="customer@example.com",
        city="Bakı",
        district="Nəsimi",
        address_line="Test Street 123",
        postal_code="AZ1000",
        delivery_notes="Apartment 5",
    )
    db_session.add(customer)
    db_session.commit()
    db_session.refresh(customer)
    return customer


@pytest.fixture
def test_coupon(db_session, test_shop):
    """Create a test coupon."""
    coupon = Coupon(
        code="TEST20",
        discount_type="percentage",
        discount_value=20.0,
        scope="all_products",
        is_active=True,
        shop_id=test_shop.id,
        usage_limit=100,
        usage_count=0,
    )
    db_session.add(coupon)
    db_session.commit()
    db_session.refresh(coupon)
    return coupon


@pytest.fixture
def auth_headers(client, test_user):
    """Generate authentication headers."""
    token = create_access_token(data={"sub": test_user.email})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def shop_headers(test_shop):
    """Generate shop subdomain headers."""
    return {"X-Shop-Subdomain": test_shop.subdomain}


def create_auth_token(email: str) -> str:
    """Helper to create auth token for any email."""
    return create_access_token(data={"sub": email})


def login_user(client, email: str, password: str) -> dict:
    """Helper to login and return response data."""
    response = client.post(
        "/auth/login",
        data={"username": email, "password": password}
    )
    return response
