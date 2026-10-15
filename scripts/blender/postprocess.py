"""Blenderのレンダリング結果(PNG)をアプリ用アセットに変換する。

python scripts/blender/postprocess.py <レンダリング出力dir>
  - public/guide/tetsu-<pose>.webp（透過・余白トリミング・正方形化）
  - public/icons/icon-192.png / icon-512.png / icon-512-maskable.png / apple-touch-icon.png / favicon.png
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


def square_crop(im: Image.Image, pad=0.06) -> Image.Image:
    bbox = im.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox()
    if not bbox:
        return im
    l, t, r, b = bbox
    w, h = r - l, b - t
    side = int(max(w, h) * (1 + pad * 2))
    cx, cy = (l + r) // 2, (t + b) // 2
    out = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    out.paste(im.crop(bbox), (cx - l - w // 2 + (side - w) // 2 - (cx - l - w // 2), (side - h) // 2))
    return out


for png in sorted(SRC.glob("tetsu-*.png")):
    pose = png.stem.split("-", 1)[1]
    im = Image.open(png).convert("RGBA")
    if pose == "icon":
        continue
    sq = square_crop(im).resize((512, 512), Image.LANCZOS)
    sq.save(GUIDE / f"tetsu-{pose}.webp", "WEBP", quality=88, method=6)
    print("guide", pose)

icon_src = SRC / "tetsu-icon.png"
if icon_src.exists():
    face = square_crop(Image.open(icon_src).convert("RGBA"), pad=0.02)

    def make_icon(size: int, maskable: bool) -> Image.Image:
        bg = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        d = ImageDraw.Draw(bg)
        top, bottom = (24, 160, 146), (11, 104, 95)
        for y in range(size):
            t = y / size
            c = tuple(int(top[i] * (1 - t) + bottom[i] * t) for i in range(3)) + (255,)
            d.line([(0, y), (size, y)], fill=c)
        if not maskable:
            mask = Image.new("L", (size, size), 0)
            ImageDraw.Draw(mask).rounded_rectangle([0, 0, size - 1, size - 1], radius=int(size * 0.22), fill=255)
            bg.putalpha(mask)
        # 安全領域（maskableは中央80%）に収める
        # 胸元の切れ目がアイコン下端にそろう「バストアップ」配置
        scale = 0.80 if maskable else 0.92
        f = face.resize((int(size * scale), int(size * scale)), Image.LANCZOS)
        bg.alpha_composite(f, ((size - f.width) // 2, size - f.height))
        return bg

    make_icon(192, False).save(ICONS / "icon-192.png")
    make_icon(512, False).save(ICONS / "icon-512.png")
    make_icon(512, True).save(ICONS / "icon-512-maskable.png")
    # iOSは透過を黒にするので不透明で
    ati = make_icon(180, True)
    ati.convert("RGB").save(ICONS / "apple-touch-icon.png")
    make_icon(64, False).save(ROOT / "public" / "favicon.png")
    print("icons done")
