extends Node3D
## こもれびの村 in HD-2D: the web version's tile map rebuilt as a lit diorama with billboard characters.
## Look references: Octopath Traveler (pixel sprites in a lit 3D set, tilt-shift) and the Link's Awakening remake (toy-like town).

const WALKABLE := [",", "f", "E"]
const SPEED := 3.6
const HERO_R := 0.26
const DIR_ROW := [3, 2, 0, 1]  # dir 0 up,1 right,2 down,3 left -> sheet rows down,left,right,up
const STEP_COLS := [0, 1, 2, 1]
const PAD := 16  # splat map margin in tiles around the village
const SPLAT_RES := 3  # splat pixels per tile
const BAKED_SPLAT := "res://assets/baked/village_splat.png"

var rows: Array
var W := 0
var H := 0
var hero_pos := Vector2(11, 13)
var hero_dir := 0
var _start := Vector2(-1, -1)

var hero: Sprite3D
var cats: Array[Sprite3D] = []
var trail: Array[Vector2] = []
var npcs: Array = []
var camera: Camera3D
var dialog: DialogUI
var touch: TouchControls
var hud_hp: ProgressBar
var hud_mp: ProgressBar
var hud_label: Label
var hint3d: Label3D
var lamps: Array[OmniLight3D] = []
var spinners: Array[Node3D] = []
var butterflies: Array = []
var busy := false
var walk_time := 0.0
var _rng := RandomNumberGenerator.new()
var _mats := {}
var _ao: PackedFloat32Array
var _splat: Image
var _foliage: Art.Foliage
var bake_mode := false
var _splat_baked := false


func setup(args: Dictionary) -> void:
	if args.has("pos"):
		_start = args.pos


func _ready() -> void:
	_rng.seed = 7
	var v: Dictionary = Game.world.village
	load_map()
	hero_pos = _start if _start.x >= 0 else Vector2(12, 9.4)
	_foliage = Art.Foliage.new(11)
	_build_environment()
	_build_splat()
	_build_walls_and_houses()
	_build_props()
	_build_backdrop()
	_build_vegetation()
	_build_ground()
	_foliage.build(self)
	_build_life()
	_build_characters(v.npcs)
	_build_ui()
	Game.music("village")
	_place_camera(true)


func load_map() -> void:
	rows = Game.world.village.rows
	H = rows.size()
	W = rows[0].length()


# ================================================================ helpers

func _at(x: int, y: int) -> String:
	if y < 0 or y >= H or x < 0 or x >= W:
		return "#"
	return rows[y][x]


func _mat(key: String, maker: Callable) -> Material:
	if not _mats.has(key):
		_mats[key] = maker.call()
	return _mats[key]


func _stone() -> Material: return _mat("stone", func(): return Art.pixel_mat(Art.tex("stonewall"), Color(1, 1, 1), Vector3(0.5, 0.5, 0.5)))
func _wood() -> Material: return _mat("wood", func(): return Art.pixel_mat(Art.tex("planks"), Color(1, 1, 1), Vector3(0.6, 0.6, 0.6)))
func _dark_wood() -> Material: return _mat("dwood", func(): return Art.pixel_mat(Art.tex("planks"), Color(0.55, 0.45, 0.4), Vector3(0.6, 0.6, 0.6)))
func _plaster() -> Material: return _mat("plaster", func(): return Art.pixel_mat(Art.tex("plaster"), Color(1, 1, 1), Vector3(0.4, 0.4, 0.4)))
func _iron() -> Material: return _mat("iron", func(): return Art.pixel_mat(Art.tex("plaster"), Color(0.16, 0.16, 0.2), Vector3.ONE, 0.5))


func _flat_mat(color: Color, rough := 0.85) -> Material:
	return _mat("c" + color.to_html(), func():
		var m := StandardMaterial3D.new()
		m.albedo_color = color
		m.roughness = rough
		return m)


func _mesh(mesh: Mesh, mat: Material, pos: Vector3, rot := Vector3.ZERO, parent: Node = self, shadow := true) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	mi.mesh = mesh
	mi.material_override = mat
	mi.position = pos
	mi.rotation = rot
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON if shadow else GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	parent.add_child(mi)
	return mi


func _box(size: Vector3, mat: Material, pos: Vector3, rot := Vector3.ZERO, parent: Node = self) -> MeshInstance3D:
	var b := BoxMesh.new()
	b.size = size
	return _mesh(b, mat, pos, rot, parent)


func _cyl(r_top: float, r_bottom: float, h: float, mat: Material, pos: Vector3, seg := 14, parent: Node = self) -> MeshInstance3D:
	var c := CylinderMesh.new()
	c.top_radius = r_top
	c.bottom_radius = r_bottom
	c.height = h
	c.radial_segments = seg
	c.rings = 1
	return _mesh(c, mat, pos, Vector3.ZERO, parent)


func _sphere(r: float, mat: Material, pos: Vector3, squash := 1.0, seg := 10) -> MeshInstance3D:
	var s := SphereMesh.new()
	s.radius = r
	s.height = r * 2.0 * squash
	s.radial_segments = seg
	s.rings = maxi(4, seg / 2)
	return _mesh(s, mat, pos)


func _quad(size: Vector2) -> QuadMesh:
	var q := QuadMesh.new()
	q.size = size
	return q


func _flat(size: Vector2) -> PlaneMesh:
	var p := PlaneMesh.new()
	p.size = size
	return p


func _radial_tex(inner: Color, outer: Color) -> GradientTexture2D:
	return Art.soft_tex(inner, outer)


# ================================================================ lighting

func _build_environment() -> void:
	var sun := Art.environment(self, {
		"sky_top": Color("4a7fc0"), "horizon": Color("f4d6a8"), "ambient": Color("6f86c0"), "ambient_energy": 0.42,
		"sun": Color("ffd6a0"), "sun_energy": 1.25, "fog": Color("b9c2b0"), "fog_density": 0.006, "exposure": 0.92})
	# Late afternoon sun from the west and slightly in front, so shadows fall back-right like a stage set.
	var center := Vector3(W / 2.0, 0, H / 2.0)
	sun.look_at_from_position(center + Vector3(-10, 9, 4), center)
	camera = Camera3D.new()
	camera.fov = 24.0
	camera.near = 0.5
	camera.far = 120.0
	add_child(camera)
	Art.finishing_pass(self, {"blur_px": 4.5, "band": 0.2, "focus_y": 0.55})


# ================================================================ ground

func _ground_kind(x: int, y: int) -> String:
	var c := _at(x, y)
	if c in ["f", "h", "p", "t", "F"]:
		return "grass"
	if c == "E" or (y >= 12 and x >= 10 and x <= 13):
		return "cobble"
	if x >= 3 and x <= 20 and y >= 5 and y <= 11:
		return "cobble"
	if y == 5 and (_at(x, 4) == "d"):
		return "cobble"
	if c in ["c", "q", "b", "k"] or _at(x, y - 1) == "c":
		return "dirt"
	return "grass"


