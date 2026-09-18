/* The sets you can pick from on the home page. Each is a photographed
   cabinet with the live controls mapped onto it: every number here is a
   percentage of the photo, measured off a grid overlay, so the glass, dial,
   pots, legend strip and POWER land on the real thing at any size. */

export type Cabinet = {
  id: string
  name: string
  photo: string
  w: number
  h: number
  /** 'wood' | 'black' | 'cream' — drives plate, legend and POWER colours. */
  tone: 'wood' | 'black' | 'cream'
  glass: { l: number; t: number; w: number; h: number; r: string }
  plate: { l: number; t: number; w: number; h: number }
  dial: { x: number; y: number; d: number }
  pots: { y: number; d: number; x: [number, number, number] }
  legend: { l: number; t: number; w: number; h: number }
  power: { l: number; t: number; w: number; h: number }
}

export const CABINETS: Cabinet[] = [
  { id: 'a', name: "'78 WALNUT CONSOLE", photo: '/tv/cabinet-a.webp', w: 1107, h: 663, tone: 'wood',
    glass: { l: 9.05, t: 12.9, w: 61.9, h: 69.3, r: '7% / 10%' }, plate: { l: 81.6, t: 9.8, w: 8, h: 4.3 },
    dial: { x: 85.5, y: 30.2, d: 14.6 }, pots: { y: 51.6, d: 4.4, x: [80.2, 85.5, 90.6] },
    legend: { l: 77.6, t: 55, w: 15.9, h: 3.4 }, power: { l: 80.4, t: 77.5, w: 10.8, h: 6.4 } },
  { id: 'b', name: "'85 BLACK PORTABLE", photo: '/tv/cabinet-b.webp', w: 1018, h: 655, tone: 'black',
    glass: { l: 7.4, t: 10.4, w: 61.9, h: 69, r: '7% / 10%' }, plate: { l: 75.8, t: 9.9, w: 16.2, h: 4.6 },
    dial: { x: 84.4, y: 30.5, d: 21 }, pots: { y: 55.3, d: 5, x: [77.5, 84.4, 91.3] },
    legend: { l: 75.5, t: 59.8, w: 17.8, h: 3.2 }, power: { l: 79, t: 72.5, w: 12.1, h: 6.9 } },
  { id: 'c', name: "'72 CREAM SPACE-AGE", photo: '/tv/cabinet-c.webp', w: 996, h: 664, tone: 'cream',
    glass: { l: 7.5, t: 13.6, w: 61.7, h: 67, r: '8% / 11%' }, plate: { l: 78.3, t: 12, w: 11.2, h: 5.3 },
    dial: { x: 84.3, y: 35, d: 18.8 }, pots: { y: 56.5, d: 4.6, x: [78, 84.3, 90.4] },
    legend: { l: 75.9, t: 60.4, w: 16.9, h: 3 }, power: { l: 78.5, t: 75.3, w: 11.5, h: 5.7 } },
]

const KEY = 'cvz.set'
export function readCabinet(): number {
  try { const i = CABINETS.findIndex((c) => c.id === localStorage.getItem(KEY)); return i < 0 ? 0 : i } catch { return 0 }
}
export function writeCabinet(i: number) { try { localStorage.setItem(KEY, CABINETS[i].id) } catch { /* this visit only */ } }

/** Lay the controls over the photo. */
export function applyCabinet(set: HTMLElement, c: Cabinet) {
  const s = set.style
  s.setProperty('--w', String(c.w)); s.setProperty('--h', String(c.h))
  s.setProperty('--glass-l', `${c.glass.l}%`); s.setProperty('--glass-t', `${c.glass.t}%`); s.setProperty('--glass-w', `${c.glass.w}%`); s.setProperty('--glass-h', `${c.glass.h}%`); s.setProperty('--glass-r', c.glass.r)
  s.setProperty('--plate-l', `${c.plate.l}%`); s.setProperty('--plate-t', `${c.plate.t}%`); s.setProperty('--plate-w', `${c.plate.w}%`); s.setProperty('--plate-h', `${c.plate.h}%`)
  s.setProperty('--dial-x', `${c.dial.x}%`); s.setProperty('--dial-y', `${c.dial.y}%`); s.setProperty('--dial-d', `${c.dial.d}%`)
  s.setProperty('--pot-y', `${c.pots.y}%`); s.setProperty('--pot-d', `${c.pots.d}%`); c.pots.x.forEach((x, i) => s.setProperty(`--pot-x${i + 1}`, `${x}%`))
  s.setProperty('--legend-l', `${c.legend.l}%`); s.setProperty('--legend-t', `${c.legend.t}%`); s.setProperty('--legend-w', `${c.legend.w}%`); s.setProperty('--legend-h', `${c.legend.h}%`)
  s.setProperty('--power-l', `${c.power.l}%`); s.setProperty('--power-t', `${c.power.t}%`); s.setProperty('--power-w', `${c.power.w}%`); s.setProperty('--power-h', `${c.power.h}%`)
  set.dataset.tone = c.tone
  const img = set.querySelector<HTMLImageElement>('.set__photo')!
  img.width = c.w; img.height = c.h; img.src = c.photo
}
