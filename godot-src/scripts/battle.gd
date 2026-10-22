extends Node3D
## Party battle on a 3D birch-meadow set against 1–3 wild companions. Commands are answered in English;
## wrong answers still fire at 50%. The camera pushes in on each strike, Octopath-style.

const AIRBORNE := ["pinecone_sparrow", "lantern_moth", "thunder_feather_owlet"]
## Meadow encounters mirror the web zone w1 (blot/bat/imp) with this world's creatures.
const FOES := {
	"lotus_root_sproutling": {"hp": 12, "atk": 5, "exp": 5, "gold": 4},
	"lantern_moth": {"hp": 10, "atk": 6, "exp": 6, "gold": 5},
	"silk_leaf_caterpillar": {"hp": 16, "atk": 7, "exp": 8, "gold": 7},
	"pinecone_sparrow": {"hp": 11, "atk": 6, "exp": 6, "gold": 5}}
const CMD_COLOR := {"atk": Color(1.0, 0.82, 0.38), "spl": Color(0.78, 0.5, 1.0), "lis": Color(0.4, 0.95, 1.0)}
const CAM_HOME := Vector3(0.5, 3.7, 8.4)
const CAM_LOOK := Vector3(-0.2, 0.15, -0.2)

signal command_chosen(cmd: String)

var return_pos := Vector2(-1, -1)
var enemies: Array = []
var target := 0
var combo := 0
var turn := 0

var camera: Camera3D
var _cam_pos := CAM_HOME
var _cam_look := CAM_LOOK
var _shake := 0.0
var _party: Array[Sprite3D] = []
var _ui: Control
var _msg: Label
var _msg_panel: PanelContainer
var _cmd_panel: PanelContainer
var _cmd_box: VBoxContainer
var _hp_bar: ProgressBar
var _mp_bar: ProgressBar
var _status: Label
var _arrow: Label
var dialog: DialogUI
var _choosing := false
var _rng := RandomNumberGenerator.new()
var _foliage: Art.Foliage


func setup(args: Dictionary) -> void:
	return_pos = args.get("return_pos", Vector2(-1, -1))


func _ready() -> void:
	_rng.seed = randi()
	_build_set()
	_build_party()
	_build_ui()
	dialog = DialogUI.new()
	add_child(dialog)
	_spawn()
	get_viewport().size_changed.connect(_layout)
	_layout.call_deferred()
	Game.music("battle")
	_run.call_deferred()


# ================================================================ set