## Soft splat map (r cobble, g dirt, a ambient occlusion) covering the village plus a meadow margin.
func _build_splat() -> void:
	var sw := (W + PAD * 2) * SPLAT_RES
	var sh := (H + PAD * 2) * SPLAT_RES
	_ao = PackedFloat32Array()
	_ao.resize(sw * sh)
	_ao.fill(1.0)
	var cob := PackedFloat32Array()
	var dirt := PackedFloat32Array()
	cob.resize(sw * sh)
	dirt.resize(sw * sh)
	# The blurred map and its occlusion are slow to compute in the web build; Game.bake() stores them.
	if not bake_mode and ResourceLoader.exists(BAKED_SPLAT):
		_splat = (load(BAKED_SPLAT) as Texture2D).get_image()
		if _splat.is_compressed():
			_splat.decompress()
		_splat.convert(Image.FORMAT_RGBA8)
		for py in sh:
			for px in sw:
				var col := _splat.get_pixel(px, py)
				var i := py * sw + px
				cob[i] = col.r
				dirt[i] = col.g
				_ao[i] = col.a
		_splat_baked = true
		_splat.set_meta("cob", cob)
		_splat.set_meta("dirt", dirt)
		return
	_splat = Image.create(sw, sh, false, Image.FORMAT_RGBA8)
	for py in sh:
		for px in sw:
			var tx := int(floor(float(px) / SPLAT_RES)) - PAD
			var ty := int(floor(float(py) / SPLAT_RES)) - PAD
			var i := py * sw + px
			if tx >= 0 and ty >= 0 and tx < W and ty < H:
				var k := _ground_kind(tx, ty)
				cob[i] = 1.0 if k == "cobble" else 0.0
				dirt[i] = 1.0 if k == "dirt" else 0.0
			elif ty >= H and absf(tx - 11.5) < 2.2 + sin(ty * 0.4) * 0.6:
				dirt[i] = 1.0  # road winding south from the gate
	cob = _blur(cob, sw, sh)
	dirt = _blur(dirt, sw, sh)
	_splat.set_meta("cob", cob)
	_splat.set_meta("dirt", dirt)


## Separable 5-tap box blur.
func _blur(src: PackedFloat32Array, w: int, h: int) -> PackedFloat32Array:
	var tmp := PackedFloat32Array()
	tmp.resize(src.size())
	for y in h:
		var row := y * w
		for x in w:
			var s := 0.0
			for dx in range(maxi(0, x - 2), mini(w, x + 3)):
				s += src[row + dx]
			tmp[row + x] = s / (mini(w, x + 3) - maxi(0, x - 2))
	var out := PackedFloat32Array()
	out.resize(src.size())
	for y in h:
		for x in w:
			var s := 0.0
			for dy in range(maxi(0, y - 2), mini(h, y + 3)):
				s += tmp[dy * w + x]
			out[y * w + x] = s / (mini(h, y + 3) - maxi(0, y - 2))
	return out


## Darkens the ground around a footprint so props sit in the world instead of floating on it.
func _occlude(center: Vector2, half: Vector2, reach: float, strength: float) -> void:
	if _splat_baked:
		return
	var sw := _splat.get_width()
	var sh := _splat.get_height()
	var lo := (center - half - Vector2(reach, reach) + Vector2(PAD + 0.5, PAD + 0.5)) * SPLAT_RES
	var hi := (center + half + Vector2(reach, reach) + Vector2(PAD + 0.5, PAD + 0.5)) * SPLAT_RES
	for py in range(maxi(0, int(lo.y)), mini(sh, int(hi.y) + 1)):
		for px in range(maxi(0, int(lo.x)), mini(sw, int(hi.x) + 1)):
			var w := Vector2(px, py) / SPLAT_RES - Vector2(PAD + 0.5, PAD + 0.5)
			var d := (w - center).abs() - half
			var dist := Vector2(maxf(d.x, 0.0), maxf(d.y, 0.0)).length()
			var k := clampf(1.0 - dist / reach, 0.0, 1.0)
			var i := py * sw + px
			_ao[i] = minf(_ao[i], 1.0 - strength * k * k)


func _build_ground() -> void:
	var cob: PackedFloat32Array = _splat.get_meta("cob")
	var dirt: PackedFloat32Array = _splat.get_meta("dirt")
	var sw := _splat.get_width()
	if not _splat_baked:
		for py in _splat.get_height():
			for px in sw:
				var i := py * sw + px
				_splat.set_pixel(px, py, Color(cob[i], dirt[i], 0.0, _ao[i]))
	if bake_mode:
		_splat.save_png(ProjectSettings.globalize_path(BAKED_SPLAT))
	var size := Vector2(W + PAD * 2, H + PAD * 2)
	var mat := Art.shader_mat("res://shaders/ground.gdshader", {
		"splat": ImageTexture.create_from_image(_splat), "tex_grass": Art.tex("meadow"), "tex_cobble": Art.tex("cobble"),
		"tex_dirt": Art.tex("dirt"), "map_origin": Vector2(-PAD - 0.5, -PAD - 0.5), "map_size": size, "tile_scale": 0.5})
	var plane := PlaneMesh.new()
	plane.size = Vector2(160, 160)
	var g := _mesh(plane, mat, Vector3(W / 2.0, 0, H / 2.0), Vector3.ZERO, self, false)
	g.name = "Ground"


# ================================================================ architecture

func _build_walls_and_houses() -> void:
	var house_cells := {}
	var houses := []
	for y in H:
		for x in W:
			if _at(x, y) != "r" or house_cells.has(Vector2i(x, y)):
				continue
			var x1 := x
			while _at(x1 + 1, y) == "r":
				x1 += 1
			var ye := y
			while true:
				var ok := true
				for k in range(x, x1 + 1):
					if not (_at(k, ye + 1) in ["#", "d"]):
						ok = false
				if not ok:
					break
				ye += 1
			for yy in range(y, ye + 1):
				for xx in range(x, x1 + 1):
					house_cells[Vector2i(xx, yy)] = true
			var doors := []
			for xx in range(x, x1 + 1):
				if _at(xx, ye) == "d":
					doors.append(xx)
			houses.append({"x0": x, "x1": x1, "z0": y, "z1": ye, "doors": doors})
	var cap := _mat("cap", func(): return Art.pixel_mat(Art.tex("stonewall"), Color(1.15, 1.12, 1.05), Vector3(0.5, 0.5, 0.5)))
	for y in H:
		for x in W:
			if _at(x, y) != "#" or house_cells.has(Vector2i(x, y)):
				continue
			var h := 0.45 if y == H - 1 else 0.7
			_box(Vector3(1.0, h, 0.9), _stone(), Vector3(x, h / 2.0, y))
			_box(Vector3(1.02, 0.1, 1.0), cap, Vector3(x, h + 0.05, y))
			_occlude(Vector2(x, y), Vector2(0.5, 0.45), 0.6, 0.45)
	for i in houses.size():
		_house(houses[i], i)
	_gate(Vector2(11.5, H - 1))


