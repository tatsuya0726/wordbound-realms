extends Control
## Party battle against 1–3 wild companions. Commands are answered in English; wrong answers still fire at 50%.

const AIRBORNE := ["pinecone_sparrow", "lantern_moth", "thunder_feather_owlet"]
## Meadow encounters mirror the web zone w1 (blot/bat/imp) with this world's creatures.
const FOES := {
	"lotus_root_sproutling": {"hp": 12, "atk": 5, "exp": 5, "gold": 4},
	"lantern_moth": {"hp": 10, "atk": 6, "exp": 6, "gold": 5},
	"silk_leaf_caterpillar": {"hp": 16, "atk": 7, "exp": 8, "gold": 7},
	"pinecone_sparrow": {"hp": 11, "atk": 6, "exp": 6, "gold": 5}}
const CMD_COLOR := {"atk": Color(1.0, 0.85, 0.4), "spl": Color(0.8, 0.55, 1.0), "lis": Color(0.45, 0.95, 1.0)}

var return_pos := Vector2(-1, -1)
var enemies: Array = []
var target := 0
var combo := 0
var turn := 0

var _field: Control
var _bg: TextureRect
var _party_row: HBoxContainer
var _msg: Label
var _msg_panel: PanelContainer
var _cmd_panel: PanelContainer
var _cmd_box: VBoxContainer
var _hp_bar: ProgressBar
var _mp_bar: ProgressBar
var _status: Label
var _arrow: Label
var dialog: DialogUI
var _shake := 0.0
var _flash_shader: Shader
var _choosing := false

signal command_chosen(cmd: String)


func setup(args: Dictionary) -> void:
	return_pos = args.get("return_pos", Vector2(-1, -1))


func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_flash_shader = Shader.new()
	_flash_shader.code = "shader_type canvas_item;\nuniform float flash = 0.0;\nuniform vec4 tint : source_color = vec4(1.0);\nvoid fragment(){ vec4 c = texture(TEXTURE, UV) * COLOR; c.rgb = mix(c.rgb * tint.rgb, vec3(1.0), flash); COLOR = c; }"
	_build_scene()
	_build_ui()
	dialog = DialogUI.new()
	add_child(dialog)
	_spawn()
	get_viewport().size_changed.connect(_layout)
	_layout.call_deferred()
	Game.music("battle")
	_run.call_deferred()


# ================================================================ build

func _build_scene() -> void:
	_field = Control.new()
	_field.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_field.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(_field)
	_bg = TextureRect.new()
	_bg.texture = load("res://assets/world/battle-grass.webp")
	_bg.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	_bg.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	_bg.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	_bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_bg.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_field.add_child(_bg)
	# Sun shafts falling through the birches.
	var add_mat := CanvasItemMaterial.new()
	add_mat.blend_mode = CanvasItemMaterial.BLEND_MODE_ADD
	for i in 4:
		var g := Gradient.new()
		g.set_color(0, Color(1, 0.93, 0.6, 0.22))
		g.set_color(1, Color(1, 0.93, 0.6, 0.0))
		var gt := GradientTexture2D.new()
		gt.gradient = g
		gt.fill_from = Vector2(0.5, 0)
		gt.fill_to = Vector2(0.5, 1)
		var ray := TextureRect.new()
		ray.texture = gt
		ray.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		ray.stretch_mode = TextureRect.STRETCH_SCALE
		ray.size = Vector2(90 + i * 40, 900)
		ray.position = Vector2(180 + i * 300, -80)
		ray.rotation = -0.35
		ray.material = add_mat
		ray.mouse_filter = Control.MOUSE_FILTER_IGNORE
		ray.set_meta("phase", i * 1.7)
		ray.add_to_group("rays")
		_field.add_child(ray)
	var leaves := CPUParticles2D.new()
	leaves.amount = 26
	leaves.lifetime = 10.0
	leaves.preprocess = 10.0
	leaves.emission_shape = CPUParticles2D.EMISSION_SHAPE_RECTANGLE
	leaves.emission_rect_extents = Vector2(900, 10)
	leaves.position = Vector2(640, -20)
	leaves.gravity = Vector2(8, 22)
	leaves.angular_velocity_min = -90
	leaves.angular_velocity_max = 90
	leaves.scale_amount_min = 3.0
	leaves.scale_amount_max = 6.0
	leaves.color = Color(0.75, 0.95, 0.45, 0.8)
	leaves.name = "Leaves"
	_field.add_child(leaves)


