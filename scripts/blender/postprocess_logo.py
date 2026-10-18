"""
logo.py のレンダリング（透過 PNG）を、オープニング用の WebP に変換する。

  python scripts/blender/postprocess_logo.py <logo.py の出力dir> [--size 480]

出力: public/opening/copper-00.webp … copper-NN.webp, patina.webp（透過・正方形）
画面では幅 330px（メダル自体は約 190px）で表示する。2〜3倍の画面でもメダルが粗くならない 480px にそろえる。
"""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent.parent
ARGS = sys.argv[1:]
SRC = Path(ARGS[0] if ARGS else "logo_out")
SIZE = int(ARGS[ARGS.index("--size") + 1]) if "--size" in ARGS else 480
OUT = ROOT / "public" / "opening"


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for old in OUT.glob("*.webp"):
        old.unlink()
    files = sorted(SRC.glob("copper-*.png")) + [SRC / "patina.png"]
    total = 0
    for f in files:
        im = Image.open(f).convert("RGBA").resize((SIZE, SIZE), Image.LANCZOS)
        dst = OUT / (f.stem + ".webp")
        im.save(dst, "WEBP", quality=80, method=6, alpha_quality=90)
        total += dst.stat().st_size
        print(dst.relative_to(ROOT), dst.stat().st_size // 1024, "KB")
    print(f"total {total // 1024} KB")


if __name__ == "__main__":
    main()
