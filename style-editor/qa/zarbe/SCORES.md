# zarbe — treatment QA scores (self-review, phase 3)

Side-by-sides `qa/zarbe/sbs_<Treatment>.jpg`, sheets `sbs_all_r1.jpg`, `sbs_all_r2.jpg`.

| Treatment | golden | r1 | r2 | r3 (final) | notes |
|---|---|---|---|---|---|
| Stack (hook) | Stack__02.00 | 6 | 7 | 7 | Nastaliq script line too small in r1 (66→92 px). Lalezar hero stretched 1.3, Vazirmatn Bold sans overlapping it. |
| HeroBehind | HeroBehind__18.60 / HeroVertical__02.00 | 8 | 8 | 8 | "GTA VI" Anton white-with-red-extrusion stretched 1.7 behind the head ≈ "INTERNATIONALLY"; Persian heroes Lalezar red gradient stretched 1.55. |
| PairWide | PairWide__11.00 | 8 | 8 | 8 | Vazirmatn sans + Estedad 900 skewed −10° red with extrusion ("LIGHT" equivalent). |
| BrollCard | BrollCard__16.60 | 7 | 7 | 7 | No B-roll exists → B/W punch-in of the presenter in the glowing rounded card, STAT "1.5M"/"30M". |
| ArcText | ArcText__14.30 | 3 | 7 | 7 | r1 words off-frame (radius from head width) → circle 0.4 W around head/shoulders, phrase centred over the top. |
| SurfaceWord | SurfaceWord__22.00 | 5 | 6 | 6 | Black T-shirt → light-grey screen-blend instead of dark multiply (DECISIONS); 84→112 px. |
| SilhouetteCut | SilhouetteCut__04.80 | 6 | 6 | 7 | Arc words were white on the light background → red (onLight). |
| Stickers | Stickers__13.00 | 7 | 7 | 7 | Cream Lalezar on red bevel tags, ±8° tilt, spring pop. |
| RedCard | RedCard__19.60 | 0 | 8 | 8 | r1 never showed (props name clash `pre` — fixed in core Edit: preF/postF). |
| LightBurst | LightBurst__02.55 | – | – | 7 | white matte silhouette + bloom + white flash at 6 sentence starts. |

Average (final): **7.3 / 10**.

## Final render QA (phase 4d) — `outputs/zarbe.mp4` (84.8 s, 1080x1920, 30 fps, −14 LUFS)
Contact sheets every 2 s: `qa/zarbe/final/sheet_1..3.jpg`.
- Render 1 issue: long "clean face" gaps (7 s, 9 s, 23 s, 41 s, 61 s, 67–73 s) because HeroBehind words only
  appear on the stressed word → new `SansLine` treatment (the SANS role alone, white Vazirmatn on the chest)
  carries every word no other text treatment shows; it never overlaps a Stack/PairWide/SurfaceWord.
  Re-rendered (render 2): gaps now ≤ ~1.5 s except 70.5–72 s.
- No text over eyes/mouth; Persian shaping correct; hero partially occluded by the head as in the reference.
- Overall similarity: **7 / 10** (typography/rhythm close; the busy patterned background of the reference
  is what makes its behind-head text pop — this room is darker).
