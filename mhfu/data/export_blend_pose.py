import bpy
from pathlib import Path

out = Path(r"C:\Users\MP\Documents\00 Claude\mhrise-bestiario\mhfu\data\models\rathalos-v2-flying-pose.glb")
bpy.context.scene.frame_set(45)
depsgraph = bpy.context.evaluated_depsgraph_get()
created = []
for obj in list(bpy.context.scene.objects):
    if obj.type != 'MESH':
        continue
    evaluated = obj.evaluated_get(depsgraph)
    mesh = evaluated.to_mesh().copy()
    evaluated.to_mesh_clear()
    clone = bpy.data.objects.new(obj.name + '_POSE_BAKED', mesh)
    clone.matrix_world = evaluated.matrix_world.copy()
    bpy.context.collection.objects.link(clone)
    created.append(clone)

bpy.context.view_layer.objects.active = created[0]
for obj in created: obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(out), export_format='GLB', use_selection=True, export_apply=True, export_animations=False, export_skins=False, export_yup=True)
for obj in created:
    bpy.data.objects.remove(obj, do_unlink=True)
print('EXPORTED', out)
