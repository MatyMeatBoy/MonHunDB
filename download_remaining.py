#!/usr/bin/env python3
"""
Download remaining armor set images found via manual browser checks
"""

import requests
from pathlib import Path
import time

OUTPUT_DIR = Path(r"C:\Users\MP\Documents\00 Claude\bestiario-nemo\por agregar")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Images found via manual browser checks
MANUAL_FOUND = {
    "onmyo": "https://monsterhunterrise.wiki.fextralife.com/file/Monster-Hunter-Rise/onmyo_set_male_armor_sets_mh_rise_wiki_guide.png",
    "flaming-espinas": "https://monsterhunterrise.wiki.fextralife.com/file/Monster-Hunter-Rise/flaming_espinas_set_02_male_armor_sets_mh_rise_wiki_guide.png",
    "rimeguard": "https://monsterhunterrise.wiki.fextralife.com/file/Monster-Hunter-Rise/rimeguard_armor_set-mhr-wiki-guide.png",
    "tempest": "https://monsterhunterrise.wiki.fextralife.com/file/Monster-Hunter-Rise/tempest_armor_set_male-mhr-wiki-guide.png",
    "virtue": "https://monsterhunterrise.wiki.fextralife.com/file/Monster-Hunter-Rise/virtue_armor_set-mhr-wiki-guide.png",
    "valstrax": "https://monsterhunterrise.wiki.fextralife.com/file/Monster-Hunter-Rise/valstrax_armor_set-mhr-wiki-guide.png",
    "chaotic-gore": "https://monsterhunterrise.wiki.fextralife.com/file/Monster-Hunter-Rise/chaotic_gore_set_new_mhr_wiki_174px.png",
    "prudence": "https://monsterhunterrise.wiki.fextralife.com/file/Monster-Hunter-Rise/prudence_armor_set-mhr-wiki-guide.png",
}

# Additional sets to check on Fextralife (they likely exist)
ADDITIONAL_TO_CHECK = [
    ("outpost-hq", "Outpost+HQ+Set"),
    ("silver-sol-s", "Silver+Sol+S+Set"),
    ("silver-sol-x", "Silver+Sol+X+Set"),
    ("golden-s", "Golden+S+Set"),
    ("golden-lune-x", "Golden+Lune+Set"),
    ("ibushi-s", "Ibushi+S+Set"),
    ("ibushi-x", "Ibushi+X+Set"),
    ("narwa-s", "Narwa+S+Set"),
    ("narwa-x", "Narwa+X+Set"),
    ("lambent", "Lambent+Set"),
    ("sinister-grudge", "Sinister+Grudge+Set"),
    ("archfiend-armor", "Archfiend+Armor+Set"),
    ("lucent-narga", "Lucent+Narga+Set"),
    ("charite", "Charite+Set"),
    ("scholar", "Scholar+Set"),
    ("medium-s", "Medium+S+Set"),
    ("channeler-s", "Channeler+S+Set"),
    ("channeler", "Channeler+(Spring)+Set"),
    ("droth-s", "Droth+S+Set"),
    ("droth-x", "Droth+X+Set"),
    ("droth", "Droth+Set"),
    ("edel-s", "Edel+S+Set"),
    ("edel-x", "Edel+X+Set"),
    ("edel", "Edel+Set"),
    ("mighty-bow-feather", "Mighty+Bow+Feather+Set"),
    ("mizuha", "Mizuha+Set"),
    ("skull-s", "Skull+S+Set"),
    ("skull-x", "Skull+X+Set"),
    ("skull", "Skull+Set"),
    ("bullfango-mask-s", "Bullfango+Mask+S+Set"),
    ("bullfango-mask", "Bullfango+Mask+Set"),
    ("pukei-pukei-x", "Pukei-Pukei+X+Set"),
    ("rakna-kadaki", "Rakna-Kadaki+Set"),
    ("spio-x", "Spio+X+Set"),
    ("spio-s", "Spio+S+Set"),
    ("spio", "Spio+Set"),
    ("chaos-s", "Chaos+S+Set"),
    ("chaos", "Chaos+Set"),
    ("kamura-s", "Kamura+S+Set"),
    ("kamura", "Kamura+Set"),
    ("azul-age", "Azur+Age+Set"),
    ("black-leather", "Black+Leather+Set"),
    ("kamura-legacy", "Kamura+Legacy+Set"),
    ("hunter-x", "Hunter+X+Set"),
    ("hunter-s", "Hunter+S+Set"),
    ("hunter", "Hunter+Set"),
]

