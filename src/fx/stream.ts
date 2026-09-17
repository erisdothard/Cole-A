/* ---------------------------------------------------------------
   The background of the system: columns of glyphs falling through
   the machine, plus a slow horizontal sweep of readable-ish data.
   Runs behind everything at low opacity.
   --------------------------------------------------------------- */

import { prefersReducedMotion } from './prefs'

const GLYPHS = 'ABCDEF0123456789/\\|<>[]{}=+*#%$@!?-_:;.'
const FONT_SIZE = 14
const COL_W = 12
const FPS = 18

export function mountStream(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d', { alpha: true })
  if (!ctx) return

  let cols: number[] = []
  let dpr = 1

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    canvas.width = Math.floor(window.innerWidth * dpr)
    canvas.height = Math.floor(window.innerHeight * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.font = `${FONT_SIZE}px ui-monospace, Menlo, Consolas, monospace`
    ctx.textBaseline = 'top'

    const count = Math.ceil(window.innerWidth / COL_W)
    cols = Array.from({ length: count }, () => Math.random() * -window.innerHeight)
  }

  resize()
  window.addEventListener('resize', resize)

  // Static is the whole point, but not at the cost of someone's battery
  // or their vestibular system.
  if (prefersReducedMotion()) {
    paintStill(ctx)
    return
  }

  let last = 0
  const step = (now: number) => {
    requestAnimationFrame(step)
    if (now - last < 1000 / FPS) return
    last = now

    const w = window.innerWidth
    const h = window.innerHeight

    // Trail rather than clear, so glyphs fade instead of blinking out.
    ctx.fillStyle = 'rgba(5, 7, 10, 0.16)'
    ctx.fillRect(0, 0, w, h)

    for (let i = 0; i < cols.length; i++) {
      const y = cols[i]!
      const x = i * COL_W
      const g = GLYPHS[(Math.random() * GLYPHS.length) | 0]!

      // The leading character is the bright one.
      ctx.fillStyle = Math.random() > 0.97 ? 'rgba(255, 46, 136, .8)' : 'rgba(95, 245, 255, .65)'
      ctx.fillText(g, x, y)

      cols[i] = y > h + Math.random() * 400 ? -FONT_SIZE : y + FONT_SIZE
    }
  }

  requestAnimationFrame(step)
}

function paintStill(ctx: CanvasRenderingContext2D) {
  const w = window.innerWidth
  const h = window.innerHeight
  ctx.fillStyle = 'rgba(5, 7, 10, 1)'
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = 'rgba(95, 245, 255, .18)'
  for (let y = 0; y < h; y += FONT_SIZE * 2) {
    for (let x = 0; x < w; x += COL_W * 2) {
      ctx.fillText(GLYPHS[((x + y) / 7 | 0) % GLYPHS.length]!, x, y)
    }
  }
}
