# saye — treatment QA scores (self-review, phase 3)

Score = visual similarity to the golden frame, 0–10 (font, size vs face/torso, colour, effect,
spatial relation to subject, Persian shaping). Side-by-sides: `qa/saye/sbs_<Treatment>.jpg`,
contact sheets `sbs_all_r1.jpg`, `sbs_all_r2.jpg`. Motion: `motion_WordCaption_ours.jpg` vs
`styles/saye/analysis/ref1/dense/strip_021.58s.jpg`.

| Treatment | golden | r1 | r2 (final) | what changed / remaining gap |
|---|---|---|---|---|
| ArcCaption (hook) | RedCircle__01.40 | 4 | 8 | r1 words scattered round the whole circle → width-based layout on the lower-left edge, key never red-on-red. No dashed "tatweel" word box (Persian tatweel would look wrong on this script). |
| WordCaption + KeyWord | KeyWord__28.40 | 8 | 8 | Vazirmatn 500 + 900 red key (ratio 1.6), blur-in 6 f, RTL sweep, on the upper chest. Red `#B00012` on a black T-shirt is a little darker than on the reference white shirt. |
| RedCircle | RedCircle__01.40 | 7 | 7 | Size/position fine; halo rings fainter than reference. |
| RedEcho | RedEcho__03.60 | 6 | 7 | offset −16→−30 px; clipped above the desk so no red line under the arms. Frontal camera makes it narrower than the side-angle reference. |
| Hero3DBehind | Hero3DBehind__06.80 | 9 | 9 | "GTA VI"/"FBI"/"30M"/"VIRAL" Montserrat 900, extrusion, behind the head; label moved right of the face (was hidden by the head in r1). |
| SilhouetteScene | SilhouetteScene__10.40 | 7 | 7 | Red gradient + pure-black matte silhouette + white swoosh. Front-facing seated silhouette (no profile take) + desk filled black. No logo (no brand asset). |
| QuestionCloud | QuestionCloud__15.00 | 7 | 8 | question marks enlarged (230→360 px), bubble text 40→46 px. |
| PaperNotes | PaperNotes__19.40 | 6 | 7 | note moved below the chin (r1 touched the mouth). Lalezar stands in for the brush marker. |
| Stepper | Stepper__17.40 | 7 | 7 | labels 30→36 px. On the body instead of on a silhouette. |
| Cursor | Cursor__25.90 | 7 | 7 | white arrow clicks the key word (inside WordCaption). |
| BlurTransition | BlurTransition__21.60 | 8 | 8 | 0→24 px over 5 f, 30→0 over 8 f, on every 100 %↔135 % framing change. |

Average (r2): **7.7 / 10**.

## Final render QA (phase 4d) — `outputs/saye.mp4` (85.5 s, 1080x1920, 30 fps, −14 LUFS)
Contact sheets every 2 s: `qa/saye/final/sheet_1..3.jpg`.
- Render 1 issue found: in 135 % shots the Hero3D word ("FBI" 27 s, "30M" 55 s) was hidden behind the head and
  its label ran off the frame → hero width now fitted to ≥ 2.2–2.7 × face width, label moved to a front-layer
  HeroLabel right-aligned to the hero. Re-rendered (render 2) and re-checked: fixed.
- No text over eyes/mouth; Persian joined and RTL everywhere; only Vazirmatn/Montserrat/Lalezar/Estedad used.
- Overall similarity to reference (typography / colour / effects / rhythm): **7.5 / 10**.
