import struct
import json
import os

def inspect_glb(path):
    with open(path, 'rb') as f:
        magic, version, length = struct.unpack('<4sII', f.read(12))
        chunk_len, chunk_type = struct.unpack('<I4s', f.read(8))
        json_data = f.read(chunk_len).decode('utf-8')
        gltf = json.loads(json_data)
        meshes = gltf.get('meshes', [])
        nodes = gltf.get('nodes', [])
        materials = gltf.get('materials', [])
        print(f"=== {os.path.basename(path)} ({os.path.getsize(path)} bytes) ===")
        print(f"  Meshes: {len(meshes)}, Nodes: {len(nodes)}, Materials: {len(materials)}")
        for i, m in enumerate(meshes[:8]):
            print(f"    Mesh {i}: {m.get('name')}")
        for i, n in enumerate(nodes[:10]):
            print(f"    Node {i}: {n.get('name')}")

for m in ['apollo_lunar_module.glb', 'insight_lander.glb', 'opportunity_rover.glb', 'voyager_probe.glb']:
    p = os.path.join('d:/NASA/public/models', m)
    if os.path.exists(p):
        inspect_glb(p)

