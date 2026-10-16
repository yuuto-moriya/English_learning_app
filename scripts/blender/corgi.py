"""
案内役コーギー「テツ」（2頭身のちびキャラ）をBlender(bpy)でプロシージャルにモデリングする。

レンダリングは scripts/blender/render.py から行う：
  python scripts/blender/render.py <出力dir> [--size 1024] [--samples 96] [--only tetsu-greet,tetsu-icon]
"""
from __future__ import annotations

import kit
from kit import (
    BLUSH, INK, MOUTH, TONGUE, WHITE, ball, bubbles, capsule, closed_eye, cone, confetti, empty, glossy, glow,
    happy_eye, helmet, hivis_vest, line, arc, mat, sparkle_eye, stars, sweat, torus, zzz,
)

FUR = (0.80, 0.27, 0.05, 1)       # コーギーのオレンジ
FUR_DEEP = (0.55, 0.15, 0.02, 1)
CREAM = WHITE
EAR_IN = (1.0, 0.58, 0.45, 1)
BANDANA = (0.0, 0.36, 0.31, 1)    # 保線カラーのバンダナ

POSES = ["greet", "happy", "celebrate", "think", "cheer", "sleep", "safety", "oops"]


def build(pose: str, extras: bool = True):
    fur = mat(FUR, rough=0.66, sheen=0.35)
    cream = mat(CREAM, rough=0.7, sheen=0.4)
    ink = glossy(INK)
    lying = pose == "sleep"
    hop = 0.28 if pose == "celebrate" else 0.0
    root = empty("root", (0, 0, hop))

    # ───── からだ ─────
    if not lying:
        ball((0, 0.06, 0.56), (0.50, 0.56, 0.46), fur, root)               # 胴
        ball((0, -0.30, 0.66), (0.30, 0.24, 0.30), cream, root)            # 胸のふわ毛
        ball((0, -0.06, 0.34), (0.28, 0.40, 0.18), cream, root)            # おなか
        for s in (-1, 1):
            ball((s * 0.33, 0.26, 0.30), (0.19, 0.26, 0.24), fur, root)    # もも
            ball((s * 0.35, 0.10, 0.08), (0.15, 0.19, 0.085), cream, root)  # うしろ足
        ball((0, 0.58, 0.64), (0.17, 0.15, 0.15), fur, root)               # しっぽ
    else:
        ball((0, 0.30, 0.34), (0.52, 0.62, 0.34), fur, root)
        ball((0, -0.08, 0.30), (0.40, 0.30, 0.28), cream, root)
        for s in (-1, 1):
            ball((s * 0.36, 0.52, 0.18), (0.20, 0.26, 0.17), fur, root)
            capsule((s * 0.26, -0.20, 0.20), (s * 0.24, -0.66, 0.10), 0.115, fur, root)
            ball((s * 0.24, -0.74, 0.09), (0.14, 0.15, 0.085), cream, root)
        ball((0, 0.92, 0.40), (0.16, 0.14, 0.14), fur, root)

    # ───── 前足（ポーズで変える） ─────
    def front_leg(s, end, paw_scale=(0.13, 0.13, 0.13)):
        shoulder = (s * 0.25, -0.24, 0.56)
        capsule(shoulder, end, 0.12, fur, root, r1=0.11)
        ball(end, paw_scale, cream, root)

    def standing_leg(s):
        capsule((s * 0.24, -0.24, 0.50), (s * 0.25, -0.30, 0.14), 0.12, fur, root)
        ball((s * 0.25, -0.35, 0.08), (0.14, 0.17, 0.085), cream, root)

    if not lying:
        if pose == "greet":
            standing_leg(-1)
            front_leg(1, (0.66, -0.42, 1.12))
        elif pose == "celebrate":
            front_leg(-1, (-0.70, -0.40, 1.22))
            front_leg(1, (0.70, -0.40, 1.22))
        elif pose == "cheer":
            standing_leg(-1)
            front_leg(1, (0.62, -0.36, 1.32), (0.15, 0.14, 0.15))
        elif pose == "think":
            standing_leg(-1)
            front_leg(1, (0.20, -0.82, 1.06))
        elif pose == "safety":
            standing_leg(-1)
            front_leg(1, (0.86, -0.52, 0.98))  # 指差確認
        elif pose == "oops":
            standing_leg(-1)
            front_leg(1, (0.66, -0.34, 1.60))  # 頭をかく
        else:
            standing_leg(-1)
            standing_leg(1)

    # ───── 首まわり ─────
    if pose == "safety":
        hivis_vest(root, 0.60, 0.53, 0.59, 0.42, -0.6)
    elif not lying:
        b = mat(BANDANA, rough=0.55, sheen=0.2)
        torus((0, -0.06, 0.90), 0.38, 0.075, b, root, rot=(-12, 0, 0), scale=(1.0, 0.92, 1.0))
        cone((0, -0.40, 0.76), 0.20, 0.30, b, root, rot=(196, 0, 0), scale=(1.0, 0.32, 1.0))

    # ───── 頭 ─────
    tilt = {"think": 12, "happy": -9, "oops": 7, "cheer": -5, "greet": -7, "celebrate": 4, "safety": 0, "sleep": -6}[pose]
    nod = {"sleep": 10, "oops": 4, "think": -6, "celebrate": -6}.get(pose, -2)
    pivot = (0, -0.42, 0.52) if lying else (0, -0.10, 0.96)
    head = empty("head", pivot, (nod, tilt, 0), root)
    hc = (0, -0.05, 0.50)

    def H(off, scale, m, **kw):
        return ball((hc[0] + off[0], hc[1] + off[1], hc[2] + off[2]), scale, m, head, **kw)

    H((0, 0, 0), (0.70, 0.60, 0.58), fur)
    H((0, 0.02, -0.30), (0.50, 0.44, 0.24), fur)                      # 頬下のボリューム
    for s in (-1, 1):
        H((s * 0.30, -0.30, -0.21), (0.30, 0.27, 0.24), cream)       # ほっぺ
    H((0, -0.40, -0.19), (0.25, 0.23, 0.19), cream)                  # マズル
    H((0, -0.30, -0.33), (0.20, 0.18, 0.10), cream)                  # あご
    H((0, -0.515, 0.02), (0.085, 0.09, 0.27), cream, rot=(-14, 0, 0))  # 額の白いライン

    # 耳
    droop = {"oops": 26, "sleep": 30, "safety": 34}.get(pose, 0)
    ear_in = mat(EAR_IN, rough=0.7, sheen=0.3)
    for s in (-1, 1):
        rot = (8 + droop * 0.2, s * (19 + droop), 0)
        base = (hc[0] + s * 0.38, hc[1] - 0.02, hc[2] + 0.50 - droop * 0.004)
        cone(base, 0.32, 0.88, fur, head, rot=rot, scale=(1.0, 0.40, 1.0))
        cone((base[0], base[1] - 0.09, base[2] - 0.05), 0.215, 0.66, ear_in, head, rot=rot, scale=(1.0, 0.22, 1.0))

    # 目
    ex, ez = 0.27, hc[2] + 0.03
    ey = hc[1] - 0.50
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
    if pose in ("cheer", "think", "safety"):
        for s in (-1, 1):
            lift = 0.21 if not (pose == "think" and s > 0) else 0.26
            line(arc(s * ex, ey - 0.02, ez + lift - 0.05, 0.075, 0.03, 30, 150, depth=0.02), mat(FUR_DEEP, rough=0.6), 0.019, head)
    if pose == "oops":
        for s in (-1, 1):
            line(arc(s * ex, ey - 0.02, ez + 0.16, 0.07, 0.03, 200 if s < 0 else 160, 340 if s < 0 else 20, depth=0.02),
                 mat(FUR_DEEP, rough=0.6), 0.017, head)

    # 鼻
    H((0, -0.625, -0.075), (0.085, 0.06, 0.062), ink)
    H((-0.025, -0.675, -0.055), (0.026, 0.012, 0.016), glow((1, 1, 1, 1), 1.2))

    # 口
    my = hc[1] - 0.64
    mz = hc[2] - 0.18
    if pose in ("happy", "celebrate", "cheer", "greet"):
        H((0, -0.605, -0.215), (0.105, 0.05, 0.085), mat(MOUTH, rough=0.5, sheen=0))
        H((0, -0.635, -0.255), (0.07, 0.04, 0.05), mat(TONGUE, rough=0.4, sheen=0))
        for s in (-1, 1):
            line(arc(s * 0.05, my + 0.01, mz + 0.035, 0.05, 0.035, 180, 360, depth=0.01), ink, 0.014, head)
    elif pose == "oops":
        line([(-0.08, my + 0.01, mz - 0.01), (-0.03, my - 0.005, mz + 0.02), (0.02, my - 0.005, mz - 0.01), (0.08, my + 0.01, mz + 0.02)], ink, 0.014, head)
    else:
        for s in (-1, 1):
            line(arc(s * 0.05, my + 0.01, mz + 0.035, 0.05, 0.04, 180, 360, depth=0.01), ink, 0.014, head)

    # ほっぺの赤み
    for s in (-1, 1):
        H((s * 0.43, -0.42, -0.10), (0.085, 0.03, 0.05), glow(BLUSH, 0.25), rot=(0, 0, s * -28))

    # ───── 小物・演出 ─────
    if pose == "safety":
        helmet(head, hc[2] + 0.16, 0.72, 0.64, 0.56, emblem_y=hc[1] - 0.66)
    if not extras:
        return root
    if pose == "celebrate":
        confetti((0, -0.3, 1.0))
    if pose == "happy":
        stars([((-0.95, -0.4, 1.85), 1.0), ((0.98, -0.4, 1.60), 0.75), ((-1.05, -0.4, 1.25), 0.55)])
    if pose == "cheer":
        stars([((0.95, -0.4, 1.80), 1.0), ((0.35, -0.4, 2.05), 0.6)])
    if pose == "sleep":
        zzz([((0.70, -0.7, 1.25), 0.075), ((0.95, -0.7, 1.50), 0.10), ((1.25, -0.7, 1.82), 0.13)], mat(BANDANA, rough=0.5, sheen=0))
    if pose == "oops":
        sweat((-0.62, -0.75, 1.92), 1.2)
    if pose == "think":
        bubbles([((0.72, -0.7, 2.05), 0.06), ((0.92, -0.7, 2.22), 0.085), ((1.18, -0.7, 2.45), 0.12)])
    return root


