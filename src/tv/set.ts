/* Stage 1: the set in the room. A photographed 1990s TV/VCR combo with its
   front buttons live: VOL − / +, CH ▼ / ▲, EJECT, POWER — and the CVZ plate,
   which is the big POWER (Cole, 2026-10-21: so nobody has to hunt for it). The tube warms up,
   the set slides aside and a pile of five VHS tapes is next to it. Put one
   in its slot, the glass says PLAY, and the camera pushes into the screen
   until you are inside it. EJECT, from inside, pulls the camera back out
   to the room and the tape back onto the pile. */

import { sfx } from './audio'
import { TAPES, tapeFromHash, type Tape } from '../content/content'
import { applyCombo } from './combo'
import type { Shelf } from './shelf'

const $ = <T extends HTMLElement>(s: string) => document.querySelector(s) as T
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
const pad = (n: number) => String(n).padStart(2, '0')

/** pullOut brings the room back over the tube, zoomed in, then hands back a finish() to run once the tube is cleared. */
export type Stage = { pullOut(from: Tape): Promise<() => Promise<void>> }

export function armSet(shelf: Shelf, onInside: (t: Tape) => Promise<void> | void, onPrepare: (t: Tape) => void): Stage {
  const power = $<HTMLButtonElement>('#power'), powerSmall = $<HTMLButtonElement>('[data-btn="power"]')
  const led = $('#led'), set = $('#set'), room = $('#room'), glass = $('#glass'), off = $('#tube-off'), say = $('#glass-say')
  const btn = (id: string) => set.querySelector<HTMLButtonElement>(`[data-btn="${id}"]`)!
  let fired = false
  let gen = 0 // bumps on every pull-out, so a late write from an earlier push-in can be ignored
  let pick = (tapeFromHash()?.n ?? 1) - 1 // the tape CH ▼ / ▲ has selected
  // Any link only pre-selects its tape on the pile: nothing goes in until the viewer picks a tape (Cole, 2026-10-21).
  // Once it is in, the inside opens the piece or page the link named.

  applyCombo(set)

  /* ---- the room's volume: always on screen, with the STATIC switch next to it (off until pressed) ---- */
  function showVol() {
    const m = sfx.isMuted(), l = sfx.level()
    $('#room-vbar').innerHTML = Array.from({ length: sfx.max }, (_, i) => `<i class="${i < l ? 'on' : ''}"></i>`).join('')
    $('#room-vol-n').textContent = pad(l)
    $('.roomvol').classList.toggle('muted', m)
    $('#room-mute').textContent = m ? 'STATIC OFF' : 'STATIC ON'; $('#room-mute').setAttribute('aria-pressed', String(!m))
  }
  $('#room-mute').addEventListener('click', () => { sfx.toggleMute(); sfx.click(); showVol() })
  sfx.setLevel(5); showVol() // the intro is always at 5

  /* ---- what the glass says while the set waits ---- */
  const glassSay = (text: string | null, cls = '') => { say.hidden = !text; say.textContent = text ?? ''; say.className = `glass-say ${cls}` }
  let sayTimer = 0
  /** A front-button press flashes on the glass, then the glass goes back to what it was saying. */
  const flash = (text: string) => {
    if (!fired || set.classList.contains('busy')) return
    clearTimeout(sayTimer); glassSay(text, 'osd')
    sayTimer = window.setTimeout(() => glassSay(shelf.open ? 'INSERT TAPE' : null, 'blink'), 1400)
  }

  /* ---- the front buttons ---- */
  const press = (b: HTMLButtonElement) => { b.classList.add('down'); setTimeout(() => b.classList.remove('down'), 140) }
  const vol = (d: number) => { sfx.volume(d); sfx.click(); showVol(); flash(`VOL ${'▮'.repeat(sfx.level())}${'▯'.repeat(sfx.max - sfx.level())} ${pad(sfx.level())}`) }
  const ch = (d: number) => {
    pick = (pick + d + TAPES.length) % TAPES.length; sfx.blip()
    if (shelf.open) shelf.highlight(pick)
    const t = TAPES[pick]; flash(`CH ${pad(t.n)} · ${t.name}`)
  }
  btn('vol-dn').addEventListener('click', (e) => { press(e.currentTarget as HTMLButtonElement); vol(-1) })
  btn('vol-up').addEventListener('click', (e) => { press(e.currentTarget as HTMLButtonElement); vol(1) })
  btn('ch-dn').addEventListener('click', (e) => { press(e.currentTarget as HTMLButtonElement); ch(-1) })
  btn('ch-up').addEventListener('click', (e) => { press(e.currentTarget as HTMLButtonElement); ch(1) })
  btn('eject').addEventListener('click', (e) => { press(e.currentTarget as HTMLButtonElement); sfx.click(); flash(shelf.open ? 'NO TAPE' : 'EJECT ⏏') })
  shelf.onHighlight = (i) => { pick = i }
  addEventListener('hashchange', () => { const n = tapeFromHash()?.n; if (n && shelf.open && !shelf.busy) { pick = n - 1; shelf.highlight(pick) } })

  /* ---- going in ----
     The set shows snow until you are inside. A tape goes in, the glass says PLAY,
     and the camera is pushed into the snow (only the set moves: one GPU layer);
     the inside is built under the room while that runs, and at the seam it comes
     up out of the static with its own picture and the pieces moving. EJECT is the
     same shot backwards, into snow. One second each way. */
  const dark = $('#room-dark')
  const HOLD_MS = 320 // PLAY on the glass for a beat before the camera moves
  const IN_MS = 1000, IN_EASE = 'cubic-bezier(.5, 0, .75, .35)'    // pushed in: gathers speed into the seam
  const OUT_MS = 1000, OUT_EASE = 'cubic-bezier(.2, .6, .25, 1)'   // pulled back: fast off the seam, settling into the room
  const zoomed = () => {
    const r = glass.getBoundingClientRect(), s = set.getBoundingClientRect()
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2
    const scale = Math.max(innerWidth / r.width, innerHeight / r.height) * 1.1 // a little past the glass, so no bezel or corner is left at the seam
    set.style.transformOrigin = `${cx - s.left}px ${cy - s.top}px`
    return `translate(${innerWidth / 2 - cx}px, ${innerHeight / 2 - cy}px) scale(${scale})`
  }
  let zoomT = '' // the exact camera move used going in; EJECT plays it backwards

  /* ---- a tape goes in ---- */
  shelf.slot = $('#slot')
  shelf.onInsert = async (t) => {
    set.classList.add('busy'); clearTimeout(sayTimer)
    glassSay(`PLAY ▶  TAPE ${pad(t.n)}`, 'osd')
    await wait(HOLD_MS)
    glassSay(null); $('#shelf').classList.add('away')
    const g = gen
    room.classList.add('push'); room.classList.remove('pull')
    zoomT = zoomed()
    const push = set.animate([{ transform: 'none' }, { transform: zoomT }], { duration: IN_MS, easing: IN_EASE })
    push.finished.then(() => { set.style.transform = zoomT; push.cancel() }) // land, then commit: nothing is left running on the set
    dark.animate([{ opacity: 0 }, { opacity: 0.92 }], { duration: IN_MS * 0.8, easing: 'ease-in', fill: 'forwards' }) // the room falls away; the screen is the only light
    // Build the inside now, under the room, while the compositor runs the zoom.
    await new Promise(requestAnimationFrame)
    onPrepare(t)
    await push.finished
    // The seam: out of the static, the inside.
    await onInside(t)
    if (g === gen) { room.hidden = true; room.classList.add('gone') }
    shelf.hide()
    set.classList.remove('busy')
  }

  /* ---- the camera pushes in ----
     The set is laid out in its new place (bigger, closer, to one side, the pile beside it) and
     then drawn where it was, small across the room; one transform animation carries the camera
     in to it, and the tapes slide in beside it one after another as it arrives. No layout moves
     on screen, only the compositor. */
  const pushTo = async () => {
    const a = set.getBoundingClientRect()
    room.classList.add('tapes'); shelf.show(pick)
    const tapes = [...document.querySelectorAll<HTMLElement>('.vhs')], head = $('.shelf__head')
    const below = matchMedia('(max-width: 800px)').matches && !matchMedia('(max-height: 500px) and (orientation: landscape)').matches
    const from = below ? 'translateY(26px)' : 'translateX(44px)'
    tapes.forEach((v) => { v.style.opacity = '0' }); head.style.opacity = '0'
    const b = set.getBoundingClientRect()
    set.style.transformOrigin = '50% 50%'
    const back = `translate(${a.left + a.width / 2 - (b.left + b.width / 2)}px, ${a.top + a.height / 2 - (b.top + b.height / 2)}px) scale(${a.width / b.width})`
    set.style.transform = back
    await new Promise(requestAnimationFrame)
    const move = set.animate([{ transform: back }, { transform: 'none' }], { duration: 1000, easing: 'cubic-bezier(.5, .02, .18, 1)' }) // a dolly in: gathers, then settles
    tapes.forEach((v, i) => { v.style.opacity = ''; v.animate([{ opacity: 0, transform: from }, { opacity: 1, transform: 'none' }], { duration: 600, delay: 480 + i * 70, easing: 'cubic-bezier(.2, .7, .2, 1)', fill: 'backwards' }) })
    head.style.opacity = ''; head.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, delay: 760, fill: 'backwards' })
    await move.finished
    set.style.transform = ''; move.cancel()
    shelf.show(pick) // focus lands on the highlighted tape once it is there
  }

  /* ---- POWER ---- */
  const go = async () => {
    if (fired) return
    fired = true
    power.disabled = powerSmall.disabled = true; press(power)
    sfx.setLevel(5); showVol() // POWER and the room play at 5
    sfx.powerOn()
    led.classList.add('on')
    set.classList.add('on')

    // 1. Tube warm-up: a hot line, then it opens — and the camera starts in toward the set.
    off.classList.add('line')
    await wait(420)
    off.classList.add('open')
    sfx.warmUp(900)
    shelf.busy = true // the tapes slide in under where POWER was: a second tap must not put one in before the set has arrived
    const moving = pushTo()
    await wait(500)

    // 2. Snow on the glass while the camera is still coming in; the tapes are there beside the set as it arrives.
    glass.classList.add('snow')
    await wait(700)
    sfx.introOff(); sfx.bed(true) // the whine tails off, the low static takes over
    await moving
    shelf.busy = false
    glassSay('INSERT TAPE', 'blink')
  }

  power.addEventListener('click', go); powerSmall.addEventListener('click', go)
  addEventListener('keydown', (e) => { if (e.key === 'Enter' && !fired && !(e.target as HTMLElement).closest('button')) go() })

  /* ---- EJECT: the camera comes back out of the glass ---- */
  return {
    async pullOut(from: Tape) {
      gen++
      showVol() // the tape page may have changed STATIC / VOL
      set.classList.add('busy')
      // The room comes back already zoomed into the glass, snow on the screen, and the camera pulls out.
      room.hidden = false; room.classList.remove('gone')
      set.getAnimations().forEach((a) => a.cancel()); set.style.transform = zoomT
      await new Promise(requestAnimationFrame)
      const out = set.animate([{ transform: zoomT || 'none' }, { transform: 'none' }], { duration: OUT_MS, easing: OUT_EASE })
      out.finished.then(() => { set.style.transform = ''; out.cancel() })
      dark.getAnimations().forEach((a) => a.cancel())
      dark.animate([{ opacity: 0.92 }, { opacity: 0 }], { duration: OUT_MS, easing: 'ease-out', fill: 'forwards' })
      room.classList.add('pull'); room.classList.remove('push')
      return async () => {
        await out.finished.catch(() => {})
        set.style.transform = ''; dark.getAnimations().forEach((a) => a.cancel())
        glassSay('EJECT ⏏', 'blink'); sfx.static(220)
        await wait(260)
        glassSay('INSERT TAPE', 'blink'); $('#shelf').classList.remove('away')
        pick = TAPES.indexOf(from)
        set.classList.remove('busy')
        await shelf.eject(from)
      }
    },
  }
}
