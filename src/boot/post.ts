/* ---------------------------------------------------------------
   The POST terminal.
   Draws boot text into an offscreen 2D canvas at a deliberately low
   resolution — the chunky pixels are the point. CrtRenderer samples
   this canvas as a texture.
   --------------------------------------------------------------- */

const COLS = 64
const CHAR_W = 14
const CHAR_H = 26
const PAD_X = 28
const PAD_Y = 26
/** Characters per second while typing a line. */
const TYPE_RATE = 220
/** Pause after a line lands, in seconds. '~' lines get the long pause. */
const LINE_PAUSE = 0.035
const LONG_PAUSE = 0.55

export class PostTerminal {
  readonly canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private rows: number

  private lines: string[]
  private out: string[] = ['']
  private lineIdx = 0
  private charIdx = 0
  private wait = 0
  private elapsed = 0

  /** True once every line has been printed. */
  done = false

  constructor(lines: string[]) {
    this.lines = lines.map((l) => l.slice(0, COLS))

    const canvas = document.createElement('canvas')
    canvas.width = COLS * CHAR_W + PAD_X * 2
    // Tall enough that the full boot log never needs to scroll off-screen
    // on a desktop tube, but it scrolls cleanly if it does.
    this.rows = 24
    canvas.height = this.rows * CHAR_H + PAD_Y * 2
    this.canvas = canvas

    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) throw new Error('2d context unavailable')
    this.ctx = ctx
    ctx.textBaseline = 'top'
    ctx.font = `${CHAR_H - 8}px ui-monospace, Menlo, Consolas, monospace`
  }

  /** Print everything immediately (used by SKIP). */
  finish() {
    this.out = [...this.lines]
    this.lineIdx = this.lines.length
    this.done = true
  }

  advance(dt: number) {
    this.elapsed += dt
    if (this.done) return

    if (this.wait > 0) {
      this.wait -= dt
      return
    }

    let budget = dt * TYPE_RATE
    while (budget > 0 && !this.done) {
      const raw = this.lines[this.lineIdx]
      if (raw === undefined) { this.done = true; break }

      const text = raw.startsWith('~') ? raw.slice(1) : raw

      if (this.charIdx >= text.length) {
        this.wait = raw.startsWith('~') ? LONG_PAUSE : LINE_PAUSE
        this.lineIdx += 1
        this.charIdx = 0
        if (this.lineIdx >= this.lines.length) { this.done = true; break }
        this.out.push('')
        break
      }

      this.charIdx += 1
      this.out[this.out.length - 1] = text.slice(0, this.charIdx)
      budget -= 1
    }
  }

  draw() {
    const { ctx, canvas } = this
    ctx.fillStyle = '#04070a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const visible = this.out.slice(-this.rows)

    visible.forEach((line, i) => {
      const y = PAD_Y + i * CHAR_H
      ctx.fillStyle = tint(line)
      ctx.fillText(line, PAD_X, y)
    })

    // Block cursor on the last line, blinking.
    if (!this.done && Math.floor(this.elapsed * 3) % 2 === 0) {
      const last = visible[visible.length - 1] ?? ''
      const y = PAD_Y + (visible.length - 1) * CHAR_H
      ctx.fillStyle = '#5ff5ff'
      ctx.fillRect(PAD_X + last.length * CHAR_W * 0.6, y + 2, CHAR_W * 0.55, CHAR_H - 8)
    }
  }
}

/** Colour a line by what it says — warnings amber, the handoff cyan. */
function tint(line: string): string {
  if (line.startsWith('WARNING') || line.includes('UNSTABLE')) return '#ffc23d'
  if (line.startsWith('>>>')) return '#5ff5ff'
  if (line.includes(' OK')) return '#6bffa6'
  return '#c4efe4'
}