func _build_set() -> void:
	var sun := Art.environment(self, {
		"sky_top": Color("5d93cf"), "horizon": Color("dfe9c8"), "ambient": Color("8db0c8"), "ambient_energy": 0.5,
		"sun": Color("ffe9bf"), "sun_energy": 1.35, "fog": Color("9fb89a"), "fog_density": 0.009, "exposure": 0.9, "shadow_distance": 30.0})
	sun.look_at_from_position(Vector3(-6, 9, 5), Vector3.ZERO)
	camera = Camera3D.new()
	camera.fov = 34.0
	camera.near = 0.3
	camera.far = 90.0
	add_child(camera)
	camera.position = CAM_HOME + Vector3(0, 1.2, 3.0)
	camera.look_at(CAM_LOOK)
	Art.finishing_pass(self, {"blur_px": 4.0, "band": 0.24, "focus_y": 0.52, "vignette": 0.6})

	# Meadow floor with a trodden dirt clearing where the fight happens.
	var splat := Image.create(64, 64, false, Image.FORMAT_RGBA8)
	for y in 64:
		for x in 64:
			var d := Vector2(x - 32, (y - 34) * 1.5).length()
			splat.set_pixel(x, y, Color(0, clampf(1.2 - d / 11.0, 0, 1), 0, 1.0 - clampf(0.25 - d / 80.0, 0, 0.25)))
	var ground := Art.shader_mat("res://shaders/ground.gdshader", {
		"splat": ImageTexture.create_from_image(splat), "tex_grass": Art.tex("meadow"), "tex_cobble": Art.tex("cobble"),
		"tex_dirt": Art.tex("dirt"), "map_origin": Vector2(-16, -16), "map_size": Vector2(32, 32), "tile_scale": 0.5})
	var plane := PlaneMesh.new()
	plane.size = Vector2(90, 90)
	var g := MeshInstance3D.new()
	g.mesh = plane
	g.material_override = ground
	add_child(g)

	_foliage = Art.Foliage.new(23)
	# Birch grove framing the clearing, echoing the painted backdrop.
	for i in 80:
		var a := _rng.randf_range(-PI * 0.95, -PI * 0.05)
		var r := _rng.randf_range(6.0, 15.0)
		var p := Vector3(cos(a) * r * 1.4, 0, sin(a) * r * 1.1 - 1.5)
		_foliage.tree(p, _rng.randf_range(1.0, 1.5), _rng.randf_range(0.02, 0.08), _rng.randf() < 0.7)
	for side: int in [-1, 1]:
		for i in 4:
			_foliage.tree(Vector3(side * _rng.randf_range(6.5, 9.5), 0, _rng.randf_range(0.0, 6.0)), _rng.randf_range(1.0, 1.4), 0.05, true)
	for i in 1800:
		var p := Vector2(_rng.randf_range(-16, 16), _rng.randf_range(-16, 9))
		if Vector2(p.x, (p.y + 0.6) * 1.5).length() < 5.5:
			continue
		_foliage.grass_clump(Vector3(p.x, 0, p.y), _rng.randf_range(0.8, 1.3), Color(_rng.randf_range(0.9, 1.1), 1, _rng.randf_range(0.85, 1.0)))
		if _rng.randf() < 0.07:
			_foliage.flower(Vector3(p.x + 0.1, 0, p.y), [Color("ffffff"), Color("ffd84a"), Color("ff8fb8")][_rng.randi() % 3])
	_foliage.build(self)
	var rock := Art.pixel_mat(Art.tex("stonewall"), Color(0.9, 0.92, 0.95), Vector3(0.7, 0.7, 0.7))
	for p: Vector3 in [Vector3(4.6, 0, -3.6), Vector3(5.4, 0, -2.8), Vector3(-5.2, 0, -4.2), Vector3(3.8, 0, 2.2)]:
		var s := SphereMesh.new()
		s.radius = _rng.randf_range(0.45, 0.8)
		s.height = s.radius * 1.2
		s.radial_segments = 7
		s.rings = 4
		var m := MeshInstance3D.new()
		m.mesh = s
		m.material_override = rock
		m.position = p + Vector3(0, s.radius * 0.3, 0)
		m.rotation.y = _rng.randf() * TAU
		add_child(m)

	# Sun shafts and drifting pollen.
	var shaft_tex := GradientTexture2D.new()
	var grad := Gradient.new()
	grad.set_color(0, Color(1, 0.95, 0.75, 0.0))
	grad.add_point(0.35, Color(1, 0.93, 0.7, 0.09))
	grad.set_color(grad.get_point_count() - 1, Color(1, 0.9, 0.6, 0.0))
	shaft_tex.gradient = grad
	for i in 5:
		var q := QuadMesh.new()
		q.size = Vector2(1.4 + i * 0.3, 12.0)
		var m := MeshInstance3D.new()
		m.mesh = q
		m.material_override = Art.additive(shaft_tex, false)
		m.position = Vector3(-7 + i * 3.4, 4.5, -5.0 + i * 0.5)
		m.rotation = Vector3(0, 0.25, -0.5)
		m.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		m.set_meta("phase", i * 1.3)
		m.add_to_group("shafts")
		add_child(m)
	var mote := QuadMesh.new()
	mote.size = Vector2(0.06, 0.06)
	mote.material = Art.additive(Art.soft_tex(Color(1, 0.95, 0.7, 1), Color(1, 0.9, 0.5, 0)))
	var motes := CPUParticles3D.new()
	motes.mesh = mote
	motes.amount = 60
	motes.lifetime = 8.0
	motes.preprocess = 8.0
	motes.emission_shape = CPUParticles3D.EMISSION_SHAPE_BOX
	motes.emission_box_extents = Vector3(8, 2, 6)
	motes.position = Vector3(0, 2, -1)
	motes.gravity = Vector3(0.02, 0.02, 0)
	motes.spread = 180.0
	motes.initial_velocity_min = 0.05
	motes.initial_velocity_max = 0.2
	motes.color = Color(1, 0.95, 0.75, 0.9)
	add_child(motes)


func _build_party() -> void:
	# Seen from behind: Kiki, the boy and Nene stand in the foreground facing the enemies.
	var spots := {"kiki": Vector3(-2.7, 0, 1.7), "boy": Vector3(-1.75, 0, 2.05), "nene": Vector3(-0.8, 0, 1.7)}
	for id in spots:
		var s := Sprite3D.new()
		s.texture = load("res://assets/walk/%s.png" % id)
		s.hframes = 3
		s.vframes = 4
		s.frame = 3 * 3 + 1
		s.pixel_size = 0.0185 if id == "boy" else 0.0135
		s.billboard = BaseMaterial3D.BILLBOARD_FIXED_Y
		s.texture_filter = BaseMaterial3D.TEXTURE_FILTER_NEAREST
		s.alpha_cut = SpriteBase3D.ALPHA_CUT_DISCARD
		s.shaded = true
		s.offset = Vector2(0, 32)
		s.position = spots[id]
		s.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON
		if id != "boy":
			s.modulate = Color(0.85, 0.83, 0.83)
		add_child(s)
		s.set_meta("home", s.position)
		_party.append(s)


