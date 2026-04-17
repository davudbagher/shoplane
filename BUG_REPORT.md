# 🐛 Shoplane Bug Report - Detailed Fix Guide

**Date:** April 10, 2026  
**Priority:** Critical - Launch Blockers  
**Status:** Requires Immediate Attention

---

## 🔴 CRITICAL BUGS (Must Fix Before Launch)

---

### BUG #1: OrderItem Model Commented Out

**Severity:** 🔴 CRITICAL - Application Breaking  
**Status:** ❌ Not Fixed  
**Found By:** Code Analysis & Model Tests

#### 📍 Location
- **File:** `backend/app/models/order.py`
- **Lines:** 94-122
- **Component:** Database Models

#### 🐛 Problem
The `OrderItem` class is completely commented out in `order.py`, but it's defined separately in `order_item.py`. This creates a broken relationship in the Order model.

```python
# backend/app/models/order.py - Line 94

# class OrderItem(Base):  # <-- COMMENTED OUT!
#     """
#     Individual items within an order.
#     ...
#     """
#     __tablename__ = "order_items"
#     ...
```

However, `order_item.py` has the actual implementation:
```python
# backend/app/models/order_item.py - Line 6

class OrderItem(Base):  # <-- ACTUAL IMPLEMENTATION
    """Individual items in an order."""
    __tablename__ = "order_items"
    # ... (full implementation exists)
```

#### 💥 Impact
- SQLAlchemy cannot establish proper relationships
- Order.items relationship may fail
- Cascade deletes may not work correctly
- Database integrity compromised

#### ✅ Fix (Choose One)

**Option A:** Uncomment the class in order.py and remove order_item.py
```python
# backend/app/models/order.py

class OrderItem(Base):  # Uncomment this
    __tablename__ = "order_items"
    # ... (copy from order_item.py)
```

**Option B (Recommended):** Keep separate files, ensure proper import
```python
# backend/app/models/__init__.py
from .order import Order
from .order_item import OrderItem  # Already imported

# backend/app/models/order.py
from .order_item import OrderItem  # Add this import

class Order(Base):
    # ...
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
```

#### 🧪 Test
```bash
cd backend
pytest tests/test_models.py::TestOrderItemModel -v
```

---

### BUG #2: finalTotal Undefined Variable in Checkout

**Severity:** 🔴 CRITICAL - Checkout Breaking  
**Status:** ❌ Not Fixed  
**Found By:** Frontend Tests & Code Analysis

#### 📍 Location
- **File:** `frontend/src/features/storefront/pages/CheckoutPage.jsx`
- **Line:** ~140 (usage) vs ~270 (definition)
- **Component:** Checkout Page

#### 🐛 Problem
The variable `finalTotal` is **used before it's defined**, causing a `ReferenceError` when customers try to checkout with online payment.

**Current Code (WRONG ORDER):**
```javascript
// frontend/src/features/storefront/pages/CheckoutPage.jsx

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  setLoading(true);
  try {
    const orderData = { /* ... */ };
    const order = await storefrontApi.createOrder(orderData);
    
    // ❌ LINE ~140: Uses finalTotal BEFORE it exists!
    if (formData.payment_method === 'millikart' && shop?.millikart_enabled) {
      const paymentUrl = `${shop.millikart_payment_link}?amount=${finalTotal}&order=${order.order_number}`;
      // ReferenceError: Cannot access 'finalTotal' before initialization
      window.location.href = paymentUrl;
    }
    
    // ... more code
  } catch (err) {
    // ...
  } finally {
    setLoading(false);
  }
};

// ❌ LINE ~270: finalTotal is calculated HERE (TOO LATE!)
const subtotal = cartItems.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
const totalItemsCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);
const finalTotal = Math.max(0, subtotal - discountAmount);  // <-- Defined AFTER usage!
```

#### 💥 Impact
- Checkout **completely broken** for online payments
- ReferenceError crashes the payment flow
- Customers cannot complete purchases via MilliKart
- Revenue loss for all shops using online payments

#### ✅ Fix

Move the calculation **BEFORE** the payment redirect:

```javascript
// frontend/src/features/storefront/pages/CheckoutPage.jsx

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  setLoading(true);
  try {
    // ✅ Calculate totals FIRST
    const subtotal = cartItems.reduce((sum, item) => 
      sum + parseFloat(item.price) * item.quantity, 0
    );
    const totalItemsCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);
    const finalTotal = Math.max(0, subtotal - discountAmount);

    const orderData = {
      customer_full_name: formData.customer_full_name.trim(),
      customer_phone: formData.customer_phone.trim(),
      // ... other fields
      items: cartItems.map((item) => ({ 
        product_id: item.product_id, 
        quantity: item.quantity 
      })),
      discount_code: appliedCoupon || null,
    };

    const order = await storefrontApi.createOrder(orderData);
    localStorage.setItem("cart", "[]");
    localStorage.removeItem('cart_coupon');
    localStorage.setItem("last_order_phone", formData.customer_phone.trim());
    window.dispatchEvent(new Event("cartUpdated"));

    // ✅ NOW finalTotal is available
    if (formData.payment_method === 'millikart' && shop?.millikart_enabled && shop.millikart_payment_link) {
      const paymentUrl = `${shop.millikart_payment_link}?amount=${finalTotal}&order=${order.order_number}`;
      window.location.href = paymentUrl;
    } else {
      navigate(`/orders/${order.order_number}`, { state: { order } });
    }
  } catch (err) {
    alert(err.response?.data?.detail || "Sifariş zamanı xəta baş verdi.");
  } finally {
    setLoading(false);
  }
};

// ❌ REMOVE these duplicate calculations from bottom of component
// const subtotal = ...  (DELETE)
// const totalItemsCount = ...  (DELETE)
// const finalTotal = ...  (DELETE)
```

#### 🧪 Test
```bash
cd frontend
npx vitest run tests/test_checkout.test.jsx -t "MilliKart payment redirect"
```

---

### BUG #3: Missing Alembic Migrations

**Severity:** 🟡 HIGH - Deployment Risk  
**Status:** ❌ Not Fixed  
**Found By:** Migration Analysis

#### 📍 Location
- **Directory:** `backend/alembic/versions/`
- **Missing Tables:** `leads`, `coupons`
- **Component:** Database Migrations

#### 🐛 Problem
The `leads` and `coupons` tables have **no Alembic migration files**. They're created via `Base.metadata.create_all()` in `main.py` at startup.

**Current migrations:**
```
backend/alembic/versions/
├── 045d7af72e16_initial_tables.py          # users, shops, products, orders, customers, order_items
├── f7145941af84_add_missing_order_columns.py
├── a1b2c3d4e5f6_add_millikart_payment.py
├── b2c3d4e5f6g7_add_whatsapp_number.py
└── c3d4e5f6g7h8_add_detailed_onboarding.py
```

**Missing:**
- ❌ Migration for `leads` table
- ❌ Migration for `coupons` table

**Current workaround (BAD):**
```python
# backend/app/main.py - Line 11

# Create database tables on startup
Base.metadata.create_all(bind=engine)  # ❌ Creates tables outside Alembic!
```

