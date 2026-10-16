"""
キャラクターをレンダリングする（透過PNG）。

  python scripts/blender/render.py <出力dir> [--size 1024] [--samples 96] [--only tetsu-greet,pico-happy]

出力: <出力dir>/<キャラ>-<ポーズ>.png（tetsu-icon.png はアプリアイコン用の顔アップ）
続けて scripts/blender/postprocess.py で public/ 用の WebP・アイコンに変換する。
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import kit  # noqa: E402
import corgi  # noqa: E402
import cast  # noqa: E402

ARGS = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
OUT = Path(ARGS[0] if ARGS and not ARGS[0].startswith("--") else "render_out")
SIZE = int(ARGS[ARGS.index("--size") + 1]) if "--size" in ARGS else 1024
SAMPLES = int(ARGS[ARGS.index("--samples") + 1]) if "--samples" in ARGS else 96
ONLY = ARGS[ARGS.index("--only") + 1].split(",") if "--only" in ARGS else None

# キャラ名 → (build(pose, extras), ポーズ一覧)
CHARACTERS = {
    "tetsu": (corgi.build, corgi.POSES),
    **cast.CHARACTERS,
}


def job_list():
    jobs = []
    for name, (_, poses) in CHARACTERS.items():
        for p in poses:
            jobs.append(f"{name}-{p}")
    jobs.append("tetsu-icon")
    return jobs


def run(job: str):
    kit.reset()
    cam = kit.setup_scene(SIZE, SAMPLES)
    name, pose = job.split("-", 1)
    if job == "tetsu-icon":
        corgi.build("happy", extras=False)
        kit.aim(cam, (0.9, -7.0, 2.2), (0.0, -0.3, 1.42), lens=120)
    else:
        build, _ = CHARACTERS[name]
        build(pose)
    kit.render(OUT / f"{job}.png")


if __name__ == "__main__":
    for j in job_list():
        if ONLY and j not in ONLY:
            continue
        run(j)
