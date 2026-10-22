extends Node3D
## こもれびの村 in HD-2D: tile map from the web version rebuilt as lit 3D props with billboard characters.

const WALKABLE := [",", "f", "E"]
const SPEED := 3.6
const HERO_R := 0.26
const DIR_ROW := [3, 2, 0, 1]  # dir 0 up,1 right,2 down,3 left -> sheet rows down,left,right,up
const STEP_COLS := [0, 1, 2, 1]

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
var busy := false
var walk_time := 0.0
var _rng := RandomNumberGenerator.new()
var _mats := {}


func setup(args: Dictionary) -> void:
	if args.has("pos"):
		_start = args.pos


func _ready() -> void:
	_rng.seed = 7
	var v: Dictionary = Game.world.village
	load_map()
	hero_pos = _start if _start.x >= 0 else Vector2(12, 10.5)
	_build_environment()
	_build_ground()
	_build_walls_and_houses()
	_build_props()
	_build_surroundings()
	_build_grass()
	_build_characters(v.npcs)
	_build_ui()
	Game.music("village")
	_place_camera(true)


# ================================================================ helpers

func _at(x: int, y: int) -> String:
	if y < 0 or y >= H or x < 0 or x >= W:
		return "#"
	return rows[y][x]


func _mat(key: String, color: Color, tex: Texture2D = null, rough := 0.9) -> StandardMaterial3D:
	if _mats.has(key):
		return _mats[key]
	var m := StandardMaterial3D.new()
	m.albedo_color = color
	m.roughness = rough
	if tex:
		m.albedo_texture = tex
		m.texture_filter = BaseMaterial3D.TEXTURE_FILTER_NEAREST_WITH_MIPMAPS
		m.uv1_triplanar = true
		m.uv1_world_triplanar = true
		m.uv1_scale = Vector3.ONE
	_mats[key] = m
	return m


func _shader_mat(path: String, params := {}) -> ShaderMaterial:
	var m := ShaderMaterial.new()
	m.shader = load(path)
	for k in params:
		m.set_shader_parameter(k, params[k])
	return m


func _mesh(mesh: Mesh, mat: Material, pos: Vector3, rot := Vector3.ZERO, parent: Node = self, shadow := true) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	mi.mesh = mesh
	mi.material_override = mat
	mi.position = pos
	mi.rotation = rot
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON if shadow else GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	parent.add_child(mi)
	return mi


func _box(size: Vector3, mat: Material, pos: Vector3, rot := Vector3.ZERO) -> MeshInstance3D:
	var b := BoxMesh.new()
	b.size = size
	return _mesh(b, mat, pos, rot)


func _cyl(r_top: float, r_bottom: float, h: float, mat: Material, pos: Vector3, seg := 14) -> MeshInstance3D:
	var c := CylinderMesh.new()
	c.top_radius = r_top
	c.bottom_radius = r_bottom
	c.height = h
	c.radial_segments = seg
	c.rings = 1
	return _mesh(c, mat, pos)


func _sphere(r: float, mat: Material, pos: Vector3, squash := 1.0, seg := 10) -> MeshInstance3D:
	var s := SphereMesh.new()
	s.radius = r
	s.height = r * 2.0 * squash
	s.radial_segments = seg
	s.rings = maxi(4, seg / 2)
	return _mesh(s, mat, pos)


## Pixel-art texture painted per pixel by a callable(img, x, y, rng) -> Color.
func _paint(w: int, h: int, painter: Callable, seed := 1) -> ImageTexture:
	var img := Image.create(w, h, false, Image.FORMAT_RGBA8)
	var r := RandomNumberGenerator.new()
	r.seed = seed
	for y in h:
		for x in w:
			img.set_pixel(x, y, painter.call(x, y, r))
	img.generate_mipmaps()
	return ImageTexture.create_from_image(img)


func _radial_tex(inner: Color, outer: Color) -> GradientTexture2D:
	var g := Gradient.new()
	g.set_color(0, inner)
	g.set_color(1, outer)
	var t := GradientTexture2D.new()
	t.gradient = g
	t.fill = GradientTexture2D.FILL_RADIAL
	t.fill_from = Vector2(0.5, 0.5)
	t.fill_to = Vector2(1.0, 0.5)
	t.width = 64
	t.height = 64
	return t


# ================================================================ world

