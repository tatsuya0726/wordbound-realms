class_name Art
extends RefCounted
## Shared procedural art for the 3D scenes: pixel textures, instanced foliage, lighting and the finishing pass.
## Textures are slow to paint in the web build, so Game.bake() saves them to assets/baked and tex() loads those.

const BAKED := "res://assets/baked/%s.png"
const TEXTURES := ["leaves", "grass_card", "flower_card", "cobble", "meadow", "dirt", "roof", "plaster", "stonewall", "planks", "bark", "birch"]

static var _cache := {}


static func tex(name: String) -> Texture2D:
	if _cache.has(name):
		return _cache[name]
	var path := BAKED % name
	var t: Texture2D
	if ResourceLoader.exists(path):
		t = load(path)
	else:
		t = ImageTexture.create_from_image(paint(name))
	_cache[name] = t
	return t


static func paint(name: String) -> Image:
	var img: Image
	match name:
		"leaves": img = _paint_leaves()
		"grass_card": img = _paint_grass_card()
		"flower_card": img = _paint_flower_card()
		"cobble": img = _paint_cobble()
		"meadow": img = _paint_meadow()
		"dirt": img = _paint_dirt()
		"roof": img = _paint_roof()
		"plaster": img = _paint_plaster()
		"stonewall": img = _paint_stonewall()
		"planks": img = _paint_planks()
		"bark": img = _paint_bark()
		"birch": img = _paint_birch()
	img.generate_mipmaps()
	return img


# ================================================================ painting helpers

static func _blank(w: int, h: int, fill := Color(0, 0, 0, 0)) -> Image:
	var img := Image.create(w, h, false, Image.FORMAT_RGBA8)
	img.fill(fill)
	return img


## Value noise that tiles every `period` pixels.
static func _noise(x: float, y: float, period: int, seed: int) -> float:
	var xi := int(floor(x))
	var yi := int(floor(y))
	var fx := x - xi
	var fy := y - yi
	fx = fx * fx * (3.0 - 2.0 * fx)
	fy = fy * fy * (3.0 - 2.0 * fy)
	var a := _hash(posmod(xi, period), posmod(yi, period), seed)
	var b := _hash(posmod(xi + 1, period), posmod(yi, period), seed)
	var c := _hash(posmod(xi, period), posmod(yi + 1, period), seed)
	var d := _hash(posmod(xi + 1, period), posmod(yi + 1, period), seed)
	return lerpf(lerpf(a, b, fx), lerpf(c, d, fx), fy)


static func _hash(x: int, y: int, seed: int) -> float:
	var h := (x * 374761393 + y * 668265263 + seed * 2147483) & 0x7fffffff
	h = ((h ^ (h >> 13)) * 1274126177) & 0x7fffffff
	return float(h & 0xffff) / 65535.0


static func _fbm(x: float, y: float, size: int, seed: int) -> float:
	var v := 0.0
	var amp := 0.5
	var cells := 4
	for o in 3:
		v += _noise(x / size * cells, y / size * cells, cells, seed + o * 31) * amp
		cells *= 2
		amp *= 0.5
	return v / 0.875


static func _blend(img: Image, x: int, y: int, c: Color) -> void:
	var w := img.get_width()
	var h := img.get_height()
	x = posmod(x, w)
	y = posmod(y, h)
	img.set_pixel(x, y, img.get_pixel(x, y).blend(c))


# ================================================================ textures

