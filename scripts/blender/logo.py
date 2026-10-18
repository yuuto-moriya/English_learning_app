"""
起動時のオープニングで使う 3D のエンブレム（銅の板に緑青色のエナメルを埋めた、ヴィンテージの看板の組み方）をレンダリングする（透過 PNG）。

  python scripts/blender/logo.py <出力dir> --mask emblem-mask.png [--size 640] [--samples 96] [--frames 14]

出力:
  <出力dir>/copper-00.png 〜 copper-<frames-1>.png  磨いたばかりの銅のエンブレムが、斜めから正面へ回り込む連番
  <出力dir>/patina.png                               年月を経た姿（銅がくすみ、縁や地に酸化の斑点。最後の連番と同じ構図）
続けて scripts/blender/postprocess_logo.py で public/opening/ の WebP に変換する。

図案（文字・スピード線・中央のマイク）は scripts/blender/emblem_art.py が描く emblem-mask.png（白＝エナメル、黒＝銅）。
エナメルは銅より少し低く埋め込み、つやのある面にする。
"""
from __future__ import annotations

import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

ARGS = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
OUT = Path(ARGS[0] if ARGS and not ARGS[0].startswith("--") else "logo_out")
MASK = ARGS[ARGS.index("--mask") + 1] if "--mask" in ARGS else "emblem-mask.png"
SIZE = int(ARGS[ARGS.index("--size") + 1]) if "--size" in ARGS else 640
SAMPLES = int(ARGS[ARGS.index("--samples") + 1]) if "--samples" in ARGS else 96
FRAMES = int(ARGS[ARGS.index("--frames") + 1]) if "--frames" in ARGS else 14

