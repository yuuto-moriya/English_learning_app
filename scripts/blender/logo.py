"""
起動時のオープニングで使う 3D ロゴ（「EP」のモノグラムを浮き彫りにしたメダル）をレンダリングする（透過 PNG）。

  python scripts/blender/logo.py <出力dir> --font Newsreader-Medium.ttf [--size 640] [--samples 96] [--frames 12]

出力:
  <出力dir>/copper-00.png 〜 copper-<frames-1>.png  磨いた新しい銅のメダルが、斜めから正面へ回り込む連番
  <出力dir>/patina.png                               正面のメダルに緑青（パティーナ）が出た姿（最後の連番と同じ構図）
続けて scripts/blender/postprocess_logo.py で public/opening/ の WebP に変換する。

フォントは Blender が読める TTF が必要。アプリの英文書体 Newsreader（OFL）を、太さ 500 の静的フォントにして使う:
  python -c "from fontTools.ttLib import TTFont; from fontTools.varLib import instancer; \
    f=TTFont('src/assets/fonts/newsreader-latin-wght-normal.woff2'); \
    i=instancer.instantiateVariableFont(f, {'wght': 500}); i.flavor=None; i.save('Newsreader-Medium.ttf')"
"""
from __future__ import annotations

import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

ARGS = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
OUT = Path(ARGS[0] if ARGS and not ARGS[0].startswith("--") else "logo_out")
FONT = ARGS[ARGS.index("--font") + 1] if "--font" in ARGS else None
SIZE = int(ARGS[ARGS.index("--size") + 1]) if "--size" in ARGS else 640
SAMPLES = int(ARGS[ARGS.index("--samples") + 1]) if "--samples" in ARGS else 96
FRAMES = int(ARGS[ARGS.index("--frames") + 1]) if "--frames" in ARGS else 12

# 新しい銅（物理的な反射率に近い色）と、緑青（自由の女神の色）
COPPER = (0.955, 0.58, 0.45, 1.0)
VERDIGRIS = (0.025, 0.14, 0.115, 1.0)
VERDIGRIS_LIGHT = (0.09, 0.30, 0.24, 1.0)


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
    sc.view_settings.look = "AgX - Medium High Contrast"

    # 背景は透過。金属に映り込む周りの明るさだけ与える（暗い面と明るい面の差で立体感を出す）
    world = bpy.data.worlds.new("w")
    sc.world = world
    world.use_nodes = True
    nt = world.node_tree
    bg = nt.nodes["Background"]
    grad = nt.nodes.new("ShaderNodeTexGradient")
    coord = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeMapping")
    sep.inputs["Rotation"].default_value = (0, math.radians(-90), 0)
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (0.05, 0.05, 0.06, 1)
    ramp.color_ramp.elements[1].color = (0.95, 0.92, 0.88, 1)
    nt.links.new(coord.outputs["Generated"], sep.inputs["Vector"])
    nt.links.new(sep.outputs["Vector"], grad.inputs["Vector"])
    nt.links.new(grad.outputs["Fac"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], bg.inputs["Color"])
    bg.inputs["Strength"].default_value = 0.7

    cam_data = bpy.data.cameras.new("cam")
    cam_data.lens = 100
    cam = bpy.data.objects.new("cam", cam_data)
    sc.collection.objects.link(cam)
    cam.location = (0.0, -9.0, 0.35)
    cam.rotation_euler = (Vector((0, 0, 0)) - Vector(cam.location)).to_track_quat("-Z", "Y").to_euler()
    sc.camera = cam

    def softbox(loc, size, energy, color=(1, 1, 1)):
        ld = bpy.data.lights.new("l", "AREA")
        ld.energy = energy
        ld.size = size
        ld.color = color
        lo = bpy.data.objects.new("l", ld)
        lo.location = loc
        lo.rotation_euler = (Vector((0, 0, 0)) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
        sc.collection.objects.link(lo)

    softbox((-4.0, -5.0, 4.5), 4.0, 900, (1.0, 0.95, 0.88))  # キー（左上・暖色）
    softbox((4.5, -3.5, -1.5), 5.0, 350, (0.85, 0.92, 1.0))  # フィル（右下・寒色）
    softbox((0.0, 4.0, 3.5), 3.0, 600)  # 縁を光らせるリム


def material_copper():
    m = bpy.data.materials.new("copper")
    m.use_nodes = True
    nt = m.node_tree
    p = nt.nodes["Principled BSDF"]
    p.inputs["Base Color"].default_value = COPPER
    p.inputs["Metallic"].default_value = 1.0
    p.inputs["Roughness"].default_value = 0.18
    # 細かなヘアライン（磨き跡）
    noise = nt.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 180.0
    noise.inputs["Detail"].default_value = 4.0
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.04
    nt.links.new(noise.outputs["Fac"], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], p.inputs["Normal"])
    return m