## Two-storey half-timbered house with jettied upper floor, tiled roof, lit windows and a chimney.
func _house(hs: Dictionary, idx: int) -> void:
	var x0: float = hs.x0
	var x1: float = hs.x1
	var z0: float = hs.z0
	var z1: float = hs.z1
	var w := x1 - x0 + 0.8
	var d := z1 - z0 + 0.7
	var cx := (x0 + x1) / 2.0
	var cz := (z0 + z1) / 2.0 - 0.1
	var front := cz + d / 2.0
	_occlude(Vector2(cx, cz), Vector2(w / 2.0, d / 2.0), 1.1, 0.55)
	# Stone plinth and ground floor.
	_box(Vector3(w + 0.12, 0.42, d + 0.12), _stone(), Vector3(cx, 0.21, cz))
	_box(Vector3(w, 1.15, d), _plaster(), Vector3(cx, 0.42 + 0.575, cz))
	# Jettied upper floor overhangs the street.
	var up_d := d + 0.3
	var up_z := cz + 0.15
	_box(Vector3(w + 0.2, 1.1, up_d), _plaster(), Vector3(cx, 1.57 + 0.55, up_z))
	var beam := _dark_wood()
	var up_front := up_z + up_d / 2.0
	for yb: float in [1.57, 2.67]:
		_box(Vector3(w + 0.26, 0.12, 0.1), beam, Vector3(cx, yb, up_front + 0.02))
	_box(Vector3(w + 0.04, 0.1, 0.08), beam, Vector3(cx, 1.5, front + 0.02))
	var posts := int(round(w / 1.15)) + 1
	for k in posts:
		var px := cx - (w + 0.1) / 2.0 + k * (w + 0.1) / (posts - 1)
		_box(Vector3(0.11, 1.1, 0.08), beam, Vector3(px, 2.12, up_front + 0.03))
		if k < posts - 1:
			var span := (w + 0.1) / (posts - 1)
			var diag := Vector2(span, 1.0).length()
			var ang := atan2(1.0, span) * (1 if k % 2 == 0 else -1)
			_box(Vector3(diag, 0.07, 0.05), beam, Vector3(px + span / 2.0, 2.12, up_front + 0.03), Vector3(0, 0, ang))
	for side: int in [-1, 1]:
		_box(Vector3(0.12, 1.15, 0.12), beam, Vector3(cx + side * w / 2.0, 0.99, front))
	# Roof: plaster gable core plus two tiled slopes with overhang and a ridge beam.
	var rise := 1.25
	var roof_base := 2.72
	var gable := PrismMesh.new()
	gable.size = Vector3(up_d, rise, w + 0.2)
	_mesh(gable, _plaster(), Vector3(cx, roof_base + rise / 2.0, up_z), Vector3(0, PI / 2.0, 0))
	var roof_col: Color = [Color("4f9a76"), Color("c46a45"), Color("5a7fb0")][idx % 3]
	var tiles := _mat("roof%d" % idx, func():
		var m := StandardMaterial3D.new()
		m.albedo_texture = Art.tex("roof")
		m.albedo_color = roof_col
		m.texture_filter = BaseMaterial3D.TEXTURE_FILTER_NEAREST_WITH_MIPMAPS
		m.uv1_scale = Vector3((w + 0.8) * 1.0, 2.2, 1)
		m.roughness = 0.8
		m.cull_mode = BaseMaterial3D.CULL_DISABLED
		return m)
	var half := up_d / 2.0 + 0.35
	var slope := Vector2(half, rise + 0.1).length()
	var tilt := atan2(rise + 0.1, half)
	for side: int in [-1, 1]:
		var plane := _flat(Vector2(w + 0.8, slope))
		var mid := Vector3(cx, roof_base + rise / 2.0 + 0.02, up_z + side * half / 2.0)
		_mesh(plane, tiles, mid, Vector3(side * tilt, 0, 0))
		_box(Vector3(w + 0.8, 0.07, 0.08), beam, Vector3(cx, roof_base - 0.02, up_z + side * (half - 0.02)))
	_box(Vector3(w + 0.9, 0.14, 0.16), _mat("ridge", func(): return Art.pixel_mat(Art.tex("roof"), roof_col.darkened(0.25), Vector3.ONE)), Vector3(cx, roof_base + rise + 0.08, up_z))
	# Chimney with drifting smoke.
	var chim := Vector3(x1 - 0.5, roof_base + rise * 0.55, up_z - 0.45)
	_box(Vector3(0.38, 1.25, 0.38), _stone(), chim + Vector3(0, 0.35, 0))
	_box(Vector3(0.46, 0.1, 0.46), _dark_wood(), chim + Vector3(0, 0.98, 0))
	_smoke(chim + Vector3(0, 1.1, 0))
	# Doors with a small awning and lantern.
	for dx in hs.doors:
		_box(Vector3(0.7, 1.05, 0.06), _mat("door", func(): return Art.pixel_mat(Art.tex("planks"), Color(0.72, 0.5, 0.36), Vector3(0.8, 0.8, 0.8))), Vector3(dx, 0.42 + 0.525, front + 0.03))
		_box(Vector3(0.86, 0.1, 0.1), beam, Vector3(dx, 1.5, front + 0.06))
		for sx: float in [-0.4, 0.4]:
			_box(Vector3(0.09, 1.08, 0.1), beam, Vector3(dx + sx, 0.96, front + 0.06))
		var awning := PrismMesh.new()
		awning.size = Vector3(1.0, 0.25, 0.42)
		_mesh(awning, tiles, Vector3(dx, 1.72, front + 0.2))
		_lantern(Vector3(dx + 0.55, 1.35, front + 0.2), idx == 0)
		_occlude(Vector2(dx, front + 0.4), Vector2(0.35, 0.2), 0.4, 0.25)
	# Windows: lit panes behind frames, shutters and flower boxes.
	var shutter_col: Color = [Color("3f6fa0"), Color("4f8a4f"), Color("a64b3c")][idx % 3]
	for k in 3:
		var wx := cx - w / 2.0 + w * (k + 0.5) / 3.0
		_window(Vector3(wx, 2.12, up_front + 0.04), shutter_col)
	for wx: float in [x0 + 0.1, x1 - 0.1]:
		var near_door := false
		for dx in hs.doors:
			if absf(wx - dx) < 0.9:
				near_door = true
		if not near_door:
			_window(Vector3(wx, 0.98, front + 0.03), shutter_col)
	if hs.get("sign", true):
		_sign(Vector3(x0 + 0.1 if idx == 0 else x1 - 0.1, 1.85, front + 0.55), "道具屋" if idx == 0 else "宿屋 INN", idx)


func _window(p: Vector3, shutter: Color) -> void:
	var glass := _mat("glass", func(): return Art.glow_mat(Color("ffc874"), 1.6))
	_mesh(_quad(Vector2(0.46, 0.5)), glass, p, Vector3.ZERO, self, false)
	var frame := _dark_wood()
	_box(Vector3(0.56, 0.07, 0.08), frame, p + Vector3(0, 0.27, 0.02))
	_box(Vector3(0.6, 0.07, 0.12), frame, p + Vector3(0, -0.27, 0.04))
	_box(Vector3(0.05, 0.5, 0.06), frame, p + Vector3(0, 0, 0.02))
	_box(Vector3(0.5, 0.04, 0.05), frame, p + Vector3(0, 0, 0.02))
	for side: int in [-1, 1]:
		_box(Vector3(0.22, 0.54, 0.04), _flat_mat(shutter), p + Vector3(side * 0.37, 0, 0.05), Vector3(0, side * 0.35, 0))
	var box := _box(Vector3(0.58, 0.14, 0.18), _wood(), p + Vector3(0, -0.36, 0.11))
	for f in 5:
		var fc: Color = [Color("ff6f91"), Color("ffd84a"), Color("ffffff"), Color("c58cff")][f % 4]
		_foliage.flower(box.position + Vector3(-0.22 + f * 0.11, 0.06, 0), fc)


func _lantern(p: Vector3, with_light: bool) -> void:
	_box(Vector3(0.05, 0.2, 0.05), _iron(), p + Vector3(0, 0.18, 0))
	_box(Vector3(0.18, 0.22, 0.18), _mat("lglass", func(): return Art.glow_mat(Color("ffb75e"), 3.0)), p)
	_box(Vector3(0.24, 0.05, 0.24), _iron(), p + Vector3(0, 0.13, 0))
	if with_light:
		var l := OmniLight3D.new()
		l.light_color = Color("ffb15c")
		l.light_energy = 0.9
		l.omni_range = 3.2
		l.position = p
		add_child(l)
		lamps.append(l)


func _sign(p: Vector3, text: String, idx: int) -> void:
	_box(Vector3(0.06, 0.06, 0.55), _iron(), p + Vector3(0, 0.3, -0.27))
	var board := _box(Vector3(0.9, 0.42, 0.06), _wood(), p)
	board.rotation.y = 0.0
	var l := Label3D.new()
	l.text = text
	l.font = Game.font
	l.font_size = 48
	l.pixel_size = 0.0055
	l.outline_size = 8
	l.modulate = Color("fff1c9")
	l.outline_modulate = Color("3a2412")
	l.position = p + Vector3(0, 0, 0.04)
	add_child(l)


