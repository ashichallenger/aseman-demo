"""plan_zarbe — STYLE.md §6 for style zarbe, applied to this job (director decisions, see DECISIONS.md).

Rhythm: 1–2 s shots alternating wide/medium/close (100/135/175 % crops on the head), silences > 0.25 s cut.
Exactly one hero word per sentence; LightBurst before every RedCard + on ~20 % of cuts.
Each entry: sentence id -> list of (treatment, spec). Word ranges are transcript indices (inclusive).
"""
from plan_common import phrases, sentence_words

FRAMINGS = [("wide", 1.00, 1.03), ("medium", 1.35, 1.38), ("close", 1.72, 1.76)]

R = lambda a, b: list(range(a, b + 1))

PLAN = {
    0: [("Stack", {"words": R(0, 5), "rows": [("script", R(0, 0)), ("hero", R(1, 2)), ("sans", R(3, 5))]}),
        ("HeroBehind", {"at": 6, "text": "GTA VI", "white": True, "stretch": 1.7, "covers": [6, 7]})],
    1: [("PairWide", {"words": R(10, 12), "hero": 12}),
        ("BrollCard", {"at": 16, "stat": "1.5M", "statWord": "میلیون نفر"})],
    2: [("HeroBehind", {"at": 24, "text": "آمریکا"})],
    3: [("HeroBehind", {"at": 32, "text": "۲۶ آبان", "white": True, "covers": [32, 33]})],
    4: [("ArcText", {"words": R(39, 44), "key": 42}), ("SurfaceWord", {"words": R(45, 51)})],
    5: [("Stack", {"words": R(52, 60), "rows": [("script", R(52, 53)), ("hero", R(55, 56)), ("sans", R(57, 60))]})],
    6: [("SilhouetteCut", {}), ("ArcText", {"words": R(63, 67), "key": 67, "onLight": True})],
    7: [("HeroBehind", {"at": 74, "text": "منتشر"})],
    8: [("HeroBehind", {"at": 78, "text": "FBI"}), ("Stickers", {"words": [80, 82, 84]})],
    9: [("RedCard", {"words": R(85, 95), "pre": R(85, 91), "title": 92, "script": "یک شرکت باشه؟"})],
    10: [("SurfaceWord", {"words": R(96, 101)})],
    11: [("PairWide", {"words": [102, 103, 104, 108], "hero": 104, "swaps": [108]})],
    12: [("Stack", {"words": R(113, 123), "rows": [("script", R(113, 115)), ("hero", R(116, 116)), ("sans", R(117, 121)),
                                                   ("hero", R(122, 123))]})],
    13: [("Stickers", {"words": [126, 129, 132]})],
    14: [("ArcText", {"words": R(137, 143), "key": 138})],
    15: [("SurfaceWord", {"words": R(144, 158)})],
    16: [("BrollCard", {"at": 159, "stat": "30M", "statWord": "نفر می‌بینن"})],
    17: [("PairWide", {"words": R(164, 166), "hero": 166}), ("HeroBehind", {"at": 173, "text": "35M", "white": True})],
    18: [("HeroBehind", {"at": 178, "text": "بیشتر"})],
    19: [("RedCard", {"words": R(181, 189), "pre": R(181, 184), "title": 185, "script": "مارکتینگ و بازاریابی"})],
    20: [("HeroBehind", {"at": 195, "text": "وایرال"})],
    21: [("PairWide", {"words": [202, 203], "hero": 203})],
    22: [("HeroBehind", {"at": 220, "text": "لیک"})],
    23: [("SurfaceWord", {"words": R(222, 227)})],
    24: [("SilhouetteCut", {}), ("ArcText", {"words": R(233, 237), "key": 236, "onLight": True})],
    25: [("HeroBehind", {"at": 242, "text": "بی‌خبرند"})],
    26: [("Stack", {"words": R(243, 253), "rows": [("script", R(243, 245)), ("hero", R(246, 247)), ("sans", R(248, 253))]})],
}
BURST_AT_SENT = {2, 9, 13, 16, 19, 24}  # LightBurst at the start of these sentences (RedCards + ~20 % of cuts)


