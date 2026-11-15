const fs = require('fs');
const path = require('path');

console.log('=== STARTING CONTROLLED CATEGORY A CLEANUP ===\n');

let totalBytesRemoved = 0;
let filesRemovedCount = 0;

function removeFile(filePath) {
  if (fs.existsSync(filePath)) {
    const stat = fs.statSync(filePath);
    if (stat.isFile()) {
      totalBytesRemoved += stat.size;
      filesRemovedCount++;
      fs.unlinkSync(filePath);
      console.log(`[DELETED FILE] ${filePath} (${(stat.size / 1024).toFixed(1)} kB)`);
    }
  }
}

function removeDirRecursive(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      removeDirRecursive(full);
    } else {
      removeFile(full);
    }
  }
  fs.rmdirSync(dirPath);
  console.log(`[DELETED DIR]  ${dirPath}`);
}

// 1. Unserved Staging Directory: 2d model/
console.log('--- 1. Removing Staging Folder: 2d model/ ---');
removeDirRecursive('2d model');

// 2. Root Loose Screenshots
console.log('\n--- 2. Removing Root Loose Screenshots ---');
const rootScreenshots = [
  'screenshot_arrival.png',
  'screenshot_arrival_gpu.png',
  'screenshot_exploration.png',
  'screenshot_inspection.png',
  'screenshot_legacy.png',
];
rootScreenshots.forEach(f => removeFile(f));

// 3. Obsolete Public Images
console.log('\n--- 3. Removing Obsolete Unreferenced Public Images ---');
removeFile(path.join('public', 'images', 'curator_mae_vance.jpg'));
removeFile(path.join('public', 'images', 'exhibits', 'spirit_vista.jpg'));

// 4. Scratch Intermediate Screenshot Directories
console.log('\n--- 4. Removing Scratch Temporary Screenshot Dirs ---');
const scratchDirs = [
  'scratch/cinematic_storytelling_screenshots',
  'scratch/cursor_verification',
  'scratch/layout_audit',
  'scratch/layout_verified',
  'scratch/navigation_screenshots',
  'scratch/screenshots',
  'scratch/sound_screenshots',
  'scratch/visual_repair_after',
  'scratch/visual_repair_before',
  'scratch/voice_screenshots',
  'scratch/volume_screenshots',
];
scratchDirs.forEach(d => removeDirRecursive(d));

// 5. Scratch Loose Intermediate PNG / JPG files
console.log('\n--- 5. Removing Scratch Loose Intermediate Images ---');
if (fs.existsSync('scratch')) {
  const scratchEntries = fs.readdirSync('scratch');
  scratchEntries.forEach(f => {
    if (f.endsWith('.png') || f.endsWith('.jpg')) {
      removeFile(path.join('scratch', f));
    }
  });
}

console.log('\n=============================================');
console.log(`CLEANUP COMPLETE:`);
console.log(`Files Removed: ${filesRemovedCount}`);
console.log(`Total Space Recovered: ${(totalBytesRemoved / (1024 * 1024)).toFixed(2)} MB (${totalBytesRemoved} bytes)`);
console.log('=============================================');

