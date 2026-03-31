"""
Create Superuser Script for Shoplane Platform

Run this to create an admin user for accessing the Kitchen dashboard.

Usage:
    python create_superuser.py

You'll be prompted for:
- Email
- Password
- Full Name
- Phone (optional)
"""

import sys
from app.database import SessionLocal
from app.models.user import User
from app.utils.security import get_password_hash

def create_superuser():
    print("🔐 Shoplane Superuser Creation")
    print("=" * 50)
    
    # Get input from user
    email = input("\n📧 Email (for login): ").strip()
    if not email:
        print("❌ Email is required!")
        sys.exit(1)
    
    password = input("🔑 Password: ").strip()
    if not password:
        print("❌ Password is required!")
        sys.exit(1)
    
    full_name = input("👤 Full Name: ").strip()
    if not full_name:
        print("❌ Full name is required!")
        sys.exit(1)
    
    phone = input("📱 Phone (optional): ").strip()
    
    # Confirm password
    password_confirm = input("🔑 Confirm Password: ").strip()
    if password != password_confirm:
        print("❌ Passwords do not match!")
        sys.exit(1)
    
    # Create database session
    db = SessionLocal()
    
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            print(f"\n⚠️  User with email '{email}' already exists!")
            update = input("Do you want to upgrade this user to superuser? (y/n): ").strip().lower()
            
            if update == 'y':
                existing_user.is_superuser = True
                existing_user.is_active = True
                existing_user.hashed_password = get_password_hash(password)
                db.commit()
                print(f"\n✅ User '{email}' has been upgraded to SUPERUSER!")
                print("\n📝 Login credentials:")
                print(f"   Email: {email}")
                print(f"   Password: {password}")
                print(f"\n🌐 Access Kitchen at: http://localhost:5173/kitchen")
            else:
                print("❌ No changes made.")
            return
        
        # Create new superuser
        hashed_password = get_password_hash(password)
        superuser = User(
            email=email,
            full_name=full_name,
            phone=phone,
            hashed_password=hashed_password,
            is_active=True,
            is_superuser=True
        )
        
        db.add(superuser)
        db.commit()
        db.refresh(superuser)
        
        print("\n" + "=" * 50)
        print("✅ SUPERUSER CREATED SUCCESSFULLY!")
        print("=" * 50)
        print("\n📝 Login credentials:")
        print(f"   Email: {email}")
        print(f"   Password: {password}")
        print(f"\n🌐 Access Kitchen at: http://localhost:5173/kitchen")
        print("\n🎉 You can now access the Kitchen dashboard!")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    create_superuser()
