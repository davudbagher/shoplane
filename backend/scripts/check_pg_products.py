from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql import text
import sys

from app.config import settings

engine = create_engine(settings.DATABASE_URL)
Session = sessionmaker(bind=engine)
session = Session()

try:
    result = session.execute(text("SELECT id, name, price, compare_at_price FROM products ORDER BY id DESC LIMIT 5"))
    for row in result:
        print(row)
except Exception as e:
    print(f"Error: {e}")
