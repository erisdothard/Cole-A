/* ---------------------------------------------------------------
   Visual check.
   Drives a real browser through the boot sequence and the system, and
   drops screenshots in shots/. On a site this animated, "it built" is
   not the same as "it works" — this is how we tell the difference.

     npm run build && npm run preview &
     node scripts/shoot.mjs
   --------------------------------------------------------------- */

import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'

const OUT = 'shots'
const URL = process.env.SHOOT_URL ?? 'http://127.0.0.1:4173/'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/* Sandboxes often ship a Chromium that Playwright's own version pin does
   not match. Use whatever is actually on disk before downloading one. */
const PREINSTALLED = [
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  '/opt/pw-browsers/chromium/chrome-linux/chrome',
]
const executablePath = PREINSTALLED.find((p) => existsSync(p))

await mkdir(OUT, { recursive: true })

const browser = await chromium.launch({
  ...(executablePath ? { executablePath } : {}),
  // Software GL, so the CRT shader renders on a machine with no GPU.
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})

const errors = []
const watch = (page) => {
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(`PAGEERROR: ${e.message}`))
  return page
}

const page = watch(await browser.newPage({ viewport: { width: 1440, height: 900 } }))
await page.goto(URL, { waitUntil: 'networkidle' })
await sleep(600)
await page.screenshot({ path: `${OUT}/01-power.png` })

await page.click('#powerBtn')
await sleep(900)
await page.screenshot({ path: `${OUT}/02-tube-on.png` })

await sleep(1800)
await page.screenshot({ path: `${OUT}/03-post.png` })

await page.waitForSelector('#system:not([hidden])', { timeout: 20000 })
await sleep(1400)
await page.screenshot({ path: `${OUT}/04-system.png` })

for (const id of ['video', 'art', 'bio']) {
  await page.click(`.tb-btn[data-id="${id}"]`)
  await sleep(350)
}
await sleep(800)
await page.screenshot({ path: `${OUT}/05-windows.png` })

const openWindows = await page.locator('.win').count()
const taskbarActive = await page.locator('.tb-btn[data-open="1"]').count()

// Drag a window by its title bar — proves the window manager, not just the paint.
const box = await page.locator('.win[data-id="art"] .win__bar').boundingBox()
await page.mouse.move(box.x + 60, box.y + 10)
await page.mouse.down()
await page.mouse.move(box.x + 360, box.y + 240, { steps: 20 })
await page.mouse.up()
await sleep(400)
await page.screenshot({ path: `${OUT}/06-dragged.png` })

const mobile = watch(await browser.newPage({
  viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
}))
await mobile.goto(URL, { waitUntil: 'networkidle' })
await mobile.click('#powerBtn')
await mobile.waitForSelector('#system:not([hidden])', { timeout: 20000 })
await sleep(1500)
await mobile.screenshot({ path: `${OUT}/07-mobile.png` })

await browser.close()

console.log(JSON.stringify({ openWindows, taskbarActive, errors }, null, 2))
if (openWindows !== 4 || taskbarActive !== 4 || errors.length) process.exit(1)
