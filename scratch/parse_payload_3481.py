import sqlite3
import re

db_path = r'C:\Users\Admin\.gemini\antigravity\conversations\e496e187-bd65-4d35-896f-182ab24b4fe0.db'
conn = sqlite3.connect(db_path)
c = conn.cursor()

c.execute("SELECT step_payload FROM steps WHERE idx = 3481;")
payload = c.fetchone()[0]

# Extract all printable ASCII strings of length >= 4
strings = re.findall(b'[\x20-\x7e]{4,}', payload)
for s in strings:
    s_str = s.decode('ascii', errors='ignore')
    if any(keyword in s_str.lower() for keyword in ['http', 'file', '.png', '.jpg', '.jpeg', 'cursor', 'spaceship', 'image', 'media', 'upload', 'asset']):
        print('Matching string:', s_str)
    elif len(s_str) > 50 and not s_str.startswith('<USER_REQUEST>'):
        print('Long string:', s_str[:100])

