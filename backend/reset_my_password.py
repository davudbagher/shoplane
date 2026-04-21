"""
Reset Password for davudbaghir@gmail.com

This script automatically resets the password for the superuser.

Usage:
    python reset_my_password.py
"""

import sys
from app.database import SessionLocal
from app.models.user import User
from app.utils.security import get_password_hash
import secrets
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

def reset_password():
    email = "davudbaghir@gmail.com"
    
    # Generate a random password
    new_password = secrets.token_urlsafe(12)
    
    db = SessionLocal()
    
    try:
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            print(f"❌ No user found with email: {email}")
            sys.exit(1)
        
        # Update password
        user.hashed_password = get_password_hash(new_password)
        user.is_active = True
        user.is_superuser = True  # Ensure superuser status
        db.commit()
        
        print("\n" + "=" * 60)
        print("✅ PASSWORD RESET SUCCESSFUL!")
        print("=" * 60)
        print("\n📝 Your new credentials:")
        print(f"   Email:    {email}")
        print(f"   Password: {new_password}")
        print("\n🌐 Login at: http://localhost:5173/login")
        print(f"\n👑 You're a SUPERUSER!")
        print(f"🎯 Access Kitchen at: http://localhost:5173/kitchen")
        print("\n💡 Tip: Save this password! Or run this script again to generate a new one.\n")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    reset_password()