static func _paint_leaves() -> Image:
	# A clump of overlapping pixel leaves, lit from the upper left, transparent around the edge.
	var s := 128
	var img := _blank(s, s)
	var r := RandomNumberGenerator.new()
	r.seed = 3
	var leaves := []
	for i in 150:
		var ang := r.randf() * TAU
		var rad := sqrt(r.randf()) * 50.0
		leaves.append([Vector2(64, 64) + Vector2(cos(ang), sin(ang) * 0.9) * rad, r.randf() * TAU, r.randf_range(7, 12), r.randf_range(3.5, 5.5), r.randf()])
	leaves.sort_custom(func(a, b): return a[0].y < b[0].y)
	var light := Vector2(-0.6, -0.8).normalized()
	for L in leaves:
		var c: Vector2 = L[0]
		var ang: float = L[1]
		var a: float = L[2]
		var b: float = L[3]
		var dir := Vector2(cos(ang), sin(ang))
		var nrm := Vector2(-dir.y, dir.x)
		var depth := clampf((c.y - 14.0) / 100.0, 0.0, 1.0)
		var base := Color.from_hsv(0.27 + L[4] * 0.07, 0.62 + L[4] * 0.15, 0.95 - depth * 0.45)
		for y in range(int(c.y - a - 1), int(c.y + a + 2)):
			for x in range(int(c.x - a - 1), int(c.x + a + 2)):
				if x < 0 or y < 0 or x >= s or y >= s:
					continue
				var p := Vector2(x, y) - c
				var u := p.dot(dir) / a
				var v := p.dot(nrm) / b
				var edge := u * u + v * v * (1.0 + absf(u) * 0.8)
				if edge > 1.0:
					continue
				var lit := 0.85 + 0.35 * (-(p.normalized().dot(light)) * 0.5 + 0.5) - edge * 0.25
				var col := base * lit
				if absf(v) < 0.14 and absf(u) < 0.8:
					col = col.darkened(0.18)
				col.a = 1.0
				img.set_pixel(x, y, col)
	return img


static func _paint_grass_card() -> Image:
	var w := 64
	var h := 64
	var img := _blank(w, h)
	var r := RandomNumberGenerator.new()
	r.seed = 5
	for i in 34:
		var x0 := r.randf_range(4, w - 4)
		var hh := r.randf_range(26, 60)
		var lean := r.randf_range(-14, 14)
		var hue := r.randf_range(0.22, 0.3)
		for t in int(hh):
			var k := float(t) / hh
			var x := x0 + lean * k * k
			var y := h - 1 - t
			var width := maxf(0.6, 2.6 * (1.0 - k))
			var col := Color.from_hsv(hue, 0.7 - k * 0.25, 0.32 + k * 0.6)
			for dx in range(int(floor(x - width)), int(ceil(x + width))):
				if dx >= 0 and dx < w:
					img.set_pixel(dx, y, col)
	return img


static func _paint_flower_card() -> Image:
	var img := _blank(32, 32)
	var r := RandomNumberGenerator.new()
	r.seed = 9
	for i in 4:
		var x := r.randi_range(5, 26)
		var top := r.randi_range(6, 16)
		for y in range(top, 32):
			img.set_pixel(x, y, Color("4c8a3a"))
		for dy in range(-2, 3):
			for dx in range(-2, 3):
				if absi(dx) + absi(dy) <= 2:
					var c := Color(1, 1, 1) if absi(dx) + absi(dy) > 0 else Color(1, 0.85, 0.3)
					img.set_pixel(clampi(x + dx, 0, 31), clampi(top + dy, 0, 31), c)
	return img


## Tileable Voronoi cobbles: domed stones with dark, mossy joints.
static func _paint_cobble() -> Image:
	var s := 64
	var img := _blank(s, s)
	var r := RandomNumberGenerator.new()
	r.seed = 21
	var g := 5
	var pts := []
	var cols := []
	var palette := [Color("a89f8f"), Color("9a9183"), Color("b3a995"), Color("8f887d"), Color("a49a86")]
	for gy in g:
		for gx in g:
			pts.append(Vector2((gx + r.randf_range(0.2, 0.8)) * s / g, (gy + r.randf_range(0.2, 0.8)) * s / g))
			cols.append(palette[r.randi() % palette.size()].lightened(r.randf_range(-0.05, 0.06)))
	for y in s:
		for x in s:
			var f1 := 1e9
			var f2 := 1e9
			var best := 0
			var bv := Vector2.ZERO
			for i in pts.size():
				for oy: int in [-s, 0, s]:
					for ox: int in [-s, 0, s]:
						var d := Vector2(x, y).distance_to(pts[i] + Vector2(ox, oy))
						if d < f1:
							f2 = f1
							f1 = d
							best = i
							bv = Vector2(x, y) - (pts[i] + Vector2(ox, oy))
						elif d < f2:
							f2 = d
			var edge := f2 - f1
			var c: Color
			if edge < 1.6:
				c = Color("4d473d") if _hash(x, y, 4) > 0.25 else Color("55703a")
			else:
				var dome := clampf(1.0 - f1 / 9.0, 0.0, 1.0)
				var lit := 0.78 + dome * 0.22 - clampf(bv.dot(Vector2(0.6, 0.7)) / 10.0, -0.12, 0.2)
				c = cols[best] * lit
				if edge < 2.8:
					c = c.darkened(0.16)
				c = c.lightened((_hash(x, y, 8) - 0.5) * 0.08)
			c.a = 1.0
			img.set_pixel(x, y, c)
	return img


