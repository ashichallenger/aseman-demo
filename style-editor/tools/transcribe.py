#!/usr/bin/env python3
"""
transcribe.py — word-level Persian/any-language transcript with stress scores.

Writes <job>/transcript.json following the contract in CLAUDE.md:
  {"language":"fa","words":[{"i","w","start","end","stress","sent"}],
   "sentences":[{"id","text","start","end","kind"}]}

Engine: whisper.cpp (pywhispercpp) with DTW token timestamps (alignment heads of the model).
Default model: models/whisper/ggml-large-v3-q8_0.bin (turbo is not reachable from this machine,
see DECISIONS.md D1). Word starts are refined against the RMS envelope (onset snapping).

Usage:
    python tools/transcribe.py jobs/<job>/input.mp4 [--lang fa] [--model PATH] [--out jobs/<job>/transcript.json]
"""
import argparse
import json
import os
import re
import subprocess
import sys

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_MODEL = os.path.join(ROOT, "models", "whisper", "ggml-large-v3-q8_0.bin")

QUESTION_WORDS = ["چرا", "چی", "چه", "آیا", "چطور", "چطوری", "کجا", "کی", "چند", "کدوم", "کدام", "مگه", "؟", "?"]
LIST_WORDS = ["اول", "دوم", "سوم", "چهارم", "اولا", "دوما", "یکی", "بعدی", "همچنین"]
PLACE_WORDS = ["آمریکا", "امریکا", "ایران", "اروپا", "ژاپن", "چین", "انگلیس", "کانادا", "آلمان", "فرانسه",
               "روسیه", "ترکیه", "دبی", "تهران", "لندن", "نیویورک", "کالیفرنیا", "فلوریدا", "میامی"]
NUM_RE = re.compile(r"[0-9۰-۹]|میلیون|میلیارد|هزار|درصد|دلار|تومن|تومان")
FA_DIGITS = str.maketrans("0123456789", "۰۱۲۳۴۵۶۷۸۹")


def extract_wav(src, wav):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-ac", "1", "-ar", "16000",
                    "-c:a", "pcm_s16le", wav], check=True)


def load_wav(wav):
    import soundfile as sf
    y, sr = sf.read(wav, dtype="float32")
    if y.ndim > 1:
        y = y.mean(axis=1)
    return y, sr


def silence_chunks(y, sr, max_len=24.0, min_gap=0.25):
    """Split audio at the quietest points so each chunk is <= max_len s (whisper window is 30 s)."""
    hop = int(sr * 0.01)
    n = len(y) // hop
    db = 20 * np.log10(np.sqrt((y[: n * hop].reshape(n, hop) ** 2).mean(1) + 1e-10) + 1e-9)
    total = len(y) / sr
    cuts = [0.0]
    while total - cuts[-1] > max_len:
        a = cuts[-1] + max_len * 0.55
        b = cuts[-1] + max_len
        ia, ib = int(a * 100), int(b * 100)
        # smooth then take the minimum energy point (a pause between words)
        seg = np.convolve(db[ia:ib], np.ones(int(min_gap * 100)) / int(min_gap * 100), mode="same")
        cuts.append(round((ia + int(np.argmin(seg))) / 100.0, 2))
    cuts.append(total)
    return list(zip(cuts[:-1], cuts[1:]))


def run_whisper(wav, lang, model_path, threads):
    """whisper.cpp word-level segments (max_len=1 + split_on_word) per silence-bounded chunk.
    (DTW token timestamps were tried first and were far too slow on CPU: >25 min for 88 s.)"""
    from pywhispercpp.model import Model
    y, sr = load_wav(wav)
    m = Model(model_path, n_threads=threads, print_progress=False, print_realtime=False,
              redirect_whispercpp_logs_to=None)
    words, seg_bounds = [], []
    for ci, (a, b) in enumerate(silence_chunks(y, sr)):
        audio = y[int(a * sr): int(b * sr)].astype(np.float32)
        segs = m.transcribe(audio, language=lang, token_timestamps=True, max_len=1, split_on_word=True,
                            no_context=True, suppress_nst=True, extract_probability=True)
        texts = []
        for s in segs:
            t = s.text.strip()
            if not t:
                continue
            words.append({"w": t, "start": a + s.t0 / 100.0, "t1": a + s.t1 / 100.0,
                          "p": float(s.probability) if s.probability == s.probability else 0.5, "seg": ci})
            texts.append(t)
        seg_bounds.append((a, b, " ".join(texts)))
        print(f"  chunk {ci}: {a:.2f}-{b:.2f}s, {len(texts)} words", flush=True)
    return words, seg_bounds


