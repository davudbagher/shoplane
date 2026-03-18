from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql import text
import sys

engine = create_engine('postgresql://shoplane_user:shoplane_pass@localhost:5432/shoplane_db')
Session = sessionmaker(bind=engine)
session = Session()

try:
    result = session.execute(text("SELECT id, name, price, compare_at_price FROM products ORDER BY id DESC LIMIT 5"))
    for row in result:
        print(row)
except Exception as e:
    print(f"Error: {e}")
