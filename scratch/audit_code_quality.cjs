const fs = require('fs');
const path = require('path');

function getAllFiles(dir, extensions = ['.ts', '.tsx']) {
  let results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of list) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      results = results.concat(getAllFiles(full, extensions));
    } else {
      if (extensions.some(ext => item.name.endsWith(ext))) {
        results.push(full);
      }
    }
  }
  return results;
}

const allFiles = getAllFiles('src');
console.log(`Analyzing ${allFiles.length} TypeScript files for dead code / unused exports...`);

const filesContent = allFiles.map(f => ({
  path: f,
  content: fs.readFileSync(f, 'utf8')
}));

// Find all named exports: export const/function/class/type/interface X
const exportRegex = /export\s+(?:const|function|class|type|interface)\s+([A-Za-z0-9_]+)/g;

const allExports = [];
filesContent.forEach(file => {
  let match;
  while ((match = exportRegex.exec(file.content)) !== null) {
    allExports.push({
      name: match[1],
      file: file.path
    });
  }
});

console.log(`Total exports found: ${allExports.length}`);

// For each export, check how many files mention it
const unusedExports = [];
allExports.forEach(exp => {
  // If it's in types/ or index.ts, it might be a public contract
  let usageCount = 0;
  for (const f of filesContent) {
    if (f.path === exp.file) continue;
    // Check if name is mentioned in f.content
    // Word boundary check
    const regex = new RegExp(`\\b${exp.name}\\b`);
    if (regex.test(f.content)) {
      usageCount++;
    }
  }
  if (usageCount === 0) {
    unusedExports.push(exp);
  }
});

console.log(`\nExports not imported by any OTHER file (${unusedExports.length}):`);
unusedExports.forEach(u => {
  console.log(`  - ${u.name} in ${u.file}`);
});

