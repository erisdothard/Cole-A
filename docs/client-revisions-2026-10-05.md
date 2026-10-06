# CVZ — Website Revision Notes

> From Cole Anderson, relayed verbatim by Eris on 2026-10-05, after reviewing the live CVZ-TV build.
> Sent with it: `MOCKUP_NDS_SHIRT_1.png` (Nashville Dance Show tee, front/back) — "he wants that shirt added to inventory."
> This note supersedes the channel structure in the original brief (`client-brief.md`); the brief's feel and world still stand.

I think the overall concept and visual language of the site is working, but I'd like to simplify the landing page and make the navigation/structure a little clearer.

## 1. Landing Page / TV

I'd like the landing page to feel more simple and immediately communicate where the user can go.

Rather than having the TV itself feel like the entire navigation system, I think clicking into the TV should open up a selection of 4–5 VHS tapes/channels that act as the main navigation.

For example:

- VIDEO
- MERCH
- DESIGN
- BIO
- MUSIC / PLAYLISTS / CONTACT — possibly a fifth category

The idea would be that the user selects a tape, and the tape visually gets inserted into the TV/VCR. Once it plays, it transitions into that category's page.

## 2. Category Pages

Once a tape/category is selected, I'd like the page to open into something similar to how the site currently behaves — with all of the content floating / moving around within the page rather than becoming a conventional grid-based portfolio.

So the TV/tape interaction becomes the clear entry point, while the actual content pages can retain the more chaotic, playful visual style that is currently there.

## 3. Menu / Channel Page

I'd like the menu/channel page to feel more like a drop-folder system.

Each category could have its own folder/dropdown that opens to reveal the individual projects or pieces inside it.

Something like:

```
VIDEO
└── Music Videos
└── Short Films
└── Visuals
MERCH
└── Project 01
└── Project 02
└── Project 03
DESIGN
└── Posters
└── Branding
└── Graphics
BIO
└── About
└── Contact
```

I don't necessarily want it to look like a literal boring file browser — more like a retro computer/VHS folder system that fits the existing aesthetic.

## 4. Static / Noise

I'd like to bring the white static/noise down a little bit. It should still be present and contribute to the texture of the site, but right now it can compete with the actual content.

Basically: less visual noise, but keep the analog/VHS feeling.

## Overall Direction

The main goal is to create a clearer hierarchy:

LANDING PAGE → TV → TAPES → CATEGORY → FLOATING CONTENT

The landing page should be the simplest part of the experience, while the deeper you go into the site, the more experimental and chaotic the content can become.

I want the site to feel like you're navigating through a weird personal TV/archive rather than a traditional portfolio website.

---

## What is open for Cole (not blocking)

- **MUSIC tape.** The archive has no mixes or playlist links, so the fifth tape is not built. The shelf is designed for five; it goes in as soon as he sends links (SoundCloud / Mixcloud / Spotify / YouTube).
- **Folder sorting is a draft.** Videos were sorted by watching their frames: 2 music videos, 3 short films, 12 visuals. DESIGN got a fourth folder, *Stills*, for six photographs that are not posters, branding or graphics. Merch is grouped by project. He corrects any of it in `src/content/content.ts`.
- **Titles.** "Transmission 01–09" are still untitled videos; suggested names from what is legible on screen are in the session notes, not applied.
- **Rosemary & Booty Queen** — the NDS shirt confirmed the spelling; the poster and the NYE video were corrected from "Beauty Queen".