func _build_ui() -> void:
	var layer := CanvasLayer.new()
	layer.layer = 5
	add_child(layer)
	_ui = Control.new()
	_ui.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_ui.mouse_filter = Control.MOUSE_FILTER_IGNORE
	layer.add_child(_ui)
	var top := PanelContainer.new()
	top.position = Vector2(18, 14)
	_ui.add_child(top)
	var tv := VBoxContainer.new()
	tv.add_theme_constant_override("separation", 4)
	top.add_child(tv)
	_status = Label.new()
	_status.add_theme_font_size_override("font_size", 20)
	tv.add_child(_status)
	_hp_bar = _bar(Color("6fda88"))
	tv.add_child(_hp_bar)
	_mp_bar = _bar(Color("6fb0ff"))
	tv.add_child(_mp_bar)
	var ally := Label.new()
	var names := ["キキ", "ネネ"]
	for m in Game.team:
		names.append(Game.world.species[m.id].name)
	ally.text = "同行: %s（HP・MPは共有）" % "・".join(names.slice(0, 4))
	ally.add_theme_font_size_override("font_size", 16)
	ally.add_theme_color_override("font_color", Color(0.75, 0.85, 1.0))
	tv.add_child(ally)
	_msg_panel = PanelContainer.new()
	_ui.add_child(_msg_panel)
	_msg = Label.new()
	_msg.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_msg.add_theme_font_size_override("font_size", 26)
	_msg.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_msg_panel.add_child(_msg)
	_cmd_panel = PanelContainer.new()
	_ui.add_child(_cmd_panel)
	_cmd_box = VBoxContainer.new()
	_cmd_box.add_theme_constant_override("separation", 6)
	_cmd_panel.add_child(_cmd_box)
	_cmd_panel.visible = false
	_arrow = Label.new()
	_arrow.text = "▼"
	_arrow.add_theme_font_size_override("font_size", 32)
	_arrow.add_theme_color_override("font_color", Color(1, 0.9, 0.55))
	_arrow.add_theme_color_override("font_outline_color", Color(0, 0, 0))
	_arrow.add_theme_constant_override("outline_size", 8)
	_ui.add_child(_arrow)
	_refresh_status()


func _bar(color: Color) -> ProgressBar:
	var b := ProgressBar.new()
	b.custom_minimum_size = Vector2(250, 12)
	b.show_percentage = false
	var bg := StyleBoxFlat.new()
	bg.bg_color = Color(0.12, 0.13, 0.18, 0.9)
	bg.set_corner_radius_all(3)
	bg.set_border_width_all(1)
	bg.border_color = Color(0.9, 0.92, 1.0, 0.8)
	var fg := StyleBoxFlat.new()
	fg.bg_color = color
	fg.set_corner_radius_all(3)
	b.add_theme_stylebox_override("background", bg)
	b.add_theme_stylebox_override("fill", fg)
	return b


func _spawn() -> void:
	var keys := FOES.keys()
	var count := 1 + (1 if randf() < 0.55 else 0) + (1 if randf() < 0.25 else 0)
	var scale_up := 1.0 + 0.15 * (int(Game.hero.lv) - 1)
	var xs: Array = {1: [0.2], 2: [-1.1, 1.5], 3: [-2.2, 0.1, 2.4]}[count]
	for i in count:
		var id: String = keys[randi() % keys.size()]
		var f: Dictionary = FOES[id]
		var spr := Sprite3D.new()
		spr.texture = _cropped("res://assets/companions/%s.webp" % id)
		spr.pixel_size = (1.7 if count < 3 else 1.5) / maxf(spr.texture.get_height(), spr.texture.get_width() * 0.75)
		spr.billboard = BaseMaterial3D.BILLBOARD_FIXED_Y
		spr.texture_filter = BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
		spr.alpha_cut = SpriteBase3D.ALPHA_CUT_DISCARD
		spr.shaded = true
		spr.centered = true
		spr.offset = Vector2(0, spr.texture.get_height() / 2.0)
		spr.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON
		var home := Vector3(xs[i], 0.0, -1.2 - (0.5 if i % 2 == 1 and count == 3 else 0.0))
		if id in AIRBORNE:
			home.y = 0.55
		spr.position = home
		add_child(spr)
		var bar := _bar(Color("6fda88"))
		bar.custom_minimum_size = Vector2(130, 10)
		bar.max_value = int(f.hp * scale_up)
		bar.value = bar.max_value
		bar.mouse_filter = Control.MOUSE_FILTER_IGNORE
		_ui.add_child(bar)
		var label := Label.new()
		label.text = "%s %s" % [char(65 + i), Game.world.species[id].name]
		label.add_theme_font_size_override("font_size", 20)
		label.add_theme_color_override("font_outline_color", Color(0, 0, 0))
		label.add_theme_constant_override("outline_size", 7)
		label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		label.size = Vector2(240, 30)
		label.mouse_filter = Control.MOUSE_FILTER_IGNORE
		_ui.add_child(label)
		enemies.append({"id": id, "name": Game.world.species[id].name, "slot": i,
			"hp": int(f.hp * scale_up), "max": int(f.hp * scale_up), "atk": f.atk * (1.0 + 0.1 * (int(Game.hero.lv) - 1)),
			"exp": f.exp, "gold": f.gold, "alive": true, "phase": randf() * TAU,
			"spr": spr, "home": home, "bar": bar, "label": label, "h": spr.texture.get_height() * spr.pixel_size})


## Trims transparent margins so every creature stands on its feet.
func _cropped(path: String) -> Texture2D:
	var tex: Texture2D = load(path)
	var img := tex.get_image()
	if img.is_compressed():
		img.decompress()
	var a := AtlasTexture.new()
	a.atlas = tex
	a.region = Rect2(img.get_used_rect())
	return a


