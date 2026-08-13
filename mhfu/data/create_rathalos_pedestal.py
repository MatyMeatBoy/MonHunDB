"""Build a local Rathalos display stand into a second GLB."""
from pathlib import Path
import struct
import math
import os
from pygltflib import GLTF2, BufferView, Accessor, Mesh, Primitive, Node, Material, PbrMetallicRoughness

ROOT = Path(__file__).resolve().parents[1]
FINISH = os.environ.get("RATHALOS_FINISH", "bronze").lower()
SOURCE = Path(os.environ.get("RATHALOS_SOURCE", str(ROOT / "data/models/rathalos.glb")))
OUTPUT = ROOT / f"data/models/rathalos-pedestal-{FINISH}.glb"

def box(x0, y0, z0, x1, y1, z1):
    faces = [
        ((0,0,-1), [(x0,y0,z0),(x1,y0,z0),(x1,y1,z0),(x0,y1,z0)]),
        ((0,0,1), [(x1,y0,z1),(x0,y0,z1),(x0,y1,z1),(x1,y1,z1)]),
        ((-1,0,0), [(x0,y0,z1),(x0,y0,z0),(x0,y1,z0),(x0,y1,z1)]),
        ((1,0,0), [(x1,y0,z0),(x1,y0,z1),(x1,y1,z1),(x1,y1,z0)]),
        ((0,-1,0), [(x0,y0,z1),(x1,y0,z1),(x1,y0,z0),(x0,y0,z0)]),
        ((0,1,0), [(x0,y1,z0),(x1,y1,z0),(x1,y1,z1),(x0,y1,z1)]),
    ]
    pos, normals, inds = [], [], []
    for n, corners in faces:
        base = len(pos)//3
        for p in corners: pos.extend(p); normals.extend(n)
        inds.extend((base,base+1,base+2,base,base+2,base+3))
    return pos, normals, inds

def cylinder(radius, y0, y1, segments=48):
    pos, normals, inds = [], [], []
    for y in (y0, y1):
        for i in range(segments):
            a = 2 * math.pi * i / segments
            pos.extend((radius * math.cos(a), y, radius * math.sin(a)))
            normals.extend((math.cos(a), 0, math.sin(a)))
    for i in range(segments):
        j = (i + 1) % segments
        inds.extend((i, j, segments+j, i, segments+j, segments+i))
    # Solid top and bottom caps; without these the stand reads as a hollow ring.
    bottom = len(pos)//3; pos.extend((0,y0,0)); normals.extend((0,-1,0))
    top = len(pos)//3; pos.extend((0,y1,0)); normals.extend((0,1,0))
    for i in range(segments):
        j = (i + 1) % segments
        inds.extend((bottom,j,i)); inds.extend((top,segments+i,segments+j))
    return pos, normals, inds

def cylinder_uv(y0, y1, segments=48):
    uv = []
    for y in (y0, y1):
        for i in range(segments): uv.extend((i/segments, (y-y0)/(y1-y0)))
    return uv

def curved_plate(radius=365, y0=-300, y1=-175, segments=20, center=0, reverse=False):
    pos, normals, inds, uv = [], [], [], []
    for y in (y0, y1):
        for i in range(segments+1):
            a = center - 0.78 + 1.56*i/segments
            pos.extend((radius*math.sin(a), y, radius*math.cos(a)))
            normals.extend((math.sin(a), 0, math.cos(a)))
            uv.extend(((1-i/segments if reverse else i/segments), (y-y0)/(y1-y0)))
    row = segments+1
    for i in range(segments): inds.extend((i,i+1,row+i+1,i,row+i+1,row+i))
    return pos, normals, inds, uv

