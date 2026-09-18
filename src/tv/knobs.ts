/* Real knobs. Grab and turn (the pointer's angle around the centre drives
   the value), roll the wheel over one, or focus it and use the arrow keys.
   Each detent clicks. A knob is a slider to assistive tech. */

import { sfx } from './audio'

export type KnobOpts = {
  label: string
  min: number
  max: number
  value: number
  /** Total travel in degrees, centred on 12 o'clock. A channel dial is 300; a small pot is 270. */
  sweep?: number
  onChange: (value: number) => void
}

export class Knob {
  value: number
  private readonly sweep: number
  private dragging = false
  private lastAngle = 0
  private acc = 0

  constructor(private el: HTMLElement, private o: KnobOpts) {
    this.value = o.value; this.sweep = o.sweep ?? 270
    el.setAttribute('role', 'slider'); el.setAttribute('aria-label', o.label); el.tabIndex = 0
    el.setAttribute('aria-valuemin', String(o.min)); el.setAttribute('aria-valuemax', String(o.max))
    el.addEventListener('pointerdown', this.down); el.addEventListener('pointermove', this.move)
    el.addEventListener('pointerup', this.up); el.addEventListener('pointercancel', this.up)
    el.addEventListener('wheel', (e) => { e.preventDefault(); this.step(Math.sign(e.deltaY) * -1) }, { passive: false })
    el.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowUp' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowDown' || e.key === 'ArrowLeft' ? -1 : 0
      if (d) { e.preventDefault(); this.step(d) }
      if (e.key === 'Home') this.set(o.min); if (e.key === 'End') this.set(o.max)
    })
    this.render()
  }

  set(v: number, silent = false) {
    const next = Math.max(this.o.min, Math.min(this.o.max, Math.round(v)))
    if (next === this.value) return
    this.value = next; this.render(); if (!silent) sfx.click(); this.o.onChange(next)
  }
  step(d: number) { this.set(this.value + d) }

  private render() {
    const t = (this.value - this.o.min) / (this.o.max - this.o.min)
    this.el.style.setProperty('--turn', `${-this.sweep / 2 + t * this.sweep}deg`)
    this.el.setAttribute('aria-valuenow', String(this.value)); this.el.setAttribute('aria-valuetext', `${this.o.label} ${this.value}`)
  }

  private angle(e: PointerEvent) {
    const r = this.el.getBoundingClientRect()
    return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI
  }
  private down = (e: PointerEvent) => {
    e.preventDefault(); this.el.setPointerCapture(e.pointerId); this.dragging = true; this.lastAngle = this.angle(e); this.acc = 0
    this.el.classList.add('turning'); this.el.focus({ preventScroll: true })
  }
  private move = (e: PointerEvent) => {
    if (!this.dragging) return
    const a = this.angle(e); let d = a - this.lastAngle
    if (d > 180) d -= 360; if (d < -180) d += 360
    this.lastAngle = a; this.acc += d
    const perStep = this.sweep / (this.o.max - this.o.min)
    while (this.acc >= perStep) { this.acc -= perStep; this.step(1) }
    while (this.acc <= -perStep) { this.acc += perStep; this.step(-1) }
  }
  private up = (e: PointerEvent) => {
    if (!this.dragging) return
    this.dragging = false; this.el.classList.remove('turning')
    try { this.el.releasePointerCapture(e.pointerId) } catch { /* already released */ }
  }
}

/* Picture settings the knobs own, on the set's glass. Brightness is remembered like volume. */
const BRIGHT_KEY = 'cvz.bright'
export function readBright(): number {
  try { const raw = localStorage.getItem(BRIGHT_KEY); if (raw === null) return 6; const v = Number(raw); return Number.isInteger(v) && v >= 0 && v <= 10 ? v : 6 } catch { return 6 }
}
export function applyBright(v: number) {
  try { localStorage.setItem(BRIGHT_KEY, String(v)) } catch { /* this visit only */ }
  // 0 is a dim, dying tube; 6 is factory; 10 is blown out. Affects the glass on the set.
  document.documentElement.style.setProperty('--bright', String(0.55 + v * 0.085))
}
let vhold = 0
export function setVHold(v: number) { vhold = v; document.documentElement.style.setProperty('--vhold', String(v)) }
export function getVHold() { return vhold }
