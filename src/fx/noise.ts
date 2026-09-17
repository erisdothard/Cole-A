/* Animated film grain. One small tile of random pixels, redrawn a few
   times a second and stretched over the viewport — far cheaper than
   generating noise at full resolution. */

const TILE_W = 480
const TILE_H = 270
const FPS = 12

export function mountNoise(canvas: HTMLCanvasElement) {
  canvas.width = TILE_W
  canvas.height = TILE_H

  const ctx = canvas.getContext('2d', { alpha: true })
  if (!ctx) return

  const image = ctx.createImageData(TILE_W, TILE_H)
  let last = 0

  const step = (now: number) => {
    requestAnimationFrame(step)
    if (now - last < 1000 / FPS) return
    last = now

    const d = image.data
    for (let i = 0; i < d.length; i += 4) {
      const v = (Math.random() * 255) | 0
      d[i] = v
      d[i + 1] = v
      d[i + 2] = v
      d[i + 3] = 255
    }
    ctx.putImageData(image, 0, 0)
  }

  requestAnimationFrame(step)
}
