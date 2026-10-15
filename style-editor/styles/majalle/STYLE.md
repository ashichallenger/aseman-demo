# STYLE: majalle — «مجله» (Editorial Poster, voice-over)

Source reference: `refs/ref1.mp4` (English voice-over, no presenter on screen, 14.5 s, 720x1280, 30 fps).
Confidence: HIGH for typography/layout; MEDIUM for visuals (they are AI/stock images, not raw footage).
Status: DRAFT (phase-1 verified 2026-10-15 by Claude; golden frames self-selected) — LOCKED after golden-frame approval.

## 1. Identity
Every sentence is a **magazine/movie-poster page**. One hero image per sentence (golden helmet,
brain, a man peeking through torn paper, a gilded bust in a frame, a dollar bill), placed on
either deep black or cream paper. Typography is editorial: condensed caps headline with a red
accent word, thin/regular sans for secondary words, italic serif or handwritten red for one
emotional word, tiny "fake print" text (columns, dates, credits) for poster authenticity.
Words appear one at a time exactly as spoken. Scenes change every ~2 s with soft optical
transitions (blur, white bloom, zoom-through).

## 2. Canvas & palette
- 1080x1920. Two page types:
  - DARK page: `#0B0806` black with warm red/maroon light leaks; hero lit gold.
  - PAPER page: cream `#FBEFD6` (variants `#FDF1DA`, `#F9EAD1`) with subtle paper grain + light vignette.
- Accent red/crimson: `#B3122E` (headline accents, "ATTENTION", "they"). Hot pink-red swoosh `#F04A5E` (dark brain page).
- Ink: `#111111` text on paper; quote marks navy `#0E2A3B`. Cream text on dark `#F3E6D3`.

