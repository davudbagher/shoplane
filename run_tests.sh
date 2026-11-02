#!/bin/bash
# ============================================
# SHOPLANE COMPREHENSIVE TEST RUNNER
# Runs all backend and frontend tests
# ============================================

set -e  # Exit on first error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}🧪 SHOPLANE COMPREHENSIVE TEST SUITE${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Track overall status
OVERALL_STATUS=0
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# ============================================
# BACKEND TESTS
# ============================================
echo -e "${BLUE}🐍 RUNNING BACKEND TESTS...${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

cd backend

# Check if virtual environment exists
if [ ! -d "venv" ] && [ ! -d ".venv" ]; then
    echo -e "${YELLOW}⚠️  No virtual environment found. Creating one...${NC}"
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements-dev.txt
    pip install pytest-asyncio pytest-cov faker
fi

# Activate virtual environment
if [ -d "venv" ]; then
    source venv/bin/activate
elif [ -d ".venv" ]; then
    source .venv/bin/activate
fi

echo -e "${BLUE}📦 Installing test dependencies...${NC}"
pip install -q -r requirements-dev.txt pytest-asyncio pytest-cov faker 2>&1 | grep -v "Requirement already satisfied" || true

echo ""
echo -e "${BLUE}🔍 Running Authentication Tests...${NC}"
if pytest tests/test_auth.py -v --tb=short -q; then
    echo -e "${GREEN}✅ Auth tests passed${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}❌ Auth tests failed${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    OVERALL_STATUS=1
fi
TESTS_RUN=$((TESTS_RUN + 1))

echo ""
echo -e "${BLUE}🛍️  Running Shop Tests...${NC}"
if pytest tests/test_shops.py -v --tb=short -q; then
    echo -e "${GREEN}✅ Shop tests passed${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}❌ Shop tests failed${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    OVERALL_STATUS=1
fi
TESTS_RUN=$((TESTS_RUN + 1))

echo ""
echo -e "${BLUE}📦 Running Product Tests...${NC}"
if pytest tests/test_products.py -v --tb=short -q; then
    echo -e "${GREEN}✅ Product tests passed${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}❌ Product tests failed${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    OVERALL_STATUS=1
fi
TESTS_RUN=$((TESTS_RUN + 1))

echo ""
echo -e "${BLUE}🛒 Running Order Tests...${NC}"
if pytest tests/test_orders.py -v --tb=short -q; then
    echo -e "${GREEN}✅ Order tests passed${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}❌ Order tests failed${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    OVERALL_STATUS=1
fi
TESTS_RUN=$((TESTS_RUN + 1))

echo ""
echo -e "${BLUE}🎫 Running Coupon Tests...${NC}"
if pytest tests/test_coupons.py -v --tb=short -q; then
    echo -e "${GREEN}✅ Coupon tests passed${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}❌ Coupon tests failed${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    OVERALL_STATUS=1
fi
TESTS_RUN=$((TESTS_RUN + 1))

echo ""
echo -e "${BLUE}🏪 Running Storefront Tests...${NC}"
if pytest tests/test_storefront.py -v --tb=short -q; then
    echo -e "${GREEN}✅ Storefront tests passed${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}❌ Storefront tests failed${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    OVERALL_STATUS=1
fi
TESTS_RUN=$((TESTS_RUN + 1))

echo ""
echo -e "${BLUE}🗄️  Running Model & Database Tests...${NC}"
if pytest tests/test_models.py -v --tb=short -q; then
    echo -e "${GREEN}✅ Model tests passed${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}❌ Model tests failed${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    OVERALL_STATUS=1
fi
TESTS_RUN=$((TESTS_RUN + 1))

echo ""
echo -e "${BLUE}📊 Backend Test Coverage Report:${NC}"
pytest tests/ --cov=app --cov-report=term-missing --no-header -q 2>&1 | tail -30 || true

cd ..