static func _paint_meadow() -> Image:
	var s := 64
	var img := _blank(s, s)
	for y in s:
		for x in s:
			var n := _fbm(x, y, s, 2)
			var c := Color("3f7a35").lerp(Color("6aa54c"), n)
			var hsh := _hash(x, y, 7)
			if hsh > 0.93:
				c = c.lightened(0.18)
			elif hsh < 0.08:
				c = c.darkened(0.2)
			c.a = 1.0
			img.set_pixel(x, y, c)
	# Short blade strokes give the ground a combed texture.
	var r := RandomNumberGenerator.new()
	r.seed = 12
	for i in 140:
		var x := r.randi_range(0, s - 1)
		var y := r.randi_range(0, s - 1)
		var c := Color("2f5f2a") if r.randf() < 0.5 else Color("86c060")
		for t in 3:
			_blend(img, x + (1 if t == 2 else 0), y - t, Color(c, 0.8))
	return img


static func _paint_dirt() -> Image:
	var s := 64
	var img := _blank(s, s)
	for y in s:
		for x in s:
			var n := _fbm(x, y, s, 5)
			var c := Color("7a5a3a").lerp(Color("b08a5c"), n)
			if _hash(x, y, 3) > 0.96:
				c = Color("d2b48a")
			c.a = 1.0
			img.set_pixel(x, y, c)
	var r := RandomNumberGenerator.new()
	r.seed = 4
	for i in 22:
		var cx := r.randi_range(0, s - 1)
		var cy := r.randi_range(0, s - 1)
		var pc := Color("8d8578").lightened(r.randf() * 0.2)
		for dy in 3:
			for dx in 3:
				if dx * dy != 4:
					_blend(img, cx + dx, cy + dy, pc.darkened(0.15 * dy))
	return img


static func _paint_roof() -> Image:
	# Rows of rounded clay tiles; tinted per building through the material colour.
	var s := 64
	var img := _blank(s, s)
	for y in s:
		for x in s:
			var row := y / 8
			var lx := (x + (4 if row % 2 else 0)) % 8
			var ly := y % 8
			var round_edge := absf(lx - 3.5) / 4.0
			var c := Color(0.92, 0.92, 0.92) * (1.08 - ly * 0.06) * (1.0 - round_edge * round_edge * 0.35)
			if ly >= 7 - int(round_edge * 2.0):
				c = Color(0.38, 0.38, 0.4)
			if lx == 0:
				c = c.darkened(0.3)
			c = c.lightened((_hash(x / 8, row, 2) - 0.5) * 0.12)
			c.a = 1.0
			img.set_pixel(x, y, c)
	return img


static func _paint_plaster() -> Image:
	var s := 64
	var img := _blank(s, s)
	for y in s:
		for x in s:
			var n := _fbm(x, y, s, 9)
			var c := Color("efe3c8").lerp(Color("d9c9a8"), n * 0.7)
			if _hash(x, y, 1) > 0.97:
				c = c.darkened(0.08)
			c.a = 1.0
			img.set_pixel(x, y, c)
	return img


static func _paint_stonewall() -> Image:
	var s := 64
	var img := _blank(s, s)
	var r := RandomNumberGenerator.new()
	r.seed = 17
	img.fill(Color("4e4a42"))
	var y := 0
	while y < s:
		var hgt := 10 if (y / 10) % 2 == 0 else 11
		hgt = mini(hgt, s - y)
		var x := -r.randi_range(0, 10)
		while x < s:
			var wid := r.randi_range(12, 20)
			var base := Color("a59c8c").lerp(Color("7f786c"), r.randf())
			for yy in range(y + 1, y + hgt - 1):
				for xx in range(x + 1, x + wid - 1):
					var px := posmod(xx, s)
					var lit := 1.0 + (0.12 if yy - y < 3 else 0.0) - (0.15 if yy > y + hgt - 4 else 0.0) - (0.08 if xx > x + wid - 3 else 0.0)
					var c := base * lit
					c = c.lightened((_hash(px, yy, 5) - 0.5) * 0.1)
					c.a = 1.0
					img.set_pixel(px, yy, c)
			x += wid
		y += hgt
	return img


