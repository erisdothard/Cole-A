/* Stage 1: the set in the room. You press POWER on a television, the tube
   warms up, and the camera pushes into the glass until you are inside it. */

import { sfx } from './audio'

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function armSet(onInside: () => Promise<void> | void): void {
  const power = document.getElementById('power') as HTMLButtonElement
  const led = document.getElementById('led') as HTMLElement
  const set = document.getElementById('set') as HTMLElement
  const room = document.getElementById('room') as HTMLElement
  const glass = document.getElementById('glass') as HTMLElement
  const off = document.getElementById('tube-off') as HTMLElement
  let fired = false

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
    set.style.transformOrigin = `${cx - set.getBoundingClientRect().left}px ${cy - set.getBoundingClientRect().top}px`
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
  addEventListener('keydown', (e) => { if (e.key === 'Enter' && !fired) go() })
}