func _gate(c: Vector2) -> void:
	for side: int in [-1, 1]:
		var px := c.x + side * 2.1
		_box(Vector3(0.6, 1.9, 0.6), _stone(), Vector3(px, 0.95, c.y))
		_box(Vector3(0.75, 0.16, 0.75), _mat("cap", func(): return _stone()), Vector3(px, 1.98, c.y))
		_lantern(Vector3(px, 2.25, c.y), true)
		_occlude(Vector2(px, c.y), Vector2(0.3, 0.3), 0.7, 0.4)
	# A signpost beside the gate instead of an arch, so nothing hides the hero walking south.
	var post := Vector3(c.x - 3.0, 0, c.y + 0.9)
	_box(Vector3(0.1, 1.3, 0.1), _dark_wood(), post + Vector3(0, 0.65, 0))
	_box(Vector3(1.5, 0.42, 0.07), _wood(), post + Vector3(0, 1.2, 0.06))
	var l := Label3D.new()
	l.text = "こもれびの村"
	l.font = Game.font
	l.font_size = 48
	l.pixel_size = 0.0055
	l.outline_size = 10
	l.modulate = Color("fff1c9")
	l.outline_modulate = Color("3a2412")
	l.position = post + Vector3(0, 1.2, 0.11)
	add_child(l)


func _smoke(p: Vector3) -> void:
	var puff := _quad(Vector2(0.5, 0.5))
	puff.material = Art.soft_particle_mat(_radial_tex(Color(1, 1, 1, 0.55), Color(1, 1, 1, 0)))
	var s := CPUParticles3D.new()
	s.mesh = puff
	s.amount = 14
	s.lifetime = 4.5
	s.preprocess = 4.5
	s.position = p
	s.direction = Vector3(0.3, 1, 0)
	s.spread = 12.0
	s.gravity = Vector3(0.18, 0.05, 0)
	s.initial_velocity_min = 0.25
	s.initial_velocity_max = 0.4
	s.scale_amount_min = 0.6
	s.scale_amount_max = 1.0
	var curve := Curve.new()
	curve.add_point(Vector2(0, 0.5))
	curve.add_point(Vector2(1, 2.4))
	s.scale_amount_curve = curve
	var ramp := Gradient.new()
	ramp.set_color(0, Color(0.95, 0.93, 0.9, 0.5))
	ramp.set_color(1, Color(0.85, 0.85, 0.9, 0.0))
	s.color_ramp = ramp
	add_child(s)


# ================================================================ props

func _build_props() -> void:
	var water_done := false
	for y in H:
		for x in W:
			var c := _at(x, y)
			var p := Vector3(x, 0, y)
			match c:
				"t":
					_foliage.tree(p, 1.15, 0.03)
					_occlude(Vector2(x, y), Vector2(0.2, 0.2), 1.3, 0.45)
				"F":
					for side: float in [-0.45, 0.45]:
						_box(Vector3(0.1, 0.62, 0.1), _wood(), p + Vector3(side, 0.31, 0))
					_box(Vector3(1.0, 0.07, 0.05), _wood(), p + Vector3(0, 0.26, 0))
					_box(Vector3(1.0, 0.07, 0.05), _wood(), p + Vector3(0, 0.48, 0))
				"h":
					_hedge(p)
				"p":
					_box(Vector3(0.85, 0.28, 0.5), _wood(), p + Vector3(0, 0.14, 0))
					for f in 8:
						_foliage.flower(p + Vector3(-0.34 + f * 0.1, 0.24, _rng.randf_range(-0.12, 0.12)), [Color("ff6f91"), Color("ffd84a"), Color("ffffff")][f % 3])
					_occlude(Vector2(x, y), Vector2(0.4, 0.25), 0.35, 0.35)
				"q":
					_well(p)
				"b":
					_barrel(p + Vector3(0.1, 0, 0))
					_barrel(p + Vector3(-0.25, 0, 0.3), 0.85)
				"k":
					_box(Vector3(0.6, 0.55, 0.6), _wood(), p + Vector3(0, 0.275, 0), Vector3(0, 0.2, 0))
					_box(Vector3(0.42, 0.4, 0.42), _wood(), p + Vector3(0.05, 0.75, 0), Vector3(0, -0.3, 0))
					_occlude(Vector2(x, y), Vector2(0.3, 0.3), 0.4, 0.4)
				"l":
					_lamp(p)
				"w":
					if not water_done and _at(x + 1, y) == "w" and _at(x, y + 1) == "w":
						_fountain(Vector3(x + 0.5, 0, y + 0.5))
						water_done = true
	for y in H:
		var x := 0
		while x < W:
			if _at(x, y) != "c":
				x += 1
				continue
			var x1 := x
			while _at(x1 + 1, y) == "c":
				x1 += 1
			_stall(x, x1, y, Color("3f7f5a") if x < W / 2 else Color("b5523f"))
			x = x1 + 1
	_bench(Vector3(9.6, 0, 8.6), 0.0)
	_bench(Vector3(14.4, 0, 8.6), 0.0)
	_bunting(Vector3(6.6, 2.45, 5.2), Vector3(16.4, 2.45, 5.2), 0.45, 28)
	_bunting(Vector3(1.0, 2.1, 9.0), Vector3(22.0, 2.1, 9.0), 0.7, 46)


func _hedge(p: Vector3) -> void:
	var m := _mat("hedge", func(): return Art.shader_mat("res://shaders/foliage.gdshader", {"dark": Color("1d4f2a"), "light": Color("6aa84a"), "sway": 0.0, "speckle": 14.0}))
	for k in 3:
		_sphere(0.36, m, p + Vector3(-0.33 + k * 0.33, 0.32, _rng.randf_range(-0.05, 0.05)), 0.9, 8)
	_occlude(Vector2(p.x, p.z), Vector2(0.5, 0.3), 0.45, 0.45)


func _barrel(p: Vector3, s := 1.0) -> void:
	_cyl(0.25 * s, 0.23 * s, 0.6 * s, _wood(), p + Vector3(0, 0.3 * s, 0))
	for hy: float in [0.12, 0.48]:
		_cyl(0.262 * s, 0.262 * s, 0.05, _iron(), p + Vector3(0, hy * s, 0))
	_occlude(Vector2(p.x, p.z), Vector2(0.2, 0.2), 0.35, 0.45)


func _bench(p: Vector3, rot: float) -> void:
	var root := Node3D.new()
	root.position = p
	root.rotation.y = rot
	add_child(root)
	_box(Vector3(1.2, 0.07, 0.36), _wood(), Vector3(0, 0.42, 0), Vector3.ZERO, root)
	_box(Vector3(1.2, 0.3, 0.06), _wood(), Vector3(0, 0.62, -0.17), Vector3(-0.15, 0, 0), root)
	for sx: float in [-0.5, 0.5]:
		_box(Vector3(0.07, 0.42, 0.32), _iron(), Vector3(sx, 0.21, 0), Vector3.ZERO, root)
	_occlude(Vector2(p.x, p.z), Vector2(0.6, 0.18), 0.3, 0.35)


func _well(p: Vector3) -> void:
	_cyl(0.5, 0.52, 0.6, _stone(), p + Vector3(0, 0.3, 0), 12)
	var water := Art.shader_mat("res://shaders/water.gdshader")
	var disc := CylinderMesh.new()
	disc.top_radius = 0.4
	disc.bottom_radius = 0.4
	disc.height = 0.02
	_mesh(disc, water, p + Vector3(0, 0.5, 0), Vector3.ZERO, self, false)
	for side: float in [-0.48, 0.48]:
		_box(Vector3(0.09, 1.3, 0.09), _dark_wood(), p + Vector3(side, 0.65, 0))
	_box(Vector3(1.05, 0.06, 0.06), _dark_wood(), p + Vector3(0, 1.15, 0))
	var roof := PrismMesh.new()
	roof.size = Vector3(1.35, 0.5, 0.95)
	_mesh(roof, _mat("roof1", func(): return Art.pixel_mat(Art.tex("roof"), Color("c46a45"), Vector3(2, 2, 2))), p + Vector3(0, 1.55, 0))
	_cyl(0.11, 0.09, 0.16, _wood(), p + Vector3(0.18, 0.95, 0), 8)
	_occlude(Vector2(p.x, p.z), Vector2(0.4, 0.4), 0.6, 0.5)


