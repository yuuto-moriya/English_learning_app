"""
案内役コーギー「テツ」をBlender(bpy)でプロシージャルにモデリングし、
表情・ポーズ別の透過PNGをレンダリングする。

実行:  python scripts/blender/corgi.py <出力ディレクトリ> [--size 640] [--samples 48] [--only pose1,pose2]
       （pip install bpy でBlenderをPythonモジュールとして利用）
"""
from __future__ import annotations

import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

# ───────────── 設定 ─────────────
ARGS = sys.argv[1:]
OUT = Path(ARGS[0] if ARGS and not ARGS[0].startswith("--") else "corgi_out")
SIZE = int(ARGS[ARGS.index("--size") + 1]) if "--size" in ARGS else 640
SAMPLES = int(ARGS[ARGS.index("--samples") + 1]) if "--samples" in ARGS else 48
ONLY = ARGS[ARGS.index("--only") + 1].split(",") if "--only" in ARGS else None

COL = {
    "fur": (0.72, 0.21, 0.035, 1),     # コーギーのオレンジ（リニア値）
    "fur_dark": (0.35, 0.09, 0.015, 1),
    "white": (0.86, 0.83, 0.79, 1),
    "black": (0.03, 0.03, 0.04, 1),
    "pink": (0.85, 0.18, 0.24, 1),
    "inner_ear": (0.95, 0.45, 0.38, 1),
    "scarf": (0.006, 0.25, 0.21, 1),   # アプリのレールカラー（ティール）
    "helmet": (1.0, 0.62, 0.0, 1),
    "vest": (0.62, 0.95, 0.02, 1),
    "reflect": (0.85, 0.88, 0.90, 1),
    "gold": (1.0, 0.75, 0.15, 1),
    "blush": (1.0, 0.30, 0.30, 1),
    "sweat": (0.20, 0.55, 1.0, 1),
    "confetti": [(0.95, 0.30, 0.35, 1), (0.25, 0.65, 0.95, 1), (1.0, 0.80, 0.15, 1), (0.30, 0.80, 0.50, 1), (0.65, 0.45, 0.95, 1)],
}


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)


_mats: dict[str, bpy.types.Material] = {}


def mat(name: str, color, rough=0.55, emission=0.0, metallic=0.0, coat=0.0):
    key = f"{name}"
    if key in _mats:
        return _mats[key]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Metallic"].default_value = metallic
    if "Coat Weight" in bsdf.inputs:
        bsdf.inputs["Coat Weight"].default_value = coat
    if emission > 0:
        bsdf.inputs["Emission Color"].default_value = color
        bsdf.inputs["Emission Strength"].default_value = emission
    _mats[key] = m
    return m


def outline_mat():
    if "outline" in _mats:
        return _mats["outline"]
    m = bpy.data.materials.new("outline")
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Color"].default_value = (0.16, 0.08, 0.04, 1)
    em.inputs["Strength"].default_value = 1.0
    tr = nt.nodes.new("ShaderNodeBsdfTransparent")
    geo = nt.nodes.new("ShaderNodeNewGeometry")
    mix = nt.nodes.new("ShaderNodeMixShader")
    # 反転ハル：カメラ側を向いた殻の裏面だけを輪郭色に、手前の面は透明に
    nt.links.new(geo.outputs["Backfacing"], mix.inputs[0])
    nt.links.new(em.outputs[0], mix.inputs[1])
    nt.links.new(tr.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], out.inputs[0])
    m.use_backface_culling = True
    _mats["outline"] = m
    return m


def add_outline(obj, thickness=0.018):
    """輪郭線はFreestyleで描画するため、ここではオブジェクトを線画対象として残すだけ"""
    return None


def smooth(obj, levels=2):
    for p in obj.data.polygons:
        p.use_smooth = True
    sub = obj.modifiers.new("Subsurf", "SUBSURF")
    sub.levels = levels
    sub.render_levels = levels


