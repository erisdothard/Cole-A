/* Synthesised TV sound. No audio files: static, hum, relay click, degauss
   thunk and channel-change bursts are all generated, so nothing loads and
   nothing can 404. Everything starts from the POWER click (user gesture).

   Volume is a real TV volume — 0..10, remembered between visits. STATIC is a
   switch on top of it for the set's own sound (the hiss bed, hum, bursts):
   ON by default but low, OFF if the viewer wants quiet. The power-up and the
   buttons are never gated: click, thunk, the whine climbing and the warm-up
   static play at the volume, the whine dies away once the glass says INSERT
   TAPE and a low static bed takes over, and every button click still answers
   with STATIC off. A video in focus always plays at the TV volume,
   static on or off; when static is on it crossfades under the video's sound.
   If the browser ever suspends the context behind our back
   (tab interruptions, output-device swaps, Safari's 'interrupted' state) it
   is re-armed on the next gesture, so the set never goes quietly dead. */

const VOL_KEY = 'cvz.vol'
const VOL_MAX = 10
const VOL_DEFAULT = 8

let ctx: AudioContext | null = null
let master: GainNode | null = null // every synth source lands here; ducks under a playing video
let out: GainNode | null = null    // the volume knob, gated by the STATIC switch
let voice: GainNode | null = null  // the volume knob alone: the power-up and the button clicks go here, STATIC or not
let whineG: GainNode | null = null // the intro whine, so push-in can fade it
let media: HTMLMediaElement | null = null // the video in focus, if any
let noiseBuf: AudioBuffer | null = null
let bed: AudioBufferSourceNode | null = null
let muted = false // the static switch: ON by default, low
let level = readLevel()
let fadeId = 0 // the video fade in flight, so a VOL press or a detach can cancel it
const FADE_MS = 350 // static down, video up
const BED_GAIN = 0.05 // the low static under everything (was 0.12: too much)

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
  if (ctx && out && voice) {
    out.gain.cancelScheduledValues(ctx.currentTime)
    out.gain.setTargetAtTime(muted ? 0 : gainFor(level), ctx.currentTime, 0.02)
    voice.gain.cancelScheduledValues(ctx.currentTime)
    voice.gain.setTargetAtTime(gainFor(level), ctx.currentTime, 0.02)
  }
  if (media) { fadeId++; media.muted = false; media.volume = gainFor(level) }
}

