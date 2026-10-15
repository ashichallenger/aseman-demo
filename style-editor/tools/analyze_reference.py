#!/usr/bin/env python3
"""
analyze_reference.py — turn a reference video into material Claude can actually *see*.

Claude Code cannot watch an .mp4. It can only read images and text. This script
converts a reference video into:
  - contact sheets (2 fps) to read the overall structure
  - dense strips (10 fps) around every cut and every text change, to read motion
  - full-resolution key frames (the "golden frames" you approve)
  - cut list + shot-length stats (edit rhythm)
  - dominant palette per shot (exact hex colors)
  - 16 kHz mono wav (for word-level transcription later)
  - report.json that summarizes all of the above

Requirements: ffmpeg + ffprobe on PATH, Python 3.9+, Pillow, numpy.
    pip install pillow numpy

Usage:
    python tools/analyze_reference.py styles/punch-red/refs/ref1.mp4
    python tools/analyze_reference.py ref.mp4 --out analysis/ref1 --scene 0.25
"""
import argparse
import json
import os
import re
import shutil
import subprocess
import sys
from collections import Counter

try:
    import numpy as np
    from PIL import Image, ImageDraw
except ImportError:
    sys.exit("Missing deps: pip install pillow numpy")


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True)


def probe(path):
    r = run(["ffprobe", "-v", "error", "-show_entries",
             "format=duration:stream=codec_type,width,height,r_frame_rate",
             "-of", "json", path])
    info = json.loads(r.stdout)
    v = next(s for s in info["streams"] if s["codec_type"] == "video")
    num, den = v["r_frame_rate"].split("/")
    return {
        "duration": float(info["format"]["duration"]),
        "width": int(v["width"]),
        "height": int(v["height"]),
        "fps": round(float(num) / float(den), 3),
        "has_audio": any(s["codec_type"] == "audio" for s in info["streams"]),
    }


def detect_cuts(path, threshold, min_gap=0.2):
    r = run(["ffmpeg", "-hide_banner", "-i", path, "-vf",
             f"select='gt(scene,{threshold})',metadata=print", "-an", "-f", "null", "-"])
    times = [float(t) for t in re.findall(r"pts_time:([0-9.]+)", r.stderr)]
    cuts = []
    for t in times:  # merge flashes / multi-frame transitions into one event
        if not cuts or t - cuts[-1] > min_gap:
            cuts.append(round(t, 3))
    return cuts


def frame_at(path, t, out, width=None):
    vf = ["-vf", f"scale={width}:-1"] if width else []
    run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.3f}", "-i", path,
         "-frames:v", "1", *vf, out])
    return os.path.exists(out)


