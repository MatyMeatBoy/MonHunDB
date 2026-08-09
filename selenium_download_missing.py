#!/usr/bin/env python3
"""
Use Selenium to scrape actual image URLs from Fextralife for missing sets
"""

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
import time
import requests
from pathlib import Path

OUTPUT_DIR = Path(r"C:\Users\MP\Documents\00 Claude\bestiario-nemo\por agregar")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Sets that exist on Fextralife but we're missing (from Armor Sets page analysis)
MISSING_SETS = [
    # Name variations to try on Fextralife
    ("Hunter X", "Hunter+X+Set"),
    ("Hunter S", "Hunter+S+Set"),
    ("Zinogre S", "Zinogre+S+Set"),
    ("Sinister Demon", "Sinister+Demon+Set"),
    ("Goss Harag X", "Goss+Harag+X+Set"),
    ("Goss Harag S", "Goss+Harag+S+Set"),
    ("Goss Harag", "Goss+Harag+Set"),
    ("Death Stench", "Death+Stench+Set"),
    ("Death Stench S", "Death+Stench+S+Set"),
    ("Death Stench X", "Death+Stench+X+Set"),
    ("Utsushi True Visible", "Utsushi+True+(Visible)+Set"),
    ("Utsushi True Hidden", "Utsushi+True+(Hidden)+Set"),
    ("Utsushi S Visible", "Utsushi+S+Set+(Visible)"),
    ("Utsushi S Hidden", "Utsushi+S+Set+(Hidden)"),
    ("Utsushi Visible", "Utsushi+Set+(Visible)"),
    ("Utsushi Hidden", "Utsushi+Set+(Hidden)"),
    ("Risen Mizuha", "Risen+Mizuha+Set"),
    ("Risen Kushala", "Risen+Kushala+Set"),
    ("Risen Kaiser", "Risen+Kaiser+Set"),
    ("Silver Sol", "Silver+Sol+Set"),
    ("Silver Sol S", "Silver+Sol+S+Set"),
    ("Silver Sol X", "Silver+Sol+X+Set"),
    ("Ibushi Pure", "Ibushi+-+Pure+Set"),
    ("Ibushi Pure S", "Ibushi+S+Set"),  # Ibushi S Set
    ("Ibushi Pure X", "Ibushi+X+Set"),  # doesn't exist probably
    ("Narwa Pure", "Narwa+-+Pure+Set"),
    ("Narwa Pure S", "Narwa+S+Set"),
    ("Narwa Pure X", "Narwa+X+Set"),
    ("Grand God's Peer", "Grand+God's+Peer+Set"),
    ("Grand Mizuha", "Grand+Mizuha+Set"),
    ("Grand Chaos", "Grand+Chaos+Set"),
    ("Grand Divine Ire", "Grand+Divine+Ire+Set"),
    ("Scholar", "Scholar+Set"),
    ("Base Commander", "Base+Commander+Set"),
    ("Guild Bard", "Guild+Bard+Set"),
    ("Guild Palace", "Guild+Palace+Set"),
    ("Heavy Knight", "Heavy+Knight+Set"),
    ("Knight Squire", "Knight+Squire+Set"),
    ("Five Element", "Five+Element+Set"),
    ("Yukumo Sky", "Yukumo+Sky+Set"),
    ("Brigade X", "Brigade+X+Set"),
    ("Skalda S", "Skalda+S+Set"),
    ("Spio", "Spio+Set"),
    ("Spio S", "Spio+S+Set"),
    ("Kulu-Ya-Ku S", "Kulu+S+Set"),
    ("Kulu-Ya-Ku", "Kulu+Set"),
    ("Anjanath S", "Anja+S+Set"),
    ("Anjanath", "Anja+Set"),
    ("Bazelgeuse", "Bazel+Set"),  # Bazel Set
    ("Kaiser", "Kaiser+Set"),
    ("Kushala", "Kushala+Set"),
    ("Damascus", "Damascus+Set"),
    ("Jyuratodus", "Jyura+Set"),
    ("Gargwa X", "Gargwa+X+Set"),
    ("Gargwa S", "Gargwa+S+Set"),
    ("Gargwa", "Gargwa+Set"),
    ("Jaggi X", "Jaggi+X+Set"),
    ("Jaggi Mask X", "Jaggi+Mask+X+Set"),
    ("Jaggi S", "Jaggi+S+Set"),
    ("Jaggi Mask S", "Jaggi+Mask+S+Set"),
    ("Jaggi Mask", "Jaggi+Mask+Set"),
    ("Jaggi", "Jaggi+Set"),
    ("Slagtoth X", "Slagtoth+X+Set"),
    ("Slagtoth S", "Slagtoth+S+Set"),
    ("Slagtoth", "Slagtoth+Set"),
    ("Bullfango Mask X", "Bullfango+Mask+X+Set"),
    ("Bullfango Mask S", "Bullfango+Mask+S+Set"),
    ("Bullfango Mask", "Bullfango+Mask+Set"),
    ("Chrome Metal X", "Chrome+Metal+Set+X"),
    ("Chrome Metal", "Chrome+Metal+Set"),
    ("Pukei S", "Pukei+S+Set"),
    ("Pukei", "Pukei+Set"),
    ("Rakna-Kadaki", "Rakna-Kadaki+Set"),
    ("Golden Lune S", "Golden+S+Set"),
    ("Golden Lune X", "Golden+Lune+Set"),  # or Golden Lune Set
]