func _build_environment() -> void:
	var env := Environment.new()
	var sky_mat := ProceduralSkyMaterial.new()
	sky_mat.sky_top_color = Color("5f9fcf")
	sky_mat.sky_horizon_color = Color("d3eadf")
	sky_mat.ground_bottom_color = Color("2f4f3a")
	sky_mat.ground_horizon_color = Color("a9c7b0")
	var sky := Sky.new()
	sky.sky_material = sky_mat
	env.background_mode = Environment.BG_SKY
	env.sky = sky
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color("cfe3ff")
	env.ambient_light_energy = 0.32
	env.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	env.tonemap_exposure = 0.95
	env.glow_enabled = true
	env.glow_intensity = 0.45
	env.glow_bloom = 0.0
	env.glow_hdr_threshold = 1.15
	env.glow_blend_mode = Environment.GLOW_BLEND_MODE_SCREEN
	env.fog_enabled = true
	env.fog_light_color = Color("b4cfb6")
	env.fog_density = 0.008
	env.fog_sky_affect = 0.4
	env.adjustment_enabled = true
	env.adjustment_saturation = 1.14
	env.adjustment_contrast = 1.1
	var we := WorldEnvironment.new()
	we.environment = env
	add_child(we)

	var sun := DirectionalLight3D.new()
	sun.light_color = Color("ffe6a8")
	sun.light_energy = 0.95
	sun.shadow_enabled = true
	sun.shadow_blur = 1.6
	sun.shadow_bias = 0.04
	sun.shadow_normal_bias = 1.2
	sun.directional_shadow_max_distance = 34.0
	sun.directional_shadow_mode = DirectionalLight3D.SHADOW_ORTHOGONAL
	add_child(sun)
	var center := Vector3(W / 2.0, 0, H / 2.0)
	sun.look_at_from_position(center + Vector3(-7, 11, 6), center)

	camera = Camera3D.new()
	camera.fov = 30.0
	camera.near = 0.3
	camera.far = 90.0
	add_child(camera)

	var post := CanvasLayer.new()
	post.layer = 1
	add_child(post)
	var rect := ColorRect.new()
	rect.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
	rect.material = _shader_mat("res://shaders/tilt_shift.gdshader")
	post.add_child(rect)


func _ground_kind(x: int, y: int) -> String:
	var c := _at(x, y)
	if c == "E":
		return "path"
	if c == "f":
		return "flowers"
	if c in ["h", "p", "t"]:
		return "grass"
	if x <= 2 or x >= 21 or y <= 1 or y >= 13:
		return "grass"
	return "cobble"


const BAKED_GROUND := "res://assets/baked/ground.png"


func _build_ground() -> void:
	var m := StandardMaterial3D.new()
	# Painting 100k pixels is slow in the web build, so a baked copy is used when present (see Game.bake).
	m.albedo_texture = load(BAKED_GROUND) if ResourceLoader.exists(BAKED_GROUND) else ImageTexture.create_from_image(paint_ground())
	m.texture_filter = BaseMaterial3D.TEXTURE_FILTER_NEAREST_WITH_MIPMAPS
	m.roughness = 1.0
	var plane := PlaneMesh.new()
	plane.size = Vector2(W, H)
	var g := _mesh(plane, m, Vector3(W / 2.0 - 0.5, 0, H / 2.0 - 0.5), Vector3.ZERO, self, false)
	g.name = "Ground"


func load_map() -> void:
	rows = Game.world.village.rows
	H = rows.size()
	W = rows[0].length()


