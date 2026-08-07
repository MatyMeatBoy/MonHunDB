"""
Debug helper: renders the CURRENT HITZONE_SHAPES mapping for a monster (as
committed in app.js right now, after any merges/splits/reassignments) with
one flat color per named part and a label at each part's centroid -- so the
user can confirm/correct by part name+color instead of by raw trace index
(which stops matching once shapes get merged or split).

Usage: python preview_final_parts.py <shapes.json> <monster> <output.png>
shapes.json is the {MonsterName: {viewBox, parts: {Part: [pointStrings]}}}
dump extracted from app.js's HITZONE_SHAPES.
"""
import sys
import json
import colorsys
import cv2
import numpy as np

def parse_points(pts):
    out = []
    for pair in pts.strip().split(" "):
        x, y = pair.split(",")
        out.append((float(x), float(y)))
    return out

def main():
    shapes_path, monster, out_path = sys.argv[1], sys.argv[2], sys.argv[3]
    with open(shapes_path) as f:
        shapes = json.load(f)
    m = shapes[monster]
    vb = [float(x) for x in m["viewBox"].split(" ")]
    w, h = int(vb[2]), int(vb[3])
    canvas = np.full((h, w, 3), 255, dtype=np.uint8)

    parts = list(m["parts"].items())
    n = len(parts)
    for i, (part, polys) in enumerate(parts):
        hue = i / max(n, 1)
        r, g, b = colorsys.hsv_to_rgb(hue, 0.55, 0.85)
        color = (int(b * 255), int(g * 255), int(r * 255))  # BGR
        centroid_pts = []
        for pts in polys:
            poly = np.array(parse_points(pts), dtype=np.int32)
            cv2.fillPoly(canvas, [poly], color)
            cv2.polylines(canvas, [poly], True, (20, 20, 20), 2)
            centroid_pts.append(poly.mean(axis=0))
        cx, cy = np.mean(centroid_pts, axis=0).astype(int)
        label = f"{i}:{part}"
        (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 2)
        cv2.rectangle(canvas, (cx - tw // 2 - 3, cy - th // 2 - 3), (cx + tw // 2 + 3, cy + th // 2 + 3), (255, 255, 255), -1)
        cv2.rectangle(canvas, (cx - tw // 2 - 3, cy - th // 2 - 3), (cx + tw // 2 + 3, cy + th // 2 + 3), (0, 0, 0), 1)
        cv2.putText(canvas, label, (cx - tw // 2, cy + th // 2), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 0, 200), 2, cv2.LINE_AA)

    cv2.imwrite(out_path, canvas)
    print(f"wrote {out_path} ({n} parts)")

if __name__ == "__main__":
    main()