func _layout() -> void:
	var s := get_viewport().get_visible_rect().size
	var cmd_w := maxf(270.0, _cmd_panel.get_combined_minimum_size().x)
	_msg_panel.position = Vector2(18, s.y - 200)
	_msg_panel.size = Vector2(s.x - 54 - cmd_w, 182)
	_cmd_panel.size = Vector2(cmd_w, 0)
	_cmd_panel.position = Vector2(s.x - 18 - cmd_w, s.y - 18 - _cmd_panel.get_combined_minimum_size().y)


func _refresh_status() -> void:
	_status.text = "少年 Lv.%d   HP %d/%d   MP %d/%d" % [Game.hero.lv, Game.hero.hp, Game.max_hp(), Game.hero.mp, Game.max_mp()]
	_hp_bar.max_value = Game.max_hp()
	_mp_bar.max_value = Game.max_mp()
	create_tween().tween_property(_hp_bar, "value", float(Game.hero.hp), 0.3)
	create_tween().tween_property(_mp_bar, "value", float(Game.hero.mp), 0.3)


# ================================================================ per-frame

func _process(delta: float) -> void:
	var t := Time.get_ticks_msec() / 1000.0
	# Idle camera drifts slowly; strikes move _cam_pos/_cam_look and it eases there.
	var drift := Vector3(sin(t * 0.21) * 0.35, sin(t * 0.17) * 0.12, 0)
	camera.position = camera.position.lerp(_cam_pos + drift, 1.0 - exp(-delta * 3.2))
	var look := camera.get_meta("look", _cam_look) as Vector3
	look = look.lerp(_cam_look, 1.0 - exp(-delta * 3.2))
	camera.set_meta("look", look)
	camera.look_at(look)
	if _shake > 0.0:
		_shake = maxf(0.0, _shake - delta * 2.5)
		camera.position += Vector3(randf_range(-1, 1), randf_range(-1, 1), 0) * _shake * 0.12
	for sh in get_tree().get_nodes_in_group("shafts"):
		var m: StandardMaterial3D = sh.material_override
		m.albedo_color.a = 0.6 + sin(t * 0.5 + float(sh.get_meta("phase"))) * 0.35
	for e in enemies:
		var spr: Sprite3D = e.spr
		if not e.alive:
			e.bar.visible = false
			e.label.visible = false
			continue
		var fly: bool = e.id in AIRBORNE
		var home: Vector3 = e.home
		if not spr.has_meta("busy"):
			spr.position = home + Vector3(0, (sin(t * 3.0 + e.phase) * 0.12) if fly else 0.0, 0)
			var breathe := 1.0 + sin(t * 2.2 + e.phase) * (0.0 if fly else 0.018)
			spr.scale = Vector3(2.0 - breathe, breathe, 1)
		var top := camera.unproject_position(spr.position + Vector3(0, float(e.h) + 0.12, 0))
		e.bar.position = top - Vector2(65, 6)
		e.label.position = top - Vector2(120, 38)
		e.bar.visible = not camera.is_position_behind(spr.position)
		e.label.visible = e.bar.visible
	for i in _party.size():
		var p := _party[i]
		if not p.has_meta("busy"):
			p.position = p.get_meta("home") + Vector3(0, absf(sin(t * 2.0 + i)) * 0.03, 0)
	_arrow.visible = _choosing and not _living().is_empty()
	if _arrow.visible:
		var e: Dictionary = enemies[target]
		_arrow.position = e.label.position + Vector2(106, -34 + sin(t * 6.0) * 5.0)


func _living() -> Array:
	return enemies.filter(func(e): return e.alive)


# ================================================================ flow

func _say(text: String, wait := 0.9) -> void:
	_msg.text = text
	_msg.visible_ratio = 0.0
	var tw := create_tween()
	tw.tween_property(_msg, "visible_ratio", 1.0, minf(0.5, text.length() * 0.02))
	await get_tree().create_timer(wait).timeout


func _run() -> void:
	# Opening sweep from high behind the party down to the battle framing.
	_cam_pos = CAM_HOME
	await get_tree().create_timer(0.6).timeout
	await _say("%s が あらわれた！" % "・".join(enemies.map(func(e): return e.name)), 1.3)
	while true:
		if _living().is_empty():
			await _victory()
			return
		if not enemies[target].alive:
			target = _living()[0].slot
		var cmd := await _command()
		if cmd == "run":
			if randf() < 0.7:
				await _say("うまく にげきれた！", 1.0)
				_leave()
				return
			await _say("にげられなかった！", 0.9)
		elif cmd == "item":
			if Game.hero.herb <= 0:
				await _say("薬草を もっていない。", 0.9)
				continue
			Game.hero.herb -= 1
			var h := mini(40, Game.max_hp() - int(Game.hero.hp))
			Game.hero.hp += h
			Game.sfx("heal")
			_heal_fx()
			_refresh_status()
			await _say("薬草を使った。HPが%d回復。" % h, 1.0)
		else:
			if cmd == "spl":
				Game.hero.mp -= 2
				_refresh_status()
			await _attack(cmd)
			if _living().is_empty():
				continue
		if not await _enemy_turn():
			return


