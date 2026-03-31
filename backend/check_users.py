"""
Check existing users in the database (simple version without loading relationships).

Usage:
    python check_users.py
"""

from app.database import SessionLocal
from app.models.user import User

db = SessionLocal()

users = db.query(User).all()

print("\n👥 Users in Database:")
print("=" * 80)

if not users:
    print("\n⚠️  No users found in database!")
    print("\n💡 Run 'python create_superuser.py' to create an admin user.\n")
else:
    for i, user in enumerate(users, 1):
        print(f"\n{i}. {user.full_name}")
        print(f"   Email: {user.email}")
        print(f"   Phone: {user.phone or 'N/A'}")
        print(f"   Active: {'✅' if user.is_active else '❌'}")
        print(f"   Superuser: {'👑 YES' if user.is_superuser else '❌ NO'}")
        print(f"   Created: {user.created_at}")

print("\n" + "=" * 80)

if any(u.is_superuser for u in users):
    print("\n✅ You have superuser(s) who can access the Kitchen dashboard.")
    print("\n📝 Login credentials:")
    print(f"   Email: {users[0].email if users else 'N/A'}")
    print(f"   Password: (your password)")
    print("\n🌐 Access Kitchen at: http://localhost:5173/kitchen")
    print("\n⚠️  If you can't login, try:")
    print("   1. Clear browser localStorage")
    print("   2. Check if backend is running (http://localhost:8000)")
    print("   3. Check VITE_API_URL in frontend/.env")
else:
    print("\n⚠️  No superuser found!")
    print("💡 Run 'python create_superuser.py' to create an admin user.\n")

db.close()