def download_image(url, dest_path):
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        resp = requests.get(url, headers=headers, timeout=20, stream=True)
        if resp.status_code == 200 and 'image' in resp.headers.get('Content-Type', ''):
            with open(dest_path, 'wb') as f:
                for chunk in resp.iter_content(8192):
                    f.write(chunk)
            return True
        elif resp.status_code in (301, 302, 303, 307, 308):
            return download_image(resp.headers['Location'], dest_path)
    except Exception as e:
        print(f"  Error: {e}")
    return False

def slugify(name):
    return name.lower().replace(" ", "-").replace("'", "").replace("+", "").replace("(", "").replace(")", "")

def main():
    existing = {f.name for f in OUTPUT_DIR.glob("*.png")}
    print(f"Existing files: {len(existing)}")
    
    downloaded = 0
    
    # 1. Download manually found images
    print("\n=== Downloading manually verified images ===")
    for name, url in MANUAL_FOUND.items():
        filename = f"{name}.png"
        if filename in existing:
            print(f"SKIP: {name}")
            continue
        print(f"Downloading: {name}")
        dest = OUTPUT_DIR / filename
        if download_image(url, dest):
            print(f"  OK: {filename}")
            downloaded += 1
            existing.add(filename)
        else:
            print(f"  FAILED")
        time.sleep(0.2)
    
    # 2. Check additional sets via direct URL pattern guessing
    print("\n=== Trying direct URL patterns for additional sets ===")
    BASE = "https://monsterhunterrise.wiki.fextralife.com/file/Monster-Hunter-Rise/"
    
    for name, fex_name in ADDITIONAL_TO_CHECK:
        filename = f"{name}.png"
        if filename in existing:
            continue
        
        # Try common patterns
        base_slug = slugify(fex_name.replace("+Set", "").replace("+", "-"))
        patterns = [
            f"{BASE}{base_slug}_set-mhr-wiki-guide.png",
            f"{BASE}{base_slug}-male-set-mhr-wiki-guide.png",
            f"{BASE}{base_slug}-set-mhr-wiki-guide.png",
            f"{BASE}{base_slug}_male-set-mhr-wiki-guide.png",
            f"{BASE}{base_slug}_set_armor_mhr_wiki_guide.png",
            f"{BASE}{base_slug}_armor_set-mhr-wiki-guide.png",
        ]
        
        if "x" in name or "-x" in name:
            patterns.insert(0, f"{BASE}{base_slug.replace('-x', '')}_x-male-set-mhr-wiki-guide.png")
            patterns.insert(1, f"{BASE}{base_slug.replace('-x', '')}_x_set-mhr-wiki-guide.png")
        if "s" in name and ("-s" in name or name.endswith("-s")):
            patterns.insert(0, f"{BASE}{base_slug.replace('-s', '')}_s-male-set-mhr-wiki-guide.png")
            patterns.insert(1, f"{BASE}{base_slug.replace('-s', '')}_s_set-mhr-wiki-guide.png")
        
        for url in patterns:
            print(f"  Trying: {url}")
            dest = OUTPUT_DIR / filename
            if download_image(url, dest):
                print(f"  OK: {filename}")
                downloaded += 1
                existing.add(filename)
                break
        else:
            pass  # All patterns failed
        time.sleep(0.1)
    
    print(f"\n=== SUMMARY ===")
    print(f"Newly downloaded: {downloaded}")
    print(f"Total files: {len(list(OUTPUT_DIR.glob('*.png')))}")

if __name__ == "__main__":
    main()