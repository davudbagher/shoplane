> **Out of date:** this was written on April 10, 2026. The critical bugs below have mostly been fixed, and the multi-tenancy described as clean did not check shop ownership until November 2026. Read it as history.

# 🔍 SHOPLANE (1LINE.AZ) - COMPREHENSIVE PROJECT ANALYSIS

**Date:** April 10, 2026  
**Project:** Multi-tenant SaaS E-commerce Platform for Azerbaijan  
**Stack:** FastAPI + React 19 + PostgreSQL + Zustand

---

## ✅ WHAT'S GOOD (STRENGTHS)

### Architecture & Design
1. **✅ Clean Multi-tenancy** - Subdomain-based isolation with `X-Shop-Subdomain` header approach is elegant and works well for SaaS
2. **✅ Feature-Sliced Frontend** - Well-organized codebase with `features/`, `shared/`, clear separation of concerns
3. **✅ Proper ORM Usage** - SQLAlchemy 2.0 with good model design, relationships, and cascading deletes
4. **✅ JWT Authentication** - Secure password hashing (bcrypt), token-based auth with proper expiration
5. **✅ Azerbaijan Localization** - Proper currency (AZN), cities, districts, payment methods (COD, MilliKart, BirBank, Pasha Pay)
6. **✅ Lead Pipeline** - Complete merchant onboarding flow from landing page to shop creation
7. **✅ Coupon System** - Well-implemented with percentage/fixed discounts, product scoping, usage limits, time bounds
8. **✅ Order Management** - Full lifecycle tracking, status flow, admin notes, WhatsApp integration
9. **✅ Variant Support** - JSON-based variant system for products (color, size, stock)
10. **✅ Payment Flexibility** - Multiple payment methods, shop-level configuration, MilliKart integration ready

### Code Quality
11. **✅ Good API Documentation** - FastAPI auto-generated docs at `/docs` and `/redoc`
12. **✅ Proper Error Handling** - Global exception handler, validation errors, HTTP exceptions
13. **✅ Database Migrations** - Alembic setup with migration history
14. **✅ Docker Configuration** - Multi-stage builds, nginx reverse proxy, proper service separation
15. **✅ State Management** - Good hybrid approach (Context for auth, Zustand for shops, localStorage for cart)
16. **✅ Mobile-First Design** - Tailwind CSS with responsive breakpoints, mobile-optimized product grids

### Business Logic
17. **✅ Subscription Model** - Trial/Active/Expired statuses with kill switch
18. **✅ Inventory Tracking** - Stock management, backorder support, low-stock alerts
19. **✅ Denormalized Orders** - Product snapshots at order time (preserves history)
20. **✅ SEO Fields** - Meta titles, descriptions, slugs on products and shops

---

## 🚨 WHAT'S BROKEN (CRITICAL BUGS)

### 🔴 CRITICAL - Will Cause Failures

#### 1. **OrderItem Model Commented Out in order.py**
**File:** `backend/app/models/order.py` (lines 94-122)
```python
# class OrderItem(Base):  # <-- COMMENTED OUT!
```
**Impact:** OrderItem model is defined in `order_item.py` but the relationship in Order model references it. This creates a broken relationship and will cause SQLAlchemy errors when loading order items.

**Fix:** Uncomment the OrderItem class in `order.py` OR ensure proper import from `order_item.py`

---

#### 2. **Undefined Variable `finalTotal` in CheckoutPage**
**File:** `frontend/src/features/storefront/pages/CheckoutPage.jsx` (line ~140)
```javascript
const paymentUrl = `${shop.millikart_payment_link}?amount=${finalTotal}&order=${order.order_number}`;
```
**Impact:** `finalTotal` is defined AFTER this line (hoisting issue with `const`). This will throw a `ReferenceError` and crash the checkout for online payments.

**Fix:** Move `finalTotal` calculation before the payment redirect logic.

---