## 3. Typography roles
| Role | Look | Font (→ free fallback) | Size (cap % H) | Color |
|---|---|---|---|---|
| HEADLINE | "YOU DON'T NEED!", "ATTENTION", "UNDERSTAND WHAT CAPTURES" | *Bebas Neue* / *Oswald Bold* | 4–6 % | cream/white; accent word `#B3122E` (or red on paper) |
| BAR | "EVERYONE TO NOTICE YOU" in a red bar under headline | *Inter Regular* caps | 1.8 % | white on `#8E0F1C` bar (bar wipes L→R) |
| GROTESK | "turn that attention.", "Because the right message", "rewire" | *Helvetica Neue Medium* → *Inter Medium* (tight tracking −2 %) | 3–7 % | `#F3E6D3` on dark / `#111` on paper |
| GROTESK-LIGHT | "the way they" | *Helvetica Neue Light* → *Inter Light* | 3 % | same |
| SERIF-ITAL | "their" | *Playfair Display Italic* | 3 % | `#111` |
| SERIF-BOLD | "they" (red, big) | *Playfair Display Black* / *DM Serif Display* | 6 % | `#B3122E` |
| HAND | "right one" | handwritten italic → *Kaushan Script* / *Caveat Bold* | 3 % | `#B3122E` |
| HIGHLIGHT | "doesn't reach everyone" | GROTESK | 3 % | `#FBEFD6` text on `#000` box (box wipes L→R) |
| QUOTE | “ | *Playfair Display Black* | 6 % | `#0E2A3B` |
| MICRO | fake poster print, dates, columns, credits | *Inter*/*Times* 6–9 px @1080 | 0.6–1 % | 40–60 % opacity |
| TAG | "CURIOSITY", "RETENTION" floating labels | *Inter Regular* caps | 1.6 % | white on `rgba(20,20,20,.75)` rounded rect, 1 px grey border |

Persian content: HEADLINE → *Morabba Bold*/*Kalameh Black*; GROTESK → *Peyda*/*Vazirmatn*;
SERIF-ITAL → *Lalezar* is too heavy — use *Nastaliq*-style (e.g., *IranNastaliq*) for the emotional word instead of serif italic.

## 4. Placement rules (relative to the HERO IMAGE — this style has no presenter)
- Every page has one `focal_box` (the hero object's important part: face, brain, helmet visor).
  Text is never placed over the focal box.
- Headline pages (DARK): headline centered horizontally in the top 10–18 % band; BAR directly
  under it, left-aligned to the headline's left edge; MICRO copy bottom-left at 75 % H, 2 lines.
- Split pages (peeking man): the vertical slit is the focal box; text left of the slit is
  left-cropped (bleeds off the left edge), text right of the slit sits on the paper at 50–55 % H.
- Object + label pages (brain): TAG chips orbit the object at ~45° positions, partially behind it;
  GROTESK word sits under the object at 60–65 % H, centered.
- Quote pages (PAPER, no image): QUOTE mark at x 8 % W, y 37 % H; text block left-aligned at
  x 8 % W starting y 41 % H, max width 80 % W. MICRO print frames the page (top row of names,
  vertical text along both side margins, bottom credits block at 82–90 % H).
- Framed-portrait pages: frame tilted −8°, lower half; text upper third, overlapping slightly.
- When converting a talking-head raw video: use the presenter cut-out as the hero image
  (desaturate to warm duotone, place in frame / slit / torn paper), focal box = face.

## 5. Treatment catalog
5.1 `WordReveal` — the core: each word appears on its word time: opacity 0→1, blur 6→0 px,
    5 f. Words not yet spoken are invisible (NOT grey). Reveal order follows speech, layout is fixed in advance.
5.2 `HighlightWipe` — black box wipes L→R behind 2–4 words in 6 f as the first of them is spoken.
5.3 `HandWrite` — HAND word draws on with a L→R mask in 8 f, last.
5.4 `AccentSwap` — on the stressed headline word, color white→`#B3122E` in 3 f.
5.5 `BarWipe` — red bar wipes in, then its text types on L→R.
5.6 `TagChips` — chips pop with 5 f fade + 4 px rise, staggered 4 f.
5.7 `PagePush` — whole page slowly scales 1.00→1.06 over its life (or 1.06→1.00 pull-back for quotes).
5.8 Transitions (choose by sentence relation):
    - same topic → `Defocus` (blur 0→20 px 4 f, cut, 20→0 6 f)
    - new idea → `WhiteBloom` (exposure to white 5 f, next page emerges 8 f)
    - consequence/escalation → `ZoomThrough` (scale 1→1.6 + blur on outgoing, incoming 1.3→1).
5.9 `SwooshShapes` — angular pink-red shapes slide in from the frame edges on DARK pages (10 f).

## 6. Speech → treatment rules
- One page per sentence (or per clause if the sentence > 3 s). Target page length 1.7–2.5 s.
- Page type by sentence role: claim/hook → DARK headline page; explanation → object+label page;
  contrast ("not X but Y") → split page; quote/conclusion → PAPER quote page with HighlightWipe + HandWrite.
- The stressed word of the sentence = accent (red or HAND or HIGHLIGHT) — exactly one.
- Each page needs a hero image: generate an image prompt per page (golden, dramatic, studio-lit
  object on black, or classical/editorial object on cream) and wait for the user to supply images
  (or use presenter cut-outs). Never ship a page with a placeholder.

## 7. Raw-footage requirements
- Clean voice track (voice-over or talking head audio).
- One hero image per sentence (AI-generated or stock, ≥ 1080 px wide, PNG with transparency preferred).

## 8. QA checklist
- [ ] Every word appears within ±1 f of being spoken; nothing appears early.
- [ ] One accent per page; accent colors only `#B3122E` / navy quote marks.
- [ ] MICRO print present on every PAPER page (poster authenticity).
- [ ] Focal box never covered.
- [ ] Page length 1.7–2.5 s; transition types follow §5.8.

## 9. Phase-1 notes (2026-10-15, Claude, autonomous run — needs user confirmation)
Verified against analysis/ref1 overview_01/02 + golden/:
- Pages confirmed: DARK headline (0.3–2 s, helmet), DARK object+tags (2–4 s, brain + 3 TAG chips + red
  angular swoosh shapes at both side edges), WhiteBloom (≈4 s), PAPER split page (4.5–6.2 s: grey paper
  sheets, vertical slit with face, hands gripping the paper edges, HEADLINE bleeding off left edge +
  quote mark, SERIF-ITAL "their" + red condensed "ATTENTION" right of the slit), cream framed-portrait
  page (6.5–8 s, frame tilted ≈ −8°, flowers, "Speak directly to what" GROTESK + SERIF-BOLD red "they want"),
  dollar bill DARK page with huge GROTESK "turn that attention." (8.3–9.3 s) → ZoomThrough with blur to the
  "INTO ACTION" serif-red page (9.5 s) → WhiteBloom → PAPER quote page (10.5–14.5 s) with HighlightWipe
  on "doesn't reach everyone" and HAND red "right one", pull-back 1.06→1.00.
- GROTESK-LIGHT words are revealed in grey first and darken? → NO: confirmed invisible before spoken;
  at reveal they are briefly lighter (opacity ramp), then full ink.
- MICRO print on the quote page: 4 names top row (~8 % H), vertical serif text along both margins,
  credits block at 78–90 % H. Confirmed.
Adaptations for this job (Persian talking head; user instruction: NO generated images):
- Hero image of every page = the presenter cut-out (RVM matte) in warm duotone, or a purely
  typographic page. One image prompt per sentence is written to outputs/majalle_image_prompts.md
  so the user can generate real hero images later.
- Persian fonts: HEADLINE → Lalezar (stand-in for Morabba/Kalameh), GROTESK → Vazirmatn (exact),
  GROTESK-LIGHT → Vazirmatn 300, SERIF-ITAL/HAND (emotional word) → Noto Nastaliq Urdu
  (stand-in for IranNastaliq, as §3 asks for a Nastaliq word), MICRO → Inter + Vazirmatn 300.
- Golden frames chosen: HeadlinePage__01.60, TagChips__03.70, WordRevealDark__03.80, SplitPage__06.00,
  FramedPortrait__07.80, GroteskDark__08.60, ZoomThrough__09.50, QuotePage__11.70.