func paint_ground() -> Image:
	var px := 16
	var img := Image.create(W * px, H * px, false, Image.FORMAT_RGBA8)
	var r := RandomNumberGenerator.new()
	r.seed = 11
	var grass := [Color("4f8f45"), Color("5a9c4b"), Color("67a853"), Color("447f3d")]
	var stone := [Color("9f978a"), Color("ada596"), Color("948d82"), Color("b6ad9c")]
	for ty in H:
		for tx in W:
			var kind := _ground_kind(tx, ty)
			for y in px:
				for x in px:
					var c: Color
					match kind:
						"cobble":
							# Offset brick courses of rounded cobbles with dark mortar.
							var row := y / 5
							var bx := (x + tx * px + (3 if row % 2 else 0)) % 8
							var by := y % 5
							if bx == 0 or by == 0:
								c = Color("6a6358")
							else:
								c = stone[(int(tx * 7 + ty * 3 + (x + (3 if row % 2 else 0)) / 8 + row) % 4)]
								if by == 1:
									c = c.lightened(0.08)
								elif by == 4:
									c = c.darkened(0.1)
						"path":
							c = Color("b8945e").darkened(r.randf() * 0.15)
							if r.randf() < 0.06:
								c = Color("8f7048")
						_:
							c = grass[r.randi() % 4]
							if r.randf() < 0.05:
								c = Color("86bf62")
							if kind == "flowers" and r.randf() < 0.13:
								c = [Color("ffd75e"), Color("ff8fb8"), Color("ffffff"), Color("b58cff")][r.randi() % 4]
					# Soft contact shading next to walls and buildings.
					if _at(tx, ty - 1) in ["#", "r", "d"] and y < 5 and kind != "path":
						c = c.darkened(0.3 * (1.0 - y / 5.0))
					img.set_pixel(tx * px + x, ty * px + y, c)
	img.generate_mipmaps()
	return img


func _stone_tex() -> ImageTexture:
	if _mats.has("stone_tex"):
		return _mats.stone_tex
	var f := func(x: int, y: int, r: RandomNumberGenerator) -> Color:
		var row := y / 8
		var bx := (x + (8 if row % 2 else 0)) % 16
		if bx == 0 or y % 8 == 0:
			return Color("5f5a52")
		var base := Color("a9a294").darkened(float((x / 16 + row * 3) % 3) * 0.06)
		return base.lightened(r.randf() * 0.08) if y % 8 > 1 else base.lightened(0.12)
	_mats.stone_tex = _paint(32, 32, f, 3)
	return _mats.stone_tex


func _wood_tex() -> ImageTexture:
	if _mats.has("wood_tex"):
		return _mats.wood_tex
	var f := func(x: int, y: int, r: RandomNumberGenerator) -> Color:
		var plank := y / 8
		var c := Color("9a6a3e").darkened(float(plank % 2) * 0.1)
		if y % 8 == 0:
			return Color("5a3a20")
		if (x + plank * 11) % 13 == 0 and r.randf() < 0.6:
			c = c.darkened(0.18)
		return c.lightened(r.randf() * 0.06)
	_mats.wood_tex = _paint(32, 32, f, 5)
	return _mats.wood_tex


func _build_walls_and_houses() -> void:
	var stone_m := _mat("stone", Color(1, 1, 1), _stone_tex())
	var cap_m := _mat("cap", Color("cfc6b2"), _stone_tex())
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
	# Perimeter wall: lower along the south edge so it never hides the hero.
	for y in H:
		for x in W:
			if _at(x, y) != "#" or house_cells.has(Vector2i(x, y)):
				continue
			var h := 0.45 if y == H - 1 else 0.85
			_box(Vector3(1.0, h, 1.0), stone_m, Vector3(x, h / 2.0, y))
			_box(Vector3(1.04, 0.1, 1.04), cap_m, Vector3(x, h + 0.05, y))
	for i in houses.size():
		_house(houses[i], i)


