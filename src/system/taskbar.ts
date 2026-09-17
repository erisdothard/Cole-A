/* ---------------------------------------------------------------
   The taskbar is the promise the site makes to the viewer:
   however strange it gets, this row is always here, it always says
   what is open, and it always gets you back to the work in one click.
   --------------------------------------------------------------- */

import { SECTIONS, SITE } from '../content/content'
import { cycleFx, getFx } from '../fx/prefs'
import type { WindowManager } from './windows'

export function mountTaskbar(nav: HTMLElement, wm: WindowManager) {
  nav.replaceChildren()

  const home = el('button', 'tb-home', SITE.name)
  home.type = 'button'
  home.title = 'Close everything'
  home.addEventListener('click', () => wm.closeAll())
  nav.appendChild(home)

  const buttons = new Map<string, HTMLButtonElement>()
  for (const section of SECTIONS) {
    const b = el('button', 'tb-btn', section.label)
    b.type = 'button'
    b.dataset.id = section.id
    b.addEventListener('click', () => wm.toggle(section))
    buttons.set(section.id, b)
    nav.appendChild(b)
  }

  nav.appendChild(el('div', 'tb-spacer', ''))

  const meta = el('div', 'tb-meta', '')

  const fx = el('button', 'tb-fx', `FX:${getFx().toUpperCase()}`)
  fx.type = 'button'
  fx.title = 'Cycle visual effects'
  fx.addEventListener('click', () => { fx.textContent = `FX:${cycleFx().toUpperCase()}` })
  meta.appendChild(fx)

  const clock = el('span', 'tb-clock', '--:--:--')
  meta.appendChild(clock)
  const tick = () => { clock.textContent = new Date().toTimeString().slice(0, 8) }
  tick()
  window.setInterval(tick, 1000)

  nav.appendChild(meta)

  return function sync() {
    for (const [id, b] of buttons) b.dataset.open = wm.isOpen(id) ? '1' : '0'
  }
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K, className: string, text: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  node.className = className
  if (text) node.textContent = text
  return node
}
