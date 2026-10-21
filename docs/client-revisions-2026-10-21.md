# CVZ — Website Revision Notes (third round)

> From Cole Anderson, relayed verbatim by Eris on 2026-10-21, after reviewing the tapes build. In his words, "these might be the final updates for the time being". Everything in `client-revisions-2026-10-05.md` still stands except where this changes it.

Ok I think these might be the final updates for the time being: I think the main power button should be bigger and more noticeable maybe if it's the CVZ button. So it's not hard to find. Also it automatically inserts a tape when it's powered up. I think that you should have to click on one of the tapes to bring you into the website. I also think that the music section should dissolve into the design and video section being that it's not my music. I will eventually put music out and might need it again but for the time being I don't think it's necessary. Can the short films section be changed as well too, maybe just have those moved to a visual section, they're not really short films. I also think the main categories (design, merch, video, etc.) should have the actual drop down feature so you can hide some of them if necessary. Lastly my instagram name changed to @colevz.

---

## What was done

- **POWER says CVZ.** The set has one power button, its own, made bigger than the photographed one, breathing red until pressed, with CVZ on it. (A first pass made the CVZ logo plate a second power button; Eris caught it, and the plate is back to being the logo.) (`index.html`, `src/styles/set.css`, `src/tv/set.ts`)
- **Only a click puts a tape in.** Nothing goes in on its own any more, including on a link to a piece. A link pre-selects its tape on the pile, and once the viewer puts that tape in, the piece opens. A second POWER tap can no longer land on a tape while the pile slides in. (`src/tv/set.ts`, `src/tv/broadcast.ts`)
- **MUSIC is off the shelf.** Every piece on it was already on VIDEO, DESIGN or MERCH, so nothing left the site. The tape is kept as `SHELVED_MUSIC` in `src/content/content.ts`, and it goes back in `TAPES` when he puts his own music out. The shelf is four tapes.
- **Short Films → Visuals.** The three pieces moved into VIDEO / Visuals, and VIDEO's label reads "music videos · visuals".
- **Drop-downs.** In INDEX each tape (VIDEO · MERCH · DESIGN · BIO) opens and folds with a click. The one that is in starts open. ▶ PLAY next to a tape puts that tape in.
- **Instagram:** @colevz → https://www.instagram.com/colevz
