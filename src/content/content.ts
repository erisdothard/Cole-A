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
  back?: string // second side of a garment, shown beside the front in focus
  thumb?: string
  video?: string
  poster?: string
  youtube?: string // Cole's own video, hosted on YouTube until he sends the master
  silent?: boolean // source video has no sound; the set keeps its static under it
  w: number
  h: number
}

export const ITEMS = archive as Item[]

/* The library. Cole's revision (2026-10-05): the set is not the navigation
   any more — four tapes are. Each tape holds folders, each folder holds
   pieces. Folder names are his examples; the sorting of pieces into them is
   a draft for him to correct (videos were sorted by watching their frames). */
export type Folder = { name: string; ids: string[]; page?: 'about' | 'contact' }
export type Tape = { n: number; slug: string; name: string; hand: string; tag: string; color: string; folders: Folder[] }

export const TAPES: Tape[] = [
  { n: 1, slug: 'video', name: 'VIDEO', hand: 'music videos · films · visuals', tag: 'TRANSMISSIONS', color: '#d8141c', folders: [
    { name: 'Music Videos', ids: ['synthetic-luv', 'tx-03', 'tx-06'] },
    { name: 'Short Films', ids: ['tx-04', 'tx-08', 'tx-10'] },
    { name: 'Visuals', ids: ['cvz-ident', 'tx-03-2', 'tx-12', 'tx-16', 'tx-23', 'tx-21', 'tx-11', 'tx-07', 'tx-02', 'tx-09', 'tx-01', 'tx-05'] },
  ] },
  { n: 2, slug: 'merch', name: 'MERCH', hand: 'blanks · runs · do not erase', tag: 'SHOP AT HOME', color: '#ff6a00', folders: [
    { name: 'Dorsia', ids: ['b-12', 'b-20', 'b-13', 'b-15', 'b-19', 'b-16'] },
    { name: 'Nashville Dance Show', ids: ['b-21'] },
    { name: 'Crvck Apparel', ids: ['b-18'] },
    { name: 'The 10th Muse', ids: ['b-17'] },
    { name: 'Dodger Bootleg', ids: ['b-14'] },
    { name: 'Religious Holidays', ids: ['b-11'] },
    { name: 'Hoodie', ids: ['b-10'] },
  ] },
  { n: 3, slug: 'design', name: 'DESIGN', hand: 'posters · branding · stills', tag: 'PRINTS · STILLS', color: '#1f4bff', folders: [
    { name: 'Posters', ids: ['p-20', 'p-04', 'p-02', 'p-17', 'p-14'] },
    { name: 'Branding', ids: ['p-24', 'p-06'] },
    { name: 'Graphics', ids: ['p-01', 'p-09', 'p-19', 'p-13'] },
    { name: 'Stills', ids: ['p-05', 'p-15', 'p-18', 'p-07', 'p-08', 'p-22'] },
  ] },
  { n: 4, slug: 'bio', name: 'BIO', hand: 'who runs this set', tag: 'OPERATOR', color: '#ffe83b', folders: [
    { name: 'About', ids: ['p-15', 'p-05', 'p-18'], page: 'about' },
    { name: 'Contact', ids: [], page: 'contact' },
  ] },
  // The music he makes pictures and videos for, and the night he DJs. Playlists go here when he sends links.
  { n: 5, slug: 'music', name: 'MUSIC', hand: 'ken sable · dorsia · synthetic luv', tag: 'NOW PLAYING', color: '#ff5ad2', folders: [
    { name: 'Ken Sable', ids: ['synthetic-luv', 'tx-03', 'p-01', 'p-09', 'p-19', 'tx-06', 'p-07', 'tx-11', 'tx-23'] },
    { name: 'Dorsia', ids: ['tx-03-2', 'p-02', 'p-17', 'p-14', 'tx-12', 'tx-16', 'p-22', 'b-12', 'b-20'] },
  ] },
]

/** Every piece on a tape, folder order. */
export const tapeItems = (t: Tape): Item[] => t.folders.flatMap((f) => f.ids).map((id) => ITEMS.find((i) => i.id === id)!).filter(Boolean)
/** Which tape (and folder) a piece lives on; a piece may sit in several folders, the first wins. */
/** The tape a URL points at: #tape/slug, #tape/slug/page, #item/id, or the old #ch/n. */
export function tapeFromHash(h = location.hash): Tape | null {
  const t = h.match(/^#tape\/([a-z]+)/); if (t) return TAPES.find((x) => x.slug === t[1]) ?? null
  const i = h.match(/^#item\/(.+)$/); if (i) return locate(i[1])?.tape ?? null
  const c = h.match(/^#ch\/(\d)/); if (c) return TAPES[Math.min(TAPES.length, Math.max(1, Number(c[1]))) - 1]
  return null
}
export function locate(id: string): { tape: Tape; folder: Folder } | null {
  for (const tape of TAPES) for (const folder of tape.folders) if (folder.ids.includes(id)) return { tape, folder }
  return null
}

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

