#!/usr/bin/env python3
"""sbs.py — side-by-side QA images [golden | ours] for every treatment of a gallery render.

Usage: python tools/sbs.py --style saye --video qa/saye/gallery.mp4 --gallery jobs/<job>/gallery_saye.json
       [--at Treatment=0.7 ...]  (fraction of the window where the treatment is "complete", default 0.65)
       [--golden Treatment=FileStem ...] (override golden pick)
Writes qa/<style>/sbs_<Treatment>.jpg and qa/<style>/sbs_all.jpg (contact sheet).
"""
import argparse
import glob
import json
import os
import subprocess

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT = os.path.join(ROOT, "remotion", "public", "fonts", "Inter-600.ttf")


def grab(video, t, out):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.3f}", "-i", video, "-frames:v", "1", out], check=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--style", required=True)
    ap.add_argument("--video", required=True)
    ap.add_argument("--gallery", required=True)
    ap.add_argument("--at", nargs="*", default=[])
    ap.add_argument("--golden", nargs="*", default=[])
    ap.add_argument("--round", default="r1")
    a = ap.parse_args()
    at = {k: float(v) for k, v in (x.split("=") for x in a.at)}
    gold_over = dict(x.split("=") for x in a.golden)
    g = json.load(open(a.gallery, encoding="utf-8"))
    qa = os.path.join(ROOT, "qa", a.style)
    os.makedirs(qa, exist_ok=True)
    font = ImageFont.truetype(FONT, 28)
    tiles = []
    for w in g["gallery"]:
        name = w["treatment"]
        t = w["from"] + w["dur"] * at.get(name, 0.65)
        ours = os.path.join(qa, f"ours_{name}.png")
        grab(a.video, t, ours)
        stem = gold_over.get(name, name)
        gs = sorted(glob.glob(os.path.join(ROOT, "styles", a.style, "golden", f"{stem}__*.png")))
        left = Image.open(gs[0]).convert("RGB") if gs else Image.new("RGB", (1080, 1920), (40, 40, 40))
        right = Image.open(ours).convert("RGB")
        h = 960
        left = left.resize((int(left.width * h / left.height), h))
        right = right.resize((int(right.width * h / right.height), h))
        sbs = Image.new("RGB", (left.width + right.width + 12, h + 44), (20, 20, 20))
        sbs.paste(left, (0, 44))
        sbs.paste(right, (left.width + 12, 44))
        d = ImageDraw.Draw(sbs)
        d.text((10, 6), f"GOLDEN {os.path.basename(gs[0]) if gs else '(none)'}", fill=(255, 220, 0), font=font)
        d.text((left.width + 22, 6), f"OURS {name} @ {t:.2f}s ({a.round})", fill=(0, 255, 160), font=font)
        p = os.path.join(qa, f"sbs_{name}.jpg")
        sbs.save(p, quality=88)
        tiles.append(sbs)
        print(p)
    if tiles:
        cols = 3
        tw, th = tiles[0].width, tiles[0].height
        rows = (len(tiles) + cols - 1) // cols
        sheet = Image.new("RGB", (cols * tw, rows * th), (10, 10, 10))
        for i, im in enumerate(tiles):
            sheet.paste(im.resize((tw, th)), ((i % cols) * tw, (i // cols) * th))
        sheet = sheet.resize((sheet.width // 2, sheet.height // 2))
        sheet.save(os.path.join(qa, f"sbs_all_{a.round}.jpg"), quality=85)


if __name__ == "__main__":
    main()
