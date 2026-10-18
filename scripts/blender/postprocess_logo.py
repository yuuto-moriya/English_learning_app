"""
logo.py のレンダリング（透過 PNG）を、オープニング用の WebP に変換する。

  python scripts/blender/postprocess_logo.py <logo.py の出力dir> [--size 640]

出力: public/opening/copper-00.webp … copper-NN.webp, patina.webp（透過・正方形）
画面では幅 310px までで表示する。文字が細かいので、3倍の画面でも粗くならないよう 640px にそろえる。
"""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent.parent
ARGS = sys.argv[1:]
SRC = Path(ARGS[0] if ARGS else "logo_out")
SIZE = int(ARGS[ARGS.index("--size") + 1]) if "--size" in ARGS else 640
OUT = ROOT / "public" / "opening"


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for old in OUT.glob("*.webp"):
        old.unlink()
    files = sorted(SRC.glob("copper-*.png")) + [SRC / "patina.png"]
    total = 0
    last = files[-2] if len(files) > 1 else files[-1]
    for f in files:
        # 回り込む途中のコマは一瞬なので小さく軽く。止まって見える最後の2枚（正面の銅・年月を経た姿）だけ大きく
        still = f in (last, files[-1])
        size = SIZE if still else int(SIZE * 0.72)
        im = Image.open(f).convert("RGBA").resize((size, size), Image.LANCZOS)
        dst = OUT / (f.stem + ".webp")
        im.save(dst, "WEBP", quality=82 if still else 70, method=6, alpha_quality=85)
        total += dst.stat().st_size
        print(dst.relative_to(ROOT), dst.stat().st_size // 1024, "KB")
    print(f"total {total // 1024} KB")


if __name__ == "__main__":
    main()