func _build_ui() -> void:
	var top := PanelContainer.new()
	top.position = Vector2(18, 14)
	add_child(top)
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

	_party_row = HBoxContainer.new()
	_party_row.add_theme_constant_override("separation", -10)
	_party_row.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(_party_row)
	for id in ["kiki", "boy", "nene"]:
		var a := AtlasTexture.new()
		a.atlas = load("res://assets/walk/%s.png" % id)
		a.region = Rect2(64, 192, 64, 64)  # back view, idle column
		var t := TextureRect.new()
		t.texture = a
		t.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
		t.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		t.custom_minimum_size = Vector2(150, 150) if id == "boy" else Vector2(112, 112)
		t.size_flags_vertical = Control.SIZE_SHRINK_END
		t.mouse_filter = Control.MOUSE_FILTER_IGNORE
		_party_row.add_child(t)

	_msg_panel = PanelContainer.new()
	add_child(_msg_panel)
	_msg = Label.new()
	_msg.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_msg.add_theme_font_size_override("font_size", 26)
	_msg.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_msg_panel.add_child(_msg)
	_cmd_panel = PanelContainer.new()
	add_child(_cmd_panel)
	_cmd_box = VBoxContainer.new()
	_cmd_box.add_theme_constant_override("separation", 6)
	_cmd_panel.add_child(_cmd_box)
	_cmd_panel.visible = false

	_arrow = Label.new()
	_arrow.text = "▼"
	_arrow.add_theme_font_size_override("font_size", 30)
	_arrow.add_theme_color_override("font_color", Color(1, 0.9, 0.55))
	_arrow.add_theme_color_override("font_outline_color", Color(0, 0, 0))
	_arrow.add_theme_constant_override("outline_size", 8)
	_field.add_child(_arrow)
	_refresh_status()


func _bar(color: Color) -> ProgressBar:
	var b := ProgressBar.new()
	b.custom_minimum_size = Vector2(250, 12)
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


func _spawn() -> void:
	var keys := FOES.keys()
	var count := 1 + (1 if randf() < 0.55 else 0) + (1 if randf() < 0.25 else 0)
	var scale_up := 1.0 + 0.15 * (int(Game.hero.lv) - 1)
	for i in count:
		var id: String = keys[randi() % keys.size()]
		var f: Dictionary = FOES[id]
		var e := {"id": id, "name": Game.world.species[id].name, "slot": i,
			"hp": int(f.hp * scale_up), "max": int(f.hp * scale_up), "atk": f.atk * (1.0 + 0.1 * (int(Game.hero.lv) - 1)),
			"exp": f.exp, "gold": f.gold, "alive": true, "phase": randf() * TAU}
		var root := Control.new()
		root.mouse_filter = Control.MOUSE_FILTER_STOP
		root.gui_input.connect(_on_enemy_input.bind(i))
		_field.add_child(root)
		var shadow := TextureRect.new()
		var g := Gradient.new()
		g.set_color(0, Color(0, 0, 0, 0.5))
		g.set_color(1, Color(0, 0, 0, 0))
		var gt := GradientTexture2D.new()
		gt.gradient = g
		gt.fill = GradientTexture2D.FILL_RADIAL
		gt.fill_from = Vector2(0.5, 0.5)
		gt.fill_to = Vector2(1, 0.5)
		shadow.texture = gt
		shadow.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		shadow.stretch_mode = TextureRect.STRETCH_SCALE
		shadow.mouse_filter = Control.MOUSE_FILTER_IGNORE
		root.add_child(shadow)
		var spr := Sprite2D.new()
		spr.texture = _cropped("res://assets/companions/%s.webp" % id)
		spr.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
		spr.centered = false
		var mat := ShaderMaterial.new()
		mat.shader = _flash_shader
		spr.material = mat
		root.add_child(spr)
		var bar := _bar(Color("6fda88"))
		bar.custom_minimum_size = Vector2(130, 10)
		bar.max_value = e.max
		bar.value = e.hp
		bar.mouse_filter = Control.MOUSE_FILTER_IGNORE
		root.add_child(bar)
		var label := Label.new()
		label.text = "%s %s" % [char(65 + i), e.name]
		label.add_theme_font_size_override("font_size", 20)
		label.add_theme_color_override("font_outline_color", Color(0, 0, 0))
		label.add_theme_constant_override("outline_size", 7)
		label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		label.mouse_filter = Control.MOUSE_FILTER_IGNORE
		root.add_child(label)
		e.merge({"root": root, "spr": spr, "shadow": shadow, "bar": bar, "label": label, "px": 200.0, "base": Vector2.ZERO})
		enemies.append(e)


