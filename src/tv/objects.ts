/* The things that float through the broadcast. Cole listed them himself:
   windows, files, transmissions, folders, screens, fragments. Each type is
   a different piece of television furniture, never an OS widget. */

import type { Item } from '../content/content'
import { TAPES } from '../content/content'

export type Kind = 'window' | 'file' | 'screen' | 'tape' | 'card' | 'fragment'

export type Obj = {
  el: HTMLElement
  kind: Kind
  item?: Item
  x: number; y: number; vx: number; vy: number
  w: number; h: number
  bob: number
  held: boolean
}

const R = (a: number, b: number) => a + Math.random() * (b - a)
const FRAGMENTS = ['SP 0:17:22', 'PLEASE STAND BY', 'CH 44', 'TRACKING', 'REC ●', 'CVZ-TV', 'NASHVILLE', 'V-HOLD', 'A/B', 'LIVE', '▶ PLAY', '‖ PAUSE', '12:00', 'STEREO', 'HI-FI', 'P203', 'DINING · DANCING', '多爾西亞']

function el(cls: string, html: string): HTMLElement {
  const d = document.createElement('div'); d.className = cls; d.innerHTML = html; return d
}

export function makeWindow(item: Item): Obj {
  const h = Math.min(300, R(210, 300)), w = h * (item.w / item.h)
  const node = el('obj obj--window', `<div class="obj__bar"><span>${item.title.toUpperCase()}</span><i>${item.id.toUpperCase()}</i></div><img src="${item.thumb}" alt="" draggable="false" loading="lazy">`)
  return spawn(node, 'window', item, w, h + 24)
}

export function makeFile(item: Item, page: number): Obj {
  const w = R(180, 240), h = w * 0.78
  const node = el('obj obj--file', `<div class="tt"><span class="tt__p">P${page}</span><span class="tt__t">CVZ-TV</span><span class="tt__n">${item.title.toUpperCase()}</span></div><img src="${item.thumb}" alt="" draggable="false" loading="lazy"><div class="tt__foot"><b>■</b><b>■</b><b>■</b><b>■</b> ${item.note.toUpperCase()}</div>`)
  return spawn(node, 'file', item, w, h)
}

export function makeScreen(item: Item, live: boolean): Obj {
  const w = R(220, 320), h = w * 0.75
  const media = live && item.video ? `<video src="${item.video}" poster="${item.poster ?? ''}" muted playsinline loop autoplay preload="metadata"></video>` : `<img src="${item.poster ?? item.thumb}" alt="" draggable="false" loading="lazy">`
  const node = el('obj obj--screen', `<div class="crt">${media}<span class="crt__osd">${live ? 'LIVE' : 'REC ●'}</span><span class="crt__name">${item.title.toUpperCase()}</span></div>`)
  return spawn(node, 'screen', item, w, h)
}

export function makeCard(item: Item): Obj {
  const h = R(200, 260), w = h * Math.min(1.3, item.w / item.h)
  const node = el('obj obj--card', `<img src="${item.thumb}" alt="" draggable="false" loading="lazy"><div class="card__tag"><b>${item.title.toUpperCase()}</b><span>${item.note.toUpperCase()} · CALL NOW</span></div>`)
  return spawn(node, 'card', item, w, h + 40)
}

export function makeTape(i: number): Obj {
  const t = TAPES[i % TAPES.length]
  const node = el('obj obj--tape', `<div class="tape"><div class="tape__reels"><i></i><i></i></div><div class="tape__label"><b>${t.label}</b><span>${t.hand}</span></div></div>`)
  node.dataset.tape = String(i % TAPES.length)
  return spawn(node, 'tape', undefined, 230, 140)
}

export function makeFragment(): Obj {
  const txt = FRAGMENTS[Math.floor(Math.random() * FRAGMENTS.length)]
  const node = el('obj obj--fragment', `<span>${txt}</span>`)
  return spawn(node, 'fragment', undefined, 160, 30)
}

let slot = 0
function spawn(node: HTMLElement, kind: Kind, item: Item | undefined, w: number, h: number): Obj {
  node.style.width = w + 'px'
  const lane = (slot++ * 0.618) % 1
  const speed = kind === 'fragment' ? R(28, 55) : R(9, 26)
  const dir = Math.random() < 0.65 ? -1 : 1
  const o: Obj = { el: node, kind, item, x: lane * (innerWidth + w) - w, y: R(90, Math.max(100, innerHeight - h - 90)), vx: speed * dir, vy: R(-4, 4), w, h, bob: Math.random() * 6.28, held: false }
  node.style.zIndex = String(kind === 'fragment' ? 3 : kind === 'tape' ? 4 : 5)
  return o
}

/** Advance every object; wrap the ones that left the tube. */
export function drift(objs: Obj[], dt: number, t: number, speed: number) {
  for (const o of objs) {
    if (!o.held) {
      o.x += o.vx * dt * speed; o.y += o.vy * dt * speed
      if (o.vx < 0 && o.x < -o.w - 40) { o.x = innerWidth + 40; o.y = R(90, Math.max(100, innerHeight - o.h - 90)) }
      if (o.vx > 0 && o.x > innerWidth + 40) { o.x = -o.w - 40; o.y = R(90, Math.max(100, innerHeight - o.h - 90)) }
      if (o.y < -o.h) o.y = innerHeight; if (o.y > innerHeight) o.y = -o.h
    }
    const bob = Math.sin(t * 0.8 + o.bob) * 4 * speed
    o.el.style.transform = `translate3d(${o.x}px, ${o.y + bob}px, 0)`
  }
}
