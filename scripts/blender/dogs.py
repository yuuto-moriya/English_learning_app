"""
犬のぬいぐるみ（2頭身・おすわり姿）を Blender(bpy) でプロシージャルにモデリングする。

案内役の「テツ」（コーギー）と、いろいろな犬種のなかまたち：
  tetsu   テツ     コーギー（レッド＆ホワイト）       青いリボン          案内役・応援係（8ポーズ）
  moka    モカ     トイプードル（アプリコット）       頭にピンクのリボン   リスニング・発音コーチ
  sumi    スミ     フレンチブルドッグ（フォーン・黒マスク） 赤いネクタイ   ビジネス英語の先輩
  kinako  キナコ   柴犬（クリーム／きなこ色）         ティールのバンダナ   保線のベテラン
  yuki    ユキ先生 サモエド（ホワイト）               丸メガネ            学習法の研究者
  chocola ショコラ ミニチュアダックス（チョコタン）   黄色のバンダナ       翻訳のお手伝い

レンダリングは scripts/blender/render.py から行う：
  python scripts/blender/render.py <出力dir> [--size 768] [--samples 64] [--only tetsu-greet,moka-happy]
"""
from __future__ import annotations

from kit import (
    BLUSH, INK, MOUTH, TONGUE, ball, box, bubbles, capsule, closed_eye, cone, confetti, empty, glasses, glossy,
    glow, happy_eye, line, arc, mat, necktie, sparkle_eye, stars, sweat, thread, torus, zzz,
)

CREAM = (0.96, 0.90, 0.80, 1)
WHITE_FUR = (0.95, 0.94, 0.92, 1)

# 犬種ごとの毛色・顔のつくり
#   fur=地の色 chest=胸 paws=足先 muzzle=口まわり cheeks=ほっぺ ear=耳の内側 brow=まゆ（刺しゅう）
#   head=頭の楕円体 nose=(y, z, 大きさ) eye=(x, y, z) fuzz=起毛（長さ・カール）
CHARACTERS = {
    "tetsu": dict(
        breed="corgi", fur=(0.90, 0.40, 0.12, 1), chest=CREAM, paws=CREAM, muzzle=CREAM, cheeks=CREAM,
        ear=(1.0, 0.60, 0.50, 1), brow=(0.50, 0.16, 0.03, 1), head=(0.70, 0.60, 0.58),
        nose=(-0.645, -0.075, 1.0), eye=(0.27, -0.535, 0.03), neck=("ribbon", (0.25, 0.50, 0.95, 1)),
        fuzz=dict(length=0.03),
    ),
    "moka": dict(
        breed="poodle", fur=(0.80, 0.42, 0.17, 1), chest=(0.86, 0.50, 0.22, 1), paws=(0.86, 0.50, 0.22, 1),
        muzzle=(0.90, 0.58, 0.30, 1), cheeks=(0.80, 0.42, 0.17, 1), ear=(0.80, 0.42, 0.17, 1),
        brow=(0.35, 0.14, 0.04, 1), head=(0.62, 0.58, 0.56), nose=(-0.625, -0.09, 1.0), eye=(0.25, -0.52, 0.02),
        neck=None, bow=(1.0, 0.36, 0.55, 1), fuzz=dict(length=0.042, curl=0.012, density=2600),
    ),
    "sumi": dict(
        breed="frenchie", fur=(0.78, 0.52, 0.28, 1), chest=(0.93, 0.85, 0.72, 1), paws=(0.78, 0.52, 0.28, 1),
        muzzle=(0.035, 0.03, 0.03, 1), cheeks=(0.78, 0.52, 0.28, 1), ear=(0.95, 0.58, 0.55, 1),
        brow=(0.30, 0.16, 0.06, 1), head=(0.74, 0.58, 0.56), nose=(-0.60, -0.07, 1.25), eye=(0.30, -0.51, 0.05),
        neck=("tie", (0.80, 0.08, 0.06, 1)), fuzz=dict(length=0.016, density=3600),
    ),
    "kinako": dict(
        breed="shiba", fur=(0.90, 0.64, 0.34, 1), chest=(0.98, 0.94, 0.86, 1), paws=(0.98, 0.94, 0.86, 1),
        muzzle=(0.98, 0.94, 0.86, 1), cheeks=(0.98, 0.94, 0.86, 1),
        ear=(0.98, 0.94, 0.86, 1), brow=(0.98, 0.94, 0.86, 1), head=(0.68, 0.58, 0.56), nose=(-0.635, -0.08, 0.95),
        eye=(0.26, -0.525, 0.03), neck=("bandana", (0.0, 0.40, 0.34, 1)), fuzz=dict(length=0.026),
    ),
    "yuki": dict(
        breed="samoyed", fur=WHITE_FUR, chest=WHITE_FUR, paws=WHITE_FUR, muzzle=(0.97, 0.96, 0.94, 1),
        cheeks=WHITE_FUR, ear=(1.0, 0.75, 0.70, 1), brow=(0.55, 0.50, 0.46, 1), head=(0.70, 0.60, 0.58),
        nose=(-0.645, -0.075, 1.0), eye=(0.27, -0.545, 0.03), neck=None, glasses=True,
        fuzz=dict(length=0.06, density=2400, radius=0.0045),
    ),
    "chocola": dict(
        breed="dachshund", fur=(0.17, 0.075, 0.035, 1), chest=(0.66, 0.32, 0.11, 1), paws=(0.66, 0.32, 0.11, 1),
        muzzle=(0.66, 0.32, 0.11, 1), cheeks=(0.66, 0.32, 0.11, 1), ear=(0.17, 0.075, 0.035, 1),
        brow=(0.66, 0.32, 0.11, 1), head=(0.62, 0.58, 0.55), nose=(-0.74, -0.10, 1.0), eye=(0.25, -0.52, 0.05),
        iris=(0.30, 0.13, 0.04, 1), neck=("bandana", (1.0, 0.68, 0.08, 1)), fuzz=dict(length=0.024),
    ),
}

