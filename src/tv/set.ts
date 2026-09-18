/* Stage 1: the set in the room. A photographed 1978 console with the
   controls live on top of it: turn the channel dial, VOL, BRIGHT and
   V-HOLD, then press POWER. The tube warms up and the camera pushes into
   the glass until you are inside it. */

import { sfx } from './audio'
import { Knob, applyBright, readBright, setVHold } from './knobs'
import { CHANNELS } from '../content/content'
import { CABINETS, applyCabinet, readCabinet, writeCabinet } from './cabinets'

const $ = <T extends HTMLElement>(s: string) => document.querySelector(s) as T
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function armSet(onInside: () => Promise<void> | void): void {
  const power = $<HTMLButtonElement>('#power')
  const led = $('#led'), set = $('#set'), room = $('#room'), glass = $('#glass'), off = $('#tube-off')
  let fired = false

  /* ---- which set ---- */
  let cab = readCabinet()
  const showCab = () => { applyCabinet(set, CABINETS[cab]); $('#switch-name').textContent = CABINETS[cab].name; $('#switch-n').textContent = `${cab + 1} / ${CABINETS.length}` }
  showCab()
  $('#switch-set').addEventListener('click', async () => {
    if (fired) return
    set.classList.add('swap'); sfx.click(); await wait(180)
    cab = (cab + 1) % CABINETS.length; writeCabinet(cab); showCab()
    await new Promise((r) => { const img = $<HTMLImageElement>('.set__photo'); if (img.complete) r(null); else img.addEventListener('load', () => r(null), { once: true }) })
    set.classList.remove('swap')
  })

  /* ---- the controls ---- */
  const chFromHash = () => { const m = location.hash.match(/^#ch\/(\d)/); const n = m ? Number(m[1]) : 1; return n >= 1 && n <= CHANNELS.length ? n : 1 }
  const knobs = {
    ch: new Knob($('#dial'), { label: 'Channel', min: 1, max: CHANNELS.length, value: chFromHash(), sweep: 300, onChange: (n) => {
      if (!/^#item\//.test(location.hash)) history.replaceState(null, '', `#ch/${n}`)
    } }),
    vol: new Knob($('#k-vol'), { label: 'Volume', min: 0, max: sfx.max, value: sfx.level(), onChange: (v) => sfx.setVolume(v) }),
    bright: new Knob($('#k-bright'), { label: 'Brightness', min: 0, max: 10, value: readBright(), onChange: applyBright }),
    vhold: new Knob($('#k-vhold'), { label: 'Vertical hold', min: -5, max: 5, value: 0, onChange: (v) => {
      setVHold(v); glass.classList.toggle('rolling', v !== 0); glass.classList.toggle('rolling--up', v < 0)
      glass.style.setProperty('--roll-dur', `${(6 - Math.abs(v)) * 0.32}s`)
    } }),
  }
  applyBright(readBright())
  addEventListener('hashchange', () => { if (!fired) knobs.ch.set(chFromHash(), true) })

  /* ---- POWER ---- */
  const go = async () => {
    if (fired) return
    fired = true
    power.disabled = true
    sfx.powerOn()
    led.classList.add('on')
    set.classList.add('on')

    // 1. Tube warm-up: a hot line, then it opens.
    off.classList.add('line')
    await wait(420)
    off.classList.add('open')
    sfx.static(900)
    await wait(500)

    // 2. Snow on the glass; the picture is fighting to come in.
    glass.classList.add('snow')
    await wait(700)

    // 3. Push in. The set grows until the glass is the whole world.
    const r = glass.getBoundingClientRect()
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2
    const scale = Math.max(innerWidth / r.width, innerHeight / r.height) * 1.12
    const s = set.getBoundingClientRect()
    set.style.transformOrigin = `${cx - s.left}px ${cy - s.top}px`
    room.classList.add('push')
    set.style.transform = `translate(${innerWidth / 2 - cx}px, ${innerHeight / 2 - cy}px) scale(${scale})`
    await wait(1900)

    // 4. We are inside. Hand over while the snow still covers the seam.
    await onInside()
    room.classList.add('gone')
    await wait(600)
    room.hidden = true
  }

  power.addEventListener('click', go)
  addEventListener('keydown', (e) => { if (e.key === 'Enter' && !fired && !(e.target as HTMLElement).closest('[role=slider]')) go() })
}