static func _paint_planks() -> Image:
	var s := 64
	var img := _blank(s, s)
	for y in s:
		for x in s:
			var plank := x / 11
			var grain := _noise(x * 0.3, y * 0.05 + plank * 7.0, 64, 3)
			var c := Color("8a5c34").lerp(Color("a8764a"), grain) * (0.92 + (plank % 3) * 0.05)
			if x % 11 == 0:
				c = Color("4a2e18")
			c.a = 1.0
			img.set_pixel(x, y, c)
	return img


static func _paint_bark() -> Image:
	var img := _blank(32, 64)
	for y in 64:
		for x in 32:
			var n := _noise(x * 0.5, y * 0.08, 16, 6)
			var c := Color("4a3220").lerp(Color("7a5634"), n)
			if _hash(x, y / 3, 2) > 0.85:
				c = c.darkened(0.25)
			c.a = 1.0
			img.set_pixel(x, y, c)
	return img


static func _paint_birch() -> Image:
	var img := _blank(32, 64)
	var r := RandomNumberGenerator.new()
	r.seed = 8
	for y in 64:
		for x in 32:
			var c := Color("e9e6dc").lerp(Color("c9c4b6"), _noise(x * 0.4, y * 0.1, 16, 2))
			c.a = 1.0
			img.set_pixel(x, y, c)
	for i in 16:
		var cy := r.randi_range(0, 63)
		var cx := r.randi_range(0, 31)
		var mark := r.randi_range(3, 10)
		for dx in mark:
			img.set_pixel((cx + dx) % 32, cy, Color("2a2622"))
			if dx > 1 and dx < mark - 1:
				img.set_pixel((cx + dx) % 32, (cy + 1) % 64, Color("3a352e"))
	return img


# ================================================================ materials

static func pixel_mat(t: Texture2D, color := Color.WHITE, scale := Vector3.ONE, rough := 0.95) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_texture = t
	m.albedo_color = color
	m.texture_filter = BaseMaterial3D.TEXTURE_FILTER_NEAREST_WITH_MIPMAPS
	m.uv1_triplanar = true
	m.uv1_world_triplanar = true
	m.uv1_scale = scale
	m.roughness = rough
	return m


static func shader_mat(path: String, params := {}) -> ShaderMaterial:
	var m := ShaderMaterial.new()
	m.shader = load(path)
	for k in params:
		m.set_shader_parameter(k, params[k])
	return m


static func glow_mat(color: Color, energy := 2.0) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = color
	m.emission_enabled = true
	m.emission = color
	m.emission_energy_multiplier = energy
	return m


static func soft_tex(inner: Color, outer: Color, size := 64) -> GradientTexture2D:
	var g := Gradient.new()
	g.set_color(0, inner)
	g.set_color(1, outer)
	var t := GradientTexture2D.new()
	t.gradient = g
	t.fill = GradientTexture2D.FILL_RADIAL
	t.fill_from = Vector2(0.5, 0.5)
	t.fill_to = Vector2(1.0, 0.5)
	t.width = size
	t.height = size
	return t


static func additive(t: Texture2D, billboard := true) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	m.blend_mode = BaseMaterial3D.BLEND_MODE_ADD
	m.albedo_texture = t
	m.vertex_color_use_as_albedo = true
	m.cull_mode = BaseMaterial3D.CULL_DISABLED
	if billboard:
		m.billboard_mode = BaseMaterial3D.BILLBOARD_ENABLED
	return m


static func soft_particle_mat(t: Texture2D) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	m.billboard_mode = BaseMaterial3D.BILLBOARD_ENABLED
	m.vertex_color_use_as_albedo = true
	m.albedo_texture = t
	return m


# ================================================================ instanced foliage