## Trims transparent margins so every creature stands on its feet at the same baseline.
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
	var s := get_viewport_rect().size
	var n := enemies.size()
	var sz := minf(minf(240.0, s.y * 0.34), (s.x - 690.0) / n * 0.9)
	for e in enemies:
		var tex: Texture2D = e.spr.texture
		var k := sz / maxf(tex.get_width(), tex.get_height())
		e.spr.scale = Vector2(k, k)
		e.px = sz
		var w: float = tex.get_width() * k
		var h: float = tex.get_height() * k
		# Enemies share the space right of the party and left of the command window.
		var left := minf(380.0, s.x * 0.28)
		var right := s.x - 310.0
		e.base = Vector2(left + (right - left) * (e.slot + 1) / (n + 1), s.y * 0.6)
		e.root.position = e.base - Vector2(w / 2.0, h)
		e.root.size = Vector2(w, h)
		e.spr.position = Vector2.ZERO
		e.shadow.size = Vector2(w * 0.8, 26)
		e.shadow.position = Vector2(w * 0.1, h - 13)
		e.bar.position = Vector2(w / 2.0 - 65, -22)
		e.bar.size = Vector2(130, 10)
		e.label.position = Vector2(w / 2.0 - 120, -54)
		e.label.size = Vector2(240, 30)
	_party_row.position = Vector2(30, s.y - 385)
	_party_row.size = Vector2(380, 160)
	_msg_panel.position = Vector2(18, s.y - 200)
	var cmd_w := maxf(270.0, _cmd_panel.get_combined_minimum_size().x)
	_msg_panel.size = Vector2(s.x - 54 - cmd_w, 182)
	_cmd_panel.size = Vector2(cmd_w, 0)
	_cmd_panel.position = Vector2(s.x - 18 - cmd_w, s.y - 18 - _cmd_panel.get_combined_minimum_size().y)
	var leaves := _field.get_node("Leaves") as CPUParticles2D
	leaves.position = Vector2(s.x / 2.0, -20)
	leaves.emission_rect_extents = Vector2(s.x / 2.0, 10)


func _refresh_status() -> void:
	_status.text = "少年 Lv.%d   HP %d/%d   MP %d/%d" % [Game.hero.lv, Game.hero.hp, Game.max_hp(), Game.hero.mp, Game.max_mp()]
	_hp_bar.max_value = Game.max_hp()
	_mp_bar.max_value = Game.max_mp()
	create_tween().tween_property(_hp_bar, "value", float(Game.hero.hp), 0.3)
	create_tween().tween_property(_mp_bar, "value", float(Game.hero.mp), 0.3)


# ================================================================ per-frame

