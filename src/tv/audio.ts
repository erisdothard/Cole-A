/* Synthesised TV sound. No audio files: static, hum, relay click, degauss
   thunk and channel-change bursts are all generated, so nothing loads and
   nothing can 404. Everything starts from the POWER click (user gesture). */

let ctx: AudioContext | null = null
let master: GainNode | null = null
let noiseBuf: AudioBuffer | null = null
let hum: OscillatorNode | null = null
let bed: AudioBufferSourceNode | null = null
let bedGain: GainNode | null = null
let muted = false

function ensure() {
  if (ctx) return ctx
  ctx = new AudioContext()
  master = ctx.createGain(); master.gain.value = muted ? 0 : 0.9; master.connect(ctx.destination)
  const len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
  noiseBuf = buf
  return ctx
}

function noise(gain: number, ms: number, attack = 0.005, lp = 6000) {
  const c = ensure(); if (!master || !noiseBuf) return
  const src = c.createBufferSource(); src.buffer = noiseBuf; src.loop = true
  const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp
  const g = c.createGain(); g.gain.setValueAtTime(0, c.currentTime); g.gain.linearRampToValueAtTime(gain, c.currentTime + attack); g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + ms / 1000)
  src.connect(f).connect(g).connect(master); src.start(); src.stop(c.currentTime + ms / 1000 + 0.05)
}

export const sfx = {
  /** POWER pressed: relay click, degauss thunk, tube whine ramps in. */
  powerOn() {
    const c = ensure(); if (!master) return
    noise(0.5, 60, 0.001, 3000)
    const o = c.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(140, c.currentTime); o.frequency.exponentialRampToValueAtTime(40, c.currentTime + 0.35)
    const g = c.createGain(); g.gain.setValueAtTime(0.6, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.4)
    o.connect(g).connect(master); o.start(); o.stop(c.currentTime + 0.45)
    hum = c.createOscillator(); hum.type = 'triangle'; hum.frequency.value = 60
    const hg = c.createGain(); hg.gain.setValueAtTime(0, c.currentTime); hg.gain.linearRampToValueAtTime(0.025, c.currentTime + 2)
    hum.connect(hg).connect(master); hum.start()
    const w = c.createOscillator(); w.type = 'sine'; w.frequency.value = 15625 / 2
    const wg = c.createGain(); wg.gain.setValueAtTime(0, c.currentTime); wg.gain.linearRampToValueAtTime(0.006, c.currentTime + 1.5)
    w.connect(wg).connect(master); w.start()
  },
  /** Continuous low static under the broadcast. */
  bed(on: boolean) {
    const c = ensure(); if (!master || !noiseBuf) return
    if (on && !bed) {
      bed = c.createBufferSource(); bed.buffer = noiseBuf; bed.loop = true
      const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 0.4
      bedGain = c.createGain(); bedGain.gain.value = 0.035
      bed.connect(f).connect(bedGain).connect(master); bed.start()
    } else if (!on && bed) { bed.stop(); bed = null }
  },
  static(ms = 320) { noise(0.35, ms, 0.01, 8000) },
  click() { noise(0.25, 40, 0.001, 2500) },
  blip() {
    const c = ensure(); if (!master) return
    const o = c.createOscillator(); o.type = 'square'; o.frequency.value = 880
    const g = c.createGain(); g.gain.setValueAtTime(0.05, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08)
    o.connect(g).connect(master); o.start(); o.stop(c.currentTime + 0.1)
  },
  toggleMute(): boolean { muted = !muted; if (master) master.gain.value = muted ? 0 : 0.9; return muted },
  isMuted() { return muted },
}
