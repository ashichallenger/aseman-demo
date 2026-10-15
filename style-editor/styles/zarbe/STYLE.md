# STYLE: zarbe — «ضربه» (Red Punch talking-head)

Source reference: `refs/ref1.mp4` (English podcast-style talking head, 26.9 s, 720x1280, 30 fps).
Confidence: HIGH (full-screen reference, many examples of every treatment).
Status: DRAFT (phase-1 verified 2026-10-15 by Claude; golden frames self-selected) — becomes LOCKED after the user approves the golden frames.

## 1. Identity (one paragraph)
Seated talking head in a busy, warm, patterned room. Typography is the star: huge crimson
extruded words that sit **behind the subject's head** (depth illusion), combined with small
white sans words and elegant white script words stacked into one composition. Every 1–1.5 s
something changes: a cut, a punch-in, a new word. Accent moments use full-screen graphic
cards (deep red poster card, map, B-roll in a rounded glowing card) and white "light-burst"
transitions shaped like the subject. Ends on a logo card.

## 2. Canvas & grade
- 1080x1920 output (reference is 720x1280 — scale every px value below by 1.5).
- Grade: warm, slightly lifted blacks, saturated reds/oranges, soft contrast. Skin natural.
- Light vignette (edges −10–15 % exposure).
- B-roll inserts: desaturated B/W or cool-toned, inside a rounded card (see §5.7).

## 3. Typography roles
All sizes are **cap-height as % of frame height** (H). Colors measured from the reference.

| Role | Look in reference | Font (first choice → free fallback) | Size | Color / effect |
|---|---|---|---|---|
| HERO | "NOBODY", "COUNTRIES", "INTERNATIONALLY" | Tall ultra-condensed heavy: *Bebas Neue* / *Anton* → *Anton* | 7–12 % H (can be 25 % for one-word stacks) | Fill `#C8102E`→`#8E0A1C` vertical gradient; 3D extrusion 6–10 px down-right in `#5A0611`; soft shadow |
| HERO-WIDE | "LIGHT", "LANGUAGE", arc words "PLACE THIS" | Extended heavy italic: *Montserrat Black Italic* → same (Google) | 6–8 % H | Fill `#C5384B`/`#C8102E`, extrusion 4–6 px `#6B0A16`, white 1px inner highlight on top edge |
| SANS | "Different", "about working", "With their own" | *Poppins SemiBold* (italic for "about working") | 2.4–3 % H | `#FFFFFF`, shadow 0 2px 8px rgba(0,0,0,.45) |
| SCRIPT | "Here's what", "tells you", "standard", "3 different" | Signature script: *Amsterdam*-like → free *Great Vibes* / *Alex Brush* | 3–4 % H | `#FFFFFF`, thin, tiny glow |
| SURFACE | "Whatever / project / is / there" printed on the shirt | *Poppins Medium* | 2.8 % H | `#3A3A3A` with `mix-blend-mode: multiply`, follows chest (tracked) |
| STICKER | "one", "shot", "the", "brief" | Bold italic script: *Lobster* / *Pacifico* | 2.2 % H | Cream text `#FFF4E0` on red rounded tag `#B0101F`, bevel + drop shadow, tilt ±8° |
| STAT | "400+ EVENTS", "100+ ..." | *Montserrat Black Italic* (number) + condensed brush (*Bebas Neue* + grunge mask) | number 4 % H, word 5 % H | number white, word `#C8102E` |
| CARD-TITLE | "STANDARD" on red card | *Anton* / *Druk Condensed* | 14 % H | `#1A0303` on card `#840A04`→`#6F0702` |

If the video language is Persian: HERO → *Morabba Black* or *Peyda Black*; SANS → *Vazirmatn SemiBold*;
SCRIPT → a Persian handwritten (e.g., *Dastnevis*) or drop SCRIPT and use SANS-light. Never fake
Persian with an Arabic-only font; check that پ چ ژ گ render.

## 4. Placement rules (relative to the subject — never fixed pixels)
Anchors come from `subject.json` (see `CLAUDE.md`).
- **HERO behind head**: centered on `head_center.x`; baseline between `eye_line` and `chin`;
  the word is composited **under** the subject mask so the head/shoulders occlude 20–45 % of it.
  If the word would be >90 % occluded, move it up so its top touches `head_top - 2 % H`.
- **Stack composition** (SCRIPT + HERO + SANS + HERO + SCRIPT) is centered on `chest_box`
  center, overlapping the torso, total height ≤ 30 % H. SCRIPT lines are offset: first one
  left-aligned to the stack, last one right-aligned ("Here's what" top-left, "tells you" bottom-right).