func _process(delta: float) -> void:
	var t := Time.get_ticks_msec() / 1000.0
	_bg.pivot_offset = _bg.size / 2.0
	_bg.scale = Vector2.ONE * (1.05 + sin(t * 0.1) * 0.01)
	for r in get_tree().get_nodes_in_group("rays"):
		r.modulate.a = 0.55 + sin(t * 0.6 + r.get_meta("phase")) * 0.35
	for e in enemies:
		if not e.alive:
			continue
		var fly: bool = e.id in AIRBORNE
		var bob := (-18.0 + sin(t * 3.0 + e.phase) * 6.0) if fly else 0.0
		var breathe := 1.0 + sin(t * 2.0 + e.phase) * (0.0 if fly else 0.012)
		e.spr.position = Vector2(0, bob)
		var k: float = e.px / maxf(e.spr.texture.get_width(), e.spr.texture.get_height())
		e.spr.scale = Vector2(k * (2.0 - breathe), k * breathe)
		e.spr.position.y += e.spr.texture.get_height() * k * (1.0 - breathe)
	var living := _living()
	_arrow.visible = _choosing and living.size() > 0
	if _arrow.visible:
		var e: Dictionary = enemies[target]
		_arrow.position = e.root.position + Vector2(e.root.size.x / 2.0 - 14, -92 + sin(t * 6.0) * 5.0)
	if _shake > 0.0:
		_shake = maxf(0.0, _shake - delta * 30.0)
		_field.position = Vector2(randf_range(-1, 1), randf_range(-1, 1)) * _shake
	else:
		_field.position = Vector2.ZERO


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
	await get_tree().create_timer(0.5).timeout
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


func _on_enemy_input(event: InputEvent, slot: int) -> void:
	if _choosing and event is InputEventMouseButton and event.pressed and enemies[slot].alive:
		target = slot
		Game.sfx("blip")
		_command_label_refresh()


func _command_label_refresh() -> void:
	_msg.text = "どうする？　ねらう相手：%s %s" % [char(65 + target), enemies[target].name]


func _unhandled_input(event: InputEvent) -> void:
	if not _choosing:
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
	if e.hp <= 0:
		await _defeat(e)


func _hit_fx(e: Dictionary, cmd: String, dmg: int, ok: bool) -> void:
	var col: Color = CMD_COLOR[cmd]
	var center: Vector2 = e.root.position + e.root.size * Vector2(0.5, 0.55)
	# Slash arc for words, rune ring for spells, sound rings for echo.
	var fx := Line2D.new()
	fx.width = 10.0
	fx.default_color = col
	fx.begin_cap_mode = Line2D.LINE_CAP_ROUND
	fx.end_cap_mode = Line2D.LINE_CAP_ROUND
	var add_mat := CanvasItemMaterial.new()
	add_mat.blend_mode = CanvasItemMaterial.BLEND_MODE_ADD
	fx.material = add_mat
	var r: float = e.px * 0.45
	fx.position = center
	if cmd == "atk":
		for i in 9:
			var a := -2.4 + i * 0.22
			fx.add_point(Vector2(cos(a), sin(a)) * r * Vector2(1.0, 0.9) + Vector2(0, -r * 0.2))
	else:
		for i in 33:
			var a := i * TAU / 32.0
			fx.add_point(Vector2(cos(a), sin(a) * (0.45 if cmd == "spl" else 1.0)) * r * 0.6)
	_field.add_child(fx)
	var tw := create_tween().set_parallel()
	if cmd == "atk":
		fx.modulate.a = 0.0
		tw.tween_property(fx, "modulate:a", 1.0, 0.06)
		tw.tween_property(fx, "width", 1.0, 0.3).set_delay(0.06)
	else:
		tw.tween_property(fx, "scale", Vector2(1.6, 1.6), 0.35)
		tw.tween_property(fx, "modulate:a", 0.0, 0.35)
	var sparks := CPUParticles2D.new()
	sparks.position = center
	sparks.one_shot = true
	sparks.emitting = true
	sparks.amount = 34 if ok else 14
	sparks.lifetime = 0.6
	sparks.explosiveness = 0.95
	sparks.spread = 180.0
	sparks.initial_velocity_min = 140.0
	sparks.initial_velocity_max = 380.0
	sparks.gravity = Vector2(0, 420)
	sparks.scale_amount_min = 3.0
	sparks.scale_amount_max = 7.0
	sparks.color = col
	sparks.material = add_mat
	_field.add_child(sparks)
	Game.sfx("crit" if ok and combo > 1 else "hit")
	_shake = 14.0 if ok else 7.0
	var mat: ShaderMaterial = e.spr.material
	var flash := create_tween()
	flash.tween_method(func(v): mat.set_shader_parameter("flash", v), 1.0, 0.0, 0.3)
	var knock := create_tween()
	knock.tween_property(e.root, "position:x", e.root.position.x + 18, 0.05)
	knock.tween_property(e.root, "position:x", e.root.position.x, 0.2)
	_damage_number(center + Vector2(0, -e.px * 0.35), str(dmg), col if ok else Color(0.85, 0.85, 0.9), 54 if ok else 40)
	await get_tree().create_timer(0.45).timeout
	fx.queue_free()
	get_tree().create_timer(1.0).timeout.connect(sparks.queue_free)


