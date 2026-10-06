"""Measure analog noise inside the tube. Usage: python3 scripts/noise.py [label]"""
import io, json, re, sys, time, pathlib
import numpy as np
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
LABEL = sys.argv[1] if len(sys.argv) > 1 else "baseline"
URL = "http://localhost:5188/"


def lum(png):
    a = np.asarray(Image.open(io.BytesIO(png)).convert("RGB"), dtype=np.float32)
    return 0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]


def metrics(frames):
    L = [lum(f) for f in frames]
    temporal = float(np.mean([np.abs(L[i + 1] - L[i]).mean() for i in range(len(L) - 1)]))

    def lap(x):
        return np.abs(-4 * x[1:-1, 1:-1] + x[:-2, 1:-1] + x[2:, 1:-1] + x[1:-1, :-2] + x[1:-1, 2:]).mean()
    spatial = float(np.mean([lap(x) for x in L]))
    scan = float(np.mean([np.abs(x[1:] - x[:-1]).mean() for x in L]))
    bright = float(np.mean([x.mean() for x in L]))
    return {"temporal": round(temporal, 2), "spatial": round(spatial, 2),
            "scanline": round(scan, 2), "brightness": round(bright, 2)}


def burst(page, n=6, gap=0.12):
    out = []
    for _ in range(n):
        out.append(page.screenshot(type="png"))
        time.sleep(gap)
    return out


def css_knobs():
    css = (ROOT / "src/styles/tube.css").read_text()

    def op(sel):
        m = re.search(re.escape(sel) + r"\s*\{[^}]*?opacity:\s*([\d.]+)", css)
        return float(m.group(1)) if m else None
    glass = re.search(r"\.tube__glass\s*\{[^}]*?repeating-linear-gradient\([^)]*?rgba\([^)]*?,\s*([\d.]+)\)", css)
    return {".static.on": op(".static.on"), ".tracking": op(".tracking"),
            ".tracking--2": op(".tracking--2"),
            ".tube__glass repeating-linear-gradient alpha": float(glass.group(1)) if glass else None}


def main():
    res = {"label": LABEL, "states": {}, "css": css_knobs(), "popups_20s": None}
    with sync_playwright() as p:
        b = p.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"])
        page = b.new_page(viewport={"width": 1600, "height": 900})
        page.goto(URL)
        page.click("#power")
        page.wait_for_timeout(5500); page.keyboard.press("1"); page.wait_for_timeout(5200)  # a tape in: the idle state is a category page
        # keep the compositor producing frames so screenshots are never stale
        page.evaluate("(function f(){requestAnimationFrame(f)})()")

        def run(name, fn):
            try:
                res["states"][name] = metrics(fn())
            except Exception as e:
                print(f"[{name}] FAILED: {e}")

        run("idle", lambda: burst(page))

        def chan():
            page.keyboard.press("2")
            return burst(page)
        run("channel-change", chan)

        def menu():
            page.wait_for_timeout(1500)
            page.keyboard.press("m")
            page.wait_for_timeout(400)
            return burst(page)
        run("menu-open", menu)
        try:
            page.keyboard.press("Escape")
            page.wait_for_timeout(500)
        except Exception:
            pass

        try:
            page.evaluate("document.querySelectorAll('.spam__msg').forEach(e=>e.dataset.seen='1')")
            seen = 0
            t0 = time.time()
            while time.time() - t0 < 20:
                seen += page.evaluate("""()=>{let n=0;document.querySelectorAll('.spam__msg:not([data-seen])').forEach(e=>{e.dataset.seen='1';n++});return n}""")
                page.wait_for_timeout(500)
            res["popups_20s"] = seen
        except Exception as e:
            print(f"[popups] FAILED: {e}")
        b.close()

    cols = ["temporal", "spatial", "scanline", "brightness"]
    lines = [f"{'state':<16}" + "".join(f"{c:>12}" for c in cols)]
    for s, m in res["states"].items():
        lines.append(f"{s:<16}" + "".join(f"{m[c]:>12}" for c in cols))
    lines.append(f"popups/20s: {res['popups_20s']}")
    lines.append("css: " + ", ".join(f"{k}={v}" for k, v in res["css"].items()))
    table = "\n".join(lines)
    print(table)
    res["table"] = table
    (ROOT / "shots").mkdir(exist_ok=True)
    (ROOT / f"shots/noise-{LABEL}.json").write_text(json.dumps(res, indent=2))


main()
