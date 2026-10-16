"""
キャラクター共通のモデリング・レンダリング部品（Blender / bpy）。

- 形はプリミティブ（楕円体・カプセル・曲線）の組み合わせで作り、サブディビジョンでなめらかにする
- 質感は「ふわふわのぬいぐるみ」：起毛した布地（シーン＋細かい凹凸）に、短い毛（ヘアパーティクル）を密に生やす
- 目・鼻はつやのあるプラスチック、口は刺しゅう糸のようなつや消し
- 輪郭線は描かない。大きなエリアライト3灯で立体感を出す
"""
from __future__ import annotations

import math
import random
from pathlib import Path

import bpy
from mathutils import Euler, Vector

# ───────────── 共通カラー（リニア値） ─────────────
INK = (0.012, 0.011, 0.016, 1)
WHITE = (0.93, 0.90, 0.86, 1)
EYE_HL = (1.0, 1.0, 1.0, 1)
BLUSH = (1.0, 0.32, 0.36, 1)
TONGUE = (0.95, 0.24, 0.30, 1)
MOUTH = (0.20, 0.03, 0.04, 1)
BRAND = (0.85, 0.20, 0.04, 1)     # アプリのブランド（オレンジ）
TEAL = (0.0, 0.32, 0.27, 1)       # 保線（レール）カラー
CONFETTI = [(0.95, 0.25, 0.30, 1), (0.20, 0.55, 0.95, 1), (1.0, 0.75, 0.10, 1), (0.25, 0.75, 0.45, 1), (0.60, 0.40, 0.95, 1)]

_mats: dict[str, bpy.types.Material] = {}


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    _mats.clear()


def _plush(color, key):
    """ぬいぐるみの布地：起毛の光沢（シーン）と細かい凹凸。名前の末尾 -plush の素材には add_fuzz() で毛を生やす"""
    m = bpy.data.materials.new(key)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value = color
    b.inputs["Roughness"].default_value = 0.95
    b.inputs["Sheen Weight"].default_value = 1.0
    b.inputs["Sheen Roughness"].default_value = 0.35
    b.inputs["Sheen Tint"].default_value = (1, 0.97, 0.94, 1)
    noise = nt.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 180.0
    noise.inputs["Detail"].default_value = 10.0
    noise.inputs["Roughness"].default_value = 0.75
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.7
    bump.inputs["Distance"].default_value = 0.012
    nt.links.new(noise.outputs["Fac"], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], b.inputs["Normal"])
    return m


def mat(color, rough=0.62, sheen=0.25, emission=0.0, metallic=0.0, coat=0.0, name: str | None = None, fuzz=True):
    """素材。つやのない布の部分（rough > 0.3）は、既定でぬいぐるみの起毛素材にする"""
    plush = fuzz and rough > 0.3 and emission == 0 and metallic == 0
    key = name or f"m{tuple(round(c, 3) for c in color)}-{rough}-{sheen}-{emission}-{metallic}-{coat}{'-plush' if plush else ''}"
    if key in _mats:
        return _mats[key]
    if plush:
        _mats[key] = _plush(color, key)
        return _mats[key]
    m = bpy.data.materials.new(key)
    m.use_nodes = True
    b = m.node_tree.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value = color
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metallic
    if "Sheen Weight" in b.inputs:
        b.inputs["Sheen Weight"].default_value = sheen
        b.inputs["Sheen Roughness"].default_value = 0.6
    if "Coat Weight" in b.inputs:
        b.inputs["Coat Weight"].default_value = coat
    if emission > 0:
        b.inputs["Emission Color"].default_value = color
        b.inputs["Emission Strength"].default_value = emission
    _mats[key] = m
    return m


def thread(color):
    """刺しゅう糸（口・まゆ・縫い目）：つや消しで毛は生やさない"""
    return mat(color, rough=0.9, sheen=0.0, fuzz=False)


def glossy(color):
    """目・鼻などのツヤのある部分"""
    return mat(color, rough=0.12, sheen=0.0, coat=1.0)


def glow(color, strength=1.0):
    return mat(color, rough=0.3, sheen=0.0, emission=strength)


def _finish(o, material, parent=None, sub=2, smooth=True):
    o.data.materials.append(material)
    if smooth:
        for p in o.data.polygons:
            p.use_smooth = True
    if sub:
        m = o.modifiers.new("sub", "SUBSURF")
        m.levels = sub
        m.render_levels = sub
    if parent is not None:
        o.parent = parent
    return o


def empty(name, loc=(0, 0, 0), rot=(0, 0, 0), parent=None):
    o = bpy.data.objects.new(name, None)
    o.location = loc
    o.rotation_euler = [math.radians(a) for a in rot]
    bpy.context.collection.objects.link(o)
    if parent is not None:
        o.parent = parent
    return o