def setup_driver():
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--window-size=1920,1080")
    chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    return driver

def get_image_url_from_page(driver, url):
    """Navigate to page and extract the main set image URL"""
    try:
        driver.get(url)
        time.sleep(1.5)  # Wait for JS to load
        
        # Find images that look like set renders
        images = driver.find_elements(By.TAG_NAME, "img")
        for img in images:
            src = img.get_attribute("src")
            alt = img.get_attribute("alt") or ""
            if src and "file/Monster-Hunter-Rise" in src and ("set" in src.lower() or "male" in src.lower()):
                # Skip small icons/thumbnails
                try:
                    w = img.size['width']
                    h = img.size['height']
                    if w > 100 and h > 100:  # Likely the full render
                        return src
                except:
                    if "wiki-guide" in src:
                        return src
    except Exception as e:
        print(f"  Error on {url}: {e}")
    return None

def download_image(url, dest_path):
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        resp = requests.get(url, headers=headers, timeout=20, stream=True)
        if resp.status_code == 200 and 'image' in resp.headers.get('Content-Type', ''):
            with open(dest_path, 'wb') as f:
                for chunk in resp.iter_content(8192):
                    f.write(chunk)
            return True
    except Exception as e:
        print(f"  Download error: {e}")
    return False

def slugify(name):
    return name.lower().replace(" ", "-").replace("'", "").replace("+", "").replace("(", "").replace(")", "")

def main():
    existing = {f.name for f in OUTPUT_DIR.glob("*.png")}
    print(f"Existing files: {len(existing)}")
    
    driver = setup_driver()
    downloaded = 0
    
    try:
        for our_name, fex_name in MISSING_SETS:
            filename = f"{slugify(our_name)}.png"
            if filename in existing:
                print(f"SKIP: {our_name} (already have {filename})")
                continue
            
            url = f"https://monsterhunterrise.wiki.fextralife.com/{fex_name}"
            print(f"\nChecking: {our_name}")
            print(f"  URL: {url}")
            
            img_url = get_image_url_from_page(driver, url)
            if img_url:
                print(f"  Found image: {img_url}")
                dest = OUTPUT_DIR / filename
                if download_image(img_url, dest):
                    print(f"  DOWNLOADED: {filename}")
                    downloaded += 1
                    existing.add(filename)
                else:
                    print(f"  FAILED to download")
            else:
                print(f"  NO IMAGE FOUND on page")
            
            time.sleep(0.5)
    
    finally:
        driver.quit()
    
    print(f"\n=== DONE ===")
    print(f"Newly downloaded: {downloaded}")
    print(f"Total files now: {len(list(OUTPUT_DIR.glob('*.png')))}")

if __name__ == "__main__":
    main()