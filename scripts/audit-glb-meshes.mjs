/**
 * GLB Mesh Audit Script
 * Reads apollo_lunar_module.glb and opportunity_rover.glb
 * Logs every mesh name, parent chain, and bounding box center
 * Run: node scripts/audit-glb-meshes.mjs
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public', 'models');

// Minimal GLB parser – reads binary GLTF, extracts node/mesh names from JSON chunk
function parseGLBNodeNames(filePath) {
  const buf = readFileSync(filePath);
  
  // GLB header: magic(4) + version(4) + length(4) = 12 bytes
  const magic = buf.readUInt32LE(0);
  if (magic !== 0x46546C67) throw new Error('Not a GLB file: ' + filePath);
  
  // JSON chunk: chunkLength(4) + chunkType(4) + data
  const jsonChunkLength = buf.readUInt32LE(12);
  // chunkType at offset 16 should be 0x4E4F534A ('JSON')
  const jsonData = buf.slice(20, 20 + jsonChunkLength).toString('utf8');
  const gltf = JSON.parse(jsonData);
  
  const results = {
    file: filePath.split('\\').pop(),
    meshCount: (gltf.meshes || []).length,
    nodeCount: (gltf.nodes || []).length,
    meshes: [],
    nodes: [],
  };
  
  // List all mesh names
  (gltf.meshes || []).forEach((mesh, i) => {
    results.meshes.push({
      index: i,
      name: mesh.name || `[unnamed mesh ${i}]`,
      primitives: mesh.primitives ? mesh.primitives.length : 0,
    });
  });
  
  // List all nodes with their mesh references
  (gltf.nodes || []).forEach((node, i) => {
    const entry = {
      index: i,
      name: node.name || `[unnamed node ${i}]`,
      meshIndex: node.mesh !== undefined ? node.mesh : null,
      meshName: node.mesh !== undefined ? (gltf.meshes[node.mesh]?.name || `mesh_${node.mesh}`) : null,
      children: node.children || [],
    };
    results.nodes.push(entry);
  });
  
  return results;
}

console.log('\n=== AFTERLIGHT GLB MESH AUDIT ===\n');

for (const filename of ['apollo_lunar_module.glb', 'opportunity_rover.glb']) {
  const filePath = join(publicDir, filename);
  try {
    const result = parseGLBNodeNames(filePath);
    console.log(`\n📦 FILE: ${result.file}`);
    console.log(`   Meshes: ${result.meshCount}  |  Nodes: ${result.nodeCount}`);
    
    console.log('\n  MESHES:');
    result.meshes.forEach(m => {
      console.log(`    [${m.index}] "${m.name}"  (${m.primitives} primitives)`);
    });
    
    console.log('\n  NODES (with mesh):');
    result.nodes
      .filter(n => n.meshIndex !== null)
      .forEach(n => {
        console.log(`    Node[${n.index}] "${n.name}"  → Mesh[${n.meshIndex}] "${n.meshName}"`);
      });
    
    console.log('\n  NODES (no mesh / groups):');
    result.nodes
      .filter(n => n.meshIndex === null)
      .forEach(n => {
        console.log(`    Node[${n.index}] "${n.name}"  (${n.children.length} children)`);
      });
      
  } catch (err) {
    console.error(`  ERROR reading ${filename}:`, err.message);
  }
}

console.log('\n=== AUDIT COMPLETE ===\n');