func _lamp(p: Vector3) -> void:
	_box(Vector3(0.1, 2.0, 0.1), _iron(), p + Vector3(0, 1.0, 0))
	_box(Vector3(0.28, 0.14, 0.28), _iron(), p + Vector3(0, 0.07, 0))
	_box(Vector3(0.26, 0.32, 0.26), _mat("lglass", func(): return Art.glow_mat(Color("ffb75e"), 3.0)), p + Vector3(0, 2.14, 0))
	var cap := PrismMesh.new()
	cap.size = Vector3(0.38, 0.18, 0.38)
	_mesh(cap, _iron(), p + Vector3(0, 2.38, 0))
	var light := OmniLight3D.new()
	light.light_color = Color("ffb35c")
	light.light_energy = 1.2
	light.omni_range = 4.5
	light.position = p + Vector3(0, 2.0, 0.2)
	add_child(light)
	lamps.append(light)
	var halo := _mesh(_quad(Vector2(1.4, 1.4)), Art.additive(_radial_tex(Color(1, 0.75, 0.4, 0.45), Color(1, 0.6, 0.2, 0))), p + Vector3(0, 2.14, 0.02), Vector3.ZERO, self, false)
	halo.name = "Halo"
	_occlude(Vector2(p.x, p.z), Vector2(0.15, 0.15), 0.4, 0.4)


func _fountain(c: Vector3) -> void:
	var rim := _mat("rim", func(): return Art.pixel_mat(Art.tex("stonewall"), Color(1.18, 1.15, 1.08), Vector3(0.6, 0.6, 0.6)))
	_cyl(1.05, 1.1, 0.42, _stone(), c + Vector3(0, 0.21, 0), 8)
	_cyl(1.14, 1.14, 0.1, rim, c + Vector3(0, 0.46, 0), 8)
	var water := Art.shader_mat("res://shaders/water.gdshader")
	var disc := CylinderMesh.new()
	disc.top_radius = 0.98
	disc.bottom_radius = 0.98
	disc.height = 0.02
	disc.radial_segments = 8
	_mesh(disc, water, c + Vector3(0, 0.38, 0), Vector3.ZERO, self, false)
	_cyl(0.14, 0.2, 1.05, _stone(), c + Vector3(0, 0.8, 0), 8)
	_cyl(0.46, 0.2, 0.18, rim, c + Vector3(0, 1.33, 0), 8)
	var bowl := CylinderMesh.new()
	bowl.top_radius = 0.4
	bowl.bottom_radius = 0.4
	bowl.height = 0.02
	bowl.radial_segments = 8
	_mesh(bowl, water, c + Vector3(0, 1.42, 0), Vector3.ZERO, self, false)
	_sphere(0.12, rim, c + Vector3(0, 1.62, 0))
	_occlude(Vector2(c.x, c.z), Vector2(0.9, 0.9), 0.7, 0.45)
	var drop := _quad(Vector2(0.08, 0.08))
	drop.material = Art.soft_particle_mat(_radial_tex(Color(1, 1, 1, 1), Color(1, 1, 1, 0)))
	var p := CPUParticles3D.new()
	p.mesh = drop
	p.amount = 110
	p.lifetime = 1.0
	p.position = c + Vector3(0, 1.62, 0)
	p.direction = Vector3.UP
	p.spread = 35.0
	p.initial_velocity_min = 1.4
	p.initial_velocity_max = 2.0
	p.gravity = Vector3(0, -6.5, 0)
	p.color = Color(0.85, 0.96, 1.0, 0.9)
	p.scale_amount_min = 0.6
	p.scale_amount_max = 1.3
	add_child(p)
	var glow := OmniLight3D.new()
	glow.light_color = Color("8fd8ff")
	glow.light_energy = 0.45
	glow.omni_range = 2.6
	glow.position = c + Vector3(0, 0.8, 0)
	add_child(glow)


func _stall(x0: int, x1: int, y: int, color: Color) -> void:
	var cx := (x0 + x1) / 2.0
	var w := x1 - x0 + 1.0
	_box(Vector3(w - 0.1, 0.75, 0.6), _wood(), Vector3(cx, 0.375, y))
	_box(Vector3(w, 0.07, 0.72), _mat("counter", func(): return Art.pixel_mat(Art.tex("planks"), Color(1.15, 1.05, 0.95), Vector3(0.6, 0.6, 0.6))), Vector3(cx, 0.785, y))
	for side: float in [x0 - 0.45, x1 + 0.45]:
		_box(Vector3(0.09, 1.85, 0.09), _dark_wood(), Vector3(side, 0.92, y - 0.28))
		_box(Vector3(0.09, 1.5, 0.09), _dark_wood(), Vector3(side, 0.75, y + 0.32))
	var awning := StandardMaterial3D.new()
	var stripes := Image.create(32, 8, false, Image.FORMAT_RGBA8)
	for sx in 32:
		for sy in 8:
			var base := color if (sx / 4) % 2 == 0 else Color("f6eedc")
			stripes.set_pixel(sx, sy, base.darkened(0.25) if sy == 7 else base)
	awning.albedo_texture = ImageTexture.create_from_image(stripes)
	awning.texture_filter = BaseMaterial3D.TEXTURE_FILTER_NEAREST
	awning.uv1_scale = Vector3(w / 2.0, 1, 1)
	awning.cull_mode = BaseMaterial3D.CULL_DISABLED
	awning.roughness = 1.0
	_mesh(_quad(Vector2(w + 0.3, 1.0)), awning, Vector3(cx, 1.7, y + 0.05), Vector3(-1.0, 0, 0))
	# Scalloped valance along the awning edge.
	for k in int((w + 0.3) / 0.25):
		var flap := PrismMesh.new()
		flap.size = Vector3(0.22, 0.16, 0.01)
		_mesh(flap, _flat_mat(color if k % 2 == 0 else Color("f6eedc")), Vector3(x0 - 0.6 + k * 0.25 + 0.12, 1.33, y + 0.48), Vector3(-0.15, 0, PI), self, false)
	for k in int(w) * 4:
		var gx := x0 - 0.38 + k * (w - 0.2) / (w * 4.0)
		match k % 4:
			0: _sphere(0.08, _flat_mat(Color("d8342c"), 0.4), Vector3(gx, 0.88, y - 0.1))
			1: _cyl(0.05, 0.07, 0.24, _flat_mat(Color("5cc8a8"), 0.15), Vector3(gx, 0.94, y + 0.1), 8)
			2: _box(Vector3(0.16, 0.12, 0.16), _flat_mat(Color("e0a95a")), Vector3(gx, 0.88, y))
			3: _sphere(0.07, _flat_mat(Color("f2c84b"), 0.4), Vector3(gx, 0.87, y + 0.12))
	_occlude(Vector2(cx, y), Vector2(w / 2.0, 0.35), 0.5, 0.45)


func _bunting(a: Vector3, b: Vector3, sag: float, n: int) -> void:
	var cols := [Color("ff6b6b"), Color("ffd93d"), Color("6bcb77"), Color("4d96ff"), Color("ffffff")]
	for i in n:
		var t := (i + 0.5) / n
		var p := a.lerp(b, t) - Vector3(0, sin(t * PI) * sag, 0)
		var flag := PrismMesh.new()
		flag.size = Vector3(0.2, 0.26, 0.01)
		var m: StandardMaterial3D = _flat_mat(cols[i % 5])
		m.cull_mode = BaseMaterial3D.CULL_DISABLED
		_mesh(flag, m, p - Vector3(0, 0.13, 0), Vector3(0, 0, PI), self, false)


# ================================================================ surroundings