# 新しい銅（物理的な反射率に近い色）と、緑青色のエナメル
COPPER = (0.955, 0.56, 0.40, 1.0)
ENAMEL = (0.012, 0.16, 0.135, 1.0)


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def setup_scene():
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    sc.cycles.device = "CPU"
    sc.cycles.samples = SAMPLES
    sc.cycles.use_denoising = True
    sc.cycles.max_bounces = 8
    sc.render.film_transparent = True
    sc.render.resolution_x = SIZE
    sc.render.resolution_y = SIZE
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGBA"
    sc.view_settings.view_transform = "AgX"
    sc.view_settings.look = "AgX - Punchy"
    sc.view_settings.exposure = -0.85

    # 背景は透過。周りはほぼ暗く（金属が白っぽく映らないように）、映り込みは照明で作る
    world = bpy.data.worlds.new("w")
    sc.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0.09, 0.075, 0.065, 1)
    bg.inputs["Strength"].default_value = 1.0

    cam_data = bpy.data.cameras.new("cam")
    cam_data.lens = 100
    cam = bpy.data.objects.new("cam", cam_data)
    sc.collection.objects.link(cam)
    cam.location = (0.0, -6.3, 0.25)
    cam.rotation_euler = (Vector((0, 0, 0)) - Vector(cam.location)).to_track_quat("-Z", "Y").to_euler()
    sc.camera = cam

    def light(loc, size, energy, color=(1, 1, 1), size_y=None):
        ld = bpy.data.lights.new("l", "AREA")
        ld.energy = energy
        ld.color = color
        if size_y:
            ld.shape = "RECTANGLE"
            ld.size = size
            ld.size_y = size_y
        else:
            ld.size = size
        lo = bpy.data.objects.new("l", ld)
        lo.location = loc
        lo.rotation_euler = (Vector((0, 0, 0)) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
        sc.collection.objects.link(lo)

    light((-2.6, -5.0, 2.4), 2.6, 520, (1.0, 0.93, 0.84))  # キー（左上・暖色。左上に光が映る）
    light((3.2, -4.0, -1.6), 3.0, 140, (0.86, 0.92, 1.0))  # フィル（右下・寒色）
    # 看板の金属に映る、横長の照明（光の帯）
    light((1.2, -5.8, -0.9), 7.0, 150, (1.0, 0.96, 0.9), size_y=0.18)
    light((0.0, 3.5, 3.0), 3.0, 300)  # 縁を光らせるリム


def mask_value(nt):
    """エンブレムの図案（白＝エナメル）を、円板の正面に貼る（物体の座標 -1〜1 → 画像 0〜1）"""
    tc = nt.nodes.new("ShaderNodeTexCoord")
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (0.5, 0.5, 1.0)
    mp.inputs["Location"].default_value = (0.5, 0.5, 0.0)
    nt.links.new(tc.outputs["Object"], mp.inputs["Vector"])
    img = nt.nodes.new("ShaderNodeTexImage")
    img.image = bpy.data.images.load(str(Path(MASK).resolve()))
    img.image.colorspace_settings.name = "Non-Color"
    img.extension = "CLIP"
    img.interpolation = "Cubic"
    nt.links.new(mp.outputs["Vector"], img.inputs["Vector"])
    return img.outputs["Color"], tc


def material_emblem(aged: bool):
    m = bpy.data.materials.new("emblem-aged" if aged else "emblem-new")
    m.use_nodes = True
    nt = m.node_tree
    out = nt.nodes["Material Output"]
    nt.nodes.remove(nt.nodes["Principled BSDF"])
    mask, tc = mask_value(nt)

    # 銅
    cu = nt.nodes.new("ShaderNodeBsdfPrincipled")
    cu.inputs["Metallic"].default_value = 1.0
    brushed = nt.nodes.new("ShaderNodeTexNoise")
    brushed.inputs["Scale"].default_value = 220.0
    brushed.inputs["Detail"].default_value = 3.0
    if not aged:
        cu.inputs["Base Color"].default_value = COPPER
        cu.inputs["Roughness"].default_value = 0.16
    else:
        # 年月を経た銅：くすんだ赤褐色の斑点（酸化）と、縁ほど暗い焼け
        spots = nt.nodes.new("ShaderNodeTexNoise")
        spots.inputs["Scale"].default_value = 11.0
        spots.inputs["Detail"].default_value = 12.0
        spots.inputs["Roughness"].default_value = 0.65
        sramp = nt.nodes.new("ShaderNodeValToRGB")
        sramp.color_ramp.elements[0].position = 0.55
        sramp.color_ramp.elements[0].color = (1, 1, 1, 1)
        sramp.color_ramp.elements[1].position = 0.70
        sramp.color_ramp.elements[1].color = (0, 0, 0, 1)
        nt.links.new(spots.outputs["Fac"], sramp.inputs["Fac"])
        # 中心からの距離（縁ほど 1）
        flat = nt.nodes.new("ShaderNodeVectorMath")
        flat.operation = "MULTIPLY"
        flat.inputs[1].default_value = (1.0, 1.0, 0.0)
        nt.links.new(tc.outputs["Object"], flat.inputs[0])
        length = nt.nodes.new("ShaderNodeVectorMath")
        length.operation = "LENGTH"
        nt.links.new(flat.outputs["Vector"], length.inputs[0])
        edge = nt.nodes.new("ShaderNodeValToRGB")
        edge.color_ramp.elements[0].position = 0.86
        edge.color_ramp.elements[0].color = (1, 1, 1, 1)
        edge.color_ramp.elements[1].position = 1.0
        edge.color_ramp.elements[1].color = (0.25, 0.25, 0.25, 1)
        nt.links.new(length.outputs["Value"], edge.inputs["Fac"])
        both = nt.nodes.new("ShaderNodeMath")
        both.operation = "MULTIPLY"
        nt.links.new(sramp.outputs["Color"], both.inputs[0])
        nt.links.new(edge.outputs["Color"], both.inputs[1])
        tint = nt.nodes.new("ShaderNodeMix")
        tint.data_type = "RGBA"
        tint.inputs["A"].default_value = (0.32, 0.12, 0.06, 1.0)  # 酸化してくすんだ銅
        tint.inputs["B"].default_value = (0.86, 0.50, 0.36, 1.0)  # まだ光る銅
        nt.links.new(both.outputs["Value"], tint.inputs["Factor"])
        nt.links.new(tint.outputs["Result"], cu.inputs["Base Color"])
        rough = nt.nodes.new("ShaderNodeMapRange")
        rough.inputs["To Min"].default_value = 0.55
        rough.inputs["To Max"].default_value = 0.2
        nt.links.new(both.outputs["Value"], rough.inputs["Value"])
        nt.links.new(rough.outputs["Result"], cu.inputs["Roughness"])

    # 緑青色のエナメル（つやのある面）
    en = nt.nodes.new("ShaderNodeBsdfPrincipled")
    en.inputs["Base Color"].default_value = ENAMEL
    en.inputs["Metallic"].default_value = 0.0
    en.inputs["Roughness"].default_value = 0.3 if aged else 0.12
    en.inputs["Coat Weight"].default_value = 0.35
    en.inputs["Coat Roughness"].default_value = 0.12 if aged else 0.04
    grain = nt.nodes.new("ShaderNodeTexNoise")
    grain.inputs["Scale"].default_value = 140.0

    # エナメルは少し低く（埋め込み）。銅には細かな磨き跡、エナメルには細かな粒
    height = nt.nodes.new("ShaderNodeMath")
    height.operation = "MULTIPLY_ADD"
    height.inputs[1].default_value = -1.0
    height.inputs[2].default_value = 1.0
    nt.links.new(mask, height.inputs[0])
    tex = nt.nodes.new("ShaderNodeMix")
    tex.data_type = "FLOAT"
    nt.links.new(mask, tex.inputs["Factor"])
    nt.links.new(brushed.outputs["Fac"], tex.inputs["A"])
    nt.links.new(grain.outputs["Fac"], tex.inputs["B"])
    detail = nt.nodes.new("ShaderNodeMath")
    detail.operation = "MULTIPLY_ADD"
    detail.inputs[1].default_value = 0.04
    nt.links.new(tex.outputs["Result"], detail.inputs[0])
    nt.links.new(height.outputs["Value"], detail.inputs[2])
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.9
    bump.inputs["Distance"].default_value = 0.012
    nt.links.new(detail.outputs["Value"], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], cu.inputs["Normal"])
    nt.links.new(bump.outputs["Normal"], en.inputs["Normal"])

    mix = nt.nodes.new("ShaderNodeMixShader")
    nt.links.new(mask, mix.inputs["Fac"])
    nt.links.new(cu.outputs["BSDF"], mix.inputs[1])
    nt.links.new(en.outputs["BSDF"], mix.inputs[2])
    nt.links.new(mix.outputs["Shader"], out.inputs["Surface"])
    return m