## Collects trees, grass and flowers and builds one MultiMesh per kind, so thousands of cards cost a few draw calls.
class Foliage:
	var leaves: Array[Transform3D] = []
	var leaf_colors: Array[Color] = []
	var trunks: Array[Transform3D] = []
	var birches: Array[Transform3D] = []
	var grass: Array[Transform3D] = []
	var grass_colors: Array[Color] = []
	var flowers: Array[Transform3D] = []
	var flower_colors: Array[Color] = []
	var rng := RandomNumberGenerator.new()

	func _init(seed := 1) -> void:
		rng.seed = seed

	## Round deciduous tree: tapered trunk and a crown of leaf cards around a few lobes.
	func tree(p: Vector3, s := 1.0, hue := 0.0, birch := false) -> void:
		var h := (1.3 if not birch else 2.4) * s
		var trunk := Transform3D(Basis().scaled(Vector3(s, h, s)), p + Vector3(0, h / 2.0, 0))
		if birch:
			birches.append(trunk)
		else:
			trunks.append(trunk)
		var lobes := [Vector3(0, 1.0, 0), Vector3(-0.42, 0.75, 0.12), Vector3(0.45, 0.8, -0.1), Vector3(0.05, 1.42, 0.05), Vector3(0.1, 0.85, 0.42)]
		var lift := h - 0.6 * s
		for lobe in lobes:
			var c: Vector3 = p + Vector3(0, lift, 0) + lobe * s * (0.9 if not birch else 0.75)
			for k in 9:
				var dir := Vector3(rng.randf_range(-1, 1), rng.randf_range(-0.6, 1), rng.randf_range(-1, 1)).normalized()
				var pos := c + dir * 0.42 * s
				var b := Basis(Vector3.UP, rng.randf() * TAU) * Basis(Vector3.RIGHT, rng.randf_range(-0.5, 0.5))
				leaves.append(Transform3D(b.scaled(Vector3.ONE * s * rng.randf_range(0.85, 1.15)), pos))
				# Lower and inner cards are darker, which reads as self-shadowing inside the crown.
				var shade := clampf(0.62 + (pos.y - p.y - lift + 0.6 * s) / (1.6 * s) * 0.45 + dir.dot(Vector3(-0.5, 0.4, 0.6)) * 0.12, 0.45, 1.15)
				var tint := Color(1.0 + hue, 1.0, 1.0 - hue * 1.5)
				leaf_colors.append(Color(tint.r * shade, tint.g * shade, tint.b * shade))

	func grass_clump(p: Vector3, s := 1.0, tint := Color.WHITE) -> void:
		grass.append(Transform3D(Basis(Vector3.UP, rng.randf() * TAU).scaled(Vector3(s, s * rng.randf_range(0.8, 1.2), s)), p))
		grass_colors.append(tint)

	func flower(p: Vector3, c: Color) -> void:
		flowers.append(Transform3D(Basis(Vector3.UP, rng.randf() * TAU).scaled(Vector3.ONE * rng.randf_range(0.8, 1.2)), p))
		flower_colors.append(c)

	func build(parent: Node3D) -> void:
		_multi(parent, _cross_mesh(Vector2(1.1, 1.1), 0.0, 2), leaves, leaf_colors,
			Art.shader_mat("res://shaders/leaves.gdshader", {"albedo": Art.tex("leaves")}), true)
		var trunk := CylinderMesh.new()
		trunk.top_radius = 0.08
		trunk.bottom_radius = 0.15
		trunk.height = 1.0
		trunk.radial_segments = 7
		trunk.rings = 1
		_multi(parent, trunk, trunks, [], Art.pixel_mat(Art.tex("bark"), Color.WHITE, Vector3(2, 1, 2)), true)
		var birch := CylinderMesh.new()
		birch.top_radius = 0.06
		birch.bottom_radius = 0.1
		birch.height = 1.0
		birch.radial_segments = 7
		birch.rings = 1
		_multi(parent, birch, birches, [], Art.pixel_mat(Art.tex("birch"), Color.WHITE, Vector3(2, 0.6, 2)), true)
		_multi(parent, _cross_mesh(Vector2(0.75, 0.5), 0.25, 3), grass, grass_colors,
			Art.shader_mat("res://shaders/cards.gdshader", {"albedo": Art.tex("grass_card"), "sway": 0.08}), false)
		_multi(parent, _cross_mesh(Vector2(0.35, 0.35), 0.17, 2), flowers, flower_colors,
			Art.shader_mat("res://shaders/cards.gdshader", {"albedo": Art.tex("flower_card"), "sway": 0.05}), false)

	func _multi(parent: Node3D, mesh: Mesh, xf: Array[Transform3D], colors: Array, mat: Material, shadows: bool) -> void:
		if xf.is_empty():
			return
		var mm := MultiMesh.new()
		mm.transform_format = MultiMesh.TRANSFORM_3D
		mm.use_colors = not colors.is_empty()
		mm.mesh = mesh
		mm.instance_count = xf.size()
		for i in xf.size():
			mm.set_instance_transform(i, xf[i])
			if mm.use_colors:
				mm.set_instance_color(i, colors[i])
		var mi := MultiMeshInstance3D.new()
		mi.multimesh = mm
		mi.material_override = mat
		mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON if shadows else GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		parent.add_child(mi)

	## Crossed vertical quads; UV.y runs 0 at the top to 1 at the ground so shaders can sway the tips.
	static func _cross_mesh(size: Vector2, y0: float, planes: int) -> ArrayMesh:
		var st := SurfaceTool.new()
		st.begin(Mesh.PRIMITIVE_TRIANGLES)
		for k in planes:
			var a := k * PI / planes
			var dx := Vector3(cos(a), 0, sin(a)) * size.x / 2.0
			var n := Vector3(-sin(a), 0, cos(a))
			var bottom := y0 - size.y / 2.0 if y0 == 0.0 else 0.0
			var top := bottom + size.y
			var corners := [[-dx + Vector3(0, top, 0), Vector2(0, 0)], [dx + Vector3(0, top, 0), Vector2(1, 0)],
				[dx + Vector3(0, bottom, 0), Vector2(1, 1)], [-dx + Vector3(0, bottom, 0), Vector2(0, 1)]]
			for i: int in [0, 1, 2, 0, 2, 3]:
				st.set_normal(Vector3.UP)
				st.set_uv(corners[i][1])
				st.add_vertex(corners[i][0])
		return st.commit()