POSES = ["greet", "happy", "celebrate", "think", "cheer", "sleep", "safety", "oops"]
FRIEND_POSES = ["greet", "happy", "think", "cheer"]


def fuzz_of(who: str) -> dict:
    return CHARACTERS[who]["fuzz"]


def build(pose: str, extras: bool = True, who: str = "tetsu"):
    d = CHARACTERS[who]
    breed = d["breed"]
    F = lambda c: mat(c, rough=0.66, sheen=0.35)  # noqa: E731  毛の素材
    fur = F(d["fur"])
    chest = mat(d["chest"], rough=0.7, sheen=0.4)
    paws = mat(d["paws"], rough=0.7, sheen=0.4)
    muzzle = mat(d["muzzle"], rough=0.7, sheen=0.4)
    cheeks = mat(d["cheeks"], rough=0.7, sheen=0.4)
    ink = glossy(INK)
    # 口は刺しゅう糸。黒い犬では見えるように明るめの糸にする
    stitch = thread((0.40, 0.36, 0.36, 1) if breed == "frenchie" else (0.07, 0.035, 0.02, 1))
    lying = pose == "sleep"
    hop = 0.28 if pose == "celebrate" else 0.0
    root = empty("root", (0, 0, hop))

    # ───── からだ（おすわり） ─────
    if not lying:
        ball((0, 0.06, 0.50), (0.50, 0.46, 0.50), fur, root)               # 胴
        if breed == "samoyed":
            ball((0, -0.22, 0.66), (0.42, 0.30, 0.38), chest, root)        # 首まわりのたっぷりした毛
        elif breed == "frenchie":
            ball((0, -0.32, 0.60), (0.20, 0.16, 0.24), chest, root)        # 胸の白い模様
        else:
            ball((0, -0.28, 0.60), (0.30, 0.22, 0.30), chest, root)        # 胸
        for s in (-1, 1):
            ball((s * 0.36, 0.02, 0.24), (0.22, 0.30, 0.22), fur, root)    # もも
            ball((s * 0.40, -0.34, 0.11), (0.15, 0.18, 0.10), paws, root, rot=(0, 0, s * -15))  # 足
    else:
        ball((0, 0.30, 0.34), (0.52, 0.62, 0.34), fur, root)
        ball((0, -0.08, 0.30), (0.40, 0.30, 0.28), chest, root)
        for s in (-1, 1):
            ball((s * 0.36, 0.52, 0.18), (0.20, 0.26, 0.17), fur, root)
            capsule((s * 0.26, -0.20, 0.20), (s * 0.24, -0.66, 0.10), 0.115, fur, root)
            ball((s * 0.24, -0.74, 0.09), (0.14, 0.15, 0.085), paws, root)

    # しっぽ
    if breed == "shiba":
        # くるんと巻いた尾（背中の上に見える）
        torus((0.40, 0.26, 0.94), 0.15, 0.085, fur, root, rot=(60, 0, 55))
        ball((0.40, 0.20, 0.86), (0.08, 0.07, 0.07), chest, root)
    elif breed == "poodle":
        ball((0, 0.50, 0.62), 0.16, fur, root)                            # ポンポンのしっぽ
    elif breed == "samoyed":
        ball((0.10, 0.46, 0.78), (0.26, 0.18, 0.20), fur, root, rot=(0, 30, 0))  # 背中に乗るふさふさの尾
    elif breed == "dachshund":
        capsule((0.0, 0.48, 0.30), (0.30, 0.70, 0.20), 0.06, fur, root, r1=0.04)
    elif breed == "frenchie":
        ball((0, 0.48, 0.34), 0.07, fur, root)
    elif not lying:
        ball((0, 0.52, 0.30), (0.16, 0.14, 0.14), fur, root)
    else:
        ball((0, 0.92, 0.40), (0.16, 0.14, 0.14), fur, root)

    # ───── 前足（ポーズで変える） ─────
    def front_leg(s, end, paw_scale=(0.13, 0.13, 0.13)):
        shoulder = (s * 0.22, -0.24, 0.58)
        capsule(shoulder, end, 0.11, fur, root, r1=0.105)
        ball(end, paw_scale, paws, root)

    def resting_leg(s):
        capsule((s * 0.20, -0.26, 0.50), (s * 0.19, -0.36, 0.16), 0.11, fur, root)
        ball((s * 0.19, -0.40, 0.10), (0.13, 0.15, 0.08), paws, root)

    if not lying:
        if pose == "greet":
            resting_leg(-1)
            front_leg(1, (0.64, -0.42, 1.06))
        elif pose == "celebrate":
            front_leg(-1, (-0.68, -0.40, 1.16))
            front_leg(1, (0.68, -0.40, 1.16))
        elif pose == "cheer":
            resting_leg(-1)
            front_leg(1, (0.60, -0.36, 1.26), (0.15, 0.14, 0.15))
        elif pose == "think":
            resting_leg(-1)
            front_leg(1, (0.20, -0.80, 1.00))
        elif pose == "safety":
            resting_leg(-1)
            front_leg(1, (0.84, -0.52, 0.92))  # 指差確認
        elif pose == "oops":
            resting_leg(-1)
            front_leg(1, (0.64, -0.34, 1.54))  # 頭をかく
        else:
            resting_leg(-1)
            resting_leg(1)

    # ───── 首まわりの小物 ─────
    if not lying and d.get("neck"):
        kind, color = d["neck"]
        nm = mat(color, rough=0.45, sheen=0.6)
        if kind == "ribbon":
            torus((0, -0.06, 0.84), 0.37, 0.05, nm, root, rot=(-12, 0, 0), scale=(1.0, 0.92, 1.0))
            _bow(root, (0, -0.45, 0.78), nm, 1.0)
        elif kind == "bandana":
            torus((0, -0.06, 0.84), 0.38, 0.07, nm, root, rot=(-12, 0, 0), scale=(1.0, 0.92, 1.0))
            cone((0, -0.40, 0.70), 0.20, 0.30, nm, root, rot=(196, 0, 0), scale=(1.0, 0.32, 1.0))
        elif kind == "tie":
            torus((0, -0.06, 0.84), 0.37, 0.04, mat((0.96, 0.96, 0.97, 1), rough=0.5, sheen=0.3), root,
                  rot=(-12, 0, 0), scale=(1.0, 0.92, 1.0))
            necktie(root, (0, -0.46, 0.80), 0.40, 0.14, color)

    # ───── 頭 ─────
    tilt = {"think": 12, "happy": -9, "oops": 7, "cheer": -5, "greet": -7, "celebrate": 4, "safety": 0, "sleep": -6}[pose]
    nod = {"sleep": 10, "oops": 4, "think": -6, "celebrate": -6}.get(pose, -2)
    pivot = (0, -0.42, 0.52) if lying else (0, -0.10, 0.90)
    head = empty("head", pivot, (nod, tilt, 0), root)
    hc = (0, -0.05, 0.50)

    def H(off, scale, m, **kw):
        return ball((hc[0] + off[0], hc[1] + off[1], hc[2] + off[2]), scale, m, head, **kw)

    H((0, 0, 0), d["head"], fur)
    H((0, 0.02, -0.30), (0.50, 0.44, 0.24), fur)                      # 頬下のボリューム
    if breed == "frenchie":
        # 横に広い顔と、低く平たい鼻づら
        for s in (-1, 1):
            H((s * 0.30, -0.30, -0.18), (0.30, 0.24, 0.24), cheeks)
        H((0, -0.40, -0.17), (0.30, 0.18, 0.19), muzzle)
        H((0, -0.30, -0.32), (0.22, 0.18, 0.10), muzzle)
    elif breed == "dachshund":
        # 長めの鼻づら
        for s in (-1, 1):
            H((s * 0.26, -0.30, -0.20), (0.26, 0.24, 0.22), cheeks)
        H((0, -0.46, -0.19), (0.22, 0.28, 0.17), muzzle)
        H((0, -0.34, -0.32), (0.18, 0.18, 0.10), muzzle)
    else:
        for s in (-1, 1):
            H((s * 0.30, -0.30, -0.21), (0.30, 0.27, 0.24), cheeks)      # ほっぺ
        H((0, -0.40, -0.19), (0.25, 0.23, 0.19), muzzle)                # マズル
        H((0, -0.30, -0.33), (0.20, 0.18, 0.10), muzzle)                # あご
    if breed == "corgi":
        H((0, -0.515, 0.02), (0.085, 0.09, 0.27), muzzle, rot=(-14, 0, 0))  # 額の白いライン
    if breed in ("shiba", "dachshund"):
        # 目の上の「まろ眉」
        for s in (-1, 1):
            H((s * 0.22, -0.48, 0.22), (0.07, 0.03, 0.05), mat(d["brow"], rough=0.66, sheen=0.35))
    if breed == "poodle":
        H((0, 0.02, 0.50), (0.42, 0.38, 0.30), fur)                    # 頭のポンポン（トップノット）
        _bow(head, (-0.30, -0.36, 0.82), mat(d["bow"], rough=0.45, sheen=0.6), 1.15, rot=(-10, -25, 0))

    # 耳
    droop = {"oops": 26, "sleep": 30}.get(pose, 0)
    ear_in = mat(d["ear"], rough=0.7, sheen=0.3)
    for s in (-1, 1):
        if breed in ("corgi", "shiba", "samoyed"):
            r, depth, x, z, splay = {"corgi": (0.32, 0.88, 0.38, 0.50, 19), "shiba": (0.25, 0.58, 0.34, 0.44, 15),
                                     "samoyed": (0.21, 0.46, 0.34, 0.47, 22)}[breed]
            rot = (8 + droop * 0.2 + (10 if breed == "shiba" else 0), s * (splay + droop), 0)
            base = (hc[0] + s * x, hc[1] - 0.02, hc[2] + z - droop * 0.004)
            cone(base, r, depth, fur, head, rot=rot, scale=(1.0, 0.40, 1.0))
            cone((base[0], base[1] - 0.09 * r / 0.32, base[2] - 0.05), r * 0.67, depth * 0.75, ear_in, head, rot=rot,
                 scale=(1.0, 0.22, 1.0))
        elif breed == "frenchie":
            # コウモリのような大きな立ち耳
            H((s * 0.42, 0.0, 0.52), (0.23, 0.08, 0.32), fur, rot=(0, s * 24, 0))
            H((s * 0.415, -0.055, 0.52), (0.16, 0.04, 0.24), ear_in, rot=(0, s * 24, 0))
        else:
            # 垂れ耳（プードルはふっくら、ダックスは長い）
            if breed == "poodle":
                H((s * 0.58, 0.0, -0.12), (0.19, 0.20, 0.38), fur, rot=(0, 0, s * 8))
            else:
                H((s * 0.56, 0.04, -0.14), (0.15, 0.12, 0.44), fur, rot=(0, s * -8, s * 12))

    # 目
    ex, ey, ez = d["eye"]
    ey, ez = hc[1] + ey, hc[2] + ez
    if pose in ("happy", "celebrate"):
        for s in (-1, 1):
            happy_eye(head, s * ex, ey - 0.03, ez, 0.105)
    elif lying:
        for s in (-1, 1):
            closed_eye(head, s * ex, ey - 0.03, ez - 0.03, 0.10)
    else:
        look = {"think": (0.025, 0.04), "oops": (-0.02, -0.01), "safety": (0.03, -0.01)}.get(pose, (0.0, 0.0))
        for s in (-1, 1):
            sparkle_eye(head, s * ex, ey, ez, 0.115, 0.145, look, iris=d.get("iris"))
    brow = thread(d["brow"])
    if pose in ("cheer", "think", "safety"):
        for s in (-1, 1):
            lift = 0.21 if not (pose == "think" and s > 0) else 0.26
            line(arc(s * ex, ey - 0.02, ez + lift - 0.05, 0.075, 0.03, 30, 150, depth=0.02), brow, 0.019, head)
    if pose == "oops":
        for s in (-1, 1):
            line(arc(s * ex, ey - 0.02, ez + 0.16, 0.07, 0.03, 200 if s < 0 else 160, 340 if s < 0 else 20, depth=0.02),
                 brow, 0.017, head)
    if d.get("glasses"):
        glasses(head, ex, ey - 0.08, ez, 0.16)

    # 鼻と口（鼻の位置を基準に配置）
    ny, nz, nsize = d["nose"]
    H((0, ny, nz), (0.085 * nsize, 0.06 * nsize, 0.062 * nsize), ink)
    H((-0.025 * nsize, ny - 0.05, nz + 0.02), (0.026, 0.012, 0.016), glow((1, 1, 1, 1), 1.2))
    my, mz = hc[1] + ny - 0.02, hc[2] + nz - 0.105
    if pose in ("happy", "celebrate", "cheer", "greet"):
        H((0, ny + 0.02, nz - 0.14), (0.105, 0.05, 0.085), mat(MOUTH, rough=0.5, sheen=0, fuzz=False))
        H((0, ny - 0.01, nz - 0.18), (0.07, 0.04, 0.05), mat(TONGUE, rough=0.4, sheen=0, fuzz=False))
        for s in (-1, 1):
            line(arc(s * 0.05, my + 0.01, mz + 0.035, 0.05, 0.035, 180, 360, depth=0.01), stitch, 0.014, head)
    elif pose == "oops":
        line([(-0.08, my + 0.01, mz - 0.01), (-0.03, my - 0.005, mz + 0.02), (0.02, my - 0.005, mz - 0.01), (0.08, my + 0.01, mz + 0.02)], stitch, 0.014, head)
    else:
        for s in (-1, 1):
            line(arc(s * 0.05, my + 0.01, mz + 0.035, 0.05, 0.04, 180, 360, depth=0.01), stitch, 0.014, head)

    # ほっぺの赤み
    for s in (-1, 1):
        H((s * 0.43, -0.44, -0.10), (0.085, 0.03, 0.05), glow(BLUSH, 0.25), rot=(0, 0, s * -28))

    # ───── 演出 ─────
    if not extras:
        return root
    if pose == "celebrate":
        confetti((0, -0.3, 1.0))
    if pose == "happy":
        stars([((-0.95, -0.4, 1.80), 1.0), ((0.98, -0.4, 1.55), 0.75), ((-1.05, -0.4, 1.20), 0.55)])
    if pose == "cheer":
        {"moka": _notes, "sumi": _chart, "kinako": _flag, "yuki": _book, "chocola": _translate}.get(
            who, lambda: stars([((0.95, -0.4, 1.74), 1.0), ((0.35, -0.4, 1.99), 0.6)]))()
    if pose == "safety":
        stars([((1.18, -0.6, 1.02), 0.6)], color=(0.30, 0.80, 0.45, 1))
    if pose == "sleep":
        zzz([((0.70, -0.7, 1.25), 0.075), ((0.95, -0.7, 1.50), 0.10), ((1.25, -0.7, 1.82), 0.13)],
            mat((0.25, 0.50, 0.95, 1), rough=0.5, sheen=0, fuzz=False))
    if pose == "oops":
        sweat((-0.62, -0.75, 1.86), 1.2)
    if pose == "think":
        bubbles([((0.72, -0.7, 1.99), 0.06), ((0.92, -0.7, 2.16), 0.085), ((1.18, -0.7, 2.39), 0.12)])
    return root


