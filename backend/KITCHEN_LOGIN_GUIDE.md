# 🔐 Kitchen Admin Login Guide

## Problem Solved

Previously, superusers couldn't properly access the Kitchen dashboard because:
1. Login redirected all users to `/admin/dashboard` instead of `/kitchen`
2. No clear indication of superuser credentials

## ✅ Solution Implemented

### 1. Smart Login Redirect
- **Superusers** → Redirected to `/kitchen` (Platform Admin)
- **Regular users** → Redirected to `/admin/dashboard` (Shop Owner)

### 2. Login Credentials Display
Login page now shows the superuser email for easy reference.

---

## How to Access Kitchen

### Option 1: Using Existing Superuser

Your database already has a superuser:

```
Email: davudbaghir@gmail.com
Password: (your password)
```

**Steps:**
1. Go to http://localhost:5173/login
2. Login with superuser credentials
3. You'll be automatically redirected to `/kitchen`

### Option 2: Create New Superuser

If you forgot your password or want to create a new superuser:

```bash
cd /Users/davinchee/shoplane/backend
python create_superuser.py
```

Follow the prompts:
- Enter email
- Enter password
- Enter full name
- Enter phone (optional)

### Option 3: Check Existing Users

```bash
cd /Users/davinchee/shoplane/backend
python check_users.py
```

This will show:
- All users in database
- Who has superuser status
- Their email addresses

---

## Kitchen Features

Once logged in as superuser, you can access **The Kitchen** at `/kitchen`:

### Dashboard Stats
- Total shops on platform
- Active shops
- New leads (pending müraciətlər)
- Expired shops

### Manage Leads (Landing Page Form)
- View all leads from landing page form
- See lead details: name, whatsapp, shop name
- **NEW**: Click "WhatsApp" to contact lead directly
- **NEW**: "Convert to Shop" button to onboard merchant

### Manage Shops
- View all shops on platform
- Renew subscriptions (+30 gün)
- Suspend/activate shops (kill switch)
- See shop status (trial, active, expired)

---

## Landing Page → Kitchen Flow

### Current Flow:
1. Customer visits landing page (http://localhost:5173/)
2. Fills "Mağaza üçün müraciət et" form
3. Lead is saved to database with status: `PENDING`
4. Superuser sees lead in Kitchen dashboard
5. Superuser contacts lead via WhatsApp
6. Superuser clicks "Convert to Shop" (or manually creates shop)
7. Lead status updated to `ONBOARDED`

### Testing the Flow:

**Step 1: Submit Lead from Landing Page**
```
1. Go to http://localhost:5173/
2. Scroll to "Biznesinizi rəqəmsal dünyaya daşıyın" section
3. Fill form:
   - Ad və Soyad: Test User
   - WhatsApp: +994501234567
   - Mağaza Adı: Test Shop
   - Kateqoriya: Geyim
4. Click "Müraciət et"
5. Should see success message
```

**Step 2: Check Lead in Kitchen**
```
1. Login at http://localhost:5173/login
2. Use superuser credentials
3. Go to Kitchen (should auto-redirect)
4. Look at "Son Müraciətlər" (right sidebar)
5. You should see your test lead
```

---

## Troubleshooting

### "I can't login"

**Check 1: Backend Running**
```bash
cd /Users/davinchee/shoplane/backend
uvicorn app.main:app --reload
```

**Check 2: Frontend Running**
```bash
cd /Users/davinchee/shoplane/frontend
npm run dev
```

**Check 3: API URL**
Create `frontend/.env` if it doesn't exist:
```env
VITE_API_URL=http://localhost:8000
```

**Check 4: Clear Browser Storage**
```javascript
// In browser console (F12):
localStorage.clear()
// Then try login again
```

### "I login but don't see Kitchen"

**Check 1: Are you a superuser?**
```bash
cd /Users/davinchee/shoplane/backend
python check_users.py
```
Look for "Superuser: 👑 YES" next to your email.

**Check 2: Manual Navigation**
After login, manually go to: http://localhost:5173/kitchen

If you see "403 Forbidden", you're not a superuser.

### "Lead form doesn't work"

**Check 1: API Endpoint**
Open browser DevTools (F12) → Network tab
Submit form and check:
- Request URL: `http://localhost:8000/admin/super-admin/leads`
- Status: Should be `201 Created`
- Response: Should have lead data

**Check 2: CORS Issues**
Backend should allow frontend origin. Check `backend/app/main.py`:
```python
allow_origins=[
    "http://localhost:5173",  # Vite default
    "http://localhost:3000",
]
```

---

## API Endpoints for Kitchen

### Leads
```http
POST /admin/super-admin/leads
- Create new lead (public form)

GET /admin/super-admin/leads
- List all leads (requires superuser)

PATCH /admin/super-admin/leads/{lead_id}
- Update lead status (pending → contacted → onboarded)
```

### Shops
```http
GET /admin/super-admin/shops
- List all shops

POST /admin/super-admin/onboard
- Create shop from lead (white-glove onboarding)

POST /admin/super-admin/shops/{id}/renew
- Manual subscription renewal

POST /admin/super-admin/shops/{id}/toggle-status
- Suspend/activate shop
```

### Stats
```http
GET /admin/super-admin/stats
- Platform-wide statistics
```

---

## Next Steps for Better Onboarding

Currently the onboarding is manual (you create shops yourself). Future improvements:

1. **Self-Service Registration**
   - User registers on landing page
   - Creates their own shop
   - Gets 14-day trial automatically

2. **Automated Email/SMS**
   - Welcome email with login credentials
   - Setup instructions
   - Payment reminders

3. **Payment Integration**
   - Online subscription payment
   - Auto-renewal
   - Invoice generation

For now, the **white-glove approach** (manual onboarding) gives you full control over quality and customer relationships.

---

**Built in Azerbaijan 🇦🇿**
