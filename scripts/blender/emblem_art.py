"""
オープニングのエンブレム（ヴィンテージの真鍮・エナメル看板の組み方）の図案を描く。

  python scripts/blender/emblem_art.py <出力dir> --font Jost-600.ttf [--size 2048]

出力:
  <出力dir>/emblem-mask.png     エナメル（緑青色）の部分＝白、金属（銅）の部分＝黒。logo.py が質感の切り替えに使う
  <出力dir>/emblem-preview.png  平面の見本（銅色と緑青色のベタ塗り）

図案（1000 × 1000 の座標で設計）:
  外周の帯：上に「ELIZA PATINA」、下に「ENGLISH ATELIER」（字は内向き）、左右にスピード線を3本ずつ
  内側：緑青のエナメルの円に、銅の二重線。中央に 1930 年代のリボンマイクを一筆の線で（イライザが
        ヒギンズ教授の蓄音機で発音を録られ、話し方で変わっていく物語から）。上下に「ESTD」「2026」と罫線
フォントは幾何学的なサンセリフ（Jost, SIL OFL 1.1。npm の @fontsource/jost の woff2 を TTF にして使う）。
"""
from __future__ import annotations

import math
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ARGS = sys.argv[1:]
OUT = Path(ARGS[0] if ARGS and not ARGS[0].startswith("--") else "emblem_out")
FONT = ARGS[ARGS.index("--font") + 1] if "--font" in ARGS else "Jost-600.ttf"
SIZE = int(ARGS[ARGS.index("--size") + 1]) if "--size" in ARGS else 2048
SS = 2  # 縁をなめらかにするため、2倍で描いてから縮める
W = SIZE * SS
K = W / 1000  # 設計の座標（1000）→ 画素

TOP_TEXT = "ELIZA PATINA"
BOTTOM_TEXT = "ENGLISH ATELIER"
BAND_R = 420  # 外周の文字の中心の半径
FIELD_R = 336  # 緑青のエナメルの円


def p(v: float) -> float:
    return v * K


def font(size: float) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(FONT, int(p(size)))


def glyph(ch: str, f: ImageFont.FreeTypeFont) -> Image.Image:
    """1文字を透過画像に（中心が文字の見た目の中心になるよう、字面の箱で切り出す）"""
    box = f.getbbox(ch)
    w, h = box[2] - box[0], box[3] - box[1]
    im = Image.new("L", (w + 8, h + 8), 0)
    ImageDraw.Draw(im).text((4 - box[0], 4 - box[1]), ch, font=f, fill=255)
    return im


def arc_text(layer: Image.Image, text: str, size: float, tracking: float, top: bool, space_deg: float | None = None) -> float:
    """
    円に沿って文字を並べる。上は外向き（左→右は時計回り）、下は内向き（左→右は反時計回り）。
    space_deg を渡すと、語の間を決まった角度だけ空ける（間にスピード線を入れるため）。戻り値は全体の角度（度）
    """
    f = font(size)
    r = p(BAND_R)
    widths = [(r * math.radians(space_deg) if (ch == " " and space_deg) else f.getlength(ch) + p(tracking)) for ch in text]
    widths[-1] -= p(tracking)
    total = sum(widths) / r  # 全体の角度（ラジアン）
    c = W / 2
    # 語の間を空けるときは、その間（スピード線の場所）がちょうど真上・真下に来るようにそろえる
    if space_deg and " " in text:
        i = text.index(" ")
        before = (sum(widths[:i]) + widths[i] / 2) / r
        start = -math.pi / 2 - before if top else math.pi / 2 + before
    else:
        start = -math.pi / 2 - total / 2 if top else math.pi / 2 + total / 2
    acc = 0.0
    for ch, w in zip(text, widths):
        mid = (acc + (w - p(tracking)) / 2) / r if ch != " " else (acc + w / 2) / r
        acc += w
        if ch == " ":
            continue
        a = start + mid if top else start - mid
        g = glyph(ch, f)
        # 上の文字は頭が外、下の文字は頭が内（円の中心）を向く
        deg = math.degrees(a + math.pi / 2) if top else math.degrees(a - math.pi / 2)
        g = g.rotate(-deg, resample=Image.BICUBIC, expand=True)
        x, y = c + r * math.cos(a), c + r * math.sin(a)
        layer.paste(255, (int(x - g.width / 2), int(y - g.height / 2)), g)
    return math.degrees(total)


def arc_line(d: ImageDraw.ImageDraw, radius: float, center_deg: float, half_deg: float, width: float, fill: int):
    """円弧の線（両端を丸く）"""
    c = W / 2
    r = p(radius)
    d.arc([c - r, c - r, c + r, c + r], center_deg - half_deg, center_deg + half_deg, fill=fill, width=int(p(width)))
    for a in (center_deg - half_deg, center_deg + half_deg):
        x, y = c + r * math.cos(math.radians(a)), c + r * math.sin(math.radians(a))
        rr = p(width) / 2
        d.ellipse([x - rr, y - rr, x + rr, y + rr], fill=fill)


