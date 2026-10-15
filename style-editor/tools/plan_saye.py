"""plan_saye — STYLE.md §6 "Speech → treatment rules" for style saye, applied to this job.

Every sentence gets WordCaption phrases (one red KEY per sentence); one big graphic moment roughly
every 4–6 s (never two at once); blur transition on every angle change (100 % ↔ 135 % crops).
The per-sentence choices below are the director's decisions (checkpoint B replaced by self-review,
reasons in DECISIONS.md).
"""
from plan_common import phrases, pick_key, sentence_words

FRAMINGS = [("medium", 1.00, 1.04), ("close", 1.35, 1.40)]

# sentence id -> key word index (transcript.json indices, chosen by stress + meaning)
KEYS = {0: 6, 1: 11, 2: 21, 3: 32, 4: 50, 5: 52, 6: 67, 7: 74, 8: 78, 9: 92, 10: 100, 11: 104, 12: 122,
        13: 132, 14: 138, 15: 156, 16: 159, 17: 173, 18: 178, 19: 185, 20: 195, 21: 203, 22: 220, 23: 225,
        24: 236, 25: 242, 26: 247}

# big moments: sentence id -> list of (treatment, props)
BIG = {
    0: [("RedCircle", {}), ("ArcCaption", {"phrase": 0})],
    1: [("RedEcho", {})],
    3: [("Hero3DBehind", {"text": "GTA VI", "label": "۲۶ آبان"})],
    5: [("RedEcho", {})],
    6: [("SilhouetteScene", {"until_sent": 7})],
    8: [("Hero3DBehind", {"text": "FBI", "label": "اف‌بی‌آی"})],
    9: [("QuestionCloud", {})],
    12: [("RedEcho", {}), ("Cursor", {})],
    13: [("PaperNotes", {"notes": [126, 129, 132]})],
    15: [("Stepper", {"steps": [148, 155, 157], "labels": ["ویدیو", "تاریخ مشخص", "پخش"]})],
    16: [("Hero3DBehind", {"text": "30M", "label": "سی میلیون نفر"})],
    17: [("RedEcho", {})],
    19: [("Cursor", {})],
    20: [("Hero3DBehind", {"text": "VIRAL", "label": "وایرال"})],
    22: [("Stepper", {"steps": [214, 217, 220], "labels": ["ویدیو", "بازی", "لیک"], "title_sent": True})],
    24: [("SilhouetteScene", {"until_sent": 25})],
    26: [("RedCircle", {})],
}
NO_CAPTION = {9, 13, 15, 22}  # the graphic carries the words (bubbles / notes / stepper)