def _bow(parent, at, m, sc, rot=(0, 0, 0)):
    """リボン結び（左右の輪＋たれ＋結び目）"""
    x, y, z = at
    p = empty("bow", (x, y, z), rot, parent)
    for s in (-1, 1):
        ball((s * 0.15 * sc, 0.01, 0.0), (0.15 * sc, 0.06 * sc, 0.10 * sc), m, p, rot=(0, s * -20, 0))
        ball((s * 0.08 * sc, 0.02, -0.12 * sc), (0.05 * sc, 0.04 * sc, 0.10 * sc), m, p, rot=(0, s * 25, 0))
    ball((0, -0.01, 0.0), (0.06 * sc, 0.05 * sc, 0.06 * sc), m, p)


# ───── なかまの「やる気」ポーズの小物 ─────
def _notes():
    """モカ：音符"""
    for (x, z, sc), c in (((-0.95, 1.50, 1.0), (1.0, 0.36, 0.55, 1)), ((0.88, 1.82, 0.8), (0.25, 0.50, 0.95, 1))):
        m = mat(c, rough=0.4, sheen=0, emission=0.15)
        ball((x, -0.4, z), (0.09 * sc, 0.05 * sc, 0.07 * sc), m, rot=(0, -25, 0))
        capsule((x + 0.08 * sc, -0.4, z + 0.02 * sc), (x + 0.08 * sc, -0.4, z + 0.34 * sc), 0.018 * sc, m)
        capsule((x + 0.08 * sc, -0.4, z + 0.34 * sc), (x + 0.20 * sc, -0.4, z + 0.22 * sc), 0.022 * sc, m)