#### 3. **Missing Lead & Coupon Table Migrations**
**Issue:** No Alembic migration exists for `leads` and `coupons` tables. They're created via `Base.metadata.create_all()` at startup.

**Impact:** 
- In production with read-only migrations, tables won't be created
- Schema drift between environments
- Cannot track database version properly

**Fix:** Create proper Alembic migrations for these tables.

---

#### 4. **No Database Health Check in Docker Compose**
**File:** `docker-compose.yml`
```yaml
backend:
  depends_on:
    - db  # Only waits for container start, not DB readiness
```
**Impact:** Backend may start before PostgreSQL is ready to accept connections, causing startup failures.

**Fix:** Add healthcheck to db service and use `condition: service_healthy`

---

#### 5. **Domain Mismatch: `1line.az` vs `1link.az`**
**Files:**
- `nginx/nginx.conf`: uses `1line.az`
- `backend/.env.example`: uses `BASE_DOMAIN=1link.az` (typo)

**Impact:** CORS errors, subdomain detection failures, broken routing in production.

**Fix:** Standardize to `1line.az` everywhere.

---

### 🟡 HIGH PRIORITY - Will Cause Issues

#### 6. **Order Creation Missing Email Notification**
**File:** `backend/app/api/storefront.py` (create_order)
- Email utility exists (`app/utils/email.py`) but is never called
- Background tasks parameter is passed but unused

**Impact:** Customers don't receive order confirmation emails.

**Fix:** Add email sending in background task after order creation.

---

#### 7. **No Input Sanitization on Phone Numbers**
**Files:** Multiple (order creation, customer creation, lead forms)
- Phone validation only checks regex pattern
- No normalization to standard format (+994XXXXXXXXX)

**Impact:** Duplicate customers, lookup failures, WhatsApp integration breaks.

**Fix:** Normalize phone numbers on input.

---

#### 8. **Checkout Payment Redirect Uses `window.location.href`**
**File:** `frontend/src/features/storefront/pages/CheckoutPage.jsx`
```javascript
window.location.href = paymentUrl; // Breaks SPA
```
**Impact:** Breaks React SPA, loses state, can't handle payment callback properly.

**Fix:** Use proper payment gateway integration with callback URLs.

---

#### 9. **Cart Items Don't Validate Product Existence**
**File:** `frontend/src/features/storefront/pages/CheckoutPage.jsx`
- Cart stores `product_id` but doesn't verify products still exist/are active
- Backend validates, but frontend shows stale cart items

**Impact:** Users can have products in cart that are deleted/disabled, leading to checkout errors.

**Fix:** Add cart validation API endpoint.

---

#### 10. **No Rate Limiting on Authentication**
**File:** `backend/app/api/auth.py`
- No brute-force protection on login endpoint
- No account lockout after failed attempts

**Impact:** Vulnerable to password brute-force attacks.

**Fix:** Add rate limiting (slowapi or similar).

---

#### 11. **Image Upload Has No Size/Type Validation**
**File:** `backend/app/api/upload.py`
- Only checks `content_type.startswith("image/")`
- No file size limit enforcement
- No image validation (could upload malicious files disguised as images)

**Impact:** Security vulnerability, storage exhaustion.

**Fix:** Add strict validation (size < 5MB, whitelist extensions, use Pillow to verify).

---

#### 12. **Admin Orders Router Prefix Mismatch**
**File:** `backend/app/main.py`
```python
app.include_router(admin_orders.router)  # No prefix!
```
**File:** `backend/app/api/admin_orders.py`
```python
router = APIRouter(prefix="/admin/orders", tags=["Admin - Orders"])
```
**Impact:** Works but inconsistent with other routers. Risk of route collisions.

**Fix:** Use consistent prefix pattern in main.py.

---

### 🟢 MEDIUM PRIORITY - Should Be Fixed

#### 13. **No Tests Exist**
- Zero unit tests, integration tests, or E2E tests
- Manual test scripts only (`test_coupon.py`, `test_shop_login.py`)

**Impact:** Cannot verify functionality, regression risk, difficult to refactor safely.