/** Bring a video's own sound up from silence to the TV volume over FADE_MS. */
function fadeIn(el: HTMLMediaElement) {
  const id = ++fadeId, t0 = performance.now()
  el.muted = false; el.volume = 0
  const step = (now: number) => {
    if (id !== fadeId || media !== el) return
    const k = Math.min(1, (now - t0) / FADE_MS)
    el.volume = gainFor(level) * (1 - Math.pow(1 - k, 2)) // ease-out: most of it early, no bump at the end
    if (k < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

function wake() { if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {}) }

function ensure() {
  if (ctx) { wake(); return ctx }
  ctx = new AudioContext()
  // master → limiter → out. The limiter keeps the power-on thunk and a full
  // static burst from clipping at VOL 10.
  const lim = ctx.createDynamicsCompressor()
  lim.threshold.value = -6; lim.knee.value = 4; lim.ratio.value = 12; lim.attack.value = 0.002; lim.release.value = 0.12
  out = ctx.createGain(); out.gain.value = muted ? 0 : gainFor(level)
  voice = ctx.createGain(); voice.gain.value = gainFor(level); voice.connect(lim)
  master = ctx.createGain(); master.gain.value = 1
  master.connect(out).connect(lim).connect(ctx.destination)
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
function noise(gain: number, ms: number, attack = 0.005, lp = 6000, dest: GainNode | null = master) {
  const c = ensure(); dest ??= master; if (!dest || !noiseBuf) return
  const t = c.currentTime, dur = ms / 1000, tail = Math.max(0.04, dur * 0.3)
  const src = c.createBufferSource(); src.buffer = noiseBuf; src.loop = true
  const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp
  const g = c.createGain()
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + attack)
  g.gain.setValueAtTime(gain, t + Math.max(attack, dur - tail)); g.gain.exponentialRampToValueAtTime(0.0005, t + dur)
  src.connect(f).connect(g).connect(dest); src.start(t, Math.random() * 1.5); src.stop(t + dur + 0.05)
}

export const sfx = {
  /** POWER pressed: relay click, degauss thunk, the whine climbing — the intro, so it plays STATIC or not — and the mains hum (gated). */
  powerOn() {
    const c = ensure(); if (!master || !voice) return
    noise(0.5, 60, 0.001, 3000, voice)
    const o = c.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(140, c.currentTime); o.frequency.exponentialRampToValueAtTime(40, c.currentTime + 0.35)
    const g = c.createGain(); g.gain.setValueAtTime(0.6, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.4)
    o.connect(g).connect(voice); o.start(); o.stop(c.currentTime + 0.45)
    // 60 Hz hum with its 120 Hz harmonic, so it still registers on laptop speakers.
    for (const [hz, gain, type] of [[60, 0.03, 'triangle'], [120, 0.012, 'sine']] as const) {
      const h = c.createOscillator(); h.type = type; h.frequency.value = hz
      const hg = c.createGain(); hg.gain.setValueAtTime(0, c.currentTime); hg.gain.linearRampToValueAtTime(gain, c.currentTime + 2)
      h.connect(hg).connect(master); h.start()
    }
    // The line whine, half the horizontal rate: climbs in over the warm-up and tails off at INSERT TAPE.
    const w = c.createOscillator(); w.type = 'sine'; w.frequency.value = 15625 / 2
    whineG = c.createGain(); whineG.gain.setValueAtTime(0, c.currentTime); whineG.gain.linearRampToValueAtTime(0.008, c.currentTime + 1.5)
    w.connect(whineG).connect(voice); w.start()
  },
  /** The warm-up static on the glass, before INSERT TAPE: part of the intro, plays STATIC or not. */
  warmUp(ms: number) { noise(0.3, ms, 0.01, 8000, voice) },
  /** The intro is over: the whine dies away. */
  introOff() {
    if (!ctx || !whineG) return
    whineG.gain.cancelScheduledValues(ctx.currentTime); whineG.gain.setTargetAtTime(0, ctx.currentTime, 0.4)
  },
  /** Continuous low static, from INSERT TAPE onward: fades in over a second, sits well under a voice. */
  bed(on: boolean) {
    const c = ensure(); if (!master || !noiseBuf) return
    if (on && !bed) {
      bed = c.createBufferSource(); bed.buffer = noiseBuf; bed.loop = true
      const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2000; f.Q.value = 0.35
      const g = c.createGain(); g.gain.setValueAtTime(0, c.currentTime); g.gain.linearRampToValueAtTime(BED_GAIN, c.currentTime + 1)
      bed.connect(f).connect(g).connect(master); bed.start()
    } else if (!on && bed) { bed.stop(); bed = null }
  },
  static(ms = 320) { noise(0.5, ms, 0.01, 8000) },
  click() { noise(0.3, 40, 0.001, 2500, voice) }, // buttons answer with STATIC off too
  blip() {
    const c = ensure(); if (!master) return
    const o = c.createOscillator(); o.type = 'square'; o.frequency.value = 880
    const g = c.createGain(); g.gain.setValueAtTime(0.06, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08)
    o.connect(g).connect(voice ?? master!); o.start(); o.stop(c.currentTime + 0.1)
  },
  /* ---- a video in focus ---- */
  /** Hand the set a video: it fades up to the TV volume and follows VOL from here on. STATIC does not touch it. */
  attach(el: HTMLMediaElement) { media = el; fadeIn(el) },
  detach() { fadeId++; media = null },
  /** Pull the static and hum down under a playing video — quickly, so the two cross — and back up when it goes. */
  duck(on: boolean) {
    if (!ctx || !master) return
    master.gain.cancelScheduledValues(ctx.currentTime)
    master.gain.setTargetAtTime(on ? 0.06 : 1, ctx.currentTime, on ? FADE_MS / 3000 : 0.5)
  },
  /* ---- volume ---- */
  max: VOL_MAX,
  level() { return level },
  /** Static switch: true while the set's own sound is off. The default. */
  isMuted() { return muted },
  toggleMute(): boolean { muted = !muted; applyMaster(); return muted },
  /** Park the level (the intro and each tape page set their own; the static switch is left alone). */
  setLevel(v: number) { level = Math.max(0, Math.min(VOL_MAX, Math.round(v))); writeLevel(level); applyMaster() },
  /** Set the volume outright (the VOL knob). */
  setVolume(v: number) { level = Math.max(0, Math.min(VOL_MAX, Math.round(v))); writeLevel(level); applyMaster() },
  /** Step the volume. */
  volume(delta: number): number {
    level = Math.max(0, Math.min(VOL_MAX, level + delta))
    writeLevel(level); applyMaster(); return level
  },
}
