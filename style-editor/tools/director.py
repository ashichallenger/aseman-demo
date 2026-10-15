#!/usr/bin/env python3
"""
director.py — turn transcript.json + subject.json into edl.json for a style (CLAUDE.md data contract).

Common part (all styles): jump-cut silences, split into shots with the style's rhythm and
alternating framing, keep a src->out time map, convert word times to the OUTPUT timeline.
Style part: `plan_<style>()` applies STYLE.md §"Speech -> treatment rules" and writes items.

Usage:
    python tools/director.py jobs/<job> --style saye [--gallery]
"""
import argparse
import importlib
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

FPS = 30

STYLE_CFG = {
    # silence threshold (s), shot length range (s), framing cycle [(name, zoom_start, zoom_end)]
    "saye": dict(gap=0.30, shot=(1.8, 5.0), target=3.6,
                 framings=[("medium", 1.00, 1.04), ("close", 1.35, 1.40)]),
    "zarbe": dict(gap=0.25, shot=(1.0, 2.0), target=1.45,
                  framings=[("wide", 1.00, 1.03), ("medium", 1.35, 1.38), ("close", 1.75, 1.80)]),
    "majalle": dict(gap=0.30, shot=(1.7, 2.6), target=2.1,
                    framings=[("page", 1.00, 1.06)]),
    "neon": dict(gap=0.25, shot=(1.0, 2.0), target=1.5,
                 framings=[("wide", 1.00, 1.03), ("medium", 1.30, 1.34), ("close", 1.60, 1.64)]),
}


def load(job):
    with open(os.path.join(job, "transcript.json"), encoding="utf-8") as f:
        tr = json.load(f)
    with open(os.path.join(job, "subject.json")) as f:
        subj = json.load(f)
    return tr, subj


def keep_ranges(words, gap, total, pad_in=0.07, pad_out=0.10):
    """Speech ranges in source seconds; silences longer than `gap` are removed."""
    rs = []
    cur = [max(0.0, words[0]["start"] - pad_in), words[0]["end"] + pad_out]
    for a, b in zip(words, words[1:]):
        if b["start"] - a["end"] > gap:
            cur[1] = min(cur[1], b["start"] - pad_in) if b["start"] - pad_in > cur[0] else cur[1]
            rs.append(cur)
            cur = [b["start"] - pad_in, b["end"] + pad_out]
        else:
            cur[1] = b["end"] + pad_out
    cur[1] = min(cur[1], total)
    rs.append(cur)
    # snap to frames, merge overlaps
    out = []
    for a, b in rs:
        a, b = round(a * FPS) / FPS, round(b * FPS) / FPS
        if out and a <= out[-1][1]:
            out[-1][1] = max(out[-1][1], b)
        elif b - a >= 2 / FPS:
            out.append([a, b])
    return out


def split_shots(ranges, words, cfg, sentence_starts):
    """Split keep-ranges into shots of the style's length, cutting only at word starts
    (prefer sentence starts). Returns list of [src_in, src_out]."""
    lo, hi = cfg["shot"]
    tgt = cfg["target"]
    shots = []
    for a, b in ranges:
        starts = [w["start"] - 0.03 for w in words if a + lo * 0.6 < w["start"] < b - lo * 0.6]
        sent_s = set(round(s - 0.03, 3) for s in sentence_starts)
        t = a
        while b - t > hi:
            cands = [s for s in starts if lo <= s - t <= hi]
            if not cands:
                break
            # score: near target, prefer sentence boundaries
            best = min(cands, key=lambda s: abs((s - t) - tgt) - (0.8 if round(s, 3) in sent_s else 0))
            if b - best < lo * 0.7:
                break
            shots.append([t, round(best * FPS) / FPS])
            t = round(best * FPS) / FPS
        shots.append([t, b])
    return shots


def build_timeline(job, style, framing_cycle=None):
    tr, subj = load(job)
    cfg = STYLE_CFG[style]
    words = tr["words"]
    total = len(subj["frames"]) / FPS
    ranges = keep_ranges(words, cfg["gap"], total)
    shots = split_shots(ranges, words, cfg, [s["start"] for s in tr["sentences"]])
    fr = framing_cycle or cfg["framings"]
    segs, mp = [], []
    out_t = 0.0
    prev_range_end = None
    k = 0
    since = 0.0  # time on the current framing; only change framing once a shot is long enough
    for (a, b) in shots:
        if segs and since >= cfg["shot"][0] * 0.9:
            k += 1
            since = 0.0
        name, z0, z1 = fr[k % len(fr)]
        since += b - a
        segs.append({"src_in": round(a, 3), "src_out": round(b, 3), "framing": name, "zoom": [z0, z1]})
        mp.append({"src_in": round(a, 3), "src_out": round(b, 3), "out_in": round(out_t, 3)})
        out_t += round((b - a) * FPS) / FPS
    return tr, subj, segs, mp, out_t


def src2out(mp, t):
    for m in mp:
        if m["src_in"] - 1e-6 <= t <= m["src_out"] + 1e-6:
            return m["out_in"] + (t - m["src_in"])
    # inside a removed gap -> next segment start
    for m in mp:
        if t < m["src_in"]:
            return m["out_in"]
    last = mp[-1]
    return last["out_in"] + (last["src_out"] - last["src_in"])


