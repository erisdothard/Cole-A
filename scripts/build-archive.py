"""Build src/content/archive.json from the Wix export manifest.

Titles are DRAFTS read off the artwork; Cole corrects them. Everything else
(files, sizes, channel assignment) is derived. Re-run after editing TITLES.

    python3 scripts/build-archive.py
"""
import json, os
from PIL import Image

D = "reference/wix-export"
m = json.load(open(f"{D}/manifest.json"))

# (title, kind, note) keyed by (section, order). kind: pull=artwork, blank=merch, tx=video
TITLES = {
    ("portfolio", 0): ("Some Shade of Pink", "Ken Sable — album art"), ("portfolio", 1): ("Dorsia Nº11", "Poster · July 4th · Charmers"),
    ("portfolio", 2): ("Dorsia — Peacock", "Ident"), ("portfolio", 3): ("N.D.S", "Nashville Dance Show · poster"),
    ("portfolio", 4): ("Live", "Stage still"), ("portfolio", 5): ("Deep Tropics Radio", "Lake Sessions · title card"),
    ("portfolio", 6): ("Ken Sable", "Car still"), ("portfolio", 7): ("Lowrider", "Still"),
    ("portfolio", 8): ("Love Songs", "Sleeve"), ("portfolio", 9): ("Zion Botanical", "Brand · motion"),
    ("portfolio", 10): ("KEN", "Alignment chart · motion"), ("portfolio", 11): ("Dorsia Nº2", "Dining · Dancing · marquee"),
    ("portfolio", 12): ("No Original Thought", "Artwork"), ("portfolio", 13): ("Dorsia — Easter", "Poster · Charmers"),
    ("portfolio", 14): ("Red", "Portrait"), ("portfolio", 15): ("Matchbook", "Motion"),
    ("portfolio", 16): ("Dorsia — 4th of July", "Poster · Charmers"), ("portfolio", 17): ("Blue Room", "Still · 17 5:22"),
    ("portfolio", 18): ("Back to Lonely Nights", "Tracklist · sleeve"), ("portfolio", 19): ("Nashville Dance Show", "Poster · Rosemary & Booty Queen"),
    ("portfolio", 20): ("Pink", "Motion"), ("portfolio", 21): ("Dorsia — crowd", "Still"),
    ("portfolio", 22): ("New Year's Eve 2026", "Rosemary & Booty Queen · motion"), ("portfolio", 23): ("Los Depressos", "Logo"),
    ("merch", 9): ("Hoodie", "Brown · front/back"), ("merch", 10): ("Religious Holidays", "Tee"), ("merch", 11): ("Dorsia 10", "Jersey"),
    ("merch", 12): ("Dorsia colourways", "Tee · jersey · hoodie"), ("merch", 13): ("Dodger Bootleg", "Tee"), ("merch", 14): ("Dorsia ringer", "Tee"),
    ("merch", 15): ("Dorsia socks", "Socks"), ("merch", 16): ("The 10th Muse", "Tee"), ("merch", 17): ("Crvck Apparel", "Tee"),
    ("merch", 18): ("Dorsia sun", "Tee"), ("merch", 19): ("Dorsia 11", "Jersey"),
}
# Videos whose source has no sound (measured with ffmpeg volumedetect: -91 dB throughout).
# The set keeps its static under these instead of ducking into dead air.
SILENT = {"05be8c_d2f6df4ea68544c7b74f68f2d3534b12", "05be8c_3aa739c64b534d9bbc86cac8671d1c85", "05be8c_8cc6c94d91d24e6aa8393b339809c589",
          "05be8c_50ace602c61d460bac01384e6c107a4c", "05be8c_b6daf8610b574c779d1f6d59554eccc2"}
# Video file revision. Bump this whenever the videos are re-encoded: /media/* is
# served with a one-year immutable cache, so a changed file MUST get a new name
# or every returning browser keeps the old one (this is how desktops kept the
# silent transcodes after the audio pass). Posters are unchanged and unversioned.
VIDEO_REV = "a"
def video_path(video_id): return f"/media/tx/{video_id}.{VIDEO_REV}.mp4"