func _house(hs: Dictionary, idx: int) -> void:
	var x0: float = hs.x0
	var x1: float = hs.x1
	var z0: float = hs.z0
	var z1: float = hs.z1
	var w := x1 - x0 + 1.0
	var d := z1 - z0 + 1.0
	var cx := (x0 + x1) / 2.0
	var cz := (z0 + z1) / 2.0
	var wall_h := 1.55
	var speckle := func(_x: int, _y: int, r: RandomNumberGenerator) -> Color:
		return Color("f3e9d4").darkened(r.randf() * 0.07)
	var plaster := _mat("plaster", Color("f1e6cf"), _paint(32, 32, speckle, 9))
	var beam := _mat("beam", Color("6b4426"), _wood_tex())
	var roof_col := Color("3d8064") if idx % 2 == 0 else Color("c0603e")
	var shingles := func(x: int, y: int, r: RandomNumberGenerator) -> Color:
		var row := y / 6
		var c := roof_col.darkened(0.12 if (x + (5 if row % 2 else 0)) % 10 == 0 else 0.0)
		if y % 6 == 5:
			c = roof_col.darkened(0.35)
		return c.lightened(r.randf() * 0.05)
	var roof_tex := _paint(32, 32, shingles, 21 + idx)
	var roof_m := _mat("roof%d" % idx, Color(1, 1, 1), roof_tex)
	var body_d := d - 0.35
	var bz := cz - 0.1
	_box(Vector3(w - 0.1, wall_h, body_d), plaster, Vector3(cx, wall_h / 2.0, bz))
	var front := bz + body_d / 2.0
	# Half-timbering on the front face.
	_box(Vector3(w - 0.02, 0.12, 0.06), beam, Vector3(cx, wall_h - 0.06, front + 0.02))
	_box(Vector3(w - 0.02, 0.1, 0.06), beam, Vector3(cx, 0.75, front + 0.02))
	for k in 3:
		var bx := x0 - 0.45 + k * (w - 0.1) / 2.0
		_box(Vector3(0.12, wall_h, 0.08), beam, Vector3(bx, wall_h / 2.0, front + 0.02))
	_box(Vector3(w + 0.1, 0.18, body_d + 0.1), _mat("found", Color("8a8378"), _stone_tex()), Vector3(cx, 0.09, bz))
	# Roof: gable prism with the ridge running left-right, slight overhang toward the camera.
	var prism := PrismMesh.new()
	prism.size = Vector3(body_d + 0.7, 1.25, w + 0.5)
	_mesh(prism, roof_m, Vector3(cx, wall_h + 0.62, bz), Vector3(0, PI / 2.0, 0))
	_box(Vector3(w + 0.55, 0.1, 0.12), beam, Vector3(cx, wall_h + 1.22, bz))
	_box(Vector3(0.35, 0.8, 0.35), _mat("brick", Color("9a5a44"), _stone_tex()), Vector3(x1 - 0.6, wall_h + 1.1, bz - 0.4))
	var glow := StandardMaterial3D.new()
	glow.albedo_color = Color("ffd98a")
	glow.emission_enabled = true
	glow.emission = Color("ffb84a")
	glow.emission_energy_multiplier = 1.6
	for dx in hs.doors:
		_box(Vector3(0.62, 0.98, 0.08), _mat("door", Color("5b3a22"), _wood_tex()), Vector3(dx, 0.49, front + 0.04))
		_box(Vector3(0.78, 0.1, 0.12), beam, Vector3(dx, 1.02, front + 0.05))
		_sphere(0.04, _mat("knob", Color("e8c060"), null, 0.3), Vector3(dx + 0.2, 0.5, front + 0.1))
	for wx in [x0 + 0.5, x1 - 0.5]:
		var skip := false
		for dx in hs.doors:
			if absf(wx - dx) < 0.8:
				skip = true
		if skip:
			continue
		_mesh(_quad(Vector2(0.5, 0.42)), glow, Vector3(wx, 1.08, front + 0.05), Vector3.ZERO, self, false)
		_box(Vector3(0.62, 0.06, 0.1), beam, Vector3(wx, 0.84, front + 0.06))
		_box(Vector3(0.06, 0.48, 0.08), beam, Vector3(wx, 1.08, front + 0.07))
		var flower_box := _box(Vector3(0.6, 0.12, 0.16), beam, Vector3(wx, 0.78, front + 0.12))
		for f in 4:
			_sphere(0.06, _mat("fl%d" % (f % 3), [Color("ff7fa8"), Color("ffd75e"), Color("ffffff")][f % 3]), flower_box.position + Vector3(-0.22 + f * 0.15, 0.1, 0))


func _quad(size: Vector2) -> QuadMesh:
	var q := QuadMesh.new()
	q.size = size
	return q