def contact_sheet(images, out, cols, label=True):
    ims = [Image.open(p).convert("RGB") for p in images]
    if not ims:
        return
    w, h = ims[0].size
    pad, lab = 4, (16 if label else 0)
    rows = (len(ims) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * (w + pad) + pad, rows * (h + pad + lab) + pad), (30, 30, 30))
    d = ImageDraw.Draw(sheet)
    for i, (im, p) in enumerate(zip(ims, images)):
        x = pad + (i % cols) * (w + pad)
        y = pad + (i // cols) * (h + pad + lab)
        sheet.paste(im, (x, y + lab))
        if label:
            d.text((x + 2, y + 2), os.path.splitext(os.path.basename(p))[0], fill=(255, 220, 0))
    sheet.save(out, quality=88)


def palette(img_path, k=6):
    im = Image.open(img_path).convert("RGB").resize((160, 284))
    q = im.quantize(k, method=Image.Quantize.MEDIANCUT).convert("RGB")
    arr = np.asarray(q).reshape(-1, 3)
    cnt = Counter(map(tuple, arr))
    total = arr.shape[0]
    return [{"hex": "#%02x%02x%02x" % c, "share": round(n / total, 3)} for c, n in cnt.most_common(k)]


def accent_colors(img_path):
    """Saturated colors only (text accents, graphics), ignoring skin/background greys."""
    im = Image.open(img_path).convert("HSV").resize((180, 320))
    hsv = np.asarray(im).reshape(-1, 3).astype(int)
    rgb = np.asarray(Image.open(img_path).convert("RGB").resize((180, 320))).reshape(-1, 3)
    mask = (hsv[:, 1] > 150) & (hsv[:, 2] > 90)
    if mask.sum() < 50:
        return []
    sel = rgb[mask]
    # bucket by hue
    hue = hsv[mask][:, 0] // 12
    out = []
    for hb, n in Counter(hue.tolist()).most_common(3):
        px = sel[hue == hb]
        med = np.median(px, axis=0).astype(int)
        out.append({"hex": "#%02x%02x%02x" % tuple(med), "pixels": int(n)})
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--out", default=None)
    ap.add_argument("--scene", type=float, default=0.25, help="cut sensitivity (lower = more cuts)")
    ap.add_argument("--sheet-fps", type=float, default=2.0)
    ap.add_argument("--dense-fps", type=float, default=10.0)
    a = ap.parse_args()

    if not shutil.which("ffmpeg"):
        sys.exit("ffmpeg not found on PATH")
    name = os.path.splitext(os.path.basename(a.video))[0]
    out = a.out or os.path.join("analysis", name)
    for sub in ["sheet", "dense", "key", "shots"]:
        os.makedirs(os.path.join(out, sub), exist_ok=True)

    meta = probe(a.video)
    dur = meta["duration"]
    print(f"[1/6] {name}: {meta['width']}x{meta['height']} @ {meta['fps']}fps, {dur:.2f}s")

    # 1. overview contact sheet(s)
    run(["ffmpeg", "-v", "error", "-y", "-i", a.video, "-vf",
         f"fps={a.sheet_fps},scale=240:-1", os.path.join(out, "sheet", "t_%04d.jpg")])
    frames = sorted(os.listdir(os.path.join(out, "sheet")))
    renamed = []
    for i, f in enumerate(frames):  # rename to timestamp so Claude can cite times
        t = i / a.sheet_fps
        nf = os.path.join(out, "sheet", f"{t:06.2f}s.jpg")
        os.replace(os.path.join(out, "sheet", f), nf)
        renamed.append(nf)
    per = 24
    for i in range(0, len(renamed), per):
        contact_sheet(renamed[i:i + per], os.path.join(out, f"overview_{i // per + 1:02d}.jpg"), cols=8)
    print(f"[2/6] overview sheets: {(len(renamed) + per - 1) // per}")

    # 2. cuts + rhythm
    cuts = detect_cuts(a.video, a.scene)
    bounds = [0.0] + cuts + [dur]
    shots = [{"start": round(bounds[i], 3), "end": round(bounds[i + 1], 3),
              "len": round(bounds[i + 1] - bounds[i], 3)} for i in range(len(bounds) - 1)
             if bounds[i + 1] - bounds[i] > 0.05]
    lens = [s["len"] for s in shots]
    rhythm = {
        "cuts": len(cuts),
        "avg_shot_len": round(float(np.mean(lens)), 2),
        "median_shot_len": round(float(np.median(lens)), 2),
        "min_shot_len": round(min(lens), 2),
        "max_shot_len": round(max(lens), 2),
        "cuts_per_10s": round(len(cuts) / dur * 10, 2),
    }
    print(f"[3/6] cuts: {len(cuts)}  avg shot {rhythm['avg_shot_len']}s")

    # 3. per-shot key frame (mid) at full res + palette
    for i, s in enumerate(shots):
        mid = (s["start"] + s["end"]) / 2
        kp = os.path.join(out, "shots", f"shot{i + 1:02d}_{mid:06.2f}s.png")
        if frame_at(a.video, mid, kp):
            s["key_frame"] = kp
            s["palette"] = palette(kp)
            s["accents"] = accent_colors(kp)
    print(f"[4/6] palettes for {len(shots)} shots")

    # 4. dense strips: 1.2s window starting at every cut (+ start of video) -> motion study
    starts = [0.0] + cuts
    for j, t0 in enumerate(starts):
        t0 = max(0.0, t0 - 0.1)
        d = os.path.join(out, "dense", f"at_{t0:06.2f}s")
        os.makedirs(d, exist_ok=True)
        run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t0:.3f}", "-t", "1.2", "-i", a.video,
             "-vf", f"fps={a.dense_fps},scale=200:-1", os.path.join(d, "f_%03d.jpg")])
        fs = sorted(os.path.join(d, x) for x in os.listdir(d))
        if fs:
            contact_sheet(fs, os.path.join(out, "dense", f"strip_{t0:06.2f}s.jpg"), cols=6, label=False)
        shutil.rmtree(d)
    print(f"[5/6] motion strips: {len(starts)}")

    # 5. key frames every 1s at full res (candidates for golden frames)
    t = 0.5
    while t < dur:
        frame_at(a.video, t, os.path.join(out, "key", f"{t:06.2f}s.png"))
        t += 1.0

    # 6. audio for transcription
    wav = None
    if meta["has_audio"]:
        wav = os.path.join(out, "audio_16k.wav")
        run(["ffmpeg", "-v", "error", "-y", "-i", a.video, "-ac", "1", "-ar", "16000",
             "-c:a", "pcm_s16le", wav])

    report = {"video": a.video, "meta": meta, "rhythm": rhythm, "cuts": cuts,
              "shots": shots, "audio_wav": wav,
              "how_to_read": {
                  "overview_XX.jpg": "2 fps, labeled with timestamps - structure & layout",
                  "dense/strip_*.jpg": "10 fps, 1.2s after each cut - read entry animations & transitions",
                  "shots/*.png": "full-res middle frame of each shot + palette in this json",
                  "key/*.png": "1 frame per second, full res - pick golden frames from here"}}
    with open(os.path.join(out, "report.json"), "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    print(f"[6/6] done -> {out}/report.json")


if __name__ == "__main__":
    main()
