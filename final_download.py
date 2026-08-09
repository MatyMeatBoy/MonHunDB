#!/usr/bin/env python3
"""
Final comprehensive downloader - visits Fextralife Armor Sets page and downloads all set images
"""

import requests
from pathlib import Path
import time
import re

OUTPUT_DIR = Path(r"C:\Users\MP\Documents\00 Claude\bestiario-nemo\por agregar")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

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
        pass
    return False

def slugify(name):
    return name.lower().replace(" ", "-").replace("'", "").replace("+", "").replace("(", "").replace(")", "").replace(".", "")

# Complete list from Fextralife Armor Sets page (all links that contain "Set")
# Format: (filename_base, fextralife_page_name)
ALL_SETS = [
    # Already have most of these, but let's be thorough
    ("kamura-legacy", "Kamura+Legacy+Set"),
    ("leather", "Leather+Set"), ("leather-s", "Leather+S+Set"), ("leather-x", "Leather+X+Set"),
    ("chainmail", "Chainmail+Set"), ("chainmail-s", "Chainmail+S+Set"), ("chainmail-x", "Chainmail+X+Set"),
    ("hunter", "Hunter+Set"), ("hunter-s", "Hunter+S+Set"), ("hunter-x", "Hunter+X+Set"),
    ("bone", "Bone+Set"), ("bone-s", "Bone+S+Set"), ("bone-x", "Bone+X+Set"),
    ("hermitaur", "Hermitaur+Set"),
    ("tobi-kadachi", "Tobi-Kadachi+Set"), ("tobi-kadachi-x", "Tobi-Kadachi+X+Set"),
    ("vaik", "Vaik+Set"), ("vaik-s", "Vaik+S+Set"), ("vaik-x", "Vaik+X+Set"),
    ("death-stench", "Death+Stench+Set"), ("death-stench-s", "Death+Stench+S+Set"), ("death-stench-x", "Death+Stench+X+Set"),
    ("garangolm", "Garangolm+Set"),
    ("wroggi", "Wroggi+Set"), ("wroggi-s", "Wroggi+S+Set"), ("wroggi-x", "Wroggi+X+Set"),
    ("baggi", "Baggi+Set"), ("baggi-s", "Baggi+S+Set"), ("baggi-x", "Baggi+X+Set"),
    ("izuchi", "Izuchi+Set"), ("izuchi-s", "Izuchi+S+Set"), ("izuchi-x", "Izuchi+X+Set"),
    ("vespoid", "Vespoid+Set"),
    ("hornetaur", "Hornetaur+Set"),
    ("rhenoplos", "Rhenoplos+Set"), ("rhenoplos-s", "Rhenoplos+S+Set"), ("rhenoplos-x", "Rhenoplos+X+Set"),
    ("guardian", "Guardian+Set"),
    ("dober", "Dober+Set"), ("dober-x", "Dober+X+Set"),
    ("skull", "Skull+Set"), ("skull-s", "Skull+S+Set"), ("skull-x", "Skull+X+Set"),
    ("ingot", "Ingot+Set"), ("ingot-s", "Ingot+S+Set"), ("ingot-x", "Ingot+X+Set"),
    ("anjanath", "Anja+Set"), ("anjanath-s", "Anja+S+Set"), ("anjanath-x", "Anjanath+X+Set"),
    ("pukei", "Pukei+Set"), ("pukei-s", "Pukei+S+Set"), ("pukei-pukei-x", "Pukei-Pukei+X+Set"),
    ("orangaten", "Orangaten+Set"),
    ("khezu", "Khezu+Set"), ("khezu-s", "Khezu+S+Set"), ("khezu-x", "Khezu+X+Set"),
    ("slagtoth", "Slagtoth+Set"), ("slagtoth-s", "Slagtoth+S+Set"), ("slagtoth-x", "Slagtoth+X+Set"),
    ("tetranadon", "Tetranadon+Set"), ("tetranadon-s", "Tetranadon+S+Set"), ("tetranadon-x", "Tetranadon+X+Set"),
    ("aknosom", "Aknosom+Set"), ("aknosom-s", "Aknosom+S+Set"), ("aknosom-x", "Aknosom+X+Set"),
    ("volvidon", "Volvidon+Set"), ("volvidon-s", "Volvidon+S+Set"), ("volvidon-x", "Volvidon+X+Set"),
    ("kulu-ya-ku", "Kulu+Set"), ("kulu-ya-ku-s", "Kulu+S+Set"), ("kulu-ya-ku-x", "Kulu-Ya-Ku+X+Set"),
    ("velociprey", "Velociprey+Set"),
    ("jaggi", "Jaggi+Set"), ("jaggi-s", "Jaggi+S+Set"), ("jaggi-x", "Jaggi+X+Set"),
    ("jaggi-mask", "Jaggi+Mask+Set"), ("jaggi-mask-s", "Jaggi+Mask+S+Set"), ("jaggi-mask-x", "Jaggi+Mask+X+Set"),
    ("bnahabra", "Bnahabra+Set"), ("bnahabra-s", "Bnahabra+S++Set"), ("bnahabra-x", "Bnahabra+X+Set"),
    ("bullfango-mask", "Bullfango+Mask+Set"), ("bullfango-mask-s", "Bullfango+Mask+S+Set"), ("bullfango-mask-x", "Bullfango+Mask+X+Set"),
    ("gargwa", "Gargwa+Set"), ("gargwa-s", "Gargwa+S+Set"), ("gargwa-x", "Gargwa+X+Set"),
    ("auroracanth", "Auroracanth+Set"),
    ("goss-harag", "Goss+Harag+Set"), ("goss-harag-s", "Goss+Harag+S+Set"), ("goss-harag-x", "Goss+Harag+X+Set"),
    ("rakna-kadaki", "Rakna-Kadaki+Set"), ("rakna-kadaki-x", "Rakna-Kadaki+X+Set"),
    ("five-element", "Five+Element+Set"),
    ("barioth", "Barioth+Set"), ("barioth-s", "Barioth+S+Set"), ("barioth-x", "Barioth+X+Set"),
    ("almudron", "Almudron+Set"), ("almudron-s", "Almudron+S+Set"), ("almudron-x", "Almudron+X+Set"),
    ("grand-chaos", "Grand+Chaos+Set"),
    ("sinister-demon", "Sinister+Demon+Set"),
    ("nargacuga", "Nargacuga+Set"), ("nargacuga-s", "Nargacuga+S+Set"), ("nargacuga-x", "Nargacuga+X+Set"),
    ("magmadron", "Magmadron+Set"),
    ("pyre-kadaki", "Pyre-Kadaki+Set"),
    ("chrome-metal", "Chrome+Metal+Set"), ("chrome-metal-x", "Chrome+Metal+Set+X"),
    ("remobra", "Remobra+Set"), ("remobra-s", "Remobra+S+Set"), ("remobra-x", "Remobra+X+Set"),
    ("mizutsune", "Mizutsune+Set"), ("mizutsune-s", "Mizutsune+S+Set"), ("mizutsune-x", "Mizutsune+X+Set"),
    ("rathalos", "Rathalos+Set"), ("rathalos-s", "Rathalos+S+Set"), ("rathalos-x", "Rathalos+X+Set"),
    ("zinogre", "Zinogre+Set"), ("zinogre-s", "Zinogre+S+Set"), ("zinogre-x", "Zinogre+Set+X"),
    ("lunagaron", "Lunagaron+Set"),
    ("astalos", "Astalos+Set"),
    ("espinas", "Espinas+Set"),
    ("gore-magala", "Gore+Magala+Set"),
    ("damascus", "Damascus+Set"), ("damascus-x", "Damascus+X+Set"),
    ("malzeno", "Malzeno+Set"),
    ("ibushi-pure", "Ibushi+-+Pure+Set"),
    ("barbania", "Barbania+Set"),
    ("rathian", "Rathian+Set"), ("rathian-s", "Rathian+S+Set"), ("rathian-x", "Rathian+X+Set"),
    ("bishaten", "Bishaten+Set"), ("bishaten-s", "Bishaten+S+Set"), ("bishaten-x", "Bishaten+X+Set"),
    ("yukumo-sky", "Yukumo+Sky+Set"),
    ("arzuros", "Arzuros+Set"), ("arzuros-s", "Arzuros+S+Set"), ("arzuros-x", "Arzuros+X+Set"),
    ("alloy", "Alloy+Set"), ("alloy-s", "Alloy+S+Set"), ("alloy-x", "Alloy+X+Set"),
    ("skalda", "Skalda+Set"), ("skalda-s", "Skalda+S+Set"), ("skalda-x", "Skalda+X+Set"),
    ("droth", "Droth+Set"), ("droth-s", "Droth+S+Set"), ("droth-x", "Droth+X+Set"),
    ("narwa-pure", "Narwa+-+Pure+Set"),
    ("commission", "Commission+Set"),
    ("diablos", "Diablos+Set"), ("diablos-s", "Diablos+S+Set"), ("diablos-x", "Diablos+X+Set"),
    ("hawk", "Hawk+Set"),
    ("ceanataur", "Ceanataur+Set"),
    ("guild-bard", "Guild+Bard+Set"),
    ("makluva", "Makluva+Set"), ("makluva-s", "Makluva+S+Set"), ("makluva-x", "Makluva+X+Set"),
    ("mosgharl", "Mosgharl+Set"), ("mosgharl-x", "Mosgharl+X+Set"),
    ("melahoa", "Melahoa+Set"), ("melahoa-x", "Melahoa+X+Set"),
    ("kushala", "Kushala+Set"), ("kushala-x", "Kushala+X+Set"),
    ("sailor", "Sailor+Set"),
    ("scholarly", "Scholarly+Set"),
    ("jelly", "Jelly+Set"), ("jelly-s", "Jelly+S+Set"), ("jelly-x", "Jelly+X+Set"),
    ("tigrex", "Tigrex+Set"), ("tigrex-s", "Tigrex+S+Set"), ("tigrex-x", "Tigrex+X+Set"),
    ("uroktor", "Uroktor+Set"), ("uroktor-s", "Uroktor+S+Set"), ("uroktor-x", "Uroktor+X+Set"),
    ("basarios", "Basarios+Set"), ("basarios-s", "Basarios+S+Set"), ("basarios-x", "Basarios+X+Set"),
    ("jyuratodus", "Jyura+Set"), ("jyuratodus-x", "Jyuratodus+X+Set"),
    ("knight-squire", "Knight+Squire+Set"),
    ("lagombi", "Lagombi+Set"), ("lagombi-s", "Lagombi+S+Set"), ("lagombi-x", "Lagombi+X+Set"),
    ("grand-divine-ire", "Grand+Divine+Ire+Set"),
    ("professor", "Professor+Set"),
    ("heavy-knight", "Heavy+Knight+Set"),
    ("somnacanth", "Somnacanth+Set"), ("somnacanth-s", "Somnacanth+S+Set"), ("somnacanth-x", "Somnacanth+X+Set"),
    ("edel", "Edel+Set"), ("edel-s", "Edel+S+Set"), ("edel-x", "Edel+X+Set"),
    ("base-commander", "Base+Commander+Set"),
    ("royal-ludroth", "Royal+Ludroth+Set"),
    ("barroth", "Barroth+Set"), ("barroth-s", "Barroth+S+Set"), ("barroth-x", "Barroth+X+Set"),
    ("aelucanth", "Aelucanth+Set"), ("aelucanth-s", "Aelucanth+S+Set"), ("aelucanth-x", "Aelucanth+X+Set"),
    ("snowshear", "Snowshear+Set"),
    ("utsushi-true-visible", "Utsushi+True+(Visible)+Set"),
    ("utsushi-true-hidden", "Utsushi+True+(Hidden)+Set"),
    ("utsushi-visible", "Utsushi+Set+(Visible)"),
    ("utsushi-hidden", "Utsushi+Set+(Hidden)"),
    ("utsushi-s-visible", "Utsushi+S+Set+(Visible)"),
    ("utsushi-s-hidden", "Utsushi+S+Set+(Hidden)"),
    ("seregios", "Seregios+Set"),
    ("grand-mizuha", "Grand+Mizuha+Set"),
    ("kaiser", "Kaiser+Set"), ("kaiser-x", "Kaiser+X+Set"),
    ("arc", "Arc+Set"),
    ("grand-gods-peer", "Grand+God's+Peer+Set"),
    ("bazelgeuse", "Bazel+Set"), ("bazelgeuse-x", "Bazelgeuse+X+Set"),
    ("archfiend-armor", "Archfiend+Armor+Set"),
    ("dignified", "Dignified+Set"),
    ("sinister-grudge", "Sinister+Grudge+Set"),
    ("brigade", "Brigade+Set"), ("brigade-s", "Brigade+S+Set"), ("brigade-x", "Brigade+X+Set"),
    ("scholar", "Scholar+Set"),
    ("charite", "Charite+Set"),
    ("guild-palace", "Guild+Palace+Set"),
    ("storge", "Storge+Set"),
    ("medium", "Medium+(Light)+Set"), ("medium-s", "Medium+S+Set"),
    ("channeler", "Channeler+(Spring)+Set"), ("channeler-s", "Channeler+S+Set"),
    ("lecture", "Lecture+Set"),
    ("rhopessa", "Rhopessa+Set"), ("rhopessa-s", "Rhopessa+S+Set"), ("rhopessa-x", "Rhopessa+X+Set"),
    ("golden", "Golden+Set"), ("golden-lune-x", "Golden+Lune+Set"),
    ("pride", "Pride+Set"),
    ("lucent-narga", "Lucent+Narga+Set"),
    ("silver-sol", "Silver+Sol+Set"),
    ("flaming-espinas", "Flaming+Espinas+Set"),
    ("onmyo", "Onmyo+Set"),
    ("risen-mizuha", "Risen+Mizuha+Set"),
    ("chaotic-gore", "Chaotic+Gore+Set"),
    ("risen-kaiser", "Risen+Kaiser+Set"),
    ("risen-kushala", "Risen+Kushala+Set"),
    ("rimeguard", "Rimeguard+Set"),
    ("crimson-valstrax-epoch", "Crimson+Valstrax+-+Epoch+Set"),
    ("tempest", "Tempest+Set"),
    ("prudence", "Prudence+Set"),
    ("virtue", "Virtue+Set"),
    ("primordial", "Primordial+Set"),
]

