import json
import re
import unicodedata
from difflib import SequenceMatcher
from pathlib import Path
from urllib.request import Request, urlopen

DATA = Path(__file__).parent
URL = "https://monsterhunter.fandom.com/api.php?action=parse&page=MHFU%3A_Item_List&prop=wikitext&format=json"


def norm(value):
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode().lower()
    value = re.sub(r"[^a-z0-9]+", "", value)
    aliases = {"grt": "great", "sm": "small", "hvnly": "heavenly", "tckt": "ticket", "thnk": "thank", "spec": "special", "flyn": "felyne", "close": "close"}
    for old, new in aliases.items():
        value = value.replace(old, new)
    return value


def clean_text(value):
    value = re.sub(r"\[\[[^\]|]+\|([^\]]+)\]\]", r"\1", value)
    value = re.sub(r"\[\[([^\]]+)\]\]", r"\1", value)
    value = re.sub(r"<[^>]+>", "", value)
    value = re.sub(r"\s+", " ", value).strip(" .")
    return value


def spanish(value):
    replacements = [
        ("Low Rank", "Rango bajo"), ("High Rank", "Rango alto"), ("G-Rank", "Rango G"),
        ("Gathering Spot", "Puntos de recolección"), ("Mining Spots", "Puntos de minería"),
        ("Mining outcrop", "Yacimiento minero"), ("Pokke Farm", "Granja Pokke"),
        ("Pokke Point Merchant", "Comerciante de Puntos Pokke"), ("Town Merchant", "Mercader del pueblo"),
        ("Hunter's Shoppe", "Tienda del cazador"), ("Peddling Granny", "Abuela ambulante"),
        ("Quest Reward", "Recompensa de misión"), ("Reward", "Recompensa"),
        ("Shiny Drop", "Brillante al caer"), ("Carved from", "Se obtiene tallando"),
        ("Carve", "Talla"), ("Capture Reward", "Recompensa de captura"),
        ("Combine", "Combina"), ("Buy from", "Compra en"), (" and ", " y "),
        (" or ", " o "), ("most Areas", "la mayoría de zonas"), ("district", "zona"),
        (" and pokke farm", " y la Granja Pokke"), ("Volcano", "Volcán"),
        ("SnwyMntains", "Montañas Nevadas"), ("pokke farm", "Granja Pokke"),
        ("Snowy Mountains", "Montañas Nevadas"), ("Forest & Hills", "Bosque y Colinas"),
        ("Forest&Hills", "Bosque y Colinas"), ("Jungle", "Jungla"), ("Swamp", "Pantano"),
        ("Desert", "Desierto"), ("Old Desert", "Desierto antiguo"),
    ]
    out = value
    for source, target in replacements:
        out = out.replace(source, target)
    out = out.replace("Montañas Nevadas zona", "zona de Montañas Nevadas")
    out = out.replace("Rango bajo Volcán", "Volcán (rango bajo)")
    out = out.replace("Rango bajo Pantano", "Pantano (rango bajo)")
    return out[:220]


def used_materials():
    files = ["armor_pieces.json", "weapons.json", "decorations.json"]
    used = set()
    for filename in files:
        rows = json.loads((DATA / filename).read_text(encoding="utf-8"))
        for row in rows:
            used.update(m["material"] for m in row.get("materials", []))
    monsters = json.loads((DATA / "monsters.json").read_text(encoding="utf-8"))
    drops = {m.get("material") for monster in monsters for rank in monster.get("materials", {}).values() for m in rank}
    return sorted(used - drops)