- **HERO-WIDE + SANS pair** ("Different / LIGHT"): SANS sits above-left of HERO-WIDE, both on
  the chest, positioned so the hands do not cover it (check `hands` in subject.json for the item's time range).
- **ARC text**: a circular path concentric with the head, radius = 0.9–1.3 × head width,
  text above the head (or wrapped around the whole subject for long phrases). Letters face outward.
- **SURFACE text**: centered on `chest_box` center, rides with the chest every frame (tracking).
- **STICKERS**: scattered diagonal line from upper-right (beside face) to lower-left (chest),
  never covering the face box (+10 % margin).
- Safe zones: nothing in top 6 % and bottom 14 % (platform UI) except full-screen cards.
- Text NEVER covers eyes/mouth. HERO may cover hair/neck only when occluded by the mask.

## 5. Treatment catalog (each = one Remotion component)
Timing in frames @30 fps. "Word time" = `start` of the word from the transcript.

5.1 `HeroBehind` — stressed key noun/verb of the sentence.
   In: hard pop on the word's start frame: scale 1.18→1.0 in 4 f (easeOutCubic) + 3 f motion blur.
   Hold: until phrase end. Out: hard cut with the next shot, or 3 f blur-out.
5.2 `Stack` — the hook (first sentence) or a key thesis sentence.
   Each sub-line enters on its own word time. SCRIPT: write-on mask L→R 8 f. SANS: fade+rise 10 px 5 f.
   HERO lines: pop like 5.1. Whole stack drifts upward 2 % H over its life.
5.3 `PairWide` — "adjective + NOUN" emphasis ("Different LIGHT"). SANS fades 4 f;
   HERO-WIDE slides in from 12 % W toward its position in 5 f, extrusion appears 2 f later.
   On the next item of a list, only the HERO word swaps (LIGHT→LANGUAGE) with a 3 f scale pop.
5.4 `ArcText` — rhetorical phrases ("look at this", "that's where the magic happens").
   Letters reveal sequentially 1 f apart; the whole arc rotates 8–12°/s; ends with 4 f blur-out.
5.5 `SurfaceWord` — slow, deliberate phrases. ONE word visible at a time, swapped on word time, no animation (hard switch), tracked to chest.
5.6 `Stickers` — quick lists of short words. Each pops with spring (scale 0→1.12→1, 7 f), tilt random ±8°, accumulate, all exit together in 3 f.
5.7 `BrollCard` — when the speaker cites numbers/proof. B-roll inside a rounded rect
   (radius 6 % W, 82 % W × 70 % H, centered), white outer glow, slight 3D tilt drifting.
   STAT text pinned to the card's top-right corner, overlapping its edge.
5.8 `MapPins` — when a place/country is named. Dotted-world-map backdrop behind the subject
   (needs subject mask), red pin + white label pops at the place, camera pans between pins.
5.9 `RedCard` — full-screen poster for the core thesis. Gradient `#840A04→#6F0702`, logo top
   center, thin double lines, tiny fake meta text, CARD-TITLE with SCRIPT overlapping its lower half.
5.10 `SilhouetteCut` — on a dramatic line: switch to backlit silhouette footage (see §8) or
   synthesize: subject mask filled `#111`, background light grey gradient with white rim glow.
5.11 `LightBurst` (transition) — subject mask filled white + 40 px bloom, ramps 0→1 in 4 f, back in 6 f, cut happens at the peak.
5.12 `Outro` — black, logo assembles from dots, white glowing wordmark, contact lines.

## 6. Speech → treatment rules (the "director")
- First sentence (hook, 0–3 s) → `Stack` + subtle `HeroBehind` (largest type of the video).
- Every sentence gets exactly ONE hero word (highest stress score; ties → noun > verb > adj).
- Lists of 2–4 items → `PairWide` swap or `Stickers` (short words < 6 letters → Stickers).
- Numbers / proof → `BrollCard` with `STAT`.
- Places → `MapPins`.
- Rhetorical or "here's the thing" phrases → `ArcText`.
- Slow emphatic delivery (word rate < 2 words/s) → `SurfaceWord`.
- Thesis / turning point → `RedCard` (max 1 per 30 s) preceded by `LightBurst`.
- Words on screen at once: ≤ 6. No more than 2 type roles inside one non-Stack treatment.
- Sentences with no treatment: allowed, max 1.5 s of "clean" face — never more.

## 7. Edit rhythm
- Average shot 1.3–1.6 s (reference: 1.58 s avg, 1.33 s median, 6 cuts / 10 s).
- Alternate framing every cut: wide (subject 45 % H) ↔ medium (subject 70 % H) ↔ close (face 35 % H).
  From a single static camera: fake it with scale 100 % / 135 % / 175 % crops centered on `face_center`.
- Punch-in on the hero word: +8 % scale over 6 f, ease-out.
- Cut on word boundaries only (never mid-word); jump-cut removes silences > 0.25 s.
- Transitions: 80 % hard cuts, 20 % `LightBurst`. No crossfades.

## 8. Raw-footage requirements
- Seated subject, lav mic, busy colorful background (gives depth to behind-head text).
- 4K or 1080p ideally (punch-ins need headroom).
- Optional extra shot: backlit silhouette (light behind, face dark) for `SilhouetteCut`.
- Room for the head: at least 12 % H of space above the head in the wide shot.

## 9. QA checklist (must all pass before render)
- [ ] HERO words red with visible extrusion; partially occluded by the head (mask works, no halo).
- [ ] Exactly one hero per sentence; hero appears within ±1 frame of the word start.
- [ ] No text over eyes/mouth; nothing in UI safe zones.
- [ ] Average shot length 1.2–1.8 s; framing alternates.
- [ ] Script font is a real script (not italic sans); fonts loaded (no fallback serif!).
- [ ] Side-by-side with golden frames: same proportion of type vs. face (hero cap ≈ 0.6–1.0× face height).

## 10. Phase-1 notes (2026-10-15, Claude, autonomous run — needs user confirmation)
Verified against analysis/ref1 (overview_01–03, golden/):
- HERO words behind the head are **vertically stretched** ultra-condensed caps (Anton-like with
  scaleY ≈ 1.6–2.0): "COUNTRIES" cap ≈ 22–25 % H (not 7–12 %), "INTERNATIONALLY" set vertically
  tall (≈ 28 % H) in WHITE with red side extrusion — so HERO fill can be red **or** white-with-red-extrusion (?).
  Head occludes the middle letters (CO|UN|TRIES) — mask works as described in §4.
- Stack at 0–2.5 s: SCRIPT "Here's what" (top-left) → HERO "NOBODY" red → SANS "about working"
  (Poppins SemiBold, white, slight glow) overlapping the HERO's middle → second HERO → SCRIPT "tells you"
  bottom-right. Confirmed.
- PairWide 10.5–12 s: SANS "Different" white (Poppins Medium ~3 % H) above-left, HERO-WIDE "LIGHT"
  Montserrat Black Italic red, extrusion down-right, white 1px top highlight. Confirmed.
- ArcText 13.5–15 s: letters are big (≈ 7–9 % H) heavy rounded sans (Poppins Bold-like), white with grey
  3D side, accent word red; the arc circles the WHOLE subject; strong motion blur on rotation (?).
- Stickers 12.5–13 s, BrollCard 15.5–17.5 s, RedCard 19–20 s, SurfaceWord 21.5–23.5 s (dark grey text
  on the WHITE shirt), MapPins 7.5–9 s, SilhouetteCut 4–5.5 s, LightBurst at 2.5 s / 6 s / 9 s / 10 s / 17.5 s
  (5 bursts in 27 s ≈ every 5 s). Outro 24–27 s.
- Edit rhythm confirmed: ~1–1.6 s shots; framings wide/medium/close.
Adaptations for this job (Persian, black T-shirt, dark warm room, single static camera):
- Persian HERO font = **Lalezar** (free stand-in for Morabba Black, DECISIONS D3) stretched scaleY 1.5;
  English/number heroes ("GTA VI", "۲۶") use Anton. SANS = Vazirmatn SemiBold; SCRIPT = Noto Nastaliq Urdu
  (Persian handwritten stand-in) for Persian, Great Vibes for Latin.
- SurfaceWord: the shirt is BLACK, so `#3A3A3A multiply` would be invisible → light grey `#DADADA`
  with `mix-blend-mode: screen` at 85 % (same "printed on shirt" idea, inverted for a dark shirt).
- MapPins/BrollCard need assets we don't have (no B-roll, no map) → BrollCard is built from the
  subject's own footage (punch-in close-up inside the rounded glowing card), MapPins only if a place
  is spoken (a stylised dotted map is drawn procedurally).
- Golden frames chosen: Stack__02.00, HeroBehind__18.60, HeroVertical__02.00, PairWide__11.00,
  PairWideSwap__11.60, ArcText__14.30, Stickers__13.00, SurfaceWord__22.00, BrollCard__16.60,
  MapPins__08.40, RedCard__19.60, SilhouetteCut__04.80, LightBurst__02.55, Outro__25.50.