def clean_words(words):
    out = []
    for w in words:
        w = dict(w)
        text = w["w"].strip()
        if not text or re.fullmatch(r"[\s\.\,،!؟\?…\-]+", text):
            if out:
                out[-1]["w"] += text
            continue
        w["w"] = text
        out.append(w)
    return out


def rms_envelope(y, sr, hop=0.01):
    h = int(sr * hop)
    n = len(y) // h
    frames = y[: n * h].reshape(n, h)
    rms = np.sqrt((frames ** 2).mean(axis=1) + 1e-10)
    db = 20 * np.log10(rms + 1e-9)
    return db


def refine_timing(words, db, total):
    """Monotonic starts; snap each start to the energy onset within [-0.10, +0.06] s; end = next start
    (minus gap if the energy drops into silence)."""
    hop = 0.01
    floor = np.percentile(db, 15)
    speech_thr = floor + 12
    for k, w in enumerate(words):
        s = w["start"]
        i0 = max(0, int((s - 0.10) / hop))
        i1 = min(len(db) - 1, int((s + 0.06) / hop))
        if i1 > i0 + 2:
            seg = db[i0:i1]
            # onset = first frame where energy rises above threshold after a low point
            lo = int(np.argmin(seg))
            rise = np.where(seg[lo:] > speech_thr)[0]
            if len(rise):
                cand = (i0 + lo + rise[0]) * hop
                if abs(cand - s) <= 0.10:
                    s = cand
        w["start"] = round(max(s, words[k - 1]["start"] + 0.04 if k else 0.0), 3)
    for k, w in enumerate(words):
        nxt = words[k + 1]["start"] if k + 1 < len(words) else min(total, w["t1"] + 0.3)
        end = max(w["start"] + 0.08, min(nxt, max(w["t1"], w["start"] + 0.12)))
        # trim trailing silence
        i0, i1 = int(w["start"] / hop), int(end / hop)
        if i1 > i0 + 3:
            seg = db[i0:i1]
            loud = np.where(seg > speech_thr)[0]
            if len(loud):
                end = min(end, (i0 + loud[-1] + 3) * hop)
        w["end"] = round(max(end, w["start"] + 0.08), 3)
    return words


def split_sentences(words, seg_bounds, max_words=11, pause=0.38):
    sent = 0
    sents = [[]]
    for k, w in enumerate(words):
        if sents[-1]:
            prev = sents[-1][-1]
            gap = w["start"] - prev["end"]
            new_seg = w["seg"] != prev["seg"]
            ends_punct = bool(re.search(r"[\.!؟\?]$", prev["w"]))
            if gap > pause or ends_punct or (new_seg and gap > 0.15) or len(sents[-1]) >= max_words \
                    or (new_seg and len(sents[-1]) >= 4):
                sents.append([])
        sents[-1].append(w)
    sents = [s for s in sents if s]
    # merge very short tails (1 word) into previous sentence when close
    merged = []
    for s in sents:
        if merged and len(s) == 1 and s[0]["start"] - merged[-1][-1]["end"] < 0.25:
            merged[-1].extend(s)
        else:
            merged.append(s)
    return merged


def classify(sent_words, idx, n):
    text = " ".join(w["w"] for w in sent_words)
    toks = set(re.findall(r"\w+", text))
    if idx == 0:
        return "hook"
    if any(q in toks for q in QUESTION_WORDS) or "؟" in text:
        return "question"
    if NUM_RE.search(text):
        return "number"
    if any(p in text for p in PLACE_WORDS):
        return "place"
    if any(l in toks for l in LIST_WORDS):
        return "list"
    if idx == n - 1:
        return "thesis"
    return "claim" if len(sent_words) >= 5 else "plain"


