const fs = require('fs');
const c = fs.readFileSync('src/data/artifacts.ts', 'utf8');
const lines = c.split('\n');
const artifacts = [
  'apollo11_eagle',
  'apollo_lrv',
  'surveyor3',
  'apollo_alsep',
  'sojourner',
  'spirit',
  'opportunity',
  'insight',
];
artifacts.forEach((a) => {
  const lineIdx = lines.findIndex((l) => l.includes(`id: '${a}'`));
  console.log(`${a} found at line ${lineIdx + 1}`);
});