def plan(edl, c):
    tr, tokens, dur, s2o = c["tr"], c["tokens"], c["dur"], c["src2out"]
    sents = tr["sentences"]
    W = tr["words"]
    items, n = [], 0
    trans = []

    def add(**kw):
        nonlocal n
        n += 1
        kw.setdefault("id", f"i{n}")
        items.append(kw)

    for s in sents:
        sid = s["id"]
        ws = sentence_words(tr, sid)
        nxt = sents[sid + 1] if sid + 1 < len(sents) else None
        s_end = s2o(nxt["start"]) - 0.03 if nxt else dur
        s0 = s2o(ws[0]["start"]) - 0.02
        if sid in BURST_AT_SENT:
            trans.append({"at": round(s0, 3), "type": "LightBurst"})
        for name, spec in PLAN.get(sid, []):
            if name == "HeroBehind":
                t = s2o(W[spec["at"]]["start"])
                add(treatment=name, **{"from": round(t, 3), "to": round(s_end, 3)}, layer="behind", key=spec["at"],
                    words=spec.get("covers", [spec["at"]]),
                    anchor="head_center", props={"text": spec["text"], "white": spec.get("white", False),
                                                 "stretch": spec.get("stretch", 1.55), "punch": True})
            elif name == "Stack":
                idx = spec["words"]
                rows = []
                for kind, ri in spec["rows"]:
                    rows.append({"kind": kind, "idx": [idx.index(i) for i in ri],
                                 "align": "left" if kind == "script" and not rows else ("right" if kind == "script" else "center")})
                if rows and rows[-1]["kind"] == "script":
                    rows[-1]["align"] = "right"
                add(treatment=name, **{"from": round(s2o(W[idx[0]]["start"]) - 0.02, 3), "to": round(s_end, 3)},
                    words=idx, layer="front", anchor="chest_box", tokens=tokens(idx), props={"rows": rows})
            elif name == "PairWide":
                idx = spec["words"]
                hero = spec["hero"]
                add(treatment=name, **{"from": round(s2o(W[idx[0]]["start"]) - 0.02, 3),
                                       "to": round(min(s_end, s2o(W[idx[-1]]["end"]) + 0.9), 3)},
                    words=idx, key=hero, layer="front", anchor="chest_box", tokens=tokens(idx, hero),
                    props={"hero": idx.index(hero), "swaps": [{"i": idx.index(x)} for x in spec.get("swaps", [])]})
            elif name == "ArcText":
                idx = spec["words"]
                f = s2o(W[idx[0]]["start"]) - 0.02
                add(treatment=name, **{"from": round(f, 3), "to": round(min(s_end, s2o(W[idx[-1]]["end"]) + 0.7), 3)},
                    words=idx, key=spec["key"], layer="front", anchor="head_center", tokens=tokens(idx, spec["key"]),
                    props={"span": 150 if len(idx) < 6 else 190, "onLight": spec.get("onLight", False)})
            elif name == "SurfaceWord":
                idx = spec["words"]
                add(treatment=name, **{"from": round(s2o(W[idx[0]]["start"]) - 0.02, 3),
                                       "to": round(min(s_end, s2o(W[idx[-1]]["end"]) + 0.3), 3)},
                    words=idx, layer="front", anchor="chest_box", tokens=tokens(idx), props={})
            elif name == "Stickers":
                idx = spec["words"]
                add(treatment=name, **{"from": round(s2o(W[idx[0]]["start"]) - 0.02, 3), "to": round(s_end, 3)},
                    words=idx, layer="front", anchor="face_box", tokens=tokens(idx), props={})
            elif name == "BrollCard":
                t = s2o(W[spec["at"]]["start"]) - 0.05
                add(treatment=name, **{"from": round(t, 3), "to": round(s_end, 3)}, layer="scene",
                    props={"stat": spec["stat"], "statWord": spec["statWord"], "postF": 0})
            elif name == "RedCard":
                idx = spec["words"]
                add(treatment=name, **{"from": round(s0, 3), "to": round(s_end, 3)}, words=idx, layer="scene",
                    tokens=tokens(idx), props={"pre": [idx.index(i) for i in spec["pre"]],
                                                "title": W[spec["title"]]["w"], "titleAt": round(s2o(W[spec["title"]]["start"]), 3),
                                                "script": spec["script"], "postF": 0})
            elif name == "SilhouetteCut":
                add(treatment=name, **{"from": round(s0, 3), "to": round(s_end, 3)}, layer="scene", props={"postF": 0})
    # SANS lines for every word no text treatment carries (hero words show behind the head),
    # so the face is never "clean" for more than ~1.5 s (STYLE §6)
    carried = set()
    for it in items:
        if it["treatment"] in ("Stack", "PairWide", "ArcText", "SurfaceWord", "Stickers", "RedCard"):
            carried.update(it.get("words", []))
        if it["treatment"] == "HeroBehind":
            carried.update(it.get("words", [it["key"]]))
    scenes = [(it["from"], it["to"]) for it in items if (it.get("layer") == "scene" and it["treatment"] != "SilhouetteCut")
              or it["treatment"] in ("Stack", "PairWide", "SurfaceWord")]  # chest already taken
    for s in sents:
        ws = [w for w in sentence_words(tr, s["id"]) if w["i"] not in carried]
        for p in phrases(ws, max_words=4):
            f = s2o(p[0]["start"]) - 0.02
            if any(a - 0.05 <= f <= b or a <= f + 0.8 <= b for a, b in scenes):
                continue
            nxt = [q for q in tr["words"] if q["i"] > p[-1]["i"]]
            t_next = s2o(nxt[0]["start"]) - 0.03 if nxt else dur
            t = min(t_next + 0.5, s2o(p[-1]["end"]) + 0.6)
            idx = [w["i"] for w in p]
            n += 1
            items.append({"id": f"i{n}", "treatment": "SansLine", "from": round(f, 3), "to": round(t, 3), "words": idx,
                          "layer": "front", "anchor": "chest_box", "tokens": tokens(idx), "props": {}})
    sl = sorted([it for it in items if it["treatment"] == "SansLine"], key=lambda x: x["from"])
    for a, b in zip(sl, sl[1:]):
        a["to"] = round(min(a["to"], b["from"] - 0.03), 3)
    edl["items"] = items
    edl["transitions"] = trans
