"""Blenderのレンダリング結果(PNG)をアプリ用アセットに変換する。

python scripts/blender/postprocess.py <レンダリング出力dir>
  - public/guide/<キャラ>-<ポーズ>.webp（透過・余白トリミング・正方形 384px）
  - public/icons/icon-192.png / icon-512.png / icon-512-maskable.png / apple-touch-icon.png / favicon.png
    （tetsu-icon.png から作成）
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw

SRC = Path(sys.argv[1])
ROOT = Path(__file__).resolve().parents[2]
GUIDE = ROOT / "public" / "guide"
ICONS = ROOT / "public" / "icons"
GUIDE.mkdir(parents=True, exist_ok=True)
ICONS.mkdir(parents=True, exist_ok=True)

SIZE = 384  # 表示は最大 124pt（3倍で約370px）


def square_crop(im: Image.Image, pad=0.04) -> Image.Image:
    """不透明部分を囲む正方形に切り出す（キャラクターは下寄せ＝足元がそろう）"""
    bbox = im.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox()
    if not bbox:
        return im
    l, t, r, b = bbox
    w, h = r - l, b - t
    side = int(max(w, h) * (1 + pad * 2))
    out = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    out.paste(im.crop(bbox), ((side - w) // 2, side - h - int(side * pad)))
    return out


for png in sorted(SRC.glob("*.png")):
    if png.stem == "tetsu-icon":
        continue
    im = Image.open(png).convert("RGBA")
    sq = square_crop(im).resize((SIZE, SIZE), Image.LANCZOS)
    sq.save(GUIDE / f"{png.stem}.webp", "WEBP", quality=86, method=6)
    print("guide", png.stem)

icon_src = SRC / "tetsu-icon.png"
if icon_src.exists():
    face = square_crop(Image.open(icon_src).convert("RGBA"), pad=0.0)

    def make_icon(size: int, maskable: bool) -> Image.Image:
        bg = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        d = ImageDraw.Draw(bg)
        # 保線カラー（ティール）の縦グラデーション＋上部のハイライト
        top, bottom = (40, 196, 178), (8, 110, 100)
        for y in range(size):
            t = y / size
            c = tuple(int(top[i] * (1 - t) + bottom[i] * t) for i in range(3)) + (255,)
            d.line([(0, y), (size, y)], fill=c)
        glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        ImageDraw.Draw(glow).ellipse([-size * 0.2, -size * 0.55, size * 1.2, size * 0.45], fill=(255, 255, 255, 34))
        bg.alpha_composite(glow)
        if not maskable:
            mask = Image.new("L", (size, size), 0)
            ImageDraw.Draw(mask).rounded_rectangle([0, 0, size - 1, size - 1], radius=int(size * 0.22), fill=255)
            bg.putalpha(mask)
        # maskable は中央80%の安全領域に収める。顔の下端（胸元）をアイコン下端にそろえる
        scale = 0.80 if maskable else 0.94
        f = face.resize((int(size * scale), int(size * scale)), Image.LANCZOS)
        bg.alpha_composite(f, ((size - f.width) // 2, size - f.height))
        return bg

    make_icon(192, False).save(ICONS / "icon-192.png", optimize=True)
    make_icon(512, False).save(ICONS / "icon-512.png", optimize=True)
    make_icon(512, True).save(ICONS / "icon-512-maskable.png", optimize=True)
    # iOS は透過を黒にするので不透明で
    make_icon(180, True).convert("RGB").save(ICONS / "apple-touch-icon.png", optimize=True)
    make_icon(64, False).save(ROOT / "public" / "favicon.png", optimize=True)
    print("icons done")
