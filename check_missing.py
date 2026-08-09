#!/usr/bin/env python3
"""Compare implied sets from app vs downloaded files"""

# All implied sets from the app (227 unique)
implied_sets = [
    "Leather X", "Chainmail X", "Hunter's X", "Alloy X", "Bone X", "Rhenoplos X",
    "Bnahabra X", "Hornetaur", "Vespoid", "Velociprey", "Izuchi X", "Baggi X",
    "Kulu-Ya-Ku X", "Wroggi X", "Arzuros X", "Lagombi X", "Volvidon X", "Aknosom X",
    "Ludroth X", "Barroth X", "Hermitaur", "Ingot X", "Skalda X", "Spio X",
    "S. Studded X", "Five Element", "Squire's", "Yukumo Sky", "Khezu X", "Bishaten X",
    "Orangaten", "Jyuratodus X", "Basarios X", "Somnacanth X", "Auroracanth",
    "Rathian X", "Anjanath X", "Dober X", "Vaik X", "Makluva X", "Aelucanth X",
    "Rhopessa X", "Artillery Corps", "Guild Bard", "Scholar's", "Guardian", "Brigade X",
    "Barioth X", "Sinister Demon", "Nargacuga X", "Goss Harag X", "Golm", "Ceanataur",
    "Almudron X", "Rakna X", "Magmadron", "Pyre-Kadaki", "Utsushi True", "Remobra X",
    "Mizutsune X", "Rathalos X", "Zinogre X", "Tigrex X", "Diablos X", "Gore",
    "Regios", "Astalos", "Lunagaron", "Espinas", "Hoplite's", "Dignified", "Barbania",
    "Snowshear", "Grand God's Peer", "Bazelgeuse X", "Damascus X", "Kushala X",
    "Kaiser X", "Arc", "Storge", "Malzeno", "Professor's", "Charité", "Scholarly",
    "Commission", "Jelly X", "Sailor", "Guild Palace", "Archfiend Armor",
    "Ibushi's Pure", "Narwa's Pure", "Valstrax", "Sinister Grudge", "Outpost HQ",
    "Pride", "Golden", "Silver", "Lambent", "Onmyo", "Flaming Espinas",
    "Risen Mizuha", "Chaotic", "Nephilim", "Risen Kushala", "Risen Kaiser",
    "Rimeguard", "Tempest", "Virtue", "Prudence", "Primordial",
    "Leather S", "Chainmail S", "Hunter's S", "Alloy S", "Ingot S", "Skalda S",
    "Spio S", "Aknosom S", "Tetranadon S", "Izuchi S", "Rhenoplos S", "Bnahabra S",
    "Wroggi S", "Baggi S", "Arzuros S", "Volvidon S", "Ludroth S", "Barroth S",
    "Khezu S", "Kulu-Ya-Ku S", "Lagombi S", "Bone S", "Dober", "Makluva S",
    "Vaik S", "Channeler's S", "Medium's S", "S. Studded S", "Bishaten S",
    "Somnacanth S", "Remobra S", "Barioth S", "Rathian S", "Basarios S",
    "Jyuratodus", "Aelucanth S", "Rhopessa S", "Jelly S", "Rakna", "Goss Harag S",
    "Almudron S", "Nargacuga S", "Rathalos S", "Tigrex S", "Diablos S", "Zinogre S",
    "Anjanath S", "Sinister S", "Mizutsune S", "Brigade S", "Damascus", "Ibushi's",
    "Narwa's", "Kushala", "Kaiser", "Bazelgeuse", "Leather", "Chainmail", "Hunter's",
    "Izuchi", "Baggi", "Arzuros", "Lagombi", "Alloy", "Ingot", "Melahoa",
    "Death Stench", "Mosgharl", "Vaik", "Edel", "Skalda", "Spio", "S. Studded",
    "Bishaten", "Aknosom", "Tetranadon", "Somnacanth", "Rhenoplos", "Bnahabra",
    "Remobra", "Wroggi", "Volvidon", "Ludroth", "Barroth", "Khezu", "Barioth",
    "Rathian", "Basarios", "Kulu-Ya-Ku", "Bone", "Makluva", "Aelucanth", "Rhopessa",
    "Utsushi", "Channeler's", "Medium's", "Jelly", "Goss Harag", "Almudron",
    "Nargacuga", "Rathalos", "Tigrex", "Diablos", "Zinogre", "Anjanath", "Sinister",
    "Mizutsune", "Brigade"
]

def slugify(name):
    return name.lower().replace(" ", "-").replace("'", "").replace("+", "").replace(".", "")

# Downloaded files (from actual folder)
with open('downloaded.txt', 'r') as f:
    downloaded = set(f.read().strip().split('\n'))

print(f"Total implied sets: {len(implied_sets)}")
print(f"Total downloaded files: {len(downloaded)}")

# Check each implied set
missing = []
for s in implied_sets:
    base = slugify(s)
    variants = [base, f"{base}-s", f"{base}-x"]
    has_any = any(v in downloaded for v in variants)
    if not has_any:
        missing.append(s)

print(f"\n=== MISSING ({len(missing)}) ===")
for s in missing:
    print(f"  {s}")

# Also check extra files not in implied list
extra = []
for d in downloaded:
    # Check if it corresponds to any implied set
    found = False
    for s in implied_sets:
        base = slugify(s)
        if d in [base, f"{base}-s", f"{base}-x"]:
            found = True
            break
    if not found:
        extra.append(d)

print(f"\n=== EXTRA FILES (not in implied list) ({len(extra)}) ===")
for e in extra:
    print(f"  {e}")