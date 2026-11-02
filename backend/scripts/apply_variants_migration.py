from sqlalchemy import create_engine, text
import os
import sys

# Load .env manually to get DATABASE_URL
def load_env():
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    if not os.path.exists(env_path):
        print("No .env found")
        return None
    with open(env_path) as f:
        for line in f:
            if '=' in line and not line.startswith('#'):
                k, v = line.strip().split('=', 1)
                os.environ[k] = v
    return os.environ.get("DATABASE_URL")

db_url = load_env()
if not db_url:
    print("DATABASE_URL not found in .env")
    sys.exit(1)

print(f"Connecting to DB...")
try:
    engine = create_engine(db_url)
    with engine.connect() as conn:
        print("Executing ALTER TABLE...")
        conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS variants JSON DEFAULT '[]'"))
        conn.commit()
        print("✅ Migration successful: 'variants' column added/verified.")
except Exception as e:
    print(f"❌ Migration failed: {e}")
    sys.exit(1)
