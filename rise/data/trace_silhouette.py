"""
Traces a flat-color silhouette reference image (like the ones the user drops
in mhrise-bestiario/vectores/) into separate vector regions, one per visually
distinct segment. White/near-white pixels and fully transparent pixels are
treated as separators/background, so segments split by a thin white outline
come out as separate connected components even if they share the same fill
color (e.g. two orange leg shapes stay separate).

Usage: python trace_silhouette.py <image.png> <output.json>

Output JSON is a list of {color: "#rrggbb", bbox: [x,y,w,h], points: "x1,y1 x2,y2 ..."}
sorted top-to-bottom then left-to-right, for a human to label with the
correct hitzone part name afterward.
"""
import sys
import json
import cv2
import numpy as np

def main():
    img_path, out_path = sys.argv[1], sys.argv[2]
    img = cv2.imread(img_path, cv2.IMREAD_UNCHANGED)
    if img is None:
        raise SystemExit(f"could not read {img_path}")

    h, w = img.shape[:2]
    has_alpha = img.shape[2] == 4

    if has_alpha:
        bgr = img[:, :, :3]
        alpha = img[:, :, 3]
        transparent = alpha < 20
    else:
        bgr = img
        transparent = np.zeros((h, w), dtype=bool)

    # near-white counts as background/separator, same as fully transparent
    near_white = np.all(bgr > 235, axis=2)
    background = transparent | near_white

    foreground = (~background).astype(np.uint8) * 255
    n_labels, labels = cv2.connectedComponents(foreground, connectivity=4)

    results = []
    # grow each region by DILATE_RADIUS px (distance transform, so the radius
    # accepts fractional values) before tracing its contour, so adjacent
    # regions overlap slightly instead of leaving a thin untooltipped seam
    # where the white outline pixels were excluded as background
    DILATE_RADIUS = 1.86  # was a 5x5 kernel (~2px radius), -7%
    # the Head region is much larger than any other (it's the whole crest),
    # so it gets extra dilation on its own -- a global bump here would
    # re-distort the small regions (legs merging, etc.) like it did before
    LARGE_REGION_AREA = 20000
    DILATE_RADIUS_LARGE = 5.0

    for label in range(1, n_labels):
        raw_mask = (labels == label).astype(np.uint8) * 255
        area = int(cv2.countNonZero(raw_mask))
        if area < 40:  # skip tiny noise specks
            continue
        radius = DILATE_RADIUS_LARGE if area > LARGE_REGION_AREA else DILATE_RADIUS
        dist = cv2.distanceTransform(cv2.bitwise_not(raw_mask), cv2.DIST_L2, 5)
        mask = np.where(dist <= radius, 255, 0).astype(np.uint8)

        mean_color = cv2.mean(bgr, mask=raw_mask)
        b, g, r = mean_color[:3]
        hex_color = "#{:02x}{:02x}{:02x}".format(int(r), int(g), int(b))

        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        contour = max(contours, key=cv2.contourArea)
        perimeter = cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, 0.0015 * perimeter, True)
        points = " ".join(f"{int(p[0][0])},{int(p[0][1])}" for p in approx)

        x, y, bw, bh = cv2.boundingRect(contour)
        results.append({
            "color": hex_color,
            "area": area,
            "bbox": [x, y, bw, bh],
            "pointCount": len(approx),
            "points": points,
        })

    results.sort(key=lambda r: (r["bbox"][1], r["bbox"][0]))

    with open(out_path, "w") as f:
        json.dump({"viewBox": f"0 0 {w} {h}", "regions": results}, f, indent=2)

    print(f"{len(results)} regions traced -> {out_path}")
    for r in results:
        print(f"  {r['color']}  bbox={r['bbox']}  points={r['pointCount']}")

if __name__ == "__main__":
    main()
