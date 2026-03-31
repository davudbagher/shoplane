# 🧪 Testing Storefront with Multiple Shops

## ⚠️ Problem

When accessing `http://localhost:5173/` locally, the storefront doesn't know which shop to load because there's no subdomain.

The header shows "Mağaza" because the shop API returns a 400 error (no subdomain provided).

---

## ✅ Solution 1: Set Dev Subdomain (Quick)

### **Open Browser Console (F12) and run:**

```javascript
// Set to testshop11 (the shop we created)
localStorage.setItem('dev_shop_subdomain', 'testshop11');
window.location.reload();
```

### **Expected Result:**
- Page reloads
- Header shows: `[🏪] TEST SHOP` (or logo if set)
- Footer shows: "TEST SHOP" contact info

### **To Test Other Shops:**
```javascript
localStorage.setItem('dev_shop_subdomain', 'cheechak');
window.location.reload();
```

### **To Clear (Show Landing Page):**
```javascript
localStorage.removeItem('dev_shop_subdomain');
window.location.reload();
```

---

## ✅ Solution 2: Use Dev Shop Selector Component

### **Add to App.jsx temporarily:**

```jsx
// Add this import at the top
import { DevShopSelector } from "./shared/components/DevShopSelector";

// Add before closing </div> in App component
{!isAdminRoute && <DevShopSelector />}
```

### **What It Does:**
- Adds a floating panel in bottom-right corner
- Shows current subdomain
- Lets you switch between test shops
- Quick access buttons for common test shops

### **Remove After Testing:**
Remember to remove the component after testing!

---

## ✅ Solution 3: Access via Subdomain (Production-Like)

If you have nginx configured locally:

```
http://testshop11.localhost:5173/
http://cheechak.localhost:5173/
```

This requires hosts file configuration and nginx setup.

---

## 🐛 Debugging

### **Check Console Logs:**

Open DevTools (F12) → Console

**Success:**
```
✅ Shop data loaded: {id: 4, name: "TEST SHOP", subdomain: "testshop11", ...}
```

**Error (No Subdomain):**
```
❌ Failed to load shop: AxiosError: Request failed with status code 400
```

**Error (Shop Not Found):**
```
❌ Failed to load shop: AxiosError: Request failed with status code 404
```

### **Check Current Subdomain:**

```javascript
// In browser console
localStorage.getItem('dev_shop_subdomain');
// Should return: "testshop11"
```

### **Check API Request:**

DevTools → Network tab → Look for `/storefront/shop` request

**Headers should include:**
```
X-Shop-Subdomain: testshop11
```

---

## 📋 Available Test Shops

| Subdomain | Shop Name | Credentials |
|-----------|-----------|-------------|
| `testshop11` | TEST SHOP | Email: test@shoplane.az<br>Password: (from create_test_shop.py) |
| `cheechak` | (your test shop) | (check Kitchen) |

---

## 🎯 Expected Behavior

### **With Subdomain Set:**
```
Header: [🏪] TEST SHOP
Footer: TEST SHOP
        Azərbaycan...
```

### **Without Subdomain:**
```
Shows landing page instead
```

### **With Invalid Subdomain:**
```
Header: 🏪 Mağaza tapılmadı
```

---

## 🚀 Quick Start

1. **Open**: `http://localhost:5173/`
2. **Open Console**: F12
3. **Run**: 
   ```javascript
   localStorage.setItem('dev_shop_subdomain', 'testshop11');
   window.location.reload();
   ```
4. **Check Header**: Should show "TEST SHOP"
5. **Check Console**: Should see `✅ Shop data loaded: ...`

---

**Status: ✅ Ready for Testing**
