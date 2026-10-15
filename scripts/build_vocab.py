#!/usr/bin/env python3
"""
単語データのビルドスクリプト。

入力:
  data-src/lists/ngsl.csv        NGSL 1.2 (CC BY-SA 4.0, Browne, Culligan & Phillips)
  data-src/lists/business.csv    BSL 1.2 / TSL 1.2 (CC BY-SA 4.0)
  data-src/vocab/*.txt           和訳・例文（lemma|pos|ja|例文EN|例文JA）
  data-src/rail/*.txt            保線用語（en|us|ja|lv|ipa_uk|ipa_us|refs|note|例文EN|例文JA）
  data-src/ipa/en_US.tsv         米音IPA（ipa-dict / cmudict-ipa, MIT）
出力:
  src/data/vocab/general.json, business.json, rail.json
"""
from __future__ import annotations

import csv
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "data-src"
OUT = ROOT / "src" / "data" / "vocab"

VOWELS = set("aeiouæɑɒɔəɛɪʊʌɝɚɐ")
STRESS = set("ˈˌ")


def load_ipa() -> dict[str, str]:
    path = SRC / "ipa" / "en_US.tsv"
    cache = ROOT / "scripts" / ".cache" / "en_US.txt"
    src = cache if cache.exists() else path
    d: dict[str, str] = {}
    with open(src, encoding="utf-8") as f:
        for line in f:
            if "\t" not in line:
                continue
            w, p = line.rstrip("\n").split("\t", 1)
            first = p.split(",")[0].strip().strip("/")
            d.setdefault(w.lower(), first)
    return d


def stressed(ipa: str, idx: int) -> bool:
    """idx の母音が強勢音節にあるか（直前に母音より先に強勢記号があるか）"""
    j = idx - 1
    while j >= 0:
        c = ipa[j]
        if c in STRESS:
            return c == "ˈ"
        if c in VOWELS:
            return False
        j -= 1
    return False


OVERRIDE_US = {
    "the": "ðə", "a": "ə", "an": "ən",
    # 辞書にない保線用語の構成語
    "ballasted": "ˈbæləstɪd", "flangeway": "ˈflændʒweɪ", "spalling": "ˈspɔlɪŋ", "lipping": "ˈlɪpɪŋ",
    "subgrade": "ˈsʌbɡreɪd", "abutment": "əˈbʌtmənt", "maintainability": "meɪnˌteɪnəˈbɪləti",
}


def syllables(ipa: str) -> int:
    n, prev = 0, False
    for c in ipa:
        v = c in VOWELS
        if v and not prev:
            n += 1
        prev = v or (prev and c == "ː")
    return n


def normalize_us(ipa: str) -> str:
    """cmudict-ipa の表記を学習者向けの一般米語表記に整える"""
    s = ipa.replace("ɫ", "l").replace("ɹ", "r")
    out = []
    for i, c in enumerate(s):
        if c == "ə" and stressed(s, i):
            out.append("ʌ")
        elif c == "ɝ" and not stressed(s, i):
            out.append("ɚ")
        elif c == "i" and (i != len(s) - 1 or stressed(s, i)):
            out.append("iː")
        elif c == "u":
            out.append("uː")
        else:
            out.append(c)
    r = "".join(out)
    if syllables(r) <= 1:
        r = r.replace("ˈ", "").replace("ˌ", "")
    return r


def us_ipa(word: str, d: dict[str, str]) -> str | None:
    key = word.lower()
    if key in OVERRIDE_US:
        return OVERRIDE_US[key]
    if key in d:
        return normalize_us(d[key])
    return ipa_for_phrase(word, d)


TOKEN_RE = re.compile(r"[A-Za-z][A-Za-z'\-]*")


