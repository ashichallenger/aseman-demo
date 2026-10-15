#!/usr/bin/env python3
"""anchor_check.py — draw subject.json anchors + 50 % red mask on chosen frames (QA for phase 2).

Usage: python tools/anchor_check.py jobs/<job> [frame ...]   (default: first, middle, last)
Writes jobs/<job>/qa/anchors_<frame>.jpg and anchors_sheet.jpg
"""
import json
import os
import sys

import cv2
import numpy as np


def main():
    job = sys.argv[1]
    video = os.path.join(job, "src30.mp4")
    with open(os.path.join(job, "subject.json")) as f:
        S = json.load(f)
    n = len(S["frames"])
    frames = [int(x) for x in sys.argv[2:]] or [0, n // 2, n - 1]
    os.makedirs(os.path.join(job, "qa"), exist_ok=True)
    cap = cv2.VideoCapture(video)
    outs = []
    for fi in frames:
        cap.set(cv2.CAP_PROP_POS_FRAMES, fi)
        ok, img = cap.read()
        if not ok:
            continue
        H, W = img.shape[:2]
        mp = os.path.join(job, "mask", f"{fi:05d}.png")
        if os.path.exists(mp):
            m = cv2.imread(mp, 0).astype(np.float32)[..., None] / 255.0
            red = np.zeros_like(img); red[..., 2] = 255
            img = (img * (1 - 0.45 * m) + red * 0.45 * m).astype(np.uint8)
        a = S["frames"][fi]
        P = lambda x, y: (int(x * W), int(y * H))
        def box(b, col, lab):
            x, y, w, h = b
            cv2.rectangle(img, P(x, y), P(x + w, y + h), col, 4)
            cv2.putText(img, lab, P(x, y - 0.006), cv2.FONT_HERSHEY_SIMPLEX, 1.1, col, 3)
        def hline(y, col, lab):
            cv2.line(img, (0, int(y * H)), (W, int(y * H)), col, 2)
            cv2.putText(img, lab, (10, int(y * H) - 8), cv2.FONT_HERSHEY_SIMPLEX, 1.0, col, 3)
        def dot(p, col, lab):
            cv2.circle(img, P(*p), 14, col, -1)
            cv2.putText(img, lab, (P(*p)[0] + 18, P(*p)[1]), cv2.FONT_HERSHEY_SIMPLEX, 1.0, col, 3)
        box(a["face_box"], (0, 255, 255), "face")
        box(a["chest_box"], (255, 200, 0), "chest")
        box(a["subject_box"], (255, 255, 255), "subject")
        hline(a["head_top"], (0, 255, 0), "head_top")
        hline(a["eye_line"], (255, 0, 255), "eye")
        hline(a["chin"], (0, 128, 255), "chin")
        dot(a["head_center"], (0, 255, 0), "head")
        dot(a["torso_center"], (255, 200, 0), "torso")
        dot(a["hands"]["l"], (255, 0, 0), "hand L")
        dot(a["hands"]["r"], (0, 0, 255), "hand R")
        cv2.putText(img, f"f={fi} empty={a['empty_side']}", (20, H - 40), cv2.FONT_HERSHEY_SIMPLEX, 1.6, (255, 255, 255), 4)
        out = os.path.join(job, "qa", f"anchors_{fi:05d}.jpg")
        cv2.imwrite(out, img)
        outs.append(cv2.resize(img, (540, 960)))
    if outs:
        cv2.imwrite(os.path.join(job, "qa", "anchors_sheet.jpg"), np.hstack(outs))
    print("ok", frames)


if __name__ == "__main__":
    main()
