#!/usr/bin/env python3
"""
意味の近い語（選択問題のまぎらわしい選択肢）を、Princeton WordNet 3.0 から計算する。

選択問題で「意味を選ぶ」とき、まちがいの選択肢が正解と無関係だと簡単すぎる。
同じ上位語を持つ語（犬 → 猫・馬、月曜日 → 火曜日）や反対の意味の語（安い → 高い）を選択肢に使う。
ただし「どちらも正解」になる語は入れない：同じ意味の語（同じ synset）、上位語・下位語（犬と動物）。

入力:  src/data/vocab/{general,business,it}.json（npm run data:build の出力）
出力:  data-src/neighbors.tsv（id<TAB>近い語の id をカンマ区切り。意味の近い順）
       → 次の npm run data:build で各語の near に入る

使い方（WordNet が必要。ネットワークにつながる環境で一度だけ）:
  python3 -m venv .venv && .venv/bin/pip install nltk
  （WordNet のデータ wordnet.zip を nltk_data/corpora/ に置くか、python -m nltk.downloader wordnet）
  NLTK_DATA=<nltk_data のパス> .venv/bin/python scripts/build_neighbors.py
  npm run data:build
"""
from __future__ import annotations

import json
import re
from pathlib import Path

from nltk.corpus import wordnet as wn

ROOT = Path(__file__).resolve().parent.parent
VOCAB = ROOT / "src" / "data" / "vocab"
OUT = ROOT / "data-src" / "neighbors.tsv"

WN_POS = {"n": wn.NOUN, "v": wn.VERB, "adj": wn.ADJ, "adv": wn.ADV}
FUNCTION_POS = {"det", "pron", "prep", "conj", "aux", "int", "num"}
MAX = 6
SENSES = 2  # 「同じ意味・上位語」の除外は、よく使う意味の上位2つで判定する（安全側）

KANJI_KATA = re.compile(r"[㐀-鿿゠-ヿー]")


def gloss_parts(ja: str) -> list[str]:
    ja = re.sub(r"[（(][^）)]*[）)]", "", ja)
    parts = re.split(r"[；;、,・／/\s]+", ja)
    out = []
    for p in parts:
        p = re.sub(r"(する|させる|される|な|の|に|的な|的)$", "", p.strip())
        if p:
            out.append(p)
    return out


def meaning_overlap(pa: list[str], pb: list[str]) -> bool:
    """和訳の意味が重なる（src/lib/distractors.ts の meaningOverlap と同じ判定）
    - 意味のまとまりが同じ（維持；保守 と 保守）
    - 一方のまとまり全体が、もう一方に含まれる（影響 と 影響力、ファイル と ファイル名）
    - 2文字以上の語で終わりが同じ（競争相手 と 対戦相手）。月曜日・火曜日のように前が1文字なら別の意味として扱う
    """
    if set(pa) & set(pb):
        return True
    for x in pa:
        for y in pb:
            short, long_ = (x, y) if len(x) <= len(y) else (y, x)
            if (len(short) >= 3 or (len(short) >= 2 and all(KANJI_KATA.match(c) for c in short))) and short in long_:
                return True
            k = 0
            while k < min(len(x), len(y)) and x[-1 - k] == y[-1 - k] and KANJI_KATA.match(x[-1 - k]):
                k += 1
            if k >= 2 and len(x) - k >= 2 and len(y) - k >= 2:
                return True
    return False


