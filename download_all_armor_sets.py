#!/usr/bin/env python3
"""
Comprehensive Fextralife armor set image downloader.
Uses the complete list from https://monsterhunterrise.wiki.fextralife.com/Armor+Sets
"""

import os
import re
import time
import requests
from pathlib import Path
from urllib.parse import urljoin

OUTPUT_DIR = Path(r"C:\Users\MP\Documents\00 Claude\bestiario-nemo\por agregar")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

BASE_URL = "https://monsterhunterrise.wiki.fextralife.com/file/Monster-Hunter-Rise/"

# Complete list of sets from Armor Sets page (deduplicated)
# Format: (our_name, fextralife_url_name, has_base, has_S, has_X)
SETS = [
    # Master Rank Armor page sets (X variants mostly)
    ("Aelucanth", "Aelucanth", True, True, True),
    ("Aknosom", "Aknosom", True, True, True),
    ("Alloy", "Alloy", True, True, True),
    ("Almudron", "Almudron", True, True, True),
    ("Anjanath", "Anjanath", True, True, True),  # Anja on Fextralife
    ("Arc", "Arc", True, False, False),  # Only base
    ("Archfiend Armor", "Archfiend+Armor", True, False, False),
    ("Arzuros", "Arzuros", True, True, True),
    ("Astalos", "Astalos", True, False, False),  # Only base
    ("Auroracanth", "Auroracanth", True, False, False),
    ("Baggi", "Baggi", True, True, True),
    ("Barbania", "Barbania", True, False, False),
    ("Barioth", "Barioth", True, True, True),
    ("Barroth", "Barroth", True, True, True),
    ("Basarios", "Basarios", True, True, True),
    ("Base Commander", "Base+Commander", True, False, False),
    ("Bazelgeuse", "Bazelgeuse", True, True, True),  # Bazel S, Bazelgeuse X
    ("Bishaten", "Bishaten", True, True, True),
    ("Bnahabra", "Bnahabra", True, True, True),
    ("Bone", "Bone", True, True, True),
    ("Brigade", "Brigade", True, True, True),
    ("Bullfango Mask", "Bullfango+Mask", True, True, True),
    ("Ceanataur", "Ceanataur", True, False, False),
    ("Chainmail", "Chainmail", True, True, True),
    ("Channeler", "Channeler", True, True, True),  # Channeler (Spring) X
    ("Chaotic Gore", "Chaotic+Gore", True, False, False),
    ("Charite", "Charite", True, False, False),
    ("Chrome Metal", "Chrome+Metal", True, True, True),
    ("Commission", "Commission", True, False, False),
    ("Crimson Valstrax Epoch", "Crimson+Valstrax+-+Epoch", True, False, False),
    ("Damascus", "Damascus", True, True, True),
    ("Death Stench", "Death+Stench", True, True, True),
    ("Diablos", "Diablos", True, True, True),
    ("Dignified", "Dignified", True, False, False),
    ("Dober", "Dober", True, True, True),
    ("Droth", "Droth", True, True, True),
    ("Edel", "Edel", True, True, True),
    ("Espinas", "Espinas", True, False, False),
    ("Five Element", "Five+Element", True, False, False),
    ("Garangolm", "Garangolm", True, False, False),
    ("Gargwa", "Gargwa", True, True, True),
    ("Golden Lune", "Golden+Lune", True, True, True),  # Golden S, Golden Lune X
    ("Gore Magala", "Gore+Magala", True, False, False),
    ("Goss Harag", "Goss+Harag", True, True, True),
    ("Grand Chaos", "Grand+Chaos", True, False, False),
    ("Grand Divine Ire", "Grand+Divine+Ire", True, False, False),
    ("Grand God's Peer", "Grand+God's+Peer", True, False, False),
    ("Grand Mizuha", "Grand+Mizuha", True, False, False),
    ("Guardian", "Guardian", True, False, False),
    ("Guild Bard", "Guild+Bard", True, False, False),
    ("Guild Palace", "Guild+Palace", True, False, False),
    ("Hawk", "Hawk", True, False, False),
    ("Heavy Knight", "Heavy+Knight", True, False, False),
    ("Hermitaur", "Hermitaur", True, False, False),
    ("Hornetaur", "Hornetaur", True, False, False),
    ("Hunter", "Hunter", True, True, True),
    ("Ibushi Pure", "Ibushi+-+Pure", True, True, True),  # Ibushi, Ibushi Pure, Ibushi X
    ("Ingot", "Ingot", True, True, True),
    ("Izuchi", "Izuchi", True, True, True),
    ("Jaggi Mask", "Jaggi+Mask", True, True, True),
    ("Jaggi", "Jaggi", True, True, True),
    ("Jelly", "Jelly", True, True, True),
    ("Jyuratodus", "Jyuratodus", True, True, True),  # Jyura S, Jyuratodus X
    ("Kaiser", "Kaiser", True, True, True),
    ("Kamura Legacy", "Kamura+Legacy", True, False, False),
    ("Khezu", "Khezu", True, True, True),
    ("Knight Squire", "Knight+Squire", True, False, False),
    ("Kulu-Ya-Ku", "Kulu-Ya-Ku", True, True, True),  # Kulu S, Kulu-Ya-Ku X
    ("Kushala", "Kushala", True, True, True),
    ("Lagombi", "Lagombi", True, True, True),
    ("Leather", "Leather", True, True, True),
    ("Lecture", "Lecture", True, False, False),
    ("Lucent Narga", "Lucent+Narga", True, False, False),
    ("Lunagaron", "Lunagaron", True, False, False),
    ("Magmadron", "Magmadron", True, False, False),
    ("Makluva", "Makluva", True, True, True),
    ("Malzeno", "Malzeno", True, False, False),
    ("Medium", "Medium", True, True, True),  # Medium (Light), Medium S
    ("Melahoa", "Melahoa", True, True, True),
    ("Mighty Bow Feather", "Mighty+Bow+Feather", True, False, False),
    ("Mizutsune", "Mizutsune", True, True, True),
    ("Mosgharl", "Mosgharl", True, True, True),
    ("Nargacuga", "Nargacuga", True, True, True),
    ("Narwa Pure", "Narwa+-+Pure", True, True, True),  # Narwa, Narwa Pure, Narwa X
    ("Orangaten", "Orangaten", True, False, False),
    ("Pride", "Pride", True, False, False),
    ("Primordial", "Primordial", True, False, False),
    ("Professor", "Professor", True, False, False),
    ("Prudence", "Prudence", True, False, False),
    ("Pukei-Pukei", "Pukei-Pukei", True, True, True),  # Pukei S, Pukei-Pukei X
    ("Pyre-Kadaki", "Pyre-Kadaki", True, False, False),
    ("Rakna-Kadaki", "Rakna-Kadaki", True, True, True),  # Rakna-Kadaki, Rakna-Kadaki X
    ("Rathalos", "Rathalos", True, True, True),
    ("Rathian", "Rathian", True, True, True),
    ("Remobra", "Remobra", True, True, True),
    ("Rhenoplos", "Rhenoplos", True, True, True),
    ("Rhopessa", "Rhopessa", True, True, True),
    ("Rimeguard", "Rimeguard", True, False, False),
    ("Risen Kaiser", "Risen+Kaiser", True, False, False),
    ("Risen Kushala", "Risen+Kushala", True, False, False),
    ("Risen Mizuha", "Risen+Mizuha", True, False, False),
    ("Royal Ludroth", "Royal+Ludroth", True, True, True),  # Ludroth S, Royal Ludroth X
    ("Sailor", "Sailor", True, False, False),
    ("Scholar", "Scholar", True, False, False),
    ("Scholarly", "Scholarly", True, False, False),
    ("Seregios", "Seregios", True, False, False),
    ("Silver Sol", "Silver+Sol", True, True, True),  # Golden Set, Silver Sol X
    ("Sinister Demon", "Sinister+Demon", True, True, True),  # Sinister, Sinister S, Sinister Demon
    ("Sinister Grudge", "Sinister+Grudge", True, False, False),
    ("Skalda", "Skalda", True, True, True),
    ("Skull", "Skull", True, True, True),
    ("Slagtoth", "Slagtoth", True, True, True),
    ("Snowshear", "Snowshear", True, False, False),
    ("Somnacanth", "Somnacanth", True, True, True),
    ("Spio", "Spio", True, True, True),  # Spio Set, Spio S Set (no X)
    ("Storge", "Storge", True, False, False),
    ("Tempest", "Tempest", True, False, False),
    ("Tetranadon", "Tetranadon", True, True, True),
    ("Tigrex", "Tigrex", True, True, True),
    ("Tobi-Kadachi", "Tobi-Kadachi", True, True, True),
    ("Uroktor", "Uroktor", True, True, True),
    ("Utsushi True", "Utsushi+True", True, True, True),  # Utsushi (Visible/Hidden), Utsushi S (Visible/Hidden), Utsushi True (Visible/Hidden)
    ("Vaik", "Vaik", True, True, True),
    ("Velociprey", "Velociprey", True, False, False),
    ("Vespoid", "Vespoid", True, False, False),
    ("Virtue", "Virtue", True, False, False),
    ("Volvidon", "Volvidon", True, True, True),
    ("Wroggi", "Wroggi", True, True, True),
    ("Yukumo Sky", "Yukumo+Sky", True, False, False),
    ("Zinogre", "Zinogre", True, True, True),  # Zinogre Set, Zinogre S Set, Zinogre Set X
]