def ellipsoid(name, loc, scale, color_key, rot=(0, 0, 0), parent=None, outline=True, rough=0.55, seg=32, coat=0.0):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=seg // 2, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    o.scale = scale
    o.data.materials.append(mat(color_key, COL[color_key] if isinstance(color_key, str) else color_key, rough=rough, coat=coat))
    for p in o.data.polygons:
        p.use_smooth = True
    if outline:
        add_outline(o, 0.012 / max(0.2, min(scale)))
    if parent:
        o.parent = parent
        o.matrix_parent_inverse = parent.matrix_world.inverted()
    return o


def cone(name, loc, r1, depth, color_key, rot=(0, 0, 0), scale=(1, 1, 1), parent=None, outline=True):
    bpy.ops.mesh.primitive_cone_add(vertices=48, radius1=r1, radius2=0.0, depth=depth, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    o.scale = scale
    o.data.materials.append(mat(color_key, COL[color_key]))
    smooth(o, 1)
    if outline:
        add_outline(o, 0.012)
    if parent:
        o.parent = parent
        o.matrix_parent_inverse = parent.matrix_world.inverted()
    return o


def cylinder(name, loc, r, depth, color_key, rot=(0, 0, 0), parent=None, outline=True, verts=48, rough=0.5):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=depth, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    o.data.materials.append(mat(color_key, COL[color_key], rough=rough))
    for p in o.data.polygons:
        p.use_smooth = True
    bev = o.modifiers.new("Bevel", "BEVEL")
    bev.width = min(r, depth) * 0.25
    bev.segments = 4
    if outline:
        add_outline(o, 0.01)
    if parent:
        o.parent = parent
        o.matrix_parent_inverse = parent.matrix_world.inverted()
    return o


def curve_line(name, points, color_key, bevel=0.018, parent=None):
    cu = bpy.data.curves.new(name, type="CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = bevel
    cu.bevel_resolution = 6
    cu.use_fill_caps = True
    sp = cu.splines.new("POLY")
    sp.points.add(len(points) - 1)
    for i, p in enumerate(points):
        sp.points[i].co = (p[0], p[1], p[2], 1)
    o = bpy.data.objects.new(name, cu)
    bpy.context.collection.objects.link(o)
    o.data.materials.append(mat(color_key, COL[color_key]))
    if parent:
        o.parent = parent
    return o


def arc_points(cx, y, cz, rx, rz, a0, a1, n=14):
    pts = []
    for i in range(n + 1):
        a = math.radians(a0 + (a1 - a0) * i / n)
        pts.append((cx + rx * math.cos(a), y, cz + rz * math.sin(a)))
    return pts


def empty(name, loc, parent=None, rot=(0, 0, 0)):
    o = bpy.data.objects.new(name, None)
    o.location = loc
    o.rotation_euler = rot
    bpy.context.collection.objects.link(o)
    if parent:
        o.parent = parent
    return o


# ───────────── キャラクター ─────────────
def build_corgi(pose: str):
    """pose: greet / happy / celebrate / think / cheer / sleep / safety / oops"""
    root = empty("root", (0, 0, 0))

    lying = pose == "sleep"
    jump = 0.35 if pose == "celebrate" else 0.0

    # 胴体（長めの楕円体）
    body_z = 0.62 + jump if not lying else 0.42
    body = ellipsoid("body", (0, 0.15, body_z), (0.58, 0.82, 0.52), "fur", parent=root)
    body.rotation_euler = (math.radians(-8 if not lying else 0), 0, 0)
    # 胸・おなかの白
    ellipsoid("chest", (0, -0.42, body_z - 0.02), (0.42, 0.30, 0.46), "white", parent=root)
    ellipsoid("belly", (0, 0.12, body_z - 0.22), (0.40, 0.62, 0.28), "white", parent=root, outline=False)

    # 脚（短い！）
    leg_len = 0.36
    legs = {
        "fl": (-0.30, -0.36),
        "fr": (0.30, -0.36),
        "bl": (-0.32, 0.62),
        "br": (0.32, 0.62),
    }
    for k, (x, y) in legs.items():
        if lying:
            # 前足を前に投げ出す
            if k.startswith("f"):
                cylinder(f"leg_{k}", (x * 0.8, y - 0.38, 0.14), 0.12, 0.42, "fur", rot=(math.radians(90), 0, 0), parent=root)
                ellipsoid(f"paw_{k}", (x * 0.8, y - 0.62, 0.12), (0.15, 0.17, 0.11), "white", parent=root)
            continue
        z0 = body_z - 0.30
        raise_leg = (pose in ("greet",) and k == "fl") or (pose in ("cheer",) and k == "fr") or (
            pose == "celebrate" and k.startswith("f")) or (pose == "think" and k == "fr")
        if raise_leg:
            if pose == "think":
                # 前足をあごに
                cylinder(f"leg_{k}", (x * 0.55, y - 0.30, z0 + 0.42), 0.11, 0.42, "fur", rot=(math.radians(-60), math.radians(-20), 0), parent=root)
                ellipsoid(f"paw_{k}", (x * 0.35, y - 0.52, z0 + 0.62), (0.14, 0.14, 0.13), "white", parent=root)
            else:
                ang = -150 if pose != "celebrate" else -165
                cylinder(f"leg_{k}", (x * 1.15, y - 0.18, z0 + 0.42), 0.11, 0.46, "fur", rot=(math.radians(ang), math.radians(18 if x < 0 else -18), 0), parent=root)
                ellipsoid(f"paw_{k}", (x * 1.35, y - 0.32, z0 + 0.72), (0.14, 0.13, 0.14), "white", parent=root)
            continue
        cylinder(f"leg_{k}", (x, y, z0 - leg_len / 2 + 0.05 - (0.0 if not jump else -0.05)), 0.12, leg_len, "fur", parent=root)
        ellipsoid(f"paw_{k}", (x, y - 0.05, z0 - leg_len + 0.06 + (0.0 if not jump else 0.05)), (0.15, 0.18, 0.10), "white", parent=root)

    # しっぽ（ふわふわの短いしっぽ）
    ellipsoid("tail", (0, 0.98, body_z + 0.18), (0.16, 0.16, 0.14), "fur", parent=root)

    # 首元のスカーフ（ブランドカラー）
    if pose == "sleep":
        pass
    elif pose != "safety":
        bpy.ops.mesh.primitive_torus_add(major_radius=0.36, minor_radius=0.075, location=(0, -0.40, body_z + 0.30), rotation=(math.radians(70), 0, 0))
        sc = bpy.context.active_object
        sc.name = "scarf"
        sc.data.materials.append(mat("scarf", COL["scarf"], rough=0.6))
        for p in sc.data.polygons:
            p.use_smooth = True
        add_outline(sc, 0.01)
        cone("scarf_tip", (0, -0.70, body_z + 0.10), 0.16, 0.26, "scarf", rot=(math.radians(200), 0, 0), scale=(1, 0.35, 1), parent=root)
    else:
        # 高視認性ベスト（反射材つき）
        ellipsoid("vest", (0, -0.12, body_z + 0.03), (0.62, 0.66, 0.55), "vest", parent=root, outline=True)
        for i, dy in enumerate((-0.38, 0.12)):
            bpy.ops.mesh.primitive_torus_add(major_radius=1.0, minor_radius=0.05, location=(0, dy, body_z + 0.03), rotation=(math.radians(90), 0, 0))
            st = bpy.context.active_object
            st.name = f"stripe{i}"
            st.scale = (0.64, 0.57, 1.0)
            st.data.materials.append(mat("reflect", COL["reflect"], rough=0.2, metallic=0.3, emission=0.6))

    # ───── 頭 ─────
    head_z = body_z + 0.62 if not lying else 0.62
    head_y = -0.62 if not lying else -0.72
    tilt = {"think": 16, "happy": -10, "oops": 8, "sleep": 0, "cheer": -6, "celebrate": 0, "greet": -6, "safety": 0}.get(pose, 0)
    nod = {"sleep": 12, "oops": 10}.get(pose, -4)
    head = empty("head_pivot", (0, head_y, head_z), parent=root, rot=(math.radians(nod), math.radians(tilt), 0))

    def H(name, off, scale, color, **kw):
        o = ellipsoid(name, (off[0], off[1], off[2]), scale, color, outline=kw.pop("outline", True), **kw)
        o.parent = head
        return o

    H("head", (0, 0, 0), (0.56, 0.50, 0.48), "fur", coat=0.0)
    # 白いブレーズ（額の白い筋）とマズル
    H("blaze", (0, -0.36, 0.20), (0.09, 0.12, 0.26), "white", outline=False)
    H("muzzle", (0, -0.40, -0.13), (0.34, 0.26, 0.22), "white")
    H("cheek_l", (-0.30, -0.28, -0.12), (0.20, 0.16, 0.16), "white", outline=False)
    H("cheek_r", (0.30, -0.28, -0.12), (0.20, 0.16, 0.16), "white", outline=False)
    # 鼻
    H("nose", (0, -0.64, -0.05), (0.10, 0.07, 0.075), "black", rough=0.2)
    H("nose_hl", (-0.03, -0.70, -0.02), (0.025, 0.012, 0.015), "white", outline=False, rough=0.1)

    # 耳（大きな立ち耳）
    ear_droop = {"oops": 35, "sleep": 25}.get(pose, 0)
    for side in (-1, 1):
        rot = (math.radians(-10 + ear_droop * 0.3), math.radians(side * (20 + ear_droop)), 0)
        e = cone(f"ear_{side}", (side * 0.33, 0.02, 0.52), 0.24, 0.52, "fur", rot=rot, scale=(1, 0.42, 1))
        e.parent = head
        ei = cone(f"ear_in_{side}", (side * 0.33, -0.07, 0.50), 0.16, 0.40, "inner_ear", rot=rot, scale=(1, 0.25, 1), outline=False)
        ei.parent = head

    # 目
    eye_y = -0.43
    eye_z = 0.08
    eye_x = 0.20
    if pose in ("happy", "celebrate", "cheer"):
        # にっこり閉じ目（^ ^）
        for side in (-1, 1):
            c = curve_line(f"eye_{side}", arc_points(side * eye_x, eye_y - 0.03, eye_z - 0.02, 0.085, 0.07, 20, 160), "black", bevel=0.022)
            c.parent = head
    elif pose == "sleep":
        for side in (-1, 1):
            c = curve_line(f"eye_{side}", arc_points(side * eye_x, eye_y - 0.03, eye_z + 0.04, 0.08, 0.05, 200, 340), "black", bevel=0.018)
            c.parent = head
    else:
        look = {"think": (0.03, 0.05), "oops": (-0.04, -0.01)}.get(pose, (0, 0))
        for side in (-1, 1):
            ex = side * eye_x + look[0]
            H(f"eye_{side}", (ex, eye_y, eye_z + look[1]), (0.085, 0.06, 0.10), "black", rough=0.15)
            H(f"eye_hl_{side}", (ex - 0.025, eye_y - 0.055, eye_z + look[1] + 0.04), (0.028, 0.012, 0.03), "white", outline=False, rough=0.1)
            H(f"eye_hl2_{side}", (ex + 0.02, eye_y - 0.055, eye_z + look[1] - 0.035), (0.012, 0.008, 0.012), "white", outline=False, rough=0.1)

    # まゆ（応援・考え中）
    if pose in ("cheer", "think", "safety"):
        for side in (-1, 1):
            ang0, ang1 = (200, 340) if pose != "think" else (190, 330)
            lift = 0.20 if pose != "think" or side < 0 else 0.25
            c = curve_line(f"brow_{side}", arc_points(side * eye_x, eye_y + 0.02, eye_z + lift, 0.07, 0.025, ang0 + 180, ang1 + 180), "fur_dark", bevel=0.016)
            c.parent = head

    # ほっぺの赤み
    for side in (-1, 1):
        H(f"blush_{side}", (side * 0.34, -0.36, -0.06), (0.07, 0.02, 0.045), "blush", outline=False)

    # 口
    if pose in ("happy", "celebrate", "cheer", "greet"):
        # 開いた口＋舌
        H("mouth", (0, -0.55, -0.24), (0.13, 0.08, 0.10), "black", rough=0.4)
        H("tongue", (0, -0.585, -0.29), (0.09, 0.06, 0.07), "pink", outline=False, rough=0.35)
    elif pose == "oops":
        c = curve_line("mouth", [(-0.07, -0.60, -0.22), (-0.02, -0.61, -0.19), (0.03, -0.61, -0.22), (0.08, -0.60, -0.19)], "black", bevel=0.014)
        c.parent = head
    else:
        # ω形の口
        pts = arc_points(-0.055, -0.61, -0.17, 0.055, 0.05, 180, 360, 10) + arc_points(0.055, -0.61, -0.17, 0.055, 0.05, 180, 360, 10)
        c = curve_line("mouth", pts, "black", bevel=0.013)
        c.parent = head

    # ヘルメット（安全ポーズ）
    if pose == "safety":
        bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=24, location=(0, 0, 0))
        hm = bpy.context.active_object
        hm.name = "helmet"
        # 下半分を削除
        bpy.ops.object.mode_set(mode="EDIT")
        bpy.ops.mesh.select_all(action="DESELECT")
        bpy.ops.object.mode_set(mode="OBJECT")
        for v in hm.data.vertices:
            v.select = v.co.z < -0.05
        bpy.ops.object.mode_set(mode="EDIT")
        bpy.ops.mesh.delete(type="VERT")
        bpy.ops.object.mode_set(mode="OBJECT")
        hm.scale = (0.60, 0.56, 0.42)
        hm.location = (0, 0.02, 0.18)
        hm.data.materials.append(mat("helmet", COL["helmet"], rough=0.3, coat=0.6))
        for p in hm.data.polygons:
            p.use_smooth = True
        sol = hm.modifiers.new("Thick", "SOLIDIFY")
        sol.thickness = 0.04
        add_outline(hm, 0.012)
        hm.parent = head
        brim = cylinder("brim", (0, -0.06, 0.18), 0.66, 0.035, "helmet", parent=None)
        brim.scale = (1.0, 0.95, 1.0)
        brim.parent = head
        ridge = ellipsoid("ridge", (0, 0.02, 0.60), (0.08, 0.50, 0.06), "helmet", outline=False)
        ridge.parent = head

    # 演出
    if pose == "celebrate":
        import random
        random.seed(7)
        for i in range(26):
            a = random.uniform(0, math.tau)
            r = random.uniform(0.9, 1.6)
            z = random.uniform(0.6, 2.4)
            colr = COL["confetti"][i % 5]
            bpy.ops.mesh.primitive_cube_add(size=0.07, location=(math.cos(a) * r, -0.3 + math.sin(a) * 0.5, z),
                                            rotation=(random.random() * 3, random.random() * 3, random.random() * 3))
            cf = bpy.context.active_object
            cf.scale = (1, 0.25, 0.6)
            cf.data.materials.append(mat(f"cf{i % 5}", colr, rough=0.4, emission=0.3))
    if pose == "cheer":
        # 小さな旗（ティール）
        flag_pole = cylinder("pole", (0.62, -0.66, body_z + 0.95), 0.02, 0.9, "white", rot=(0, math.radians(-10), 0), outline=False)
        bpy.ops.mesh.primitive_plane_add(size=0.4, location=(0.84, -0.66, body_z + 1.25), rotation=(math.radians(90), 0, 0))
        fl = bpy.context.active_object
        fl.scale = (1.0, 0.65, 1)
        fl.data.materials.append(mat("scarf", COL["scarf"]))
        sol = fl.modifiers.new("T", "SOLIDIFY")
        sol.thickness = 0.02
    if pose == "sleep":
        for i, (dx, dz, s) in enumerate(((0.75, 1.25, 0.07), (0.98, 1.48, 0.095), (1.25, 1.76, 0.12))):
            pts = [(dx - s, -0.9, dz + s), (dx + s, -0.9, dz + s), (dx - s, -0.9, dz - s), (dx + s, -0.9, dz - s)]
            curve_line(f"z{i}", pts, "scarf", bevel=0.022)
    if pose == "oops":
        ellipsoid("sweat", (0.50, -0.80, head_z + 0.26), (0.08, 0.05, 0.12), "sweat", outline=True, rough=0.1)
    if pose == "think":
        for i, (dx, dz, s) in enumerate(((0.62, 1.55, 0.05), (0.78, 1.72, 0.07), (0.98, 1.92, 0.10))):
            ellipsoid(f"bubble{i}", (dx, -0.6, head_z + dz - 1.0), (s, s * 0.6, s), "white", outline=True)
    return root


def setup_scene():
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    sc.cycles.device = "CPU"
    sc.cycles.samples = SAMPLES
    sc.cycles.use_denoising = True
    # 輪郭の透明シェルが多層に重なるため、透明バウンス上限を引き上げる
    sc.cycles.transparent_max_bounces = 128
    sc.cycles.max_bounces = 8
    sc.render.film_transparent = True
    sc.render.resolution_x = SIZE
    sc.render.resolution_y = SIZE
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGBA"
    sc.view_settings.view_transform = "Standard"
    # Freestyleでマンガ風の輪郭線を描く
    sc.render.use_freestyle = True
    sc.render.line_thickness_mode = "ABSOLUTE"
    sc.render.line_thickness = max(1.2, SIZE / 260)
    vl = sc.view_layers[0]
    vl.use_freestyle = True
    fs = vl.freestyle_settings
    fs.crease_angle = math.radians(120)
    ls = fs.linesets[0] if fs.linesets else fs.linesets.new("lines")
    ls.select_silhouette = True
    ls.select_border = True
    ls.select_crease = False
    if ls.linestyle is None:
        ls.linestyle = bpy.data.linestyles.new("tetsu_line")
    ls.linestyle.color = (0.20, 0.10, 0.05)
    ls.linestyle.thickness = 1.0
    sc.view_settings.look = "None"

    world = bpy.data.worlds.new("w")
    sc.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs[0].default_value = (0.95, 0.93, 0.90, 1)
    world.node_tree.nodes["Background"].inputs[1].default_value = 0.7

    cam_data = bpy.data.cameras.new("cam")
    cam_data.lens = 60
    cam = bpy.data.objects.new("cam", cam_data)
    sc.collection.objects.link(cam)
    cam.location = (2.2, -6.2, 2.3)
    target = Vector((0.05, -0.15, 0.95))
    cam.rotation_euler = (target - cam.location).to_track_quat("-Z", "Y").to_euler()
    sc.camera = cam

    def light(name, kind, loc, energy, size=2.0, color=(1, 1, 1)):
        ld = bpy.data.lights.new(name, kind)
        ld.energy = energy
        ld.color = color
        if kind == "AREA":
            ld.size = size
        lo = bpy.data.objects.new(name, ld)
        lo.location = loc
        lo.rotation_euler = (Vector((0, 0, 0.8)) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
        sc.collection.objects.link(lo)

    light("key", "AREA", (3.5, -4.0, 5.0), 1100, 4.0, (1.0, 0.97, 0.92))
    light("fill", "AREA", (-4.0, -3.0, 2.5), 350, 5.0, (0.85, 0.9, 1.0))
    light("rim", "AREA", (-1.5, 4.0, 4.0), 550, 3.0, (1.0, 0.95, 0.85))


POSES = ["greet", "happy", "celebrate", "think", "cheer", "sleep", "safety", "oops", "icon"]


def render(pose: str):
    reset()
    _mats.clear()
    setup_scene()
    if pose == "icon":
        # アプリアイコン用：笑顔の顔のアップ
        build_corgi("happy")
        cam = bpy.context.scene.camera
        cam.data.lens = 85
        cam.location = (1.1, -5.2, 1.85)
        target = Vector((0.0, -0.62, 1.30))
        cam.rotation_euler = (target - cam.location).to_track_quat("-Z", "Y").to_euler()
    else:
        build_corgi(pose)
    OUT.mkdir(parents=True, exist_ok=True)
    bpy.context.scene.render.filepath = str(OUT / f"tetsu-{pose}.png")
    bpy.ops.render.render(write_still=True)
    print("rendered", pose)


if __name__ == "__main__":
    for p in POSES:
        if ONLY and p not in ONLY:
            continue
        render(p)