# Pieces Cole sent after the Wix export. Original stays in reference/client/
# (not committed); the web copies are cut here. crop = (l, t, r, b) on the source.
EXTRAS = [
    {"id": "b-21", "kind": "blank", "title": "N.D.S Tee", "note": "Nashville Dance Show · front/back", "src": "reference/client/MOCKUP_NDS_SHIRT_1.png", "slug": "nds_shirt_1", "crop": (20, 520, 985, 1440), "back": (1000, 520, 1980, 1440), "before": "b-10"},
]
# Cole's own videos that live on YouTube (no master file yet). The still is the
# video's own thumbnail, saved under reference/client/.
LINKS = [
    {"id": "synthetic-luv", "kind": "tx", "title": "Synthetic Luv", "note": "Ken Sable feat. Becky Jonez · music video", "youtube": "mXuDxhtBxNY", "src": "reference/client/synthetic-luv.jpg", "slug": "synthetic-luv"},
]
def cut(x):
    src = Image.open(x["src"]).convert("RGB"); im = src.crop(x["crop"])
    for suffix, edge, q in (("w", 1400, 84), ("t", 480, 80)):
        c = im.copy(); c.thumbnail((edge, edge), Image.LANCZOS); c.save(f"public/media/web/{x['slug']}_{suffix}.jpg", quality=q, optimize=True, progressive=True)
    if "back" in x:  # a second side, shown beside the front when the piece is in focus
        b = src.crop(x["back"]); b.thumbnail((1400, 1400), Image.LANCZOS); b.save(f"public/media/web/{x['slug']}_back_w.jpg", quality=84, optimize=True, progressive=True)
    return im.size

items = []
for e in m:
    sec, order = e.get("section"), e.get("order", 0)
    if sec == "hero":
        items.append({"id": "cvz-ident", "kind": "tx", "channel": 1, "title": "CVZ", "note": "Station ident", "video": video_path(e['video_id']), "poster": f"/media/tx/{e['video_id']}.jpg", "w": 16, "h": 9}); continue
    base = e["image"].split("~")[0].split("f0")[0][:38]
    im = Image.open(f"{D}/images/{e['image']}"); w, h = im.size
    title, note = TITLES.get((sec, order), (f"Transmission {order+1:02d}", "Video"))
    kind = "tx" if e.get("video_id") else ("blank" if sec == "merch" else "pull")
    it = {"id": f"{'tx' if kind=='tx' else 'p' if kind=='pull' else 'b'}-{order+1:02d}" if sec != "video" else f"tx-{order+1:02d}",
          "kind": kind, "channel": {"pull": 2, "blank": 3, "tx": 4}[kind], "title": title, "note": note,
          "image": f"/media/web/{base}_w.jpg", "thumb": f"/media/web/{base}_t.jpg", "w": w, "h": h}
    if e.get("video_id"):
        it["video"] = video_path(e['video_id']); it["poster"] = f"/media/tx/{e['video_id']}.jpg"
        if e["video_id"] in SILENT: it["silent"] = True
    items.append(it)
for x in EXTRAS:
    w, h = cut(x)
    it = {"id": x["id"], "kind": x["kind"], "channel": {"pull": 2, "blank": 3, "tx": 4}[x["kind"]], "title": x["title"], "note": x["note"],
          "image": f"/media/web/{x['slug']}_w.jpg", "thumb": f"/media/web/{x['slug']}_t.jpg", "w": w, "h": h}
    if "back" in x: it["back"] = f"/media/web/{x['slug']}_back_w.jpg"
    at = next((i for i, o in enumerate(items) if o["id"] == x.get("before")), len(items))
    items.insert(at, it)
for x in LINKS:
    im = Image.open(x["src"]).convert("RGB"); w, h = im.size
    for suffix, edge, q in (("w", 1400, 84), ("t", 480, 80)):
        c = im.copy(); c.thumbnail((edge, edge), Image.LANCZOS); c.save(f"public/media/web/{x['slug']}_{suffix}.jpg", quality=q, optimize=True, progressive=True)
    items.append({"id": x["id"], "kind": "tx", "channel": 4, "title": x["title"], "note": x["note"], "youtube": x["youtube"],
                  "image": f"/media/web/{x['slug']}_w.jpg", "thumb": f"/media/web/{x['slug']}_t.jpg", "poster": f"/media/web/{x['slug']}_w.jpg", "w": w, "h": h})
# unique ids
seen = {}
for it in items:
    if it["id"] in seen: seen[it["id"]] += 1; it["id"] += f"-{seen[it['id']]}"
    else: seen[it["id"]] = 1
os.makedirs("src/content", exist_ok=True)
json.dump(items, open("src/content/archive.json", "w"), indent=1)
print(len(items), "items;", sum(1 for i in items if i["kind"]=="pull"), "pulls,", sum(1 for i in items if i["kind"]=="blank"), "blanks,", sum(1 for i in items if i["kind"]=="tx"), "tx")
