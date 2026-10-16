"""
テツのなかまたち（Blender / bpy でプロシージャルにモデリング）。

- ピコ（セキセイインコ）  … リスニング・スピーキングのコーチ。ヘッドセットつき
- ペンタ（ペンギン）      … ビジネス英語の先輩。メガネとネクタイ
- ボルト（ビーバー）      … 保線のベテラン。ヘルメットと安全ベスト
- ホー先生（フクロウ）    … 学習法の研究者。角帽（モルタルボード）
"""
from __future__ import annotations

import math

from kit import (
    BLUSH, BRAND, INK, MOUTH, TONGUE, WHITE, ball, box, bubbles, capsule, cone, empty, glossy, glow, happy_eye,
    helmet, hivis_vest, line, arc, mat, necktie, sparkle_eye, stars, torus,
)

POSES = ["greet", "happy", "think", "cheer"]


def _note(x, y, z, s, m):
    """音符（♪）"""
    ball((x, y, z), (0.09 * s, 0.05 * s, 0.07 * s), m, rot=(0, -25, 0))
    capsule((x + 0.08 * s, y, z + 0.02 * s), (x + 0.08 * s, y, z + 0.34 * s), 0.018 * s, m)
    capsule((x + 0.08 * s, y, z + 0.34 * s), (x + 0.20 * s, y, z + 0.22 * s), 0.022 * s, m)


def _mouth_smile(parent, y, z, w=0.07, m=None):
    line(arc(0, y, z + 0.02, w, w * 0.6, 200, 340, depth=0.01), m or glossy(INK), 0.015, parent)


def _open_mouth(parent, y, z, w=0.09):
    ball((0, y, z), (w, 0.045, w * 0.75), mat(MOUTH, rough=0.5, sheen=0), parent)
    ball((0, y - 0.025, z - w * 0.35), (w * 0.65, 0.035, w * 0.42), mat(TONGUE, rough=0.4, sheen=0), parent)


