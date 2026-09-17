/* ---------------------------------------------------------------
   Life in the machine: files drifting through the background and the
   system talking to itself. Decorative — the site works without it.
   --------------------------------------------------------------- */

import { SECTIONS, SYSTEM_MESSAGES } from '../content/content'
import { prefersReducedMotion } from '../fx/prefs'
import type { WindowManager } from './windows'

const FILE_ICON = `
<svg viewBox="0 0 24 30" width="26" height="32" fill="none" stroke="currentColor" stroke-width="1.4">
  <path d="M2 1h13l7 7v21H2z" />
  <path d="M15 1v7h7" />
  <path d="M6 14h12M6 18h12M6 22h8" stroke-width="1" />
</svg>`

export function mountDrifters(host: HTMLElement, wm: WindowManager) {
  if (prefersReducedMotion()) return

  const nodes = SECTIONS.map((section) => {
    const node = document.createElement('button')
    node.className = 'drifter'
    node.type = 'button'
    node.tabIndex = -1           // the taskbar is the real navigation
    node.setAttribute('aria-hidden', 'true')
    node.innerHTML = `${FILE_ICON}<span>${section.label}</span>`
    node.addEventListener('click', () => wm.open(section))
    host.appendChild(node)

    return {
      node,
      x: Math.random() * 100,
      y: Math.random() * 100,
      vx: (Math.random() - 0.5) * 1.6,
      vy: (Math.random() - 0.5) * 1.2,
    }
  })

  let last = performance.now()
  const step = (now: number) => {
    const dt = Math.min((now - last) / 1000, 0.05)
    last = now

    for (const d of nodes) {
      d.x += d.vx * dt
      d.y += d.vy * dt
      if (d.x < -8) d.x = 104
      if (d.x > 104) d.x = -8
      if (d.y < -8) d.y = 104
      if (d.y > 104) d.y = -8
      d.node.style.transform = `translate3d(${d.x}vw, ${d.y}vh, 0)`
    }

    requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

export function startSystemChatter(host: HTMLElement) {
  const emit = () => {
    const msg = SYSTEM_MESSAGES[Math.floor(Math.random() * SYSTEM_MESSAGES.length)]
    if (msg) toast(host, msg.text, msg.level)
    window.setTimeout(emit, 7000 + Math.random() * 11000)
  }
  window.setTimeout(emit, 6000)
}

export function toast(host: HTMLElement, text: string, level?: 'warn' | 'err') {
  const node = document.createElement('div')
  node.className = 'toast'
  if (level) node.dataset.level = level
  node.textContent = text
  host.appendChild(node)

  // Never let the stack grow past a handful.
  while (host.children.length > 4) host.firstElementChild?.remove()

  window.setTimeout(() => {
    node.dataset.out = '1'
    window.setTimeout(() => node.remove(), 450)
  }, 4200)
}