def ipa_for_phrase(phrase: str, d: dict[str, str]) -> str | None:
    parts = []
    for tok in TOKEN_RE.findall(phrase):
        key = tok.lower()
        if key in OVERRIDE_US:
            parts.append(OVERRIDE_US[key])
            continue
        if key in d:
            parts.append(normalize_us(d[key]))
            continue
        # ハイフン語は分割して合成
        if "-" in key and all(p in d for p in key.split("-")):
            parts.append("".join(normalize_us(d[p]) for p in key.split("-")))
            continue
        return None
    return " ".join(parts) if parts else None


def slug(s: str) -> str:
    s = s.lower().replace("&", "and")
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s


def inflections(lemma: str) -> list[str]:
    w = lemma.lower()
    forms = {w, w + "s", w + "es", w + "ed", w + "d", w + "ing", w + "er", w + "est", w + "ly"}
    if w.endswith("y"):
        forms |= {w[:-1] + "ies", w[:-1] + "ied", w[:-1] + "ier", w[:-1] + "iest", w[:-1] + "ily"}
    if w.endswith("e"):
        forms |= {w[:-1] + "ing", w[:-1] + "ed"}
    if re.search(r"[^aeiou][aeiou][bdgklmnprt]$", w):
        forms |= {w + w[-1] + "ing", w + w[-1] + "ed", w + w[-1] + "er"}
    if w.endswith("f"):
        forms |= {w[:-1] + "ves"}
    if w.endswith("fe"):
        forms |= {w[:-2] + "ves"}
    return sorted(forms, key=len, reverse=True)


def ensure_marked(en: str, lemma: str) -> tuple[str, bool]:
    if "*" in en:
        return en, True
    for form in inflections(lemma):
        m = re.search(r"\b" + re.escape(form) + r"\b", en, flags=re.IGNORECASE)
        if m:
            return en[: m.start()] + "*" + m.group(0) + "*" + en[m.end():], True
    return en, False


def read_pipe(path: Path, ncols: int) -> list[list[str]]:
    rows = []
    with open(path, encoding="utf-8") as f:
        for no, line in enumerate(f, 1):
            line = line.strip()
            if not line or line.startswith("#") or line == "EOF":
                continue
            cols = [c.strip() for c in line.split("|")]
            if len(cols) != ncols:
                print(f"[WARN] {path.name}:{no} 列数 {len(cols)} != {ncols}: {line[:80]}", file=sys.stderr)
                continue
            rows.append(cols)
    return rows


