"""plan_majalle — STYLE.md §6 for style majalle (editorial pages), applied to this job.

One page per sentence or clause (target 1.7–2.5 s, quotes up to 3.5 s); the hero image of every page is
the presenter cut-out (user rule: no generated images tonight). Transition in = relation to previous page:
same topic → Defocus, new idea → WhiteBloom, consequence/escalation → ZoomThrough.
PAGES: (first_word, last_word, page_type, lines (word idx lists), accent, extra, transition_in)
"""
FRAMINGS = [("page", 1.00, 1.00)]

R = lambda a, b: list(range(a, b + 1))
D, B, Z = "Defocus", "WhiteBloom", "ZoomThrough"

PAGES = [
    (0, 5, "dark", [R(0, 2), R(3, 5)], 1, {}, None),
    (6, 8, "grotesk", [R(6, 7), [8]], 6, {}, D),
    (9, 15, "object", [R(9, 12), R(13, 15)], 11, {"chips": [11, 12]}, B),
    (16, 20, "grotesk", [R(16, 18), R(19, 20)], 19, {}, Z),
    (21, 26, "frame", [R(21, 23), R(24, 26)], 24, {}, D),
    (27, 34, "grotesk", [R(27, 31), R(32, 34)], 32, {}, D),
    (35, 38, "dark", [R(35, 36), R(37, 38)], 35, {}, Z),
    (39, 44, "object", [R(39, 42), R(43, 44)], 42, {"chips": [42, 44]}, B),
    (45, 51, "split", [R(45, 49), R(50, 51)], 50, {}, D),
    (52, 56, "grotesk", [R(52, 53), R(54, 56)], 52, {}, Z),
    (57, 60, "dark", [R(57, 58), R(59, 60)], 58, {}, D),
    (61, 67, "split", [R(61, 64), R(65, 67)], 67, {}, B),
    (68, 75, "object", [R(68, 71), R(72, 75)], 74, {"chips": [70, 72]}, D),
    (76, 84, "dark", [R(76, 78), R(79, 84)], 78, {}, Z),
    (85, 95, "quote", [R(85, 95)], 92, {"hl": [92, 94]}, B),
    (96, 101, "grotesk", [R(96, 98), R(99, 101)], 100, {}, D),
    (102, 112, "object", [R(102, 105), R(106, 112)], 104, {"chips": [104, 108]}, D),
    (113, 117, "frame", [R(113, 115), R(116, 117)], 116, {}, B),
    (118, 123, "split", [R(118, 120), R(121, 123)], 122, {}, D),
    (124, 133, "object", [R(124, 127), R(128, 133)], 132, {"chips": [126, 129, 132]}, Z),
    (134, 143, "grotesk", [R(134, 136), R(137, 140), R(141, 143)], 138, {}, D),
    (144, 152, "dark", [R(144, 147), R(148, 152)], 148, {}, B),
    (153, 158, "frame", [R(153, 154), R(155, 158)], 155, {}, D),
    (159, 162, "grotesk", [R(159, 160), R(161, 162)], 159, {}, Z),
    (163, 171, "split", [R(163, 166), R(167, 171)], 166, {}, D),
    (172, 176, "grotesk", [R(172, 174), R(175, 176)], 173, {}, Z),
    (177, 180, "dark", [R(177, 178), R(179, 180)], 178, {}, D),
    (181, 189, "quote", [R(181, 189)], 188, {"hl": [185, 186], "hand": 188}, B),
    (190, 196, "grotesk", [R(190, 193), R(194, 196)], 195, {}, Z),
    (197, 208, "object", [R(197, 202), R(203, 208)], 203, {"chips": [203, 208]}, B),
    (209, 221, "split", [R(209, 214), R(215, 221)], 220, {}, D),
    (222, 227, "dark", [R(222, 224), R(225, 227)], 225, {}, D),
    (228, 237, "frame", [R(228, 233), R(234, 237)], 236, {}, B),
    (238, 242, "grotesk", [R(238, 240), R(241, 242)], 242, {}, D),
    (243, 253, "quote", [R(243, 253)], 247, {"hl": [244, 245], "hand": 247}, B),
]


def plan(edl, c):
    import os
    tr, tokens, dur, s2o = c["tr"], c["tokens"], c["dur"], c["src2out"]
    W = tr["words"]
    img_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), edl["job"], "majalle_images")
    items, trans = [], []
    starts = [0.0] + [round(s2o(W[p[0]]["start"]) - 0.12, 3) for p in PAGES[1:]]
    for k, (a, b, kind, lines, accent, extra, tin) in enumerate(PAGES):
        idx = list(range(a, b + 1))
        f = starts[k]
        t = starts[k + 1] if k + 1 < len(PAGES) else dur
        rel = lambda i: idx.index(i)
        props = {"page": kind, "lines": [[rel(i) for i in ln] for ln in lines], "accent": rel(accent), "postF": 0}
        if "chips" in extra:
            props["chips"] = [rel(i) for i in extra["chips"]]
        if "hl" in extra:
            props["hl"] = [rel(extra["hl"][0]), rel(extra["hl"][1])]
        if "hand" in extra:
            props["hand"] = rel(extra["hand"])
        # optional user-supplied hero image for this sentence (see outputs/majalle_image_prompts.md)
        sid = W[a]["sent"]
        img = os.path.join(img_dir, f"S{sid:02d}.png")
        if os.path.exists(img):
            props["image"] = f"{edl['job']}/majalle_images/S{sid:02d}.png"
        items.append({"id": f"p{k + 1}", "treatment": "Page", "from": round(f, 3), "to": round(t, 3), "words": idx,
                      "key": accent, "layer": "scene", "tokens": tokens(idx, accent), "props": props})
        if tin:
            trans.append({"at": round(f, 3), "type": tin})
    edl["items"] = items
    edl["transitions"] = trans