def ball(loc, scale, material, parent=None, rot=(0, 0, 0), sub=1, seg=32):
    """楕円体（loc/scale は親のローカル座標）"""
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=seg // 2, radius=1.0)
    o = bpy.context.active_object
    o.location = loc
    o.scale = scale if isinstance(scale, (tuple, list)) else (scale, scale, scale)
    o.rotation_euler = [math.radians(a) for a in rot]
    return _finish(o, material, parent, sub)


def capsule(p0, p1, r0, material, parent=None, r1=None, sub=1):
    """p0→p1 のカプセル（手足・しっぽ）。r1 で先端の太さを変えられる"""
    r1 = r0 if r1 is None else r1
    a, b = Vector(p0), Vector(p1)
    d = b - a
    length = d.length
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=1.0, depth=1.0)
    o = bpy.context.active_object
    # 先端側の半径を変える
    for v in o.data.vertices:
        t = v.co.z + 0.5
        rr = r0 * (1 - t) + r1 * t
        v.co.x *= rr
        v.co.y *= rr
        v.co.z *= length
    o.location = (a + b) / 2
    o.rotation_euler = d.to_track_quat("Z", "Y").to_euler()
    _finish(o, material, parent, sub)
    ball(tuple(a), r0, material, parent)
    ball(tuple(b), r1, material, parent)
    return o


def cone(loc, r, depth, material, parent=None, rot=(0, 0, 0), scale=(1, 1, 1), sub=2, tip=0.0):
    bpy.ops.mesh.primitive_cone_add(vertices=32, radius1=r, radius2=tip, depth=depth)
    o = bpy.context.active_object
    o.location = loc
    o.rotation_euler = [math.radians(a) for a in rot]
    o.scale = scale
    return _finish(o, material, parent, sub)


def torus(loc, major, minor, material, parent=None, rot=(0, 0, 0), scale=(1, 1, 1), sub=1):
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor, major_segments=48, minor_segments=16)
    o = bpy.context.active_object
    o.location = loc
    o.rotation_euler = [math.radians(a) for a in rot]
    o.scale = scale
    return _finish(o, material, parent, sub)


def box(loc, size, material, parent=None, rot=(0, 0, 0), bevel=0.3, sub=0):
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    o = bpy.context.active_object
    o.location = loc
    o.scale = size
    o.rotation_euler = [math.radians(a) for a in rot]
    o.data.materials.append(material)
    if bevel:
        bv = o.modifiers.new("bevel", "BEVEL")
        bv.width = min(size) * bevel
        bv.segments = 5
        bv.affect = "EDGES"
    for p in o.data.polygons:
        p.use_smooth = True
    if sub:
        m = o.modifiers.new("sub", "SUBSURF")
        m.levels = m.render_levels = sub
    if parent is not None:
        o.parent = parent
    return o


