# ALLCVZ — visual concept scope

Working draft, 2026-09-17. For Cole to react to. Nothing here is locked.
Styleframes: `docs/concept/frames/` · live board: `docs/concept/board.html` (serve the folder; `python3 -m http.server 5188`).

## Where this comes from

Cole's brief (`docs/client-brief.md`) asks for "a computer that happens to contain your entire creative world." His two references are mood only; he wants something new. So the concept is built from **his own work**, not from the references:

- He thinks in **spot colour**. Almost every piece is one to three inks: red + yellow, red + cream, orange + brown, all-blue, pink + black.
- He **thresholds and halftones** photographs into print (N.D.S, the tiger, the Easter ears, Religious Holidays).
- His video work already lives in **broadcast hardware**: the green KEN alignment chart, camcorder timecode burned into the blue-room still, the Dorsia Nº2 bulb marquee.
- He is a **bootlegger by temperament** — "No Original Thought", the Dodger bootleg, the baking-soda parody. The machine should have that humour.
- He works three trades: **screen printer, DJ, video maker.**

The genre audit (what already exists) says the brief's obvious answer — a fake desktop with draggable windows, terminal boot text, a scanline filter — is the most worn-out version of this idea. We avoid all three.

## The idea

**One raster, three trades.** A halftone is an image chopped into dots. A video picture is an image chopped into lines. A DJ set is time chopped into beats. Print, video and music are the same act — cutting a signal into a regular grid — and Cole does all three. ALLCVZ is an imaginary 199X machine built for exactly that person: a **raster engine** that prints, broadcasts and keeps time at once. The name is already his — it is the slug of his current site, and it reads as *all CVZ*.

**The single rule: everything is either out of register or in register.**
Inside the machine, work drifts as separated ink layers and coarse halftone — misaligned, overlapping, making real moiré. That is the chaos the brief asks for. The moment you point at something, its layers slide into registration and it becomes sharp and full colour. That is the usability the brief asks for. One visual law carries both halves of "immersive but never lost": **chaos = out of register, clarity = locked.**

**The machine has no palette of its own.** It runs on black with one ink at a time, and it **re-inks itself in the spot colours of whatever you are looking at** — red and yellow for Dorsia Nº11, blue for the blue-room transmission. The site's colour scheme is literally his body of work. Idle ink is the electric blue of his CVZ neon mark.

## The journey

1. **POWER UP** (`f1`, `mood_powerup`). A dormant, silk-screened equipment faceplate — not a beige PC, not a terminal. Dark glass, one physical button, a dead counter, an ink-swatch strip, a pitch fader, a serial plate: *ALLCVZ · MODEL 4444 · MADE IN NASHVILLE*. Equipment faceplates are themselves screen printed, which is the quiet joke.
2. **Burn-in** (`f2`). Press it and the glass *exposes* like a screen in an exposure unit: the CVZ mark arrives as enormous coarse dots and refines, 12 lines per inch to 85. "Hold still. The image is being made." No fake boot log.
3. **Pull-in** (`f2b`; `mood_pullin` is a looser AI mood sketch of the same beat). The camera pushes into the halftone until one dot is the size of a doorway and you pass through it. Every dot in a halftone is a hole in the screen; you go through the hole.
4. **The field** (`f3`). Inside: his work as sheets hanging in depth, drifting toward a vanishing point, out of register, far ones dissolving to single-ink dots. Everything moves **on the count** — a master tempo, shown like a deck's BPM readout. Whatever is under the pointer shows a bracket and a `LOCKING 62%` readout, so the first screen demonstrates the rule instead of explaining it.
5. **Lock** (`f4`, `f5`). Point at anything; it registers, the machine re-inks, and a caption block and the piece's separations appear. Escape returns you to the field exactly where you were.

## What the content becomes

