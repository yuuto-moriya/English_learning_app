"""
コーギーのぬいぐるみ（2頭身・おすわり姿）を Blender(bpy) でプロシージャルにモデリングする。

案内役の「テツ」と、色違いのなかまたち（毛色・首まわりの小物で見分ける）：
  tetsu  テツ    レッド＆ホワイト  青いリボン        案内役・応援係（8ポーズ）
  moka   モカ    セーブル          ピンクのリボン    リスニング・発音コーチ
  sumi   スミ    トライカラー      赤いネクタイ      ビジネス英語の先輩
  kinako キナコ  フォーン          ティールのバンダナ 保線のベテラン
  yuki   ユキ先生 ブルーマール      丸メガネ          学習法の研究者

レンダリングは scripts/blender/render.py から行う：
  python scripts/blender/render.py <出力dir> [--size 768] [--samples 64] [--only tetsu-greet,moka-happy]
"""
from __future__ import annotations

from kit import (
    BLUSH, INK, MOUTH, TONGUE, ball, box, bubbles, capsule, closed_eye, cone, confetti, empty, glasses, glossy,
    glow, happy_eye, line, arc, mat, necktie, sparkle_eye, stars, sweat, thread, torus, zzz,
)

# 毛色（リニア値）。cap＝頭頂〜後頭部、saddle＝背中の色、spots＝マール模様
COATS = {
    "red": dict(fur=(0.90, 0.40, 0.12, 1), cream=(0.96, 0.90, 0.80, 1), ear=(1.0, 0.60, 0.50, 1), brow=(0.50, 0.16, 0.03, 1)),
    "sable": dict(fur=(0.80, 0.48, 0.20, 1), cream=(0.96, 0.90, 0.80, 1), ear=(1.0, 0.60, 0.50, 1), brow=(0.12, 0.05, 0.02, 1),
                  cap=(0.20, 0.08, 0.03, 1), saddle=(0.20, 0.08, 0.03, 1), ear_out=(0.20, 0.08, 0.03, 1)),
    "tri": dict(fur=(0.72, 0.30, 0.08, 1), cream=(0.97, 0.93, 0.86, 1), ear=(1.0, 0.62, 0.55, 1), brow=(0.72, 0.30, 0.08, 1),
                cap=(0.022, 0.018, 0.018, 1), saddle=(0.022, 0.018, 0.018, 1), ear_out=(0.022, 0.018, 0.018, 1)),
    "fawn": dict(fur=(0.96, 0.70, 0.40, 1), cream=(0.98, 0.94, 0.86, 1), ear=(1.0, 0.66, 0.58, 1), brow=(0.62, 0.32, 0.10, 1)),
    "merle": dict(fur=(0.42, 0.44, 0.50, 1), cream=(0.96, 0.95, 0.93, 1), ear=(1.0, 0.64, 0.62, 1), brow=(0.10, 0.10, 0.12, 1),
                  spots=(0.07, 0.07, 0.08, 1)),
}

CHARACTERS = {
    "tetsu": dict(coat="red", neck=("ribbon", (0.25, 0.50, 0.95, 1))),
    "moka": dict(coat="sable", neck=("ribbon", (1.0, 0.36, 0.55, 1))),
    "sumi": dict(coat="tri", neck=("tie", (0.80, 0.08, 0.06, 1))),
    "kinako": dict(coat="fawn", neck=("bandana", (0.0, 0.40, 0.34, 1))),
    "yuki": dict(coat="merle", neck=("ribbon", (0.20, 0.62, 0.40, 1)), glasses=True),
}

POSES = ["greet", "happy", "celebrate", "think", "cheer", "sleep", "safety", "oops"]
FRIEND_POSES = ["greet", "happy", "think", "cheer"]


