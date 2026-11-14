with open('d:/NASA/src/data/artifacts.ts', 'r', encoding='utf-8') as f:
    text = f.read()

import re
matches = re.finditer(r'([a-zA-Z0-9_]+):\s*\{[\s\S]*?name:\s*[\'"]([^\'"]+)[\'"][\s\S]*?destination:\s*[\'"]([^\'"]+)[\'"][\s\S]*?coordinates:\s*\{([^}]+)\}', text)
for m in matches:
    aid = m.group(1)
    name = m.group(2)
    dest = m.group(3)
    coords = m.group(4).replace('\n', ' ').strip()
    print(f"[{dest.upper()}] {aid}: {name} -> {coords}")