func _build_props() -> void:
	var wood := _mat("wood", Color(1, 1, 1), _wood_tex())
	var hedge_m := _shader_mat("res://shaders/foliage.gdshader", {"dark": Color("1f5a2a"), "light": Color("6aa84a"), "sway": 0.0})
	var water_done := false
	for y in H:
		for x in W:
			var c := _at(x, y)
			var p := Vector3(x, 0, y)
			match c:
				"t":
					_tree(p, 1.0)
				"F":
					for side in [-0.42, 0.42]:
						_box(Vector3(0.1, 0.6, 0.1), wood, p + Vector3(side, 0.3, 0))
					_box(Vector3(1.0, 0.07, 0.06), wood, p + Vector3(0, 0.25, 0))
					_box(Vector3(1.0, 0.07, 0.06), wood, p + Vector3(0, 0.46, 0))
				"h":
					for k in 3:
						_sphere(0.34, hedge_m, p + Vector3(-0.33 + k * 0.33, 0.3, _rng.randf_range(-0.05, 0.05)), 0.85, 8)
				"p":
					_box(Vector3(0.85, 0.26, 0.5), wood, p + Vector3(0, 0.13, 0))
					for f in 5:
						_sphere(0.09, _mat("pf%d" % (f % 3), [Color("ff6f91"), Color("ffe066"), Color("ffffff")][f % 3]), p + Vector3(-0.32 + f * 0.16, 0.32, _rng.randf_range(-0.1, 0.1)))
				"q":
					_well(p)
				"b":
					_cyl(0.26, 0.24, 0.62, wood, p + Vector3(0, 0.31, 0))
					_cyl(0.27, 0.27, 0.05, _mat("hoop", Color("4a4a50"), null, 0.4), p + Vector3(0, 0.45, 0))
				"k":
					_box(Vector3(0.6, 0.55, 0.6), wood, p + Vector3(0, 0.275, 0), Vector3(0, 0.2, 0))
				"l":
					_lamp(p)
				"w":
					if not water_done and _at(x + 1, y) == "w" and _at(x, y + 1) == "w":
						_fountain(Vector3(x + 0.5, 0, y + 0.5))
						water_done = true
	# Market stalls on runs of "c".
	for y in H:
		var x := 0
		while x < W:
			if _at(x, y) != "c":
				x += 1
				continue
			var x1 := x
			while _at(x1 + 1, y) == "c":
				x1 += 1
			_stall(x, x1, y, Color("537d58") if x < W / 2 else Color("b5523f"))
			x = x1 + 1
	_bunting(Vector3(6.6, 1.75, 4.6), Vector3(16.4, 1.75, 4.6), 0.4, 26)
	_bunting(Vector3(1.0, 1.9, 8.55), Vector3(22.0, 1.9, 8.55), 0.6, 44)


func _tree(p: Vector3, s: float) -> void:
	var trunk := _mat("trunk", Color("6e4a2c"), _wood_tex())
	_cyl(0.1 * s, 0.17 * s, 1.1 * s, trunk, p + Vector3(0, 0.55 * s, 0), 8)
	var hue := _rng.randf_range(-0.03, 0.03)
	var leaves := _shader_mat("res://shaders/foliage.gdshader", {
		"dark": Color.from_hsv(0.33 + hue, 0.62, 0.32), "light": Color.from_hsv(0.25 + hue, 0.55, 0.78), "sway": 0.035})
	var blobs := [[Vector3(0, 1.45, 0), 0.62], [Vector3(-0.3, 1.2, 0.15), 0.45], [Vector3(0.32, 1.25, -0.05), 0.47], [Vector3(0.05, 1.85, 0.05), 0.42]]
	for b in blobs:
		_sphere(b[1] * s, leaves, p + b[0] * s, 0.92, 9)


func _well(p: Vector3) -> void:
	var stone := _mat("stone", Color(1, 1, 1), _stone_tex())
	_cyl(0.48, 0.5, 0.55, stone, p + Vector3(0, 0.27, 0), 14)
	var water := _shader_mat("res://shaders/water.gdshader")
	var disc := CylinderMesh.new()
	disc.top_radius = 0.38
	disc.bottom_radius = 0.38
	disc.height = 0.02
	_mesh(disc, water, p + Vector3(0, 0.5, 0), Vector3.ZERO, self, false)
	var wood := _mat("wood", Color(1, 1, 1), _wood_tex())
	for side in [-0.45, 0.45]:
		_box(Vector3(0.08, 1.2, 0.08), wood, p + Vector3(side, 0.6, 0))
	var roof := PrismMesh.new()
	roof.size = Vector3(1.25, 0.45, 0.9)
	_mesh(roof, _mat("roof1", Color("c0603e")), p + Vector3(0, 1.38, 0))
	_cyl(0.11, 0.09, 0.16, wood, p + Vector3(0.18, 0.9, 0), 8)


