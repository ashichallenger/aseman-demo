# PROGRESS — overnight run (2026-10-15 → 16)

Resume rule: read this file top to bottom, continue from the first unchecked item.

## Phase A — setup (done 21:52)
- [x] Kit extracted to `/home/user/aseman-demo/style-editor`; raw video → `jobs/input/raw.mp4` (1080x1920, 25 fps, 87.6 s, AAC 48k stereo)
- [x] Read CLAUDE.md, PROMPTS.md, SKILL.md, 4× STYLE.md
- [x] Tools: ffmpeg 6.1.1, Node 22.22, Python 3.12 venv (`.venv`), ImageMagick montage
- [x] Remotion 4.0.535 in `remotion/` (browser = /opt/pw-browsers/chromium_headless_shell-1194, set in remotion.config.ts); `public/jobs` → absolute symlink to `jobs/`
- [x] `npx skills add remotion-dev/skills` → `.agents/skills/*` (symlinked in `.claude/skills/`)
- [x] Python pkgs: pillow numpy opencv-python mediapipe librosa soundfile torch(+cu, CPU use) faster-whisper openai-whisper pywhispercpp onnxruntime fonttools
- [x] Models in `models/`: whisper ggml-large-v3-q8_0 (sha256 verified), MediaPipe face/pose(heavy,full)/hand/selfie, RVM mobilenetv3+resnet50 (.pth + .onnx)
- [x] Fonts in `remotion/public/fonts/` (see DECISIONS.md D3), Persian shaping verified in `jobs/font_test.png`
- [x] Test runs: python, remotion still, remotion render, ffmpeg, ffprobe, montage, PIL, mkdir/cp/mv
- [x] analyze_reference.py run for saye, zarbe, majalle, neon

## Phase B
- [x] B1 Phase 2 (22:25): `tools/transcribe.py` (whisper.cpp large-v3, word timestamps + stress) and
      `tools/subject_track.py` (MediaPipe + RVM) run on raw → `jobs/20261015-gta6/` {src30.mp4, transcript.json
      (corrected, raw kept), subject.json, mask/ 2629 png, fg.webm}; `qa/anchors_sheet.jpg` checked OK.
      Also built: tools/director.py (+plan_common.py, gallery builder), tools/fix_transcript.py, tools/anchor_check.py;
      Remotion core (src/core/*) + treatments for all 4 styles (src/styles/*).
      Phase-1 analysis notes appended to all 4 STYLE.md, golden/ filled for all 4.
- [x] B2 saye: phase1 ✔ · phase3 ✔ (qa/saye/SCORES.md avg 7.7) · phase4 ✔ outputs/saye.mp4 (render 2 after hero-size fix) · QA ✔ qa/saye/final/
- [x] B3 zarbe: phase1 ✔ · phase3 ✔ (qa/zarbe/SCORES.md avg 7.3) · phase4 ✔ outputs/zarbe.mp4 (render 2 with SansLine) · QA ✔
- [x] B4 majalle: phase1 ✔ · phase3 ✔ (SCORES avg 7.3) · image prompts ✔ outputs/majalle_image_prompts.md · phase4 ✔ outputs/majalle.mp4 · QA ✔
- [x] B5 neon: phase1 ✔ (tiles only) · phase3 ✔ (SCORES avg 6.2, r3) · phase4 ✔ outputs/neon.mp4 (render 2) · QA ✔
- [x] B6 REPORT.md (Persian) — all 4 outputs in outputs/, report verified against the EDL timings

## Done
All phase-B steps complete. Next steps for the user are in REPORT.md §9.
