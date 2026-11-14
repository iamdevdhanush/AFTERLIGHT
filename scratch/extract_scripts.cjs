const fs = require('fs');
const content = fs.readFileSync('src/data/artifacts.ts', 'utf8');

const ids = [
  'apollo11_eagle',
  'apollo_lrv',
  'surveyor3',
  'apollo_alsep',
  'sojourner',
  'spirit',
  'opportunity',
  'insight',
];

ids.forEach((id) => {
  const marker = `${id}: {`;
  const idx = content.indexOf(marker);
  if (idx !== -1) {
    const chunk = content.slice(idx, idx + 3500);
    const m = chunk.match(/guide:\s*\{[\s\S]*?voiceScript:\s*(['"`])([\s\S]*?)\1/);
    console.log(`\n=================== ${id} ===================`);
    if (m) {
      console.log(m[2].trim());
    } else {
      console.log('voiceScript not found in guide');
    }
  }
});