func _lamp(p: Vector3) -> void:
	var iron := _mat("iron", Color("2a2a32"), null, 0.5)
	_box(Vector3(0.1, 2.0, 0.1), iron, p + Vector3(0, 1.0, 0))
	_box(Vector3(0.26, 0.12, 0.26), iron, p + Vector3(0, 0.06, 0))
	var glass := StandardMaterial3D.new()
	glass.albedo_color = Color("ffe2a0")
	glass.emission_enabled = true
	glass.emission = Color("ffb04a")
	glass.emission_energy_multiplier = 3.0
	_box(Vector3(0.24, 0.3, 0.24), glass, p + Vector3(0, 2.12, 0))
	var cap := PrismMesh.new()
	cap.size = Vector3(0.36, 0.16, 0.36)
	_mesh(cap, iron, p + Vector3(0, 2.35, 0))
	var light := OmniLight3D.new()
	light.light_color = Color("ffb35c")
	light.light_energy = 1.4
	light.omni_range = 4.5
	light.position = p + Vector3(0, 2.0, 0.2)
	add_child(light)
	lamps.append(light)
	var halo := _mesh(_quad(Vector2(1.2, 1.2)), _additive(_radial_tex(Color(1, 0.75, 0.4, 0.5), Color(1, 0.6, 0.2, 0))), p + Vector3(0, 2.12, 0.02), Vector3.ZERO, self, false)
	(halo.material_override as StandardMaterial3D).billboard_mode = BaseMaterial3D.BILLBOARD_ENABLED


func _additive(tex: Texture2D) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	m.blend_mode = BaseMaterial3D.BLEND_MODE_ADD
	m.albedo_texture = tex
	m.vertex_color_use_as_albedo = true
	m.no_depth_test = false
	return m


func _fountain(c: Vector3) -> void:
	var stone := _mat("stone", Color(1, 1, 1), _stone_tex())
	var rim := _mat("cap", Color("cfc6b2"), _stone_tex())
	_cyl(0.98, 1.02, 0.4, stone, c + Vector3(0, 0.2, 0), 20)
	_cyl(1.04, 1.04, 0.08, rim, c + Vector3(0, 0.42, 0), 20)
	var water := _shader_mat("res://shaders/water.gdshader")
	var disc := CylinderMesh.new()
	disc.top_radius = 0.9
	disc.bottom_radius = 0.9
	disc.height = 0.02
	disc.radial_segments = 24
	_mesh(disc, water, c + Vector3(0, 0.36, 0), Vector3.ZERO, self, false)
	_cyl(0.13, 0.18, 1.0, stone, c + Vector3(0, 0.75, 0), 10)
	_cyl(0.42, 0.18, 0.16, rim, c + Vector3(0, 1.26, 0), 14)
	var bowl := CylinderMesh.new()
	bowl.top_radius = 0.36
	bowl.bottom_radius = 0.36
	bowl.height = 0.02
	_mesh(bowl, water, c + Vector3(0, 1.34, 0), Vector3.ZERO, self, false)
	# Spray: droplets thrown up from the top bowl and falling back into the basin.
	var drop_mat := StandardMaterial3D.new()
	drop_mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	drop_mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	drop_mat.billboard_mode = BaseMaterial3D.BILLBOARD_ENABLED
	drop_mat.vertex_color_use_as_albedo = true
	drop_mat.albedo_texture = _radial_tex(Color(1, 1, 1, 1), Color(1, 1, 1, 0))
	var drop := _quad(Vector2(0.09, 0.09))
	drop.material = drop_mat
	var p := CPUParticles3D.new()
	p.mesh = drop
	p.amount = 90
	p.lifetime = 1.1
	p.position = c + Vector3(0, 1.4, 0)
	p.direction = Vector3.UP
	p.spread = 28.0
	p.initial_velocity_min = 1.6
	p.initial_velocity_max = 2.2
	p.gravity = Vector3(0, -6.0, 0)
	p.color = Color(0.85, 0.96, 1.0, 0.85)
	p.scale_amount_min = 0.6
	p.scale_amount_max = 1.3
	add_child(p)
	var glow := OmniLight3D.new()
	glow.light_color = Color("8fd8ff")
	glow.light_energy = 0.5
	glow.omni_range = 2.6
	glow.position = c + Vector3(0, 0.8, 0)
	add_child(glow)


