/* ---------------------------------------------------------------
   Window manager.
   Sections are not pages — they are objects sitting in the system.
   Open several at once, drag them, stack them, close them.
   --------------------------------------------------------------- */

import type { Section } from '../content/content'
import { renderBody } from './render'

type Win = {
  id: string
  el: HTMLDivElement
  section: Section
}

const CASCADE = 26

/** Relative slots, as a fraction of the free space on each axis. */
const ANCHORS: [number, number][] = [
  [0.10, 0.14], [0.62, 0.10], [0.36, 0.52],
  [0.86, 0.46], [0.06, 0.70], [0.68, 0.76],
]

export class WindowManager {
  private wins = new Map<string, Win>()
  private z = 10
  private opened = 0
  private onChange: () => void

  constructor(private root: HTMLElement, onChange: () => void) {
    this.onChange = onChange

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const top = this.topmost()
        if (top) this.close(top.id)
      }
    })
  }

  get openIds(): string[] {
    return [...this.wins.keys()]
  }

  isOpen(id: string) {
    return this.wins.has(id)
  }

  toggle(section: Section) {
    if (this.wins.has(section.id)) this.close(section.id)
    else this.open(section)
  }

  open(section: Section) {
    const existing = this.wins.get(section.id)
    if (existing) { this.focus(existing); return }

    const el = document.createElement('div')
    el.className = 'win'
    el.dataset.id = section.id
    el.setAttribute('role', 'dialog')
    el.setAttribute('aria-label', section.label)

    const { w, h, x, y } = this.placement(section)
    el.style.width = `${w}px`
    el.style.height = `${h}px`
    el.style.left = `${x}px`
    el.style.top = `${y}px`
    el.style.zIndex = String(++this.z)

    el.innerHTML = `
      <header class="win__bar">
        <span class="win__dot"></span>
        <span class="win__path">${escapeHtml(section.path)}</span>
        <button class="win__btn" type="button" data-act="close" aria-label="Close ${escapeHtml(section.label)}">&times;</button>
      </header>
      <div class="win__body"></div>
      <div class="win__resize" aria-hidden="true"></div>
    `

    const body = el.querySelector<HTMLDivElement>('.win__body')!
    body.appendChild(renderBody(section.body))

    const win: Win = { id: section.id, el, section }
    this.wins.set(section.id, win)
    this.root.appendChild(el)

    el.addEventListener('pointerdown', () => this.focus(win))
    el.querySelector<HTMLButtonElement>('[data-act="close"]')!
      .addEventListener('click', (e) => { e.stopPropagation(); this.close(section.id) })

    this.wireDrag(win)
    this.wireResize(win)
    this.focus(win)
    this.onChange()
  }

  close(id: string) {
    const win = this.wins.get(id)
    if (!win) return
    this.wins.delete(id)
    win.el.dataset.closing = '1'
    window.setTimeout(() => win.el.remove(), 200)
    this.onChange()
  }

  closeAll() {
    for (const id of [...this.wins.keys()]) this.close(id)
  }

  private focus(win: Win) {
    win.el.style.zIndex = String(++this.z)
    for (const w of this.wins.values()) {
      w.el.dataset.focus = w === win ? '1' : '0'
    }
  }

  private topmost(): Win | null {
    let best: Win | null = null
    let bestZ = -1
    for (const w of this.wins.values()) {
      const z = Number(w.el.style.zIndex)
      if (z > bestZ) { bestZ = z; best = w }
    }
    return best
  }

  /** Scatter windows across the whole desktop rather than piling them in
      one corner — the system should look inhabited, not stacked. */
  private placement(section: Section) {
    const bounds = this.root.getBoundingClientRect()
    const w = Math.min(section.size.w, Math.max(260, bounds.width - 40))
    const h = Math.min(section.size.h, Math.max(160, bounds.height - 40))

    const anchor = ANCHORS[this.opened % ANCHORS.length]!
    const drift = Math.floor(this.opened / ANCHORS.length) * CASCADE
    this.opened += 1

    const maxX = Math.max(12, bounds.width - w - 12)
    const maxY = Math.max(12, bounds.height - h - 12)
    const x = clamp((bounds.width - w) * anchor[0] + drift, 12, maxX)
    const y = clamp((bounds.height - h) * anchor[1] + drift, 12, maxY)
    return { w, h, x, y }
  }

  private wireDrag(win: Win) {
    const bar = win.el.querySelector<HTMLElement>('.win__bar')!
    let ox = 0, oy = 0

    const move = (e: PointerEvent) => {
      const bounds = this.root.getBoundingClientRect()
      const maxX = bounds.width - win.el.offsetWidth
      const maxY = bounds.height - win.el.offsetHeight
      win.el.style.left = `${clamp(e.clientX - bounds.left - ox, 0, Math.max(0, maxX))}px`
      win.el.style.top = `${clamp(e.clientY - bounds.top - oy, 0, Math.max(0, maxY))}px`
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }

    bar.addEventListener('pointerdown', (e) => {
      if ((e.target as HTMLElement).closest('.win__btn')) return
      const rect = win.el.getBoundingClientRect()
      ox = e.clientX - rect.left
      oy = e.clientY - rect.top
      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', up)
    })
  }

  private wireResize(win: Win) {
    const grip = win.el.querySelector<HTMLElement>('.win__resize')!

    const move = (e: PointerEvent) => {
      const rect = win.el.getBoundingClientRect()
      win.el.style.width = `${Math.max(260, e.clientX - rect.left)}px`
      win.el.style.height = `${Math.max(150, e.clientY - rect.top)}px`
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }

    grip.addEventListener('pointerdown', (e) => {
      e.stopPropagation()
      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', up)
    })
  }
}

const clamp = (n: number, lo: number, hi: number) => (n < lo ? lo : n > hi ? hi : n)

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}
