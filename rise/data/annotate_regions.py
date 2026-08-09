"""
Debug helper: draws the index number of each traced region (from
trace_silhouette.py's output) at its centroid, over the original reference
image, so a human/model can visually match "region #N" to a body part before
committing anything to HITZONE_SHAPES. Not part of the runtime app.

Usage: python annotate_regions.py <image.png> <traced.json> <output.png>
"""
import sys
import json
import cv2
import numpy as np

def main():
    img_path, traced_path, out_path = sys.argv[1], sys.argv[2], sys.argv[3]
    img = cv2.imread(img_path, cv2.IMREAD_UNCHANGED)
    if img.shape[2] == 4:
        bgr = img[:, :, :3].copy()
        alpha = img[:, :, 3]
        bg = np.zeros_like(bgr)
        bg[:] = (255, 255, 255)
        mask = alpha[:, :, None] / 255.0
        canvas = (bgr * mask + bg * (1 - mask)).astype(np.uint8)
    else:
        canvas = img[:, :, :3].copy()

    with open(traced_path) as f:
        data = json.load(f)
    regions = data["regions"] if isinstance(data, dict) else data

    for i, r in enumerate(regions):
        x, y, w, h = r["bbox"]
        cx, cy = x + w // 2, y + h // 2
        label = str(i)
        (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 1.1, 3)
        cv2.rectangle(canvas, (cx - tw // 2 - 4, cy - th // 2 - 4), (cx + tw // 2 + 4, cy + th // 2 + 4), (255, 255, 255), -1)
        cv2.rectangle(canvas, (cx - tw // 2 - 4, cy - th // 2 - 4), (cx + tw // 2 + 4, cy + th // 2 + 4), (0, 0, 0), 2)
        cv2.putText(canvas, label, (cx - tw // 2, cy + th // 2), cv2.FONT_HERSHEY_SIMPLEX, 1.1, (0, 0, 255), 3, cv2.LINE_AA)

    cv2.imwrite(out_path, canvas)
    print(f"wrote {out_path} with {len(regions)} labeled regions")

if __name__ == "__main__":
    main()