func _command() -> String:
	_msg.text = "どうする？　ねらう相手：%s %s%s" % [char(65 + target), enemies[target].name, "\n%d COMBO!" % combo if combo > 1 else ""]
	_msg.visible_ratio = 1.0
	for c in _cmd_box.get_children():
		c.queue_free()
	var list := [["たたかう", "単語", "atk", false], ["じゅもん", "文法 MP2", "spl", Game.hero.mp < 2],
		["こだま", "聴解+回復", "lis", false], ["どうぐ", "薬草×%d" % Game.hero.herb, "item", false], ["にげる", "", "run", false]]
	var first: Button = null
	for item in list:
		var b := Button.new()
		b.text = ("%s · %s" % [item[0], item[1]]) if item[1] != "" else item[0]
		b.alignment = HORIZONTAL_ALIGNMENT_LEFT
		b.disabled = item[3]
		b.custom_minimum_size = Vector2(0, 58)
		b.add_theme_font_size_override("font_size", 22)
		b.pressed.connect(_on_cmd.bind(item[2]))
		b.focus_entered.connect(func(): Game.sfx("blip"))
		_cmd_box.add_child(b)
		if not first and not b.disabled:
			first = b
	var hint := Label.new()
	hint.text = "敵をタップ / ←→ で相手"
	hint.add_theme_font_size_override("font_size", 15)
	hint.add_theme_color_override("font_color", Color(0.7, 0.78, 0.95))
	_cmd_box.add_child(hint)
	_cmd_panel.visible = true
	_cmd_panel.reset_size()
	_layout()
	_choosing = true
	await get_tree().process_frame
	first.grab_focus()
	var cmd: String = await command_chosen
	_choosing = false
	_cmd_panel.visible = false
	Game.sfx("select")
	return cmd


func _on_cmd(cmd: String) -> void:
	if _choosing:
		command_chosen.emit(cmd)


func _command_label_refresh() -> void:
	_msg.text = "どうする？　ねらう相手：%s %s" % [char(65 + target), enemies[target].name]


func _unhandled_input(event: InputEvent) -> void:
	if not _choosing:
		return
	# Tapping a creature on screen selects it as the target.
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		for e in _living():
			var spr: Sprite3D = e.spr
			var foot := camera.unproject_position(spr.position)
			var head := camera.unproject_position(spr.position + Vector3(0, float(e.h), 0))
			var rect := Rect2(Vector2(foot.x - (foot.y - head.y) * 0.45, head.y), Vector2((foot.y - head.y) * 0.9, foot.y - head.y))
			if rect.has_point(event.position):
				target = e.slot
				Game.sfx("blip")
				_command_label_refresh()
				get_viewport().set_input_as_handled()
				return
	var step := 0
	if event.is_action_pressed("move_left"):
		step = -1
	elif event.is_action_pressed("move_right"):
		step = 1
	if step != 0:
		var living := _living()
		var idx := living.find(enemies[target])
		target = living[(idx + step + living.size()) % living.size()].slot
		Game.sfx("blip")
		_command_label_refresh()
		get_viewport().set_input_as_handled()
	elif event.is_action_pressed("accept"):
		var f := get_viewport().gui_get_focus_owner() as Button
		if f and _cmd_box.is_ancestor_of(f):
			f.pressed.emit()
			get_viewport().set_input_as_handled()


func _attack(cmd: String) -> void:
	var e: Dictionary = enemies[target]
	_msg_panel.visible = false
	var q: Dictionary
	var mult := 1.0
	match cmd:
		"atk":
			q = Game.q_vocab(1)
		"spl":
			q = Game.q_spell()
			mult = 1.8
		"lis":
			q = Game.q_listen(1)
			mult = 1.3
	var ok := await dialog.quiz(q)
	_msg_panel.visible = true
	combo = combo + 1 if ok else 0
	var raw := (Game.atk() + Game.team_power()) * randf_range(0.9, 1.1) * mult * (1.0 + clampf(combo - 1, 0, 4) * 0.15)
	var dmg := maxi(1, roundi(raw if ok else raw * 0.5))
	await _hit_fx(e, cmd, dmg, ok)
	e.hp = maxi(0, int(e.hp) - dmg)
	create_tween().tween_property(e.bar, "value", float(e.hp), 0.35)
	var extra := ""
	if cmd == "lis":
		var h := roundi(Game.max_hp() * 0.12 * (1.0 if ok else 0.5))
		Game.hero.hp = mini(Game.max_hp(), int(Game.hero.hp) + h)
		_heal_fx()
		extra = " HPが%d回復。" % h
		_refresh_status()
	await _say("%sに %d ダメージ！%s\n%s" % [e.name, dmg, extra, "ことばの力が届いた！" if ok else "誤答でも50％の力で発動。"], 1.1)
	_cam_pos = CAM_HOME
	_cam_look = CAM_LOOK
	if e.hp <= 0:
		await _defeat(e)


# ================================================================ effects

