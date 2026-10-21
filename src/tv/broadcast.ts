/* Stage 2: inside the tube, with a tape in. Its pieces float through as
   television furniture, the set talking to itself, with the tape number
   always in the corner so nobody is lost. INDEX is every tape's folders,
   the one that is in opened up; EJECT hands back to the set, which pulls
   the camera out to the room and the shelf. */

import { ITEMS, SPAM, TAPES, BIO, CONTACT, tapeItems, locate, tapeFromHash, type Item, type Tape, type Folder } from '../content/content'
import { sfx } from './audio'
import { drift, makeCard, makeFile, makeFragment, makeScreen, makeWindow, type Obj } from './objects'
import { getFx } from '../fx/prefs'
import type { Shelf } from './shelf'

const $ = <T extends HTMLElement>(s: string) => document.querySelector(s) as T
const pick = <T>(a: T[]) => a[Math.floor(Math.random() * a.length)]
const pad = (n: number) => String(n).padStart(2, '0')
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

export class Broadcast {
  private tube = $('#tube')
  private feed = $<HTMLVideoElement>('#feed')
  private host = $('#objects')
  private objs: Obj[] = []
  private tape: Tape | null = null
  private locked: Item | null = null
  private cursor: Item | null = null // last thing tuned in to; NEXT / PREV pick up from here
  private t0 = performance.now()
  private last = this.t0
  private feedTimer = 0
  private spamTimer = 0
  private volTimer = 0
  private speed = getFx() === 'off' ? 0 : getFx() === 'lite' ? 0.35 : 1
  private hover: Obj | null = null
  private snow = new Snow($<HTMLCanvasElement>('#snow'))
  private bound = false
  onEject: (from: Tape) => Promise<(() => Promise<void>) | void> | void = () => {}

  constructor(private shelf: Shelf) {}