def line(d, x1, y1, x2, y2, width, fill):
    d.line([p(x1), p(y1), p(x2), p(y2)], fill=fill, width=int(p(width)))
    for x, y in ((x1, y1), (x2, y2)):
        rr = p(width) / 2
        d.ellipse([p(x) - rr, p(y) - rr, p(x) + rr, p(y) + rr], fill=fill)


def ring(d, radius, width, fill):
    c = W / 2
    r = p(radius)
    d.ellipse([c - r, c - r, c + r, c + r], outline=fill, width=int(p(width)))


def text_center(d, s: str, cx: float, cy: float, size: float, tracking: float, fill: int):
    f = font(size)
    widths = [f.getlength(ch) for ch in s]
    total = sum(widths) + p(tracking) * (len(s) - 1)
    x = p(cx) - total / 2
    for ch, w in zip(s, widths):
        box = f.getbbox(ch)
        d.text((x, p(cy) - (box[1] + box[3]) / 2), ch, font=f, fill=fill)
        x += w + p(tracking)


def microphone(d: ImageDraw.ImageDraw, fill: int, stroke: float = 9):
    """1930 年代のリボンマイク（丸みのあるカプセル・横の格子・U字の支え・脚）を一筆の太さの線で"""
    sw = int(p(stroke))
    # カプセル
    d.rounded_rectangle([p(449), p(386), p(551), p(556)], radius=p(51), outline=fill, width=sw)
    # 格子
    for y in (440, 471, 502):
        line(d, 466, y, 534, y, 5.5, fill)
    # U 字の支え（左右の軸の点から下へ回り込む）
    c = (500, 470)
    r = 76
    d.arc([p(c[0] - r), p(c[1] - r), p(c[0] + r), p(c[1] + r)], 0, 180, fill=fill, width=sw)
    for x in (c[0] - r, c[0] + r):
        rr = p(11)
        d.ellipse([p(x) - rr, p(c[1]) - rr, p(x) + rr, p(c[1]) + rr], fill=fill)
    # 脚と台
    line(d, 500, 546, 500, 598, stroke, fill)
    line(d, 462, 604, 538, 604, stroke, fill)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    mask = Image.new("L", (W, W), 0)  # 0 = 金属
    d = ImageDraw.Draw(mask)
    c = W / 2

    # 外周の文字とスピード線（エナメル）。上の語の両端から後ろへ流れる3本、下の2語の間に3本
    span = arc_text(mask, TOP_TEXT, 90, 13, top=True)
    arc_text(mask, BOTTOM_TEXT, 90, 15, top=False, space_deg=17)
    gap = 3.5
    for k, (rad, length) in enumerate(((448, 21), (421, 15), (394, 10))):
        left_end = -90 - span / 2 - gap
        right_end = -90 + span / 2 + gap
        arc_line(d, rad, left_end - length / 2, length / 2, 8, 255)
        arc_line(d, rad, right_end + length / 2, length / 2, 8, 255)
    for rad in (404, 421, 438):
        arc_line(d, rad, 90, 3.6, 7, 255)

    # 内側の緑青のエナメル
    d.ellipse([c - p(FIELD_R), c - p(FIELD_R), c + p(FIELD_R), c + p(FIELD_R)], fill=255)
    # 銅の二重線
    ring(d, 306, 7, 0)
    ring(d, 289, 3.5, 0)
    # ESTD・罫線・マイク・2026（銅）
    text_center(d, "ESTD", 500, 330, 44, 9, 0)
    line(d, 438, 360, 562, 360, 4, 0)
    microphone(d, 0)
    line(d, 438, 646, 562, 646, 4, 0)
    text_center(d, "2026", 500, 682, 44, 9, 0)

    # 円の外は使わない（透過の外側）
    edge = Image.new("L", (W, W), 0)
    ImageDraw.Draw(edge).ellipse([0, 0, W - 1, W - 1], fill=255)

    mask = mask.resize((SIZE, SIZE), Image.LANCZOS)
    edge = edge.resize((SIZE, SIZE), Image.LANCZOS)
    mask.save(OUT / "emblem-mask.png")

    # 平面の見本
    copper = Image.new("RGBA", (SIZE, SIZE), (190, 112, 70, 255))
    enamel = Image.new("RGBA", (SIZE, SIZE), (24, 118, 104, 255))
    prev = Image.composite(enamel, copper, mask)
    prev.putalpha(edge)
    prev.save(OUT / "emblem-preview.png")
    print("saved", OUT / "emblem-mask.png")


if __name__ == "__main__":
    main()
