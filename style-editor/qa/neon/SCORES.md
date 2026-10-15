# neon — treatment QA scores (self-review, phase 3) — EXPERIMENTAL

There is no full-screen reference: goldens are ~240x470 px tiles cropped from a showreel and upscaled
(`styles/neon/golden/`), so scores measure "same idea / same look family", not pixel similarity.
Side-by-sides `qa/neon/sbs_*.jpg`, sheets `sbs_all_r1.jpg`, `sbs_all_r2.jpg`, r3 stills `r3_40.png`, `r3_670.png`.

| Treatment | golden tile | r1 | r2 | r3 (final) | notes |
|---|---|---|---|---|---|
| NeonWord | NeonWordAmber__01.10 | 3 | 3 | 6 | r1 gold word + swoosh crossed the forehead; r2 behind the head was hidden → r3 on the dark desk (lower third), white line above, swoosh under. |
| ProductCard | StepDots_CircleFrame__05.20 | 6 | 6 | 6 | neon-rimmed tilted card on a stem next to the real toys ("GTA VI", فیلم/موسیقی/بازی). |
| NeonCaption | NeonWordAmber__01.10 | 5 | 6 | 6 | always-on caption, key in Lalezar neon amber with flicker-on; key now a content word. |
| GlowNumber | GlowNumber__05.20 | 4 | 6 | 6 | r1 ran off the frame → fitted to half width on the empty side; gold gradient + glow, counts up. |
| GlassCard | GlassCard__08.60 | 6 | 6 | 6 | warm frosted card, 2 px rim, inner glow, slides up 8 f. |
| StepDots | StepDots_CircleFrame__05.20 | 7 | 7 | 7 | glass pill 1–4, active number neon amber + label. |
| VerticalPill | VerticalPill_NeonWord__05.20 | 7 | 7 | 7 | tall glass pill at the edge, vertical neon text. |
| PropFly | VerticalPill_NeonWord__05.20 | 5 | 5 | 5 | glowing sparkles along the edges (no 3D prop models available). |
| CircleFrame | StepDots_CircleFrame__05.20 | 3 | 3 | 7 | r1/r2 the circle covered the real face → r3 is a scene: blurred amber set, big glowing circle close-up, small live card. |

Average (final): **6.2 / 10** (experimental style; needs a real full-screen reference to lock).

## Final render QA (phase 4d) — `outputs/neon.mp4` (84.8 s, 1080x1920, 30 fps, −14 LUFS)
Contact sheets: `qa/neon/final/sheet_1..3.jpg`.
- Render 1 issues: GlowNumber hidden behind the head in close shots (55 s "30M", 59 s "35M") and its label cut
  by the head; GlassCard showed not-yet-spoken words dimmed (text appearing early); in CircleFrame sentences a
  GlassCard overlapped the small live card (39 s). Fixed: number sized to the free space beside the face,
  label fitted; unspoken words invisible; CircleFrame now carries the whole sentence. Re-rendered (render 2) ✔.
- Remaining: 24.9–25.3 s the previous GlassCard fades out over the CircleFrame pop-in; 17 s label «میلیون‌ها نفر»
  partly behind the head in the 155 % shot.