def append_mesh(g, blob, name, material_index, geometry, uvs=None):
    pos, normals, inds = geometry
    while len(blob) % 4: blob += b"\0"
    poff = len(blob); blob += struct.pack(f"<{len(pos)}f", *pos)
    while len(blob) % 4: blob += b"\0"
    noff = len(blob); blob += struct.pack(f"<{len(normals)}f", *normals)
    while len(blob) % 4: blob += b"\0"
    ioff = len(blob); blob += struct.pack(f"<{len(inds)}H", *inds)
    pv = len(g.bufferViews); g.bufferViews.append(BufferView(buffer=0, byteOffset=poff, byteLength=len(pos)*4))
    nv = len(g.bufferViews); g.bufferViews.append(BufferView(buffer=0, byteOffset=noff, byteLength=len(normals)*4))
    iv = len(g.bufferViews); g.bufferViews.append(BufferView(buffer=0, byteOffset=ioff, byteLength=len(inds)*2, target=34963))
    pa = len(g.accessors); g.accessors.append(Accessor(bufferView=pv, componentType=5126, count=len(pos)//3, type="VEC3", min=[min(pos[i::3]) for i in range(3)], max=[max(pos[i::3]) for i in range(3)]))
    na = len(g.accessors); g.accessors.append(Accessor(bufferView=nv, componentType=5126, count=len(normals)//3, type="VEC3"))
    ia = len(g.accessors); g.accessors.append(Accessor(bufferView=iv, componentType=5123, count=len(inds), type="SCALAR", min=[0], max=[max(inds)]))
    attrs = {"POSITION": pa, "NORMAL": na}
    if uvs is not None:
        while len(blob) % 4: blob += b"\0"
        uoff = len(blob); blob += struct.pack(f"<{len(uvs)}f", *uvs)
        uvv = len(g.bufferViews); g.bufferViews.append(BufferView(buffer=0, byteOffset=uoff, byteLength=len(uvs)*4))
        uva = len(g.accessors); g.accessors.append(Accessor(bufferView=uvv, componentType=5126, count=len(uvs)//2, type="VEC2"))
        attrs["TEXCOORD_0"] = uva
    mi = len(g.meshes); g.meshes.append(Mesh(name=name, primitives=[Primitive(attributes=attrs, indices=ia, material=material_index)]))
    g.nodes.append(Node(name=name, mesh=mi)); g.scenes[g.scene or 0].nodes.append(len(g.nodes)-1)
    return blob

def pose_node(node, center, axis, degrees):
    """Rotate a mesh around its local bounding-box center, preserving placement."""
    a = math.radians(degrees) / 2; s = math.sin(a); c = math.cos(a)
    q = (s*axis[0], s*axis[1], s*axis[2], c)
    x,y,z = center; qx,qy,qz,qw = q
    # R * center, then translate by center - Rcenter.
    rx = (1-2*(qy*qy+qz*qz))*x + 2*(qx*qy-qz*qw)*y + 2*(qx*qz+qy*qw)*z
    ry = 2*(qx*qy+qz*qw)*x + (1-2*(qx*qx+qz*qz))*y + 2*(qy*qz-qx*qw)*z
    rz = 2*(qx*qz-qy*qw)*x + 2*(qy*qz+qx*qw)*y + (1-2*(qx*qx+qy*qy))*z
    node.rotation = list(q); node.translation = [x-rx, y-ry, z-rz]

def apply_pose(g, finish):
    # Meshes 3/4/12/13 are wing sections; 5/6/14/16/18 are tail sections.
    wing = [3,4,12,13]; tail = [5,6,14,16,18]
    if finish == "gold":
        # Head/jaw section in the extracted mesh is not rigged; a small pitch
        # gives the display a readable open-mouth, roaring silhouette.
        a = g.accessors[g.meshes[19].primitives[0].attributes.POSITION]
        pose_node(g.nodes[19], [(a.min[j]+a.max[j])/2 for j in range(3)], (1,0,0), -10)
        for i in wing:
            a = g.accessors[g.meshes[i].primitives[0].attributes.POSITION]
            center = [(a.min[j]+a.max[j])/2 for j in range(3)]
            pose_node(g.nodes[i], center, (0,0,1), 40 if center[0] > 0 else -40)
        for i in tail:
            a = g.accessors[g.meshes[i].primitives[0].attributes.POSITION]
            pose_node(g.nodes[i], [(a.min[j]+a.max[j])/2 for j in range(3)], (1,0,0), -28)
    elif finish == "silver":
        for i in wing:
            a = g.accessors[g.meshes[i].primitives[0].attributes.POSITION]
            center = [(a.min[j]+a.max[j])/2 for j in range(3)]
            pose_node(g.nodes[i], center, (0,0,1), -25 if center[0] > 0 else 25)
        for i in tail:
            a = g.accessors[g.meshes[i].primitives[0].attributes.POSITION]
            pose_node(g.nodes[i], [(a.min[j]+a.max[j])/2 for j in range(3)], (1,0,0), 24)

g = GLTF2().load(str(SOURCE)); blob = g.binary_blob()
# Raise the extracted figure so its lowest feet meet the top of the stand.
if os.environ.get("RATHALOS_SOURCE"):
    # V2 is armature-driven; preserve its complete bone hierarchy and root
    # transform. Flattening every node would detach the mesh from the bones.
    # Blender's glTF exporter stores these baked meshes at ~0.015 world scale;
    # bring their node transforms back to the original MHFU coordinate scale.
    factor = 1.0 / 0.0152834
    for idx in g.scenes[g.scene or 0].nodes:
        node = g.nodes[idx]
        if node.mesh is not None:
            node.scale = [(node.scale or [1,1,1])[j] * factor for j in range(3)]
            if node.translation:
                node.translation = [node.translation[j] * factor for j in range(3)]
                # Leave a small air gap for the flying-pose trophy.
                node.translation[1] -= 400
else:
    for node in g.nodes: node.translation = [0, 25, 0]
# The custom V2 asset already contains its flying pose; only the generated
# silver variant from the original asset receives the procedural pose.
if not os.environ.get("RATHALOS_SOURCE"):
    apply_pose(g, FINISH)
metal = {"bronze": ([0.34,0.14,0.045,1], "Solid aged bronze"), "silver": ([0.72,0.76,0.82,1], "Polished silver"), "gold": ([0.92,0.58,0.08,1], "Polished gold")}
color, metal_name = metal.get(FINISH, metal["bronze"])
bronze = len(g.materials); g.materials.append(Material(name=metal_name, doubleSided=True, pbrMetallicRoughness=PbrMetallicRoughness(baseColorFactor=color, roughnessFactor=0.22 if FINISH == "silver" else 0.3, metallicFactor=0.96 if FINISH == "silver" else 0.88)))
# The extracted Rathalos model has its feet around y=-317.
blob = append_mesh(g, blob, "Bronze galvano lower tier", bronze, cylinder(520,-390,-345))
blob = append_mesh(g, blob, "Bronze galvano upper tier", bronze, cylinder(410,-345,-300))
g.buffers[0].byteLength = len(blob); g.set_binary_blob(blob); g.save(str(OUTPUT)); print(OUTPUT)
