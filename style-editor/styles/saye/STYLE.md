# STYLE: saye — «سایه» (Studio Red Silhouette, Arabic/Persian)

Source reference: `refs/ref1.mp4` (Arabic, female presenter, grey seamless studio, 36.2 s, 720x1280, 25 fps).
Confidence: HIGH.
Status: DRAFT (phase-1 verified 2026-10-15 by Claude against analysis/ref1; golden frames self-selected, not user-approved) — LOCKED after golden-frame approval.

## 1. Identity
Clean grey cyclorama studio, standing presenter, several camera angles (eye-level medium,
full body wide, extreme top-down/high angle looking up at the camera). Calm, premium,
agency-brand feel. White RTL captions sit **on the body at chest/hand level**, one key word
turns **deep red and bold**. Red is the only accent: a red offset "echo" outline of the
subject, a big red circle behind her, 3D extruded red English words behind the head,
and full-screen **red background + black silhouette** scenes for statements about the brand.
Small UI-style graphics (chat bubbles with avatar, a stepper/progress bar, cursor arrow,
torn paper notes, question marks) illustrate what she says.

## 2. Canvas & grade
- 1080x1920 (reference values ×1.5).
- Background grey `#AFB4B9`–`#C0C2C6` (cool neutral), soft falloff. Skin warm-neutral, whites clean.
- Silhouette scenes: background red radial gradient center `#D0101E` → edges `#7A0008`; subject = pure `#000` (mask fill).
- Brand red for text: `#A30002` (measured) — use `#B00012` on screen.

## 3. Typography roles
| Role | Look | Font (Arabic ref → Persian equivalent) | Size (cap % H) | Color / effect |
|---|---|---|---|---|
| CAPTION | white RTL lines "لا تدور على حدا" | *Tajawal Medium* / *IBM Plex Sans Arabic Medium* → Persian: *Vazirmatn Medium* / *Peyda Medium* | 2.6–3.2 % | `#FFFFFF`, shadow 0 1px 6px rgba(0,0,0,.25) |
| CAPTION-BIG | second, bigger line "كم اعلان" | same, SemiBold | 4–4.6 % | `#FFFFFF` |
| KEY | the emphasized word "بصمة", "البراند" | *Tajawal ExtraBold* → *Vazirmatn Black* / *Peyda Black* | 4–5 % | `#B00012`, no stroke |
| HERO-3D | "TEAM" behind head | *Montserrat ExtraBold* / *Poppins Black* | 6–7 % | fill `#C0101C`, extrusion 8–12 px straight down `#6E000A` |
| HERO-LABEL | small red Arabic line above HERO-3D "دور على" | KEY font | 3 % | `#B00012` |
| UI | bubble/stepper labels | CAPTION font Regular | 1.8–2.2 % | `#333` on frosted white chips |
| PAPER | words on paper notes "تصوير" | heavy Arabic brush/marker | 4 % | `#5A2A16` multiply on paper texture |
| LOGO | brand wordmark | brand font (serif) | — | white |

## 4. Placement rules (relative to subject)
- CAPTION block: horizontally centered on `torso_center.x` with ±10 % W offset **toward the
  side where the hands are**; vertically between `chest_box.top` and `hands_y` (overlapping the
  shirt). In top-down shots it sits just below the face at `chin + 10 % H`.
  (verified: front medium shots 24–28 s → baseline at 57–60 % H, i.e. ≈ chest_box.top + 35 % of chest height,
  directly over the hands; side-angle medium 2–4 s → block sits beside the neck/shoulder on the
  side the subject faces, lines staggered diagonally (each line shifted ~8 % W toward the face).)
  Never above `chin` in medium shots; never over the face box.
- Multi-line build: lines stack **downward**, each new line under the previous, RTL right-aligned
  to a common right edge; CAPTION-BIG is centered under the small lines.
- KEY word stays inline in its line; it is the line's visual center of weight.
- HERO-3D: centered on `head_center.x`, its vertical center at `head_top + 25 % of head height`
  (crosses the forehead/hair) and is composited **behind** the subject mask. HERO-LABEL right-aligned above it.
- Red offset echo: subject mask duplicated, filled `#C0101C`, offset (−14 px, +8 px) @1080w,
  placed behind the subject; appears only in medium side-angle shots.
- Red circle: diameter 95 % W, center at `head_center` shifted down 8 % H, behind the subject.
- UI graphics: bubbles/stepper in the lower third, beside the legs (wide shots) or over the
  silhouette's body (red scenes); question marks float around the head, upper-left.
- Paper notes: over the silhouette's chest, enter from frame edge.
- Safe zones: top 6 %, bottom 14 %.

## 5. Treatment catalog (frames @25 fps reference → convert to 30 fps ×1.2)
5.1 `WordCaption` — default for every sentence. (verified: usually ONE line of 2–4 words that is
    replaced by the next phrase — not a growing paragraph; the staggered 2–4 line build only in the
    side-angle shot.) Words enter RTL one by one on their word time:
    opacity 0→1 + blur 8→0 px + y +6→0 px over 6 f. Line holds until the phrase ends; whole block
    fades/blur-out 5 f. Max 2 lines small + 1 big line on screen.
5.2 `KeyWord` — inside 5.1: the key word enters already bold; its color sweeps white→red RTL
    across 4 f on its word time, then a 3 % scale bump (100→103→100, 6 f).
5.3 `Hero3DBehind` — when a brand/English term or core noun is spoken. Letters pop up from
    below (y +40 %→0) staggered 2 f, extrusion deepens 0→full in 6 f. Behind subject mask.
