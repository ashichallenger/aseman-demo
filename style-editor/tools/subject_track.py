#!/usr/bin/env python3
"""
subject_track.py — per-frame subject anchors + alpha matte for a talking-head video.

Outputs (in the job folder of the input video, see CLAUDE.md "Data contracts"):
  subject.json   normalized anchors per frame (One-Euro smoothed)
  mask/%05d.png  alpha matte of the person (white = person), 1 file per frame
  fg.webm        the person cut out on transparent background (VP9 + alpha) for Remotion
                 (text-behind-subject, silhouettes, echo outlines, light bursts)

Models (models/):
  MediaPipe Face Landmarker + Pose Landmarker (heavy), Robust Video Matting (ONNX, mobilenetv3
  by default, --hq for resnet50). Falls back to the MediaPipe selfie segmenter if RVM fails.

Usage:
    python tools/subject_track.py jobs/<job>/src30.mp4 [--hq] [--no-mask]
The input should already be at the edit frame rate (30 fps); frame i <-> time i/30.
"""
import argparse
import json
import math
import os
import subprocess
import sys

import cv2
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
M = os.path.join(ROOT, "models")


class OneEuro:
    def __init__(self, freq, min_cutoff=0.6, beta=0.02, d_cutoff=1.0):
        self.freq, self.mc, self.beta, self.dc = freq, min_cutoff, beta, d_cutoff
        self.x = None
        self.dx = 0.0

    @staticmethod
    def _alpha(cutoff, freq):
        tau = 1.0 / (2 * math.pi * cutoff)
        return 1.0 / (1.0 + tau * freq)

    def __call__(self, x):
        if x is None or (isinstance(x, float) and math.isnan(x)):
            return self.x
        if self.x is None:
            self.x = x
            return x
        dx = (x - self.x) * self.freq
        a_d = self._alpha(self.dc, self.freq)
        self.dx = a_d * dx + (1 - a_d) * self.dx
        cutoff = self.mc + self.beta * abs(self.dx)
        a = self._alpha(cutoff, self.freq)
        self.x = a * x + (1 - a) * self.x
        return self.x


