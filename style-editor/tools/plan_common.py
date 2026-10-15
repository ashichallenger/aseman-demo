"""Shared helpers for the per-style planners (plan_<style>.py)."""
import re

STOP = set("""و که به از در با را این اون آن یه یک هم تا برای رو ما من تو شما اونا اینا هست است بود
شد میشه می شه کنه کرد کردن داره دارن داشت ولی اما یا چون اگه اگر پس دیگه خب خیلی همه هر کل
بعد قبل روی زیر توی تو سر بر بی چی چه کی کجا""".split())

PERSIAN_RE = re.compile(r"[؀-ۿ]")


def is_content(w):
    s = re.sub(r"[^\w]", "", w)
    return len(s) >= 3 and s not in STOP


def sentence_words(tr, sid):
    return [w for w in tr["words"] if w["sent"] == sid]


def pick_key(words, prefer=None):
    """Key/hero word = highest stress among content words (prefer nouns/numbers/brand)."""
    best, bs = None, -1
    for w in words:
        s = w["stress"]
        if not is_content(w["w"]):
            s -= 0.5
        if re.search(r"[0-9۰-۹]", w["w"]):
            s += 0.25
        if prefer and any(p in w["w"] for p in prefer):
            s += 0.6
        if s > bs:
            best, bs = w, s
    return best


def phrases(words, max_words=4, pause=0.16, max_dur=2.2):
    """Split a sentence's words into short caption phrases (on pauses / every few words)."""
    out, cur = [], []
    for w in words:
        if cur:
            gap = w["start"] - cur[-1]["end"]
            if gap > pause or len(cur) >= max_words or (w["end"] - cur[0]["start"]) > max_dur:
                out.append(cur)
                cur = []
        cur.append(w)
    if cur:
        out.append(cur)
    # never leave a one-word phrase: merge it into the closer neighbour
    k = 0
    while k < len(out):
        if len(out[k]) == 1 and len(out) > 1:
            if k + 1 < len(out) and (k == 0 or out[k + 1][0]["start"] - out[k][-1]["end"] < out[k][0]["start"] - out[k - 1][-1]["end"]):
                out[k + 1] = out[k] + out[k + 1]
            else:
                out[k - 1] = out[k - 1] + out[k]
            out.pop(k)
            continue
        k += 1
    return out
