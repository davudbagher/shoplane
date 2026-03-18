import sqlite3
import pprint

# Connect to database
conn = sqlite3.connect('shoplane.db')
cursor = conn.cursor()

print("--- SHOPS ---")
cursor.execute("SELECT id, name, subdomain FROM shops;")
shops = cursor.fetchall()
for s in shops:
    print(s)

print("\n--- PRODUCTS ---")
cursor.execute("SELECT id, shop_id, name, is_active FROM products;")
products = cursor.fetchall()
for p in products:
    print(p)

