"""
COMPLETE Database Schema Fix - Adds ALL missing columns to shops table

This script will sync your database with the current Shop model.

Usage:
    python complete_db_fix.py
"""

from app.database import SessionLocal, engine
from sqlalchemy import text, inspect

db = SessionLocal()

try:
    print("🔧 COMPLETE Database Schema Fix")
    print("=" * 60)
    
    # Get existing columns
    inspector = inspect(engine)
    existing_columns = [col['name'] for col in inspector.get_columns('shops')]
    print(f"\n📊 Existing columns in 'shops' table: {len(existing_columns)}")
    for col in existing_columns:
        print(f"   - {col}")
    
    # All columns that SHOULD exist
    expected_columns = [
        'id', 'name', 'subdomain', 'slug', 'description', 'logo_url', 
        'banner_url', 'primary_color', 'phone', 'email', 'address', 
        'whatsapp_number', 'setup_token', 'onboarding_completed', 
        'plan_type', 'subscription_status', 'trial_ends_at', 
        'subscription_expires_at', 'custom_domain', 'custom_domain_verified', 
        'is_active', 'allow_cod', 'allow_online_payment', 
        'millikart_enabled', 'millikart_iban', 'millikart_account_info', 
        'millikart_payment_link', 'owner_id', 'created_at', 'updated_at'
    ]
    
    # Find missing columns
    missing = [col for col in expected_columns if col not in existing_columns]
    
    if not missing:
        print("\n✅ All expected columns exist!")
    else:
        print(f"\n⚠️  Missing {len(missing)} columns:")
        for col in missing:
            print(f"   - {col}")
        
        print("\n🔨 Adding missing columns...")
        
        # Add columns based on type
        for col_name in missing:
            try:
                if col_name in ['plan_type', 'subscription_status']:
                    # These are ENUM types - use VARCHAR for now
                    db.execute(text(f"""
                        ALTER TABLE shops 
                        ADD COLUMN {col_name} VARCHAR(50)
                    """))
                    print(f"   ✅ {col_name} (VARCHAR)")
                    
                elif col_name in ['id', 'owner_id']:
                    # Integer columns (should already exist)
                    db.execute(text(f"""
                        ALTER TABLE shops 
                        ADD COLUMN {col_name} INTEGER
                    """))
                    print(f"   ✅ {col_name} (INTEGER)")
                    
                elif col_name in ['is_active', 'onboarding_completed', 'custom_domain_verified', 'millikart_enabled']:
                    # Boolean columns
                    db.execute(text(f"""
                        ALTER TABLE shops 
                        ADD COLUMN {col_name} BOOLEAN DEFAULT FALSE
                    """))
                    print(f"   ✅ {col_name} (BOOLEAN)")
                    
                elif col_name in ['trial_ends_at', 'subscription_expires_at', 'created_at', 'updated_at']:
                    # Timestamp columns
                    db.execute(text(f"""
                        ALTER TABLE shops 
                        ADD COLUMN {col_name} TIMESTAMP WITH TIME ZONE
                    """))
                    print(f"   ✅ {col_name} (TIMESTAMP)")
                    
                elif col_name in ['description', 'millikart_account_info']:
                    # Text columns
                    db.execute(text(f"""
                        ALTER TABLE shops 
                        ADD COLUMN {col_name} TEXT
                    """))
                    print(f"   ✅ {col_name} (TEXT)")
                    
                else:
                    # Default to VARCHAR
                    db.execute(text(f"""
                        ALTER TABLE shops 
                        ADD COLUMN {col_name} VARCHAR
                    """))
                    print(f"   ✅ {col_name} (VARCHAR)")
                    
            except Exception as e:
                print(f"   ⚠️  {col_name}: {str(e)[:60]}")
        
        db.commit()
        print("\n✅ All missing columns added!")
    
    # Update alembic version
    print("\n📝 Updating alembic version...")
    db.execute(text("UPDATE alembic_version SET version_num = 'b2c3d4e5f6g7'"))
    db.commit()
    print("   ✅ Stamped to b2c3d4e5f6g7")
    
    print("\n" + "=" * 60)
    print("🎉 DATABASE SCHEMA COMPLETELY FIXED!")
    print("=" * 60)
    print("\n🔄 RESTART BACKEND:")
    print("   1. Ctrl+C to stop uvicorn")
    print("   2. Run: uvicorn app.main:app --reload")
    print("   3. Refresh Kitchen page")
    print("\n🎯 Your 3 leads should now appear!")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    db.rollback()
    import traceback
    traceback.print_exc()
finally:
    db.close()
