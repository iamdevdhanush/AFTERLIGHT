import sqlite3
import json

db_path = r'C:\Users\Admin\.gemini\antigravity\conversations\e496e187-bd65-4d35-896f-182ab24b4fe0.db'
conn = sqlite3.connect(db_path)
c = conn.cursor()

c.execute("SELECT idx, step_type, step_format, step_payload, render_info FROM steps WHERE idx >= 3480 ORDER BY idx ASC;")
rows = c.fetchall()
for r in rows:
    idx, stype, sfmt, payload, rinfo = r
    print(f"Step {idx}: type={stype}, format={sfmt}")
    if payload:
        try:
            # Could be json or bytes or text
            if isinstance(payload, bytes):
                print(f"  payload (bytes, len {len(payload)}): {payload[:200]}")
            else:
                p_obj = json.loads(payload)
                print(f"  payload keys: {list(p_obj.keys()) if isinstance(p_obj, dict) else type(p_obj)}")
                if isinstance(p_obj, dict):
                    for k, v in p_obj.items():
                        if k != 'content':
                            print(f"    {k}: {str(v)[:200]}")
                        else:
                            print(f"    content snippet: {str(v)[:150]}")
        except Exception as e:
            print(f"  payload decode error: {e}")
    if rinfo:
        print(f"  render_info: {rinfo[:200]}")