class Entry:
    def __init__(self, w: dict):
        self.w = w
        self.id = w["id"]
        self.lemma = w["w"].lower()
        self.pos = w["pos"]
        self.rank = w.get("rank", 9999)
        self.lv = w["lv"]
        p = WN_POS.get(self.pos)
        self.syns = wn.synsets(self.lemma.replace(" ", "_"), p)[:SENSES] if p and " " not in self.lemma else []
        # 近さは、いちばんよく使う意味（和訳の最初の意味とほぼ一致する）だけで測る。2番目以降の意味で
        # 「猫 → 紳士（cat = 男）」のような選択肢が混ざるのを防ぐ
        self.main = self.syns[:1]
        self.parts = gloss_parts(w["ja"])
        self.names = {n.lower() for s in self.syns for n in s.lemma_names()}
        self.hyper1 = {h for s in self.main for h in s.hypernyms() + s.instance_hypernyms()}
        self.hyper2 = {g for h in self.hyper1 for g in h.hypernyms()}
        self.ancestors = {a for s in self.syns for path in s.hypernym_paths() for a in path} - set(self.syns)
        self.lex = {s.lexname() for s in self.main}
        self.antonyms = {a.name().lower() for s in self.syns for l in s.lemmas() for a in l.antonyms()}
        # 形容詞：反対語のまわり（similar to）と、同じ属性（重い・軽い → 重さ）
        self.anto_side = set()
        self.attrs = set()
        if self.pos == "adj":
            for s in self.syns:
                for l in s.lemmas():
                    for a in l.antonyms():
                        for sim in a.synset().similar_tos():
                            self.anto_side |= {n.lower() for n in sim.lemma_names()}
                self.attrs |= set(s.attributes())
            self.own_side = {n.lower() for s in self.syns for sim in s.similar_tos() for n in sim.lemma_names()}
        else:
            self.own_side = set()


def score(a: Entry, b: Entry) -> int:
    if not a.syns or not b.syns:
        return 0
    # 同じ意味（どちらも正解になる）・上位語と下位語（犬と動物）は使わない
    if set(a.syns) & set(b.syns) or b.lemma in a.names or a.lemma in b.names:
        return -1
    if set(b.syns) & a.ancestors or set(a.syns) & b.ancestors:
        return -1
    if a.pos == "adj":
        if b.lemma in a.own_side or a.lemma in b.own_side:
            return -1
        if b.lemma in a.antonyms:
            return 4
        if b.lemma in a.anto_side:
            return 3
        if a.attrs and a.attrs & b.attrs:
            return 3
        return 0
    if a.pos == "adv":
        return 4 if b.lemma in a.antonyms else 0
    if b.lemma in a.antonyms:
        return 4
    if a.hyper1 & b.hyper1:
        return 4  # 同じ上位語（犬・猫・馬）
    s = 0
    if a.hyper1 & b.hyper2 or b.hyper1 & a.hyper2 or a.hyper2 & b.hyper2:
        s = 3
    if a.lex & b.lex:
        best = max((x.wup_similarity(y) or 0) for x in a.main for y in b.main)
        if best >= 0.85:
            s = max(s, 3)
        elif best >= 0.75 and a.pos == "n":
            s = max(s, 2)
    return s


def neighbors(words: list[dict]) -> dict[str, list[str]]:
    entries = [Entry(w) for w in words]
    by_pos: dict[str, list[Entry]] = {}
    for e in entries:
        by_pos.setdefault(e.pos, []).append(e)
    out: dict[str, list[str]] = {}
    for e in entries:
        if e.pos in FUNCTION_POS:
            cands = [o for o in by_pos[e.pos] if o.id != e.id and not meaning_overlap(e.parts, o.parts)]
            # 機能語（代名詞・前置詞・数など）は同じ品詞どうし（私は → 彼らは・それは）
            ranked = sorted(cands, key=lambda o: (abs(o.rank - e.rank), abs(o.lv - e.lv)))
            out[e.id] = [o.id for o in ranked[:MAX]]
            continue
        scored = []
        for o in by_pos[e.pos]:
            if o.id == e.id or abs(o.lv - e.lv) > 2:
                continue
            s = score(e, o)
            if s >= 2 and not meaning_overlap(e.parts, o.parts):
                scored.append((-s, abs(o.rank - e.rank), o.id))
        scored.sort()
        if scored:
            out[e.id] = [i for _, _, i in scored[:MAX]]
    return out


def main():
    lines = []
    total = 0
    for name in ("general", "business", "it"):
        words = json.loads((VOCAB / f"{name}.json").read_text(encoding="utf-8"))
        near = neighbors(words)
        total += len(near)
        print(f"{name}: {len(near)}/{len(words)} 語に近い語")
        for w in words:
            if near.get(w["id"]):
                lines.append(f"{w['id']}\t{','.join(near[w['id']])}")
    OUT.write_text(
        "# 意味の近い語（scripts/build_neighbors.py が Princeton WordNet 3.0 から生成。手で編集しない）\n" + "\n".join(lines) + "\n",
        encoding="utf-8",
    )
    print(f"→ {OUT.relative_to(ROOT)}（{total} 語）")


if __name__ == "__main__":
    main()