## Rooftops beyond the north wall, a windmill and the great komorebi tree make the village feel larger than its map.
func _build_backdrop() -> void:
	var spots := [[-1.5, -4.5, 3, 0], [4.0, -6.0, 4, 1], [9.5, -4.0, 3, 2], [15.5, -6.5, 4, 0], [21.5, -4.5, 3, 1]]
	for s in spots:
		_house({"x0": s[0], "x1": s[0] + s[2] - 1, "z0": s[1], "z1": s[1] + 1, "doors": [], "sign": false}, s[3])
	_windmill(Vector3(W + 5.0, 0, -3.0))
	_foliage.tree(Vector3(-4.5, 0, 3.0), 2.6, 0.02)
	_occlude(Vector2(-4.5, 3.0), Vector2(0.4, 0.4), 3.0, 0.5)
	var hill := _mat("hill", func(): return Art.shader_mat("res://shaders/foliage.gdshader", {"dark": Color("2c5a3c"), "light": Color("6d9a5c"), "sway": 0.0, "speckle": 2.5}))
	for i in 8:
		_sphere(_rng.randf_range(8, 12), hill, Vector3(-22 + i * 9, -4.0, -24 - _rng.randf_range(0, 6)), 0.6, 14)


func _windmill(p: Vector3) -> void:
	_cyl(0.9, 1.3, 4.2, _stone(), p + Vector3(0, 2.1, 0), 10)
	var cone := CylinderMesh.new()
	cone.top_radius = 0.05
	cone.bottom_radius = 1.15
	cone.height = 1.3
	cone.radial_segments = 10
	_mesh(cone, _mat("roof0", func(): return Art.pixel_mat(Art.tex("roof"), Color("4f9a76"), Vector3(2, 2, 2))), p + Vector3(0, 4.85, 0))
	var hub := Node3D.new()
	hub.position = p + Vector3(0, 3.9, 1.05)
	add_child(hub)
	for k in 4:
		var arm := Node3D.new()
		arm.rotation.z = k * PI / 2.0
		hub.add_child(arm)
		_box(Vector3(0.12, 2.6, 0.08), _dark_wood(), Vector3(0, 1.3, 0), Vector3.ZERO, arm)
		_box(Vector3(0.55, 2.0, 0.03), _mat("sail", func(): return _flat_mat(Color("efe6d2"))), Vector3(0.32, 1.5, 0.02), Vector3.ZERO, arm)
	spinners.append(hub)
	_occlude(Vector2(p.x, p.z), Vector2(1.2, 1.2), 1.4, 0.5)


func _build_vegetation() -> void:
	# Forest ring, kept clear of the road and thin toward the camera so the village stays in view.
	for i in 230:
		var p := Vector3(_rng.randf_range(-15, W + 15), 0, _rng.randf_range(-15, H + 13))
		var inside := p.x > -2.0 and p.x < W + 1.0 and p.z > -8.0 and p.z < H + 1.0
		var road := absf(p.x - 11.5) < 3.6 and p.z > H - 2
		var near_cam := p.z > H + 1.5 and absf(p.x - W / 2.0) < 11
		if inside or road or near_cam:
			continue
		_foliage.tree(p, _rng.randf_range(1.1, 1.8), _rng.randf_range(-0.04, 0.06))
		_occlude(Vector2(p.x, p.z), Vector2(0.3, 0.3), 1.6, 0.4)
	var cob: PackedFloat32Array = _splat.get_meta("cob")
	var dirt: PackedFloat32Array = _splat.get_meta("dirt")
	var sw := _splat.get_width()
	var flowers := [Color("ffffff"), Color("ffd84a"), Color("ff8fb8"), Color("c58cff")]
	for i in 5200:
		var p := Vector2(_rng.randf_range(-12, W + 11), _rng.randf_range(-10, H + 11))
		var px := clampi(int((p.x + PAD + 0.5) * SPLAT_RES), 0, sw - 1)
		var py := clampi(int((p.y + PAD + 0.5) * SPLAT_RES), 0, _splat.get_height() - 1)
		var k := py * sw + px
		if cob[k] > 0.12 or dirt[k] > 0.35:
			continue
		var tx := roundi(p.x)
		var ty := roundi(p.y)
		var c := _at(tx, ty)
		var in_map := tx >= 0 and ty >= 0 and tx < W and ty < H
		if in_map and not (c in [",", "f", "t", "F"]):
			continue
		var shade := _ao[k]
		var tint := Color(shade * _rng.randf_range(0.9, 1.1), shade, shade * _rng.randf_range(0.85, 1.0))
		_foliage.grass_clump(Vector3(p.x, 0, p.y), _rng.randf_range(0.7, 1.25), tint)
		if (c == "f" and in_map and _rng.randf() < 0.9) or _rng.randf() < 0.06:
			_foliage.flower(Vector3(p.x + 0.1, 0, p.y + 0.05), flowers[_rng.randi() % flowers.size()])


func _build_life() -> void:
	# Pollen drifting through the light.
	var mote := _quad(Vector2(0.07, 0.07))
	mote.material = Art.additive(_radial_tex(Color(1, 0.95, 0.7, 1), Color(1, 0.9, 0.5, 0)))
	var motes := CPUParticles3D.new()
	motes.mesh = mote
	motes.amount = 90
	motes.lifetime = 8.0
	motes.preprocess = 8.0
	motes.emission_shape = CPUParticles3D.EMISSION_SHAPE_BOX
	motes.emission_box_extents = Vector3(W / 2.0 + 2, 1.4, H / 2.0)
	motes.position = Vector3(W / 2.0, 1.6, H / 2.0)
	motes.gravity = Vector3(0.02, 0.03, 0)
	motes.spread = 180.0
	motes.initial_velocity_min = 0.05
	motes.initial_velocity_max = 0.25
	motes.color = Color(1, 0.92, 0.7, 0.85)
	add_child(motes)
	# Leaves falling from the corner trees.
	var leaf := _quad(Vector2(0.12, 0.09))
	var lm := StandardMaterial3D.new()
	lm.albedo_color = Color("8fbf4a")
	lm.cull_mode = BaseMaterial3D.CULL_DISABLED
	leaf.material = lm
	for corner: Vector3 in [Vector3(1, 2.2, 1), Vector3(W - 2, 2.2, 1), Vector3(1, 2.2, H - 2), Vector3(W - 2, 2.2, H - 2)]:
		var f := CPUParticles3D.new()
		f.mesh = leaf
		f.amount = 6
		f.lifetime = 5.0
		f.preprocess = 5.0
		f.position = corner
		f.emission_shape = CPUParticles3D.EMISSION_SHAPE_SPHERE
		f.emission_sphere_radius = 0.8
		f.gravity = Vector3(0.25, -0.45, 0.1)
		f.angular_velocity_min = -180
		f.angular_velocity_max = 180
		f.particle_flag_rotate_y = true
		add_child(f)
	# Butterflies wandering over the flower beds.
	for i in 6:
		var b := Node3D.new()
		add_child(b)
		var col: Color = [Color("fff6c2"), Color("ffb3d1"), Color("a8d8ff")][i % 3]
		var wm := StandardMaterial3D.new()
		wm.albedo_color = col
		wm.cull_mode = BaseMaterial3D.CULL_DISABLED
		wm.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
		var wings: Array[MeshInstance3D] = []
		for side: int in [-1, 1]:
			var wing := _mesh(_quad(Vector2(0.12, 0.1)), wm, Vector3(side * 0.06, 0, 0), Vector3(-PI / 2.0, 0, 0), b, false)
			wings.append(wing)
		var home := Vector3(_rng.randf_range(2, W - 3), 0.7, [3.0, 12.5, 6.0][i % 3] + _rng.randf_range(-1, 1))
		butterflies.append({"node": b, "wings": wings, "home": home, "phase": _rng.randf() * TAU})
	# Shafts of light slanting through the trees on the west side.
	var shaft_tex := GradientTexture2D.new()
	var g := Gradient.new()
	g.set_color(0, Color(1, 0.9, 0.65, 0.0))
	g.add_point(0.3, Color(1, 0.88, 0.6, 0.22))
	g.set_color(g.get_point_count() - 1, Color(1, 0.85, 0.55, 0.0))
	shaft_tex.gradient = g
	shaft_tex.fill_from = Vector2(0, 0)
	shaft_tex.fill_to = Vector2(1, 0)
	for i in 4:
		var m := Art.additive(shaft_tex, false)
		var q := _mesh(_quad(Vector2(1.6, 9.0)), m, Vector3(-1.5 + i * 2.6, 3.5, 1.5 + i * 2.2), Vector3(0, 0.6, -0.55), self, false)
		q.name = "Shaft%d" % i