func _stall(x0: int, x1: int, y: int, color: Color) -> void:
	var wood := _mat("wood", Color(1, 1, 1), _wood_tex())
	var cx := (x0 + x1) / 2.0
	var w := x1 - x0 + 1.0
	_box(Vector3(w - 0.1, 0.75, 0.6), wood, Vector3(cx, 0.375, y))
	_box(Vector3(w, 0.06, 0.7), _mat("counter", Color("c69a62"), _wood_tex()), Vector3(cx, 0.78, y))
	for side in [x0 - 0.45, x1 + 0.45]:
		_box(Vector3(0.09, 1.75, 0.09), wood, Vector3(side, 0.87, y - 0.25))
		_box(Vector3(0.09, 1.45, 0.09), wood, Vector3(side, 0.72, y + 0.3))
	var stripe := func(x: int, _y: int, _r: RandomNumberGenerator) -> Color:
		return color if (x / 4) % 2 == 0 else Color("f6eedc")
	var stripes := _paint(32, 8, stripe, 2)
	var awning := StandardMaterial3D.new()
	awning.albedo_texture = stripes
	awning.texture_filter = BaseMaterial3D.TEXTURE_FILTER_NEAREST
	awning.uv1_scale = Vector3(w / 2.0, 1, 1)
	awning.cull_mode = BaseMaterial3D.CULL_DISABLED
	awning.roughness = 1.0
	_mesh(_quad(Vector2(w + 0.25, 0.95)), awning, Vector3(cx, 1.62, y + 0.05), Vector3(-1.0, 0, 0))
	for k in int(w) * 3:
		var gx := x0 - 0.35 + k * (w - 0.3) / (w * 3.0)
		var kind := k % 3
		if kind == 0:
			_sphere(0.09, _mat("apple", Color("d8342c"), null, 0.4), Vector3(gx, 0.88, y - 0.05))
		elif kind == 1:
			_cyl(0.05, 0.07, 0.24, _mat("bottle", Color("5cc8a8"), null, 0.15), Vector3(gx, 0.93, y + 0.1), 8)
		else:
			_box(Vector3(0.16, 0.12, 0.16), _mat("bread", Color("e0a95a")), Vector3(gx, 0.87, y))


func _bunting(a: Vector3, b: Vector3, sag: float, n: int) -> void:
	var cols := [Color("ff6b6b"), Color("ffd93d"), Color("6bcB77"), Color("4d96ff"), Color("ffffff")]
	for i in n:
		var t := (i + 0.5) / n
		var p := a.lerp(b, t) - Vector3(0, sin(t * PI) * sag, 0)
		var flag := PrismMesh.new()
		flag.size = Vector3(0.22, 0.26, 0.01)
		var m := _mat("flag%d" % (i % 5), cols[i % 5])
		m.cull_mode = BaseMaterial3D.CULL_DISABLED
		_mesh(flag, m, p - Vector3(0, 0.13, 0), Vector3(0, 0, PI), self, false)


func _build_surroundings() -> void:
	var big := PlaneMesh.new()
	big.size = Vector2(120, 120)
	var meadow := func(_x: int, _y: int, r: RandomNumberGenerator) -> Color:
		return [Color("4a8a42"), Color("538f47"), Color("5e9c4e"), Color("43803c")][r.randi() % 4]
	var tex := _paint(32, 32, meadow, 4)
	var m := StandardMaterial3D.new()
	m.albedo_texture = tex
	m.texture_filter = BaseMaterial3D.TEXTURE_FILTER_NEAREST_WITH_MIPMAPS
	m.uv1_scale = Vector3(60, 60, 1)
	m.roughness = 1.0
	_mesh(big, m, Vector3(W / 2.0, -0.02, H / 2.0), Vector3.ZERO, self, false)
	# Road leading south from the gate.
	var road := _mat("road", Color("b8945e"))
	_mesh(_flat(Vector2(4.0, 30.0)), road, Vector3(11.5, -0.01, H + 14.0), Vector3.ZERO, self, false)
	# Forest ring around the village, thinning toward the camera so the town stays visible.
	for i in 170:
		var p := Vector3(_rng.randf_range(-14, W + 14), 0, _rng.randf_range(-14, H + 12))
		var inside := p.x > -1.5 and p.x < W + 0.5 and p.z > -1.5 and p.z < H + 0.5
		var road_gap := absf(p.x - 11.5) < 3.2 and p.z > H - 1
		var near_cam := p.z > H + 2.5 and absf(p.x - W / 2.0) < 9
		if inside or road_gap or near_cam:
			continue
		_tree(p, _rng.randf_range(1.0, 1.7))
	for i in 7:
		var hill_m := _shader_mat("res://shaders/foliage.gdshader", {"dark": Color("2c5a3c"), "light": Color("5f8f5a"), "sway": 0.0, "speckle": 2.0})
		_sphere(_rng.randf_range(7, 11), hill_m, Vector3(-18 + i * 10, -3.5, -22 - _rng.randf_range(0, 6)), 0.6, 14)