func _hit_fx(e: Dictionary, cmd: String, dmg: int, ok: bool) -> void:
	var col: Color = CMD_COLOR[cmd]
	_msg.text = ""
	var spr: Sprite3D = e.spr
	var center := spr.position + Vector3(0, float(e.h) * 0.5, 0)
	# Camera pushes toward the target, slightly off-axis.
	_cam_look = center
	_cam_pos = center + Vector3(-1.2 + spr.position.x * 0.15, 1.9, 6.6)
	var boy := _party[1]
	boy.set_meta("busy", true)
	var lunge := create_tween()
	lunge.tween_property(boy, "position", boy.get_meta("home") + Vector3(0.2, 0.12, -0.7), 0.16).set_trans(Tween.TRANS_QUAD)
	lunge.tween_property(boy, "position", boy.get_meta("home"), 0.3)
	lunge.tween_callback(func(): boy.remove_meta("busy"))
	await get_tree().create_timer(0.35).timeout
	match cmd:
		"atk":
			_slash(center, col)
		"spl":
			await _rune_circle(spr.position, col)
		"lis":
			await _sound_rings(center, col)
	_burst(center, col, 40 if ok else 16)
	_flash_light(center, col)
	Game.sfx("crit" if ok and combo > 1 else "hit")
	_shake = 1.0 if ok else 0.5
	spr.set_meta("busy", true)
	spr.modulate = Color(3, 3, 3)
	var knock := create_tween()
	var home: Vector3 = spr.position
	knock.tween_property(spr, "position", home + Vector3(0.25, 0, -0.35), 0.06)
	knock.parallel().tween_property(spr, "modulate", Color.WHITE, 0.3)
	knock.tween_property(spr, "position", home, 0.25)
	knock.tween_callback(func(): spr.remove_meta("busy"))
	_damage_number(center + Vector3(0, float(e.h) * 0.35, 0.3), str(dmg), col if ok else Color(0.85, 0.85, 0.9), ok)
	await get_tree().create_timer(0.55).timeout


func _fx_quad(tex: Texture2D, size: Vector2, color: Color, billboard := true) -> MeshInstance3D:
	var q := QuadMesh.new()
	q.size = size
	var m := Art.additive(tex, billboard)
	m.albedo_color = color
	m.disable_fog = true
	var mi := MeshInstance3D.new()
	mi.mesh = q
	mi.material_override = m
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(mi)
	return mi


func _crescent() -> ImageTexture:
	var img := Image.create(64, 64, false, Image.FORMAT_RGBA8)
	for y in 64:
		for x in 64:
			var p := Vector2(x - 32, y - 32)
			var outer := p.length() / 30.0
			var inner := (p - Vector2(7, -5)).length() / 26.0
			var a := clampf((1.0 - outer) * 6.0, 0, 1) * clampf((inner - 1.0) * 5.0, 0, 1)
			img.set_pixel(x, y, Color(1, 1, 1, a))
	return ImageTexture.create_from_image(img)


func _ring_tex(runes: bool) -> ImageTexture:
	var img := Image.create(128, 128, false, Image.FORMAT_RGBA8)
	for y in 128:
		for x in 128:
			var p := Vector2(x - 64, y - 64)
			var r := p.length()
			var a := maxf(0.0, 1.0 - absf(r - 58.0) / 2.5)
			if runes:
				a = maxf(a, 1.0 - absf(r - 44.0) / 1.8)
				var ang := atan2(p.y, p.x)
				if r > 46.0 and r < 56.0 and fmod(ang + PI, TAU / 12.0) < 0.12:
					a = 1.0
				var star := absf(sin(ang * 3.0)) * 40.0
				if absf(r - star) < 1.5 and r < 42.0:
					a = maxf(a, 0.8)
			img.set_pixel(x, y, Color(1, 1, 1, clampf(a, 0, 1)))
	return ImageTexture.create_from_image(img)


func _slash(center: Vector3, col: Color) -> void:
	var s := _fx_quad(_crescent(), Vector2(2.6, 2.6), Color(col, 1.0))
	s.position = center + Vector3(0, 0, 0.4)
	var core := _fx_quad(_crescent(), Vector2(2.4, 2.4), Color(1, 1, 1, 1.0))
	core.position = s.position + Vector3(0, 0, 0.02)
	core.rotation.z = -0.6
	var ct := create_tween().set_parallel()
	ct.tween_property(core, "rotation:z", 0.5, 0.22)
	ct.tween_property(core.material_override, "albedo_color:a", 0.0, 0.2).set_delay(0.05)
	ct.chain().tween_callback(core.queue_free)
	s.rotation.z = -0.6
	s.scale = Vector3(0.6, 0.6, 1)
	var tw := create_tween().set_parallel()
	tw.tween_property(s, "scale", Vector3(1.25, 1.25, 1), 0.22).set_trans(Tween.TRANS_QUAD)
	tw.tween_property(s, "rotation:z", 0.5, 0.22)
	tw.tween_property(s.material_override, "albedo_color:a", 0.0, 0.3).set_delay(0.08)
	tw.chain().tween_callback(s.queue_free)


