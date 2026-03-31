"""
Create a test shop with known credentials for testing.

Usage:
    python create_test_shop.py
"""

from app.database import SessionLocal
from app.models.user import User
from app.models.shop import Shop, SubscriptionPlan, SubscriptionStatus
from app.models.lead import Lead, LeadStatus
from app.utils.security import get_password_hash
from datetime import datetime, timezone, timedelta
import secrets

db = SessionLocal()

try:
    # Create test lead if none exists
    lead = Lead(
        full_name="Test User",
        email="test@shoplane.az",
        whatsapp="+994501234567",
        phone="+994501234567",
        shop_name="Test Shop",
        shop_name_az="Test Mağaza",
        category="clothing",
        subdomain_preference="testshop",
        instagram_url="https://instagram.com/testshop",
        want_cod=True,
        want_millikart=True,
        delivery_courier=True,
        delivery_cities="Bakı, Sumqayıt"
    )
    db.add(lead)
    db.flush()
    
    # Generate credentials
    temp_password = secrets.token_urlsafe(12)
    setup_token = secrets.token_urlsafe(32)
    subdomain = "testshop" + str(lead.id)
    
    # Create user
    user = User(
        email=lead.email,
        full_name=lead.full_name,
        phone=lead.phone,
        hashed_password=get_password_hash(temp_password),
        is_active=True,
        is_superuser=False
    )
    db.add(user)
    db.flush()
    
    # Create shop
    trial_end = datetime.now(timezone.utc) + timedelta(days=14)
    shop = Shop(
        name=lead.shop_name,
        subdomain=subdomain,
        slug=subdomain,
        description=lead.business_description,
        logo_url=lead.logo_url,
        primary_color=lead.primary_color or "#0ea5e9",
        phone=lead.phone,
        email=lead.email,
        whatsapp_number=lead.whatsapp,
        owner_id=user.id,
        plan_type=SubscriptionPlan.PRO,
        subscription_status=SubscriptionStatus.TRIAL,
        trial_ends_at=trial_end,
        subscription_expires_at=trial_end,
        setup_token=setup_token,
        temporary_password=temp_password,
        onboarding_completed=True,
        is_active=True,
        allow_cod=lead.want_cod,
        allow_online_payment=lead.want_millikart,
        millikart_enabled=lead.want_millikart,
    )
    db.add(shop)
    
    # Update lead
    lead.status = LeadStatus.ONBOARDED
    lead.screening_status = "approved"
    
    db.commit()
    
    print("\n" + "=" * 60)
    print("✅ TEST SHOP CREATED SUCCESSFULLY!")
    print("=" * 60)
    print(f"\n🏪 Shop Details:")
    print(f"   Name: {shop.name}")
    print(f"   Subdomain: {shop.subdomain}")
    print(f"   URL: https://{shop.subdomain}.1line.az")
    
    print(f"\n👤 Owner:")
    print(f"   Name: {user.full_name}")
    print(f"   Email: {user.email}")
    
    print(f"\n🔐 LOGIN CREDENTIALS:")
    print(f"   Email: {user.email}")
    print(f"   Password: {temp_password}")
    print(f"\n   ⚠️  SAVE THIS PASSWORD! You'll need it to login.")
    
    print(f"\n🌐 Login URL: http://localhost:5173/login")
    print(f"   Admin Panel: http://localhost:5173/admin/dashboard")
    
    print(f"\n📝 Setup Token (for password reset):")
    print(f"   {setup_token}")
    print(f"   URL: http://localhost:5173/setup?token={setup_token}")
    
    print("\n" + "=" * 60)
    print("\n💡 Next Steps:")
    print("   1. Go to http://localhost:5173/login")
    print(f"   2. Login with email: {user.email}")
    print(f"   3. Use password: {temp_password}")
    print("   4. You should be redirected to admin dashboard!")
    print("\n")
    
except Exception as e:
    db.rollback()
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()
