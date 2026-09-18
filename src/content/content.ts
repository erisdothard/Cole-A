/* Everything the set says, and how the archive is organised into channels.
   The archive itself is src/content/archive.json (built from the Wix export
   by scripts/build-archive.py). Titles there are drafts for Cole to correct. */

import archive from './archive.json'

export type Item = {
  id: string
  kind: 'pull' | 'blank' | 'tx'
  channel: number
  title: string
  note: string
  image?: string
  thumb?: string
  video?: string
  poster?: string
  silent?: boolean // source video has no sound; the set keeps its static under it
  w: number
  h: number
}

export const ITEMS = archive as Item[]

export type Channel = { n: number; name: string; tag: string; filter: (i: Item) => boolean }

export const CHANNELS: Channel[] = [
  { n: 1, name: 'CVZ', tag: 'ALL PROGRAMMING', filter: () => true },
  { n: 2, name: 'ARTWORK', tag: 'POSTERS · FLYERS · STILLS', filter: (i) => i.kind === 'pull' },
  { n: 3, name: 'MERCH', tag: 'SHOP AT HOME', filter: (i) => i.kind === 'blank' },
  { n: 4, name: 'VIDEO', tag: 'TRANSMISSIONS', filter: (i) => i.kind === 'tx' },
  { n: 5, name: 'MUSIC', tag: 'KEN SABLE · DORSIA', filter: (i) => /ken sable|love songs|lonely|pink|dorsia/i.test(i.title + i.note) },
  { n: 6, name: 'OPERATOR', tag: 'WHO RUNS THIS SET', filter: (i) => /live|red|blue room|crowd/i.test(i.title) },
  { n: 7, name: 'CALL-IN', tag: 'BOOK CVZ', filter: (i) => i.kind === 'blank' && /jersey|tee/i.test(i.note) },
]

export const BIO = `After graduating at Indiana University in 2019 with an undergrad in Arts Management, I moved to Nashville to work for a recording studio. Following those few years of visual and audio work, I moved primarily to freelance work. Currently I do visual work for artists and brands, work in a screen printing shop, and am a full time DJ based out of Nashville.`

export const CONTACT = { email: 'cole.anderson4444@gmail.com', instagram: '@__c_v_z__', instagramUrl: 'https://www.instagram.com/__c_v_z__', line: 'Visual Design | Brand Enhancement' }

/* Things the set says on its own. Pops up like spam. */
export const SPAM: { text: string; tone?: 'warn' | 'err' | 'ok' }[] = [
  { text: 'PLEASE STAND BY' }, { text: 'TRACKING ▸▸▸', tone: 'warn' }, { text: 'ADJUST VERTICAL HOLD', tone: 'warn' },
  { text: 'NO ORIGINAL THOUGHT' }, { text: 'CVZ-TV 44 · NASHVILLE', tone: 'ok' }, { text: 'DINING · DANCING' },
  { text: 'INSERT TAPE', tone: 'err' }, { text: '12:00  12:00  12:00' }, { text: 'REWIND ◀◀' }, { text: 'TAPE END', tone: 'err' },
  { text: 'THIS IS ONLY A TEST', tone: 'warn' }, { text: 'NOW PLAYING · KEN SABLE', tone: 'ok' }, { text: 'SIGNAL WEAK', tone: 'warn' },
  { text: 'MADE IN NASHVILLE' }, { text: 'VISUAL DESIGN | BRAND ENHANCEMENT', tone: 'ok' }, { text: 'CALL NOW', tone: 'ok' },
  { text: 'DO NOT ADJUST YOUR SET' }, { text: 'COLOR BARS' }, { text: 'SP · 0:17:22' }, { text: '多爾西亞' },
  { text: 'REC ●', tone: 'err' }, { text: 'AUTO TRACKING FAILED', tone: 'warn' }, { text: 'STAY TUNED' },
]

export const TAPES = [
  { label: 'DORSIA', hand: 'dorsia mixes / flyers', filter: (i: Item) => /dorsia/i.test(i.title + i.note) },
  { label: 'KEN SABLE', hand: 'ken tapes 2024-26', filter: (i: Item) => /ken|pink|love songs|lonely/i.test(i.title + i.note) },
  { label: 'MERCH', hand: 'blanks · runs', filter: (i: Item) => i.kind === 'blank' },
  { label: 'RAW', hand: 'do not erase!!', filter: (i: Item) => i.kind === 'tx' },
]
