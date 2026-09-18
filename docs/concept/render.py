import sys
from playwright.sync_api import sync_playwright
ids = sys.argv[1:] or ["f1","f2","f3","f4","f5","f6","f7a","f7b"]
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={"width": 1700, "height": 1000})
    errs = []; pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.goto("http://localhost:5188/board.html", wait_until="networkidle"); pg.evaluate("document.fonts.ready"); pg.wait_for_timeout(1500)
    for f in ids: pg.locator("#"+f).screenshot(path=f"frames/{f}.png")
    print("errors:", errs[:5]); b.close()
