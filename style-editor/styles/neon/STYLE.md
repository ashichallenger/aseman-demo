# STYLE: neon — «نئون» (Neon Glass Product Ad, Arabic/Persian)

Source reference: `refs/ref1.mp4` — a 9.6 s **showreel** that shows four different ad edits as
small tiles inside a frame. Each tile is only ~150x250 px, so details are approximate.
Confidence: MEDIUM-LOW. Status: EXPERIMENTAL (phase-1 notes 2026-10-15 by Claude). ➜ Ask the user for at least one full-screen example of this style
before locking. Until then treat everything below as a hypothesis.

## 1. Identity
Product/UGC ads. A presenter at a desk with products, in a strongly colored set (violet/pink,
warm amber shop, deep blue kitchen). Every graphic **takes its color from the scene**: neon
glow text in the scene's own hue, frosted-glass cards, glowing outlines, giant glowing
numbers, 3D props (flowers, sunglasses, store icon) flying through, vertical text in glass
pills, product cards, numbered step indicators. Very dense — something new every ~0.7 s.

## 2. Scene-adaptive palette (measure per shot)
Take the dominant saturated hue of the shot (analyze_reference / accent_colors) and build:
- violet scene → neon text `#FF4FD8`, glow `#C13BFF`, glass tint rgba(255,180,255,.14)
- amber scene  → neon text `#FFC24A`, glow `#FF8A00`, glass tint rgba(255,210,150,.14)
- blue scene   → neon text `#5FE6FF`, glow `#2E7BFF`, glass tint rgba(160,220,255,.14)
Core text can also be white with a colored glow.

## 3. Typography roles
| Role | Font (Arabic ref → Persian) | Size | Effect |
|---|---|---|---|
| NEON | rounded bold Arabic display (*Lemonada Bold*/*Cairo Black*) → *Peyda Black* / *Morabba* | 4–7 % H | fill neon color, text-shadow 0 0 6/16/36 px glow color |
| GLASS-TEXT | *Cairo SemiBold* → *Vazirmatn SemiBold* | 2–2.6 % H | white/neon on glass card |
| NUMBER | *Montserrat Black* | 10–14 % H | neon gradient + glow, slight 3D tilt |
| VERTICAL | NEON font rotated 90° in a glass pill | 4 % H | |

## 4. Placement rules
- Glass cards sit **beside** the subject at face/chest height on the empty side, or under
  the face at desk level (lower third) when describing benefits.
- Giant NUMBER: the empty side, top half, partially behind the subject (mask).
- Vertical pill: frame edge on the empty side, full 35–45 % H tall.
- Props fly along the frame edges / corners, never across the face.
- Product cards hover near the actual product on the desk.

## 5. Treatments (hypotheses — verify with a full-screen reference)
`NeonWord` (flicker-on 3 f + glow bloom), `GlassCard` (frosted blur 20 px, 1 px light border,
radius 24 px, slides up 8 f), `GlowNumber` (counts up), `VerticalPill`, `PropFly` (3D prop, spring
rotation), `StepDots` (1-2-3-4 with active neon dot), `ProductCard` (tilted sticker pops),
`CircleFrame` (glowing circle portrait of the subject, before/after).

## 6. Speech → treatment
Product name → ProductCard; benefit → GlassCard; number/price/% → GlowNumber;
steps → StepDots; emotional hook → NeonWord big; brand/value line → VerticalPill.

## 7. Edit rhythm
Very fast: new element every 0.5–1 s, cuts every 1–2 s, punch-ins on product shots.

## 8. Raw footage
Colored practical lighting (one dominant hue per set), presenter at desk with real products, 4K.

## 9. QA
- [ ] Every element's color derived from its shot's hue (no foreign colors).
- [ ] Glass cards readable (contrast ≥ 4.5:1 for text).
- [ ] Never more than 3 graphic elements on screen.

## 10. Phase-1 notes (2026-10-15, Claude, autonomous run — EXPERIMENTAL, no full-screen reference)
Tiles cropped from the showreel into golden/ (≈240x470 px source, upscaled — details approximate):
VerticalPill_NeonWord__05.20 (violet scene: two vertical glass pills with neon-pink Arabic, glass bar
with neon word "سبب الثقة", 3D violet flowers), StepDots_CircleFrame__05.20 (amber scene: glass pill
with 1-2-3-4 numbers, active number neon amber; circular glowing portrait of the presenter's face),
GlowNumber__05.20 (blue scene: huge "15" / "20" cyan gradient numbers, store icon outline),
GlassCard__08.60 (blue glass banner with two-line white/cyan text), NeonWordAmber__01.10 (amber
gold gradient 3D word with a swoosh behind the head + small white line above it).
Observations: amber-scene text = gold gradient `#FFE29A → #FFB53A → #E07A00` with soft orange glow,
not flat neon; glass cards are warm-tinted with a 2 px bright rim and inner glow (?).
Adaptation for this job: our set is a warm amber/brown room with a black desk and colourful toys
(blind boxes + toy cars) → **amber palette** from §2 for every element; the toys are the "products"
(ProductCard hovers near them). All of it is a hypothesis to validate with a real full-screen reference.
