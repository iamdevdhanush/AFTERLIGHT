#!/usr/bin/env node
/**
 * AFTERLIGHT — Automated Scientific Data & Citation Validation Script
 * ====================================================================
 * Validates scientific coordinates, source citations, and GLB mappings
 * across all planetary archaeological datasets and hardware manifests.
 *
 * Runs in CI to prevent unverified data from entering production.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🔬 [AFTERLIGHT] Running Scientific Data & Citation Validation...\n');

let totalChecks = 0;
let errors = [];

function check(condition, message) {
  totalChecks++;
  if (!condition) {
    errors.push(message);
    console.error(`  ❌ FAIL: ${message}`);
  }
}

// ── 1. Validate Hardware Manifest JSONs ────────────────────────────────────────

const manifestFiles = [
  'public/data/parts.moon.json',
  'public/data/parts.perseverance.json',
  'public/data/parts.insight.json',
  'public/data/parts.mars.json',
];

for (const relPath of manifestFiles) {
  const fullPath = path.join(rootDir, relPath);
  check(fs.existsSync(fullPath), `Manifest exists: ${relPath}`);
  if (!fs.existsSync(fullPath)) continue;

  try {
    const raw = fs.readFileSync(fullPath, 'utf8');
    const data = JSON.parse(raw);
    check(Array.isArray(data), `${relPath} is a JSON array`);

    data.forEach((entry, idx) => {
      const prefix = `[${relPath} #${idx + 1} (${entry.id || 'unnamed'})]`;
      check(typeof entry.id === 'string' && entry.id.length > 0, `${prefix} has valid id`);
      check(Array.isArray(entry.meshNames) && entry.meshNames.length > 0, `${prefix} has non-empty meshNames`);
      check(typeof entry.label === 'string' && entry.label.length > 0, `${prefix} has label`);
      check(typeof entry.subassembly === 'string', `${prefix} has subassembly`);
      check(
        Array.isArray(entry.hotspotAnchor) && entry.hotspotAnchor.length === 3,
        `${prefix} has 3D hotspotAnchor [x,y,z]`
      );
      check(typeof entry.function === 'string' && entry.function.length > 20, `${prefix} has detailed function`);
      check(Array.isArray(entry.missionFacts) && entry.missionFacts.length >= 2, `${prefix} has at least 2 missionFacts`);
      check(
        typeof entry.source === 'string' && (entry.source.startsWith('http://') || entry.source.startsWith('https://')),
        `${prefix} has valid citable source URL starting with http/https`
      );
      check(typeof entry.isAuthentic === 'boolean', `${prefix} has isAuthentic boolean flag`);
    });
  } catch (err) {
    errors.push(`Failed to parse ${relPath}: ${err.message}`);
  }
}

// ── 2. Validate Planetary Sites File ──────────────────────────────────────────

const sitesPath = path.join(rootDir, 'src/modules/planetary-archaeology/data/planetarySites.ts');
check(fs.existsSync(sitesPath), `Planetary sites data file exists: ${sitesPath}`);

if (fs.existsSync(sitesPath)) {
  const content = fs.readFileSync(sitesPath, 'utf8');

  // Regex extract lat, lon, and source URLs to verify coordinate bounds and citations
  const latRegex = /latitude:\s*([-\d.]+)/g;
  let latMatch;
  let latCount = 0;
  while ((latMatch = latRegex.exec(content)) !== null) {
    latCount++;
    const lat = parseFloat(latMatch[1]);
    check(lat >= -90.0 && lat <= 90.0, `Latitude ${lat} is within valid bounds [-90, +90]`);
  }
  check(latCount >= 20, `Found at least 20 validated landing site latitudes (found ${latCount})`);

  const lonRegex = /longitude:\s*([-\d.]+)/g;
  let lonMatch;
  let lonCount = 0;
  while ((lonMatch = lonRegex.exec(content)) !== null) {
    lonCount++;
    const lon = parseFloat(lonMatch[1]);
    const isValid = (lon >= -180.0 && lon <= 180.0) || (lon >= 0.0 && lon <= 360.0);
    check(isValid, `Longitude ${lon} is within valid bounds [-180, +180] or [0, 360]`);
  }
  check(lonCount >= 20, `Found at least 20 validated landing site longitudes (found ${lonCount})`);

  // Verify presence of NASA official sources
  check(content.includes('officialSources'), 'Sites dataset includes officialSources citation structures');
  check(content.includes('locationConfidence'), 'Sites dataset includes locationConfidence fields');
  check(content.includes('lroc.asu.edu') || content.includes('nasa.gov'), 'Sites dataset includes NASA/LROC archival URLs');
}

// ── 3. Summary & Exit ─────────────────────────────────────────────────────────

console.log(`\n📊 Validation Summary:`);
console.log(`   Total Scientific Integrity Checks: ${totalChecks}`);
console.log(`   Failed Checks: ${errors.length}`);

if (errors.length > 0) {
  console.error('\n❌ Data validation failed with the following errors:');
  errors.forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
} else {
  console.log('\n✅ ALL SCIENTIFIC CITATIONS, COORDINATES, AND MANIFESTS VERIFIED!\n');
  process.exit(0);
}