# ───────────────────────── ピコ（セキセイインコ） ─────────────────────────
def build_pico(pose: str, extras: bool = True):
    green = mat((0.20, 0.62, 0.04, 1), rough=0.6, sheen=0.35)
    green_d = mat((0.06, 0.32, 0.03, 1), rough=0.6, sheen=0.3)
    yellow = mat((1.0, 0.80, 0.08, 1), rough=0.62, sheen=0.35)
    blue = mat((0.06, 0.18, 0.80, 1), rough=0.5, sheen=0.2)
    beak = mat((1.0, 0.62, 0.22, 1), rough=0.35, sheen=0, coat=0.5)
    cere = mat((0.22, 0.42, 0.95, 1), rough=0.4, sheen=0)
    feet = mat((0.95, 0.55, 0.55, 1), rough=0.6, sheen=0.1)
    gray = mat((0.10, 0.11, 0.13, 1), rough=0.4, sheen=0, coat=0.4)
    root = empty("pico", (0, 0, 0.06 if pose == "happy" else 0))

    ball((0, 0.05, 0.72), (0.56, 0.52, 0.62), green, root)               # からだ
    ball((0, -0.24, 0.62), (0.40, 0.30, 0.44), mat((0.40, 0.78, 0.10, 1), rough=0.6, sheen=0.35), root)  # 胸（明るい緑）
    # しっぽ
    capsule((0, 0.40, 0.42), (0.02, 0.86, 0.06), 0.09, blue, root, r1=0.05)
    capsule((0.10, 0.40, 0.44), (0.18, 0.80, 0.10), 0.07, blue, root, r1=0.04)
    for s in (-1, 1):
        ball((s * 0.16, -0.14, 0.10), (0.11, 0.14, 0.06), feet, root)    # 足

    # つばさ
    def wing(s, up=False, front=False):
        if up:
            ball((s * 0.66, -0.12, 1.15), (0.13, 0.22, 0.36), green, root, rot=(10, s * -40, 0))
            ball((s * 0.80, -0.10, 1.42), (0.09, 0.15, 0.16), green_d, root, rot=(10, s * -40, 0))
        elif front:
            ball((s * 0.30, -0.56, 1.02), (0.13, 0.30, 0.18), green, root, rot=(-30, 0, s * 30))
        else:
            ball((s * 0.52, 0.06, 0.70), (0.14, 0.34, 0.42), green, root, rot=(10, s * 12, 0))
            ball((s * 0.55, 0.20, 0.42), (0.10, 0.22, 0.18), green_d, root, rot=(10, s * 12, 0))

    if pose == "greet":
        wing(-1)
        wing(1, up=True)
    elif pose == "happy":
        wing(-1, up=True)
        wing(1, up=True)
    elif pose == "think":
        wing(-1)
        wing(1, front=True)
    else:
        wing(-1)
        wing(1, up=True)

    # 頭
    tilt = {"think": 12, "happy": -8, "greet": -6, "cheer": 6}[pose]
    head = empty("head", (0, -0.05, 1.05), (-4, tilt, 0), root)
    hc = (0, -0.02, 0.40)

    def H(off, sc, m, **kw):
        return ball((hc[0] + off[0], hc[1] + off[1], hc[2] + off[2]), sc, m, head, **kw)

    H((0, 0, 0), (0.56, 0.52, 0.52), yellow)
    H((0, 0.18, 0.10), (0.50, 0.40, 0.44), green)                        # 後頭部（緑）
    H((0, -0.08, 0.36), (0.30, 0.30, 0.14), mat((0.95, 0.72, 0.06, 1), rough=0.6, sheen=0.3))
    for s in (-1, 1):
        H((s * 0.40, -0.30, -0.24), (0.055, 0.025, 0.055), blue)        # ほっぺの青い斑
    ex, ez, ey = 0.24, hc[2] + 0.06, hc[1] - 0.42
    if pose == "happy":
        for s in (-1, 1):
            happy_eye(head, s * ex, ey - 0.02, ez, 0.09)
    else:
        look = (0.02, 0.04) if pose == "think" else (0, 0)
        for s in (-1, 1):
            sparkle_eye(head, s * ex, ey, ez, 0.10, 0.125, look)
    for s in (-1, 1):
        H((s * 0.38, -0.36, -0.06), (0.075, 0.025, 0.045), glow(BLUSH, 0.25), rot=(0, 0, s * -25))
    # くちばし
    H((0, -0.50, 0.06), (0.10, 0.06, 0.05), cere)
    cone((hc[0], hc[1] - 0.54, hc[2] - 0.08), 0.10, 0.22, beak, head, rot=(165, 0, 0), scale=(1.0, 0.8, 1.0), tip=0.02)
    if pose in ("greet", "cheer", "happy"):
        H((0, -0.52, -0.20), (0.07, 0.04, 0.04), mat(MOUTH, rough=0.5, sheen=0))

    # ヘッドセット
    line(arc(hc[0], hc[1] + 0.06, hc[2] - 0.02, 0.585, 0.56, 0, 180, n=16), gray, 0.035, head)
    for s in (-1, 1):
        ball((s * 0.56, hc[1] + 0.02, hc[2] - 0.02), (0.07, 0.15, 0.17), gray, head)
        ball((s * 0.60, hc[1] + 0.02, hc[2] - 0.02), (0.04, 0.11, 0.13), mat(BRAND, rough=0.5, sheen=0), head)
    capsule((0.58, hc[1] - 0.05, hc[2] - 0.10), (0.30, hc[1] - 0.52, hc[2] - 0.30), 0.022, gray, head)
    ball((0.26, hc[1] - 0.56, hc[2] - 0.31), 0.055, mat(BRAND, rough=0.5, sheen=0), head)

    if extras:
        note = mat((0.06, 0.18, 0.80, 1), rough=0.4, sheen=0, emission=0.15)
        if pose == "cheer":
            _note(-0.95, -0.4, 1.55, 1.0, note)
            _note(0.85, -0.4, 1.85, 0.8, mat(BRAND, rough=0.4, sheen=0, emission=0.15))
        if pose == "happy":
            stars([((-0.95, -0.4, 1.95), 0.9), ((1.0, -0.4, 1.70), 0.7)])
        if pose == "think":
            bubbles([((0.70, -0.7, 2.00), 0.06), ((0.90, -0.7, 2.18), 0.085), ((1.15, -0.7, 2.40), 0.12)])
    return root