func _rune_circle(foot: Vector3, col: Color) -> void:
	var ring := _fx_quad(_ring_tex(true), Vector2(2.6, 2.6), Color(col, 0.0), false)
	ring.position = Vector3(foot.x, 0.04, foot.z)
	ring.rotation.x = -PI / 2.0
	var tw := create_tween()
	tw.tween_property(ring.material_override, "albedo_color:a", 1.0, 0.25)
	tw.parallel().tween_property(ring, "rotation:y", 1.6, 0.9)
	var pillar := CPUParticles3D.new()
	var mote := QuadMesh.new()
	mote.size = Vector2(0.09, 0.09)
	mote.material = Art.additive(Art.soft_tex(Color(1, 1, 1, 1), Color(1, 1, 1, 0)))
	pillar.mesh = mote
	pillar.amount = 60
	pillar.lifetime = 0.8
	pillar.one_shot = true
	pillar.explosiveness = 0.3
	pillar.emission_shape = CPUParticles3D.EMISSION_SHAPE_RING
	pillar.emission_ring_axis = Vector3.UP
	pillar.emission_ring_radius = 1.0
	pillar.emission_ring_inner_radius = 0.6
	pillar.emission_ring_height = 0.05
	pillar.direction = Vector3.UP
	pillar.spread = 5.0
	pillar.gravity = Vector3(0, 2.5, 0)
	pillar.initial_velocity_min = 1.0
	pillar.initial_velocity_max = 2.5
	pillar.color = col
	pillar.position = ring.position
	add_child(pillar)
	pillar.emitting = true
	Game.sfx("heal")
	await get_tree().create_timer(0.45).timeout
	var out := create_tween()
	out.tween_property(ring.material_override, "albedo_color:a", 0.0, 0.5)
	out.tween_callback(ring.queue_free)
	get_tree().create_timer(1.6).timeout.connect(pillar.queue_free)


func _sound_rings(center: Vector3, col: Color) -> void:
	var tex := _ring_tex(false)
	for i in 3:
		var r := _fx_quad(tex, Vector2(0.6, 0.6), Color(col, 0.9))
		r.position = _party[1].position + Vector3(0, 1.0, -0.3)
		var tw := create_tween().set_parallel()
		tw.tween_property(r, "position", center, 0.45).set_delay(i * 0.1)
		tw.tween_property(r, "scale", Vector3(3, 3, 1), 0.45).set_delay(i * 0.1)
		tw.tween_property(r.material_override, "albedo_color:a", 0.0, 0.2).set_delay(0.35 + i * 0.1)
		tw.chain().tween_callback(r.queue_free)
	await get_tree().create_timer(0.5).timeout


func _burst(p: Vector3, col: Color, n: int) -> void:
	var mote := QuadMesh.new()
	mote.size = Vector2(0.12, 0.12)
	mote.material = Art.additive(Art.soft_tex(Color(1, 1, 1, 1), Color(1, 1, 1, 0)))
	var sparks := CPUParticles3D.new()
	sparks.mesh = mote
	sparks.position = p
	sparks.one_shot = true
	sparks.amount = n
	sparks.lifetime = 0.7
	sparks.explosiveness = 0.95
	sparks.spread = 180.0
	sparks.initial_velocity_min = 2.0
	sparks.initial_velocity_max = 5.0
	sparks.gravity = Vector3(0, -6, 0)
	sparks.scale_amount_min = 0.5
	sparks.scale_amount_max = 1.4
	sparks.color = col.lightened(0.3)
	add_child(sparks)
	sparks.emitting = true
	get_tree().create_timer(1.2).timeout.connect(sparks.queue_free)


func _flash_light(p: Vector3, col: Color) -> void:
	var l := OmniLight3D.new()
	l.light_color = col
	l.light_energy = 4.0
	l.omni_range = 4.0
	l.position = p + Vector3(0, 0.3, 0.6)
	add_child(l)
	var tw := create_tween()
	tw.tween_property(l, "light_energy", 0.0, 0.35)
	tw.tween_callback(l.queue_free)


func _damage_number(p: Vector3, text: String, col: Color, big: bool) -> void:
	var l := Label.new()
	l.text = text
	l.add_theme_font_size_override("font_size", 64 if big else 48)
	l.add_theme_color_override("font_color", col.lightened(0.25))
	l.add_theme_color_override("font_outline_color", Color(0.06, 0.03, 0.1))
	l.add_theme_constant_override("outline_size", 14)
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	l.size = Vector2(120, 80)
	l.pivot_offset = Vector2(60, 40)
	l.scale = Vector2(0.4, 0.4)
	l.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_ui.add_child(l)
	# Follow the hit point on screen while the camera is still moving.
	var follow := func(rise: float):
		l.position = camera.unproject_position(p) - Vector2(60, 40 + rise)
	var tw := create_tween()
	tw.tween_property(l, "scale", Vector2(1.3, 1.3), 0.12).set_trans(Tween.TRANS_BACK)
	tw.tween_property(l, "scale", Vector2.ONE, 0.1)
	tw.parallel().tween_method(follow, 0.0, 50.0, 0.9).set_ease(Tween.EASE_OUT)
	tw.tween_property(l, "modulate:a", 0.0, 0.25)
	tw.tween_callback(l.queue_free)
	follow.call(0.0)

