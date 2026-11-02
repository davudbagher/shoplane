import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.product import Product

db = SessionLocal()

products = db.query(Product).all()
for p in products:
    print(f"Product ID: {p.id}, Images: {p.images}")

db.close()
