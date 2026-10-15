# DECISIONS — every autonomous decision with its reason

User instruction for the overnight run: no questions, no waiting; human checkpoints (A transcript,
B EDL) are replaced by strict self-review; every decision is logged here.

## Setup (phase A)
- **D1 Whisper model.** huggingface.co, download.pytorch.org and openaipublic.azureedge.net are blocked
  by this environment's network policy, so `large-v3-turbo` could not be downloaded in any format.
  Used **whisper large-v3 (full model, q8_0 ggml)** from the GitHub release
  `sergheinenov/whisper-large-v3-ggml` v1.0.0, SHA256 `24bc434f…f09e` verified against the release's
  checksums.txt, run through whisper.cpp (`pywhispercpp`). Reason: only reachable large Whisper;
  large-v3 is the parent of turbo and is at least as accurate on Persian (turbo trims decoder layers),
  just slower — acceptable on an 88 s clip (~3–4 min on 4 CPUs).
- **D2 torch.** CPU wheel index blocked → installed torch 2.14 from PyPI (CUDA build, runs on CPU).
  RVM is run through **ONNX Runtime** (`rvm_*_fp32.onnx` from the official RVM GitHub release) because
  torch.hub needs the RVM source repo which this session cannot fetch; same weights, same output.
- **D3 Fonts (approved free substitutes chosen in phase A; no system fallback is ever allowed):**
  | Needed by STYLE.md | Status | Used |
  |---|---|---|
  | Vazirmatn (all weights) | exact, free (OFL) | Vazirmatn 300–900 |
  | Peyda Medium/Black (commercial) | substitute | **Estedad** 300–900 (OFL, geometric Persian sans, closest free match) |
  | Morabba Black / Kalameh Black (commercial) | substitute | **Lalezar** (OFL heavy Persian display) and Estedad 900 |
  | IranNastaliq / Persian handwritten "Dastnevis" | not downloadable here | **Noto Nastaliq Urdu** (OFL, full Persian letters) |
  | Tajawal, Cairo, Lemonada, IBM Plex Sans Arabic (Arabic ref fonts) | exact Google fonts (Latin/Arabic only; used only if needed) | downloaded |
  | Montserrat 800/900(+italic), Poppins, Anton, Bebas Neue, Oswald, Great Vibes, Alex Brush, Lobster, Pacifico, Kaushan Script, Caveat, Inter, Playfair Display, DM Serif Display | exact (Google Fonts, free) | downloaded |
  | Helvetica Neue (majalle GROTESK) | commercial | Inter (STYLE.md's own fallback) |
  | Amsterdam script (zarbe SCRIPT) | commercial | Great Vibes (STYLE.md's own fallback) |
  | Druk Condensed | commercial | Anton (STYLE.md's own fallback) |
  Extra free Persian/Arabic display fonts kept for options: Aref Ruqaa, Noto Kufi Arabic Black, Baloo Bhaijaan 2.
- **D4 libEGL.** mediapipe 1.1.1 needs libEGL → installed `libegl1 libgles2` with apt (system package, needed for MediaPipe).

## Phase 2 — preprocessing (job `jobs/20261015-gta6/`)
- **D5 Frame rate.** Raw is 25 fps; edit must be 30 fps → `src30.mp4` (ffmpeg fps=30, CRF 14) is the single
  source for tracking, masks and Remotion, so mask frame N == video frame N exactly.
- **D6 Whisper decoding.** DTW token timestamps (first attempt) were far too slow on CPU, so whisper.cpp
  runs per silence-bounded chunk (≤ 24 s) with `max_len=1, split_on_word` word segments; word starts are
  snapped to the RMS onset (±0.1 s). Raw ASR words cached in `whisper_words.json`.
- **D7 Checkpoint A replaced by self-review** (`tools/fix_transcript.py`, original kept as
  `transcript_raw.json`): spelling/ZWNJ fixes (عجیب‌ترین، میلیون، آمریکا، می‌خواد…), merged split tokens
  (جی + تیه → جی‌تی‌ای, اف + بی + آی → اف‌بی‌آی), suspicious spans re-decoded with beam search (beam 5) and
  corrected by meaning. Sentence boundaries set by meaning (27 sentences). Suspicious words → `suspicious_words.json`:
  | time | ASR heard | used | reason |
  |---|---|---|---|
  | 6.6 s | سبت | ثبت | spelling (ثبت کردن مرخصی) |
  | 18.9 s | بازید | (removed) | hesitation; missing in the beam-search pass |
  | 19.3 s | بارده | وارد | «وارد سرور بازی می‌شن» fits meaning; both passes heard «بارده» → **check** |
  | 20.6 s | یه ها | یه‌سریا | colloquial «یه‌سریا میگن» → **check** |
  | 31.3 s | یک شکل | یک شرکت | both passes heard «شکل»; «مارکتینگ یک شرکت» fits meaning → **check** |
  | 35.2 s | تهوری / فرضی | تئوری / فرضیه | spelling |
  | 45.5 s | واکنشتشون بده | واکنش نشون بده | ASR merge |
  | 71.8 s | پارانویلی | پارانویایی | spelling |
  | 75.9 s | بازی خوش | بازی خودش | ASR |
  | 87.0 s | طور درگیر | تو رو درگیر | from beam-search pass |
  | 61.3 s | ببینم | ببینن | grammar (۳۵ میلیون نفر ببینن) |
- **D8 Subject tracking.** MediaPipe Face (478 pts) + Pose heavy, One-Euro smoothed; head_top from the matte
  (hair line); RVM mobilenetv3 matte at downsample 0.25 → `mask/` (2629 PNG) + `fg.webm` (VP9 alpha) for
  Remotion. Checked frames 0 / 1314 / 2628 (`qa/anchors_sheet.jpg`): face, chest, hands correct; matte
  edges clean incl. hair; the matte ends at the desk edge (y ≈ 0.646) — silhouette scenes fill the desk black.

## saye (phase 1 / 3 / 4)
- **D9 Phase 1** — STYLE.md checked line by line against analysis/ref1; corrections marked "(verified …)" and §10;
  the uncertain ones keep "(?)". 14 golden frames chosen by me (no user approval possible tonight).
- **D10 Single camera.** No top-down / profile takes exist → STYLE §6 fallback: alternate crops 100 % ↔ 135 %
  (push-in 100→104 % per shot), framing only changes once a shot has lasted ≥ 1.6 s (short jump-cut pieces
  keep the framing and cut hard; every framing change gets the BlurTransition).
- **D11 Checkpoint B replaced by self-review** — `jobs/…/edl_saye_table.md`. Direction per sentence
  (tools/plan_saye.py): hook → RedCircle + ArcCaption; GTA mention with the release date → Hero3DBehind "GTA VI"
  + label «۲۶ آبان»; "someone stole the game and is leaking it" → SilhouetteScene (mystery); FBI → Hero3D "FBI";
  the question → QuestionCloud (bubbles carry the words); film/music/game → PaperNotes; the release-date
  scenario → Stepper (ویدیو → تاریخ مشخص → پخش); "30 million" → Hero3D "30M"; viral → Hero3D "VIRAL";
  "every leak is marketing" → Stepper (ویدیو → بازی → لیک); "behind the curtain" → SilhouetteScene; ending → RedCircle.
  Big moment every ≈ 4–6 s, never two at once. One red key word per sentence (stress + meaning).
- **D12 No outro/logo** — STYLE 5.12 needs a brand logo; none exists for this channel, so the edit ends on the
  last sentence (a fake logo would be worse than none).
- **D13 English hero words** (GTA VI, FBI, 30M, VIRAL) — STYLE 5.3 says "brand/English term"; these are the
  English names of what is said in Persian (جی‌تی‌ای ۶، اف‌بی‌آی، سی میلیون، وایرال).
- **D14 Loudness** — rendered audio normalised to −14 LUFS with ffmpeg `loudnorm` after the Remotion render
  (video stream copied, not re-encoded).

## zarbe
- **D15 Rhythm** — 1.0–2.0 s shots (mean 1.34 s, reference median 1.33 s), framings cycle wide/medium/close =
  100 / 135 / 172 % crops on the head (single static camera), silences > 0.25 s removed, cuts only at word starts.
- **D16 Direction** (tools/plan_zarbe.py, table `jobs/…/edl_zarbe_table.md`): hook → Stack (Nastaliq script «کلی»,
  hero «خبر جدید», sans) + white stretched "GTA VI" behind the head (the reference's "INTERNATIONALLY"); numbers
  → BrollCard with STAT (1.5M, 30M) and HeroBehind "35M"; theses/question → RedCard ×2 (29 s, 64 s; max 1 per 30 s
  is respected for 2 of 3 thesis moments, the ending uses a Stack instead) each preceded by a LightBurst;
  "someone stole the game" and "behind the curtain" → SilhouetteCut + red ArcText; film/music/game and
  "دنبالش / یارو / بگیره" → Stickers; slow explanatory runs → SurfaceWord on the chest; one HeroBehind per
  remaining sentence (منتشر، FBI، بیشتر، وایرال، لیک، بی‌خبرند، آمریکا، ۲۶ آبان) with an +8 % punch-in.
- **D17 MapPins not used** — the only place name is «آمریکا»; a dotted world map without real assets would look
  fake, so the place gets a HeroBehind instead (STYLE allows HeroBehind for the stressed noun).
- **D18 Core bug fixed** — EDL `props.pre` (RedCard words) collided with the renderer's pre-roll option, so
  RedCards never rendered in gallery r1; the renderer options are now `preF/postF`.

## majalle
- **D19 No generated images** (user rule) — every page's hero = the presenter cut-out (RVM matte) in warm gold
  duotone (dark pages), inside a gilded frame (paper pages) or seen through the paper slit; quote/grotesk pages are
  purely typographic. One English image prompt per sentence → `outputs/majalle_image_prompts.md`; if PNGs are
  later dropped into `jobs/20261015-gta6/majalle_images/Snn.png`, `plan_majalle.py` picks them up automatically.
- **D20 Pages** — 35 pages for 27 sentences (long sentences split at clause boundaries), mean ≈ 2.4 s (STYLE asks
  1.7–2.5 s; quote pages up to 3.5 s). Page type by role: hook/claim → DARK headline, explanation → object+chips,
  contrast/"someone did X" → split page, place/person statement → framed portrait, numbers/short punch lines →
  big GROTESK, the question and the two conclusions → PAPER quote with HighlightWipe + red Nastaliq hand word.
- **D21 Transitions** — Defocus inside a topic, WhiteBloom when a new idea starts (new sentence topic), ZoomThrough
  on escalation (numbers, "FBI", "viral").
- **D22 Audio only from the original** — the presenter is never shown "talking" in majalle (voice-over style);
  the base video is hidden under the pages, its audio is the soundtrack.

## neon (EXPERIMENTAL)
- **D23 Palette** — the set is a warm amber/brown room → STYLE §2 "amber scene" palette for every element
  (text `#FFC24A`, glow `#FF8A00`, gold gradient, warm glass tint); no foreign colours.
- **D24 Hypothesis treatments built from the showreel tiles** — NeonWord, GlassCard, GlowNumber, VerticalPill,
  StepDots, ProductCard (on the real toys), CircleFrame, PropFly + an always-on NeonCaption so every word is
  readable. Rhythm 1–2 s shots, framings 100/128/155 %, a 6 % "punch" on every framing change.
- **D25 Face safety** — the head is close to the top of this frame, so big neon words can't sit above it:
  NeonWord lives on the dark desk in the lower third; CircleFrame became a full scene (blurred set + big glowing
  circle close-up) instead of a circle beside the head, which always covered part of the real face.
- **D26 PropFly** — no 3D prop models exist offline; glowing four-point sparkles stand in (logged as weak).