func _heal_fx() -> void:
	var mote := QuadMesh.new()
	mote.size = Vector2(0.1, 0.1)
	mote.material = Art.additive(Art.soft_tex(Color(1, 1, 1, 1), Color(1, 1, 1, 0)))
	var p := CPUParticles3D.new()
	p.mesh = mote
	p.position = Vector3(-1.75, 0.2, 1.9)
	p.one_shot = true
	p.amount = 50
	p.lifetime = 1.1
	p.explosiveness = 0.5
	p.emission_shape = CPUParticles3D.EMISSION_SHAPE_BOX
	p.emission_box_extents = Vector3(1.4, 0.1, 0.4)
	p.direction = Vector3.UP
	p.spread = 10.0
	p.gravity = Vector3(0, 1.5, 0)
	p.initial_velocity_min = 0.6
	p.initial_velocity_max = 1.6
	p.color = Color(0.5, 1.0, 0.6)
	add_child(p)
	p.emitting = true
	get_tree().create_timer(1.8).timeout.connect(p.queue_free)


func _defeat(e: Dictionary) -> void:
	e.alive = false
	var spr: Sprite3D = e.spr
	spr.set_meta("busy", true)
	_burst(spr.position + Vector3(0, float(e.h) * 0.5, 0), Color(1, 1, 0.9), 50)
	var tw := create_tween().set_parallel()
	tw.tween_property(spr, "modulate", Color(4, 4, 4, 0), 0.6)
	tw.tween_property(spr, "scale", Vector3(1.3, 0.1, 1), 0.6).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_IN)
	await _say("%sを たおした！" % e.name, 0.8)


func _enemy_turn() -> bool:
	turn += 1
	for e in _living():
		var spr: Sprite3D = e.spr
		var scale_down := 1.0 / sqrt(float(enemies.size()))
		var dmg := maxi(1, roundi((float(e.atk) * randf_range(0.85, 1.15) - Game.defense() * 0.4) * scale_down))
		spr.set_meta("busy", true)
		var home: Vector3 = e.home
		var lunge := create_tween()
		lunge.tween_property(spr, "position", home + Vector3(0, 0.15, 1.6), 0.16).set_trans(Tween.TRANS_QUAD)
		lunge.tween_property(spr, "position", home, 0.3)
		lunge.tween_callback(func(): spr.remove_meta("busy"))
		await get_tree().create_timer(0.14).timeout
		Game.sfx("hurt")
		Game.flash(Color(1, 0.2, 0.2), 0.25)
		_shake = 1.0
		for p in _party:
			p.modulate = Color(2.5, 0.6, 0.6)
			create_tween().tween_property(p, "modulate", Color(0.85, 0.83, 0.83) if p != _party[1] else Color.WHITE, 0.35)
		_burst(_party[1].position + Vector3(0, 0.8, 0), Color(1, 0.5, 0.4), 18)
		Game.hero.hp = maxi(0, int(Game.hero.hp) - dmg)
		_refresh_status()
		await _say("%sの こうげき！ %d ダメージを受けた。" % [e.name, dmg], 0.9)
		if Game.hero.hp <= 0:
			await _say("力尽きてしまった……\nキキとネネが村まで運んでくれた。", 1.8)
			Game.hero.hp = Game.max_hp()
			Game.hero.mp = Game.max_mp()
			Game.hero.gold = int(Game.hero.gold) / 2
			_leave()
			return false
	return true


func _victory() -> void:
	var gained_exp := 0
	var gold := 0
	for e in enemies:
		gained_exp += int(e.exp)
		gold += int(e.gold)
	Game.hero.exp += gained_exp
	Game.hero.gold += gold
	Game.music("")
	Game.sfx("win")
	# Victory pose: camera swings round to the party; they hop.
	_cam_pos = Vector3(-3.4, 1.7, 5.6)
	_cam_look = Vector3(-1.7, 0.6, 1.8)
	for i in _party.size():
		var p := _party[i]
		p.set_meta("busy", true)
		var hop := create_tween().set_loops(3)
		hop.tween_property(p, "position:y", 0.35, 0.18).set_delay(i * 0.08).set_trans(Tween.TRANS_QUAD)
		hop.tween_property(p, "position:y", 0.0, 0.18)
	_burst(Vector3(-1.75, 1.4, 1.9), Color(1, 0.9, 0.5), 60)
	await _say("まものの群れに勝った！　%d EXP ・ %d G" % [gained_exp, gold], 1.6)
	while Game.hero.exp >= Game.need_exp():
		var oh := Game.max_hp()
		var om := Game.max_mp()
		Game.hero.lv += 1
		Game.hero.hp += Game.max_hp() - oh
		Game.hero.mp += Game.max_mp() - om
		Game.sfx("ok")
		_refresh_status()
		await _say("レベルアップ！ Lv.%d　HPとMPが増えた！" % Game.hero.lv, 1.5)
	var right: int = Game.stats.right
	var total: int = right + int(Game.stats.wrong)
	await _say("この試遊の正答率 %d%%（%d / %d）" % [roundi(100.0 * right / maxi(1, total)), right, total], 1.4)
	_leave()


func _leave() -> void:
	Game.goto("village", {"pos": return_pos} if return_pos.x >= 0 else {})
