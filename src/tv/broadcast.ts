/* Stage 2: inside the tube. A broadcast that never stops — his videos on the
   feed, his work floating through as television furniture, the set talking
   to itself — with a channel number always in the corner so nobody is lost. */

import { CHANNELS, ITEMS, SPAM, TAPES, BIO, CONTACT, type Item } from '../content/content'
import { sfx } from './audio'
import { drift, makeCard, makeFile, makeFragment, makeScreen, makeTape, makeWindow, type Obj } from './objects'
import { getFx } from '../fx/prefs'

const $ = <T extends HTMLElement>(s: string) => document.querySelector(s) as T
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
const pick = <T>(a: T[]) => a[Math.floor(Math.random() * a.length)]

export class Broadcast {
  private tube = $('#tube')
  private feed = $<HTMLVideoElement>('#feed')
  private host = $('#objects')
  private objs: Obj[] = []
  private ch = 1
  private locked: Item | null = null
  private t0 = performance.now()
  private last = this.t0
  private feedTimer = 0
  private spamTimer = 0
  private speed = getFx() === 'off' ? 0 : getFx() === 'lite' ? 0.35 : 1
  private hover: Obj | null = null
  private snow = new Snow($<HTMLCanvasElement>('#snow'))

  async start() {
    // Read the deep link before tune() rewrites the hash to the channel.
    const id = this.itemFromHash()
    const item = id ? ITEMS.find((i) => i.id === id) : undefined
    this.tube.hidden = false
    this.tube.classList.add('on')
    this.tune(item?.channel ?? this.chFromHash() ?? 1, true)
    sfx.bed(true)
    this.bind()
    requestAnimationFrame((n) => this.frame(n))
    await wait(300)
    if (item) this.lock(item.id)
  }

  /* ---------------- channels ---------------- */
  tune(n: number, silent = false) {
    const c = CHANNELS.find((x) => x.n === n) ?? CHANNELS[0]
    this.ch = c.n
    if (!silent) { this.burst(280); sfx.static(260) }
    $('#osd-num').textContent = `CH ${c.n}`
    $('#osd-name').textContent = c.name
    $('#osd-ch').classList.remove('flash'); void $('#osd-ch').offsetWidth; $('#osd-ch').classList.add('flash')
    this.populate(c.filter)
    this.nextFeed()
    if (!this.locked) history.replaceState(null, '', `#ch/${c.n}`)
    this.say(c.tag, 'ok')
  }

  private populate(filter: (i: Item) => boolean) {
    this.host.innerHTML = ''; this.objs = []
    const pool = ITEMS.filter(filter)
    const small = innerWidth < 800
    const count = Math.min(pool.length, small ? 7 : 13)
    let live = 0, page = 200
    for (let i = 0; i < count; i++) {
      const item = pool[(i * 7 + this.ch) % pool.length]
      let o: Obj
      if (item.kind === 'tx') { o = makeScreen(item, live < (small ? 1 : 3)); if (item.video) live++ }
      else if (item.kind === 'blank') o = makeCard(item)
      else o = i % 3 === 2 ? makeFile(item, page++) : makeWindow(item)
      this.mount(o)
    }
    for (let i = 0; i < (small ? 1 : 3); i++) this.mount(makeTape(i + this.ch))
    for (let i = 0; i < (small ? 3 : 6); i++) this.mount(makeFragment())
    if (this.ch === 6) this.mount(this.textWindow('OPERATOR.TXT', `<p>${BIO}</p><p><b>${CONTACT.line}</b></p>`))
    if (this.ch === 7) this.mount(this.textWindow('CALL-IN', `<p><b>BOOK CVZ</b></p><p><a href="mailto:${CONTACT.email}">${CONTACT.email}</a><br><a href="${CONTACT.instagramUrl}" target="_blank" rel="noopener">${CONTACT.instagram}</a></p><p>${CONTACT.line}</p>`))
  }

  private textWindow(title: string, html: string): Obj {
    const o = makeFragment(); o.kind = 'window'
    o.el.className = 'obj obj--window obj--text'; o.el.innerHTML = `<div class="obj__bar"><span>${title}</span><i>CH ${this.ch}</i></div><div class="obj__text">${html}</div>`
    o.w = Math.min(460, innerWidth - 40); o.h = 260; o.el.style.width = o.w + 'px'; o.el.style.zIndex = '9'
    o.x = innerWidth / 2 - o.w / 2; o.y = innerHeight * 0.3; o.vx = 0; o.vy = 0; o.held = true
    return o
  }

