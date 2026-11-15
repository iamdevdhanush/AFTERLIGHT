import sqlite3

db_path = r'C:\Users\Admin\.gemini\antigravity\conversations\e496e187-bd65-4d35-896f-182ab24b4fe0.db'
conn = sqlite3.connect(db_path)
c = conn.cursor()
c.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = c.fetchall()
print('Tables:', tables)

for t in tables:
    tname = t[0]
    c.execute(f"PRAGMA table_info({tname});")
    cols = [col[1] for col in c.fetchall()]
    print(f"Table {tname}: {cols}")
    c.execute(f"SELECT COUNT(*) FROM {tname};")
    cnt = c.fetchone()[0]
    print(f"  Count: {cnt}")

