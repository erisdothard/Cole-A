/* ---------------------------------------------------------------
   Window contents.
   One renderer per body kind in the archive. Adding a kind means
   adding a case here and a variant in content.ts — nothing else.
   --------------------------------------------------------------- */

import type { Body, Card, Row } from '../content/content'
import { escapeHtml } from './windows'

export function renderBody(body: Body): DocumentFragment {
  const frag = document.createDocumentFragment()

  switch (body.kind) {
    case 'grid': {
      if (body.lede) frag.appendChild(lede(body.lede))
      frag.appendChild(grid(body.cards))
      break
    }
    case 'list': {
      if (body.lede) frag.appendChild(lede(body.lede))
      frag.appendChild(list(body.rows))
      break
    }
    case 'video': {
      if (body.lede) frag.appendChild(lede(body.lede))
      for (const e of body.embeds) frag.appendChild(embed(e.title, e.youtubeId))
      break
    }
    case 'text': {
      for (const p of body.paragraphs) frag.appendChild(lede(p))
      break
    }
    case 'contact': {
      if (body.lede) frag.appendChild(lede(body.lede))
      frag.appendChild(contact(body.email, body.links))
      break
    }
  }

  return frag
}

function lede(text: string): HTMLParagraphElement {
  const p = document.createElement('p')
  p.className = 'w-lede'
  p.textContent = text
  return p
}

function grid(cards: Card[]): HTMLDivElement {
  const wrap = document.createElement('div')
  wrap.className = 'w-grid'

  for (const card of cards) {
    const el = document.createElement(card.href ? 'a' : 'div')
    el.className = 'w-card'
    if (card.href && el instanceof HTMLAnchorElement) {
      el.href = card.href
      el.rel = 'noopener'
      el.target = '_blank'
    }
    el.innerHTML = `
      <div class="w-card__thumb">${
        card.image
          ? `<img src="${escapeHtml(card.image)}" alt="${escapeHtml(card.title)}" loading="lazy" />`
          : 'NO SIGNAL'
      }</div>
      <div class="w-card__meta">
        <span class="w-card__title">${escapeHtml(card.title)}</span>
        ${card.sub ? `<span class="w-card__sub">${escapeHtml(card.sub)}</span>` : ''}
      </div>
    `
    wrap.appendChild(el)
  }

  return wrap
}

function list(rows: Row[]): HTMLDivElement {
  const wrap = document.createElement('div')
  wrap.className = 'w-list'

  for (const row of rows) {
    const el = document.createElement(row.href ? 'a' : 'div')
    el.className = 'w-row'
    if (row.href && el instanceof HTMLAnchorElement) {
      el.href = row.href
      el.rel = 'noopener'
      el.target = '_blank'
    }
    el.innerHTML = `
      <span>${escapeHtml(row.title)}</span>
      <span class="w-row__meta">${escapeHtml(row.meta ?? '')}</span>
    `
    wrap.appendChild(el)
  }

  return wrap
}

/* A facade, not a live iframe. The window opens instantly and nothing
   is requested from YouTube until the viewer asks for the signal. */
function embed(title: string, youtubeId: string): HTMLDivElement {
  const wrap = document.createElement('div')
  wrap.className = 'w-embed'

  const button = document.createElement('button')
  button.type = 'button'
  button.style.cssText =
    'position:absolute;inset:0;width:100%;display:grid;place-items:center;gap:8px;' +
    'color:var(--cyan);background:repeating-linear-gradient(0deg,rgba(95,245,255,.06) 0 1px,transparent 1px 3px);'
  button.innerHTML =
    `<span style="font-size:10px;letter-spacing:.24em">&#9654; RECEIVE SIGNAL</span>` +
    `<span style="font-size:9px;color:var(--ink-dim)">${escapeHtml(title)}</span>`

  button.addEventListener('click', () => {
    const frame = document.createElement('iframe')
    frame.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtubeId)}?autoplay=1&rel=0`
    frame.title = title
    frame.allow = 'accelerometer; autoplay; encrypted-media; picture-in-picture'
    frame.allowFullscreen = true
    wrap.replaceChildren(frame)
  })

  wrap.appendChild(button)
  return wrap
}

function contact(email: string, links: Row[]): HTMLDivElement {
  const wrap = document.createElement('div')

  const mail = document.createElement('a')
  mail.href = `mailto:${email}`
  mail.textContent = email
  mail.style.cssText = 'display:block;margin-bottom:16px;font-size:12px;letter-spacing:.1em'
  wrap.appendChild(mail)

  wrap.appendChild(list(links))
  return wrap
}
