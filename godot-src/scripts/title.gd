extends Control
## Title: painted three-layer world, drifting light, the boy with Kiki and Nene.

var _bg: TextureRect
var _party: Array[TextureRect] = []
var _start: Button


func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_bg = TextureRect.new()
	_bg.texture = load("res://assets/world/surface.webp")
	_bg.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	_bg.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	_bg.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	_bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_bg.pivot_offset = Vector2(640, 360)
	add_child(_bg)

	var shade := TextureRect.new()
	var g := Gradient.new()
	g.set_color(0, Color(0.02, 0.1, 0.15, 0.85))
	g.add_point(0.45, Color(0.05, 0.2, 0.2, 0.15))
	g.set_color(g.get_point_count() - 1, Color(0.02, 0.06, 0.12, 0.92))
	var gt := GradientTexture2D.new()
	gt.gradient = g
	gt.fill_from = Vector2(0, 0)
	gt.fill_to = Vector2(0, 1)
	shade.texture = gt
	shade.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	shade.stretch_mode = TextureRect.STRETCH_SCALE
	shade.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(shade)

	var motes := CPUParticles2D.new()
	motes.amount = 60
	motes.lifetime = 9.0
	motes.preprocess = 9.0
	motes.emission_shape = CPUParticles2D.EMISSION_SHAPE_RECTANGLE
	motes.emission_rect_extents = Vector2(900, 420)
	motes.position = Vector2(640, 360)
	motes.gravity = Vector2(0, -6)
	motes.direction = Vector2(0.3, -1)
	motes.spread = 60.0
	motes.initial_velocity_min = 4.0
	motes.initial_velocity_max = 16.0
	motes.scale_amount_min = 1.5
	motes.scale_amount_max = 4.0
	motes.color = Color(1, 0.92, 0.65, 0.75)
	var add_mat := CanvasItemMaterial.new()
	add_mat.blend_mode = CanvasItemMaterial.BLEND_MODE_ADD
	motes.material = add_mat
	add_child(motes)

	var col := VBoxContainer.new()
	col.set_anchors_preset(Control.PRESET_CENTER_TOP)
	col.grow_horizontal = Control.GROW_DIRECTION_BOTH
	col.position.y = 70
	col.alignment = BoxContainer.ALIGNMENT_CENTER
	col.add_theme_constant_override("separation", 6)
	add_child(col)
	var title := Label.new()
	title.text = "ごちゃまぜモンスター"
	title.add_theme_font_size_override("font_size", 80)
	title.add_theme_color_override("font_color", Color(1, 0.88, 0.48))
	title.add_theme_color_override("font_outline_color", Color(0.12, 0.06, 0.02))
	title.add_theme_constant_override("outline_size", 18)
	title.add_theme_color_override("font_shadow_color", Color(0, 0, 0, 0.6))
	title.add_theme_constant_override("shadow_offset_y", 6)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	col.add_child(title)
	var sub := Label.new()
	sub.text = "ことばでつながる世界 — Godot試作版"
	sub.add_theme_font_size_override("font_size", 30)
	sub.add_theme_color_override("font_outline_color", Color(0, 0, 0, 0.85))
	sub.add_theme_constant_override("outline_size", 8)
	sub.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	col.add_child(sub)

	var row := HBoxContainer.new()
	row.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	row.grow_horizontal = Control.GROW_DIRECTION_BOTH
	row.grow_vertical = Control.GROW_DIRECTION_BEGIN
	row.position.y = -250
	row.alignment = BoxContainer.ALIGNMENT_CENTER
	row.add_theme_constant_override("separation", 6)
	add_child(row)
	for id in ["kiki", "boy", "nene"]:
		var t := TextureRect.new()
		t.texture = load("res://assets/walk/%s-idle.png" % id)
		t.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
		t.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		t.custom_minimum_size = Vector2(150, 150) if id == "boy" else Vector2(120, 120)
		t.size_flags_vertical = Control.SIZE_SHRINK_END
		row.add_child(t)
		_party.append(t)

	var menu := VBoxContainer.new()
	menu.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	menu.grow_horizontal = Control.GROW_DIRECTION_BOTH
	menu.grow_vertical = Control.GROW_DIRECTION_BEGIN
	menu.position.y = -36
	menu.add_theme_constant_override("separation", 10)
	add_child(menu)
	var buttons := HBoxContainer.new()
	buttons.alignment = BoxContainer.ALIGNMENT_CENTER
	buttons.add_theme_constant_override("separation", 16)
	menu.add_child(buttons)
	_start = _button("はじめる", func(): Game.goto("village"))
	buttons.add_child(_start)
	buttons.add_child(_button("すぐバトル", func(): Game.goto("battle", {})))
	if OS.has_feature("web"):
		buttons.add_child(_button("いつもの版へ", func(): JavaScriptBridge.eval("location.href='../'")))
	var note := Label.new()
	note.text = Game.save_note
	note.add_theme_font_size_override("font_size", 18)
	note.add_theme_color_override("font_color", Color(0.85, 0.95, 1.0))
	note.add_theme_color_override("font_outline_color", Color(0, 0, 0, 0.9))
	note.add_theme_constant_override("outline_size", 6)
	note.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	menu.add_child(note)
	_start.grab_focus.call_deferred()
	Game.music("title")


func _button(text: String, cb: Callable) -> Button:
	var b := Button.new()
	b.text = text
	b.custom_minimum_size = Vector2(220, 60)
	b.add_theme_font_size_override("font_size", 28)
	b.pressed.connect(func():
		Game.sfx("select")
		cb.call())
	return b


func _process(_delta: float) -> void:
	var t := Time.get_ticks_msec() / 1000.0
	_bg.pivot_offset = _bg.size / 2.0
	_bg.scale = Vector2.ONE * (1.06 + sin(t * 0.07) * 0.02)
	_bg.position = Vector2(sin(t * 0.11) * 14.0, cos(t * 0.09) * 8.0)
	for i in _party.size():
		_party[i].position.y = -absf(sin(t * 2.4 + i * 0.9)) * 6.0


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("accept"):
		var f := get_viewport().gui_get_focus_owner() as Button
		if f:
			f.pressed.emit()
			get_viewport().set_input_as_handled()
