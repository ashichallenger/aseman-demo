---
name: style-edit
description: Edit a raw vertical video in one of the user's named styles (سایه/saye, ضربه/zarbe, مجله/majalle, نئون/neon, or any style folder under styles/). Use whenever the user sends a video and names a style, e.g. "این ویدیو رو به سبک سایه ادیت کن".
---

# Style edit — procedure

Input: a raw video path + a style name. Resolve the name through `styles/aliases.json`.
If the style folder has no `golden/` images or STYLE.md says `Status: DRAFT`, warn the user that
the style is not locked yet and ask whether to continue.

## 0. Load the style (do not skip)
1. Read `styles/<id>/STYLE.md` and `styles/<id>/lessons.md` completely.
2. Read 4–6 images from `styles/<id>/golden/` (one per main treatment). Keep them in mind as the target.

## 1. Job setup
`jobs/<YYYYMMDD>-<short-name>/` ← copy input as `input.mp4`. ffprobe it. If not 9:16, plan a
crop centered on the subject (from subject.json) — say so in the EDL table.

## 2. Preprocess (run tools, don't improvise)
1. `python tools/transcribe.py jobs/<job>/input.mp4` → `transcript.json` (word timestamps + stress).
2. `python tools/subject_track.py jobs/<job>/input.mp4` → `subject.json` + `mask/`.
3. Spot-check: Read 3 mask frames (start/middle/end). Edges clean? Hair ok? If not, rerun with the HQ matting model.

## 3. Checkpoint A — transcript
Show the transcript as numbered sentences with times. Ask the user to fix wrong words
(Persian ASR makes mistakes). Apply fixes to `transcript.json` (keep timings).
Skip only if the user said "بدون تایید" / "skip checks".

## 4. Direct — build the EDL
Follow STYLE.md §"Speech → treatment rules" literally, plus lessons.md.
- Jump-cut silences per STYLE.md; build the src→out time map.
- Classify every sentence (`kind`), pick the key/hero word by `stress` (+ rules), choose the treatment,
  anchor and side from subject.json for that time range (e.g. side opposite the gesturing hand).
- Respect density limits (max words on screen, one big moment per N seconds, etc.).
Write `edl.json`, then show the user a compact table:
`# | time | spoken text | on-screen text | treatment | placement`.

## 5. Checkpoint B — EDL approval
Wait for "اوکی"/edits. Changing the table is cheap; changing a render is not.

## 6. Stills QA loop (max 3 rounds)
1. For each item, render one still at its most "complete" frame (`npx remotion still`).
2. Build side-by-side `qa/<item>.png` = [golden frame of same treatment | our still] (use ImageMagick `montage` or PIL).
3. Read each side-by-side. Score against STYLE.md QA checklist + these universal checks:
   font identical? size relative to face/torso similar? color identical? effect (extrusion/glow/blur) present?
   position relationship to subject the same kind? nothing over eyes/mouth? Persian shaping correct?
4. Fix component/EDL props, re-render failing stills only.

## 7. Preview → final
Render a half-resolution preview (`--scale=0.5`) and send it to the user with a 3-line note:
what was done, anything uncertain, what to check. After approval render full quality:
`--codec=h264 --crf=18`, 1080x1920, 30 fps, AAC 192k, loudness −14 LUFS.

## 8. Learn
Every correction the user gives → one concrete, dated line in `styles/<id>/lessons.md`.
If the same correction appears twice, also update STYLE.md and/or the component itself.