# ================================================================ characters

func _walker(path: String, pixel: float) -> Sprite3D:
	var s := Sprite3D.new()
	s.texture = load(path)
	s.hframes = 3
	s.vframes = 4
	s.frame = 1
	s.pixel_size = pixel
	s.billboard = BaseMaterial3D.BILLBOARD_FIXED_Y
	s.texture_filter = BaseMaterial3D.TEXTURE_FILTER_NEAREST
	s.alpha_cut = SpriteBase3D.ALPHA_CUT_DISCARD
	s.shaded = true
	s.offset = Vector2(0, 32)
	s.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON
	add_child(s)
	_blob(s, 0.5)
	return s


func _blob(parent: Node3D, size: float) -> void:
	var m := StandardMaterial3D.new()
	m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	m.albedo_texture = _radial_tex(Color(0.05, 0.08, 0.05, 0.55), Color(0, 0, 0, 0))
	var b := _mesh(_flat(Vector2(size, size * 0.6)), m, Vector3(0, 0.02, 0), Vector3.ZERO, parent, false)
	b.top_level = false


func _build_characters(list: Array) -> void:
	hero = _walker("res://assets/walk/boy.png", 0.0175)
	for id in ["kiki", "nene"]:
		var cat := _walker("res://assets/walk/%s.png" % id, 0.0122)
		cat.modulate = Color(0.82, 0.8, 0.8)
		cats.append(cat)
	for i in 40:
		trail.append(hero_pos + Vector2(0, i * 0.05))
	for n in list:
		var tex: Texture2D = load("res://assets/people/%s-standing.webp" % n.art)
		var s := Sprite3D.new()
		s.texture = tex
		s.pixel_size = 1.42 / tex.get_height()
		s.billboard = BaseMaterial3D.BILLBOARD_FIXED_Y
		s.texture_filter = BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
		s.alpha_cut = SpriteBase3D.ALPHA_CUT_DISCARD
		s.shaded = true
		s.offset = Vector2(0, tex.get_height() / 2.0)
		s.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON
		s.position = Vector3(n.x, 0, n.y)
		add_child(s)
		_blob(s, 0.7)
		npcs.append({"data": n, "node": s, "pos": Vector2(n.x, n.y), "phase": _rng.randf() * TAU})
	hint3d = Label3D.new()
	hint3d.font = Game.font
	hint3d.font_size = 64
	hint3d.pixel_size = 0.006
	hint3d.outline_size = 14
	hint3d.modulate = Color(1, 0.92, 0.55)
	hint3d.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	hint3d.no_depth_test = true
	hint3d.text = "▼ はなす"
	hint3d.visible = false
	add_child(hint3d)


# ================================================================ UI

func _build_ui() -> void:
	dialog = DialogUI.new()
	add_child(dialog)
	touch = TouchControls.new()
	add_child(touch)
	var layer := CanvasLayer.new()
	layer.layer = 5
	add_child(layer)
	var panel := PanelContainer.new()
	panel.position = Vector2(18, 16)
	layer.add_child(panel)
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 4)
	panel.add_child(v)
	var place := Label.new()
	place.text = "地上 / こもれびの村"
	place.add_theme_color_override("font_color", Color(1, 0.88, 0.5))
	place.add_theme_font_size_override("font_size", 20)
	v.add_child(place)
	hud_label = Label.new()
	hud_label.add_theme_font_size_override("font_size", 20)
	v.add_child(hud_label)
	hud_hp = _bar(Color("6fda88"))
	v.add_child(hud_hp)
	hud_mp = _bar(Color("6fb0ff"))
	v.add_child(hud_mp)
	var tag := Label.new()
	tag.text = "Godot試作版 · Z/A はなす · X/B メニュー"
	tag.add_theme_font_size_override("font_size", 18)
	tag.add_theme_color_override("font_color", Color(1, 1, 1, 0.85))
	tag.add_theme_color_override("font_outline_color", Color(0, 0, 0, 0.8))
	tag.add_theme_constant_override("outline_size", 6)
	tag.anchor_left = 1.0
	tag.anchor_right = 1.0
	tag.offset_left = -700
	tag.offset_right = -20
	tag.offset_top = 18
	tag.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	var top_right := Control.new()
	top_right.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	top_right.mouse_filter = Control.MOUSE_FILTER_IGNORE
	layer.add_child(top_right)
	top_right.add_child(tag)
	_refresh_hud()


func _bar(color: Color) -> ProgressBar:
	var b := ProgressBar.new()
	b.custom_minimum_size = Vector2(230, 12)
	b.show_percentage = false
	var bg := StyleBoxFlat.new()
	bg.bg_color = Color(0.2, 0.22, 0.28)
	bg.set_corner_radius_all(3)
	var fg := StyleBoxFlat.new()
	fg.bg_color = color
	fg.set_corner_radius_all(3)
	b.add_theme_stylebox_override("background", bg)
	b.add_theme_stylebox_override("fill", fg)
	return b


func _refresh_hud() -> void:
	hud_label.text = "少年 Lv.%d   %d G   薬草×%d" % [Game.hero.lv, Game.hero.gold, Game.hero.herb]
	hud_hp.max_value = Game.max_hp()
	hud_hp.value = Game.hero.hp
	hud_mp.max_value = Game.max_mp()
	hud_mp.value = Game.hero.mp


# ================================================================ update

func _process(delta: float) -> void:
	var t := Time.get_ticks_msec() / 1000.0
	for i in lamps.size():
		var base: float = lamps[i].get_meta("base", lamps[i].light_energy)
		lamps[i].set_meta("base", base)
		lamps[i].light_energy = base * (1.0 + sin(t * 9.0 + i * 2.0) * 0.06 + sin(t * 23.0 + i) * 0.04)
	for s in spinners:
		s.rotation.z = -t * 0.6
	for b in butterflies:
		var ph: float = b.phase
		var home: Vector3 = b.home
		b.node.position = home + Vector3(sin(t * 0.5 + ph) * 1.6, sin(t * 1.7 + ph) * 0.25, cos(t * 0.37 + ph * 2.0) * 1.1)
		b.node.rotation.y = t * 0.5 + ph
		var flap := absf(sin(t * 16.0 + ph))
		for k in 2:
			b.wings[k].rotation.z = (1 if k == 0 else -1) * flap * 1.1
	for n in npcs:
		n.node.scale = Vector3(1, 1.0 + sin(t * 2.2 + n.phase) * 0.012, 1)
	var moving := false
	if not busy and not dialog.open:
		var input := Input.get_vector("move_left", "move_right", "move_up", "move_down")
		if touch.stick != Vector2.ZERO:
			input = touch.stick
		if input.length() > 0.1:
			moving = _move_hero(input.limit_length(1.0) * SPEED * delta)
			if absf(input.x) > absf(input.y):
				hero_dir = 1 if input.x > 0 else 3
			else:
				hero_dir = 2 if input.y > 0 else 0
	walk_time = walk_time + delta if moving else 0.0
	_animate(hero, hero_dir, moving, walk_time)
	hero.position = Vector3(hero_pos.x, 0, hero_pos.y)
	_update_cats(delta)
	var near = _nearest_npc()
	hint3d.visible = near != null and not dialog.open and not busy
	if near:
		hint3d.position = near.node.position + Vector3(0, 1.75 + sin(t * 4.0) * 0.05, 0)
	_place_camera(false, delta)
	if not busy and _at(roundi(hero_pos.x), roundi(hero_pos.y)) == "E":
		_leave_village()


