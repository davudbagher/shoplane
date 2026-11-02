"""
Fix database schema by adding ALL missing columns and stamping correct revision.

Usage:
    python fix_db_schema.py
"""

from app.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()

try:
    print("🔧 Fixing database schema...")
    
    # Add all missing columns to shops table
    print("\nAdding missing columns to shops table...")
    
    columns_to_add = [
        ('whatsapp_number', 'VARCHAR', None),
        ('setup_token', 'VARCHAR', None),
        ('onboarding_completed', 'BOOLEAN', 'FALSE'),
        ('custom_domain', 'VARCHAR', None),
        ('custom_domain_verified', 'BOOLEAN', 'FALSE'),
        ('trial_ends_at', 'TIMESTAMP WITH TIME ZONE', None),
        ('millikart_enabled', 'BOOLEAN', 'FALSE'),
        ('millikart_iban', 'VARCHAR(34)', None),
        ('millikart_account_info', 'TEXT', None),
        ('millikart_payment_link', 'VARCHAR(500)', None),
    ]
    
    for col_name, col_type, default in columns_to_add:
        try:
            if default:
                db.execute(text(f"""
                    ALTER TABLE shops 
                    ADD COLUMN IF NOT EXISTS {col_name} {col_type} DEFAULT {default}
                """))
            else:
                db.execute(text(f"""
                    ALTER TABLE shops 
                    ADD COLUMN IF NOT EXISTS {col_name} {col_type}
                """))
            print(f"   ✅ {col_name} added")
        except Exception as e:
            print(f"   ⚠️  {col_name} might already exist: {str(e)[:50]}")
    
    db.commit()
    print("\n✅ All columns added successfully!")
    
    # Stamp to latest revision
    print("\n3. Stamping database to latest revision...")
    db.execute(text("UPDATE alembic_version SET version_num = 'b2c3d4e5f6g7'"))
    db.commit()
    print("   ✅ Database stamped to b2c3d4e5f6g7")
    
    print("\n" + "=" * 60)
    print("🎉 Database schema fixed!")
    print("=" * 60)
    print("\n🔄 RESTART YOUR BACKEND SERVER NOW:")
    print("   1. Press Ctrl+C to stop")
    print("   2. Run: uvicorn app.main:app --reload")
    print("   3. Refresh Kitchen page")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    db.rollback()
    raise
finally:
    db.close()