---

#### 14. **Dead Dependencies in Frontend**
**File:** `frontend/package.json`
- `react-hook-form` installed but never used
- `@types/react`, `@types/react-dom` installed but project is JavaScript
- `@headlessui/react`, `@heroicons/react` minimally used

**Impact:** Larger bundle size, confusion.

---

#### 15. **No Pagination on Orders List (Admin)**
**File:** `backend/app/api/admin_orders.py`
- Returns all orders without pagination
- Will cause performance issues with 1000+ orders

**Fix:** Add pagination (like products endpoint).

---

#### 16. **Missing CSRF Protection**
- CORS allows credentials but no CSRF token validation
- Forms vulnerable to cross-site request forgery

**Fix:** Add CSRF protection middleware.

---

#### 17. **No Caching Layer**
- Product listings, shop info fetched from DB every request
- No Redis caching as mentioned in `.env.example`

**Impact:** Slow response times under load.

---

#### 18. **Order Status Flow Not Enforced**
**File:** `backend/app/api/admin_orders.py`
- Can jump from PENDING → DELIVERED without intermediate steps
- No validation of status transitions

**Fix:** Add state machine validation for order status transitions.

---

#### 19. **No Backup Strategy**
- PostgreSQL has no automated backups configured
- Image uploads on local filesystem (not S3/Cloudinary)

**Impact:** Data loss risk.

---

#### 20. **Missing Accessibility (a11y)**
- Forms lack proper ARIA labels
- No keyboard navigation support
- Color contrast issues in some components

---

## 📋 WHAT NEEDS TO BE FIXED BEFORE LAUNCH

### Must-Have (Blockers)