def _chart():
    """スミ：右肩上がりのグラフ"""
    board = mat((0.97, 0.97, 0.98, 1), rough=0.5, sheen=0, fuzz=False)
    box((-0.95, -0.45, 1.00), (0.62, 0.04, 0.48), board, rot=(0, 8, 0), bevel=0.15)
    g = mat((0.10, 0.62, 0.30, 1), rough=0.4, sheen=0, emission=0.1)
    line([(-1.20, -0.49, 0.83), (-1.02, -0.49, 0.93), (-0.88, -0.49, 0.90), (-0.70, -0.49, 1.13)], g, 0.025, poly=True)
    cone((-0.68, -0.49, 1.17), 0.06, 0.12, g, rot=(0, 40, 0), sub=0)


def _flag():
    """キナコ：進行を知らせる緑の旗"""
    pole = mat((0.85, 0.85, 0.86, 1), rough=0.3, sheen=0, metallic=0.5)
    capsule((0.62, -0.38, 1.10), (0.62, -0.38, 1.95), 0.02, pole)
    flag = mat((0.10, 0.62, 0.30, 1), rough=0.6, sheen=0.4, fuzz=False)
    box((0.86, -0.38, 1.80), (0.44, 0.03, 0.28), flag, bevel=0.1)


def _book():
    """ユキ先生：本"""
    cov = mat((0.05, 0.30, 0.55, 1), rough=0.5, sheen=0, fuzz=False)
    pages = mat((0.97, 0.95, 0.90, 1), rough=0.6, sheen=0, fuzz=False)
    box((-0.92, -0.42, 1.00), (0.06, 0.40, 0.52), cov, rot=(0, 0, 70), bevel=0.2)
    box((-0.90, -0.40, 1.00), (0.05, 0.36, 0.48), pages, rot=(0, 0, 70), bevel=0.1)
    stars([((-0.55, -0.4, 1.55), 0.6)])


def _translate():
    """ショコラ：2つの吹き出し（英語⇄日本語）"""
    a = mat((0.95, 0.45, 0.10, 1), rough=0.5, sheen=0, fuzz=False)
    b = mat((0.05, 0.55, 0.50, 1), rough=0.5, sheen=0, fuzz=False)
    w = glow((1, 1, 1, 1), 1.0)
    box((-1.00, -0.45, 1.45), (0.46, 0.05, 0.32), a, bevel=0.35)
    cone((-0.90, -0.45, 1.25), 0.07, 0.14, a, rot=(180, 0, 0), sub=0)
    box((-0.70, -0.50, 1.02), (0.42, 0.05, 0.30), b, bevel=0.35)
    cone((-0.80, -0.50, 0.84), 0.07, 0.14, b, rot=(180, 0, 0), sub=0)
    for i in range(3):
        ball((-1.12 + i * 0.12, -0.49, 1.45), (0.035, 0.02, 0.035), w)
        ball((-0.82 + i * 0.12, -0.54, 1.02), (0.035, 0.02, 0.035), w)
