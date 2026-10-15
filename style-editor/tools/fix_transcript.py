#!/usr/bin/env python3
"""fix_transcript.py — apply the (self-reviewed) checkpoint-A corrections to transcript.json.

Replaces checkpoint A for the unattended run: word fixes, word merges and sentence boundaries are
listed here explicitly (original word indices from transcript_raw.json), timings are kept.
Usage: python tools/fix_transcript.py jobs/<job>
"""
import json
import os
import shutil
import sys

# (first_idx, last_idx) -> new text   (a range merges several ASR words into one display word)
FIX = {
    (6, 7): "جی‌تی‌ای", (36, 37): "جی‌تی‌ای", (50, 51): "جی‌تی‌ای",
    (12, 12): "عجیب‌ترین", (20, 20): "میلیون", (25, 25): "آمریکا", (26, 26): "ثبت",
    (55, 55): "میلیون‌ها", (60, 60): None,  # "بازید": ASR hesitation, absent in the beam-search pass -> dropped
    (61, 61): "وارد", (64, 64): "می‌شن", (65, 66): "یه‌سریا",
    (72, 72): "دزدیده", (75, 76): "سکانس‌هایی", (81, 81): "می‌کنه",
    (84, 86): "اف‌بی‌آی", (89, 89): "می‌خواد",
    (93, 93): "همه‌ی", (97, 97): "می‌تونه", (98, 98): "جزئی", (102, 102): "شرکت", (103, 103): "باشه؟",
    (105, 105): "می‌خوام", (107, 107): "بگم", (109, 110): "اینها", (113, 113): "تئوری", (117, 117): "فرضیه",
    (121, 121): "می‌کنیم", (123, 123): "کلاً", (124, 124): "ذاتاً", (126, 127): "علاقه‌منده",
    (135, 135): "می‌خواد", (138, 138): "می‌خواد", (141, 141): "می‌خواد",
    (144, 144): "واکنش", (145, 145): "نشون بده",
    (172, 172): "می‌بینن،", (183, 183): "35", (184, 184): "میلیون", (186, 186): "ببینن",
    (190, 190): "میشه", (192, 192): "می‌تونه", (193, 193): "کاملاً", (205, 205): "وایرال", (206, 206): "بشه",
    (211, 211): "نمی‌خواد", (213, 213): "پارانویایی", (225, 225): "خودش", (228, 228): "خودش",
    (237, 237): "می‌کنه", (249, 250): "آدم‌های", (253, 253): "بی‌خبرند", (255, 255): "همه‌ی", (258, 258): "بازیه",
    (261, 261): "تو رو",
}

# sentence starts (original indices) + kind
SENTS = [
    (0, "hook"), (10, "number"), (22, "place"), (28, "number"), (41, "claim"), (55, "number"),
    (65, "claim"), (73, "claim"), (82, "claim"), (93, "question"), (104, "claim"), (111, "claim"),
    (122, "thesis"), (134, "list"), (144, "claim"), (154, "claim"), (169, "number"), (173, "number"),
    (187, "plain"), (191, "thesis"), (200, "claim"), (207, "claim"), (219, "claim"), (232, "claim"),
    (238, "thesis"), (248, "claim"), (254, "thesis"),
]

SUSPICIOUS = {
    (61, 61): "«بارده» شنیده شد؛ «وارد» (سرور بازی) گذاشته شد",
    (65, 66): "«یه ها» شنیده شد؛ «یه‌سریا» گذاشته شد",
    (102, 102): "«شکل» در هر دو بار رمزگشایی؛ از روی معنا «شرکت» گذاشته شد",
    (60, 60): "«بازید» حذف شد (در رمزگشایی beam نبود)",
    (144, 145): "«واکنشتشون بده» → «واکنش نشون بده»",
    (213, 213): "«پارانویلی» → «پارانویایی»",
    (261, 261): "«طور» → «تو رو» (طبق رمزگشایی دوم)",
    (117, 117): "«فرضی» → «فرضیه»",
    (228, 228): "«خوش» → «خودش»",
}


def main():
    job = sys.argv[1]
    p = os.path.join(job, "transcript.json")
    raw = os.path.join(job, "transcript_raw.json")
    if not os.path.exists(raw):
        shutil.copy(p, raw)
    with open(raw, encoding="utf-8") as f:
        tr = json.load(f)
    words = tr["words"]
    starts = {a: (a, b) for (a, b) in FIX}
    out, i = [], 0
    while i < len(words):
        if i in starts:
            a, b = starts[i]
            txt = FIX[(a, b)]
            grp = words[a:b + 1]
            if txt is not None:
                out.append({"orig": [a, b], "w": txt, "start": grp[0]["start"], "end": grp[-1]["end"],
                            "stress": max(w["stress"] for w in grp)})
            i = b + 1
        else:
            w = words[i]
            out.append({"orig": [i, i], "w": w["w"], "start": w["start"], "end": w["end"], "stress": w["stress"]})
            i += 1
    bounds = [s for s, _ in SENTS]
    kinds = dict(SENTS)
    sid = -1
    W, S = [], []
    for k, w in enumerate(out):
        if w["orig"][0] in bounds or (sid < 0):
            sid += 1
            S.append({"id": sid, "kind": kinds.get(w["orig"][0], "plain"), "words": []})
        w2 = {"i": k, "w": w["w"], "start": w["start"], "end": w["end"], "stress": w["stress"], "sent": sid}
        W.append(w2)
        S[-1]["words"].append(w2)
    # re-normalise stress inside each sentence to 0..1
    for s in S:
        vals = [w["stress"] for w in s["words"]]
        lo, hi = min(vals), max(vals)
        for w in s["words"]:
            w["stress"] = round((w["stress"] - lo) / (hi - lo), 3) if hi > lo else 0.5
    sents = [{"id": s["id"], "text": " ".join(w["w"] for w in s["words"]), "start": s["words"][0]["start"],
              "end": s["words"][-1]["end"], "kind": s["kind"]} for s in S]
    with open(p, "w", encoding="utf-8") as f:
        json.dump({"language": "fa", "words": W, "sentences": sents}, f, ensure_ascii=False, indent=1)
    with open(os.path.join(job, "transcript.txt"), "w", encoding="utf-8") as f:
        for s in sents:
            f.write(f"{s['id']:>3} [{s['start']:6.2f}-{s['end']:6.2f}] ({s['kind']}) {s['text']}\n")
    with open(os.path.join(job, "suspicious_words.json"), "w", encoding="utf-8") as f:
        json.dump([{"orig": list(k), "time": round(words[k[0]]["start"], 2), "asr": " ".join(w["w"] for w in words[k[0]:k[1] + 1]),
                    "note": v} for k, v in SUSPICIOUS.items()], f, ensure_ascii=False, indent=1)
    print(f"{len(W)} words, {len(sents)} sentences")


if __name__ == "__main__":
    main()
