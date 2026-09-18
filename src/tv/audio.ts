/* Synthesised TV sound. No audio files: static, hum, relay click, degauss
   thunk and channel-change bursts are all generated, so nothing loads and
   nothing can 404. Everything starts from the POWER click (user gesture).

   Volume is a real TV volume — 0..10, remembered between visits — with MUTE
   on top of it. If the browser ever suspends the context behind our back
   (tab interruptions, output-device swaps, Safari's 'interrupted' state) it
   is re-armed on the next gesture, so the set never goes quietly dead. */

const VOL_KEY = 'cvz.vol'
const VOL_MAX = 10
const VOL_DEFAULT = 8

let ctx: AudioContext | null = null
let master: GainNode | null = null
let noiseBuf: AudioBuffer | null = null
let bed: AudioBufferSourceNode | null = null
let muted = false
let level = readLevel()

function readLevel(): number {
  try {
    const raw = localStorage.getItem(VOL_KEY)
    if (raw === null) return VOL_DEFAULT // Number(null) is 0, which would boot the set silent
    const v = Number(raw)
    return Number.isInteger(v) && v >= 0 && v <= VOL_MAX ? v : VOL_DEFAULT
  } catch { return VOL_DEFAULT }
}
function writeLevel(v: number) { try { localStorage.setItem(VOL_KEY, String(v)) } catch { /* this visit only */ } }

/** Perceptual taper: 10 is full, 8 sits around -3 dB, 1 is barely there. */
const gainFor = (v: number) => (v <= 0 ? 0 : Math.pow(v / VOL_MAX, 1.5))

function applyMaster() {
  if (!ctx || !master) return
  master.gain.cancelScheduledValues(ctx.currentTime)
  master.gain.setTargetAtTime(muted ? 0 : gainFor(level), ctx.currentTime, 0.02)
}

function wake() { if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {}) }

function ensure() {
  if (ctx) { wake(); return ctx }
  ctx = new AudioContext()
  // master → limiter → out. The limiter keeps the power-on thunk and a full
  // static burst from clipping at VOL 10.
  const lim = ctx.createDynamicsCompressor()
  lim.threshold.value = -6; lim.knee.value = 4; lim.ratio.value = 12; lim.attack.value = 0.002; lim.release.value = 0.12
  master = ctx.createGain(); master.gain.value = muted ? 0 : gainFor(level)
  master.connect(lim).connect(ctx.destination)
  const len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
  noiseBuf = buf
  addEventListener('pointerdown', wake, { capture: true, passive: true })
  addEventListener('keydown', wake, { capture: true })
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') wake() })
  wake()
  return ctx
}

/** A burst of filtered static: fast attack, held for most of `ms`, short tail. */
function noise(gain: number, ms: number, attack = 0.005, lp = 6000) {
  const c = ensure(); if (!master || !noiseBuf) return
  const t = c.currentTime, dur = ms / 1000, tail = Math.max(0.04, dur * 0.3)
  const src = c.createBufferSource(); src.buffer = noiseBuf; src.loop = true
  const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp
  const g = c.createGain()
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + attack)
  g.gain.setValueAtTime(gain, t + Math.max(attack, dur - tail)); g.gain.exponentialRampToValueAtTime(0.0005, t + dur)
  src.connect(f).connect(g).connect(master); src.start(t, Math.random() * 1.5); src.stop(t + dur + 0.05)
}

export const sfx = {
  /** POWER pressed: relay click, degauss thunk, mains hum and tube whine ramp in. */
  powerOn() {
    const c = ensure(); if (!master) return
    noise(0.5, 60, 0.001, 3000)
    const o = c.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(140, c.currentTime); o.frequency.exponentialRampToValueAtTime(40, c.currentTime + 0.35)
    const g = c.createGain(); g.gain.setValueAtTime(0.6, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.4)
    o.connect(g).connect(master); o.start(); o.stop(c.currentTime + 0.45)
    // 60 Hz hum with its 120 Hz harmonic, so it still registers on laptop speakers.
    for (const [hz, gain, type] of [[60, 0.03, 'triangle'], [120, 0.012, 'sine']] as const) {
      const h = c.createOscillator(); h.type = type; h.frequency.value = hz
      const hg = c.createGain(); hg.gain.setValueAtTime(0, c.currentTime); hg.gain.linearRampToValueAtTime(gain, c.currentTime + 2)
      h.connect(hg).connect(master); h.start()
    }
    const w = c.createOscillator(); w.type = 'sine'; w.frequency.value = 15625 / 2
    const wg = c.createGain(); wg.gain.setValueAtTime(0, c.currentTime); wg.gain.linearRampToValueAtTime(0.008, c.currentTime + 1.5)
    w.connect(wg).connect(master); w.start()
  },
  /** Continuous low static under the broadcast. */
  bed(on: boolean) {
    const c = ensure(); if (!master || !noiseBuf) return
    if (on && !bed) {
      bed = c.createBufferSource(); bed.buffer = noiseBuf; bed.loop = true
      const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2000; f.Q.value = 0.35
      const g = c.createGain(); g.gain.value = 0.12
      bed.connect(f).connect(g).connect(master); bed.start()
    } else if (!on && bed) { bed.stop(); bed = null }
  },
  static(ms = 320) { noise(0.5, ms, 0.01, 8000) },
  click() { noise(0.3, 40, 0.001, 2500) },
  blip() {
    const c = ensure(); if (!master) return
    const o = c.createOscillator(); o.type = 'square'; o.frequency.value = 880
    const g = c.createGain(); g.gain.setValueAtTime(0.06, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08)
    o.connect(g).connect(master); o.start(); o.stop(c.currentTime + 0.1)
  },
  /* ---- volume ---- */
  max: VOL_MAX,
  level() { return level },
  isMuted() { return muted },
  toggleMute(): boolean { muted = !muted; applyMaster(); return muted },
  /** Step the volume; any step un-mutes, like a real remote. */
  volume(delta: number): number {
    level = Math.max(0, Math.min(VOL_MAX, level + delta)); muted = false
    writeLevel(level); applyMaster(); return level
  },
}