def build_general_business(ipa: dict[str, str]):
    warnings = 0
    # 一般（NGSL）
    ngsl = {}
    with open(SRC / "lists" / "ngsl.csv", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            ngsl[r["lemma"].lower()] = (int(r["group"]), int(r["rank"]))
    general = []
    seen = set()
    for lvl in (1, 2, 3, 4):
        path = SRC / "vocab" / f"general-{lvl}.txt"
        if not path.exists():
            continue
        for lemma, pos, ja, en, jx in read_pipe(path, 5):
            key = lemma.lower()
            if key in seen:
                print(f"[WARN] 重複: {lemma}", file=sys.stderr)
                continue
            seen.add(key)
            en2, ok = ensure_marked(en, lemma)
            if not ok:
                warnings += 1
                print(f"[WARN] 例文に見出し語がない: {lemma}: {en}", file=sys.stderr)
            group, rank = ngsl.get(key, (lvl, 9999))
            item = {
                "id": f"g-{slug(lemma)}",
                "w": lemma,
                "pos": pos,
                "ja": ja,
                "lv": lvl,
                "cat": "general",
                "ipa": us_ipa(lemma, ipa),
                "ex": [{"en": en2, "ja": jx}],
                "rank": rank,
            }
            general.append({k: v for k, v in item.items() if v is not None})

    # ビジネス（BSL/TSL）
    biz_meta = {}
    with open(SRC / "lists" / "business.csv", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            biz_meta[r["lemma"].lower()] = (r["source"], int(r["rank"]))
    business = []
    for path in sorted((SRC / "vocab").glob("business-*.txt")):
        lvl = int(path.stem.split("-")[1])
        for lemma, pos, ja, en, jx in read_pipe(path, 5):
            key = lemma.lower()
            if key in seen:
                print(f"[WARN] 重複(ビジネス): {lemma}", file=sys.stderr)
                continue
            seen.add(key)
            en2, ok = ensure_marked(en, lemma)
            if not ok:
                warnings += 1
                print(f"[WARN] 例文に見出し語がない: {lemma}: {en}", file=sys.stderr)
            source, rank = biz_meta.get(key, ("BSL", 9999))
            lv_item = lvl
            if lvl == 4 and source == "BSL" and rank > 300:
                lv_item = 5  # 頻度の低いBSL語は上級へ
            item = {
                "id": f"b-{slug(lemma)}",
                "w": lemma,
                "pos": pos,
                "ja": ja,
                "lv": lv_item,
                "cat": "business",
                "ipa": us_ipa(lemma, ipa),
                "ex": [{"en": en2, "ja": jx}],
                "rank": rank,
                "refs": [source],
            }
            business.append({k: v for k, v in item.items() if v is not None})
    return general, business, warnings


RAIL_FILES = [
    "general", "structure", "rail", "snc", "geometry", "defect", "work", "safety", "civil", "eam", "standard",
]


def build_rail(ipa: dict[str, str]):
    rail = []
    seen = set()
    missing_ipa = []
    for sub in RAIL_FILES:
        path = SRC / "rail" / f"{sub}.txt"
        if not path.exists():
            continue
        for en, us, ja, lv, ipa_uk, ipa_us, refs, note, ex_en, ex_ja in read_pipe(path, 10):
            sid = f"r-{slug(en)}"
            if sid in seen:
                print(f"[WARN] 保線用語の重複: {en}", file=sys.stderr)
                continue
            seen.add(sid)
            us_term = us or None
            us_ipa = ipa_us or ipa_for_phrase(us_term or en, ipa)
            if not us_ipa:
                missing_ipa.append(us_term or en)
            ex2, ok = ensure_marked(ex_en, en)
            if not ok and us_term:
                ex2, ok = ensure_marked(ex_en, us_term)
            if not ok:
                # 複数語の用語は最初の語で探す
                head = en.split()[0]
                ex2, ok = ensure_marked(ex_en, head)
            if not ok:
                print(f"[WARN] 例文に用語がない: {en}: {ex_en}", file=sys.stderr)
            jis = None
            ja_main = ja
            if "〔" in ja:
                ja_main, jis = ja.split("〔", 1)
                jis = jis.rstrip("〕")
            item = {
                "id": sid,
                "w": en,
                "pos": "n" if not en.endswith(("ing",)) else "n",
                "ja": ja_main.strip(),
                "lv": int(lv),
                "cat": "rail",
                "sub": sub,
                "ipa": us_ipa,
                "ipaUk": ipa_uk or None,
                "us": us_term,
                "jis": jis,
                "ex": [{"en": ex2, "ja": ex_ja}],
                "note": note or None,
                "refs": [r.strip() for r in refs.split(";") if r.strip()] or None,
            }
            rail.append({k: v for k, v in item.items() if v is not None})
    return rail, missing_ipa


def main():
    ipa = load_ipa()
    general, business, warnings = build_general_business(ipa)
    rail, missing = build_rail(ipa)
    OUT.mkdir(parents=True, exist_ok=True)
    for name, data in (("general", general), ("business", business), ("rail", rail)):
        with open(OUT / f"{name}.json", "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
    total = len(general) + len(business) + len(rail)
    print(f"general={len(general)} business={len(business)} rail={len(rail)} total={total} warnings={warnings}")
    if missing:
        print(f"[INFO] 米音IPAなし（要手動）: {len(missing)} 件: {', '.join(missing[:30])}")
    no_ipa = [w['w'] for w in general + business if 'ipa' not in w]
    if no_ipa:
        print(f"[INFO] IPAなし(一般/ビジネス): {len(no_ipa)} 件: {', '.join(no_ipa[:40])}")


if __name__ == "__main__":
    main()