def material_patina(relief: bool):
    """
    緑青の出たメダル。平らな地（relief=False）は緑青で覆われ、浮き彫り（文字・縁、relief=True）は
    いちばん高い面がこすれて銅が見える（古い硬貨やブロンズ像と同じ）。
    """
    m = bpy.data.materials.new("patina-relief" if relief else "patina-field")
    m.use_nodes = True
    nt = m.node_tree
    out = nt.nodes["Material Output"]
    nt.nodes.remove(nt.nodes["Principled BSDF"])

    cu = nt.nodes.new("ShaderNodeBsdfPrincipled")
    cu.inputs["Base Color"].default_value = (0.86, 0.46, 0.30, 1.0)
    cu.inputs["Metallic"].default_value = 1.0
    cu.inputs["Roughness"].default_value = 0.32

    vg = nt.nodes.new("ShaderNodeBsdfPrincipled")
    vg.inputs["Metallic"].default_value = 0.0
    vg.inputs["Roughness"].default_value = 0.72
    # 緑青の色むら
    tone = nt.nodes.new("ShaderNodeTexNoise")
    tone.inputs["Scale"].default_value = 7.0
    tone.inputs["Detail"].default_value = 9.0
    tramp = nt.nodes.new("ShaderNodeValToRGB")
    tramp.color_ramp.elements[0].color = VERDIGRIS
    tramp.color_ramp.elements[1].color = VERDIGRIS_LIGHT
    nt.links.new(tone.outputs["Fac"], tramp.inputs["Fac"])
    nt.links.new(tramp.outputs["Color"], vg.inputs["Base Color"])
    grain = nt.nodes.new("ShaderNodeTexNoise")
    grain.inputs["Scale"].default_value = 110.0
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.3
    nt.links.new(grain.outputs["Fac"], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], vg.inputs["Normal"])

    # まだらの緑青（地でも、ところどころ銅がのぞく）
    blot = nt.nodes.new("ShaderNodeTexNoise")
    blot.inputs["Scale"].default_value = 4.0
    blot.inputs["Detail"].default_value = 12.0
    bramp = nt.nodes.new("ShaderNodeValToRGB")
    bramp.color_ramp.elements[0].position = 0.60
    bramp.color_ramp.elements[1].position = 0.72
    nt.links.new(blot.outputs["Fac"], bramp.inputs["Fac"])
    fac = bramp.outputs["Color"]

    if relief:
        # 浮き彫りの上面（物体の +Z を向く面）＝こすれて銅。側面・溝＝緑青
        tc = nt.nodes.new("ShaderNodeTexCoord")
        sep = nt.nodes.new("ShaderNodeSeparateXYZ")
        nt.links.new(tc.outputs["Normal"], sep.inputs["Vector"])
        top = nt.nodes.new("ShaderNodeValToRGB")
        top.color_ramp.elements[0].position = 0.80
        top.color_ramp.elements[1].position = 0.95
        nt.links.new(sep.outputs["Z"], top.inputs["Fac"])
        # 上面でも少しだけ緑青が残るよう、ノイズで削る
        wear = nt.nodes.new("ShaderNodeTexNoise")
        wear.inputs["Scale"].default_value = 16.0
        wear.inputs["Detail"].default_value = 6.0
        wramp = nt.nodes.new("ShaderNodeValToRGB")
        wramp.color_ramp.elements[0].position = 0.30
        wramp.color_ramp.elements[1].position = 0.50
        nt.links.new(wear.outputs["Fac"], wramp.inputs["Fac"])
        mul = nt.nodes.new("ShaderNodeMath")
        mul.operation = "MULTIPLY"
        nt.links.new(top.outputs["Color"], mul.inputs[0])
        nt.links.new(wramp.outputs["Color"], mul.inputs[1])
        mx = nt.nodes.new("ShaderNodeMath")
        mx.operation = "MAXIMUM"
        nt.links.new(mul.outputs["Value"], mx.inputs[0])
        nt.links.new(fac, mx.inputs[1])
        fac = mx.outputs["Value"]

    mix = nt.nodes.new("ShaderNodeMixShader")
    nt.links.new(fac, mix.inputs["Fac"])
    nt.links.new(vg.outputs["BSDF"], mix.inputs[1])
    nt.links.new(cu.outputs["BSDF"], mix.inputs[2])
    nt.links.new(mix.outputs["Shader"], out.inputs["Surface"])
    return m


