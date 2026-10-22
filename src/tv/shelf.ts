/* The pile: four VHS tapes next to the set, lying spine-out the way tapes
   sit on a shelf. The only navigation. Pick one, it slides out of the pile
   and into the set's own slot, and the set takes you inside. EJECT brings
   the tape — and you — back out. Cole's revisions of 2026-10-05 and -21:
   nothing goes in until the viewer picks a tape. */

import { TAPES, tapeItems, type Tape } from '../content/content'
import { sfx } from './audio'
import { getFx } from '../fx/prefs'

const $ = <T extends HTMLElement>(s: string) => document.querySelector(s) as T
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
const pad = (n: number) => String(n).padStart(2, '0')
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

export class Shelf {
  private el = $('#shelf')
  private row = $('#shelf-row')
  private hi = 0 // highlighted tape index
  busy = false
  private motion = getFx() === 'off' ? 0 : getFx() === 'lite' ? 0.5 : 1
  /** The set's tape slot: where an inserted tape goes. */
  slot: HTMLElement | null = null
  onInsert: (t: Tape) => Promise<void> | void = () => {}
  onHighlight: (i: number) => void = () => {}
  /** Where POWER was, and until when: on a phone the pile lands right under it, so a second POWER tap is not a tape. */
  guard: { rect: DOMRect; until: number } | null = null
  private downOn = -1 // the tape a fresh press started on, since the pile was last opened

  constructor() {
    this.row.innerHTML = TAPES.map((t, i) => `<div class="vhs" role="option" tabindex="-1" data-i="${i}" style="--tape-c:${t.color}" aria-label="${esc(t.name)}, ${tapeItems(t).length} pieces">
        <i class="vhs__grip"></i>
        <span class="vhs__label"><b>${t.name}</b><em>${t.hand}</em></span>
        <span class="vhs__n">T-${pad(t.n)}<small>${tapeItems(t).length} · SP</small></span>
        <i class="vhs__grip"></i>
      </div>`).join('')
    this.tapes().forEach((v, i) => {
      v.addEventListener('pointerenter', () => { if (!this.busy && matchMedia('(hover: hover)').matches) { this.highlight(i); sfx.blip() } })
      v.addEventListener('pointerdown', () => { if (!this.busy) this.downOn = i })
      v.addEventListener('click', (e) => {
        // Only a tap that started on this tape, after the pile was ready, and not on POWER's old spot while it is still warm.
        const fresh = this.downOn === i || e.detail === 0 // detail 0: keyboard / assistive "click", no pointer involved
        this.downOn = -1
        const g = this.guard, r = g?.rect
        const onPower = !!r && performance.now() < g!.until && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom
        if (fresh && !onPower) this.insert(i)
      })
    })
    addEventListener('keydown', (e) => {
      if (!this.open || this.busy || (e.target as HTMLElement).closest('a, input')) return
      const k = e.key
      if (k === 'ArrowDown' || k === 'ArrowRight') this.move(1)
      if (k === 'ArrowUp' || k === 'ArrowLeft') this.move(-1)
      if ((k === 'Enter' || k === ' ') && !(e.target as HTMLElement).closest('button')) { e.preventDefault(); this.insert() }
      if (/^[1-9]$/.test(k) && Number(k) <= TAPES.length) this.insert(Number(k) - 1)
    })
  }

  private tapes() { return [...this.row.querySelectorAll<HTMLElement>('.vhs')] }

  show(hi = this.hi) {
    this.el.hidden = false; this.highlight(hi); this.downOn = -1
    this.slot?.classList.remove('loaded', 'loading')
    this.tapes().forEach((v) => { v.getAnimations().forEach((a) => a.cancel()); v.style.transform = ''; v.style.visibility = ''; v.classList.remove('in') })
    this.tapes()[hi]?.focus({ preventScroll: true })
  }
  hide() { this.el.hidden = true }
  get open() { return !this.el.hidden }

  highlight(i: number) {
    this.hi = (i + TAPES.length) % TAPES.length
    this.tapes().forEach((v, k) => { v.classList.toggle('hi', k === this.hi); v.setAttribute('aria-selected', String(k === this.hi)); v.tabIndex = k === this.hi ? 0 : -1 })
    const t = TAPES[this.hi]
    $('#shelf-say').textContent = `TAPE ${pad(t.n)} · ${t.name} · ${t.tag}`
    this.onHighlight(this.hi)
  }
  move(d: number) { this.highlight(this.hi + d); sfx.blip(); this.tapes()[this.hi]?.focus({ preventScroll: true }) }

  /** The chosen tape slides out of the pile, lines up with the slot, and goes in. */
  async insert(i = this.hi, quick = false) {
    if (this.busy || !this.open) return
    this.busy = true; this.highlight(i)
    const v = this.tapes()[i], t = TAPES[i], slot = this.slot
    sfx.click()
    const dur = quick || !this.motion || !slot ? 0 : 900 / (this.motion || 1)
    try {
      if (dur && slot) {
        const a = v.getBoundingClientRect(), b = slot.getBoundingClientRect()
        const k = (b.width * 0.94) / a.width // the spine is as wide as the slot
        const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2)
        v.classList.add('in')
        // out of the pile, over to the slot, then in: it recedes into the dark behind the flap
        await v.animate([
          { transform: 'translate(0,0) scale(1)', filter: 'brightness(1)' },
          { transform: `translate(${a.width * 0.16}px, 0) scale(1)`, filter: 'brightness(1)', offset: 0.16 },
          { transform: `translate(${dx}px, ${dy}px) scale(${k})`, filter: 'brightness(1)', offset: 0.7 },
          { transform: `translate(${dx}px, ${dy}px) scale(${k})`, filter: 'brightness(1)', offset: 0.76 },
          { transform: `translate(${dx}px, ${dy}px) scale(${k * 0.84})`, filter: 'brightness(.15)' },
        ], { duration: dur, easing: 'cubic-bezier(.4,0,.2,1)' }).finished
      }
      v.style.visibility = 'hidden' // it is in the set now; show() puts it back on the pile
      slot?.classList.add('loading'); sfx.click(); sfx.static(dur ? 260 : 100) // the deck takes it
      await wait(dur ? 320 : 60)
      slot?.classList.remove('loading'); slot?.classList.add('loaded')
      await this.onInsert(t) // busy stays up through the push-in: no second tape until we are inside
    } catch (e) { if ((e as DOMException).name !== 'AbortError') throw e; slot?.classList.remove('loading', 'loaded') } finally { this.busy = false }
  }

  /** Back out of the slot and onto the pile. */
  async eject(from: Tape) {
    if (this.busy) return
    this.busy = true
    this.show(TAPES.indexOf(from)); this.slot?.classList.add('loading')
    sfx.click(); sfx.static(220)
    const v = this.tapes()[TAPES.indexOf(from)]
    try { if (this.motion) { v.classList.add('in'); await v.animate([{ transform: 'translateX(-40px)', opacity: 0 }, { transform: 'translateX(0)', opacity: 1 }], { duration: 340, easing: 'cubic-bezier(.2,.8,.2,1)' }).finished } }
    catch (e) { if ((e as DOMException).name !== 'AbortError') throw e }
    finally { v.classList.remove('in'); this.slot?.classList.remove('loading'); this.busy = false }
  }
}
