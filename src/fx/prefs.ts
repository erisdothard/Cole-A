/* Effect level, persisted. The site is aggressive by design — this is
   the escape hatch, and it respects the OS setting on first visit. */

export type FxLevel = 'full' | 'lite' | 'off'

const KEY = 'cvz.fx'
const ORDER: FxLevel[] = ['full', 'lite', 'off']

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/* Storage throws outright in private browsing and in embedded frames with
   site data blocked. It is a convenience here, never load-bearing, so a
   failure has to degrade to the default rather than take the boot with it. */
function read(): FxLevel | null {
  try {
    const stored = localStorage.getItem(KEY) as FxLevel | null
    return stored && ORDER.includes(stored) ? stored : null
  } catch {
    return null
  }
}

function write(level: FxLevel) {
  try {
    localStorage.setItem(KEY, level)
  } catch {
    /* preference lasts this session only */
  }
}

export function getFx(): FxLevel {
  return read() ?? (prefersReducedMotion() ? 'lite' : 'full')
}

export function setFx(level: FxLevel) {
  write(level)
  document.documentElement.dataset.fx = level
}

export function cycleFx(): FxLevel {
  const next = ORDER[(ORDER.indexOf(getFx()) + 1) % ORDER.length]
  setFx(next)
  return next
}

export function applyStoredFx() {
  document.documentElement.dataset.fx = getFx()
}
