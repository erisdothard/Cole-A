/* The sets you can pick from on the home page. Each is a photographed
   cabinet with the live controls mapped onto it: every number here is a
   percentage of the photo, measured off a grid overlay, so the glass, dial,
   pots, legend strip and POWER land on the real thing at any size. */

/** One photo and the map of its controls. */
export type Layout = {
  photo: string
  w: number
  h: number
  glass: { l: number; t: number; w: number; h: number; r: string }
  plate: { l: number; t: number; w: number; h: number }
  dial: { x: number; y: number; d: number }
  pots: { y: number; d: number; x: [number, number, number] }
  legend: { l: number; t: number; w: number; h: number }
  power: { l: number; t: number; w: number; h: number }
}
/** A set: its landscape photo for wide screens and an upright one for phones, where a landscape set would be tiny. */
export type Cabinet = Layout & { id: string; name: string; tone: 'wood' | 'black' | 'cream'; portrait: Layout }

// Two 1980s sets (Cole, 2026-10-05: the '72 and '78 consoles were the wrong era).
export const CABINETS: Cabinet[] = [
  { id: 'd', name: "'82 SILVER WOODGRAIN", photo: '/tv/cabinet-d.webp', w: 1050, h: 552, tone: 'black',
    glass: { l: 9.3, t: 12.3, w: 60.8, h: 72.3, r: '6% / 10%' }, plate: { l: 78.3, t: 12.5, w: 13.2, h: 6.5 },
    dial: { x: 85.0, y: 37.5, d: 14.7 }, pots: { y: 59.5, d: 4.0, x: [78.7, 84.6, 90.5] },
    legend: { l: 75.1, t: 64.7, w: 19.0, h: 4.9 }, power: { l: 80.5, t: 78.4, w: 8.6, h: 8.0 },
    portrait: { photo: '/tv/cabinet-d-p.webp', w: 629, h: 940, glass: { l: 13.5, t: 9.3, w: 75.1, h: 50.3, r: '7% / 7%' }, plate: { l: 9.7, t: 71.7, w: 17.3, h: 4.9 },
      dial: { x: 46.1, y: 74.5, d: 21.9 }, pots: { y: 75.6, d: 6.7, x: [63.3, 72.5, 81.6] }, legend: { l: 58.3, t: 71.3, w: 33.1, h: 1.0 }, power: { l: 84.6, t: 78.0, w: 6.8, h: 3.6 } } },
  { id: 'b', name: "'85 BLACK PORTABLE", photo: '/tv/cabinet-b.webp', w: 1018, h: 655, tone: 'black',
    glass: { l: 7.4, t: 10.4, w: 61.9, h: 69, r: '7% / 10%' }, plate: { l: 75.8, t: 9.9, w: 16.2, h: 4.6 },
    dial: { x: 84.4, y: 30.5, d: 21 }, pots: { y: 55.3, d: 5, x: [77.5, 84.4, 91.3] },
    legend: { l: 75.5, t: 59.8, w: 17.8, h: 3.2 }, power: { l: 79, t: 72.5, w: 12.1, h: 6.9 },
    portrait: { photo: '/tv/cabinet-b-p.webp', w: 644, h: 919, glass: { l: 13.7, t: 8.7, w: 72.5, h: 57.1, r: '6% / 5%' }, plate: { l: 4.7, t: 78.9, w: 15.5, h: 3.3 },
      dial: { x: 36, y: 81.1, d: 23.3 }, pots: { y: 81.1, d: 8, x: [55.4, 66.8, 78.1] }, legend: { l: 50, t: 76.8, w: 33.5, h: 1.9 }, power: { l: 86.2, t: 79.4, w: 8.9, h: 3.3 } } },
]

const KEY = 'cvz.set'
export function readCabinet(): number {
  try { const i = CABINETS.findIndex((c) => c.id === localStorage.getItem(KEY)); return i < 0 ? 0 : i } catch { return 0 }
}
export function writeCabinet(i: number) { try { localStorage.setItem(KEY, CABINETS[i].id) } catch { /* this visit only */ } }

/* Both sets live in the same frame, so switching never changes the shape or
   size of the TV: each photo is fitted inside it (sitting on the floor,
   centred) and its control map is carried across into frame percentages. */
const FRAME = { land: { w: 1100, h: 640 }, port: { w: 640, h: 934 } }

/** Lay the controls over the photo — the upright one on a phone. */
export function applyCabinet(set: HTMLElement, cab: Cabinet, portrait: boolean) {
  const c: Layout = portrait ? cab.portrait : cab, F = portrait ? FRAME.port : FRAME.land
  const k = Math.min(F.w / c.w, F.h / c.h), iw = c.w * k, ih = c.h * k, ox = (F.w - iw) / 2, oy = F.h - ih
  const X = (p: number) => `${((ox + (p / 100) * iw) / F.w) * 100}%`, Y = (p: number) => `${((oy + (p / 100) * ih) / F.h) * 100}%`
  const W = (p: number) => `${((p / 100) * iw / F.w) * 100}%`, H = (p: number) => `${((p / 100) * ih / F.h) * 100}%`
  const s = set.style
  s.setProperty('--w', String(F.w)); s.setProperty('--h', String(F.h))
  s.setProperty('--glass-l', X(c.glass.l)); s.setProperty('--glass-t', Y(c.glass.t)); s.setProperty('--glass-w', W(c.glass.w)); s.setProperty('--glass-h', H(c.glass.h)); s.setProperty('--glass-r', c.glass.r)
  s.setProperty('--plate-l', X(c.plate.l)); s.setProperty('--plate-t', Y(c.plate.t)); s.setProperty('--plate-w', W(c.plate.w)); s.setProperty('--plate-h', H(c.plate.h))
  s.setProperty('--dial-x', X(c.dial.x)); s.setProperty('--dial-y', Y(c.dial.y)); s.setProperty('--dial-d', W(c.dial.d))
  s.setProperty('--pot-y', Y(c.pots.y)); s.setProperty('--pot-d', W(c.pots.d)); c.pots.x.forEach((x, i) => s.setProperty(`--pot-x${i + 1}`, X(x)))
  s.setProperty('--legend-l', X(c.legend.l)); s.setProperty('--legend-t', Y(c.legend.t)); s.setProperty('--legend-w', W(c.legend.w)); s.setProperty('--legend-h', H(c.legend.h))
  s.setProperty('--power-l', X(c.power.l)); s.setProperty('--power-t', Y(c.power.t)); s.setProperty('--power-w', W(c.power.w)); s.setProperty('--power-h', H(c.power.h))
  set.dataset.tone = cab.tone
  const img = set.querySelector<HTMLImageElement>('.set__photo')!
  img.width = c.w; img.height = c.h; img.src = c.photo
  Object.assign(img.style, { position: 'absolute', left: `${(ox / F.w) * 100}%`, top: `${(oy / F.h) * 100}%`, width: `${(iw / F.w) * 100}%`, height: `${(ih / F.h) * 100}%` })
}
