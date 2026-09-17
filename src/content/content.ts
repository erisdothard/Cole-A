/* ---------------------------------------------------------------
   THE ARCHIVE
   Every word and asset the site shows lives here. Swap this file and
   the whole machine re-skins itself — nothing else needs to change.

   >>> PLACEHOLDER CONTENT. Replace with the real CVZ archive. <<<
   --------------------------------------------------------------- */

export type Card = {
  title: string
  sub?: string
  /** Path under /public, or a full URL. Falls back to a generated plate. */
  image?: string
  href?: string
}

export type Row = { title: string; meta?: string; href?: string }

export type Body =
  | { kind: 'grid'; lede?: string; cards: Card[] }
  | { kind: 'list'; lede?: string; rows: Row[] }
  | { kind: 'video'; lede?: string; embeds: { title: string; youtubeId: string }[] }
  | { kind: 'text'; paragraphs: string[] }
  | { kind: 'contact'; lede?: string; email: string; links: Row[] }

export type Section = {
  id: string
  /** Taskbar label — keep it to ~8 characters. */
  label: string
  /** Fake filesystem path shown in the window title bar. */
  path: string
  /** Opening size hint in px; clamped to the viewport at runtime. */
  size: { w: number; h: number }
  body: Body
}

export const SITE = {
  name: 'CVZ',
  system: 'CVZ SYSTEMS',
  biosVersion: 'v2.04',
  /** Shown once the system finishes loading. */
  welcome: 'SYSTEM ONLINE — 6 ARCHIVES MOUNTED',
}

export const SECTIONS: Section[] = [
  {
    id: 'merch',
    label: 'MERCH',
    path: 'C:\\CVZ\\ARCHIVE\\MERCH',
    size: { w: 560, h: 420 },
    body: {
      kind: 'grid',
      lede: 'Physical objects manufactured inside the system. Limited runs, no restocks.',
      cards: [
        { title: 'TERMINAL TEE', sub: 'RUN 001 / SOLD OUT' },
        { title: 'DEGAUSS HOODIE', sub: 'RUN 002' },
        { title: 'SCANLINE CAP', sub: 'RUN 002' },
        { title: 'STATIC LONGSLEEVE', sub: 'RUN 003' },
        { title: 'UPLINK STICKER SET', sub: 'RUN 003' },
        { title: 'ARCHIVE TOTE', sub: 'RUN 004' },
      ],
    },
  },
  {
    id: 'video',
    label: 'VIDEO',
    path: 'C:\\CVZ\\ARCHIVE\\VIDEO',
    size: { w: 640, h: 480 },
    body: {
      kind: 'video',
      lede: 'Incoming transmissions. Signal quality varies.',
      embeds: [
        // Replace youtubeId with the real uploads.
        { title: 'TRANSMISSION 01', youtubeId: 'mXuDxhtBxNY' },
      ],
    },
  },
  {
    id: 'art',
    label: 'ART',
    path: 'C:\\CVZ\\ARCHIVE\\ARTWORK',
    size: { w: 600, h: 440 },
    body: {
      kind: 'grid',
      lede: 'Stills pulled from the buffer.',
      cards: [
        { title: 'PLATE / 001' }, { title: 'PLATE / 002' },
        { title: 'PLATE / 003' }, { title: 'PLATE / 004' },
        { title: 'PLATE / 005' }, { title: 'PLATE / 006' },
      ],
    },
  },
  {
    id: 'music',
    label: 'MUSIC',
    path: 'C:\\CVZ\\ARCHIVE\\AUDIO',
    size: { w: 460, h: 360 },
    body: {
      kind: 'list',
      lede: 'Audio sectors.',
      rows: [
        { title: 'TRACK NAME 01', meta: '03:24' },
        { title: 'TRACK NAME 02', meta: '02:51' },
        { title: 'TRACK NAME 03', meta: '04:07' },
        { title: 'TRACK NAME 04', meta: '03:12' },
      ],
    },
  },
  {
    id: 'bio',
    label: 'BIO',
    path: 'C:\\CVZ\\SYSTEM\\OPERATOR.TXT',
    size: { w: 480, h: 340 },
    body: {
      kind: 'text',
      paragraphs: [
        'CVZ is a multidisciplinary project operating across merch, video, artwork and sound.',
        'This is placeholder copy. Drop the real bio in src/content/content.ts and it appears here verbatim.',
      ],
    },
  },
  {
    id: 'transmit',
    label: 'CONTACT',
    path: 'C:\\CVZ\\SYSTEM\\UPLINK',
    size: { w: 440, h: 380 },
    body: {
      kind: 'contact',
      lede: 'Open a channel.',
      email: 'hello@example.com',
      links: [
        { title: 'INSTAGRAM', meta: '@cvz', href: '#' },
        { title: 'YOUTUBE', meta: 'CHANNEL', href: '#' },
        { title: 'BANDCAMP', meta: 'STORE', href: '#' },
      ],
    },
  },
]

/** Sections whose icons drift through the background. */
export const DRIFTERS = SECTIONS.map((s) => s.label)

/** Ambient chatter. Fires at random on an idle system. */
export const SYSTEM_MESSAGES: { text: string; level?: 'warn' | 'err' }[] = [
  { text: 'TRANSMISSION RECEIVED' },
  { text: 'SECTOR 07 UNSTABLE', level: 'warn' },
  { text: 'DEFRAGMENTING ARCHIVE...' },
  { text: 'PACKET LOSS 0.4%', level: 'warn' },
  { text: 'UPLINK STABLE' },
  { text: 'CACHE FLUSHED' },
  { text: 'UNKNOWN PROCESS TERMINATED', level: 'err' },
  { text: 'PHOSPHOR TEMP NOMINAL' },
  { text: 'INDEXING /ARCHIVE ... DONE' },
  { text: 'SIGNAL DEGRADED — REROUTING', level: 'warn' },
]

/** BIOS/POST scroll. Lines starting with '~' pause a beat longer. */
export const POST_LINES: string[] = [
  `${SITE.system} BIOS ${SITE.biosVersion}`,
  '(C) CVZ INDUSTRIES. ALL RIGHTS RESERVED.',
  '',
  'CPU        : CVZ-8086 @ 33MHZ',
  'MEMORY TEST: 000640K',
  'MEMORY TEST: 065536K OK',
  '',
  'DETECTING PRIMARY MASTER  ... CVZ-ARCHIVE',
  'DETECTING PRIMARY SLAVE   ... NONE',
  '~MOUNTING /CVZ ...',
  ...SECTIONS.map((s) => `  LOADING ${s.label.padEnd(9, '.')}. OK`),
  '',
  'WARNING: SECTOR 07 UNSTABLE — CONTINUING',
  '~ESTABLISHING UPLINK ...',
  'UPLINK OK. HANDSHAKE COMPLETE.',
  '',
  '>>> ENTERING SYSTEM',
]