echo ""
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}🌐 RUNNING FRONTEND TESTS...${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

cd frontend

echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
npm install --silent 2>&1 | tail -5 || true

echo ""
echo -e "${BLUE}🔍 Running Component Tests...${NC}"
if npx vitest run --reporter=verbose; then
    echo -e "${GREEN}✅ Frontend tests passed${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}❌ Frontend tests failed${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    OVERALL_STATUS=1
fi
TESTS_RUN=$((TESTS_RUN + 1))

cd ..

# ============================================
# INTEGRATION TESTS
# ============================================
echo ""
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}🔗 RUNNING INTEGRATION CHECKS...${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

echo -e "${BLUE}🔍 Checking for known bugs...${NC}"

# Bug 1: Check if OrderItem is commented out
echo ""
echo -e "${YELLOW}Bug #1: Checking OrderItem model in order.py...${NC}"
if grep -q "# class OrderItem(Base):" backend/app/models/order.py; then
    echo -e "${RED}❌ FOUND BUG: OrderItem class is commented out in order.py${NC}"
    echo -e "${YELLOW}   Location: backend/app/models/order.py (lines 94-122)${NC}"
    echo -e "${YELLOW}   Fix: Uncomment the OrderItem class or ensure proper import from order_item.py${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
else
    echo -e "${GREEN}✅ OrderItem model is properly defined${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
fi
TESTS_RUN=$((TESTS_RUN + 1))

# Bug 2: Check for finalTotal undefined in CheckoutPage
echo ""
echo -e "${YELLOW}Bug #2: Checking finalTotal variable in CheckoutPage...${NC}"
if grep -n "finalTotal" frontend/src/features/storefront/pages/CheckoutPage.jsx | grep -q "millikart_payment_link.*finalTotal"; then
    # Check if it's used before definition
    LINE_USAGE=$(grep -n "millikart_payment_link.*finalTotal" frontend/src/features/storefront/pages/CheckoutPage.jsx | cut -d: -f1)
    LINE_DEFINITION=$(grep -n "const finalTotal = " frontend/src/features/storefront/pages/CheckoutPage.jsx | cut -d: -f1)
    
    if [ ! -z "$LINE_USAGE" ] && [ ! -z "$LINE_DEFINITION" ] && [ "$LINE_USAGE" -lt "$LINE_DEFINITION" ]; then
        echo -e "${RED}❌ FOUND BUG: finalTotal used at line $LINE_USAGE before definition at line $LINE_DEFINITION${NC}"
        echo -e "${YELLOW}   Location: frontend/src/features/storefront/pages/CheckoutPage.jsx${NC}"
        echo -e "${YELLOW}   Fix: Move 'const finalTotal' calculation before the payment redirect${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    else
        echo -e "${GREEN}✅ finalTotal variable is properly ordered${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    fi
else
    echo -e "${GREEN}✅ No finalTotal issue detected${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
fi
TESTS_RUN=$((TESTS_RUN + 1))

# Bug 3: Check domain mismatch
echo ""
echo -e "${YELLOW}Bug #3: Checking domain consistency...${NC}"
NGINX_DOMAIN=$(grep -o "1line\.az\|1link\.az" nginx/nginx.conf | head -1)
ENV_DOMAIN=$(grep "BASE_DOMAIN=" backend/.env.example | cut -d'=' -f2)

if [ "$NGINX_DOMAIN" != "$ENV_DOMAIN" ]; then
    echo -e "${RED}❌ FOUND BUG: Domain mismatch detected${NC}"
    echo -e "${YELLOW}   Nginx uses: $NGINX_DOMAIN${NC}"
    echo -e "${YELLOW}   .env.example uses: $ENV_DOMAIN${NC}"
    echo -e "${YELLOW}   Fix: Standardize to '1line.az' everywhere${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
else
    echo -e "${GREEN}✅ Domains are consistent${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
fi
TESTS_RUN=$((TESTS_RUN + 1))

# Bug 4: Check for missing migrations
echo ""
echo -e "${YELLOW}Bug #4: Checking for missing Alembic migrations...${NC}"
MISSING_MIGRATIONS=""

# Check if leads table has migration
if ! grep -r "leads" backend/alembic/versions/ > /dev/null 2>&1; then
    MISSING_MIGRATIONS="$MISSING_MIGRATIONS leads"
fi

# Check if coupons table has migration
if ! grep -r "coupons" backend/alembic/versions/ > /dev/null 2>&1; then
    MISSING_MIGRATIONS="$MISSING_MIGRATIONS coupons"
fi

if [ ! -z "$MISSING_MIGRATIONS" ]; then
    echo -e "${RED}❌ FOUND BUG: Missing Alembic migrations for:$MISSING_MIGRATIONS${NC}"
    echo -e "${YELLOW}   These tables are created via Base.metadata.create_all() instead${NC}"
    echo -e "${YELLOW}   Fix: Create proper Alembic migrations${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
else
    echo -e "${GREEN}✅ All tables have proper Alembic migrations${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
fi
TESTS_RUN=$((TESTS_RUN + 1))

# Bug 5: Check for missing health checks in docker-compose
echo ""
echo -e "${YELLOW}Bug #5: Checking Docker health checks...${NC}"
if ! grep -q "healthcheck:" docker-compose.yml; then
    echo -e "${RED}❌ FOUND BUG: No health checks defined in docker-compose.yml${NC}"
    echo -e "${YELLOW}   This can cause startup race conditions${NC}"
    echo -e "${YELLOW}   Fix: Add healthcheck to db service and use condition: service_healthy${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
else
    echo -e "${GREEN}✅ Health checks are configured${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
fi
TESTS_RUN=$((TESTS_RUN + 1))

# Bug 6: Check for rate limiting
echo ""
echo -e "${YELLOW}Bug #6: Checking for rate limiting on auth endpoints...${NC}"
if ! grep -r "slowapi\|rate_limit\|RateLimiter" backend/app/api/auth.py > /dev/null 2>&1; then
    echo -e "${RED}❌ FOUND BUG: No rate limiting on authentication endpoints${NC}"
    echo -e "${YELLOW}   Vulnerable to brute-force attacks${NC}"
    echo -e "${YELLOW}   Fix: Add slowapi or similar rate limiting${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
else
    echo -e "${GREEN}✅ Rate limiting is configured${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
fi
TESTS_RUN=$((TESTS_RUN + 1))

# Bug 7: Check for email notifications
echo ""
echo -e "${YELLOW}Bug #7: Checking for email notifications on order creation...${NC}"
if ! grep -q "send_order_confirmation\|background_tasks.add_task.*email" backend/app/api/storefront.py > /dev/null 2>&1; then
    echo -e "${RED}❌ FOUND BUG: Email notifications not sent on order creation${NC}"
    echo -e "${YELLOW}   Email utility exists but is never called${NC}"
    echo -e "${YELLOW}   Fix: Add background_tasks.add_task(send_order_confirmation, ...)${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
else
    echo -e "${GREEN}✅ Email notifications are configured${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
fi
TESTS_RUN=$((TESTS_RUN + 1))

# Bug 8: Check image upload validation
echo ""
echo -e "${YELLOW}Bug #8: Checking image upload validation...${NC}"
if ! grep -q "max.*size\|file.*size\|content.*length" backend/app/api/upload.py > /dev/null 2>&1; then
    echo -e "${RED}❌ FOUND BUG: Insufficient image upload validation${NC}"
    echo -e "${YELLOW}   No file size limit enforcement detected${NC}"
    echo -e "${YELLOW}   Fix: Add size limits and strict type validation${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
else
    echo -e "${GREEN}✅ Image upload validation is adequate${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
fi
TESTS_RUN=$((TESTS_RUN + 1))

# ============================================
# SUMMARY
# ============================================
echo ""
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}📊 TEST SUMMARY${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""
echo -e "Total Checks:  $TESTS_RUN"
echo -e "${GREEN}Passed:        $TESTS_PASSED${NC}"
echo -e "${RED}Failed:        $TESTS_FAILED${NC}"
echo ""

if [ $OVERALL_STATUS -eq 0 ] && [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! Ready for launch! 🚀${NC}"
else
    echo -e "${RED}⚠️  SOME TESTS FAILED. Fix issues before launch!${NC}"
    echo ""
    echo -e "${YELLOW}Critical fixes needed:${NC}"
    echo -e "  1. Fix OrderItem model (uncomment or import properly)"
    echo -e "  2. Fix finalTotal undefined variable in CheckoutPage"
    echo -e "  3. Create missing Alembic migrations (leads, coupons)"
    echo -e "  4. Add Docker health checks"
    echo -e "  5. Fix domain mismatch (1line vs 1link)"
    echo -e "  6. Implement email notifications"
    echo -e "  7. Add rate limiting on auth endpoints"
    echo -e "  8. Add image upload validation"
    echo ""
    echo -e "${YELLOW}See docs/PROJECT_ANALYSIS.md for full details${NC}"
fi

echo ""
echo -e "${BLUE}============================================${NC}"

exit $OVERALL_STATUS