func _damage_number(p: Vector2, text: String, col: Color, font_px: int) -> void:
	var l := Label.new()
	l.text = text
	l.add_theme_font_size_override("font_size", font_px)
	l.add_theme_color_override("font_color", col)
	l.add_theme_color_override("font_outline_color", Color(0.05, 0.03, 0.08))
	l.add_theme_constant_override("outline_size", 12)
	l.position = p - Vector2(40, 30)
	l.size = Vector2(80, 60)
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	l.pivot_offset = Vector2(40, 30)
	l.scale = Vector2(0.4, 0.4)
	_field.add_child(l)
	var tw := create_tween()
	tw.tween_property(l, "scale", Vector2(1.25, 1.25), 0.12).set_trans(Tween.TRANS_BACK)
	tw.tween_property(l, "scale", Vector2.ONE, 0.1)
	tw.parallel().tween_property(l, "position:y", l.position.y - 50, 0.8).set_ease(Tween.EASE_OUT)
	tw.tween_property(l, "modulate:a", 0.0, 0.25)
	tw.tween_callback(l.queue_free)


func _heal_fx() -> void:
	var s := get_viewport_rect().size
	var p := CPUParticles2D.new()
	p.position = Vector2(220, s.y - 280)
	p.one_shot = true
	p.emitting = true
	p.amount = 40
	p.lifetime = 1.0
	p.explosiveness = 0.6
	p.emission_shape = CPUParticles2D.EMISSION_SHAPE_RECTANGLE
	p.emission_rect_extents = Vector2(160, 40)
	p.direction = Vector2.UP
	p.spread = 15.0
	p.gravity = Vector2(0, -60)
	p.initial_velocity_min = 40.0
	p.initial_velocity_max = 110.0
	p.scale_amount_min = 3.0
	p.scale_amount_max = 6.0
	p.color = Color(0.5, 1.0, 0.6, 0.9)
	var add_mat := CanvasItemMaterial.new()
	add_mat.blend_mode = CanvasItemMaterial.BLEND_MODE_ADD
	p.material = add_mat
	add_child(p)
	get_tree().create_timer(1.6).timeout.connect(p.queue_free)


func _defeat(e: Dictionary) -> void:
	e.alive = false
	var mat: ShaderMaterial = e.spr.material
	mat.set_shader_parameter("flash", 1.0)
	var tw := create_tween().set_parallel()
	tw.tween_property(e.root, "modulate:a", 0.0, 0.5)
	tw.tween_property(e.root, "scale", Vector2(1.15, 0.2), 0.5).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_IN)
	e.root.pivot_offset = Vector2(e.root.size.x / 2.0, e.root.size.y)
	e.root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	await _say("%sを たおした！" % e.name, 0.8)


func _enemy_turn() -> bool:
	turn += 1
	for e in _living():
		var scale_down := 1.0 / sqrt(float(enemies.size()))
		var dmg := maxi(1, roundi((float(e.atk) * randf_range(0.85, 1.15) - Game.defense() * 0.4) * scale_down))
		var lunge := create_tween()
		lunge.tween_property(e.root, "position:y", e.root.position.y + 30, 0.12).set_trans(Tween.TRANS_QUAD)
		lunge.tween_property(e.root, "position:y", e.root.position.y, 0.2)
		await get_tree().create_timer(0.12).timeout
		Game.sfx("hurt")
		Game.flash(Color(1, 0.2, 0.2), 0.25)
		_shake = 10.0
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