#### 💥 Impact
- **Production deployment will fail** (tables won't exist)
- **Cannot track database version** properly
- **Schema drift** between environments (dev/staging/prod)
- **Rollback impossible** without manual SQL
- **CI/CD pipelines broken** (rely on migrations)

#### ✅ Fix

**Step 1:** Generate migration files
```bash
cd backend
source venv/bin/activate

# Generate migration for leads table
alembic revision -m "add_leads_table"

# Generate migration for coupons table
alembic revision -m "add_coupons_table"
```

**Step 2:** Edit migration files
```python
# backend/alembic/versions/{hash}_add_leads_table.py

def upgrade():
    op.create_table(
        'leads',
        sa.Column('id', sa.Integer, primary_key=True, index=True),
        sa.Column('full_name', sa.String, nullable=False),
        sa.Column('email', sa.String, nullable=False),
        sa.Column('phone', sa.String),
        sa.Column('shop_name', sa.String),
        sa.Column('shop_name_az', sa.String),
        sa.Column('category', sa.String),
        sa.Column('subdomain_preference', sa.String),
        sa.Column('instagram_url', sa.String),
        sa.Column('location_address', sa.String),
        sa.Column('google_maps_link', sa.String),
        sa.Column('business_description', sa.Text),
        sa.Column('logo_url', sa.String),
        sa.Column('banner_url', sa.String),
        sa.Column('primary_color', sa.String),
        sa.Column('secondary_color', sa.String),
        sa.Column('want_cod', sa.Boolean, default=True),
        sa.Column('want_millikart', sa.Boolean, default=False),
        sa.Column('want_birbank', sa.Boolean, default=False),
        sa.Column('want_pasha_pay', sa.Boolean, default=False),
        sa.Column('tax_id', sa.String),
        sa.Column('legal_name', sa.String),
        sa.Column('iban', sa.String),
        sa.Column('delivery_courier', sa.String),
        sa.Column('delivery_pickup', sa.String),
        sa.Column('delivery_cities', sa.JSON),
        sa.Column('delivery_notes', sa.Text),
        sa.Column('current_revenue', sa.String),
        sa.Column('employee_count', sa.String),
        sa.Column('currently_selling_online', sa.Boolean),
        sa.Column('other_platforms', sa.String),
        sa.Column('notes', sa.Text),
        sa.Column('source', sa.String),
        sa.Column('screening_status', sa.String),
        sa.Column('status', sa.String, default='PENDING'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )

def downgrade():
    op.drop_table('leads')
```

```python
# backend/alembic/versions/{hash}_add_coupons_table.py

def upgrade():
    op.create_table(
        'coupons',
        sa.Column('id', sa.Integer, primary_key=True, index=True),
        sa.Column('code', sa.String, nullable=False),
        sa.Column('discount_type', sa.String, nullable=False),  # percentage/fixed_amount
        sa.Column('discount_value', sa.Numeric(10, 2), nullable=False),
        sa.Column('scope', sa.String, nullable=False),  # all_products/specific_products
        sa.Column('applicable_product_ids', sa.JSON),
        sa.Column('starts_at', sa.DateTime(timezone=True)),
        sa.Column('ends_at', sa.DateTime(timezone=True)),
        sa.Column('usage_limit', sa.Integer),
        sa.Column('usage_count', sa.Integer, default=0),
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('shop_id', sa.Integer, sa.ForeignKey('shops.id'), nullable=False, index=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )

def downgrade():
    op.drop_table('coupons')
```

**Step 3:** Apply migrations
```bash
# Development
alembic upgrade head

# Production (in deployment script)
alembic upgrade head
```

**Step 4:** Remove create_all from main.py
```python
# backend/app/main.py

# Remove or comment out this line:
# Base.metadata.create_all(bind=engine)  # ❌ Remove this!

# Alembic will handle table creation
```

#### 🧪 Test
```bash
cd backend
pytest tests/test_integration.py -v
```

---

### BUG #4: Domain Mismatch (1line vs 1link)

**Severity:** 🟡 HIGH - Production Breaking  
**Status:** ❌ Not Fixed  
**Found By:** Automated Bug Detection

#### 📍 Location
- **Nginx Config:** `nginx/nginx.conf` → uses `1line.az`
- **Backend Config:** `backend/.env.example` → uses `1link.az`
- **Component:** Domain Configuration

#### 🐛 Problem
Different parts of the application use **different domain names**, causing CORS errors and routing failures.

```nginx
# nginx/nginx.conf

server {
    listen 80;
    server_name api.1line.az;  # ✅ Uses "1line.az"
    # ...
}

server {
    listen 80;
    server_name 1line.az *.1line.az;  # ✅ Uses "1line.az"
    # ...
}
```

```bash
# backend/.env.example

BASE_DOMAIN=1link.az  # ❌ Uses "1link.az" (TYPO!)
```

#### 💥 Impact
- **CORS errors** - Backend rejects frontend requests
- **Subdomain detection fails** - Shops inaccessible
- **Cookie/domain mismatch** - Sessions broken
- **Production completely non-functional**

#### ✅ Fix

**Standardize to `1line.az` everywhere:**

```bash
# backend/.env.example

BASE_DOMAIN=1line.az  # ✅ Fixed
```

```python
# backend/app/config.py

class Settings(BaseSettings):
    BASE_DOMAIN: str = "1line.az"  # ✅ Ensure this is correct
```

**Search for all occurrences:**
```bash
grep -r "1link.az" . --exclude-dir=node_modules --exclude-dir=.git
# Replace all with "1line.az"
```

#### 🧪 Test
```bash
./run_tests.sh  # Bug #3 check
```

---

### BUG #5: No Docker Health Checks

**Severity:** 🟡 HIGH - Startup Reliability  
**Status:** ❌ Not Fixed  
**Found By:** Docker Configuration Analysis

#### 📍 Location
- **File:** `docker-compose.yml`
- **Component:** Service Dependencies

#### 🐛 Problem
Docker Compose `depends_on` only waits for **container start**, not for **service readiness**. Backend may start before PostgreSQL accepts connections.

**Current (UNRELIABLE):**
```yaml
# docker-compose.yml

services:
  db:
    image: postgres:14-alpine
    # ❌ No healthcheck
  
  backend:
    build: ./backend
    depends_on:
      - db  # ❌ Only waits for container start, not DB readiness
```

#### 💥 Impact
- Backend crashes on startup (DB not ready)
- Manual restarts required
- CI/CD pipelines fail intermittently
- Unreliable deployments

#### ✅ Fix

```yaml
# docker-compose.yml

services:
  db:
    image: postgres:14-alpine
    environment:
      POSTGRES_USER: shoplane_user
      POSTGRES_PASSWORD: shoplane_pass
      POSTGRES_DB: shoplane_db
    healthcheck:  # ✅ Add healthcheck
      test: ["CMD-SHELL", "pg_isready -U shoplane_user -d shoplane_db"]
      interval: 5s
      timeout: 5s
      retries: 5
      start_period: 10s
  
  backend:
    build: ./backend
    depends_on:
      db:
        condition: service_healthy  # ✅ Wait for health check
    environment:
      DATABASE_URL: postgresql://shoplane_user:shoplane_pass@db:5432/shoplane_db
```

#### 🧪 Test
```bash
docker-compose down
docker-compose up -d
docker-compose logs -f backend  # Should start without errors
```

---

## 🟡 HIGH PRIORITY BUGS

---

### BUG #6: No Rate Limiting on Authentication

**Severity:** 🟡 HIGH - Security Risk  
**Location:** `backend/app/api/auth.py`  
**Fix:** Add `slowapi` for rate limiting

```python
# Install: pip install slowapi

# backend/app/main.py
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

# backend/app/api/auth.py
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@router.post("/login")
@limiter.limit("5/minute")  # Max 5 login attempts per minute
def login(request: Request, credentials: UserLogin, db: Session):
    # ... login logic
```

---

### BUG #7: Email Notifications Not Sent

**Severity:** 🟡 HIGH - Missing Feature  
**Location:** `backend/app/api/storefront.py` (create_order)  
**Fix:** Add email sending to background tasks

```python
# backend/app/api/storefront.py

from app.utils.email import send_order_confirmation

@router.post("/orders", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    order_data: OrderCreate,
    background_tasks: BackgroundTasks,  # ✅ Already passed as parameter
    shop: Shop = Depends(get_current_shop),
    db: Session = Depends(get_db)
):
    # ... order creation logic ...
    
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    
    # ✅ Add email notification
    if order_data.customer_email:
        background_tasks.add_task(
            send_order_confirmation,
            order_data.customer_email,
            new_order
        )
    
    return new_order
```

---

### BUG #8: Insufficient Image Upload Validation

**Severity:** 🟡 HIGH - Security Risk  
**Location:** `backend/app/api/upload.py`  
**Fix:** Add strict validation

```python
# backend/app/api/upload.py

from PIL import Image
import io

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.gif'}

@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    # Check file size
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(400, "File too large (max 5MB)")
    
    # Check extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"Invalid file type. Allowed: {ALLOWED_EXTENSIONS}")
    
    # Verify it's actually an image
    try:
        image = Image.open(io.BytesIO(contents))
        image.verify()  # Validates image data
    except Exception:
        raise HTTPException(400, "File is not a valid image")
    
    # Now safe to save
    # ... save logic
```

---

## 📊 Bug Summary

| Bug | Severity | Impact | Fix Time | Status |
|-----|----------|--------|----------|--------|
| #1 OrderItem Model | 🔴 Critical | App Breaking | 5 min | ❌ |
| #2 finalTotal Variable | 🔴 Critical | Checkout Breaking | 10 min | ❌ |
| #3 Missing Migrations | 🟡 High | Deployment Risk | 30 min | ❌ |
| #4 Domain Mismatch | 🟡 High | Production Breaking | 5 min | ❌ |
| #5 No Health Checks | 🟡 High | Startup Issues | 10 min | ❌ |
| #6 No Rate Limiting | 🟡 High | Security Risk | 20 min | ❌ |
| #7 No Email Notifications | 🟡 High | Missing Feature | 15 min | ❌ |
| #8 Image Validation | 🟡 High | Security Risk | 20 min | ❌ |

**Total Fix Time:** ~2 hours

---

## 🎯 Recommended Fix Order

1. **Bug #2** (finalTotal) - Quickest win, fixes checkout
2. **Bug #1** (OrderItem) - Critical for data integrity
3. **Bug #4** (Domain) - 5-minute fix, prevents production issues
4. **Bug #5** (Health Checks) - Improves reliability
5. **Bug #3** (Migrations) - Required for deployment
6. **Bug #6** (Rate Limiting) - Security improvement
7. **Bug #7** (Email) - Feature completion
8. **Bug #8** (Image Validation) - Security hardening

---

## 🧪 Verify All Fixes

```bash
# Run complete test suite
./run_tests.sh

# Expected results:
# ✅ Backend Tests: 95%+ pass
# ✅ Frontend Tests: 90%+ pass
# ✅ Bug Checks: 6/8 pass (bugs #6-8 may still show warnings if not implemented)
```

---

**Last Updated:** April 10, 2026  
**Priority:** Critical - Fix Before Launch  
**Estimated Time:** 2 hours total
