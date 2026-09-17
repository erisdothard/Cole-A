/* ---------------------------------------------------------------
   CVZ // entry point.
   Turn on the machine, then hand the viewer the machine.
   --------------------------------------------------------------- */

import './styles/base.css'
import './styles/boot.css'
import './styles/system.css'
import './styles/fx.css'

import { runBoot } from './boot/boot'
import { applyStoredFx } from './fx/prefs'
import { mountNoise } from './fx/noise'
import { mountStream } from './fx/stream'
import { mountDrifters, startSystemChatter, toast } from './system/ambient'
import { mountTaskbar } from './system/taskbar'
import { WindowManager } from './system/windows'
import { SECTIONS, SITE } from './content/content'

applyStoredFx()
mountNoise(el<HTMLCanvasElement>('#noise'))

runBoot().then(enterSystem)

function enterSystem() {
  const system = el<HTMLElement>('#system')
  const toasts = el<HTMLElement>('#toasts')

  system.hidden = false
  mountStream(el<HTMLCanvasElement>('#stream'))

  let sync = () => {}
  const wm = new WindowManager(el<HTMLElement>('#desktop'), () => sync())
  sync = mountTaskbar(el<HTMLElement>('#taskbar'), wm)

  mountDrifters(el<HTMLElement>('#ambient'), wm)
  startSystemChatter(toasts)

  // Land somewhere, not on an empty desktop — the viewer should see the
  // work immediately, then wander.
  const landing = SECTIONS[0]
  if (landing) wm.open(landing)

  requestAnimationFrame(() => {
    system.dataset.live = '1'
    toast(toasts, SITE.welcome)
  })

  routeFromHash(wm)
  window.addEventListener('hashchange', () => routeFromHash(wm))
}

/* Deep links: /#merch opens that window on load, so the client can hand
   out a URL that lands somewhere specific without breaking the illusion. */
function routeFromHash(wm: WindowManager) {
  const id = location.hash.replace('#', '').toLowerCase()
  if (!id) return
  const section = SECTIONS.find((s) => s.id === id)
  if (section) wm.open(section)
}

function el<T extends Element>(sel: string): T {
  const node = document.querySelector<T>(sel)
  if (!node) throw new Error(`missing element: ${sel}`)
  return node
}