def main():
    request = Request(URL, headers={"User-Agent": "MonHunDB material research"})
    text = json.loads(urlopen(request, timeout=30).read().decode("utf-8"))["parse"]["wikitext"]["*"]
    rows = {}
    for block in text.split("{{MH4U Item List")[1:]:
        name_match = re.search(r"\|EN Name\s*=\s*([^\n|]+)", block)
        how_match = re.search(r"\|How To Get\s*=\s*([^\n|]*)", block)
        if not name_match or not how_match:
            continue
        how = clean_text(how_match.group(1))
        if how and how not in ("}}", "{") and "MH4U Item List" not in how and not how.startswith("{{"):
            rows[name_match.group(1).strip()] = how
    by_norm = {norm(name): how for name, how in rows.items()}
    notes = {}
    manual = {
        "Amezari Carapace": ("Only from the downloadable Amezari Carnival! event of MHP2G; not normally obtainable in western MHFU.", "Solo aparece en el evento descargable Amezari Carnival! de MHP2G; no se obtiene normalmente en MHFU occidental."),
        "Amezari Shell": ("Only from the downloadable Amezari Carnival! event of MHP2G; not normally obtainable in western MHFU.", "Solo aparece en el evento descargable Amezari Carnival! de MHP2G; no se obtiene normalmente en MHFU occidental."),
        "Dengeki G Ticket": ("Reward from the Dengeki G event quests (Japanese DLC).", "Recompensa de las misiones de evento Dengeki G (DLC japonés)."),
        "Dengeki Maoh Tkt": ("Reward from the Dengeki Maoh event quest (Japanese DLC).", "Recompensa de la misión de evento Dengeki Maoh (DLC japonés)."),
        "Dengeki Ticket": ("Reward from Dengeki event quests (Japanese DLC).", "Recompensa de misiones de evento Dengeki (DLC japonés)."),
        "Famitsu Invoice": ("Reward from Famitsu event quests (Japanese DLC).", "Recompensa de misiones de evento Famitsu (DLC japonés)."),
        "Famitsu PT Tckt": ("Reward from Famitsu event quests (Japanese DLC).", "Recompensa de misiones de evento Famitsu (DLC japonés)."),
        "Famitsu Ticket": ("Reward from Famitsu event quests (Japanese DLC).", "Recompensa de misiones de evento Famitsu (DLC japonés)."),
        "FamitsuCustomTkt": ("Reward from the corresponding Famitsu custom event quest (Japanese DLC).", "Recompensa de la misión de evento Famitsu correspondiente (DLC japonés)."),
        "Magazine Ticket": ("Reward from Magazine event quests (Japanese DLC).", "Recompensa de misiones de evento Magazine (DLC japonés)."),
        "Mystery Bone": ("Gather from bone piles in all areas, or receive it as a reward from gathering quests.", "Recolecta en pilas de huesos de todas las zonas, o como recompensa de misiones de recolección."),
        "Pirate J Tckt G": ("Reward from Pirate J G event quests (Japanese DLC).", "Recompensa de misiones de evento Pirate J G (DLC japonés)."),
        "Pirate J Ticket": ("Reward from Pirate J event quests (Japanese DLC).", "Recompensa de misiones de evento Pirate J (DLC japonés)."),
        "Electro Sac": ("Carve or quest reward from Khezu.", "Se obtiene tallando o como recompensa de misión de Khezu."),
        "FlynMealPassReg": ("Random gift from the Felyne Kitchen Head Chef with 2+ Felynes on kitchen duty.", "Regalo aleatorio del Chef de la Cocina Felyne con 2 o más Felynes trabajando."),
        "FlynMealPassPlus": ("Random gift from the Felyne Kitchen Head Chef with 3+ Felynes, or after 10 meals prepared by 5 Felynes.", "Regalo aleatorio del Chef con 3 o más Felynes, o tras 10 comidas preparadas por 5 Felynes."),
        "GoldRathianThorn": ("Gold Rathian: rare tail carve or high-rank/G-rank quest reward.", "Rathian Dorada: carveo raro de cola o recompensa de misión de rango alto/G."),
        "Hard Ticket": ("Data import reward for Rare 4-5 equipment.", "Recompensa de importación de datos para equipo de rareza 4-5."),
        "Hero of Kkto Bio": ("Reward from the Pokke Elder after completing the required Monoblos deed.", "Recompensa del Anciano de Pokke tras completar el encargo requerido de Monoblos."),
        "Normal Ticket": ("Data import reward for Rare 1-3 equipment.", "Recompensa de importación de datos para equipo de rareza 1-3."),
        "Plus Class Tcket": ("Reward from the corresponding Plus-class event/transfer content.", "Recompensa del contenido de evento o transferencia correspondiente de clase Plus."),
        "Barrel Lid": ("No normal acquisition is documented for western MHFU; treated as event/dummy content.", "No hay obtención normal documentada en MHFU occidental; se considera contenido de evento/dummy."),
        "Bomb Arrowana": ("Fish at fishing spots in the maps where Arrowana appear.", "Pesca en puntos de pesca de los mapas donde aparece Arrowana."),
        "Burst Arrowana": ("Fish at fishing spots in the maps where Burst Arrowana appear.", "Pesca en puntos de pesca de los mapas donde aparece Burst Arrowana."),
        "Dark Piece": ("Trade Elder Dragon Bones to the old man in the Pokke Farm cave.", "Entrega Huesos de Dragón Anciano al anciano de la cueva de la Granja Pokke."),
        "Dark Stone": ("Trade Elder Dragon Bones to the old man in the Pokke Farm cave.", "Entrega Huesos de Dragón Anciano al anciano de la cueva de la Granja Pokke."),
        "Fatalis DevilEye": ("Fatalis: break the head and claim the corresponding quest reward.", "Fatalis: rompe la cabeza y recoge la recompensa de misión correspondiente."),
        "Godbug": ("Gather with a bug net in insect spots; also available from the Pokke Farm insect thicket.", "Recolecta con red en puntos de insectos; también aparece en la zona de insectos de la Granja Pokke."),
        "Hornetaur Head": ("Poison Hornetaurs so they remain carveable; also obtainable from Jungle Trenya at 500 points.", "Envenena a los Hornetaur para poder tallarlos; también con Trenya en Jungla por 500 puntos."),
        "HvnlyBlkGraviShl": ("Black Gravios: G-Rank body carve or quest reward.", "Gravios Negro: carveo del cuerpo o recompensa de misión de rango G."),
        "Lao-Shan Scale+": ("High-Rank/G-Rank Lao-Shan Lung body or tail carve and quest rewards.", "Lao-Shan Lung de rango alto/G: carveo de cuerpo o cola y recompensas de misión."),
        "Lao-Shan'sHvyShl": ("G-Rank Lao-Shan Lung: body carve or quest reward.", "Lao-Shan Lung de rango G: carveo del cuerpo o recompensa de misión."),
        "Lost Umbrella": ("Rare gathering item in Marshlands area 1; it can also appear as a quest reward.", "Objeto raro de recolección en el área 1 del Pantano; también puede salir como recompensa de misión."),
        "StoutBlkTwstdHrn": ("G-Rank Black Diablos: break both horns and claim the quest reward.", "Diablos Negro de rango G: rompe ambos cuernos y recoge la recompensa de misión."),
    }
    unresolved = []
    for material in used_materials():
        how = rows.get(material) or by_norm.get(norm(material))
        if not how:
            matches = sorted(((SequenceMatcher(None, norm(material), key).ratio(), value) for key, value in by_norm.items()), reverse=True)
            if matches and matches[0][0] >= 0.86:
                how = matches[0][1]
        if not how:
            unresolved.append(material)
            continue
        notes[material] = {"en": how, "es": spanish(how)}
    for material, values in manual.items():
        notes[material] = {"en": values[0], "es": values[1]}
    (DATA / "material_obtain_notes.json").write_text(json.dumps(notes, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    remaining = [material for material in used_materials() if material not in notes]
    print(f"notes={len(notes)} unresolved={len(remaining)}")
    print("\\n".join(remaining))


if __name__ == "__main__":
    main()
