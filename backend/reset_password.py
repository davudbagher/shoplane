"""
Reset Password Script for Shoplane

Run this to reset your password.

Usage:
    python reset_password.py

You'll be prompted for:
- Email (to find your account)
- New Password
"""

import sys
from app.database import SessionLocal
from app.models.user import User
from app.utils.security import get_password_hash

def reset_password():
    print("🔐 Shoplane Password Reset")
    print("=" * 50)
    
    # Get input from user
    email = input("\n📧 Your Email: ").strip()
    if not email:
        print("❌ Email is required!")
        sys.exit(1)
    
    new_password = input("🔑 New Password: ").strip()
    if not new_password:
        print("❌ Password is required!")
        sys.exit(1)
    
    # Confirm password
    password_confirm = input("🔑 Confirm New Password: ").strip()
    if new_password != password_confirm:
        print("❌ Passwords do not match!")
        sys.exit(1)
    
    if len(new_password) < 6:
        print("❌ Password must be at least 6 characters!")
        sys.exit(1)
    
    # Create database session
    db = SessionLocal()
    
    try:
        # Find user
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            print(f"\n❌ No user found with email: {email}")
            print("\n💡 Available users:")
            all_users = db.query(User).all()
            if all_users:
                for u in all_users:
                    print(f"   - {u.email}")
            else:
                print("   (No users in database)")
            print("\n💡 Run 'python create_superuser.py' to create a new user.\n")
            sys.exit(1)
        
        # Update password
        user.hashed_password = get_password_hash(new_password)
        db.commit()
        
        print("\n" + "=" * 50)
        print("✅ PASSWORD RESET SUCCESSFUL!")
        print("=" * 50)
        print("\n📝 Your new credentials:")
        print(f"   Email: {email}")
        print(f"   Password: {new_password}")
        print(f"\n🌐 Login at: http://localhost:5173/login")
        
        if user.is_superuser:
            print(f"\n👑 You're a SUPERUSER!")
            print(f"🎯 Access Kitchen at: http://localhost:5173/kitchen")
        else:
            print(f"\nℹ️  You're a regular user (shop owner)")
            print(f"🎯 Access Dashboard at: http://localhost:5173/admin/dashboard")
        
        print("\n💡 Tip: Save this password in a password manager!\n")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    reset_password()
