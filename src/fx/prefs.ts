/* Effect level, persisted. The site is aggressive by design — this is
   the escape hatch, and it respects the OS setting on first visit. */

export type FxLevel = 'full' | 'lite' | 'off'

const KEY = 'cvz.fx'
const ORDER: FxLevel[] = ['full', 'lite', 'off']

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function getFx(): FxLevel {
  const stored = localStorage.getItem(KEY) as FxLevel | null
  if (stored && ORDER.includes(stored)) return stored
  return prefersReducedMotion() ? 'lite' : 'full'
}

export function setFx(level: FxLevel) {
  localStorage.setItem(KEY, level)
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