def build(pose: str, extras: bool = True, who: str = "tetsu"):
    spec = CHARACTERS[who]
    coat = COATS[spec["coat"]]
    fur = mat(coat["fur"], rough=0.66, sheen=0.35)
    cream = mat(coat["cream"], rough=0.7, sheen=0.4)
    dark = mat(coat["cap"], rough=0.66, sheen=0.35) if "cap" in coat else None
    # 鼻はつやのあるプラスチック、口は刺しゅう糸
    ink = glossy(INK)
    stitch = thread((0.07, 0.035, 0.02, 1))
    lying = pose == "sleep"
    hop = 0.28 if pose == "celebrate" else 0.0
    root = empty("root", (0, 0, hop))

    # ───── からだ（ぬいぐるみらしい「おすわり」） ─────
    if not lying:
        ball((0, 0.06, 0.50), (0.50, 0.46, 0.50), fur, root)               # 胴
        if "saddle" in coat:
            ball((0, 0.20, 0.60), (0.47, 0.36, 0.42), mat(coat["saddle"], rough=0.66, sheen=0.35), root)
        ball((0, -0.28, 0.60), (0.30, 0.22, 0.30), cream, root)            # 胸のふわ毛
        for s in (-1, 1):
            ball((s * 0.36, 0.02, 0.24), (0.22, 0.30, 0.22), fur, root)    # もも
            ball((s * 0.40, -0.34, 0.11), (0.15, 0.18, 0.10), cream, root, rot=(0, 0, s * -15))  # 足
        ball((0, 0.52, 0.30), (0.16, 0.14, 0.14), fur, root)               # しっぽ
    else:
        ball((0, 0.30, 0.34), (0.52, 0.62, 0.34), fur, root)
        if "saddle" in coat:
            ball((0, 0.36, 0.42), (0.48, 0.52, 0.28), mat(coat["saddle"], rough=0.66, sheen=0.35), root)
        ball((0, -0.08, 0.30), (0.40, 0.30, 0.28), cream, root)
        for s in (-1, 1):
            ball((s * 0.36, 0.52, 0.18), (0.20, 0.26, 0.17), fur, root)
            capsule((s * 0.26, -0.20, 0.20), (s * 0.24, -0.66, 0.10), 0.115, fur, root)
            ball((s * 0.24, -0.74, 0.09), (0.14, 0.15, 0.085), cream, root)
        ball((0, 0.92, 0.40), (0.16, 0.14, 0.14), fur, root)
    if "spots" in coat:
        spot = mat(coat["spots"], rough=0.66, sheen=0.35)
        for loc, sc in (((0.30, 0.20, 0.78), 0.16), ((-0.34, 0.30, 0.55), 0.13), ((0.10, 0.42, 0.40), 0.12)):
            if not lying:
                ball(loc, (sc, sc * 0.9, sc * 0.8), spot, root)

    # ───── 前足（ポーズで変える） ─────
    def front_leg(s, end, paw_scale=(0.13, 0.13, 0.13)):
        shoulder = (s * 0.22, -0.24, 0.58)
        capsule(shoulder, end, 0.11, fur, root, r1=0.105)
        ball(end, paw_scale, cream, root)

    def resting_leg(s):
        capsule((s * 0.20, -0.26, 0.50), (s * 0.19, -0.36, 0.16), 0.11, fur, root)
        ball((s * 0.19, -0.40, 0.10), (0.13, 0.15, 0.08), cream, root)

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
    kind, color = spec["neck"]
    if not lying:
        nm = mat(color, rough=0.45, sheen=0.6)
        if kind == "ribbon":
            torus((0, -0.06, 0.84), 0.37, 0.05, nm, root, rot=(-12, 0, 0), scale=(1.0, 0.92, 1.0))
            for s in (-1, 1):
                ball((s * 0.15, -0.44, 0.78), (0.15, 0.06, 0.10), nm, root, rot=(0, s * -20, 0))
                ball((s * 0.08, -0.43, 0.66), (0.05, 0.04, 0.10), nm, root, rot=(0, s * 25, 0))
            ball((0, -0.46, 0.78), (0.06, 0.05, 0.06), nm, root)
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

    H((0, 0, 0), (0.70, 0.60, 0.58), fur)
    if dark is not None:
        H((0, 0.07, 0.11), (0.70, 0.55, 0.51), dark)                  # 頭頂〜後頭部の濃い毛色
    if "spots" in coat:
        spot = mat(coat["spots"], rough=0.66, sheen=0.35)
        H((-0.30, -0.26, 0.30), (0.20, 0.16, 0.14), spot)             # 左目の上のぶち（正面から見える）
        H((0.40, -0.10, 0.10), (0.14, 0.13, 0.12), spot)
        H((0.22, 0.20, 0.36), (0.16, 0.15, 0.14), spot)
    H((0, 0.02, -0.30), (0.50, 0.44, 0.24), fur)                      # 頬下のボリューム
    for s in (-1, 1):
        H((s * 0.30, -0.30, -0.21), (0.30, 0.27, 0.24), cream)       # ほっぺ
    H((0, -0.40, -0.19), (0.25, 0.23, 0.19), cream)                  # マズル
    H((0, -0.30, -0.33), (0.20, 0.18, 0.10), cream)                  # あご
    H((0, -0.515, 0.02), (0.085, 0.09, 0.27), cream, rot=(-14, 0, 0))  # 額の白いライン

    # 耳
    droop = {"oops": 26, "sleep": 30}.get(pose, 0)
    ear_in = mat(coat["ear"], rough=0.7, sheen=0.3)
    ear_out = mat(coat["ear_out"], rough=0.66, sheen=0.35) if "ear_out" in coat else (dark or fur)
    for s in (-1, 1):
        rot = (8 + droop * 0.2, s * (19 + droop), 0)
        base = (hc[0] + s * 0.38, hc[1] - 0.02, hc[2] + 0.50 - droop * 0.004)
        # マールは左耳だけ濃い色（ぶち）
        outer = mat(coat["spots"], rough=0.66, sheen=0.35) if "spots" in coat and s < 0 else ear_out
        cone(base, 0.32, 0.88, outer, head, rot=rot, scale=(1.0, 0.40, 1.0))
        cone((base[0], base[1] - 0.09, base[2] - 0.05), 0.215, 0.66, ear_in, head, rot=rot, scale=(1.0, 0.22, 1.0))

    # 目（プラスチックの目は毛に埋もれないよう少し前に出す）
    ex, ez = 0.27, hc[2] + 0.03
    ey = hc[1] - 0.535
    if pose in ("happy", "celebrate"):
        for s in (-1, 1):
            happy_eye(head, s * ex, ey - 0.03, ez, 0.105)
    elif lying:
        for s in (-1, 1):
            closed_eye(head, s * ex, ey - 0.03, ez - 0.03, 0.10)
    else:
        look = {"think": (0.025, 0.04), "oops": (-0.02, -0.01), "safety": (0.03, -0.01)}.get(pose, (0.0, 0.0))
        for s in (-1, 1):
            sparkle_eye(head, s * ex, ey, ez, 0.115, 0.145, look)
    brow = thread(coat["brow"])
    if spec["coat"] == "tri":
        # トライカラーの「まろ眉」（目の上の茶色い点）
        for s in (-1, 1):
            H((s * 0.24, -0.47, 0.25), (0.07, 0.03, 0.05), mat(coat["fur"], rough=0.66, sheen=0.35))
    if pose in ("cheer", "think", "safety"):
        for s in (-1, 1):
            lift = 0.21 if not (pose == "think" and s > 0) else 0.26
            line(arc(s * ex, ey - 0.02, ez + lift - 0.05, 0.075, 0.03, 30, 150, depth=0.02), brow, 0.019, head)
    if pose == "oops":
        for s in (-1, 1):
            line(arc(s * ex, ey - 0.02, ez + 0.16, 0.07, 0.03, 200 if s < 0 else 160, 340 if s < 0 else 20, depth=0.02),
                 brow, 0.017, head)
    if spec.get("glasses"):
        glasses(head, ex, ey - 0.08, ez, 0.16)

    # 鼻
    H((0, -0.645, -0.075), (0.085, 0.06, 0.062), ink)
    H((-0.025, -0.695, -0.055), (0.026, 0.012, 0.016), glow((1, 1, 1, 1), 1.2))

    # 口
    my = hc[1] - 0.665
    mz = hc[2] - 0.18
    if pose in ("happy", "celebrate", "cheer", "greet"):
        H((0, -0.625, -0.215), (0.105, 0.05, 0.085), mat(MOUTH, rough=0.5, sheen=0, fuzz=False))
        H((0, -0.655, -0.255), (0.07, 0.04, 0.05), mat(TONGUE, rough=0.4, sheen=0, fuzz=False))
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
        if who == "moka":
            _notes()
        elif who == "sumi":
            _chart()
        elif who == "kinako":
            _flag()
        elif who == "yuki":
            _book()
        else:
            stars([((0.95, -0.4, 1.74), 1.0), ((0.35, -0.4, 1.99), 0.6)])
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

