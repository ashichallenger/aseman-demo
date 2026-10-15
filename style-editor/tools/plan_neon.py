"""plan_neon — STYLE.md §6 for style neon (EXPERIMENTAL; hypothesis style, no full-screen reference).

Speech → treatment: emotional hook → NeonWord; benefit/explanation → GlassCard; number → GlowNumber;
steps/list → StepDots; brand/value line → VerticalPill; product (the toys on the desk) → ProductCard;
the presenter's reaction → CircleFrame. Very dense (new element every 0.5–1 s) but ≤ 3 graphics at once.
A NeonCaption keeps every sentence readable (the reference tiles always carry text).
"""
from plan_common import is_content, phrases, sentence_words

FRAMINGS = [("wide", 1.00, 1.03), ("medium", 1.28, 1.31), ("close", 1.55, 1.58)]

R = lambda a, b: list(range(a, b + 1))

# sentence -> list of (treatment, spec)
PLAN = {
    0: [("NeonWord", {"words": R(0, 2), "key": 1}), ("ProductCard", {"at_word": 6, "title": "GTA VI", "sub": "به‌زودی", "pos": [0.78, 0.66], "tilt": 6})],
    1: [("GlowNumber", {"at_word": 16, "value": 1500000, "suffix": "M", "label": "میلیون نفر"})],
    2: [("GlassCard", {"words": R(21, 26), "key": 21})],
    3: [("StepDots", {"words": R(27, 38), "steps": [31, 32, 33, 35], "labels": ["روز", "۲۶", "آبان", "جی‌تی‌ای ۶"]})],
    4: [("VerticalPill", {"words": R(48, 51)}), ("PropFly", {})],
    5: [("GlowNumber", {"at_word": 52, "value": 0, "text": "M+", "label": "میلیون‌ها نفر"})],
    6: [("NeonWord", {"words": R(61, 67), "key": 67})],
    7: [("GlassCard", {"words": R(68, 75), "key": 70})],
    8: [("CircleFrame", {"words": R(76, 84), "key": 78})],
    9: [("GlassCard", {"words": R(85, 95), "key": 92, "lines": [R(85, 89), R(90, 95)]}), ("PropFly", {})],
    10: [("NeonWord", {"words": R(96, 101), "key": 100})],
    11: [("StepDots", {"words": R(102, 112), "steps": [104, 108], "labels": ["تئوری", "فرضیه"], "n": 2})],
    12: [("CircleFrame", {"words": R(113, 123), "key": 116})],
    13: [("ProductCard", {"at_word": 126, "title": "فیلم", "pos": [0.25, 0.66], "tilt": -7}),
         ("ProductCard", {"at_word": 129, "title": "موسیقی", "pos": [0.55, 0.62], "tilt": 5}),
         ("ProductCard", {"at_word": 132, "title": "بازی", "pos": [0.82, 0.7], "tilt": -4})],
    14: [("NeonWord", {"words": R(137, 139), "key": 138})],
    15: [("StepDots", {"words": R(144, 158), "steps": [148, 155, 157], "labels": ["ویدیو", "تاریخ مشخص", "پخش"], "n": 3})],
    16: [("GlowNumber", {"at_word": 159, "value": 30, "suffix": "M", "label": "نفر می‌بینن"})],
    17: [("GlassCard", {"words": R(163, 171), "key": 166}), ("GlowNumber", {"at_word": 173, "value": 35, "suffix": "M", "label": "میلیون نفر"})],
    18: [("NeonWord", {"words": R(177, 180), "key": 178})],
    19: [("VerticalPill", {"words": R(185, 186)}), ("GlassCard", {"words": R(181, 189), "key": 185})],
    20: [("NeonWord", {"words": R(192, 196), "key": 195}), ("PropFly", {})],
    21: [("GlassCard", {"words": R(197, 208), "key": 203})],
    22: [("CircleFrame", {"words": R(209, 221), "key": 220})],
    23: [("VerticalPill", {"words": R(224, 225)})],
    24: [("GlassCard", {"words": R(228, 237), "key": 236})],
    25: [("NeonWord", {"words": R(239, 242), "key": 242})],
    26: [("NeonWord", {"words": R(246, 247), "key": 247}), ("GlassCard", {"words": R(248, 253), "key": 251, "y": 0.7}), ("PropFly", {})],
}


def plan(edl, c):
    tr, tokens, dur, s2o = c["tr"], c["tokens"], c["dur"], c["src2out"]
    W = tr["words"]
    sents = tr["sentences"]
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
        s0 = s2o(ws[0]["start"]) - 0.03
        covered = set()
        for name, spec in PLAN.get(sid, []):
            if "words" in spec:
                covered.update(spec["words"])
            if name in ("NeonWord", "GlassCard", "CircleFrame", "VerticalPill"):
                layer = "scene" if name == "CircleFrame" else "front"
                idx = spec["words"]
                key = spec.get("key")
                f = s2o(W[idx[0]]["start"]) - 0.05
                props = {}
                if name == "GlassCard":
                    props["lines"] = [[idx.index(i) for i in ln] for ln in spec.get("lines", [idx])]
                    if "y" in spec:
                        props["y"] = spec["y"]
                add(treatment=name, **{"from": round(f, 3), "to": round(s_end, 3)}, words=idx, key=key,
                    tokens=tokens(idx, key), layer=layer, props=props)
            elif name == "GlowNumber":
                f = s2o(W[spec["at_word"]]["start"]) - 0.05
                add(treatment=name, **{"from": round(f, 3), "to": round(s_end, 3)}, layer="behind",
                    props={"value": spec["value"], "suffix": spec.get("suffix", ""), "label": spec["label"],
                           **({"text": spec["text"]} if "text" in spec else {})})
            elif name == "ProductCard":
                f = s2o(W[spec["at_word"]]["start"]) - 0.05
                add(treatment=name, **{"from": round(f, 3), "to": round(s_end, 3)}, layer="front",
                    props={"title": spec["title"], "sub": spec.get("sub", ""), "at": spec["pos"], "tilt": spec["tilt"]})
            elif name == "StepDots":
                idx = spec["words"]
                add(treatment=name, **{"from": round(s0, 3), "to": round(s_end, 3)}, layer="front",
                    props={"n": spec.get("n", 4), "labels": spec["labels"],
                           "stepTimes": [round(s2o(W[i]["start"]), 3) for i in spec["steps"]]})
            elif name == "PropFly":
                add(treatment=name, **{"from": round(s0, 3), "to": round(s_end, 3)}, layer="front", props={"n": 5})
        # always-on caption for the words no graphic carries (phrases, neon key)
        rest = [w for w in ws if w["i"] not in covered]
        for p in phrases(rest, max_words=4):
            idx = [w["i"] for w in p]
            cands = [w for w in p if is_content(w["w"])]
            key = max(cands, key=lambda w: w["stress"])["i"] if len(p) > 1 and cands else None
            f = s2o(p[0]["start"]) - 0.03
            t = min(s_end, s2o(p[-1]["end"]) + 0.35)
            add(treatment="NeonCaption", **{"from": round(f, 3), "to": round(t, 3)}, words=idx, key=key,
                tokens=tokens(idx, key), layer="front", props={})
    # punch on every framing change (fast product-ad rhythm)
    for prev, m, seg in zip(edl["segments"], edl["map"][1:], edl["segments"][1:]):
        if seg["framing"] != prev["framing"]:
            trans.append({"at": m["out_in"], "type": "Punch"})
    edl["items"] = items
    edl["transitions"] = trans