def bevel(obj, width, segments=4):
    mod = obj.modifiers.new("bevel", "BEVEL")
    mod.width = width
    mod.segments = segments
    mod.limit_method = "ANGLE"
    obj.modifiers.new("ws", "WEIGHTED_NORMAL")
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.shade_smooth()


def build_medal(field, relief=None) -> bpy.types.Object:
    """メダル（台の円盤・外周の縁・内側の細い輪・EP の文字）を作り、1つの親にまとめる"""
    root = bpy.data.objects.new("medal", None)
    bpy.context.scene.collection.objects.link(root)

    relief = relief or field

    def add(obj, mat):
        obj.data.materials.append(mat)
        obj.parent = root

    bpy.ops.mesh.primitive_cylinder_add(vertices=192, radius=1.0, depth=0.16, location=(0, 0, 0))
    disc = bpy.context.object
    bevel(disc, 0.03)
    add(disc, field)

    # 外周の縁（少し高い輪）
    bpy.ops.mesh.primitive_torus_add(major_radius=0.955, minor_radius=0.05, major_segments=192, minor_segments=32, location=(0, 0, 0.08))
    rim = bpy.context.object
    bpy.ops.object.shade_smooth()
    add(rim, relief)

    # 内側の細い輪（メゾンの紋章のような二重線）
    bpy.ops.mesh.primitive_torus_add(major_radius=0.82, minor_radius=0.012, major_segments=192, minor_segments=16, location=(0, 0, 0.085))
    inner = bpy.context.object
    bpy.ops.object.shade_smooth()
    add(inner, relief)

    curve = bpy.data.curves.new("ep", "FONT")
    curve.body = "EP"
    if FONT:
        curve.font = bpy.data.fonts.load(str(Path(FONT).resolve()))
    curve.size = 1.08
    curve.space_character = 0.96
    curve.align_x = "CENTER"
    curve.align_y = "CENTER"
    curve.extrude = 0.055
    curve.bevel_depth = 0.009
    curve.bevel_resolution = 3
    curve.resolution_u = 24
    text = bpy.data.objects.new("ep", curve)
    bpy.context.scene.collection.objects.link(text)
    text.location = (0.0, 0.0, 0.14)
    bpy.context.view_layer.objects.active = text
    text.select_set(True)
    bpy.ops.object.convert(target="MESH")
    text = bpy.context.object
    bpy.ops.object.shade_smooth()
    add(text, relief)

    # 円盤を正面（カメラ側）に向ける
    root.rotation_euler = (math.radians(90), 0, 0)
    return root


def ease_out(t: float) -> float:
    return 1 - (1 - t) ** 3


def render(path: Path):
    bpy.context.scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)
    print("rendered", path)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    only_patina = "--only-patina" in ARGS

    # 1) 銅のメダルが、斜め（-58°）から正面へ回り込む
    if not only_patina:
        reset()
        setup_scene()
        medal = build_medal(material_copper())
        for k in range(FRAMES):
            t = ease_out(k / max(1, FRAMES - 1))
            medal.rotation_euler = (math.radians(90), 0, math.radians(-58 * (1 - t)))
            render(OUT / f"copper-{k:02d}.png")

    # 2) 正面のメダルに緑青が出た姿
    reset()
    setup_scene()
    medal = build_medal(material_patina(False), material_patina(True))
    medal.rotation_euler = (math.radians(90), 0, 0)
    render(OUT / "patina.png")


if __name__ == "__main__":
    main()
