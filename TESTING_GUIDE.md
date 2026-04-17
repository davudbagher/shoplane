# 🧪 Shoplane Testing Guide

Complete testing documentation for the Shoplane (1line.az) platform.

---

## 📋 Quick Start

### Run All Tests
```bash
chmod +x run_tests.sh
./run_tests.sh
```

This runs:
- ✅ Backend tests (authentication, shops, products, orders, coupons, storefront, models)
- ✅ Frontend tests (components, pages, user interactions)
- ✅ Integration checks (bug detection, configuration validation)

---

## 🐍 Backend Testing

### Setup
```bash
cd backend

# Create virtual environment (if not exists)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
pip install pytest httpx pytest-asyncio pytest-cov faker
```

### Run All Backend Tests
```bash
cd backend
pytest tests/ -v
```

### Run Specific Test File
```bash
# Authentication tests
pytest tests/test_auth.py -v

# Product tests
pytest tests/test_products.py -v

# Order tests
pytest tests/test_orders.py -v

# Coupon tests
pytest tests/test_coupons.py -v

# Storefront tests
pytest tests/test_storefront.py -v

# Shop tests
pytest tests/test_shops.py -v

# Model tests
pytest tests/test_models.py -v
```

### Run Single Test
```bash
pytest tests/test_auth.py::TestUserLogin::test_login_success -v
```

### Run with Coverage
```bash
pytest tests/ --cov=app --cov-report=html --cov-report=term-missing
# Open htmlcov/index.html to view detailed report
```

### Test Database
- Tests use SQLite in-memory database (`test_shoplane.db`)
- Database is created before tests and deleted after
- No impact on your PostgreSQL development database

### Test Fixtures
All shared fixtures are in `tests/conftest.py`:

| Fixture | Description |
|---------|-------------|
| `client` | TestClient with database override |
| `db_session` | Fresh database session per test |
| `test_user` | Regular user (shop owner) |
| `test_superuser` | Platform admin user |
| `test_shop` | Active shop with STANDARD plan |
| `test_product` | Sample product with inventory |
| `test_customer` | Customer with Azerbaijani address |
| `test_coupon` | 20% discount coupon |
| `auth_headers` | JWT auth headers for test_user |
| `shop_headers` | X-Shop-Subdomain header |

### Create New Backend Test
```python
# tests/test_your_feature.py
import pytest
from fastapi.testclient import TestClient

class TestYourFeature:
    def test_your_functionality(self, client: TestClient, test_shop):
        response = client.get("/your-endpoint")
        assert response.status_code == 200
        assert "expected_field" in response.json()
```

---

## ⚛️ Frontend Testing

### Setup
```bash
cd frontend

# Dependencies already installed via package.json
npm install
```

### Run All Frontend Tests
```bash
cd frontend
npx vitest run
```

### Run Tests in Watch Mode
```bash
npx vitest
```

### Run Specific Test File
```bash
npx vitest run tests/test_auth.test.jsx
npx vitest run tests/test_checkout.test.jsx
```

### Run with Coverage
```bash
npx vitest run --coverage
```

### Run with UI
```bash
npx vitest --ui
```

### Test Environment
- **Framework**: Vitest (Vite-native testing)
- **Renderer**: React Testing Library
- **DOM**: jsdom (simulated browser environment)
- **Assertions**: Vitest expect API (Jest-compatible)

### Mocked APIs
Frontend tests mock all API calls:
```javascript
vi.mock('../src/shared/api', () => ({
  storefrontApi: {
    getShop: vi.fn(),
    createOrder: vi.fn(),
    // ...
  },
}));
```