# ───────────────────────── ペンタ（ペンギン） ─────────────────────────
def build_penta(pose: str, extras: bool = True):
    navy = mat((0.025, 0.045, 0.10, 1), rough=0.5, sheen=0.3)
    belly = mat(WHITE, rough=0.65, sheen=0.3)
    orange = mat((1.0, 0.45, 0.04, 1), rough=0.45, sheen=0.1, coat=0.3)
    metal = mat((0.08, 0.08, 0.10, 1), rough=0.25, sheen=0, metallic=0.6)
    root = empty("penta", (0, 0, 0.05 if pose == "happy" else 0))

    ball((0, 0.05, 0.85), (0.62, 0.56, 0.86), navy, root)                # からだ（頭と一体）
    ball((0, -0.20, 0.66), (0.48, 0.38, 0.60), belly, root)              # おなか
    # 顔の白（ハート形）
    for s in (-1, 1):
        ball((s * 0.20, -0.32, 1.30), (0.26, 0.22, 0.26), belly, root)
    ball((0, -0.30, 1.12), (0.30, 0.24, 0.20), belly, root)
    for s in (-1, 1):
        ball((s * 0.22, -0.20, 0.06), (0.16, 0.22, 0.07), orange, root)  # 足

    def flipper(s, up=False, chin=False):
        if up:
            ball((s * 0.68, -0.05, 1.20), (0.10, 0.18, 0.40), navy, root, rot=(0, s * -48, 0))
        elif chin:
            ball((s * 0.36, -0.46, 1.00), (0.10, 0.18, 0.34), navy, root, rot=(-20, s * -35, s * 20))
        else:
            ball((s * 0.62, 0.02, 0.72), (0.10, 0.20, 0.42), navy, root, rot=(0, s * 18, 0))

    if pose == "greet":
        flipper(-1)
        flipper(1, up=True)
    elif pose == "happy":
        flipper(-1, up=True)
        flipper(1, up=True)
    elif pose == "think":
        flipper(-1)
        flipper(1, chin=True)
    else:
        flipper(-1)
        flipper(1, up=True)

    tilt = {"think": 10, "happy": -7, "greet": -5, "cheer": 4}[pose]
    face = empty("face", (0, 0, 1.0), (0, tilt, 0), root)
    ey, ez, ex = -0.50, 0.32, 0.20
    if pose == "happy":
        for s in (-1, 1):
            happy_eye(face, s * ex, ey - 0.03, ez, 0.085)
    else:
        look = (0.02, 0.03) if pose == "think" else (0, 0)
        for s in (-1, 1):
            sparkle_eye(face, s * ex, ey, ez, 0.095, 0.12, look)
    # メガネ
    for s in (-1, 1):
        torus((s * ex, ey - 0.08, ez), 0.135, 0.016, metal, face, rot=(90, 0, 0))
    capsule((-0.07, ey - 0.09, ez + 0.03), (0.07, ey - 0.09, ez + 0.03), 0.013, metal, face)
    # くちばし
    cone((0, ey - 0.06, ez - 0.16), 0.09, 0.20, orange, face, rot=(100, 0, 0), scale=(1.0, 0.7, 1.0), tip=0.015)
    if pose in ("greet", "cheer", "happy"):
        ball((0, ey - 0.03, ez - 0.27), (0.06, 0.03, 0.035), mat(MOUTH, rough=0.5, sheen=0), face)
    for s in (-1, 1):
        ball((s * 0.34, ey + 0.02, ez - 0.14), (0.07, 0.025, 0.04), glow(BLUSH, 0.25), face, rot=(0, 0, s * -25))
    # ネクタイ（えり元から）
    necktie(root, (0, -0.56, 0.98), 0.46, 0.15, (0.85, 0.20, 0.04, 1))

    if extras:
        if pose == "happy":
            stars([((-1.0, -0.4, 1.85), 0.9), ((1.0, -0.4, 1.70), 0.7)])
        if pose == "think":
            bubbles([((0.70, -0.7, 2.05), 0.06), ((0.90, -0.7, 2.22), 0.085), ((1.15, -0.7, 2.44), 0.12)])
        if pose == "cheer":
            # グラフのボード（右肩上がり）
            board = mat((0.97, 0.97, 0.98, 1), rough=0.5, sheen=0)
            box((-0.95, -0.45, 1.05), (0.62, 0.04, 0.48), board, rot=(0, 8, 0), bevel=0.15)
            g = mat((0.10, 0.62, 0.30, 1), rough=0.4, sheen=0, emission=0.1)
            pts = [(-1.20, -0.49, 0.88), (-1.02, -0.49, 0.98), (-0.88, -0.49, 0.95), (-0.70, -0.49, 1.18)]
            line(pts, g, 0.025, poly=True)
            cone((-0.68, -0.49, 1.22), 0.06, 0.12, g, rot=(0, 40, 0), sub=0)
    return root


