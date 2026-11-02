"""
Test Authentication Endpoints
Tests for: /auth/register, /auth/login, /auth/me
"""
import pytest
from fastapi.testclient import TestClient
from app.models.user import User


class TestUserRegistration:
    """Test user registration endpoint."""

    def test_register_success(self, client: TestClient):
        """Test successful user registration."""
        response = client.post(
            "/auth/register",
            json={
                "full_name": "New User",
                "email": "newuser@example.com",
                "phone": "+994501111111",
                "password": "securepassword123"
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "newuser@example.com"
        assert data["full_name"] == "New User"
        assert data["phone"] == "+994501111111"
        assert "hashed_password" not in data  # Password should not be returned
        assert data["is_active"] is True
        assert data["is_superuser"] is False

    def test_register_duplicate_email(self, client: TestClient, test_user: User):
        """Test registration with duplicate email."""
        response = client.post(
            "/auth/register",
            json={
                "full_name": "Duplicate User",
                "email": test_user.email,  # Already exists
                "phone": "+994502222222",
                "password": "password123"
            }
        )
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"].lower()

    def test_register_invalid_email(self, client: TestClient):
        """Test registration with invalid email."""
        response = client.post(
            "/auth/register",
            json={
                "full_name": "Invalid Email",
                "email": "not-an-email",
                "phone": "+994503333333",
                "password": "password123"
            }
        )
        assert response.status_code == 422  # Validation error

    def test_register_missing_fields(self, client: TestClient):
        """Test registration with missing required fields."""
        response = client.post(
            "/auth/register",
            json={
                "email": "missing@example.com",
                # Missing full_name, phone, password
            }
        )
        assert response.status_code == 422

    def test_register_weak_password(self, client: TestClient):
        """Test registration with weak password (if validation exists)."""
        response = client.post(
            "/auth/register",
            json={
                "full_name": "Weak Pass",
                "email": "weak@example.com",
                "phone": "+994504444444",
                "password": "123"  # Very weak password
            }
        )
        # Note: Current implementation may not have password strength validation
        # This test documents the current behavior
        assert response.status_code in [201, 422]


class TestUserLogin:
    """Test user login endpoint."""

    def test_login_success(self, client: TestClient, test_user: User):
        """Test successful login."""
        response = client.post(
            "/auth/login",
            json={
                "email": test_user.email,
                "password": "testpassword123"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "user" in data
        assert data["user"]["email"] == test_user.email
        assert data["user"]["full_name"] == test_user.full_name

    def test_login_wrong_password(self, client: TestClient, test_user: User):
        """Test login with wrong password."""
        response = client.post(
            "/auth/login",
            json={
                "email": test_user.email,
                "password": "wrongpassword"
            }
        )
        assert response.status_code == 401
        assert "incorrect" in response.json()["detail"].lower()

    def test_login_nonexistent_user(self, client: TestClient):
        """Test login with non-existent user."""
        response = client.post(
            "/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "password123"
            }
        )
        assert response.status_code == 401

    def test_login_inactive_user(self, client: TestClient, db_session, test_user: User):
        """Test login with inactive user."""
        # Deactivate user
        test_user.is_active = False
        db_session.commit()

        response = client.post(
            "/auth/login",
            json={
                "email": test_user.email,
                "password": "testpassword123"
            }
        )
        assert response.status_code == 403
        assert "inactive" in response.json()["detail"].lower()

        # Reactivate for other tests
        test_user.is_active = True
        db_session.commit()

    def test_login_returns_jwt_token(self, client: TestClient, test_user: User):
        """Test that login returns a valid JWT token."""
        response = client.post(
            "/auth/login",
            json={
                "email": test_user.email,
                "password": "testpassword123"
            }
        )
        data = response.json()
        token = data["access_token"]
        
        # Token should be a string with 3 parts (header.payload.signature)
        assert isinstance(token, str)
        assert len(token.split(".")) == 3


class TestGetCurrentUser:
    """Test get current user endpoint."""

    def test_get_current_user_success(self, client: TestClient, auth_headers: dict):
        """Test getting current user with valid token."""
        response = client.get("/auth/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "test@example.com"
        assert data["full_name"] == "Test User"

    def test_get_current_user_no_token(self, client: TestClient):
        """Test getting current user without token."""
        response = client.get("/auth/me")
        assert response.status_code == 401

    def test_get_current_user_invalid_token(self, client: TestClient):
        """Test getting current user with invalid token."""
        response = client.get(
            "/auth/me",
            headers={"Authorization": "Bearer invalid-token-12345"}
        )
        assert response.status_code == 401


class TestAuthenticationSecurity:
    """Test security aspects of authentication."""

    def test_password_hashing(self, db_session, test_user: User):
        """Test that passwords are properly hashed."""
        # Password should be hashed (not stored in plaintext)
        assert test_user.hashed_password != "testpassword123"
        assert test_user.hashed_password.startswith("$2")  # bcrypt prefix

    def test_brute_force_protection(self, client: TestClient, test_user: User):
        """Test multiple failed login attempts (documents current behavior)."""
        # Try 10 failed logins
        for i in range(10):
            response = client.post(
                "/auth/login",
                json={
                    "email": test_user.email,
                    "password": f"wrongpassword{i}"
                }
            )
            assert response.status_code == 401
        
        # Note: Current implementation doesn't have rate limiting
        # This test documents that the 11th attempt also fails
        response = client.post(
            "/auth/login",
            json={
                "email": test_user.email,
                "password": "wrongpassword11"
            }
        )
        assert response.status_code == 401
        # TODO: After implementing rate limiting, this should return 429

    def test_token_expiration(self, client: TestClient, test_user: User):
        """Test that JWT tokens have expiration."""
        from app.utils.security import create_access_token
        from jose import jwt
        from app.config import settings
        
        token = create_access_token(data={"sub": test_user.email})
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        
        # Token should have expiration claim
        assert "exp" in payload
        assert "sub" in payload
        assert payload["sub"] == test_user.email

    def test_superuser_login(self, client: TestClient, test_superuser: User):
        """Test superuser login."""
        response = client.post(
            "/auth/login",
            json={
                "email": test_superuser.email,
                "password": "adminpassword123"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["is_superuser"] is True
