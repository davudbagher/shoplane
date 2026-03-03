# 🏪 Shoplane - 1link.az Backend

**Multi-tenant e-commerce platform for Azerbaijan's local businesses**

Transform Instagram/WhatsApp sellers into professional online shops with subdomain-based storefronts (e.g., `cheechak.1link.az`, `fitbaku.1link.az`).

---

## 🇦🇿 Features

### For Azerbaijan Sellers
- **Create online shop** with custom subdomain in seconds
- **Product inventory management** with stock tracking
- **Order fulfillment workflow** (pending → confirmed → shipped → delivered)
- **Revenue dashboard** with stats in AZN (Azerbaijani Manat)
- **Mobile-optimized admin panel**

### For Customers
- **Browse products** on mobile-friendly storefront
- **Checkout** with Azerbaijan shipping addresses (Bakı, Gəncə, districts)
- **Multiple payment methods**:
  - 💵 Cash on Delivery (COD)
  - 💳 MilliKart (local card payment)
  - 📱 BirBank (mobile banking)
  - 💰 Pasha Pay (digital wallet)
- **Order tracking** with phone verification

---

## 🚀 Tech Stack

- **Backend**: FastAPI + SQLAlchemy + PostgreSQL
- **Authentication**: JWT tokens + bcrypt
- **Validation**: Pydantic schemas
- **Database**: PostgreSQL with multi-tenant isolation
- **API Docs**: Swagger UI (auto-generated)

---

## 📦 Installation

### Prerequisites
- Python 3.10+
- PostgreSQL 14+

### Setup

1. **Clone repository**
```bash
git clone https://github.com/davudbagher/shoplane.git
cd shoplane/backend
```

2. **Create virtual environment**
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Configure environment variables**
```bash
cp .env.example .env
nano .env  # Edit with your database credentials
```

**Required `.env` variables:**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/shoplane_db
SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
BASE_DOMAIN=1link.az
ADMIN_SUBDOMAIN=admin
```

5. **Create database**
```bash
# In PostgreSQL:
CREATE DATABASE shoplane_db;
```

6. **Run migrations (tables auto-created on startup)**
```bash
python -m app.main
```

7. **Start development server**
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 📚 API Documentation

### Interactive Swagger UI
```
http://localhost:8000/docs
```

### API Endpoints (32 routes)

#### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get JWT token
- `GET /auth/me` - Get current user profile

#### Admin - Shops
- `POST /admin/shops` - Create shop
- `GET /admin/shops` - List user's shops
- `GET /admin/shops/{id}` - Get shop details
- `PUT /admin/shops/{id}` - Update shop
- `POST /admin/shops/{id}/upgrade` - Upgrade to PRO plan
- `DELETE /admin/shops/{id}` - Deactivate shop

#### Admin - Products
- `POST /admin/products/{shop_id}/products` - Add product
- `GET /admin/products/{shop_id}/products` - List products
- `GET /admin/products/{shop_id}/products/{id}` - Get product
- `PUT /admin/products/{shop_id}/products/{id}` - Update product
- `DELETE /admin/products/{shop_id}/products/{id}` - Delete product
- `POST /admin/products/{shop_id}/products/{id}/adjust-stock` - Adjust inventory

#### Admin - Orders
- `GET /admin/orders/{shop_id}/orders` - List orders
- `GET /admin/orders/{shop_id}/orders/{id}` - Get order details
- `PUT /admin/orders/{shop_id}/orders/{id}/status` - Update order status
- `GET /admin/orders/{shop_id}/stats` - Get order statistics
- `POST /admin/orders/{shop_id}/orders/{id}/cancel` - Cancel order

#### Storefront (Public)
- `GET /storefront/shop` - Get shop info (by subdomain)
- `GET /storefront/products` - Browse products
- `GET /storefront/products/{id}` - Product details
- `GET /storefront/categories` - Get categories
- `POST /storefront/orders` - Checkout (create order)
- `GET /storefront/orders/{order_number}` - Track order

---

## 🗄️ Database Schema

### Tables (6)
- `users` - Shop owners
- `shops` - Multi-tenant shops
- `products` - Product inventory
- `customers` - Shop customers
- `orders` - Customer orders
- `order_items` - Order line items

### PostgreSQL Enums (4)
- `subscriptionplan` - BASE (free), PRO (79 AZN/month)
- `orderstatus` - pending, confirmed, processing, shipped, delivered, cancelled
- `paymentmethod` - cash_on_delivery, millikart, birbank, pasha_pay
- `paymentstatus` - pending, completed, failed, refunded, cancelled

---

## 🧪 Testing

### Test Flow (Using Swagger UI)

1. **Register seller**: `POST /auth/register`
2. **Login**: `POST /auth/login` → Get JWT token
3. **Authorize**: Click "Authorize" button, paste token
4. **Create shop**: `POST /admin/shops`
5. **Add product**: `POST /admin/products/{shop_id}/products`
6. **Browse storefront**: `GET /storefront/products?shop=yourshop`
7. **Place order**: `POST /storefront/orders`

---

## 🚀 Deployment

### Production Checklist
- [ ] Set strong `SECRET_KEY` in `.env`
- [ ] Use production PostgreSQL database
- [ ] Configure wildcard DNS: `*.1link.az → server IP`
- [ ] Set up HTTPS with Let's Encrypt
- [ ] Configure CORS for frontend domain
- [ ] Set `reload=False` in uvicorn
- [ ] Use Gunicorn + Nginx reverse proxy
- [ ] Set up database backups
- [ ] Configure logging and monitoring

---

## 📈 Roadmap

### MVP (✅ Complete)
- [x] Multi-tenant architecture
- [x] Shop creation with subdomain
- [x] Product management
- [x] Order management
- [x] Azerbaijan payment methods
- [x] Mobile-optimized APIs

### Phase 2 (Next)
- [ ] Frontend (React storefront)
- [ ] Image upload to S3/Cloudinary
- [ ] Email notifications (order confirmations)
- [ ] SMS notifications via local provider
- [ ] MilliKart payment integration
- [ ] BirBank payment integration

### Phase 3 (Marketplace)
- [ ] Cross-shop product search
- [ ] Price comparison
- [ ] ML-powered product matching
- [ ] Buyer accounts and wishlists

---

## 🤝 Contributing

This is a private MVP. For collaboration inquiries: nigar@1link.az

---

## 📄 License

Proprietary - © 2026 1link.az

---

## 🇦🇿 Built in Azerbaijan

**For Azerbaijan's entrepreneurs** - Turning Instagram sellers into e-commerce champions! 🚀

---

**Author**: Davud Baghir  
**GitHub**: [@davudbagher](https://github.com/davudbagher)  
**Project**: [github.com/davudbagher/shoplane](https://github.com/davudbagher/shoplane)
