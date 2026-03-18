import sys
import os

# Add backend directory to sys.path so app is importable
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.shop import Shop
from app.models.product import Product
from app.models.user import User

db = SessionLocal()

print("=== SHOPS ===")
shops = db.query(Shop).all()
for s in shops:
    print(f"ID: {s.id}, Name: {s.name}, Subdomain: {s.subdomain}")

print("\n=== PRODUCTS ===")
products = db.query(Product).all()
for p in products:
    print(f"ID: {p.id}, Shop ID: {p.shop_id}, Name: {p.name}, Active: {p.is_active}")

db.close()