def plan(edl, c):
    tr, tokens, dur = c["tr"], c["tokens"], c["dur"]
    s2o = c["src2out"]
    items, n = [], 0
    sents = tr["sentences"]
    scene_ranges = []

    def add(**kw):
        nonlocal n
        n += 1
        kw.setdefault("id", f"i{n}")
        items.append(kw)

    for s in sents:
        sid = s["id"]
        ws = sentence_words(tr, sid)
        key = KEYS.get(sid) or pick_key(ws)["i"]
        t0 = s2o(ws[0]["start"])
        nxt = sents[sid + 1] if sid + 1 < len(sents) else None
        t_end = s2o(nxt["start"]) - 0.03 if nxt else dur
        t1 = min(t_end, s2o(ws[-1]["end"]) + 0.6)
        big = BIG.get(sid, [])
        ph = phrases(ws, max_words=4)
        arc_phrase = None
        for name, props in big:
            if name == "ArcCaption":
                arc_phrase = props.get("phrase", 0)
        # --- captions (5.1/5.2)
        if sid not in NO_CAPTION:
            for k, p in enumerate(ph):
                idxs = [w["i"] for w in p]
                pf = s2o(p[0]["start"]) - 0.02
                pn = s2o(ph[k + 1][0]["start"]) - 0.05 if k + 1 < len(ph) else t1
                pt = min(pn, s2o(p[-1]["end"]) + 0.5) if k + 1 < len(ph) else t1
                kk = key if key in idxs else None
                if arc_phrase is not None and k == arc_phrase:
                    add(treatment="ArcCaption", **{"from": round(pf, 3), "to": round(pt, 3)}, words=idxs, key=kk,
                        layer="front", anchor="head_center", tokens=tokens(idxs, kk), props={})
                    continue
                add(treatment="WordCaption", **{"from": round(pf, 3), "to": round(pt, 3)}, words=idxs, key=kk,
                    layer="front", anchor="chest_box", tokens=tokens(idxs, kk),
                    props={"cursor": any(b[0] == "Cursor" for b in big) and kk is not None})
        # --- big moments
        for name, props in big:
            if name in ("ArcCaption", "Cursor"):
                continue
            if name == "RedCircle":
                add(treatment="RedCircle", **{"from": round(t0 - 0.05, 3), "to": round(t1, 3)}, layer="behind",
                    anchor="head_center", props={})
            elif name == "RedEcho":
                add(treatment="RedEcho", **{"from": round(t0, 3), "to": round(t1, 3)}, layer="behind",
                    anchor="subject_box", props={})
            elif name == "Hero3DBehind":
                kt = s2o(tr["words"][key]["start"])
                add(treatment="Hero3DBehind", **{"from": round(max(t0, kt - 0.15), 3), "to": round(t1, 3)},
                    layer="behind", anchor="head_center", props=dict(props))
                add(treatment="HeroLabel", **{"from": round(max(t0, kt - 0.15), 3), "to": round(t1, 3)},
                    layer="front", anchor="head_center", props=dict(props))
            elif name == "SilhouetteScene":
                last = sents[props["until_sent"]]
                lws = sentence_words(tr, last["id"])
                nn = sents[last["id"] + 1] if last["id"] + 1 < len(sents) else None
                te = s2o(nn["start"]) - 0.03 if nn else dur
                scene_ranges.append((t0 - 0.05, te))
                add(treatment="SilhouetteScene", **{"from": round(t0 - 0.05, 3), "to": round(te, 3)}, layer="scene",
                    props={"postF": 0})
            elif name == "QuestionCloud":
                groups, base = [], ws[0]["i"]
                for p in phrases(ws, max_words=4):
                    groups.append([w["i"] - base for w in p])
                idxs = [w["i"] for w in ws]
                add(treatment="QuestionCloud", **{"from": round(t0 - 0.05, 3), "to": round(t1, 3)}, words=idxs, key=key,
                    layer="front", tokens=tokens(idxs, key), props={"bubbles": groups})
            elif name == "PaperNotes":
                notes = props["notes"]
                add(treatment="PaperNotes", **{"from": round(t0, 3), "to": round(t1, 3)}, layer="front",
                    props={"notes": [tr["words"][i]["w"].rstrip("،") for i in notes],
                           "noteTimes": [round(s2o(tr["words"][i]["start"]) - 0.1, 3) for i in notes]})
            elif name == "Stepper":
                steps = props["steps"]
                title = " ".join(w["w"] for w in ph[0]) if ph else ""
                add(treatment="Stepper", **{"from": round(t0, 3), "to": round(t1, 3)}, layer="front",
                    props={"title": title, "steps": props["labels"],
                           "stepTimes": [round(s2o(tr["words"][i]["start"]), 3) for i in steps]})
    # captions inside a silhouette scene sit on the black body: keep them, they are white/red
    edl["items"] = items
    # --- transitions: blur on every angle change, except cuts into/out of silhouette scenes (hard cuts)
    trans = []
    for prev, m, seg in zip(edl["segments"], edl["map"][1:], edl["segments"][1:]):
        if seg["framing"] == prev["framing"]:
            continue  # same framing = plain jump cut (hard)
        at = m["out_in"]
        near_scene = any(abs(at - a) < 0.2 or abs(at - b) < 0.2 for a, b in scene_ranges)
        if not near_scene:
            trans.append({"at": round(at, 3), "type": "BlurTransition"})
    edl["transitions"] = trans
