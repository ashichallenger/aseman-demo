# majalle — page QA scores (self-review, phase 3)

Side-by-sides `qa/majalle/sbs_Page-*.jpg`, sheet `sbs_all_r1.jpg`; debug stills of r2 fixes checked directly.
Hero image of every page = presenter cut-out in gold duotone (user rule: no generated images tonight).

| Page type (treatments) | golden | r1 | r2 (final) | notes |
|---|---|---|---|---|
| DARK headline (WordReveal, AccentSwap, BarWipe, PagePush, MICRO) | HeadlinePage__01.60 | 7 | 7 | Lalezar cream headline + red accent, red bar wipe, gold duotone presenter; bottom of the matte now fades into black (r1 hard desk edge). |
| DARK grotesk (huge GROTESK) | GroteskDark__08.60 | 7 | 7 | Vazirmatn 600 fitted to 84 % W, accent red; faint blurred presenter instead of the dollar bill. |
| DARK object + TagChips + SwooshShapes | TagChips__03.70 | 6 | 7 | r1 line overflowed the frame → each line width-fitted; chips orbit the cut-out. |
| Framed portrait (PAPER) | FramedPortrait__07.80 | 8 | 8 | gold frame −8°, duotone portrait, GROTESK + red Lalezar line, side micro-copy. |
| Split page (PAPER slit) | SplitPage__06.00 | 7 | 7 | face through the vertical slit, red band, headline bleeding left, Nastaliq + red accent on the right. No hands gripping the paper (no such footage). |
| PAPER quote (HighlightWipe, HandWrite, MICRO frame) | QuotePage__11.70 | 8 | 8 | black box wipes RTL, inverse text, red Nastaliq hand word, MICRO print on all margins. |
| Transitions Defocus / WhiteBloom / ZoomThrough | — | 7 | 7 | per relation between pages (see DECISIONS). |

Average (final): **7.3 / 10**. Biggest gap: real hero objects (see outputs/majalle_image_prompts.md).

## Final render QA (phase 4d) — `outputs/majalle.mp4` (85.5 s, 1080x1920, 30 fps, −14 LUFS)
Contact sheets: `qa/majalle/final/sheet_1..3.jpg`. 35 pages, all three transition types visible (blur 25 s,
bloom 47 s, zoom-through 61 s). Words appear only when spoken; no text over the face; one accent per page.
Weak spots: grotesk pages only carry a faint blurred presenter (no object), the highlight box can show for a few
frames before its second word is spoken (83 s). Overall similarity: **7 / 10**.