def line(points, material, bevel=0.02, parent=None, closed=False, poly=False):
    """太さのある線（目・口・まゆ）"""
    cu = bpy.data.curves.new("line", type="CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = bevel
    cu.bevel_resolution = 6
    cu.use_fill_caps = True
    sp = cu.splines.new("POLY" if poly else "NURBS")
    sp.points.add(len(points) - 1)
    for i, p in enumerate(points):
        sp.points[i].co = (p[0], p[1], p[2], 1)
    if not poly:
        sp.use_endpoint_u = True
        sp.order_u = min(4, len(points))
    sp.use_cyclic_u = closed
    o = bpy.data.objects.new("line", cu)
    bpy.context.collection.objects.link(o)
    o.data.materials.append(material)
    if parent is not None:
        o.parent = parent
    return o


def arc(cx, y, cz, rx, rz, a0, a1, n=12, depth=0.0):
    """XZ平面（顔の正面）上の弧。depth で両端をうしろへ曲げ、顔の丸みに沿わせる"""
    pts = []
    for i in range(n + 1):
        t = i / n
        a = math.radians(a0 + (a1 - a0) * t)
        pts.append((cx + rx * math.cos(a), y + depth * (2 * t - 1) ** 2, cz + rz * math.sin(a)))
    return pts


def sparkle_eye(parent, x, y, z, w, h, look=(0.0, 0.0), iris=None):
    """キラキラした大きな目（黒目＋ハイライト2つ）。iris を渡すと虹彩の色つき（黒い毛の犬でも目が見えるように）"""
    ball((x + look[0], y, z + look[1]), (w, w * 0.55, h), glossy(iris or INK), parent)
    if iris is not None:
        ball((x + look[0], y - w * 0.12, z + look[1] - h * 0.05), (w * 0.55, w * 0.48, h * 0.58), glossy(INK), parent)
    hl = glow(EYE_HL, 2.0)
    ball((x + look[0] - w * 0.30, y - w * 0.52, z + look[1] + h * 0.35), (w * 0.34, w * 0.12, h * 0.30), hl, parent)
    ball((x + look[0] + w * 0.30, y - w * 0.52, z + look[1] - h * 0.40), (w * 0.15, w * 0.08, h * 0.13), hl, parent)


def happy_eye(parent, x, y, z, w, h=None, bevel=0.024):
    """にっこり閉じ目（∩）"""
    h = h or w * 0.75
    return line(arc(x, y, z - h * 0.4, w, h, 10, 170, depth=0.02), glossy(INK), bevel, parent)


def closed_eye(parent, x, y, z, w, bevel=0.02):
    """眠り目（∪）"""
    return line(arc(x, y, z + w * 0.3, w, w * 0.55, 190, 350, depth=0.02), glossy(INK), bevel, parent)


def confetti(center=(0, 0, 1.2), n=28, seed=7, spread=(1.7, 0.6, 1.4)):
    random.seed(seed)
    for i in range(n):
        a = random.uniform(0, math.tau)
        r = random.uniform(0.55, 1.0)
        loc = (center[0] + math.cos(a) * r * spread[0], center[1] + random.uniform(-1, 1) * spread[1],
               center[2] + random.uniform(-0.2, 1.0) * spread[2])
        box(loc, (0.10, 0.03, 0.06), glow(CONFETTI[i % 5], 0.35), rot=(random.uniform(0, 180), random.uniform(0, 180), random.uniform(0, 180)), bevel=0.2)


def stars(points, color=(1.0, 0.78, 0.15, 1), size=0.13):
    for (x, y, z), s in points:
        star(x, y, z, size * s, color)


def star(x, y, z, r, color):
    verts = []
    for i in range(10):
        a = math.pi / 2 + i * math.pi / 5
        rr = r if i % 2 == 0 else r * 0.48
        verts.append((math.cos(a) * rr, math.sin(a) * rr))
    me = bpy.data.meshes.new("star")
    vs = [(vx, 0, vz) for vx, vz in verts] + [(0, -r * 0.25, 0), (0, r * 0.25, 0)]
    faces = []
    for i in range(10):
        j = (i + 1) % 10
        faces.append((i, j, 10))
        faces.append((j, i, 11))
    me.from_pydata(vs, [], faces)
    o = bpy.data.objects.new("star", me)
    bpy.context.collection.objects.link(o)
    o.location = (x, y, z)
    o.rotation_euler = (0, 0, math.radians(-15))
    o.data.materials.append(glow(color, 0.6))
    bv = o.modifiers.new("b", "BEVEL")
    bv.width = r * 0.08
    bv.segments = 3
    return o


def zzz(points, material):
    for (x, y, z), s in points:
        line([(x - s, y, z + s), (x + s, y, z + s), (x - s, y, z - s), (x + s, y, z - s)], material, bevel=0.028 * s / 0.1, poly=True)


def sweat(loc, scale=1.0):
    c = (0.30, 0.65, 1.0, 1)
    m = mat(c, rough=0.08, sheen=0, coat=1.0)
    ball((loc[0], loc[1], loc[2] - 0.03 * scale), (0.075 * scale, 0.05 * scale, 0.075 * scale), m)
    cone((loc[0], loc[1], loc[2] + 0.05 * scale), 0.073 * scale, 0.14 * scale, m, sub=1)


def bubbles(points):
    m = mat(WHITE, rough=0.5, sheen=0.0, fuzz=False)
    for (x, y, z), r in points:
        ball((x, y, z), (r, r * 0.6, r), m)


# ───────────── 小物 ─────────────
def glasses(parent, x, y, z, r, color=(0.06, 0.05, 0.05, 1)):
    """丸メガネ（左右のレンズ枠とブリッジ）"""
    m = mat(color, rough=0.25, sheen=0.0, metallic=0.6)
    for s in (-1, 1):
        torus((s * x, y, z), r, r * 0.11, m, parent, rot=(90, 0, 0))
    capsule((-x + r * 0.95, y - 0.01, z + r * 0.15), (x - r * 0.95, y - 0.01, z + r * 0.15), r * 0.09, m, parent)


def add_fuzz(length=0.03, density=3000, radius=0.004, curl=0.0):
    """ぬいぐるみの起毛：起毛素材（-plush）のメッシュに、短い毛（ヘアパーティクル）を密に生やす"""
    for o in list(bpy.context.scene.objects):
        if o.type != "MESH" or not o.data.materials:
            continue
        m = o.data.materials[0]
        if m is None or not m.name.endswith("-plush"):
            continue
        dims = o.dimensions
        area = max(0.02, (dims.x * dims.y + dims.y * dims.z + dims.x * dims.z) * 2 * 0.52)
        mod = o.modifiers.new("fuzz", "PARTICLE_SYSTEM")
        st = mod.particle_system.settings
        st.type = "HAIR"
        st.count = max(80, int(area * density))
        st.hair_length = length
        st.use_advanced_hair = True
        st.brownian_factor = length * 0.25
        st.factor_random = length * 0.3
        st.child_type = "INTERPOLATED"
        st.child_percent = 6
        st.rendered_child_count = 6
        st.child_length = 1.0
        st.roughness_2 = length * 0.4
        st.root_radius = 1.0
        st.tip_radius = 0.1
        st.radius_scale = radius
        st.material = 1
        if curl > 0:
            # トイプードルのくるくる毛
            st.kink = "CURL"
            st.kink_amplitude = curl
            st.kink_frequency = 7.0
            st.kink_shape = 0.0


def necktie(parent, top, length, width, color):
    m = mat(color, rough=0.45, sheen=0.1)
    x, y, z = top
    ball((x, y, z), (width * 0.55, width * 0.35, width * 0.45), m, parent)
    verts = [(-width * 0.45, 0, -width * 0.2), (width * 0.45, 0, -width * 0.2), (width * 0.65, 0, -length * 0.85),
             (0, 0, -length), (-width * 0.65, 0, -length * 0.85)]
    me = bpy.data.meshes.new("tie")
    me.from_pydata(verts, [], [(0, 1, 2, 3, 4)])
    o = bpy.data.objects.new("tie", me)
    bpy.context.collection.objects.link(o)
    o.location = (x, y - 0.01, z)
    sol = o.modifiers.new("s", "SOLIDIFY")
    sol.thickness = 0.04
    bv = o.modifiers.new("b", "BEVEL")
    bv.width = 0.015
    bv.segments = 3
    o.data.materials.append(m)
    if parent is not None:
        o.parent = parent
    return o


# ───────────── シーン ─────────────
def setup_scene(size=640, samples=64, cam_loc=(1.4, -7.4, 2.5), target=(0.0, 0.0, 1.10), lens=80, shadow=False):
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    sc.cycles.device = "CPU"
    sc.cycles.samples = samples
    sc.cycles.use_denoising = True
    sc.cycles.max_bounces = 8
    sc.render.film_transparent = True
    sc.render.resolution_x = size
    sc.render.resolution_y = size
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGBA"
    sc.view_settings.view_transform = "Standard"
    sc.view_settings.look = "None"
    sc.view_settings.exposure = 0.0

    world = bpy.data.worlds.new("w")
    sc.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs[0].default_value = (0.96, 0.95, 0.93, 1)
    bg.inputs[1].default_value = 0.45

    cam_data = bpy.data.cameras.new("cam")
    cam_data.lens = lens
    cam = bpy.data.objects.new("cam", cam_data)
    sc.collection.objects.link(cam)
    cam.location = cam_loc
    cam.rotation_euler = (Vector(target) - Vector(cam_loc)).to_track_quat("-Z", "Y").to_euler()
    sc.camera = cam

    def light(kind, loc, energy, size_, color):
        ld = bpy.data.lights.new("l", kind)
        ld.energy = energy
        ld.color = color
        ld.size = size_
        lo = bpy.data.objects.new("l", ld)
        lo.location = loc
        lo.rotation_euler = (Vector((0, 0, 1.0)) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
        sc.collection.objects.link(lo)

    light("AREA", (3.0, -4.5, 5.5), 520, 5.0, (1.0, 0.96, 0.90))    # キー（暖色）
    light("AREA", (-4.5, -3.5, 2.0), 170, 6.0, (0.86, 0.92, 1.0))   # フィル（寒色）
    light("AREA", (-1.0, 4.5, 4.5), 420, 3.0, (1.0, 0.97, 0.92))    # リム

    if shadow:
        bpy.ops.mesh.primitive_plane_add(size=12, location=(0, 0, 0))
        pl = bpy.context.active_object
        pl.is_shadow_catcher = True
    return cam


def aim(cam, loc, target, lens=None):
    cam.location = loc
    cam.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    if lens:
        cam.data.lens = lens


def render(path: Path):
    path.parent.mkdir(parents=True, exist_ok=True)
    bpy.context.scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)
    print("rendered", path.name, flush=True)


def euler(deg):
    return Euler([math.radians(a) for a in deg])