# ================================================================ scene setup

static func environment(parent: Node, look: Dictionary) -> DirectionalLight3D:
	var env := Environment.new()
	var sky_mat := ProceduralSkyMaterial.new()
	sky_mat.sky_top_color = look.get("sky_top", Color("4f86c6"))
	sky_mat.sky_horizon_color = look.get("horizon", Color("f2d8b0"))
	sky_mat.ground_bottom_color = Color("2b3b2a")
	sky_mat.ground_horizon_color = look.get("horizon", Color("f2d8b0"))
	sky_mat.sun_angle_max = 20.0
	var sky := Sky.new()
	sky.sky_material = sky_mat
	env.background_mode = Environment.BG_SKY
	env.sky = sky
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = look.get("ambient", Color("8fa6d6"))
	env.ambient_light_energy = look.get("ambient_energy", 0.55)
	env.tonemap_mode = Environment.TONE_MAPPER_ACES
	env.tonemap_exposure = look.get("exposure", 1.0)
	env.tonemap_white = 6.0
	env.glow_enabled = true
	env.glow_intensity = 0.55
	env.glow_strength = 1.0
	env.glow_bloom = 0.04
	env.glow_hdr_threshold = 1.2
	env.glow_blend_mode = Environment.GLOW_BLEND_MODE_ADDITIVE
	env.set_glow_level(1, 0.0)
	env.set_glow_level(2, 1.0)
	env.set_glow_level(3, 1.0)
	env.set_glow_level(5, 0.6)
	env.fog_enabled = true
	env.fog_light_color = look.get("fog", Color("d9c7a3"))
	env.fog_density = look.get("fog_density", 0.012)
	env.fog_sky_affect = 0.3
	env.fog_sun_scatter = 0.25
	env.adjustment_enabled = true
	env.adjustment_saturation = look.get("saturation", 1.18)
	env.adjustment_contrast = 1.08
	var we := WorldEnvironment.new()
	we.environment = env
	parent.add_child(we)

	var sun := DirectionalLight3D.new()
	sun.light_color = look.get("sun", Color("ffd29a"))
	sun.light_energy = look.get("sun_energy", 1.55)
	sun.shadow_enabled = true
	sun.shadow_blur = 1.4
	sun.shadow_bias = 0.03
	sun.shadow_normal_bias = 1.0
	sun.directional_shadow_max_distance = look.get("shadow_distance", 40.0)
	sun.directional_shadow_mode = DirectionalLight3D.SHADOW_PARALLEL_2_SPLITS
	parent.add_child(sun)
	return sun


static func finishing_pass(parent: Node, params := {}) -> ShaderMaterial:
	var post := CanvasLayer.new()
	post.layer = 1
	parent.add_child(post)
	var rect := ColorRect.new()
	rect.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var m := shader_mat("res://shaders/tilt_shift.gdshader", params)
	rect.material = m
	post.add_child(rect)
	return m
