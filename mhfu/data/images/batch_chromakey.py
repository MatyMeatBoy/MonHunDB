# -*- coding: utf-8 -*-
"""Batch chromakey over mhrise-bestiario/mhfu/data/images/{armor,weapons}.
Moves originals to <folder>/bak/ and writes processed webp to the original path."""
import sys, os, time, shutil, importlib.util
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

CK = r"C:/Users/MP/Documents/Apps/claude/chromakey-tool/chromakey.py"
spec = importlib.util.spec_from_file_location("ck", CK)
ck = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ck)

BASE = r"C:/Users/MP/Documents/00 Claude/mhrise-bestiario/mhfu/data/images"
FOLDERS = ["armor", "weapons"]
EXT = (".webp", ".png", ".jpg", ".jpeg")

t0 = time.time()
done = fails = skipped = 0
for folder in FOLDERS:
    fdir = os.path.join(BASE, folder)
    bak = os.path.join(fdir, "bak")
    os.makedirs(bak, exist_ok=True)
    names = sorted(n for n in os.listdir(fdir)
                   if os.path.splitext(n)[1].lower() in EXT and n != "bak")
    for n in names:
        src = os.path.join(fdir, n)
        try:
            # move original to bak, then process into the original path
            shutil.move(src, os.path.join(bak, n))
            ck.chroma_key(os.path.join(bak, n), src)
            done += 1
        except Exception as e:
            fails += 1
            # restore original if processing failed
            if not os.path.exists(src) and os.path.exists(os.path.join(bak, n)):
                shutil.move(os.path.join(bak, n), src)
            print(f"FAIL {folder}/{n}: {e}", flush=True)
    print(f"{folder}: {done} OK / {fails} FAIL", flush=True)

print(f"TOTAL done={done} fails={fails} tiempo={time.time()-t0:.1f}s", flush=True)