def slugify(name):
    """Convert set name to Fextralife filename slug"""
    return name.lower().replace(" ", "-").replace("'", "").replace("+", "")

def get_image_urls(set_name, fex_name, has_base, has_S, has_X):
    """Generate possible image URLs for a set"""
    base_slug = slugify(fex_name)
    urls = []
    
    if has_base:
        urls.append((f"{set_name}", f"{BASE_URL}{base_slug}_set-mhr-wiki-guide.png"))
        urls.append((f"{set_name}", f"{BASE_URL}{base_slug}-male-set-mhr-wiki-guide.png"))
        urls.append((f"{set_name}", f"{BASE_URL}{base_slug}-set-mhr-wiki-guide.png"))
    
    if has_S:
        urls.append((f"{set_name} S", f"{BASE_URL}{base_slug}_s-male-set-mhr-wiki-guide.png"))
        urls.append((f"{set_name} S", f"{BASE_URL}{base_slug}_s_set-mhr-wiki-guide.png"))
        urls.append((f"{set_name} S", f"{BASE_URL}{base_slug}-s-male-set-mhr-wiki-guide.png"))
    
    if has_X:
        urls.append((f"{set_name} X", f"{BASE_URL}{base_slug}_x-male-set-mhr-wiki-guide.png"))
        urls.append((f"{set_name} X", f"{BASE_URL}{base_slug}_x_set-mhr-wiki-guide.png"))
        urls.append((f"{set_name} X", f"{BASE_URL}{base_slug}-x-male-set-mhr-wiki-guide.png"))
        # Special case for Zinogre
        if "zinogre" in base_slug:
            urls.append((f"{set_name} X", f"{BASE_URL}{base_slug}_set-mhr-wiki-guide1.png"))
    
    return urls