func _flat(size: Vector2) -> PlaneMesh:
	var p := PlaneMesh.new()
	p.size = size
	return p


func _build_grass() -> void:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	for k in 6:
		var a := k * TAU / 6.0 + 0.4
		var lean := Vector3(cos(a), 0, sin(a)) * 0.08
		var side := Vector3(-sin(a), 0, cos(a)) * 0.035
		var h := 0.22 + (k % 3) * 0.06
		var base := Vector3(cos(a), 0, sin(a)) * 0.05
		st.set_uv(Vector2(0, 0)); st.add_vertex(base - side)
		st.set_uv(Vector2(0, 0)); st.add_vertex(base + side)
		st.set_uv(Vector2(0, 1)); st.add_vertex(base + lean + Vector3(0, h, 0))
	var tuft := st.commit()
	var spots: Array[Vector3] = []
	for y in H:
		for x in W:
			if _ground_kind(x, y) in ["grass", "flowers"] and _at(x, y) in [",", "f", "h", "p", "t"]:
				for k in 3:
					spots.append(Vector3(x + _rng.randf_range(-0.45, 0.45), 0, y + _rng.randf_range(-0.45, 0.45)))
	for k in 900:
		var p := Vector3(_rng.randf_range(-12, W + 12), 0, _rng.randf_range(-12, H + 10))
		if not (p.x > -0.6 and p.x < W - 0.4 and p.z > -0.6 and p.z < H - 0.4):
			spots.append(p)
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_3D
	mm.use_colors = true
	mm.mesh = tuft
	mm.instance_count = spots.size()
	for i in spots.size():
		var s := _rng.randf_range(0.8, 1.5)
		var t := Transform3D(Basis(Vector3.UP, _rng.randf() * TAU).scaled(Vector3(s, s, s)), spots[i])
		mm.set_instance_transform(i, t)
		mm.set_instance_color(i, Color.from_hsv(0.22 + _rng.randf() * 0.08, 0.5, 1.0))
	var mmi := MultiMeshInstance3D.new()
	mmi.multimesh = mm
	mmi.material_override = _shader_mat("res://shaders/grass.gdshader")
	mmi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(mmi)
	# Floating pollen catches the light around the square.
	var mote_mat := _additive(_radial_tex(Color(1, 0.95, 0.7, 1), Color(1, 0.9, 0.5, 0)))
	mote_mat.billboard_mode = BaseMaterial3D.BILLBOARD_ENABLED
	var mote := _quad(Vector2(0.08, 0.08))
	mote.material = mote_mat
	var motes := CPUParticles3D.new()
	motes.mesh = mote
	motes.amount = 70
	motes.lifetime = 7.0
	motes.preprocess = 7.0
	motes.emission_shape = CPUParticles3D.EMISSION_SHAPE_BOX
	motes.emission_box_extents = Vector3(W / 2.0, 1.2, H / 2.0)
	motes.position = Vector3(W / 2.0, 1.4, H / 2.0)
	motes.gravity = Vector3(0, 0.03, 0)
	motes.direction = Vector3(1, 0.2, 0)
	motes.spread = 180.0
	motes.initial_velocity_min = 0.05
	motes.initial_velocity_max = 0.25
	motes.color = Color(1, 0.95, 0.75, 0.9)
	add_child(motes)


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
		lamps[i].light_energy = 1.3 + sin(t * 9.0 + i * 2.0) * 0.08 + sin(t * 23.0 + i) * 0.05
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
	var want := target + Vector3(0, 9.4, 12.4)
	camera.position = want if snap else camera.position.lerp(want, 1.0 - exp(-delta * 5.0))
	camera.look_at(camera.position - Vector3(0, 9.4, 12.4), Vector3.UP)


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