5.4 `RedEcho` — subject outline echo slides out from behind the subject 0→offset in 8 f, holds.
5.5 `RedCircle` — scale 0→1 from center in 10 f (easeOutBack), subject in front.
    (verified 0–1.8 s: circle Ø ≈ 75 % W (not 95 %) centered on the upper chest, 2 thin soft pink
    halo rings outside it; caption runs on an ARC along the lower-left edge of the circle
    (`ArcCaption`, white, 3 % H) and the key word sits in a dashed-outline box with tatweel-stretched
    letters + a white cursor arrow (?) — used as the opening/hook.)
5.6 `SilhouetteScene` — for statements about "we/our team/brand": switch the shot to
    red BG + black silhouette (mask). Logo + white text appear on the silhouette; a white swoosh
    (curved ribbon) sweeps behind in 12 f.
5.7 `QuestionCloud` — (verified 11–15.7 s: question marks are big white soft-3D glyphs, 6–12 % H,
    one turns red `#B00012` at ~13.5 s; bubbles = frosted white pill rgba(255,255,255,.55), text #222,
    black avatar circle on the RIGHT end, stacked downward with 7 % H spacing) for questions: 3–4 question marks (one red) pop around the head with spring,
    plus chat bubbles (avatar circle + grey frosted pill + RTL text) stacking from the bottom, each on its word time.
5.8 `Stepper` — (verified 16–18 s: panel rgba(255,255,255,.45) radius 3 % W, 4 white dots on a
    white line, labels 1.6 % H under dots, title white 2.6 % H above the panel; panel rises from the
    bottom over ~10 f) for processes/lists: frosted panel, 4 dots on a line with labels, active dot
    moves along on each spoken item (8 f slide), title line above panel.
5.9 `PaperNotes` — list of services: torn paper note with one word slides in from the edge with
    3D Y-rotation (60°→0°, 10 f), replaced by the next note on the next item.
5.10 `Cursor` — small white arrow cursor "clicks" a word as it's said (scale pulse 6 f).
5.11 `BlurTransition` — gaussian blur 0→24 px over 5 f, cut, 24→0 px over 6 f.
    (verified 21.5 s and 29 s: incoming shot starts fully blurred (~30 px @1080) and clears in ≈ 8 f.) Used between
    angle changes (≈ every 3–5 s).
5.12 `Outro` — black, logo assembles (rotating blades), wordmark fades in.

## 6. Speech → treatment rules
- Every spoken sentence gets `WordCaption` (this style is "always captioned").
- One `KeyWord` per sentence (stress score max; prefer nouns/brand/benefit words).
- Questions → `QuestionCloud`. Lists of 3–4 → `Stepper` or `PaperNotes`.
- First mention of the team/brand → `Hero3DBehind` or `SilhouetteScene`.
- Change camera angle every 3–5 s; if only one angle was shot, alternate crops 100 % / 140 %.
- Every angle change uses `BlurTransition`; other cuts are hard.
- One "big graphic moment" (5.3–5.9) roughly every 4–6 s; never two at once.

## 7. Edit rhythm
- Shots 1.8–5 s (reference median 3.6 s). Calmer than `zarbe`.
- Gentle constant push-in 100→104 % per shot.
- Silences > 0.3 s removed.

## 8. Raw-footage requirements
- Plain light-grey seamless background (makes masks clean and the style coherent).
- Shoot 3 angles of the same take or repeat lines: eye-level medium, full-body wide, top-down from high (ladder/boom, subject looks up).
- Side-profile take for silhouette scenes (the red scene uses profile).

## 9. QA checklist
- [ ] Persian/Arabic shaping correct (letters joined, RTL order, no reversed words).
- [ ] Captions sit on the body, not floating above the head; never over the face.
- [ ] Exactly one red key word per sentence; red is `#B00012`, no other accent colors.
- [ ] Silhouette is pure black with clean edges (no grey halo), background red gradient.
- [ ] Every angle change uses blur transition.
- [ ] Side-by-side with golden frames passes (caption size relative to torso width ≈ 45–65 %).


## 10. Phase-1 notes (2026-10-15, Claude, autonomous run — needs user confirmation)
- Fonts: reference Arabic caption face is a clean humanist Arabic sans (Tajawal/Almarai-like).
  Persian equivalent **Vazirmatn** (exact free font, listed first in §3) — Medium 500 for CAPTION,
  SemiBold 600 for CAPTION-BIG, Black 900 for KEY. Peyda is commercial → not used (DECISIONS D3).
- KEY word measured: cap ≈ 4.4 % H vs caption 2.8 % H (ratio ≈ 1.6), color `#B00012`–`#A30002`, no stroke,
  soft shadow only. On the red silhouette scene the key word is dark red `#7A0008` on white-ish glow (?).
- Hero3D measured at 6.8 s: "TEAM" cap ≈ 7 % H, Montserrat-ExtraBold-like, fill `#C0101C`,
  extrusion ≈ 10 px @1080 down-right `#6E000A`; red ribbon fragments (swoosh) enter from the right edge.
- Single-camera adaptation (this job): no top-down / profile angles exist → alternate crops
  100 % / 135 %; silhouette scene synthesized from the RVM matte (subject filled `#000`).
- Golden frames chosen (styles/saye/golden/): WordCaption__24.60, KeyWord__28.40, CaptionBig__03.90,
  Hero3DBehind__06.80, RedEcho__03.60, RedCircle__01.40, SilhouetteScene__10.40, QuestionCloud__15.00,
  Stepper__17.40, PaperNotes__19.40, Cursor__25.90, BlurTransition__21.60, Outro__34.50, KeyWordTopDown__30.60.
