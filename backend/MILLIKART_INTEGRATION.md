# 💳 MilliKart Payment Integration Guide

## Overview

Shoplane supports **one-link MilliKart integration** - shop owners connect their own MilliKart merchant account to receive payments directly. The platform (1line.az) does NOT handle any money - you only charge monthly subscription fees.

---

## For Shop Owners (Merchants)

### Step 1: Register at MilliKart

1. Visit **MilliKart Merchant Portal**: https://millikart.az/merchant-registration
2. Complete the registration form with:
   - Business information (FIN code, business name)
   - Bank account details (IBAN)
   - Contact information
3. Wait for approval (usually 1-2 business days)

### Step 2: Get Your Payment Link

After approval:

1. Log in to your MilliKart merchant dashboard
2. Navigate to **"Payment Links"** or **"Ödəniş Linkləri"**
3. Create a new payment link:
   - Set amount type: **Variable** (məbləğ dəyişkən)
   - Enable dynamic amount: **Yes**
   - Set currency: **AZN**
4. Copy your payment link (looks like):
   ```
   https://pay.millikart.az/merchant/your-merchant-id
   ```

### Step 3: Configure in Shop Settings

1. Log in to your 1line.az admin dashboard
2. Go to **Parametrlər** (Settings)
3. Scroll to **"💳 Ödəniş Parametrləri (MilliKart)"**
4. Enable MilliKart payments
5. Enter:
   - **IBAN**: Your bank account IBAN (AZ2 + 20 digits)
   - **Payment Link**: Your MilliKart payment link from Step 2
6. Click **"Dəyişiklikləri Yadda Saxla"**

### Step 4: Test It

1. Visit your storefront (e.g., `yourshop.1line.az`)
2. Add a product to cart
3. Go to checkout
4. Select **"💳 Onlayn Ödəniş (MilliKart)"**
5. Complete the order
6. You should be redirected to MilliKart payment page

---

## How It Works

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│  Customer   │ ───► │  1line.az    │ ───► │  MilliKart  │
│             │      │   Storefront │      │  Payment    │
└─────────────┘      └──────────────┘      └─────────────┘
                            │                     │
                            │                     │
                            ▼                     ▼
                     ┌──────────────┐      ┌─────────────┐
                     │  Shop Owner  │ ◄─── │   Bank      │
                     │   Dashboard  │      │  Transfer   │
                     └──────────────┘      └─────────────┘
```

1. **Customer** places order and selects online payment
2. **1line.az** creates order with `PENDING` payment status
3. Customer is redirected to **MilliKart** payment page
4. Customer pays with their card
5. **MilliKart** transfers money directly to **Shop Owner's IBAN**
6. Shop owner updates order status to `PAID` in dashboard

---

## Important Notes

### 💰 Money Flow

- **1line.az does NOT touch payment money**
- MilliKart transfers funds **directly to shop owner's bank account**
- 1line.az only charges monthly subscription fee (separate billing)

### 📋 Transaction Fees

- MilliKart charges transaction fees (typically 1-3%)
- Fees are deducted automatically by MilliKart
- Shop owner receives net amount (after fees)

### 🧾 Tax & Compliance

- Shop owners are responsible for their own tax reporting
- MilliKart provides transaction statements
- 1line.az does not provide tax documents for sales

### ✅ Order Management

After customer pays:

1. Shop owner receives notification (email/SMS if configured)
2. Log in to admin dashboard
3. Go to **Sifarişlər** (Orders)
4. Verify payment received in bank account
5. Update order status: `PENDING` → `CONFIRMED` → `SHIPPED`

---

## Troubleshooting

### "MilliKart option not showing at checkout"

**Cause**: MilliKart not enabled or payment link not configured

**Solution**:
1. Go to Settings → Payment Settings
2. Ensure "MilliKart Ödənişlərini Aktivləşdir" is checked
3. Verify payment link is saved (starts with `https://`)
4. Click "Save Changes"

### "Customer redirected but payment fails"

**Possible causes**:
- Payment link is incorrect or expired
- MilliKart account is suspended
- Customer's card declined

**Solution**:
1. Verify payment link in settings
2. Contact MilliKart support: support@millikart.az
3. Offer customer COD (Cash on Delivery) as alternative

### "Money not received in bank account"

**Typical timeline**: 1-3 business days after payment

**Action**:
1. Check MilliKart merchant dashboard for transaction
2. Verify IBAN is correct in settings
3. Contact MilliKart support with transaction ID

---

## API Reference (For Developers)

### Get Payment Settings

```http
GET /admin/shops/{shop_id}/payment-settings
Authorization: Bearer {jwt_token}
```

**Response**:
```json
{
  "millikart_enabled": true,
  "millikart_iban": "AZ20010000000000000000000000",
  "millikart_account_info": "Merchant ID: 12345",
  "millikart_payment_link": "https://pay.millikart.az/merchant/xyz"
}
```

### Update Payment Settings

```http
PUT /admin/shops/{shop_id}/payment-settings
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "millikart_enabled": true,
  "millikart_iban": "AZ20010000000000000000000000",
  "millikart_payment_link": "https://pay.millikart.az/merchant/xyz"
}
```

---

## Support

### For Shop Owners
- **1line.az Support**: support@1line.az
- **Documentation**: https://1line.az/help

### For MilliKart Issues
- **MilliKart Support**: support@millikart.az
- **Phone**: +994 12 123 45 67
- **Website**: https://millikart.az/support

---

## Future Enhancements (Roadmap)

- [ ] Automatic payment status webhook (MilliKart → 1line.az)
- [ ] Payment confirmation via SMS
- [ ] Support for BirBank and Pasha Pay
- [ ] Recurring payments / subscriptions
- [ ] Refund management via dashboard

---

**Built in Azerbaijan 🇦🇿 for Azerbaijan's entrepreneurs**