func _move_hero(step: Vector2) -> bool:
	var before := hero_pos
	var nx := hero_pos + Vector2(step.x, 0)
	if _free(nx):
		hero_pos = nx
	var ny := hero_pos + Vector2(0, step.y)
	if _free(ny):
		hero_pos = ny
	if hero_pos.distance_to(trail[0]) > 0.05:
		trail.push_front(hero_pos)
		if trail.size() > 200:
			trail.pop_back()
	return hero_pos.distance_squared_to(before) > 0.00001


func _free(p: Vector2) -> bool:
	for o in [Vector2(-HERO_R, -HERO_R * 0.5), Vector2(HERO_R, -HERO_R * 0.5), Vector2(-HERO_R, HERO_R), Vector2(HERO_R, HERO_R)]:
		var q: Vector2 = p + o
		if not (_at(roundi(q.x), roundi(q.y)) in WALKABLE):
			return false
	for n in npcs:
		if p.distance_to(n.pos) < 0.62:
			return false
	return true


func _animate(s: Sprite3D, dir: int, moving: bool, time: float) -> void:
	var col: int = STEP_COLS[int(time * 8.0) % 4] if moving else 1
	s.frame = DIR_ROW[dir] * 3 + col


## Cats walk the hero's recent path at fixed distances, like the web version's trail follower.
func _update_cats(delta: float) -> void:
	for i in cats.size():
		var want := 0.75 * (i + 1)
		var p := trail[trail.size() - 1]
		var dir_vec := Vector2.ZERO
		for j in range(1, trail.size()):
			var a := trail[j - 1]
			var b := trail[j]
			var d := a.distance_to(b)
			if d >= want:
				p = a.lerp(b, want / d)
				dir_vec = a - b
				break
			want -= d
		var cat := cats[i]
		var prev := Vector2(cat.position.x, cat.position.z)
		var moved := prev.distance_to(p) > 0.004
		var face := hero_dir
		if dir_vec.length() > 0.001 and moved:
			face = (1 if dir_vec.x > 0 else 3) if absf(dir_vec.x) > absf(dir_vec.y) else (2 if dir_vec.y > 0 else 0)
		elif not moved:
			face = cat.get_meta("dir", 2)
		cat.set_meta("dir", face)
		var tt: float = cat.get_meta("t", 0.0)
		tt = tt + delta if moved else 0.0
		cat.set_meta("t", tt)
		_animate(cat, face, moved, tt)
		cat.position = Vector3(p.x, 0, p.y + 0.01)


func _nearest_npc():
	var best = null
	var best_d := 1.45
	for n in npcs:
		var d := hero_pos.distance_to(n.pos)
		if d < best_d:
			best = n
			best_d = d
	return best


func _place_camera(snap: bool, delta := 0.016) -> void:
	var target := Vector3(clampf(hero_pos.x, 6.5, W - 7.5), 0.4, clampf(hero_pos.y, 4.5, H - 3.2))
	var offset := Vector3(0, 12.8, 16.4)
	var want := target + offset
	camera.position = want if snap else camera.position.lerp(want, 1.0 - exp(-delta * 5.0))
	camera.look_at(camera.position - offset, Vector3.UP)


func _unhandled_input(event: InputEvent) -> void:
	if busy or dialog.open:
		return
	if event.is_action_pressed("accept"):
		var n = _nearest_npc()
		if n:
			get_viewport().set_input_as_handled()
			_talk(n)
	elif event.is_action_pressed("cancel"):
		get_viewport().set_input_as_handled()
		_support_menu()


# ================================================================ events

func _talk(n: Dictionary) -> void:
	busy = true
	touch.release_all()
	var d: Dictionary = n.data
	var who: String = d.jp
	match d.id:
		"elder":
			await dialog.say(who, "Ah, you're awake. Listen carefully, young traveler.", "おお、目が覚めたか。よく聞きなさい、若き旅人よ。")
			await dialog.say(who, "Last night, the Word Crystal broke into three pieces.", "昨夜、言葉の水晶が3つに砕けてしまった。")
			await dialog.say(who, "Wild companions gather on the meadow south of the gate.", "門の南の草原に、野生の仲間たちが集まっておる。")
			await dialog.say(who, "Answer in English, and your words will become your strength.", "英語で答えれば、ことばがお前の力になる。")
		"girl":
			await dialog.say(who, "Do you want to try a quick word quiz?", "単語クイズやってみる？")
			var c := 0
			for i in 3:
				if await dialog.quiz(Game.q_vocab(1), who):
					c += 1
			await dialog.say(who, "%d out of 3! %s" % [c, "Amazing!" if c == 3 else "Nice try!"], "3問中%d問正解！" % c)
		"shop":
			var q := _convo_quiz("shop")
			if await dialog.quiz(q, who):
				Game.hero.herb += 1
				await dialog.say(who, "Perfect English! Here, take a herb for free.", "完ぺきな英語ね！薬草をひとつおまけするわ。")
			else:
				await dialog.say(who, "Almost! Come back and try again.", "おしい！また来てね。")
		"inn":
			var q := _convo_quiz("inn")
			await dialog.quiz(q, who)
			Game.hero.hp = Game.max_hp()
			Game.hero.mp = Game.max_mp()
			Game.sfx("heal")
			await dialog.say(who, "Have a good rest. You look full of energy!", "ゆっくり休んで。元気いっぱいだね！（HP・MPが回復した）")
		"granny":
			await dialog.say(who, "Listen to the wind, dear. It speaks English, too.", "風の声をお聞き。風も英語を話すのよ。")
			await dialog.quiz(Game.q_listen(1), who)
		"guard":
			await dialog.say(who, "Before you leave, show me your grammar!", "出発する前に、文法の力を見せてみろ！")
			await dialog.quiz(Game.q_spell(), who)
		_:
			await dialog.say(who, "Companions grow stronger when you study together.", "仲間は、いっしょに学ぶほど強くなるんだ。")
			await dialog.quiz(Game.q_spell(), who)
	_refresh_hud()
	busy = false


func _convo_quiz(tag: String) -> Dictionary:
	var pool: Array = Game.learning.convo.filter(func(c): return c.get("tag", "") == tag)
	var c = pool[randi() % pool.size()]
	var q := {"kind": "convo", "label": "TALK 会話", "prompt": "“%s”" % c.q, "sub": c.qja + "　いちばん自然な返事は？",
		"say": c.q, "after": c.a[0], "explain": "“%s” → %s" % [c.q, c.a[0]], "tip": c.tip}
	var opts: Array = c.a.duplicate()
	opts.shuffle()
	q.options = opts
	q.answer = opts.find(c.a[0])
	return q


func _support_menu() -> void:
	busy = true
	touch.release_all()
	var i := await dialog.ask("キキ", "We are always by your side. Where shall we go?", "いつでも一緒だよ。どうする？",
		["ネネと英語練習（呪文）", "草原でたたかう", "タイトルへ戻る", "もどる"])
	match i:
		0:
			var ok := await dialog.quiz(Game.q_spell(), "ネネ")
			await dialog.say("ネネ", "Wonderful! Your words are getting stronger." if ok else "Mistakes help us learn. Let us try again!",
				"その調子！" if ok else "間違えても大丈夫。もう一度やってみよう。")
		1:
			_go_battle()
			return
		2:
			Game.goto("title")
			return
	busy = false


func _leave_village() -> void:
	busy = true
	touch.release_all()
	var i := await dialog.ask("", "The meadow lies beyond the gate.", "門の外は草原だ。野生の仲間が待っている。", ["草原へ出る（バトル）", "村にもどる"], true)
	if i == 0:
		_go_battle()
		return
	hero_pos.y = H - 2.4
	hero_dir = 0
	busy = false


func _go_battle() -> void:
	Game.sfx("encounter")
	Game.goto("battle", {"return_pos": Vector2(11.5, H - 2.6)})