# ───────────────────────── ボルト（ビーバー） ─────────────────────────
def build_bolt(pose: str, extras: bool = True):
    brown = mat((0.30, 0.11, 0.035, 1), rough=0.66, sheen=0.4)
    tan = mat((0.80, 0.55, 0.32, 1), rough=0.7, sheen=0.35)
    tail_m = mat((0.10, 0.045, 0.02, 1), rough=0.55, sheen=0.1)
    teeth = mat((0.98, 0.96, 0.90, 1), rough=0.3, sheen=0, coat=0.6)
    nose = glossy(INK)
    root = empty("bolt", (0, 0, 0))

    ball((0, 0.05, 0.60), (0.56, 0.52, 0.54), brown, root)
    hivis_vest(root, 0.62, 0.58, 0.55, 0.42, -0.6)
    ball((0, -0.12, 0.30), (0.40, 0.38, 0.22), tan, root)                 # おなか
    ball((0, 0.70, 0.12), (0.34, 0.50, 0.07), tail_m, root, rot=(-8, 0, 0))  # 平たいしっぽ
    for s in (-1, 1):
        ball((s * 0.30, -0.22, 0.07), (0.16, 0.20, 0.08), brown, root)

    def arm(s, end):
        capsule((s * 0.46, -0.10, 0.80), end, 0.12, brown, root, r1=0.11)
        ball(end, 0.12, brown, root)

    if pose == "greet":
        arm(-1, (-0.52, -0.30, 0.40))
        arm(1, (0.80, -0.40, 1.25))
    elif pose == "happy":
        arm(-1, (-0.78, -0.35, 1.25))
        arm(1, (0.78, -0.35, 1.25))
    elif pose == "think":
        arm(-1, (-0.52, -0.30, 0.40))
        arm(1, (0.22, -0.78, 1.10))
    else:  # cheer: スパナを持って「よし！」
        arm(-1, (-0.52, -0.30, 0.40))
        arm(1, (0.80, -0.40, 1.18))

    tilt = {"think": 12, "happy": -8, "greet": -6, "cheer": 5}[pose]
    head = empty("head", (0, -0.08, 0.98), (-3, tilt, 0), root)
    hc = (0, -0.02, 0.42)

    def H(off, sc, m, **kw):
        return ball((hc[0] + off[0], hc[1] + off[1], hc[2] + off[2]), sc, m, head, **kw)

    H((0, 0, 0), (0.60, 0.54, 0.52), brown)
    for s in (-1, 1):
        H((s * 0.24, -0.38, -0.16), (0.24, 0.20, 0.20), tan)              # 口まわり
        H((s * 0.46, 0.06, 0.32), (0.13, 0.09, 0.13), brown)              # 耳
        H((s * 0.46, -0.0, 0.32), (0.08, 0.05, 0.08), tail_m)
    H((0, -0.52, -0.02), (0.11, 0.07, 0.075), nose)
    H((-0.03, -0.58, 0.0), (0.03, 0.012, 0.018), glow((1, 1, 1, 1), 1.2))
    # 前歯
    for s in (-1, 1):
        box((s * 0.045, hc[1] - 0.55, hc[2] - 0.30), (0.08, 0.04, 0.12), teeth, head, bevel=0.35)
    ex, ez, ey = 0.25, hc[2] - 0.02, hc[1] - 0.46
    if pose == "happy":
        for s in (-1, 1):
            happy_eye(head, s * ex, ey - 0.02, ez, 0.095)
    else:
        look = (0.02, 0.04) if pose == "think" else (0, 0)
        for s in (-1, 1):
            sparkle_eye(head, s * ex, ey, ez, 0.105, 0.13, look)
    for s in (-1, 1):
        H((s * 0.42, -0.38, -0.10), (0.075, 0.025, 0.045), glow(BLUSH, 0.3), rot=(0, 0, s * -25))
    helmet(head, hc[2] + 0.20, 0.64, 0.58, 0.46, color=(0.95, 0.95, 0.93, 1), emblem_y=hc[1] - 0.6)

    if extras:
        steel = mat((0.55, 0.57, 0.60, 1), rough=0.25, sheen=0, metallic=0.9)
        if pose == "cheer":
            # 片口スパナ
            capsule((0.80, -0.42, 1.05), (0.80, -0.42, 1.74), 0.045, steel)
            box((0.80, -0.42, 1.80), (0.26, 0.06, 0.10), steel, bevel=0.3)
            box((0.70, -0.42, 1.90), (0.07, 0.06, 0.16), steel, bevel=0.3)
            box((0.90, -0.42, 1.90), (0.07, 0.06, 0.16), steel, bevel=0.3)
            stars([((1.15, -0.4, 1.95), 0.8)])
        if pose == "happy":
            stars([((-1.05, -0.4, 1.95), 0.9), ((1.05, -0.4, 1.75), 0.7)])
        if pose == "think":
            bubbles([((0.70, -0.7, 2.05), 0.06), ((0.90, -0.7, 2.22), 0.085), ((1.15, -0.7, 2.44), 0.12)])
    return root


