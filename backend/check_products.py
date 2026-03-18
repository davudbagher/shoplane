import sqlite3

conn = sqlite3.connect('/Users/davinchee/shoplane/backend/shoplane.db')
c = conn.cursor()
c.execute("SELECT id, name, price, compare_at_price FROM products ORDER BY id DESC LIMIT 5")
for row in c.fetchall():
    print(row)
