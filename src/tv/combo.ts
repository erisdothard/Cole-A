/* The set on the home page: a mid-90s TV sitting on its own VCR, the RCA
   cables plugged in between them, photographed. The tape goes into the
   VCR's slot. Every number here is a percentage of the photo, measured off
   a grid overlay and checked with outlines, so the glass, the badge, the
   slot and the six live buttons land on the real thing at any size.
   (Cole, 2026-10-05: "a 90s Zenith TV with the tape and RCA cables".) */

type Rect = { l: number; t: number; w: number; h: number }
export type Combo = { photo: string; w: number; h: number; glass: Rect & { r: string }; badge: Rect; slot: Rect; btns: Rect[]; led: { x: number; y: number } | null }

export const COMBO: Combo = {
  photo: '/tv/stack3.webp', w: 932, h: 960,
  glass: { l: 15.5, t: 8.3, w: 69.5, h: 46.8, r: '5% / 7%' },
  badge: { l: 41.4, t: 57.6, w: 18.0, h: 4.3 },
  slot: { l: 5.4, t: 78.8, w: 46.2, h: 8.0 },
  // vol −, vol +, ch ▼, ch ▲ = the TV's four small buttons; eject = the VCR's ▲ button by the slot; power = the TV's big one
  btns: [{ l: 36.6, t: 65.9, w: 3.9, h: 3.3 }, { l: 41.3, t: 65.9, w: 3.8, h: 3.3 }, { l: 46.0, t: 65.9, w: 3.9, h: 3.3 }, { l: 50.7, t: 65.9, w: 3.9, h: 3.3 }, { l: 51.7, t: 90.7, w: 4.2, h: 2.4 }, { l: 58.6, t: 65.7, w: 5.3, h: 4.0 }],
  led: { x: 56.9, y: 67.7 },
}

/** What each photographed button does, in the order of `btns`. */
export const BUTTONS = ['vol-dn', 'vol-up', 'ch-dn', 'ch-up', 'eject', 'power'] as const
export const BUTTON_LABEL: Record<(typeof BUTTONS)[number], string> = { 'vol-dn': 'VOL −', 'vol-up': 'VOL +', 'ch-dn': 'CH ▼', 'ch-up': 'CH ▲', eject: 'EJECT', power: 'POWER' }

/** Lay the glass, slot and buttons over the photo. */
export function applyCombo(set: HTMLElement, c: Combo = COMBO) {
  const s = set.style, r = (k: string, v: Rect) => { s.setProperty(`--${k}-l`, `${v.l}%`); s.setProperty(`--${k}-t`, `${v.t}%`); s.setProperty(`--${k}-w`, `${v.w}%`); s.setProperty(`--${k}-h`, `${v.h}%`) }
  s.setProperty('--w', String(c.w)); s.setProperty('--h', String(c.h))
  r('glass', c.glass); s.setProperty('--glass-r', c.glass.r); r('slot', c.slot); r('badge', c.badge)
  BUTTONS.forEach((id, i) => { const el = set.querySelector<HTMLElement>(`[data-btn="${id}"]`); const b = c.btns[i]; if (el && b) Object.assign(el.style, { left: `${b.l}%`, top: `${b.t}%`, width: `${b.w}%`, height: `${b.h}%` }) })
  if (c.led) { s.setProperty('--led-x', `${c.led.x}%`); s.setProperty('--led-y', `${c.led.y}%`) }
  const img = set.querySelector<HTMLImageElement>('.set__photo')!
  img.width = c.w; img.height = c.h; img.src = c.photo
}
