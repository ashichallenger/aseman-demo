# Style Editor — project rules for Claude Code

This project edits raw vertical talking-head videos into **named styles**. The user sends a
raw video + a style name (e.g. "سایه", "saye", "ضربه", "zarbe"); you produce an edit that
matches that style's reference *exactly in typography, motion and rhythm*, while text content,
placement and timing follow **this** video's speech and subject.

## Golden rules
1. **You cannot watch video.** You only understand what you turn into images/text. Always look
   at frames (Read the PNG/JPG) — of the references AND of your own renders — before judging.
2. **The style lives in files, not in your memory.** Before any edit, Read:
   `styles/<id>/STYLE.md`, `styles/<id>/lessons.md`, and 4–6 images from `styles/<id>/golden/`.
   STYLE.md wins over your taste. lessons.md wins over STYLE.md (it holds the user's corrections).
3. **Placement is relative to the subject, never fixed pixels.** Use anchors from `subject.json`.
4. **Timing comes from word timestamps.** Text appears on the frame its word starts (±1 frame).
5. **Renderer = Remotion** (React + TypeScript, Chromium). Do not use ffmpeg `drawtext`/ASS for
   styled text: it cannot do extrusion, masks, arc text, glow, blur-in, and breaks Persian shaping.
   ffmpeg is only for probing, audio extraction, frame extraction and final encode.
6. **Fonts are exact or explicitly approved fallbacks.** Fonts live in `remotion/public/fonts/`
   and are loaded with `@remotion/fonts` (or FontFace) and awaited with `delayRender`. A render
   with a fallback system font is a failed render.
7. **Each treatment is one reusable component** in `remotion/src/styles/<id>/`. Never hand-write
   one-off text for a single video; if a moment needs something new, add a treatment, render it in
   the gallery, get it approved, then use it.
8. **Two human checkpoints, never skip unless the user says so:** (A) transcript correction,
   (B) EDL table approval. Rendering before (B) wastes time.
9. **QA by comparison:** before the full render, render stills of every treatment moment and build a
   side-by-side image `[golden frame | our frame]` and score against the STYLE.md QA checklist.
   Max 3 self-fix rounds, then show the user.
10. When the user corrects something, append a dated, concrete rule to `styles/<id>/lessons.md`
    (e.g. "2026-10-20: KEY word must be on its own line when sentence > 6 words").

## Folder layout
```
styles/<id>/STYLE.md        style bible (typography, placement, treatments, director rules, QA)
styles/<id>/refs/           reference videos
styles/<id>/analysis/       output of tools/analyze_reference.py
styles/<id>/golden/         user-approved reference frames, named <treatment>__<t>.png
styles/<id>/lessons.md      accumulated corrections (most important file after STYLE.md)
styles/aliases.json         {"سایه":"saye","ضربه":"zarbe","مجله":"majalle","نئون":"neon"}
tools/                      python/node helpers (analyze, transcribe, subject tracking, stress)
remotion/                   the Remotion project (compositions: Edit, Gallery-<id>)
jobs/<YYYYMMDD-name>/       one folder per edit (input, transcript, subject, mask, edl, qa, out)
```

## Data contracts
`jobs/<job>/transcript.json`
```json
{"language":"fa","words":[{"i":0,"w":"سلام","start":0.42,"end":0.71,"stress":0.63,"sent":0}],
 "sentences":[{"id":0,"text":"...","start":0.42,"end":2.9,"kind":"hook|claim|list|question|number|place|thesis|plain"}]}
```
`stress` 0–1 = z-scored mix of loudness (RMS), pitch rise and word duration within the sentence.

`jobs/<job>/subject.json` (normalized 0–1 coords, one entry per output frame, smoothed with a
One-Euro or 5-frame moving average so text never jitters)
```json
{"fps":30,"w":1080,"h":1920,"frames":[{"f":0,"face_box":[x,y,w,h],"head_top":y,"head_center":[x,y],
 "eye_line":y,"chin":y,"chest_box":[x,y,w,h],"torso_center":[x,y],"hands":{"l":[x,y],"r":[x,y]},
 "empty_side":"left|right","subject_box":[x,y,w,h]}]}
```
`jobs/<job>/mask/` — alpha matte of the person, PNG sequence `%05d.png` (white = person), same
frame count as the edit. Used for text-behind-subject, silhouettes, echo outlines, light bursts.

`jobs/<job>/edl.json`
```json
{"style":"saye","fps":30,"segments":[{"src_in":0.42,"src_out":2.9,"framing":"medium","zoom":[1.0,1.04]}],
 "items":[{"id":"i1","treatment":"WordCaption","from":0.42,"to":2.9,"words":[0,1,2,3],
           "key":2,"anchor":"chest_box","side":"right","props":{}}],
 "transitions":[{"at":2.9,"type":"BlurTransition"}]}
```
Times are in OUTPUT timeline seconds after jump-cuts (keep a src→out time map in edl.json).

## Commands
- Analyze a reference: `python tools/analyze_reference.py styles/<id>/refs/ref1.mp4 --out styles/<id>/analysis/ref1`
- Preview: `cd remotion && npx remotion studio`
- Still: `npx remotion still Edit --frame=<n> --props=../jobs/<job>/edl.json out.png`
- Render: `npx remotion render Edit ../jobs/<job>/out.mp4 --props=../jobs/<job>/edl.json`

## Language
The user writes Persian. Reply in Persian. Keep file contents/code in English.
Persian/Arabic text: `direction: rtl`, `unicode-bidi: plaintext`, never split a word into letters
for animation (it breaks joining) — animate whole words or use a mask wipe.