def interp_missing(arr):
    """arr: list of float|None -> fill gaps by linear interpolation / edge hold."""
    a = np.array([np.nan if v is None else v for v in arr], dtype=float)
    idx = np.arange(len(a))
    ok = ~np.isnan(a)
    if ok.sum() == 0:
        return a
    a[~ok] = np.interp(idx[~ok], idx[ok], a[ok])
    return a


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--hq", action="store_true", help="RVM resnet50 instead of mobilenetv3")
    ap.add_argument("--no-mask", action="store_true")
    ap.add_argument("--downsample", type=float, default=0.25)
    a = ap.parse_args()

    import mediapipe as mp
    from mediapipe.tasks import python as mpt
    from mediapipe.tasks.python import vision
    import onnxruntime as ort

    job = os.path.dirname(os.path.abspath(a.video))
    cap = cv2.VideoCapture(a.video)
    fps = cap.get(cv2.CAP_PROP_FPS)
    W = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    H = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    N = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    print(f"[1/4] {W}x{H} @ {fps} fps, {N} frames")

    face = vision.FaceLandmarker.create_from_options(vision.FaceLandmarkerOptions(
        base_options=mpt.BaseOptions(model_asset_path=os.path.join(M, "mediapipe", "face_landmarker.task")),
        running_mode=vision.RunningMode.VIDEO, num_faces=1))
    pose = vision.PoseLandmarker.create_from_options(vision.PoseLandmarkerOptions(
        base_options=mpt.BaseOptions(model_asset_path=os.path.join(M, "mediapipe", "pose_landmarker_heavy.task")),
        running_mode=vision.RunningMode.VIDEO, num_poses=1))

    rvm = None
    if not a.no_mask:
        name = "rvm_resnet50_fp32.onnx" if a.hq else "rvm_mobilenetv3_fp32.onnx"
        try:
            rvm = ort.InferenceSession(os.path.join(M, "rvm", name), providers=["CPUExecutionProvider"])
        except Exception as e:  # fallback documented in DECISIONS.md
            print("RVM failed, falling back to MediaPipe selfie segmenter:", e)
        mask_dir = os.path.join(job, "mask")
        os.makedirs(mask_dir, exist_ok=True)
        seg = None
        if rvm is None:
            seg = vision.ImageSegmenter.create_from_options(vision.ImageSegmenterOptions(
                base_options=mpt.BaseOptions(model_asset_path=os.path.join(M, "mediapipe", "selfie_segmenter.tflite")),
                running_mode=vision.RunningMode.VIDEO, output_confidence_masks=True))
        # fg.webm writer: RGBA frames piped to ffmpeg (VP9 with alpha)
        fg = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgba",
                               "-s", f"{W}x{H}", "-r", str(fps), "-i", "-", "-c:v", "libvpx-vp9",
                               "-pix_fmt", "yuva420p", "-deadline", "realtime", "-cpu-used", "8",
                               "-row-mt", "1", "-crf", "18", "-b:v", "0", "-auto-alt-ref", "0",
                               os.path.join(job, "fg.webm")], stdin=subprocess.PIPE)
    rec = [np.zeros([1, 1, 1, 1], np.float32)] * 4
    ds = np.array([a.downsample], np.float32)

    raw = []
    for f in range(N):
        ok, bgr = cap.read()
        if not ok:
            break
        rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
        ts = int(f * 1000 / fps)
        mimg = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        fr = face.detect_for_video(mimg, ts)
        pr = pose.detect_for_video(mimg, ts)
        d = {"f": f}
        if fr.face_landmarks:
            lm = fr.face_landmarks[0]
            xs = np.array([p.x for p in lm]); ys = np.array([p.y for p in lm])
            d["face"] = [float(xs.min()), float(ys.min()), float(xs.max()), float(ys.max())]
            d["eye_line"] = float(np.mean([lm[i].y for i in (33, 133, 263, 362, 159, 386)]))
            d["chin"] = float(lm[152].y)
            d["forehead"] = float(lm[10].y)
            d["nose"] = [float(lm[1].x), float(lm[1].y)]
            d["mouth"] = [float(lm[13].x), float(lm[13].y), float(lm[14].y)]
        if pr.pose_landmarks:
            pl = pr.pose_landmarks[0]
            g = lambda i: (float(pl[i].x), float(pl[i].y), float(pl[i].visibility or 0))
            d["sh_l"], d["sh_r"] = g(11), g(12)
            d["hip_l"], d["hip_r"] = g(23), g(24)
            # hands: mean of wrist, pinky, index, thumb points
            for side, ids in (("hand_a", (15, 17, 19, 21)), ("hand_b", (16, 18, 20, 22))):
                pts = [g(i) for i in ids]
                d[side] = (float(np.mean([p[0] for p in pts])), float(np.mean([p[1] for p in pts])),
                           float(np.mean([p[2] for p in pts])))
        if not a.no_mask:
            if rvm is not None:
                src = (rgb.astype(np.float32) / 255.0).transpose(2, 0, 1)[None]
                _fgr, pha, *rec = rvm.run(None, {"src": src, "r1i": rec[0], "r2i": rec[1], "r3i": rec[2],
                                                 "r4i": rec[3], "downsample_ratio": ds})
                alpha = pha[0, 0]
            else:
                sr = seg.segment_for_video(mimg, ts)
                alpha = sr.confidence_masks[0].numpy_view().astype(np.float32)
                alpha = cv2.resize(alpha, (W, H))
            alpha = np.clip(alpha, 0, 1)
            a8 = (alpha * 255).astype(np.uint8)
            cv2.imwrite(os.path.join(mask_dir, f"{f:05d}.png"), a8)
            rgba = np.dstack([rgb, a8])
            fg.stdin.write(rgba.tobytes())
            # mask-derived anchors
            ys_, xs_ = np.where(a8 > 127)
            if len(xs_):
                d["sbox"] = [float(xs_.min() / W), float(ys_.min() / H), float(xs_.max() / W), float(ys_.max() / H)]
                d["mass_l"] = float((xs_ < W / 2).mean())
                if "face" in d:
                    x0, x1 = int(d["face"][0] * W), int(d["face"][2] * W)
                    colmask = a8[:, max(0, x0):max(x0 + 1, x1)] > 127
                    rows = np.where(colmask.any(axis=1))[0]
                    if len(rows):
                        d["head_top_mask"] = float(rows.min() / H)
        raw.append(d)
        if f % 150 == 0:
            print(f"  frame {f}/{N}", flush=True)
    cap.release()
    if not a.no_mask:
        fg.stdin.close()
        fg.wait()
    print("[2/4] detection done")

    n = len(raw)
    getv = lambda key, k=None: [(r[key][k] if k is not None else r[key]) if key in r else None for r in raw]
    fx0, fy0, fx1, fy1 = (interp_missing(getv("face", k)) for k in range(4))
    eye = interp_missing(getv("eye_line")); chin = interp_missing(getv("chin"))
    fore = interp_missing(getv("forehead"))
    htm = interp_missing(getv("head_top_mask"))
    shlx, shly = interp_missing(getv("sh_l", 0)), interp_missing(getv("sh_l", 1))
    shrx, shry = interp_missing(getv("sh_r", 0)), interp_missing(getv("sh_r", 1))
    hax, hay, hav = (interp_missing(getv("hand_a", k)) for k in range(3))
    hbx, hby, hbv = (interp_missing(getv("hand_b", k)) for k in range(3))
    sb = [interp_missing(getv("sbox", k)) for k in range(4)] if not a.no_mask else None
    massl = interp_missing(getv("mass_l")) if not a.no_mask else None

    def smooth(arr, mc=0.6, beta=0.02):
        fl = OneEuro(fps, mc, beta)
        return np.array([fl(float(v)) if not np.isnan(v) else np.nan for v in arr])

    S = {k: smooth(v) for k, v in dict(fx0=fx0, fy0=fy0, fx1=fx1, fy1=fy1, eye=eye, chin=chin, fore=fore,
                                       shlx=shlx, shly=shly, shrx=shrx, shry=shry).items()}
    S.update({k: smooth(v, 1.0, 0.05) for k, v in dict(hax=hax, hay=hay, hbx=hbx, hby=hby).items()})
    if not np.isnan(htm).all():
        S["htm"] = smooth(htm, 0.4, 0.01)
    if sb is not None:
        for i, k in enumerate(("sx0", "sy0", "sx1", "sy1")):
            S[k] = smooth(sb[i], 0.4, 0.01)
        S["massl"] = smooth(massl, 0.2, 0.0)

    frames = []
    r4 = lambda v: round(float(v), 4)
    for i in range(n):
        fw = S["fx1"][i] - S["fx0"][i]
        fh = S["fy1"][i] - S["fy0"][i]
        # head top: hair line from the mask when available, else forehead - 25% face height
        ht = S["htm"][i] if "htm" in S and not np.isnan(S["htm"][i]) else S["fore"][i] - 0.25 * fh
        ht = min(ht, S["fy0"][i])
        hcx = (S["fx0"][i] + S["fx1"][i]) / 2
        hcy = (ht + S["chin"][i]) / 2
        sl_x, sr_x = min(S["shlx"][i], S["shrx"][i]), max(S["shlx"][i], S["shrx"][i])
        sh_y = (S["shly"][i] + S["shry"][i]) / 2
        sw = sr_x - sl_x
        chest = [sl_x + 0.08 * sw, sh_y, 0.84 * sw, 0.55 * sw * (W / H)]
        # hands in image coords: a/b sorted by x -> l (image left), r (image right)
        h1 = (S["hax"][i], S["hay"][i]); h2 = (S["hbx"][i], S["hby"][i])
        hl, hr = (h1, h2) if h1[0] <= h2[0] else (h2, h1)
        if sb is not None:
            sbox = [S["sx0"][i], S["sy0"][i], S["sx1"][i] - S["sx0"][i], S["sy1"][i] - S["sy0"][i]]
            empty = "right" if S["massl"][i] > 0.5 else "left"
        else:
            sbox = [sl_x - 0.1, ht, sw + 0.2, 1 - ht]
            empty = "right" if hcx < 0.5 else "left"
        frames.append({
            "f": i,
            "face_box": [r4(S["fx0"][i]), r4(S["fy0"][i]), r4(fw), r4(fh)],
            "head_top": r4(ht), "head_center": [r4(hcx), r4(hcy)],
            "eye_line": r4(S["eye"][i]), "chin": r4(S["chin"][i]),
            "chest_box": [r4(v) for v in chest],
            "torso_center": [r4(chest[0] + chest[2] / 2), r4(chest[1] + chest[3] / 2)],
            "hands": {"l": [r4(hl[0]), r4(hl[1])], "r": [r4(hr[0]), r4(hr[1])]},
            "empty_side": empty,
            "subject_box": [r4(v) for v in sbox],
        })
    with open(os.path.join(job, "subject.json"), "w") as f:
        json.dump({"fps": fps, "w": W, "h": H, "frames": frames}, f, separators=(",", ":"))
    with open(os.path.join(job, "subject_raw.json"), "w") as f:
        json.dump(raw, f, separators=(",", ":"))
    print(f"[3/4] subject.json: {n} frames")
    print("[4/4] done")


if __name__ == "__main__":
    main()