| His content | In the machine | Raster | Behaviour on focus |
|---|---|---|---|
| Posters, flyers, artwork | **Pulls** | dots | ink layers slide into register; each pass can be pulled out on its own |
| Merch | **Blanks** | dots | the print lands on the garment |
| Videos | **Transmissions** | lines | vertical hold stops rolling and locks; plays with a waveform strip |
| Music / mixes | **Sides** | steps | becomes the machine's tempo source |
| Bio | **Operator** | — | the record of who runs the thing |
| Contact / booking | **Line in** | — | the input jack: a short form |

## Never lost (his constraint, made structural)

- **The slug line.** Printers run a slug along the sheet edge — job name, colour bars, registration marks. Ours is permanent at the screen edges: where you are, what is in focus, the count, the tempo. It is never covered and never animated.
- **The job ticket** (`f6`). One key, from anywhere: everything in the machine as a plain printed list on paper. No glass, no motion, every line a link. This is also what a screen reader and a search engine get.
- **A real address for every object** — `/pull/dorsia-11` — so any piece can be sent to a client and opens already locked.
- **Pitch fader.** Tempo is the viewer's to set. **Pitch at zero holds the whole world still** — which is how reduced-motion preference is honoured, as a feature of the machine rather than an apology.
- **Returning visitors skip the burn-in.**
- **Phone** (`f7a`, `f7b`): the field becomes a vertical drift; tap to lock, swipe between pulls, tilt shifts the registration.

## Look and feel

- **Type, three voices.** *Plate* — a heavy condensed grotesque for names (Big Shoulders Display in the frames; final choice in the design spec, and a cut letter or two made for CVZ would be worth the money). *Slug* — a small wide-tracked mono for everything the machine says. *Counter* — a 14-segment display face for numbers only.
- **Texture is physical, not a filter.** Halftone at visible screen angles, genuine moiré from overlapping layers, registration targets, colour bars, mesh grain; for video, line raster, rolling vertical hold, chroma bleed. No Matrix rain, no window chrome.
- **Motion** steps on the beat rather than easing — things nudge, tick and settle like a press indexing.
- **Sound** (off until POWER UP): exposure-lamp thunk, a squeegee pull when something registers, relay clicks on the count.
- **Voice of the machine** — shop floor, DJ booth and control room mixed: `OUT OF REGISTER` · `BURNING SCREEN 01` · `PASS 2 OF 3 — RED` · `V-HOLD LOCKED` · `CUE` · `HOLD STILL. THE IMAGE IS BEING MADE.` And when idle too long, his own line: `NO ORIGINAL THOUGHT`.

## Provenance of the frames

Every piece of artwork in `f1`–`f7b` is Cole's own, taken from the export of his current site (the transmission still in `f5` is his blue-room photograph, camcorder timecode and all). Titles, dates and print specs in the captions are placeholders read off the artwork — to be corrected by Cole. `mood_powerup.png` and `mood_pullin.png` are AI-generated atmosphere sketches containing no real work; an earlier AI sketch of the interior was discarded because it invented poster art that is not his.

## What it deliberately is not

Not the Johnny Mnemonic HUD, not the Synthetic Luv computer lattice or its magenta wash, not a desktop OS, not a terminal, not vaporwave. Test applied to every element: *could this exist if neither reference had ever been made?*

## Two alternates, if this is the wrong door

- **Station CVZ.** A pirate broadcaster that never signs off. Work is transmissions on numbered pages (teletext-style: page 100 is the index, 300 is merch). The chaos lives *between* channels; clarity is being tuned in. Strongest on usability and on the DJ side; weaker for the print work.
- **The Rack.** A physical, walkable interior — an endless drying rack / flat-file room of his prints and monitors, Myst-like, room to room. Most "place-like"; heaviest to build and the slowest route to the work.

## Questions for Cole

1. Does "everything is out of register until you look at it" feel like you?
2. Idle colour: CVZ neon blue, or do you want the machine pink?
3. Do you want to be *in* the machine — a portrait, a voice — or is the operator unseen?
4. Music: are there mixes we can stream, and may the site make sound after POWER UP?
5. Is merch for sale anywhere we should link, or display only?
6. Captions: every piece needs a name, a client and a year. We will draft from what is legible and you correct.