def main():
    existing = {f.name for f in OUTPUT_DIR.glob("*.png")}
    print(f"Existing: {len(existing)}")
    
    downloaded = 0
    
    for filename_base, page_name in ALL_SETS:
        filename = f"{filename_base}.png"
        if filename in existing:
            continue
        
        # Try to find image by visiting the page
        page_url = f"https://monsterhunterrise.wiki.fextralife.com/{page_name}"
        print(f"Checking: {filename_base} -> {page_url}")
        
        # Try common image URL patterns
        base_slug = slugify(page_name.replace("+Set", "").replace("+", "-"))
        patterns = [
            f"https://monsterhunterrise.wiki.fextralife.com/file/Monster-Hunter-Rise/{base_slug}_set-mhr-wiki-guide.png",
            f"https://monsterhunterrise.wiki.fextralife.com/file/Monster-Hunter-Rise/{base_slug}-male-set-mhr-wiki-guide.png",
            f"https://monsterhunterrise.wiki.fextralife.com/file/Monster-Hunter-Rise/{base_slug}-set-mhr-wiki-guide.png",
            f"https://monsterhunterrise.wiki.fextralife.com/file/Monster-Hunter-Rise/{base_slug}_male-set-mhr-wiki-guide.png",
            f"https://monsterhunterrise.wiki.fextralife.com/file/Monster-Hunter-Rise/{base_slug}_set_armor_mhr_wiki_guide.png",
            f"https://monsterhunterrise.wiki.fextralife.com/file/Monster-Hunter-Rise/{base_slug}_armor_set-mhr-wiki-guide.png",
            f"https://monsterhunterrise.wiki.fextralife.com/file/Monster-Hunter-Rise/{base_slug}_set_armor_mhr_wiki_guide1.png",
        ]
        
        for url in patterns:
            dest = OUTPUT_DIR / filename
            if download_image(url, dest):
                print(f"  OK: {filename}")
                downloaded += 1
                existing.add(filename)
                break
        else:
            print(f"  NOT FOUND")
        
        time.sleep(0.1)
    
    print(f"\n=== DONE ===")
    print(f"Newly downloaded: {downloaded}")
    print(f"Total: {len(list(OUTPUT_DIR.glob('*.png')))}")

if __name__ == "__main__":
    main()