### Create New Frontend Test
```jsx
// tests/test_your_component.test.jsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import YourComponent from '../src/path/to/YourComponent';

describe('YourComponent', () => {
  it('should render correctly', () => {
    render(<YourComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

---

## 🔗 Integration Checks

The `run_tests.sh` script includes automated bug detection for:

### ✅ Checked Issues

1. **OrderItem Model** - Verifies OrderItem is not commented out
2. **finalTotal Variable** - Checks for undefined variable bug
3. **Domain Consistency** - Validates 1line.az vs 1link.az mismatch
4. **Alembic Migrations** - Ensures all tables have migrations
5. **Docker Health Checks** - Validates healthcheck configuration
6. **Rate Limiting** - Checks for brute-force protection
7. **Email Notifications** - Verifies order confirmation emails
8. **Image Upload Validation** - Checks file size/type limits

---

## 🐛 Known Bugs Found by Tests

### Critical (Launch Blockers)

#### 1. OrderItem Model Commented Out
- **Location**: `backend/app/models/order.py` lines 94-122
- **Impact**: Broken relationship, SQLAlchemy errors
- **Fix**: Uncomment the class or import from order_item.py

#### 2. finalTotal Undefined Variable
- **Location**: `frontend/src/features/storefront/pages/CheckoutPage.jsx` ~line 140
- **Impact**: ReferenceError crashes checkout for online payments
- **Fix**: Move `const finalTotal` calculation before payment redirect

#### 3. Missing Alembic Migrations
- **Tables**: leads, coupons
- **Impact**: Schema drift, production deployment issues
- **Fix**: Create proper migrations

#### 4. Domain Mismatch
- **Nginx**: 1line.az
- **Backend .env.example**: 1link.az
- **Fix**: Standardize to 1line.az

### High Priority

5. No Docker health checks
6. No rate limiting on auth
7. Email notifications not sent
8. Insufficient image upload validation

---

## 📊 Test Coverage Targets

| Module | Current | Target |
|--------|---------|--------|
| Authentication | 90%+ | 95% |
| Shops | 85%+ | 95% |
| Products | 85%+ | 95% |
| Orders | 80%+ | 95% |
| Coupons | 85%+ | 95% |
| Storefront | 80%+ | 90% |
| Models | 95%+ | 100% |
| **Backend Total** | **~85%** | **95%** |
| Auth Context | 80%+ | 95% |
| Checkout | 70%+ | 90% |
| **Frontend Total** | **~75%** | **90%** |

---

## 🔧 Troubleshooting

### Backend Tests Fail

**Problem**: `ModuleNotFoundError: No module named 'app'`
```bash
cd backend
export PYTHONPATH=$PYTHONPATH:$(pwd)
pytest tests/
```

**Problem**: Database locked errors
```bash
# Delete test database if it exists
rm -f backend/test_shoplane.db
pytest tests/
```

**Problem**: Import errors
```bash
cd backend
pip install -e .  # Install in editable mode
pytest tests/
```

### Frontend Tests Fail

**Problem**: `Cannot find module`
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npx vitest run
```

**Problem**: jsdom errors
```bash
npm install --save-dev jsdom
```

**Problem**: Testing Library queries fail
```bash
# Check if component renders correctly
npx vitest run --reporter=verbose
```

### Test Runner Script Fails

**Problem**: Permission denied
```bash
chmod +x run_tests.sh
./run_tests.sh
```

**Problem**: Bash not found (Windows)
```bash
# Use Git Bash or WSL
bash run_tests.sh
```

---

## 📝 Test Writing Guidelines

### Backend Tests

1. **Use fixtures** - Don't create test data manually
2. **Test one thing** - Each test should verify one behavior
3. **Use descriptive names** - `test_login_success` not `test1`
4. **Test edge cases** - Empty inputs, invalid data, boundary values
5. **Verify side effects** - Database changes, file creation, etc.
6. **Don't test implementation** - Test behavior, not internal code

### Frontend Tests

1. **Test user interactions** - Clicks, form submissions, navigation
2. **Mock external dependencies** - API calls, localStorage, router
3. **Test rendering** - Components display correct information
4. **Test state changes** - Loading, error, success states
5. **Use screen queries** - `getByText`, `findByRole`, etc.
6. **Wait for async** - Use `await waitFor()` for promises

### Integration Tests

1. **Test complete flows** - Registration → Login → Create Shop → Add Product
2. **Verify data consistency** - Data persists across requests
3. **Test error handling** - Network failures, invalid responses
4. **Document bugs** - Write tests that fail due to known bugs

---

## 🚀 CI/CD Integration

### GitHub Actions Example
```yaml
name: Tests
on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.10'
      - run: cd backend && pip install -r requirements.txt
      - run: cd backend && pip install pytest httpx pytest-asyncio
      - run: cd backend && pytest tests/ --cov=app

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd frontend && npm install
      - run: cd frontend && npx vitest run
```

---

## 📈 Test Reports

### Generate HTML Reports
```bash
# Backend
cd backend
pytest tests/ --cov=app --cov-report=html
open htmlcov/index.html

# Frontend
cd frontend
npx vitest run --coverage
open coverage/index.html
```

### View in Terminal
```bash
pytest tests/ --cov=app --cov-report=term-missing
```

---

## 🎯 Testing Checklist Before Launch

- [ ] All backend tests pass
- [ ] All frontend tests pass
- [ ] Code coverage > 90%
- [ ] No critical bugs in bug detection checks
- [ ] Manual testing completed:
  - [ ] User registration and login
  - [ ] Shop creation and configuration
  - [ ] Product creation with images
  - [ ] Checkout flow with COD
  - [ ] Order management (admin view)
  - [ ] Coupon creation and validation
  - [ ] Order tracking
- [ ] Load testing completed (100+ concurrent users)
- [ ] Security audit completed
- [ ] Mobile testing completed (iOS + Android)
- [ ] Browser testing completed (Chrome, Firefox, Safari, Edge)

---

## 🆘 Support

If tests fail unexpectedly:

1. **Check recent changes** - What was modified?
2. **Run single test** - Isolate the failure
3. **Check fixtures** - Are test dependencies correct?
4. **Review logs** - What's the actual error?
5. **Consult PROJECT_ANALYSIS.md** - Known issues documented

---

**Last Updated**: April 10, 2026  
**Test Suite Version**: 1.0.0  
**Total Tests**: 150+  
**Expected Pass Rate**: 100% (after fixing critical bugs)