def stress_scores(words, sents, y, sr):
    import librosa
    f0, vflag, _ = librosa.pyin(y, fmin=70, fmax=400, sr=sr, frame_length=1024, hop_length=160)
    times = np.arange(len(f0)) * 160 / sr
    hop = 0.01
    db = rms_envelope(y, sr, hop)
    feats = []
    for w in words:
        i0 = min(int(w["start"] / hop), len(db) - 2)
        i1 = min(max(int(w["end"] / hop), i0 + 1), len(db))
        loud = float(np.percentile(db[i0:i1], 90)) if i1 > i0 else -60.0
        m = (times >= w["start"]) & (times < w["end"]) & ~np.isnan(f0)
        pitch = float(np.median(np.log2(f0[m]))) if m.sum() >= 2 else np.nan
        dur = w["end"] - w["start"]
        nchar = max(1, len(w["w"]))
        feats.append([loud, pitch, dur / nchar])
    feats = np.array(feats, dtype=float)
    for s_id, s in enumerate(sents):
        idx = [w["i"] for w in s]
        F = feats[idx]
        Z = np.zeros_like(F)
        for c in range(3):
            col = F[:, c]
            ok = ~np.isnan(col)
            if ok.sum() >= 2 and np.nanstd(col) > 1e-6:
                Z[ok, c] = (col[ok] - np.nanmean(col)) / np.nanstd(col)
        score = 0.45 * Z[:, 0] + 0.30 * Z[:, 1] + 0.25 * Z[:, 2]
        # short function words are rarely the key
        for k, w in enumerate(s):
            if len(w["w"]) <= 2:
                score[k] -= 0.6
        if len(score) > 1 and score.max() > score.min():
            sc = (score - score.min()) / (score.max() - score.min())
        else:
            sc = np.full(len(score), 0.5)
        for k, w in enumerate(s):
            w["stress"] = round(float(sc[k]), 3)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--lang", default="fa")
    ap.add_argument("--model", default=DEFAULT_MODEL)
    ap.add_argument("--out", default=None)
    ap.add_argument("--threads", type=int, default=4)
    ap.add_argument("--fresh", action="store_true", help="ignore cached whisper_words.json")
    a = ap.parse_args()
    job = os.path.dirname(os.path.abspath(a.video))
    out = a.out or os.path.join(job, "transcript.json")
    wav = os.path.join(job, "audio_16k.wav")
    extract_wav(a.video, wav)
    y, sr = load_wav(wav)
    total = len(y) / sr
    print(f"[1/4] audio {total:.2f}s")
    cache = os.path.join(job, "whisper_words.json")
    if os.path.exists(cache) and not a.fresh:
        with open(cache, encoding="utf-8") as f:
            c = json.load(f)
        words, seg_bounds = c["words"], [tuple(x) for x in c["chunks"]]
    else:
        words, seg_bounds = run_whisper(wav, a.lang, a.model, a.threads)
        with open(cache, "w", encoding="utf-8") as f:
            json.dump({"words": words, "chunks": seg_bounds}, f, ensure_ascii=False, indent=1)
    with open(os.path.join(job, "whisper_raw.json"), "w", encoding="utf-8") as f:
        json.dump({"segments": [{"t0": s[0], "t1": s[1], "text": s[2]} for s in seg_bounds]}, f,
                  ensure_ascii=False, indent=1)
    print(f"[2/4] whisper: {len(seg_bounds)} chunks, {len(words)} words")
    words = clean_words(words)
    db = rms_envelope(y, sr)
    words = refine_timing(words, db, total)
    for i, w in enumerate(words):
        w["i"] = i
    sents = split_sentences(words, seg_bounds)
    stress_scores(words, sents, y, sr)
    print(f"[3/4] {len(words)} words, {len(sents)} sentences")
    W, S = [], []
    for s_id, s in enumerate(sents):
        for w in s:
            W.append({"i": w["i"], "w": w["w"], "start": w["start"], "end": w["end"],
                      "stress": w.get("stress", 0.5), "sent": s_id, "p": round(w["p"], 3)})
        S.append({"id": s_id, "text": " ".join(w["w"] for w in s), "start": s[0]["start"],
                  "end": s[-1]["end"], "kind": classify(s, s_id, len(sents))})
    with open(out, "w", encoding="utf-8") as f:
        json.dump({"language": a.lang, "words": W, "sentences": S}, f, ensure_ascii=False, indent=1)
    # human-readable view
    with open(os.path.join(job, "transcript.txt"), "w", encoding="utf-8") as f:
        for s in S:
            f.write(f"{s['id']:>3} [{s['start']:6.2f}-{s['end']:6.2f}] ({s['kind']}) {s['text']}\n")
    print(f"[4/4] -> {out}")


if __name__ == "__main__":
    main()