  /** The set hands over with a tape in. First time through it also wires the controls. */
  /** Build the inside while the camera is still moving: the tube sits fully under the (opaque) room, so the
      work happens off-screen and the zoom — a compositor animation — never waits for it. */
  prepare(t: Tape) {
    if (this.tube.hidden) this.link = location.hash // the link the viewer came in on, before play() writes this tape's own
    if (!this.bound) { this.bound = true; this.bind(); sfx.bed(true); requestAnimationFrame((n) => this.frame(n)) }
    this.play(t, true)
    this.host.style.opacity = '0'
    this.tube.classList.add('waiting') // built but not painted, nothing playing or drifting, until the camera arrives
    this.tube.querySelectorAll('video').forEach((v) => v.pause())
    this.tube.hidden = false
    this.tube.classList.add('on')
  }
  /** The camera has arrived: same footage, same frame as the set's screen, and the pieces come in. */
  async start(t: Tape) {
    if (this.tape !== t || this.tube.hidden) this.prepare(t)
    // Open the piece or page the link named, if it is on the tape the viewer picked.
    const h = tapeFromHash(this.link) === t ? this.link : '', id = this.itemFromHash(h), page = h.match(/^#tape\/bio\/(about|contact)/)?.[1] as Folder['page'] | undefined
    this.link = ''
    this.burst(300) // the cut from the set's snow to the picture
    this.feed.animate([{ transform: 'scale(1.18)' }, { transform: 'scale(1)' }], { duration: 1100, easing: 'cubic-bezier(.22, .9, .3, 1)' }) // the push's momentum carried through the seam
    this.tube.classList.remove('waiting')
    this.tube.querySelectorAll<HTMLVideoElement>('#objects video').forEach((v) => v.play().catch(() => {}))
    this.host.style.opacity = ''
    this.arrive()
    this.placeText(); $('#spam').querySelectorAll<HTMLElement>('.spam__msg').forEach((s) => this.fitMsg(s))
    if (id) this.lock(id); else if (page) this.page(page)
  }
  /** The floating pieces come in out of the camera's momentum: scaled up, settling into place, decelerating. */
  private arrive() {
    const ease = 'cubic-bezier(.16, 1, .3, 1)'
    this.host.animate([{ transform: 'scale(1.26)', opacity: 0 }, { transform: 'scale(1.08)', opacity: 0.7, offset: 0.4 }, { transform: 'scale(1)', opacity: 1 }], { duration: 900, easing: ease })
    for (const el of this.tube.querySelectorAll<HTMLElement>('.osd, .nav, .volctl')) el.animate([{ opacity: 0 }, { opacity: 0, offset: 0.5 }, { opacity: 1 }], { duration: 900, easing: 'ease-out' })
  }

  /* ---------------- a tape playing ---------------- */
  private play(t: Tape, silent = false) {
    this.enterTape(t)
    if (!silent) { this.burst(320); sfx.static(300) }
    $('#osd-ch').classList.remove('flash'); void $('#osd-ch').offsetWidth; $('#osd-ch').classList.add('flash')
    if ($('#lock').hidden) history.replaceState(null, '', `#tape/${t.slug}`)
    this.say(`PLAY ▶ ${t.name} · ${t.tag}`, 'ok')
  }
  /** Everything that changes when a tape goes in, with no fanfare: lock() and page() use it for deep links. */
  private enterTape(t: Tape) {
    this.tape = t; this.cursor = null; this.hover = null
    sfx.setLevel(4); this.showVolume() // every tape page opens at 4; a video in focus plays at that, static on or off
    this.tube.style.setProperty('--tape-c', t.color)
    $('#osd-num').textContent = `TAPE ${pad(t.n)}`; $('#osd-name').textContent = t.name; $('#osd-where').textContent = `${tapeItems(t).length} PIECES`
    $('#osd-help').textContent = '◀ ▶ NEXT · M INDEX · E EJECT'
    this.populate(t)
    this.nextFeed()
  }

  /** The tape comes out: the tube goes dark and the set pulls the camera back to the room. */
  async eject() {
    if (!this.tape || this.shelf.busy || this.ejecting) return
    this.ejecting = true
    const from = this.tape
    $('#spam').innerHTML = ''; $('#osd-hover').hidden = true
    this.unlock(); this.index(false)
    history.replaceState(null, '', '#')
    // The pieces drop away into static; the room comes back over it, zoomed in, and the camera pulls out.
    this.burst(320)
    await this.host.animate([{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(1.2)', opacity: 0 }], { duration: 300, easing: 'cubic-bezier(.45, 0, .7, .4)', fill: 'forwards' }).finished
    const finish = await this.onEject(from)
    this.host.getAnimations().forEach((a) => a.cancel()); this.feed.getAnimations().forEach((a) => a.cancel())
    this.host.innerHTML = ''; this.objs = []; this.hover = null
    this.tape = null; this.feed.pause(); clearTimeout(this.feedTimer)
    this.tube.classList.remove('on'); this.tube.hidden = true
    this.ejecting = false
    await finish?.()
  }
  private ejecting = false
  private link = ''

  private populate(t: Tape) {
    this.host.innerHTML = ''; this.objs = []
    const pool = tapeItems(t)
    const small = innerWidth < 800
    const count = Math.min(pool.length, small ? 7 : 13)
    let live = 0, page = 200
    for (let i = 0; i < count; i++) {
      const item = pool[(i * 7 + t.n) % pool.length]
      let o: Obj
      if (item.kind === 'tx') { o = makeScreen(item, live < (small ? 1 : 3)); if (item.video) live++ }
      else if (item.kind === 'blank') o = makeCard(item)
      else o = i % 3 === 2 ? makeFile(item, page++) : makeWindow(item)
      this.mount(o)
    }
    for (let i = 0; i < (small ? 3 : 6); i++) this.mount(makeFragment())
    this.texts = []
    if (t.slug === 'bio') {
      this.mount(this.textWindow('OPERATOR.TXT', `<p>${BIO}</p><p><b>${CONTACT.line}</b></p>`, 0.22))
      this.mount(this.textWindow('CALL-IN', `<p><b>BOOK CVZ</b></p><p><a href="mailto:${CONTACT.email}">${CONTACT.email}</a><br><a href="${CONTACT.instagramUrl}" target="_blank" rel="noopener">${CONTACT.instagram}</a></p>`, 0.62, 0.68))
    }
  }

  /** The screen between the top-left controls and the bottom bar: what a reader can see clear of the buttons. */
  private safeBand() {
    const top = Math.max(...['.volctl', '#osd-ch'].map((s) => $(s).getBoundingClientRect().bottom), 0) + 12
    const nav = $('.nav').getBoundingClientRect()
    return { top, bottom: (nav.height ? nav.top : innerHeight) - 12 }
  }
  /** On a phone the BIO windows sit inside that band, measured, so neither covers the other or the controls:
      stacked when upright, side by side when the phone is on its side. A body too long for its room scrolls. */
  private placeText() {
    const short = innerHeight < 500
    if ((innerWidth >= 800 && !short) || !this.texts.length) return
    const band = this.safeBand(), room = band.bottom - band.top, gap = 12
    const fit = (o: Obj, max: number) => {
      const body = o.el.querySelector<HTMLElement>('.obj__text')!, bar = o.el.offsetHeight - body.offsetHeight
      body.style.maxHeight = `${Math.max(60, max - bar)}px`; o.h = o.el.offsetHeight
      // More text than room: MORE ▼ at the foot of the window until it has been scrolled to the end.
      const more = () => o.el.classList.toggle('more', body.scrollTop + body.clientHeight < body.scrollHeight - 4)
      more(); body.onscroll = more
    }
    if (short) {
      const w = Math.min(460, (innerWidth - gap * 3) / 2)
      this.texts.forEach((o, i) => { o.w = w; o.el.style.width = w + 'px'; fit(o, room); o.x = gap + i * (w + gap); o.y = band.top })
      return
    }
    const [read, call] = this.texts
    fit(call, room); fit(read, room - call.h - gap)
    let y = band.top
    for (const o of this.texts) { o.x = (innerWidth - o.w) / 2; o.y = y; y += o.h + gap }
  }
  private texts: Obj[] = []

  private textWindow(title: string, html: string, y = 0.3, x = 0.5): Obj {
    const o = makeFragment(); o.kind = 'window'
    o.el.className = 'obj obj--window obj--text'; o.el.innerHTML = `<div class="obj__bar"><span>${title}</span><i>TAPE ${pad(this.tape?.n ?? 0)}</i></div><div class="obj__text">${html}</div>`
    o.w = Math.min(460, innerWidth - 40); o.h = 260; o.el.style.width = o.w + 'px'; o.el.style.zIndex = '9'
    o.x = innerWidth * x - o.w / 2; o.y = innerHeight * y; o.vx = 0; o.vy = 0; o.held = true
    this.texts.push(o)
    return o
  }

  private mount(o: Obj) {
    this.objs.push(o); this.host.appendChild(o.el)
    o.el.addEventListener('pointerenter', () => { this.hover = o; o.held = true; o.el.classList.add('hot'); if (o.item) { const f = locate(o.item.id)?.folder.name ?? ''; $('#osd-hover').hidden = false; $('#osd-hover').textContent = `▶ SELECT · ${o.item.title.toUpperCase()}${f && f.toLowerCase() !== o.item.title.toLowerCase() ? ` · ${f.toUpperCase()}` : ''}`; sfx.blip() } })
    o.el.addEventListener('pointerleave', () => { if (this.hover === o) this.hover = null; if (!o.el.classList.contains('obj--text')) o.held = false; o.el.classList.remove('hot'); $('#osd-hover').hidden = true })
    o.el.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest('a')) return; if (o.item) this.lock(o.item.id) })
  }

  /* ---------------- the feed ---------------- */
  private nextFeed() {
    clearTimeout(this.feedTimer)
    const vids = this.tape ? tapeItems(this.tape).filter((i) => i.video) : []
    const pool = vids.length ? vids : ITEMS.filter((i) => i.video)
    const v = pick(pool)
    if (this.feed.dataset.id !== v.id) { this.feed.dataset.id = v.id; this.feed.src = v.video! }
    this.feed.play().catch(() => {})
    $('#osd-mode').textContent = this.speed ? 'PLAY ▶' : 'PAUSE ‖'
    if (this.speed) this.feedTimer = window.setTimeout(() => { if (this.tape) { this.burst(120); this.nextFeed() } }, 14000 + Math.random() * 8000)
  }

  /* ---------------- lock (tune in to one thing) ---------------- */
  lock(id: string) {
    const item = ITEMS.find((i) => i.id === id); if (!item) return
    const here = this.tape && tapeItems(this.tape).includes(item) // a piece can sit on two tapes; stay on the one that is in
    const where = here ? { tape: this.tape!, folder: this.tape!.folders.find((f) => f.ids.includes(item.id))! } : locate(item.id)
    if (where && where.tape !== this.tape) this.enterTape(where.tape)
    this.index(false)
    this.locked = item; this.cursor = item
    this.burst(160); sfx.static(160)
    const m = $('#lock-media')
    m.innerHTML = item.youtube ? `<iframe src="https://www.youtube-nocookie.com/embed/${item.youtube}?autoplay=1&rel=0&modestbranding=1" title="${esc(item.title)}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>` // its own player, its own volume
      : item.video ? `<video src="${item.video}" poster="${item.poster ?? ''}" playsinline loop></video>`
      : `<img src="${item.image}" alt="${esc(item.title)}">` + (item.back ? `<img src="${item.back}" alt="${esc(item.title)} — back">` : '')
    m.classList.toggle('pair', !!item.back); m.classList.remove('text')
    // A video in focus is the one thing on the set you actually hear: the static (if on) ducks fast, its own sound fades up to the TV volume.
    const v = m.querySelector('video'), sound = (!!v && !item.silent) || !!item.youtube
    if (v && !sound) v.muted = true
    if (v && sound) { sfx.attach(v); v.play().catch(() => { v.muted = true; v.play().catch(() => {}) }) } else { sfx.detach(); v?.play().catch(() => {}) }
    sfx.duck(sound)
    $('#lk-title').textContent = item.title.toUpperCase(); $('#lk-note').textContent = item.note.toUpperCase()
    const list = this.lockList(), idx = list.indexOf(item)
    $('#lk-count').textContent = `${pad(idx + 1)} / ${list.length} · TAPE ${pad(this.tape?.n ?? 0)} ${this.tape?.name ?? ''} / ${(where?.folder.name ?? '').toUpperCase()}${item.silent ? ' · MOS' : ''}`
    $('#osd-where').textContent = (where?.folder.name ?? '').toUpperCase()
    $('#lk-tc').textContent = `SP ${this.tc()}`
    $('#lock').hidden = false; this.tube.classList.add('locked'); $('#osd-hover').hidden = true
    $('#osd-mode').textContent = 'PAUSE ‖'
    history.replaceState(null, '', `#item/${item.id}`)
  }
  /** A page on the BIO tape — About or Contact — read like a piece. */
  page(p: Folder['page']) {
    const bio = TAPES.find((t) => t.slug === 'bio')!
    if (this.tape !== bio) this.enterTape(bio)
    this.index(false); this.locked = null
    sfx.detach(); sfx.duck(false); this.burst(160); sfx.click()
    const m = $('#lock-media'); m.classList.remove('pair'); m.classList.add('text')
    m.innerHTML = p === 'about' ? `<div class="page"><h2>OPERATOR</h2><p>${BIO}</p><p><b>${CONTACT.line}</b></p></div>`
      : `<div class="page"><h2>CALL-IN</h2><p><b>BOOK CVZ</b></p><p><a href="mailto:${CONTACT.email}">${CONTACT.email}</a></p><p><a href="${CONTACT.instagramUrl}" target="_blank" rel="noopener">${CONTACT.instagram}</a></p><p>${CONTACT.line} · NASHVILLE</p></div>`
    $('#lk-title').textContent = p === 'about' ? 'COLE ANDERSON' : 'CONTACT'; $('#lk-note').textContent = p === 'about' ? 'VISUAL DESIGN · SCREEN PRINT · DJ' : CONTACT.email.toUpperCase()
    $('#lk-count').textContent = `TAPE ${pad(bio.n)} BIO / ${p!.toUpperCase()}`; $('#osd-where').textContent = p!.toUpperCase(); $('#lk-tc').textContent = `SP ${this.tc()}`
    $('#lock').hidden = false; this.tube.classList.add('locked'); $('#osd-hover').hidden = true
    history.replaceState(null, '', `#tape/bio/${p}`)
  }
  private lockList() { return this.tape ? tapeItems(this.tape) : ITEMS }
  unlock() {
    if ($('#lock').hidden) return
    this.locked = null; $('#lock').hidden = true; $('#lock-media').innerHTML = ''; this.tube.classList.remove('locked')
    sfx.detach(); sfx.duck(false)
    $('#osd-mode').textContent = 'PLAY ▶'; $('#osd-where').textContent = this.tape ? `${tapeItems(this.tape).length} PIECES` : ''
    this.burst(120); sfx.click(); history.replaceState(null, '', this.tape ? `#tape/${this.tape.slug}` : '#')
  }
  /** NEXT / PREV along the tape: picks up where you last were, or from its first piece. */
  step(d: number) {
    if (!this.tape) return
    const l = this.lockList(), cur = this.locked ?? this.cursor
    const i = cur && l.includes(cur) ? l.indexOf(cur) : d > 0 ? -1 : 0
    this.lock(l[(i + d + l.length) % l.length].id)
  }

  /* ---------------- index: every tape's folders, the one that is in opened up ---------------- */
  index(on: boolean) {
    const m = $('#index'); if (on === !m.hidden) return
    if (on && !this.tape) return
    m.hidden = !on; sfx.click(); this.tube.classList.toggle('indexing', on)
    if (!on) return
    const cur = locate(this.cursor?.id ?? '')?.folder ?? this.tape!.folders[0]
    const isOpen = (t: Tape, f: Folder) => t === this.tape && f === cur // one folder open at a time, as he drew it; the rest are a click away
    $('#index-title').textContent = `CVZ-TV · INDEX · TAPE ${pad(this.tape!.n)} IN`
    // Each tape drops down (Cole, 2026-10-21): the one that is in starts open, the rest folded away; ▶ PLAY swaps the tape.
    $('#index-tree').innerHTML = TAPES.map((t) => `<div class="tree__tape${t === this.tape ? ' in open' : ''}" data-tape="${t.slug}" style="--tape-c:${t.color}">
      <div class="tree__head"><button class="tree__root" type="button" aria-expanded="${t === this.tape}"><i>▸</i><b>${t.name}</b><em>TAPE ${pad(t.n)} · ${tapeItems(t).length} PCS</em></button>${t === this.tape ? '' : `<button class="tree__play" type="button" aria-label="Play tape ${pad(t.n)}, ${t.name}">▶ PLAY</button>`}</div>
      ${t.folders.map((f, fi) => {
        const items = f.ids.map((id) => ITEMS.find((i) => i.id === id)!).filter(Boolean)
        const last = fi === t.folders.length - 1
        return `<div class="tree__folder${isOpen(t, f) ? ' open' : ''}" data-f="${fi}"${f.page ? ` data-page="${f.page}"` : ''}>
        <button class="tree__row" type="button" aria-expanded="${isOpen(t, f)}"><i>${last ? '└' : '├'}──</i><b>▸</b><span>${f.name.toUpperCase()}</span><em>${f.page ? 'TXT' : `${pad(items.length)} PCS`}</em></button>
        <ul class="tree__list">${f.page ? `<li class="tree__item" data-page="${f.page}"><i>${last ? ' ' : '│'}&nbsp;&nbsp;&nbsp;└──</i><span>${f.page === 'about' ? 'READ' : 'CALL-IN'}</span><em>${f.page === 'about' ? 'OPERATOR.TXT' : CONTACT.email}</em></li>` : ''}${items.map((i, k) => `<li class="tree__item" data-id="${i.id}"><i>${last ? ' ' : '│'}&nbsp;&nbsp;&nbsp;${k === items.length - 1 ? '└' : '├'}──</i><span>${i.title}</span><em>${i.note}</em></li>`).join('')}</ul>
      </div>`
      }).join('')}
    </div>`).join('') + `<button class="tree__eject" type="button" id="tree-eject">⏏ EJECT · BACK TO THE SHELF</button>`
    this.preview(this.cursor ?? tapeItems(this.tape!)[0])
  }
  private preview(item: Item | undefined) {
    const v = $('#index-view'); if (!item) { v.innerHTML = ''; return }
    v.innerHTML = `<div class="view__crt"><img src="${item.poster ?? item.thumb}" alt=""></div><div class="view__cap"><b>${item.title.toUpperCase()}</b><span>${item.note.toUpperCase()}</span><span>${(locate(item.id)?.folder.name ?? '').toUpperCase()} · ${item.video || item.youtube ? 'VIDEO' : item.kind === 'blank' ? 'MERCH' : 'PRINT'}</span></div>`
  }

  /* ---------------- the set talking to itself ---------------- */
  private say(text: string, tone?: 'warn' | 'err' | 'ok') {
    if (this.locked && !tone) return // reading a piece: the set does not talk over it
    const s = document.createElement('div'); s.className = 'spam__msg' + (tone ? ` spam__msg--${tone}` : '')
    const lane = this.tape?.slug === 'bio' // the bio tape is for reading too: toasts keep to the bottom-left lane
    s.textContent = text; s.style.left = `${lane ? 4 + Math.random() * 14 : 8 + Math.random() * 60}%`; s.style.top = `${lane ? 78 + Math.random() * 8 : 20 + Math.random() * 60}%`
    $('#spam').appendChild(s); sfx.blip()
    this.fitMsg(s)
    setTimeout(() => s.classList.add('out'), 2200 + Math.random() * 1800); setTimeout(() => s.remove(), 4600)
  }

  /** Keep a message whole on screen and clear of the controls, the other messages and the BIO windows. Where the
      dice put it somewhere it does not fit, it is re-dealt inside; if nowhere is clear, it is dropped.
      Before the tube is showing it has no size yet; start() fits those once it is. */
  private fitMsg(s: HTMLElement) {
    // Layout sizes, not the on-screen rect: the pop-in animation scales the message while it lands.
    const w = s.offsetWidth, h = s.offsetHeight, box = $('#spam').getBoundingClientRect(), band = this.safeBand(), m = 12
    if (!w) return
    const avoid = [
      ...[...$('#spam').querySelectorAll<HTMLElement>('.spam__msg')].filter((o) => o !== s).map((o) => o.getBoundingClientRect()),
      ...this.texts.map((o) => ({ left: box.left + o.x - 8, right: box.left + o.x + o.w + 8, top: box.top + o.y - 8, bottom: box.top + o.y + o.h + 8 })), // where they are placed, not yet drawn (#spam and #objects share a box; #objects may be mid-zoom)
    ]
    const fits = (x: number, y: number) => x >= m && x + w <= innerWidth - m && y >= band.top && y + h <= band.bottom
      && avoid.every((r) => x + w <= r.left || r.right <= x || y + h <= r.top || r.bottom <= y)
    let x = box.left + s.offsetLeft, y = box.top + s.offsetTop, i = 0
    for (; i < 16 && !fits(x, y); i++) { x = m + Math.random() * (innerWidth - 2 * m - w); y = band.top + Math.random() * (band.bottom - band.top - h) }
    if (!fits(x, y)) { s.remove(); return }
    s.style.left = `${x - box.left}px`; s.style.top = `${y - box.top}px`
  }

  /* ---------------- volume ---------------- */
  private volume(delta: number) { sfx.volume(delta); sfx.click(); this.showVolume() }
  /** The green bar every TV drew: shows on change. The STATIC button next to VOL shows the switch. */
  private showVolume() {
    const o = $('#osd-vol'), m = sfx.isMuted(), l = sfx.level()
    $('#osd-vol-bar').innerHTML = Array.from({ length: sfx.max }, (_, i) => `<i class="${i < l ? 'on' : ''}"></i>`).join('')
    $('#osd-vol-n').textContent = String(l).padStart(2, '0')
    o.hidden = false
    $('#mute-btn').textContent = m ? 'STATIC OFF' : 'STATIC ON'; $('#mute-btn').setAttribute('aria-pressed', String(!m))
    clearTimeout(this.volTimer); this.volTimer = window.setTimeout(() => { o.hidden = true }, 1800)
  }

  private burst(ms: number) { const s = $('#static'); s.classList.add('on'); this.snow.on = true; setTimeout(() => { s.classList.remove('on'); this.snow.on = false }, ms) }
  private tc() { const s = Math.floor((performance.now() - this.t0) / 1000); return `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}` }

  /* ---------------- loop ---------------- */
  private frame(now: number) {
    const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now; const t = (now - this.t0) / 1000
    const quiet = this.tube.hidden || this.tube.classList.contains('waiting') || !$('#index').hidden // out in the room, or reading the index: the set keeps its mouth shut
    if (!this.locked && !quiet) drift(this.objs, dt, t, this.speed)
    if (Math.floor(t * 2) % 2 === 0) $('#osd-tc').textContent = `SP ${this.tc()}`
    this.spamTimer -= dt
    if (this.spamTimer <= 0 && this.speed && !quiet) { const m = pick(SPAM); this.say(m.text, m.tone); this.spamTimer = 3.5 + Math.random() * 5 }
    if (this.speed && !quiet && Math.random() < dt * 0.08) { this.tube.classList.add('jitter'); setTimeout(() => this.tube.classList.remove('jitter'), 120 + Math.random() * 200) }
    this.snow.draw()
    requestAnimationFrame((n) => this.frame(n))
  }

  /* ---------------- input ---------------- */
  private bind() {
    addEventListener('keydown', (e) => {
      if (this.tube.hidden || this.shelf.open || this.shelf.busy || (e.target as HTMLElement).closest('a, input')) return
      const indexOpen = !$('#index').hidden, k = e.key
      if (k === 'Escape') { if (indexOpen) this.index(false); else if (!$('#lock').hidden) this.unlock(); else this.eject(); return }
      if (k.toLowerCase() === 'm') { this.index(!indexOpen); return }
      if (k.toLowerCase() === 'e') { this.eject(); return }
      if (k === '+' || k === '=') this.volume(1); if (k === '-' || k === '_') this.volume(-1)
      if (indexOpen) return
      if (/^[1-9]$/.test(k) && Number(k) <= TAPES.length) { const t = TAPES[Number(k) - 1]; if (t !== this.tape) { this.unlock(); this.play(t) } return }
      if (k === 'ArrowRight') this.step(1); if (k === 'ArrowLeft') this.step(-1)
      if (k === '0') { this.speed = this.speed ? 0 : 1; $('#osd-mode').textContent = this.speed ? 'PLAY ▶' : 'PAUSE ‖'; this.speed ? this.feed.play().catch(() => {}) : this.feed.pause() }
    })
    let sx = 0, sy = 0
    addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY }, { passive: true })
    addEventListener('touchend', (e) => {
      if (this.tube.hidden) return
      const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy
      if (Math.abs(dy) > 70 && Math.abs(dy) > Math.abs(dx)) { if (!$('#lock').hidden) this.unlock() }
      else if (Math.abs(dx) > 70 && this.locked) this.step(dx < 0 ? 1 : -1)
    }, { passive: true })
    $('#lock').addEventListener('click', (e) => { if (!(e.target as HTMLElement).closest('.chyron, video, iframe, .page')) this.unlock() })
    $('#index').addEventListener('click', (e) => {
      const el = e.target as HTMLElement, li = el.closest<HTMLElement>('.tree__item'), row = el.closest<HTMLElement>('.tree__row'), root = el.closest<HTMLElement>('.tree__root'), play = el.closest<HTMLElement>('.tree__play')
      if (li?.dataset.id) { this.index(false); this.lock(li.dataset.id) }
      else if (li?.dataset.page) { this.index(false); this.page(li.dataset.page as Folder['page']) }
      else if (row) { const f = row.parentElement!; const open = f.classList.toggle('open'); row.setAttribute('aria-expanded', String(open)); sfx.blip() }
      else if (root) { const tp = root.closest<HTMLElement>('.tree__tape')!; const open = tp.classList.toggle('open'); root.setAttribute('aria-expanded', String(open)); sfx.blip() }
      else if (play) { const t = TAPES.find((x) => x.slug === play.closest<HTMLElement>('.tree__tape')!.dataset.tape)!; if (t !== this.tape) { this.index(false); this.unlock(); this.play(t) } }
      else if (el.closest('#tree-eject')) this.eject()
    })
    $('#index').addEventListener('pointerover', (e) => { const li = (e.target as HTMLElement).closest<HTMLElement>('.tree__item'); if (li?.dataset.id) this.preview(ITEMS.find((i) => i.id === li.dataset.id)) })
    $('#index-btn').addEventListener('click', () => this.index($('#index').hidden))
    $('#eject-btn').addEventListener('click', () => this.eject())
    $('#next-btn').addEventListener('click', () => { this.index(false); this.step(1) }); $('#prev-btn').addEventListener('click', () => { this.index(false); this.step(-1) })
    $('#vol-up').addEventListener('click', () => this.volume(1)); $('#vol-dn').addEventListener('click', () => this.volume(-1))
    $('#mute-btn').addEventListener('click', () => { sfx.toggleMute(); sfx.click(); this.showVolume() })
    addEventListener('hashchange', () => {
      if (this.tube.hidden || this.shelf.busy) return
      const h = location.hash, id = this.itemFromHash(h), t = tapeFromHash(h), page = h.match(/^#tape\/bio\/(about|contact)/)?.[1] as Folder['page'] | undefined
      if (id) { if (this.locked?.id !== id) this.lock(id) }
      else if (page) this.page(page)
      else if (t && t !== this.tape) { this.unlock(); this.play(t) }
      else if (t && t === this.tape && !$('#lock').hidden) this.unlock()
      else if (!t && this.tape) this.eject()
    })
  }
  private itemFromHash(h = location.hash) { const m = h.match(/^#item\/(.+)$/); return m ? m[1] : null }
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