def build_emblem(material) -> bpy.types.Object:
    """円い銅の板（縁は面取り）。正面（物体の +Z）をカメラに向ける"""
    bpy.ops.mesh.primitive_cylinder_add(vertices=256, radius=1.0, depth=0.07, location=(0, 0, 0))
    disc = bpy.context.object
    mod = disc.modifiers.new("bevel", "BEVEL")
    mod.width = 0.018
    mod.segments = 5
    mod.limit_method = "ANGLE"
    disc.modifiers.new("ws", "WEIGHTED_NORMAL")
    bpy.ops.object.shade_smooth()
    disc.data.materials.append(material)
    disc.rotation_euler = (math.radians(90), 0, 0)
    return disc


def ease_out(t: float) -> float:
    return 1 - (1 - t) ** 3


def render(path: Path):
    bpy.context.scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)
    print("rendered", path)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    only_aged = "--only-aged" in ARGS

    # 1) 磨いたばかりの銅のエンブレムが、斜め（-58°）から正面へ回り込む
    if not only_aged:
        reset()
        setup_scene()
        emblem = build_emblem(material_emblem(aged=False))
        frames = 1 if "--only-front" in ARGS else FRAMES
        for k in range(frames):
            t = 1.0 if frames == 1 else ease_out(k / (frames - 1))
            emblem.rotation_euler = (math.radians(90), 0, math.radians(-58 * (1 - t)))
            render(OUT / f"copper-{k:02d}.png")

    # 2) 年月を経た姿（正面）
    reset()
    setup_scene()
    emblem = build_emblem(material_emblem(aged=True))
    emblem.rotation_euler = (math.radians(90), 0, 0)
    render(OUT / "patina.png")


if __name__ == "__main__":
    main()
