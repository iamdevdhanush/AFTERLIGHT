const fs = require('fs');
const path = require('path');

function getDirStats(dir, ignore = ['node_modules', '.git']) {
  let totalBytes = 0;
  let fileCount = 0;
  function traverse(current) {
    if (!fs.existsSync(current)) return;
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      if (ignore.includes(entry.name)) continue;
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        traverse(fullPath);
      } else {
        fileCount++;
        totalBytes += fs.statSync(fullPath).size;
      }
    }
  }
  traverse(dir);
  return { totalBytes, fileCount, mb: Number((totalBytes / (1024 * 1024)).toFixed(2)) };
}

console.log('--- REPOSITORY SIZE BASELINE ---');
console.log('Repo Total (excl node_modules, .git):', getDirStats('.'));
console.log('src/:', getDirStats('src'));
console.log('public/:', getDirStats('public'));
console.log('scratch/:', getDirStats('scratch'));
console.log('scripts/:', getDirStats('scripts'));
console.log('dist/:', getDirStats('dist'));

// 1. Bundle stats in dist/assets
const distAssets = path.join('dist', 'assets');
let jsBytes = 0;
let cssBytes = 0;
const bundleFiles = [];
if (fs.existsSync(distAssets)) {
  fs.readdirSync(distAssets).forEach(f => {
    const s = fs.statSync(path.join(distAssets, f)).size;
    bundleFiles.push({ name: f, size: s, kb: (s / 1024).toFixed(2) });
    if (f.endsWith('.js')) jsBytes += s;
    if (f.endsWith('.css')) cssBytes += s;
  });
}
console.log('\n--- DIST BUNDLE SIZES ---');
console.log(`Total JS Bundle: ${(jsBytes / 1024).toFixed(2)} kB (${(jsBytes / (1024 * 1024)).toFixed(2)} MB)`);
console.log(`Total CSS Bundle: ${(cssBytes / 1024).toFixed(2)} kB`);
console.log('Bundle chunks:', bundleFiles);

// 2. Package.json Dependencies Check
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const declaredDeps = Object.keys(pkg.dependencies || {});
const declaredDevDeps = Object.keys(pkg.devDependencies || {});
console.log('\n--- DECLARED DEPENDENCIES ---');
console.log('dependencies (' + declaredDeps.length + '):', declaredDeps);
console.log('devDependencies (' + declaredDevDeps.length + '):', declaredDevDeps);

// Scan all src files for imports
function getAllFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.html']) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
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

const allSrcFiles = getAllFiles('src');
console.log('\nTotal src files:', allSrcFiles.length);

const allSrcContent = allSrcFiles.map(f => ({
  path: f,
  content: fs.readFileSync(f, 'utf8')
}));

// Check which declared dependencies are actually imported
console.log('\n--- DEPENDENCY IMPORT ANALYSIS ---');
const usedDeps = new Set();
declaredDeps.forEach(dep => {
  const isUsed = allSrcContent.some(file => {
    // Check regex for from 'dep' or from 'dep/...' or import('dep') or require('dep')
    const regex = new RegExp(`from\\s+['"]${dep}(\\/.*)?['"]|import\\(['"]${dep}(\\/.*)?['"]\\)|require\\(['"]${dep}(\\/.*)?['"]\\)`, 'g');
    return regex.test(file.content);
  });
  if (isUsed) {
    usedDeps.add(dep);
    console.log(`✓ [IN USE] ${dep}`);
  } else {
    console.log(`? [UNREFERENCED IN SRC] ${dep}`);
  }
});

// 3. Scan all src files to see if each src file is imported by something
console.log('\n--- SRC FILE IMPORT GRAPH ANALYSIS ---');
const entryPoints = [
  path.normalize('src/main.tsx'),
  path.normalize('src/index.css')
];

// For each src file, check who imports it
const unimportedSrcFiles = [];
allSrcFiles.forEach(srcFile => {
  const normalized = path.normalize(srcFile);
  if (entryPoints.includes(normalized)) return;

  const baseNameNoExt = path.basename(srcFile, path.extname(srcFile));
  
  let isImported = false;
  for (const other of allSrcContent) {
    if (path.normalize(other.path) === normalized) continue;
    // Check if other imports srcFile
    // Can import by relative path or filename
    if (other.content.includes(baseNameNoExt)) {
      isImported = true;
      break;
    }
  }

  // Also check vite.config.ts, index.html, package.json
  const rootFiles = ['vite.config.ts', 'index.html', 'package.json', 'tailwind.config.js'];
  for (const rf of rootFiles) {
    if (fs.existsSync(rf)) {
      const content = fs.readFileSync(rf, 'utf8');
      if (content.includes(baseNameNoExt)) {
        isImported = true;
        break;
      }
    }
  }

  if (!isImported) {
    unimportedSrcFiles.push(srcFile);
  }
});

console.log('Potentially unimported src files:', unimportedSrcFiles);

// 4. Scan public assets
console.log('\n--- PUBLIC ASSETS REFERENCE AUDIT ---');
const allPublicFiles = getAllFiles('public', ['']);
console.log('Total files in public/:', allPublicFiles.length);

const allSourcesCombined = allSrcContent.map(f => f.content).join('\n') +
  fs.readFileSync('index.html', 'utf8') +
  (fs.existsSync('tailwind.config.js') ? fs.readFileSync('tailwind.config.js', 'utf8') : '');

// Also include public/data/*.json in searchable strings!
const jsonFiles = getAllFiles('public/data', ['.json']);
const allPublicJsonCombined = jsonFiles.map(f => fs.readFileSync(f, 'utf8')).join('\n');

const totalSearchSpace = allSourcesCombined + '\n' + allPublicJsonCombined;

const unreferencedPublicFiles = [];
const referencedPublicFiles = [];

allPublicFiles.forEach(pubFile => {
  const relative = path.relative('public', pubFile).replace(/\\/g, '/');
  const fileName = path.basename(pubFile);
  
  // Ignore draco directory - draco loader dynamically fetches draco_decoder.wasm, etc.
  if (relative.startsWith('draco/')) {
    referencedPublicFiles.push({ file: relative, reason: 'Draco 3D Geometry Runtime' });
    return;
  }
  
  // Check exact relative path '/'+relative or relative or fileName
  const searchPatterns = [
    relative,
    '/' + relative,
    fileName
  ];

  const found = searchPatterns.some(p => totalSearchSpace.includes(p));
  if (found) {
    referencedPublicFiles.push({ file: relative });
  } else {
    const size = fs.statSync(pubFile).size;
    unreferencedPublicFiles.push({ file: relative, size, kb: (size / 1024).toFixed(1) });
  }
});

console.log(`Referenced public files: ${referencedPublicFiles.length}`);
console.log(`Unreferenced public files: ${unreferencedPublicFiles.length}`);
unreferencedPublicFiles.forEach(u => console.log(`  - ${u.file} (${u.kb} kB)`));

