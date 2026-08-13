import bpy
print('SCENE', bpy.context.scene.name, 'FRAME', bpy.context.scene.frame_current)
for o in bpy.context.scene.objects:
    print('OBJ', o.name, o.type, 'parent', o.parent.name if o.parent else None, 'loc', tuple(round(x,3) for x in o.location), 'rot', tuple(round(x,3) for x in o.rotation_euler), 'scale', tuple(round(x,3) for x in o.scale))
