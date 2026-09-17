/* ---------------------------------------------------------------
   STAGE 1 orchestration.
   POWER UP -> tube fires -> BIOS scrolls -> the viewer is pulled in.
   Resolves once the machine has swallowed them.
   --------------------------------------------------------------- */

import { CrtRenderer } from './crt'
import { PostTerminal } from './post'
import { POST_LINES } from '../content/content'
import { prefersReducedMotion } from '../fx/prefs'

type Phase = 'idle' | 'power' | 'post' | 'dive' | 'done'

const POWER_MS = 1300
const HOLD_MS = 700
const DIVE_MS = 1500

export function runBoot(): Promise<void> {
  const boot = must<HTMLDivElement>('#boot')
  const canvas = must<HTMLCanvasElement>('#crt')
  const screen = must<HTMLDivElement>('#powerScreen')
  const button = must<HTMLButtonElement>('#powerBtn')
  const skip = must<HTMLButtonElement>('#skipBoot')

  const reduced = prefersReducedMotion()
  const scale = reduced ? 0.35 : 1

  const terminal = new PostTerminal(POST_LINES)

  let crt: CrtRenderer | null = null
  try {
    crt = new CrtRenderer(canvas, terminal.canvas)
  } catch {
    // No WebGL: the machine still turns on, it just does it flat.
    canvas.hidden = true
  }

  return new Promise<void>((resolve) => {
    let phase: Phase = 'idle'
    let phaseStart = 0
    let holdStart = 0
    let raf = 0
    let last = performance.now()
    let settled = false

    const setPhase = (next: Phase, now: number) => {
      phase = next
      phaseStart = now
    }

    const finish = () => {
      if (settled) return
      settled = true
      cancelAnimationFrame(raf)
      crt?.dispose()
      boot.style.transition = 'opacity .35s ease'
      boot.style.opacity = '0'
      window.setTimeout(() => { boot.hidden = true }, 360)
      resolve()
    }

    const sizeCanvas = () => {
      if (!crt) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      crt.resize(window.innerWidth, window.innerHeight, dpr)
    }
    sizeCanvas()
    window.addEventListener('resize', sizeCanvas)

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now

      let power = 0
      let dive = 0
      let noise = 0

      if (phase === 'power') {
        power = clamp01((now - phaseStart) / (POWER_MS * scale))
        noise = 0.35 * (1 - power)
        if (power >= 1) setPhase('post', now)
      } else if (phase === 'post') {
        power = 1
        terminal.advance(dt)
        if (terminal.done) {
          if (!holdStart) holdStart = now
          if (now - holdStart > HOLD_MS * scale) setPhase('dive', now)
        }
      } else if (phase === 'dive') {
        power = 1
        dive = easeIn(clamp01((now - phaseStart) / (DIVE_MS * scale)))
        noise = dive * 0.5
        if (dive >= 1) { finish(); return }
      }

      if (phase !== 'idle') {
        terminal.draw()
        crt?.render({ power, dive, static: noise })
      }

      raf = requestAnimationFrame(frame)
    }

    const start = () => {
      if (phase !== 'idle') return
      screen.dataset.gone = '1'
      skip.hidden = false
      const now = performance.now()
      last = now
      setPhase('power', now)
      raf = requestAnimationFrame(frame)
    }

    button.addEventListener('click', start, { once: true })

    skip.addEventListener('click', () => {
      terminal.finish()
      if (phase === 'post' || phase === 'power') setPhase('dive', performance.now())
    })

    // Enter/Space on the power screen also fires it up.
    window.addEventListener('keydown', (e) => {
      if (phase === 'idle' && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault()
        start()
      }
    })
  })
}

function must<T extends Element>(sel: string): T {
  const el = document.querySelector<T>(sel)
  if (!el) throw new Error(`missing element: ${sel}`)
  return el
}

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n)
const easeIn = (t: number) => t * t * t