- [ ] **Fix OrderItem model** (uncomment or properly import)
- [ ] **Fix `finalTotal` undefined variable** in CheckoutPage
- [ ] **Create missing Alembic migrations** (leads, coupons)
- [ ] **Add Docker health checks** for database
- [ ] **Fix domain mismatch** (1line vs 1link)
- [ ] **Implement email notifications** for orders
- [ ] **Add image upload validation** (size, type, malware)
- [ ] **Add rate limiting** on auth endpoints
- [ ] **Add phone number normalization**
- [ ] **Write comprehensive tests** (see test files below)
- [ ] **Test checkout flow end-to-end** with real data
- [ ] **Fix payment redirect** (don't break SPA)
- [ ] **Add cart validation endpoint**
- [ ] **Set up HTTPS/TLS** in nginx (Let's Encrypt)
- [ ] **Configure proper CORS origins** for production
- [ ] **Add database backups** to docker-compose
- [ ] **Add error monitoring** (Sentry or similar)
- [ ] **SEO meta tags** for storefront pages
- [ ] **Mobile responsiveness testing** on real devices
- [ ] **Security audit** (SQL injection, XSS, CSRF)

### Should-Have (Important)

- [ ] **Order status transition validation**
- [ ] **Admin orders pagination**
- [ ] **Redis caching layer**
- [ ] **Remove dead dependencies**
- [ ] **Add loading states** to all async operations
- [ ] **Error boundaries** in React
- [ ] **Form validation feedback** (react-hook-form)
- [ ] **404 page** for unknown routes
- [ ] **Analytics integration** (Google Analytics, Plausible)
- [ ] **Sitemap generation** for SEO
- [ ] **robots.txt** configuration
- [ ] **Social media sharing** (Open Graph, Twitter Cards)
- [ ] **Accessibility audit** (WCAG 2.1 AA)
- [ ] **Performance optimization** (code splitting, lazy loading)
- [ ] **Image optimization** (WebP, lazy loading, CDN)

### Nice-to-Have (Post-Launch)

- [ ] **Advanced analytics dashboard** (revenue charts, customer insights)
- [ ] **Export orders to CSV/PDF**
- [ ] **Bulk product operations** (activate, delete, update prices)
- [ ] **Product reviews/ratings**
- [ ] **Wishlist sharing**
- [ ] **Abandoned cart recovery emails**
- [ ] **Loyalty program**
- [ ] **Multi-language support** (AZ, EN, RU)
- [ ] **Push notifications**
- [ ] **Mobile app** (React Native)
- [ ] **API rate limiting per shop**
- [ ] **Webhook system** for order events
- [ ] **Integration marketplace** (delivery services, accounting)

---

## 💻 WHAT NEEDS TO BE CODED

### Backend (Python/FastAPI)

```python
# 1. Order status validation middleware
class OrderStatusTransition:
    ALLOWED_TRANSITIONS = {
        "pending": ["confirmed", "cancelled"],
        "confirmed": ["processing", "cancelled"],
        "processing": ["shipped", "cancelled"],
        "shipped": ["delivered"],
        "delivered": ["refunded"],
        "cancelled": [],
        "refunded": [],
    }
```

```python
# 2. Rate limiting decorator
from slowapi import Limiter
limiter = Limiter(key_func=get_remote_address)

@router.post("/login")
@limiter.limit("5/minute")
def login(request: Request, ...):
```

```python
# 3. Cart validation endpoint
@router.post("/storefront/validate-cart")
def validate_cart(product_ids: List[int], db: Session, shop: Shop):
    """Check if all products in cart are still available"""
```

```python
# 4. Phone normalization utility
def normalize_phone(phone: str) -> str:
    """Normalize to +994XXXXXXXXX format"""
    cleaned = re.sub(r'[^\d+]', '', phone)
    if cleaned.startswith('0'):
        cleaned = '+994' + cleaned[1:]
    elif not cleaned.startswith('+'):
        cleaned = '+994' + cleaned
    return cleaned
```

```python
# 5. Email notification on order creation
from app.utils.email import send_order_confirmation

background_tasks.add_task(send_order_confirmation, customer_email, order)
```

### Frontend (React)

```jsx
// 1. Error Boundary Component
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    // Log to Sentry
  }
  render() {
    if (this.state.hasError) return <FallbackUI />;
    return this.props.children;
  }
}
```

```jsx
// 2. Cart Validation Hook
const useValidateCart = () => {
  const validate = async () => {
    const cart = JSON.parse(localStorage.getItem('cart'));
    const response = await storefrontApi.validateCart(cart);
    // Remove invalid items
  };
  return { validate };
};
```

```jsx
// 3. Payment Gateway Component
const PaymentGateway = ({ order, shop }) => {
  // Proper iframe/modal for payment
  // Handle callback
  // Update order status
};
```

```jsx
// 4. 404 Page
const NotFound = () => (
  <div>
    <h1>404 - Page Not Found</h1>
    <Link to="/">Go Home</Link>
  </div>
);
```

### Database Migrations (Alembic)

```python
# Create leads table migration
def upgrade():
    op.create_table(
        'leads',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('full_name', sa.String, nullable=False),
        sa.Column('email', sa.String, nullable=False),
        # ... all other fields
    )

# Create coupons table migration  
def upgrade():
    op.create_table(
        'coupons',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('code', sa.String, nullable=False),
        # ... all other fields
    )
```

### Docker Configuration

```yaml
# Add to docker-compose.yml
db:
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U shoplane_user -d shoplane_db"]
    interval: 5s
    timeout: 5s
    retries: 5

backend:
  depends_on:
    db:
      condition: service_healthy

# Add backup volume
volumes:
  postgres_backups:
  
# Add backup cron service
db-backup:
  image: prodrigestivill/postgres-backup-local
  environment:
    - POSTGRES_HOST=db
    - POSTGRES_DB=shoplane_db
    - POSTGRES_USER=shoplane_user
    - POSTGRES_PASSWORD=shoplane_pass
    - SCHEDULE=@daily
    - BACKUP_KEEP_DAYS=7
  volumes:
    - postgres_backups:/backups
```

---

## 🎯 LAUNCH READINESS CHECKLIST

### Pre-Launch (Week 1-2)
- [ ] Fix all critical bugs (items 1-12 above)
- [ ] Run comprehensive test suite
- [ ] Fix all test failures
- [ ] Security audit (OWASP top 10)
- [ ] Performance testing (load test with 100 concurrent users)
- [ ] Mobile testing (iOS Safari, Android Chrome)
- [ ] Browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Set up monitoring (Sentry, UptimeRobot)
- [ ] Configure production environment variables
- [ ] Set up SSL certificates

### Launch Preparation (Week 3)
- [ ] Database migration to production
- [ ] CDN setup for static assets
- [ ] Email service configuration (SendGrid, Mailgun)
- [ ] Backup strategy tested
- [ ] Rollback plan documented
- [ ] Load testing completed
- [ ] Security scan completed
- [ ] Documentation finalized
- [ ] User guides created
- [ ] API documentation published

### Launch (Week 4)
- [ ] Deploy to production
- [ ] Verify all endpoints
- [ ] Test checkout flow with real payment
- [ ] Monitor error rates
- [ ] Monitor performance
- [ ] Customer support ready
- [ ] Marketing campaigns active
- [ ] Analytics tracking verified

### Post-Launch (Ongoing)
- [ ] Monitor user feedback
- [ ] Fix bugs as reported
- [ ] Implement should-have items
- [ ] Scale infrastructure as needed
- [ ] Add nice-to-have features
- [ ] Build integrations
- [ ] Expand to new markets

---

## 📊 PROJECT STATISTICS

| Metric | Count |
|--------|-------|
| **Backend Endpoints** | ~45 |
| **Database Models** | 8 |
| **Frontend Pages** | 20+ |
| **React Components** | 40+ |
| **API Modules** | 8 |
| **Alembic Migrations** | 5 (2 missing) |
| **Test Coverage** | 0% ⚠️ |
| **Critical Bugs** | 5 🔴 |
| **High Priority** | 7 🟡 |
| **Medium Priority** | 8 🟢 |
| **Launch Blockers** | 16 |
| **Estimated Time to Launch** | 3-4 weeks (with dedicated team) |

---

## 🔐 SECURITY CONCERNS

1. **No rate limiting** - Brute force attacks possible
2. **No CSRF protection** - Cross-site request forgery risk
3. **File upload vulnerabilities** - Insufficient validation
4. **JWT stored in localStorage** - XSS can steal tokens
5. **No input sanitization** - XSS risk in user-generated content
6. **SQL injection risk** - Using string interpolation anywhere?
7. **No API versioning** - Breaking changes will affect clients
8. **Secrets in environment files** - Need proper secret management
9. **No audit logging** - Can't track who changed what
10. **No HTTPS** - Data transmitted in plaintext

---

## 🚀 RECOMMENDATIONS

### Immediate Actions (This Week)
1. Fix the 5 critical bugs
2. Run the comprehensive test suite (created below)
3. Fix all test failures
4. Add rate limiting
5. Fix image upload validation

### Short-term (2-4 Weeks)
1. Implement all launch blockers fixes
2. Write missing migrations
3. Set up proper CI/CD
4. Add monitoring and logging
5. Security audit

### Medium-term (1-3 Months)
1. Add caching layer
2. Implement should-have items
3. Performance optimization
4. Accessibility improvements
5. Mobile app planning

### Long-term (3-6 Months)
1. Expand payment options
2. Multi-language support
3. Advanced analytics
4. Integration marketplace
5. Mobile app development

---

**Overall Assessment:** 
The project has a **solid foundation** with good architecture and clean code organization. However, there are **critical bugs that will prevent launch** and a **complete lack of tests** makes it risky to deploy. With 3-4 weeks of focused development to fix the identified issues, this platform can be production-ready.

**Risk Level:** 🔴 HIGH (due to critical bugs and no tests)  
**Code Quality:** 🟢 GOOD (well-structured, clean patterns)  
**Launch Readiness:** 🟡 60% (needs critical fixes + testing)
