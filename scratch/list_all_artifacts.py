with open(r'D:\NASA\src\data\artifacts.ts', 'r', encoding='utf-8') as f:
    text = f.read()

import re

# Find top level entries in export const ARTIFACTS
entries = re.findall(r'(\w+):\s*\{\s*id:\s*[\'"](\w+)[\'"].*?name:\s*[\'"]([^\'"]+)[\'"].*?destination:\s*[\'"](\w+)[\'"].*?heroImage:\s*[\'"]([^\'"]+)[\'"]', text, re.DOTALL)
print(f"Found {len(entries)} artifacts:")
for k, id_, name, dest, hero in entries:
    print(f"ID: {id_} | Name: {name} | Dest: {dest} | Hero: {hero}")