# ───────────────────────── ホー先生（フクロウ） ─────────────────────────
def build_hoo(pose: str, extras: bool = True):
    body = mat((0.30, 0.17, 0.08, 1), rough=0.66, sheen=0.35)
    light_ = mat((0.86, 0.72, 0.52, 1), rough=0.7, sheen=0.35)
    disc = mat((0.95, 0.86, 0.70, 1), rough=0.7, sheen=0.3)
    beak = mat((0.95, 0.62, 0.15, 1), rough=0.35, sheen=0, coat=0.5)
    iris = mat((1.0, 0.70, 0.05, 1), rough=0.3, sheen=0, coat=0.6)
    cap = mat((0.03, 0.04, 0.08, 1), rough=0.5, sheen=0.1)
    gold = mat((1.0, 0.70, 0.12, 1), rough=0.35, sheen=0, metallic=0.5)
    root = empty("hoo", (0, 0, 0.05 if pose == "happy" else 0))

    ball((0, 0.05, 0.92), (0.72, 0.62, 0.90), body, root)
    ball((0, -0.24, 0.66), (0.50, 0.40, 0.56), light_, root)
    # 胸の羽模様（小さな弧）
    for i, (dx, dz) in enumerate([(-0.18, 0.80), (0.0, 0.84), (0.18, 0.80), (-0.10, 0.62), (0.10, 0.62), (0.0, 0.44)]):
        line(arc(dx, -0.62 + abs(dx) * 0.25, dz, 0.06, 0.035, 200, 340, depth=0.01), mat((0.45, 0.28, 0.12, 1), rough=0.6), 0.014)
    for s in (-1, 1):
        ball((s * 0.22, -0.26, 0.07), (0.14, 0.16, 0.07), beak, root)

    def wing(s, up=False, chin=False):
        if up:
            ball((s * 0.80, -0.05, 1.20), (0.14, 0.24, 0.42), body, root, rot=(0, s * -45, 0))
        elif chin:
            ball((s * 0.38, -0.52, 0.98), (0.12, 0.22, 0.34), body, root, rot=(-20, s * -40, s * 20))
        else:
            ball((s * 0.70, 0.04, 0.80), (0.13, 0.26, 0.48), body, root, rot=(0, s * 16, 0))

    if pose == "greet":
        wing(-1)
        wing(1, up=True)
    elif pose == "happy":
        wing(-1, up=True)
        wing(1, up=True)
    elif pose == "think":
        wing(-1)
        wing(1, chin=True)
    else:
        wing(-1)
        wing(1, up=True)

    tilt = {"think": 12, "happy": -7, "greet": -5, "cheer": 4}[pose]
    face = empty("face", (0, 0, 1.30), (0, tilt, 0), root)
    # 顔盤（ハート形）
    for s in (-1, 1):
        ball((s * 0.24, -0.46, 0.10), (0.27, 0.16, 0.25), disc, face)
    ball((0, -0.44, -0.08), (0.22, 0.15, 0.16), disc, face)
    ex, ey, ez = 0.24, -0.60, 0.10
    if pose == "happy":
        for s in (-1, 1):
            happy_eye(face, s * ex, ey - 0.02, ez, 0.10)
    else:
        look = (0.02, 0.03) if pose == "think" else (0, 0)
        for s in (-1, 1):
            ball((s * ex, ey + 0.02, ez), (0.15, 0.06, 0.15), iris, face)
            sparkle_eye(face, s * ex, ey - 0.02, ez, 0.095, 0.105, look)
    cone((0, ey - 0.04, ez - 0.15), 0.07, 0.17, beak, face, rot=(160, 0, 0), scale=(1.0, 0.6, 1.0), tip=0.012)
    for s in (-1, 1):
        ball((s * 0.42, ey + 0.06, ez - 0.16), (0.065, 0.025, 0.04), glow(BLUSH, 0.25), face, rot=(0, 0, s * -25))
        # 羽角（耳のような飾り羽）
        cone((s * 0.46, -0.05, 0.60), 0.15, 0.36, body, face, rot=(0, s * 28, 0), scale=(1.0, 0.5, 1.0))
        # まゆ
        line(arc(s * ex, ey - 0.01, ez + 0.20, 0.09, 0.03, 30, 150, depth=0.02), mat((0.20, 0.10, 0.04, 1), rough=0.6), 0.02, face)

    # 角帽
    box((0, 0.02, 0.78), (0.46, 0.40, 0.18), cap, face, bevel=0.25)
    box((0, 0.02, 0.90), (0.95, 0.95, 0.05), cap, face, rot=(0, 0, 18), bevel=0.2)
    ball((0, 0.02, 0.94), 0.045, gold, face)
    capsule((0.0, 0.02, 0.94), (0.40, -0.25, 0.90), 0.016, gold, face)
    capsule((0.40, -0.25, 0.90), (0.42, -0.27, 0.62), 0.016, gold, face)
    ball((0.42, -0.27, 0.58), (0.04, 0.04, 0.07), gold, face)

    if extras:
        if pose == "cheer":
            # 本
            cov = mat((0.05, 0.30, 0.55, 1), rough=0.5, sheen=0)
            pages = mat((0.97, 0.95, 0.90, 1), rough=0.6, sheen=0)
            box((-0.92, -0.42, 1.05), (0.06, 0.40, 0.52), cov, rot=(0, 0, 70), bevel=0.2)
            box((-0.90, -0.40, 1.05), (0.05, 0.36, 0.48), pages, rot=(0, 0, 70), bevel=0.1)
            stars([((1.05, -0.4, 2.0), 0.8)])
        if pose == "happy":
            stars([((-1.1, -0.4, 2.0), 0.9), ((1.1, -0.4, 1.8), 0.7)])
        if pose == "think":
            bubbles([((0.82, -0.7, 2.10), 0.06), ((1.02, -0.7, 2.28), 0.085), ((1.27, -0.7, 2.50), 0.12)])
    return root


CHARACTERS = {
    "pico": (build_pico, POSES),
    "penta": (build_penta, POSES),
    "bolt": (build_bolt, POSES),
    "hoo": (build_hoo, POSES),
}
