#!/usr/bin/env python3
"""
単語データのビルドスクリプト。

入力:
  data-src/lists/ngsl.csv        NGSL 1.2 (CC BY-SA 4.0, Browne, Culligan & Phillips)
  data-src/lists/business.csv    BSL 1.2 / TSL 1.2 (CC BY-SA 4.0)
  data-src/vocab/*.txt           和訳・例文（lemma|pos|ja|例文EN|例文JA）
  data-src/rail/*.txt            保線用語（en|us|ja|lv|ipa_uk|ipa_us|refs|note|例文EN|例文JA）
  data-src/ipa/en_US.tsv         米音IPA（ipa-dict / cmudict-ipa, MIT）
  data-src/neighbors.tsv         意味の近い語（scripts/build_neighbors.py が WordNet 3.0 から生成）→ near
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
            variants = [v.strip().strip("/") for v in p.split(",") if v.strip()]
            # 品詞で読みが変わる語は、候補の順（名詞の読みが先）を変えない。動詞などの読みは OVERRIDE_POS で直す
            d.setdefault(w.lower(), variants[0] if w.lower() in HOMOGRAPHS else best_variant(variants))
    return d


IPA_CONS = set("pbtdkgfvθðszʃʒmnŋlɫɹrjwʧʤ")  # h は数えない（which /hwɪtʃ/ のような古い発音を選ばない）


def best_variant(variants: list[str]) -> str:
    """辞書の発音候補から、学習者向けの丁寧な発音を選ぶ。
    最初の候補はくだけた発音のことが多い（around /ɝˈaʊn/、twenty /ˈtwɛni/、report /ɹiˈpɔɹt/）。
    子音を落とさない候補・弱い母音を ɪ で書く候補・余分な第2強勢のない候補を優先する（同点なら先の候補）"""
    def score(v: str) -> float:
        cons = sum(1 for c in v if c in IPA_CONS)
        # 第1強勢より前の、強勢のない ɪ だけを数える（report /rɪˈpɔrt/）。when /wɪn/・focus /ˈfoʊkɪs/ は選ばない
        primary = v.find("ˈ")
        weak_i = sum(1 for k, c in enumerate(v) if c == "ɪ" and k < primary and not any_stress(v, k))
        return cons + weak_i - (1 if v.startswith("ˌ") else 0)
    return max(variants, key=lambda v: (score(v), -variants.index(v)))


def any_stress(ipa: str, idx: int) -> bool:
    """idx の母音が第1・第2強勢のある音節にあるか"""
    j = idx - 1
    while j >= 0:
        if ipa[j] in STRESS:
            return True
        if ipa[j] in VOWELS:
            return False
        j -= 1
    return False


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
    # 辞書の最初の発音が強調形・旧来形・誤りのもの（一般米語の標準的な発音にそろえる）
    "most": "moʊst", "last": "læst", "next": "nɛkst", "ear": "ɪr", "aisle": "aɪl", "ruin": "ˈruːɪn",
    "new": "nuː", "news": "nuːz", "due": "duː", "duty": "ˈduːti", "tuesday": "ˈtuːzdeɪ", "tube": "tuːb",
    "effect": "ɪˈfɛkt", "effective": "ɪˈfɛktɪv", "effectively": "ɪˈfɛktɪvli", "effectiveness": "ɪˈfɛktɪvnəs",
    "emerge": "ɪˈmɝdʒ", "emotion": "ɪˈmoʊʃən", "emotional": "ɪˈmoʊʃənəl", "emergency": "ɪˈmɝdʒənsi",
    "eleven": "ɪˈlɛvən", "museum": "mjuːˈziːəm", "yourself": "jɚˈsɛlf", "umbrella": "ʌmˈbrɛlə",
    "extraordinary": "ɪkˈstrɔrdəˌnɛri", "evaluate": "ɪˈvæljuːˌeɪt", "evaluation": "ɪˌvæljuːˈeɪʃən",
    "inquiry": "ɪnˈkwaɪri", "route": "ruːt", "trial": "ˈtraɪəl", "fuel": "ˈfjuːəl", "dial": "ˈdaɪəl",
    "via": "ˈvaɪə", "buffet": "bəˈfeɪ", "presenter": "prɪˈzɛntɚ", "abuse": "əˈbjuːs",
    "genuine": "ˈdʒɛnjuːɪn", "differently": "ˈdɪfrəntli", "duration": "dʊˈreɪʃən", "everyday": "ˈɛvriːˌdeɪ",
    "coworker": "ˈkoʊˌwɝkɚ", "sightsee": "ˈsaɪtˌsiː",
    "printer": "ˈprɪntɚ", "center": "ˈsɛntɚ", "interface": "ˈɪntɚˌfeɪs", "neural": "ˈnʊrəl",
    "tissue": "ˈtɪʃuː", "saturday": "ˈsætɚdeɪ", "email": "ˈiːmeɪl", "between": "bɪˈtwiːn", "often": "ˈɔfən",
    "beyond": "bɪˈjɑnd", "eventually": "ɪˈvɛntʃuəli", "forget": "fɚˈɡɛt",
}

# 品詞で発音が変わる語（名詞と動詞で強勢や音が違う）。辞書の最初の発音が別の品詞のものを直す
OVERRIDE_POS = {
    ("live", "v"): "lɪv", ("use", "v"): "juːz", ("read", "v"): "riːd", ("close", "v"): "kloʊz",
    ("lead", "v"): "liːd", ("wind", "n"): "wɪnd", ("wound", "n"): "wuːnd", ("tear", "v"): "tɛr",
    ("excuse", "n"): "ɪkˈskjuːs", ("excuse", "v"): "ɪkˈskjuːz",
    ("increase", "v"): "ɪnˈkriːs", ("decrease", "v"): "dɪˈkriːs", ("produce", "v"): "prəˈduːs",
    ("conduct", "v"): "kənˈdʌkt", ("transfer", "v"): "trænsˈfɝ", ("refuse", "v"): "rɪˈfjuːz",
    ("recall", "v"): "rɪˈkɔl", ("suspect", "v"): "səˈspɛkt", ("permit", "v"): "pɚˈmɪt",
    ("import", "v"): "ɪmˈpɔrt", ("export", "v"): "ɪkˈspɔrt", ("reject", "v"): "rɪˈdʒɛkt",
    ("construct", "v"): "kənˈstrʌkt", ("update", "v"): "ˌʌpˈdeɪt", ("upgrade", "v"): "ˌʌpˈɡreɪd",
    ("convert", "v"): "kənˈvɝt", ("transform", "v"): "trænsˈfɔrm", ("impress", "v"): "ɪmˈprɛs",
    ("attribute", "v"): "əˈtrɪbjuːt", ("extract", "v"): "ɪkˈstrækt", ("combine", "v"): "kəmˈbaɪn",
    ("exploit", "v"): "ɪkˈsplɔɪt", ("rewrite", "v"): "ˌriːˈraɪt", ("present", "v"): "prɪˈzɛnt",
    ("record", "v"): "rɪˈkɔrd", ("object", "v"): "əbˈdʒɛkt", ("project", "v"): "prəˈdʒɛkt",
    ("separate", "adj"): "ˈsɛpɚət", ("appropriate", "adj"): "əˈproʊpriːət", ("moderate", "adj"): "ˈmɑdɚət",
    ("adequate", "adj"): "ˈædəkwət", ("perfect", "adj"): "ˈpɝfɪkt", ("upset", "adj"): "ˌʌpˈsɛt",
    ("inside", "adv"): "ˌɪnˈsaɪd", ("refund", "n"): "ˈriːfʌnd", ("subordinate", "n"): "səˈbɔrdənət",
    ("duplicate", "n"): "ˈduːpləkət", ("affiliate", "n"): "əˈfɪliːət", ("estimate", "n"): "ˈɛstəmət",
    ("overhead", "n"): "ˈoʊvɚˌhɛd", ("offset", "v"): "ˌɔfˈsɛt",
    ("reset", "v"): "riːˈsɛt", ("desert", "n"): "ˈdɛzɚt",
}


# 品詞で読みが変わる語。単語だけを高品質音声で読むとき、この発音を指定する（Word.say）
HOMOGRAPHS = {
    "live", "read", "use", "close", "lead", "wind", "wound", "tear", "row", "bow", "minute", "object",
    "present", "record", "project", "subject", "content", "contract", "progress", "desert", "conduct",
    "permit", "produce", "increase", "decrease", "refuse", "excuse", "separate", "estimate", "associate",
    "graduate", "appropriate", "moderate", "advocate", "duplicate", "delegate", "subordinate", "affiliate",
    "attribute", "conflict", "contrast", "protest", "survey", "transfer", "transport", "import", "export",
    "reject", "recall", "suspect", "convert", "extract", "update", "upgrade", "compound", "discount",
    "refund", "defect", "abuse", "perfect", "upset", "house", "entrance", "overhead", "offset", "insult",
}


DIPHTHONGS = {"aɪ", "aʊ", "eɪ", "oʊ", "ɔɪ"}


def syllables(ipa: str) -> int:
    """音節の数（母音のまとまりの数。aɪ などの二重母音は1つ、ri.ɪn・wɝ.i のように並んだ母音は別に数える）"""
    n, prev = 0, ""
    for c in ipa:
        if c == "ː":
            continue
        if c in VOWELS:
            if not prev or prev + c not in DIPHTHONGS:
                n += 1
            prev = c
        else:
            prev = ""
    return n


def normalize_us(ipa: str, word: str = "") -> str:
    """cmudict-ipa の表記を学習者向けの一般米語表記に整える"""
    # which/when などの hw は現代の一般米語では w
    s = ipa.replace("ɫ", "l").replace("ɹ", "r").replace("hw", "w")
    # 強勢記号が /j/ の後ろに付いている表記（kəmˈjunəti）は、音節の頭の子音の前へ（kəˈmjunəti）
    s = re.sub(r"([^aeiouæɑɒɔəɛɪʊʌɝɚɐˈˌː])([ˈˌ])j", r"\2\1j", s)
    # 第1強勢の直前の1音節だけに付いた余分な第2強勢（ˌɪmˈpɔrtənt、ˌdɪˈsaɪd、ˌriˈvju）は取る。
    # 第1強勢の前に2音節以上あるとき（ˌɪndəˈkeɪʃən、ˌriːɪnˈfɔrs）は本来の第2強勢なので残す
    m = re.match(r"^ˌ([^ˈˌ]*)ˈ", s)
    if m and syllables(m.group(1)) == 1 and re.search(r"[ɪəi]", m.group(1)):
        s = s[1:]
    # 語末の -y（弱い i）に付いた第2強勢（company ˈkʌmpəˌni、ability əˈbɪləˌti）は取る
    if word.lower().endswith("y"):
        s = re.sub(r"ˌ([^aeiouæɑɒɔəɛɪʊʌɝɚɐˈˌ]*)i$", r"\1i", s)
    one = syllables(s) <= 1
    out = []
    for i, c in enumerate(s):
        nxt = next((x for x in s[i + 1 :] if x not in STRESS), "")
        if c == "ə" and stressed(s, i):
            out.append("ʌ")
        elif c == "ɝ" and not stressed(s, i):
            out.append("ɚ")
        elif c == "i":
            # 強勢のある i は長い iː。弱い i は、語末と母音の前（happy、react）では i、それ以外は ɪ（report、economy）
            if any_stress(s, i) or one:
                out.append("iː")
            elif i == len(s) - 1 or nxt in VOWELS:
                out.append("i")
            else:
                out.append("ɪ")
        elif c == "u":
            out.append("uː")
        else:
            out.append(c)
    r = "".join(out)
    # r の位置（correct /kɚˈɛkt/ → /kəˈrɛkt/、original /ɚˈɪdʒənəl/ → /əˈrɪdʒənəl/）
    r = re.sub(r"ɚ([ˈˌ])(?=[aeiouæɑɒɔəɛɪʊʌ])", r"ə\1r", r)
    if syllables(r) <= 1:
        r = r.replace("ˈ", "").replace("ˌ", "")
    # 第1強勢が2つある表記（ˈfɪfˈtin など）は、前を第2強勢にする
    while r.count("ˈ") > 1:
        r = r.replace("ˈ", "ˌ", 1)
    return r


def us_ipa(word: str, d: dict[str, str], pos: str | None = None) -> str | None:
    key = word.lower()
    if (key, pos) in OVERRIDE_POS:
        return OVERRIDE_POS[(key, pos)]
    if acronym_ipa(word):
        return acronym_ipa(word)
    if key in OVERRIDE_US:
        return OVERRIDE_US[key]
    if key in d:
        return normalize_us(d[key], key)
    return ipa_for_phrase(word, d)


TOKEN_RE = re.compile(r"[A-Za-z][A-Za-z'\-]*")


# 略語（API, VPN, USB…）は1文字ずつ読む。最後の文字に第1強勢
LETTER_US = {
    "a": "eɪ", "b": "biː", "c": "siː", "d": "diː", "e": "iː", "f": "ɛf", "g": "dʒiː", "h": "eɪtʃ", "i": "aɪ",
    "j": "dʒeɪ", "k": "keɪ", "l": "ɛl", "m": "ɛm", "n": "ɛn", "o": "oʊ", "p": "piː", "q": "kjuː", "r": "ɑr",
    "s": "ɛs", "t": "tiː", "u": "juː", "v": "viː", "w": "ˈdʌbəljuː", "x": "ɛks", "y": "waɪ", "z": "ziː",
}


def acronym_ipa(tok: str) -> str | None:
    if not (2 <= len(tok) <= 5 and tok.isalpha() and tok.isupper()):
        return None
    letters = [LETTER_US[c] for c in tok.lower()]
    letters = [x.replace("ˈ", "") for x in letters]
    return "".join("ˌ" + x for x in letters[:-1]) + "ˈ" + letters[-1]


def ipa_for_phrase(phrase: str, d: dict[str, str]) -> str | None:
    parts = []
    for tok in TOKEN_RE.findall(phrase):
        key = tok.lower()
        if acronym_ipa(tok):
            parts.append(acronym_ipa(tok))
            continue
        if key in OVERRIDE_US:
            parts.append(OVERRIDE_US[key])
            continue
        if key in d:
            parts.append(normalize_us(d[key], key))
            continue
        # ハイフン語は分割して合成
        if "-" in key and all(p in d for p in key.split("-")):
            parts.append("".join(normalize_us(d[p], p) for p in key.split("-")))
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
                "ipa": us_ipa(lemma, ipa, pos),
                "say": us_ipa(lemma, ipa, pos) if key in HOMOGRAPHS else None,
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
                "ipa": us_ipa(lemma, ipa, pos),
                "say": us_ipa(lemma, ipa, pos) if key in HOMOGRAPHS else None,
                "ex": [{"en": en2, "ja": jx}],
                "rank": rank,
                "refs": [source],
            }
            business.append({k: v for k, v in item.items() if v is not None})
    return general, business, warnings


def build_it(ipa: dict[str, str], taken: set[str]):
    """IT（data-src/vocab/it-N.txt → レベル N）。一般・ビジネス・保線と同じ見出し語は入れない"""
    it = []
    seen = set()
    warnings = 0
    for path in sorted((SRC / "vocab").glob("it-*.txt")):
        lvl = int(path.stem.split("-")[1])
        rows = []
        with open(path, encoding="utf-8") as f:
            for no, line in enumerate(f, 1):
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                cols = [c.strip() for c in line.split("|")]
                if len(cols) not in (5, 6):
                    print(f"[WARN] {path.name}:{no} 列数 {len(cols)}: {line[:80]}", file=sys.stderr)
                    warnings += 1
                    continue
                rows.append(cols + [""] * (6 - len(cols)))
        for lemma, pos, ja, en, jx, ipa_override in rows:
            key = lemma.lower()
            if key in seen or key in taken:
                print(f"[WARN] 重複(IT): {lemma}", file=sys.stderr)
                warnings += 1
                continue
            seen.add(key)
            en2, ok = ensure_marked(en, lemma)
            if not ok:
                warnings += 1
                print(f"[WARN] 例文に見出し語がない: {lemma}: {en}", file=sys.stderr)
            item = {
                "id": f"i-{slug(lemma)}",
                "w": lemma,
                "pos": pos,
                "ja": ja,
                "lv": lvl,
                "cat": "it",
                "ipa": ipa_override or us_ipa(lemma, ipa, pos),
                "ex": [{"en": en2, "ja": jx}],
            }
            it.append({k: v for k, v in item.items() if v is not None})
    return it, warnings


RAIL_FILES = [
    "general", "structure", "rail", "snc", "geometry", "defect", "work", "safety", "civil", "eam", "standard",
]


RAIL_AUX = {"shall", "should", "may", "must", "will", "can"}


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
            us_term = us if us and us.lower() != en.lower() else None
            # 米音は他のコースと同じ一般米語の表記（ɑ・ɔ に長音記号を付けない）にそろえる
            us_ipa = (ipa_us or ipa_for_phrase(us_term or en, ipa) or "").replace("ɑː", "ɑ").replace("ɔː", "ɔ") or None
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
                # 保線用語はほぼ名詞。規格の助動詞（shall / should / may / must）だけは助動詞にする
                "pos": "aux" if en.lower() in RAIL_AUX else "n",
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


def load_neighbors() -> dict[str, list[str]]:
    """選択問題のまぎらわしい選択肢に使う、意味の近い語（id → 近い順の id）"""
    path = SRC / "neighbors.tsv"
    out: dict[str, list[str]] = {}
    if not path.exists():
        return out
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip() or line.startswith("#"):
            continue
        wid, ids = line.split("\t")
        out[wid] = ids.split(",")
    return out


def attach_neighbors(words: list[dict], near: dict[str, list[str]]):
    """同じコースにある語だけを残して near に入れる（語が消えたときに古い id を残さない）"""
    ids = {w["id"] for w in words}
    for w in words:
        ns = [i for i in near.get(w["id"], []) if i in ids and i != w["id"]]
        if ns:
            w["near"] = ns


def main():
    ipa = load_ipa()
    general, business, warnings = build_general_business(ipa)
    rail, missing = build_rail(ipa)
    taken = {w["w"].lower() for w in general + business + rail}
    it, it_warn = build_it(ipa, taken)
    warnings += it_warn
    near = load_neighbors()
    for words in (general, business, it):
        attach_neighbors(words, near)
    OUT.mkdir(parents=True, exist_ok=True)
    for name, data in (("general", general), ("business", business), ("it", it), ("rail", rail)):
        with open(OUT / f"{name}.json", "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
    # ホーム画面の集計用（大きな単語データを読み込まずに語数を表示する）
    with open(OUT / "counts.json", "w", encoding="utf-8") as f:
        json.dump({"general": len(general), "business": len(business), "it": len(it), "rail": len(rail)}, f)
        f.write("\n")
    total = len(general) + len(business) + len(it) + len(rail)
    print(f"general={len(general)} business={len(business)} it={len(it)} rail={len(rail)} total={total} warnings={warnings}")
    if missing:
        print(f"[INFO] 米音IPAなし（要手動）: {len(missing)} 件: {', '.join(missing[:30])}")
    no_ipa = [w['w'] for w in general + business + it if 'ipa' not in w]
    if no_ipa:
        print(f"[INFO] IPAなし(一般/ビジネス): {len(no_ipa)} 件: {', '.join(no_ipa[:40])}")


if __name__ == "__main__":
    main()
