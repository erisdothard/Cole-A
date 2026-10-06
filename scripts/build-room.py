"""Build the room the TV sits in: a dark 1990s den — wood-paneled wall,
carpet, a walnut stand top — generated procedurally, no image API needed.

    python3 scripts/build-room.py

Writes public/room/wall.webp (desktop), wall-p.webp (phones) and
surface.webp (a horizontally seamless strip of stand top + front edge).
Everything is graded very dark on purpose: the TV is the subject."""
import os
import numpy as np
from PIL import Image, ImageFilter

rng = np.random.default_rng(1994)
OUT = "public/room"
os.makedirs(OUT, exist_ok=True)


def fbm(h, w, scale, octaves=4):
    """Smooth value noise, summed over octaves (0..1)."""
    out = np.zeros((h, w))
    amp, tot = 1.0, 0.0
    for o in range(octaves):
        sh, sw = max(2, int(h / scale * 2 ** o)), max(2, int(w / scale * 2 ** o))
        n = Image.fromarray((rng.random((sh, sw)) * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)
        out += amp * np.asarray(n, dtype=float) / 255
        tot += amp; amp *= 0.5
    return out / tot


def grain(h, w, stretch=40, rings=26, seed_shift=0.0):
    """Wood grain: long vertical streaks warped by noise, with ring bands."""
    warp = fbm(h, w, scale=w / 3, octaves=3)
    y = np.linspace(0, 1, h)[:, None]
    x = np.linspace(0, 1, w)[None, :]
    bands = np.sin((x * rings + warp * 3.2 + seed_shift) * np.pi * 2 + y * 0.6)
    streak = fbm(h, w, scale=max(4, w / stretch), octaves=2)
    return np.clip(0.55 + 0.25 * bands + 0.35 * (streak - 0.5), 0, 1)


def paneling(h, w, board_px):
    """Vertical tongue-and-groove boards, each with its own grain and tone."""
    img = np.zeros((h, w, 3))
    x0 = 0
    walnut = np.array([62, 40, 26]) / 255
    while x0 < w:
        bw = int(board_px * rng.uniform(0.7, 1.3))
        x1 = min(w, x0 + bw)
        g = grain(h, x1 - x0, seed_shift=rng.random() * 10)
        tone = walnut * rng.uniform(0.75, 1.15)
        img[:, x0:x1] = tone[None, None, :] * (0.55 + 0.75 * g[..., None])
        # the groove between boards: a dark V with a faint lit edge
        img[:, x0:x0 + 3] *= 0.25
        if x0 + 3 < w: img[:, x0 + 3:x0 + 4] *= 1.25
        x0 = x1
    return img


def carpet(h, w):
    c = np.array([46, 34, 28]) / 255
    n = fbm(h, w, scale=6, octaves=2)
    return c[None, None, :] * (0.7 + 0.6 * n[..., None])


def wall(w, h, board_px, carpet_frac=0.12):
    img = paneling(h, w, board_px)
    ch = int(h * carpet_frac)
    img[h - ch:] = carpet(ch, w)
    # baseboard
    bb = max(6, int(h * 0.018))
    img[h - ch - bb:h - ch] = np.array([30, 20, 14]) / 255
    img[h - ch - bb:h - ch - bb + 2] *= 1.8
    # light: very dark overall, a warm lamp falling off from the far left, darker at the top
    y = np.linspace(0, 1, h)[:, None]; x = np.linspace(0, 1, w)[None, :]
    lamp = np.exp(-((x + 0.05) ** 2) / 0.09) * np.exp(-((y - 0.55) ** 2) / 0.35)
    fall = 0.18 + 0.55 * lamp + 0.12 * y
    vign = 1 - 0.55 * (((x - 0.5) * 1.4) ** 2 + ((y - 0.5) * 1.2) ** 2)
    img = img * (fall * np.clip(vign, 0.15, 1))[..., None]
    img[..., 0] *= 1.06; img[..., 2] *= 0.88  # tungsten warmth
    noise = rng.normal(0, 0.012, img.shape)  # film grain
    img = np.clip(img + noise, 0, 1)
    out = Image.fromarray((img * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))
    return out, (h - ch) / h


def surface(w=1600, h=200):
    top_h = int(h * 0.7)
    # grain on a table top runs left-right: long thin streaks (narrow noise stretched wide) plus fine fibre
    streaks = np.asarray(Image.fromarray((rng.random((top_h, 48)) * 255).astype(np.uint8)).resize((w, top_h), Image.BICUBIC), dtype=float) / 255
    fibre = np.asarray(Image.fromarray((rng.random((top_h, w // 3)) * 255).astype(np.uint8)).resize((w, top_h), Image.BILINEAR), dtype=float) / 255
    g = np.clip(0.5 + 0.55 * (streaks - 0.5) + 0.18 * (fibre - 0.5), 0, 1)
    walnut = np.array([70, 45, 28]) / 255
    top = walnut[None, None, :] * (0.55 + 0.7 * g[..., None])
    depth = np.linspace(0.55, 1.0, top_h)[:, None, None]  # the far edge of the top is darker
    top *= depth
    edge = np.ones((h - top_h, w, 3)) * (walnut * 0.55)[None, None, :]
    edge[:3] = walnut * 1.6  # the lit front lip
    edge *= np.linspace(1, 0.45, h - top_h)[:, None, None]
    img = np.concatenate([top, edge], axis=0)
    # make it tile: cross-fade the last 160px into the first
    k = 160; t = np.linspace(0, 1, k)[None, :, None]
    img[:, :k] = img[:, :k] * t + img[:, -k:] * (1 - t)
    img = img[:, :-k]
    img = np.clip(img + rng.normal(0, 0.01, img.shape), 0, 1)
    return Image.fromarray((img * 255).astype(np.uint8))


if __name__ == "__main__":
    for name, (w, h, board) in {"wall": (1920, 1080, 150), "wall-p": (1080, 1920, 120)}.items():
        im, carpet_line = wall(w, h, board)
        im.save(f"{OUT}/{name}.webp", quality=80)
        lum = np.asarray(im.convert("L"), dtype=float).mean() / 255
        print(f"{name}: {w}x{h}, mean luminance {lum:.1%}, carpet line {carpet_line:.1%}")
    s = surface()
    s.save(f"{OUT}/surface.webp", quality=82)
    print(f"surface: {s.width}x{s.height}, mean luminance {np.asarray(s.convert('L'), dtype=float).mean() / 255:.1%}")