def tokens_for(tr, mp, idxs, key=None):
    out = []
    for i in idxs:
        w = tr["words"][i]
        out.append({"i": i, "w": w["w"], "t": round(src2out(mp, w["start"]), 3),
                    "e": round(src2out(mp, w["end"]), 3), "stress": w["stress"], **({"key": True} if i == key else {})})
    return out


def out2src(mp, t):
    for m in mp:
        d = m["src_out"] - m["src_in"]
        if m["out_in"] - 1e-6 <= t <= m["out_in"] + d + 1e-6:
            return m["src_in"] + (t - m["out_in"])
    return mp[-1]["src_out"]


def make_gallery(edl, pre=0.25, maxdur=3.2):
    """Gallery: one window per treatment (its first use), with every item overlapping that window,
    played back to back. Returns a new EDL whose items keep real text and timing."""
    mp = edl["map"]
    seen, windows = set(), []
    for it in edl["items"]:
        name = it["treatment"] + (("-" + it["props"]["page"]) if "page" in it.get("props", {}) else "")
        if name in seen:
            continue
        seen.add(name)
        a = max(0.0, it["from"] - pre)
        b = min(it["to"] + 0.4, a + maxdur)
        windows.append((name, a, b))
    segs, items, trans, gmap = [], [], [], []
    t_out = 0.0
    for k, (name, a, b) in enumerate(windows):
        # window in output time -> pieces of source segments
        for s_i, m in enumerate(mp):
            d = m["src_out"] - m["src_in"]
            lo, hi = max(a, m["out_in"]), min(b, m["out_in"] + d)
            if hi - lo < 2 / FPS:
                continue
            src_a = m["src_in"] + (lo - m["out_in"])
            seg = dict(edl["segments"][s_i])
            seg["src_in"], seg["src_out"] = round(src_a, 3), round(src_a + (hi - lo), 3)
            segs.append(seg)
            gmap.append({"src_in": seg["src_in"], "src_out": seg["src_out"], "out_in": round(t_out + (lo - a), 3)})
        shift = t_out - a
        for it in edl["items"]:
            if it["to"] > a and it["from"] < b:
                j = json.loads(json.dumps(it))
                j["id"] = f"g{k}_{it['id']}"
                j["from"] = round(max(a, it["from"]) + shift, 3)
                j["to"] = round(min(b - 0.15, it["to"]) + shift, 3)
                for tk in j.get("tokens", []):
                    tk["t"] = round(tk["t"] + shift, 3)
                    tk["e"] = round(tk["e"] + shift, 3)
                for key in ("stepTimes", "noteTimes", "titleAt"):
                    if key in j.get("props", {}):
                        v = j["props"][key]
                        j["props"][key] = [round(x + shift, 3) for x in v] if isinstance(v, list) else round(v + shift, 3)
                items.append(j)
        for tr in edl["transitions"]:
            if a < tr["at"] < b:
                trans.append({**tr, "at": round(tr["at"] + shift, 3)})
        t_out += round((b - a) * FPS) / FPS
    g = dict(edl)
    g.update({"segments": segs, "items": items, "transitions": trans, "map": gmap,
              "gallery": [{"treatment": n, "from": round(sum(round((w[2] - w[1]) * FPS) / FPS for w in windows[:i]), 3),
                           "dur": round(w[2] - w[1], 3)} for i, (n, w) in enumerate(zip([w[0] for w in windows], windows))]})
    return g


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("job")
    ap.add_argument("--style", required=True)
    ap.add_argument("--gallery", action="store_true")
    a = ap.parse_args()
    mod = importlib.import_module(f"plan_{a.style}")
    tr, subj, segs, mp, dur = build_timeline(a.job, a.style, getattr(mod, "FRAMINGS", None))
    edl = {"style": a.style, "fps": FPS, "job": os.path.relpath(a.job, os.path.join(HERE, "..")),
           "video": "src30.mp4", "fg": "fg.webm", "segments": segs, "map": mp, "items": [], "transitions": []}
    ctx = dict(tr=tr, subj=subj, mp=mp, dur=dur, src2out=lambda t: src2out(mp, t),
               tokens=lambda idxs, key=None: tokens_for(tr, mp, idxs, key))
    mod.plan(edl, ctx)
    name = f"gallery_{a.style}.json" if a.gallery else f"edl_{a.style}.json"
    if a.gallery:
        edl = make_gallery(edl)
    with open(os.path.join(a.job, name), "w", encoding="utf-8") as f:
        json.dump(edl, f, ensure_ascii=False, indent=1)
    # compact table (replaces checkpoint B view)
    with open(os.path.join(a.job, name.replace(".json", "_table.md")), "w", encoding="utf-8") as f:
        f.write("| # | time (out) | on-screen | treatment | layer/placement |\n|---|---|---|---|---|\n")
        for n, it in enumerate(edl["items"]):
            txt = " ".join(t["w"] for t in it.get("tokens", [])) or it.get("props", {}).get("text", "")
            f.write(f"| {n} | {it['from']:.2f}-{it['to']:.2f} | {txt} | {it['treatment']} | "
                    f"{it.get('layer', 'front')} {it.get('anchor', '')} |\n")
    print(f"{name}: {len(segs)} segments, {len(edl['items'])} items, {dur:.2f}s")


if __name__ == "__main__":
    main()