def download_image(url, dest_path):
    """Download image with error handling"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        resp = requests.get(url, headers=headers, timeout=15, stream=True)
        if resp.status_code == 200 and 'image' in resp.headers.get('Content-Type', ''):
            with open(dest_path, 'wb') as f:
                for chunk in resp.iter_content(8192):
                    f.write(chunk)
            return True
        elif resp.status_code in (301, 302, 303, 307, 308):
            # Follow redirect
            return download_image(resp.headers['Location'], dest_path)
    except Exception as e:
        print(f"  Error downloading {url}: {e}")
    return False

def main():
    print(f"Output directory: {OUTPUT_DIR}")
    print(f"Total sets to process: {len(SETS)}")
    
    # Check existing files
    existing = {f.name for f in OUTPUT_DIR.glob("*.png")}
    print(f"Already downloaded: {len(existing)} files")
    
    downloaded = 0
    failed = []
    
    for our_name, fex_name, has_base, has_S, has_X in SETS:
        urls = get_image_urls(our_name, fex_name, has_base, has_S, has_X)
        
        for variant_name, url in urls:
            filename = f"{slugify(variant_name)}.png"
            dest = OUTPUT_DIR / filename
            
            if filename in existing:
                continue
                
            print(f"Downloading: {variant_name} <- {url}")
            if download_image(url, dest):
                print(f"  OK: {filename}")
                downloaded += 1
                existing.add(filename)
                break  # Got one variant, move to next set
            else:
                print(f"  Failed: {url}")
        else:
            # All URLs failed
            failed.append((our_name, urls))
        
        time.sleep(0.15)  # Be nice to the server
    
    print(f"\n=== SUMMARY ===")
    print(f"Newly downloaded: {downloaded}")
    print(f"Failed sets: {len(failed)}")
    if failed:
        print("\nFailed sets:")
        for name, urls in failed:
            print(f"  {name}: tried {[u[1] for u in urls]}")
    
    # Final count
    final_count = len(list(OUTPUT_DIR.glob("*.png")))
    print(f"\nTotal PNG files in output: {final_count}")

if __name__ == "__main__":
    main()