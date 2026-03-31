# 🧪 Test Kitchen Login & Lead Flow

## Quick Test Checklist

### ✅ Step 1: Start Backend Server

```bash
cd /Users/davinchee/shoplane/backend
uvicorn app.main:app --reload
```

Expected output:
```
🚀 Starting 1line.az API...
📊 Database tables created/verified
🔐 JWT authentication enabled
🏪 Multi-tenant routing ready
✅ Server is ready to serve Azerbaijan's businesses! 🇦🇿
```

### ✅ Step 2: Start Frontend Server

```bash
cd /Users/davinchee/shoplane/frontend
npm run dev
```

Expected output:
```
VITE v7.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### ✅ Step 3: Login as Superuser

1. Open browser: `http://localhost:5173/login`
2. Enter credentials:
   - **Email**: `davudbaghir@gmail.com`
   - **Password**: (your password)
3. Click "Daxil Ol"

**Expected Result**: 
- Should redirect to `http://localhost:5173/kitchen`
- Should see "Mətbəx (The Kitchen)" dashboard
- Should see stats cards (Ümumi Mağaza, Aktiv Mağaza, etc.)

### ✅ Step 4: Test Lead Form (Landing Page)

1. Open new incognito window: `http://localhost:5173/`
2. Scroll to bottom section "Biznesinizi rəqəmsal dünyaya daşıyın"
3. Fill the form:
   ```
   Ad və Soyad: Test User
   WhatsApp nömrəsi: +994501234567
   Gözlənilən Mağaza Adı: Test Shop
   Kateqoriya: Geyim
   ```
4. Click "Müraciət et"

**Expected Result**:
- Should see success message: "Təşəkkür edirik! Müraciətiniz qəbul edildi."
- Open browser DevTools (F12) → Network tab
- Check request to `/admin/super-admin/leads`
- Status should be `201 Created`

### ✅ Step 5: Verify Lead in Kitchen

1. Go back to Kitchen dashboard (original window)
2. Look at right sidebar "Son Müraciətlər"
3. You should see the test lead

**Expected Result**:
- Lead shows: "Test User"
- Shows shop name: "Test Shop"
- Shows "Yeni" badge (orange)
- Shows WhatsApp link
- Shows today's date

---

## Troubleshooting

### Problem: Login redirects to /admin/dashboard instead of /kitchen

**Solution 1**: Clear browser localStorage
```javascript
// Open browser console (F12)
localStorage.clear()
sessionStorage.clear()
// Refresh page and try login again
```

**Solution 2**: Check if user is actually superuser
```bash
cd /Users/davinchee/shoplane/backend
python check_users.py
```
Look for "Superuser: 👑 YES"

**Solution 3**: Manually navigate
After login, go to: `http://localhost:5173/kitchen`

### Problem: Lead form shows error

**Check Network Tab** (F12):
- Request URL: `http://localhost:8000/admin/super-admin/leads`
- Method: `POST`
- Status Code: Should be `201`

**Common Issues**:
1. **Backend not running**: Start with `uvicorn app.main:app --reload`
2. **CORS error**: Check backend allows `http://localhost:5173`
3. **404 Not Found**: Check API endpoint exists in `backend/app/api/super_admin.py`

**Test API Directly**:
```bash
curl -X POST http://localhost:8000/admin/super-admin/leads \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test User",
    "whatsapp": "+994501234567",
    "shop_name": "Test Shop",
    "category": "clothing"
  }'
```

### Problem: Kitchen shows "403 Forbidden"

This means you're not logged in as superuser.

**Solution**:
1. Logout
2. Check your user's superuser status:
   ```bash
   python check_users.py
   ```
3. If not superuser, upgrade:
   ```bash
   python create_superuser.py
   ```
   Enter your email and choose "y" to upgrade

---

## Success Criteria

✅ You can login at `/login` and auto-redirect to `/kitchen`
✅ You see dashboard stats (shops, leads, etc.)
✅ You can submit lead from landing page
✅ Lead appears in Kitchen dashboard
✅ You can click WhatsApp link to contact lead

---

## Next: Manual Onboarding Flow

Once you have a lead in Kitchen:

1. **Contact Lead via WhatsApp**
   - Click "WhatsApp ↗" button next to lead
   - Opens WhatsApp Web with lead's number
   - Discuss shop setup details

2. **Create Shop Manually**
   - Click "+ Yeni Mağaza Əlavə Et" in Kitchen
   - Fill form:
     ```
     Sahibinin adı: (from lead)
     Sahibinin Email-i: (ask lead)
     Mağaza Adı: (from lead)
     Subdomen: (suggest available name)
     Plan növü: Standard or Pro
     ```
   - Click "Mağaza Yarat"

3. **Send Credentials to Merchant**
   - Email them their login credentials
   - Send setup link with token
   - Guide them through first login

---

**Need Help?** Check `KITCHEN_LOGIN_GUIDE.md` for detailed documentation.
