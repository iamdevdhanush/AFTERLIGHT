const fs = require('fs');
const content = fs.readFileSync('src/data/artifacts.ts', 'utf8');
const lines = content.split('\n');
const artifacts = [];
let current = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const idMatch = line.match(/^\s{2}([a-zA-Z0-9_]+):\s*\{/);
  if (idMatch) {
    current = { key: idMatch[1], line: i + 1 };
    artifacts.push(current);
  }
  if (current) {
    const destMatch = line.match(/destination:\s*['"]([^'"]+)['"]/);
    if (destMatch) current.destination = destMatch[1];
    const nameMatch = line.match(/name:\s*['"]([^'"]+)['"]/);
    if (nameMatch && !current.name) current.name = nameMatch[1];
  }
}

console.log(JSON.stringify(artifacts, null, 2));