  private mount(o: Obj) {
    this.objs.push(o); this.host.appendChild(o.el)
    o.el.addEventListener('pointerenter', () => { this.hover = o; o.held = true; o.el.classList.add('hot'); $('#osd-hover').hidden = false; $('#osd-hover').textContent = o.item ? `▶ SELECT · ${o.item.title.toUpperCase()}` : o.kind === 'tape' ? '▶ INSERT TAPE' : '▶'; sfx.blip() })
    o.el.addEventListener('pointerleave', () => { if (this.hover === o) this.hover = null; if (o.kind !== 'window' || !o.el.classList.contains('obj--text')) o.held = false; o.el.classList.remove('hot'); $('#osd-hover').hidden = true })
    o.el.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('a')) return
      if (o.item) this.lock(o.item.id)
      else if (o.kind === 'tape') this.insertTape(Number(o.el.dataset.tape))
    })
  }

  private insertTape(i: number) {
    const t = TAPES[i]; this.burst(400); sfx.static(400); this.say(`INSERT TAPE · ${t.label}`, 'ok')
    $('#osd-name').textContent = t.label; this.populate(t.filter); this.nextFeed(t.filter)
  }

  /* ---------------- the feed ---------------- */
  private nextFeed(filter?: (i: Item) => boolean) {
    clearTimeout(this.feedTimer)
    const c = CHANNELS.find((x) => x.n === this.ch)!
    const vids = ITEMS.filter((i) => i.video && (filter ?? c.filter)(i))
    const pool = vids.length ? vids : ITEMS.filter((i) => i.video)
    const v = pick(pool)
    if (this.feed.dataset.id !== v.id) { this.feed.dataset.id = v.id; this.feed.src = v.video!; this.feed.play().catch(() => {}) }
    $('#osd-mode').textContent = this.speed ? 'PLAY ▶' : 'PAUSE ‖'
    if (this.speed) this.feedTimer = window.setTimeout(() => { this.burst(160); this.nextFeed(filter) }, 14000 + Math.random() * 8000)
  }

  /* ---------------- lock (tune in to one thing) ---------------- */
  lock(id: string) {
    const item = ITEMS.find((i) => i.id === id); if (!item) return
    this.locked = item
    this.burst(220); sfx.static(220)
    const m = $('#lock-media'); m.innerHTML = item.video ? `<video src="${item.video}" poster="${item.poster ?? ''}" muted playsinline loop autoplay></video>` : `<img src="${item.image}" alt="${item.title}">`
    $('#lk-title').textContent = item.title.toUpperCase(); $('#lk-note').textContent = item.note.toUpperCase()
    const list = this.lockList(), idx = list.indexOf(item)
    $('#lk-count').textContent = `${String(idx + 1).padStart(2, '0')} / ${list.length} · CH ${this.ch} ${CHANNELS.find((c) => c.n === this.ch)!.name}`
    $('#lk-tc').textContent = `SP ${this.tc()}`
    $('#lock').hidden = false; this.tube.classList.add('locked'); $('#osd-hover').hidden = true
    $('#osd-mode').textContent = 'PAUSE ‖'
    history.replaceState(null, '', `#item/${item.id}`)
  }
  private lockList() { const c = CHANNELS.find((x) => x.n === this.ch)!; const l = ITEMS.filter(c.filter); return l.includes(this.locked!) ? l : ITEMS }
  unlock() {
    if (!this.locked) return
    this.locked = null; $('#lock').hidden = true; $('#lock-media').innerHTML = ''; this.tube.classList.remove('locked')
    $('#osd-mode').textContent = 'PLAY ▶'; this.burst(140); sfx.click(); history.replaceState(null, '', `#ch/${this.ch}`)
  }
  step(d: number) { if (!this.locked) return; const l = this.lockList(); const i = (l.indexOf(this.locked) + d + l.length) % l.length; this.lock(l[i].id) }

  /* ---------------- menu (the index) ---------------- */
  menu(on: boolean) {
    const m = $('#menu'); if (on === !m.hidden) return
    m.hidden = !on; sfx.click()
    if (on) {
      $('#menu-cols').innerHTML = CHANNELS.map((c) => `<div class="menu__col"><h3 data-ch="${c.n}">CH ${c.n} · ${c.name}</h3><ul>${ITEMS.filter(c.filter).map((i) => `<li data-id="${i.id}">${i.title}<i>${i.note}</i></li>`).join('')}</ul></div>`).join('') +
        `<div class="menu__col"><h3>OPERATOR</h3><p>${BIO}</p><h3>CALL-IN</h3><p><a href="mailto:${CONTACT.email}">${CONTACT.email}</a><br><a href="${CONTACT.instagramUrl}" target="_blank" rel="noopener">${CONTACT.instagram}</a></p></div>`
    }
  }

  /* ---------------- the set talking to itself ---------------- */
  private say(text: string, tone?: 'warn' | 'err' | 'ok') {
    const s = document.createElement('div'); s.className = 'spam__msg' + (tone ? ` spam__msg--${tone}` : '')
    s.textContent = text; s.style.left = `${8 + Math.random() * 60}%`; s.style.top = `${10 + Math.random() * 70}%`
    $('#spam').appendChild(s); sfx.blip()
    setTimeout(() => s.classList.add('out'), 2200 + Math.random() * 1800); setTimeout(() => s.remove(), 4600)
  }

  private burst(ms: number) { const s = $('#static'); s.classList.add('on'); this.snow.on = true; setTimeout(() => { s.classList.remove('on'); this.snow.on = false }, ms) }
  private tc() { const s = Math.floor((performance.now() - this.t0) / 1000); return `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}` }

  /* ---------------- loop ---------------- */
  private frame(now: number) {
    const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now; const t = (now - this.t0) / 1000
    if (!this.locked && $('#menu').hidden) drift(this.objs, dt, t, this.speed)
    if (Math.floor(t * 2) % 2 === 0) $('#osd-tc').textContent = `SP ${this.tc()}`
    this.spamTimer -= dt
    if (this.spamTimer <= 0 && this.speed) { const m = pick(SPAM); this.say(m.text, m.tone); this.spamTimer = 3.5 + Math.random() * 5 }
    if (this.speed && Math.random() < dt * 0.08) { this.tube.classList.add('jitter'); setTimeout(() => this.tube.classList.remove('jitter'), 120 + Math.random() * 200) }
    this.snow.draw()
    requestAnimationFrame((n) => this.frame(n))
  }

  /* ---------------- input ---------------- */
  private bind() {
    addEventListener('keydown', (e) => {
      const menuOpen = !$('#menu').hidden
      if (e.key === 'Escape') { if (menuOpen) this.menu(false); else if (this.locked) this.unlock(); return }
      if (e.key.toLowerCase() === 'm') { this.menu(!menuOpen); return }
      if (menuOpen) return
      if (e.key === 'ArrowUp' || e.key === 'PageUp') this.tune(this.ch % CHANNELS.length + 1)
      if (e.key === 'ArrowDown' || e.key === 'PageDown') this.tune(((this.ch - 2 + CHANNELS.length) % CHANNELS.length) + 1)
      if (/^[1-7]$/.test(e.key)) this.tune(Number(e.key))
      if (e.key === 'ArrowRight') this.step(1); if (e.key === 'ArrowLeft') this.step(-1)
      if (e.key === '0') { this.speed = this.speed ? 0 : 1; $('#osd-mode').textContent = this.speed ? 'PLAY ▶' : 'PAUSE ‖'; this.speed ? this.feed.play().catch(() => {}) : this.feed.pause() }
    })
    let wheel = 0
    addEventListener('wheel', (e) => { if (this.locked || !$('#menu').hidden) return; wheel += e.deltaY; if (Math.abs(wheel) > 260) { this.tune(wheel > 0 ? this.ch % CHANNELS.length + 1 : ((this.ch - 2 + CHANNELS.length) % CHANNELS.length) + 1); wheel = 0 } }, { passive: true })
    let sx = 0, sy = 0
    addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY }, { passive: true })
    addEventListener('touchend', (e) => { const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; if (Math.abs(dy) > 70 && Math.abs(dy) > Math.abs(dx)) { if (this.locked) this.unlock(); else this.tune(dy < 0 ? this.ch % CHANNELS.length + 1 : ((this.ch - 2 + CHANNELS.length) % CHANNELS.length) + 1) } else if (Math.abs(dx) > 70 && this.locked) this.step(dx < 0 ? 1 : -1) }, { passive: true })
    $('#lock').addEventListener('click', (e) => { if (!(e.target as HTMLElement).closest('.chyron, video')) this.unlock() })
    $('#menu').addEventListener('click', (e) => { const li = (e.target as HTMLElement).closest('li'); const h = (e.target as HTMLElement).closest('h3'); if (li) { this.menu(false); this.lock(li.dataset.id!) } else if (h?.dataset.ch) { this.menu(false); this.tune(Number(h.dataset.ch)) } })
    $('#menu-btn').addEventListener('click', () => this.menu($('#menu').hidden))
    $('#mute-btn').addEventListener('click', () => { const m = sfx.toggleMute(); $('#mute-btn').textContent = m ? 'SOUND OFF' : 'SOUND ON'; $('#mute-btn').setAttribute('aria-pressed', String(m)) })
    addEventListener('hashchange', () => { const id = this.itemFromHash(); const c = this.chFromHash(); if (id) this.lock(id); else if (c && c !== this.ch) this.tune(c) })
  }
  private chFromHash() { const m = location.hash.match(/^#ch\/(\d)/); return m ? Number(m[1]) : null }
  private itemFromHash() { const m = location.hash.match(/^#item\/(.+)$/); return m ? m[1] : null }
}

/* Snow: cheap analogue static on a small canvas, scaled up by CSS. */
class Snow {
  on = false
  private cx: CanvasRenderingContext2D
  private img: ImageData
  constructor(c: HTMLCanvasElement) { c.width = 160; c.height = 90; this.cx = c.getContext('2d')!; this.img = this.cx.createImageData(160, 90) }
  draw() {
    if (!this.on) return
    const d = this.img.data
    for (let i = 0; i < d.length; i += 4) { const v = Math.random() * 255; d[i] = v; d[i + 1] = v; d[i + 2] = v; d[i + 3] = 255 }
    this.cx.putImageData(this.img, 0, 0)
  }
}
