"""Drive CVZ-TV through the whole journey in headless Chromium and drop
screenshots + a recording in shots/. Usage: python3 scripts/drive.py [mobile]"""
import sys, os, glob, subprocess
from playwright.sync_api import sync_playwright

mobile = "mobile" in sys.argv
W, H = (390, 844) if mobile else (1600, 900)
tag = "m_" if mobile else ""
os.makedirs("shots", exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"])
    ctx = b.new_context(viewport={"width": W, "height": H}, device_scale_factor=1, record_video_dir="shots/vid", record_video_size={"width": W, "height": H}, is_mobile=mobile, has_touch=mobile)
    pg = ctx.new_page(); errs = []
    pg.on("console", lambda m: errs.append(m.text[:160]) if m.type == "error" else None); pg.on("pageerror", lambda e: errs.append("PAGEERROR " + str(e)[:200]))
    pg.goto("http://localhost:5188/", wait_until="networkidle"); pg.evaluate("document.fonts.ready"); pg.wait_for_timeout(800)
    pg.screenshot(path=f"shots/{tag}1_set.png")
    pg.click("#power"); pg.wait_for_timeout(700); pg.screenshot(path=f"shots/{tag}2_warm.png")
    pg.wait_for_timeout(1600); pg.screenshot(path=f"shots/{tag}3_tapes.png")
    fps = pg.evaluate("() => new Promise(r => { let n = 0; const s = performance.now(); (function f(){ n++; if (performance.now() - s < 2000) requestAnimationFrame(f); else r(n / 2); })(); })")
    pg.keyboard.press("ArrowRight"); pg.wait_for_timeout(400); pg.screenshot(path=f"shots/{tag}4_tapes_hi.png")
    pg.keyboard.press("Enter"); pg.wait_for_timeout(350); pg.screenshot(path=f"shots/{tag}5_insert.png")
    pg.wait_for_timeout(1100); pg.screenshot(path=f"shots/{tag}6_glass_play.png")
    pg.wait_for_timeout(1400); pg.screenshot(path=f"shots/{tag}7_push.png")
    pg.wait_for_timeout(2600); pg.screenshot(path=f"shots/{tag}8_tape_merch.png")
    hit = None
    for o in pg.query_selector_all(".obj:not(.obj--fragment)")[:12]:
        bb = o.bounding_box()
        if bb and 0 < bb["x"] < W - 120 and 0 < bb["y"] < H - 120:
            pg.mouse.move(bb["x"] + bb["width"] / 2, bb["y"] + bb["height"] / 2); pg.wait_for_timeout(900); pg.screenshot(path=f"shots/{tag}9_hover.png")
            pg.mouse.click(bb["x"] + bb["width"] / 2, bb["y"] + bb["height"] / 2); hit = True; break
    pg.wait_for_timeout(1500); pg.screenshot(path=f"shots/{tag}10_lock.png")
    pg.keyboard.press("ArrowRight"); pg.wait_for_timeout(1200); pg.screenshot(path=f"shots/{tag}11_next.png")
    pg.keyboard.press("Escape"); pg.wait_for_timeout(600)
    pg.keyboard.press("m"); pg.wait_for_timeout(700); pg.screenshot(path=f"shots/{tag}12_index.png"); pg.keyboard.press("Escape"); pg.wait_for_timeout(300)
    pg.keyboard.press("e"); pg.wait_for_timeout(900); pg.screenshot(path=f"shots/{tag}13_pullout.png")
    pg.wait_for_timeout(1800); pg.screenshot(path=f"shots/{tag}14_room_again.png")
    pg.keyboard.press("5"); pg.wait_for_timeout(5200); pg.screenshot(path=f"shots/{tag}15_tape_music.png")
    pg.keyboard.press("m"); pg.wait_for_timeout(500)
    if not pg.is_visible(".tree__tape.in li[data-id=synthetic-luv]"): pg.click(".tree__tape.in .tree__folder[data-f=\"0\"] .tree__row"); pg.wait_for_timeout(200)
    pg.click(".tree__tape.in li[data-id=synthetic-luv]"); pg.wait_for_timeout(1500); pg.screenshot(path=f"shots/{tag}16_youtube.png")
    pg.keyboard.press("Escape"); pg.wait_for_timeout(400); pg.keyboard.press("4"); pg.wait_for_timeout(2600); pg.screenshot(path=f"shots/{tag}17_tape_bio.png")
    pg.keyboard.press("m"); pg.wait_for_timeout(500)
    if not pg.is_visible(".tree__tape.in li[data-page=contact]"): pg.click(".tree__tape.in .tree__folder[data-page=contact] .tree__row"); pg.wait_for_timeout(200)
    pg.click(".tree__tape.in li[data-page=contact]"); pg.wait_for_timeout(800); pg.screenshot(path=f"shots/{tag}18_contact.png")
    pg.wait_for_timeout(500)
    mem = pg.evaluate("performance.memory ? Math.round(performance.memory.usedJSHeapSize/1048576) : -1")
    print(f"fps {fps:.0f} | hit {hit} | jsheap {mem} MB | errors {errs[:6]}")
    ctx.close(); b.close()
for v in glob.glob("shots/vid/*.webm"):
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", v, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "24", "-movflags", "+faststart", f"shots/{tag}journey.mp4"]); os.remove(v)
