class_name DialogUI
extends CanvasLayer
## Classic black/white message window with Japanese above English, choices and quizzes.

signal advanced
signal chosen(index: int)

var open := false
var _root: Control
var _box: PanelContainer
var _name: Label
var _ja: Label
var _en: RichTextLabel
var _tag: Label
var _arrow: Label
var _choices: GridContainer
var _choice_panel: PanelContainer
var _replay: Button
var _typing: Tween
var _waiting := false
var _choosing := false
var _say_text := ""
var _can_cancel := false


func _ready() -> void:
	layer = 20
	_root = Control.new()
	_root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(_root)

	_box = PanelContainer.new()
	_box.anchor_left = 0.0
	_box.anchor_right = 1.0
	_box.anchor_top = 1.0
	_box.anchor_bottom = 1.0
	_box.offset_left = 150
	_box.offset_right = -150
	_box.offset_top = -214
	_box.offset_bottom = -18
	_box.gui_input.connect(_on_box_input)
	_root.add_child(_box)
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 4)
	_box.add_child(v)
	var head := HBoxContainer.new()
	v.add_child(head)
	_name = Label.new()
	_name.add_theme_color_override("font_color", Color(1.0, 0.86, 0.45))
	_name.add_theme_font_size_override("font_size", 22)
	head.add_child(_name)
	_tag = Label.new()
	_tag.add_theme_color_override("font_color", Color(0.55, 0.9, 1.0))
	_tag.add_theme_font_size_override("font_size", 18)
	_tag.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_tag.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	head.add_child(_tag)
	_ja = Label.new()
	_ja.add_theme_color_override("font_color", Color(0.74, 0.82, 1.0))
	_ja.add_theme_font_size_override("font_size", 20)
	_ja.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	v.add_child(_ja)
	_en = RichTextLabel.new()
	_en.bbcode_enabled = true
	_en.fit_content = true
	_en.scroll_active = false
	_en.add_theme_font_size_override("normal_font_size", 28)
	_en.add_theme_font_size_override("bold_font_size", 28)
	_en.add_theme_font_override("bold_font", Game.font)
	_en.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_en.mouse_filter = Control.MOUSE_FILTER_PASS
	v.add_child(_en)
	_arrow = Label.new()
	_arrow.text = "▼"
	_arrow.add_theme_color_override("font_color", Color(1.0, 0.9, 0.55))
	_arrow.set_anchors_preset(Control.PRESET_BOTTOM_RIGHT)
	_arrow.position = Vector2(-48, -50)
	_box.add_child(_arrow)
	_arrow.top_level = false

	_choice_panel = PanelContainer.new()
	_choice_panel.anchor_left = 1.0
	_choice_panel.anchor_right = 1.0
	_choice_panel.anchor_top = 1.0
	_choice_panel.anchor_bottom = 1.0
	_choice_panel.grow_horizontal = Control.GROW_DIRECTION_BEGIN
	_choice_panel.grow_vertical = Control.GROW_DIRECTION_BEGIN
	_choice_panel.offset_right = -150
	_choice_panel.offset_bottom = -224
	_root.add_child(_choice_panel)
	var cv := VBoxContainer.new()
	_choice_panel.add_child(cv)
	_choices = GridContainer.new()
	_choices.add_theme_constant_override("h_separation", 10)
	_choices.add_theme_constant_override("v_separation", 8)
	cv.add_child(_choices)
	_replay = Button.new()
	_replay.text = "♪ もう一度聞く"
	_replay.add_theme_font_size_override("font_size", 18)
	_replay.pressed.connect(func(): Game.speak(_say_text))
	cv.add_child(_replay)
	_hide_all()


func _process(_delta: float) -> void:
	_arrow.visible = _waiting and not _choosing and (Time.get_ticks_msec() / 400) % 2 == 0
	if _arrow.visible:
		_arrow.position = Vector2(_box.size.x - 44, _box.size.y - 46)


func _hide_all() -> void:
	_box.visible = false
	_choice_panel.visible = false
	open = false


func close() -> void:
	_hide_all()


func _show(speaker: String, ja: String, en: String, tag := "") -> void:
	open = true
	_box.visible = true
	_name.text = speaker
	_name.visible = speaker != ""
	_tag.text = tag
	_ja.text = ja
	_ja.visible = ja != ""
	_en.text = en
	_en.visible_ratio = 1.0


func say(speaker: String, en: String, ja := "", keep_open := false) -> void:
	_show(speaker, ja, en)
	_en.visible_ratio = 0.0
	var chars := en.length()
	_typing = create_tween()
	_typing.tween_method(_type_step, 0.0, 1.0, maxf(0.25, chars * 0.022))
	await _wait_advance()
	if not keep_open:
		close()


func _type_step(r: float) -> void:
	var before := int(_en.visible_ratio * 40)
	_en.visible_ratio = r
	if int(r * 40) != before and int(r * 40) % 3 == 0:
		Game.sfx("blip")


func _wait_advance() -> void:
	_waiting = true
	while true:
		await advanced
		if _typing and _typing.is_running():
			_typing.kill()
			_en.visible_ratio = 1.0
			continue
		break
	_waiting = false
	Game.sfx("move")


## Shows a message and a column of choices; returns the chosen index (or -1 on cancel if allowed).
func ask(speaker: String, en: String, ja: String, options: Array, can_cancel := true) -> int:
	_show(speaker, ja, en)
	_fill_choices(options, 1, false)
	var i := await _wait_choice(can_cancel)
	close()
	return i


func _fill_choices(options: Array, columns: int, wide: bool) -> void:
	for c in _choices.get_children():
		c.queue_free()
	_choices.columns = columns
	_choice_panel.offset_left = 150 if wide else 0
	_choice_panel.anchor_left = 0.0 if wide else 1.0
	for i in options.size():
		var b := Button.new()
		b.text = options[i]
		b.alignment = HORIZONTAL_ALIGNMENT_LEFT
		b.custom_minimum_size = Vector2(0 if wide else 260, 50)
		b.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		b.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		b.add_theme_font_size_override("font_size", 22)
		b.pressed.connect(_on_choice.bind(i))
		b.focus_entered.connect(func(): Game.sfx("blip"))
		_choices.add_child(b)
	_choice_panel.visible = true


func _wait_choice(can_cancel: bool) -> int:
	_choosing = true
	await get_tree().process_frame
	var first := _choices.get_child(0) as Button
	if first:
		first.grab_focus()
	_can_cancel = can_cancel
	var i: int = await chosen
	_choosing = false
	_choice_panel.visible = false
	Game.sfx("select")
	return i


func _on_choice(i: int) -> void:
	if _choosing:
		chosen.emit(i)


## Runs one multiple-choice question. Returns true when answered correctly.
func quiz(q: Dictionary, speaker := "") -> bool:
	_say_text = q.get("say", "")
	var sub: String = q.get("sub", "")
	if q.kind == "listen" and not Game.can_speak():
		sub += "\n（音声が使えない環境です：%s）" % q.hidden_text
	_show(speaker, sub, "[b]%s[/b]" % q.prompt, q.label)
	var labels := []
	for i in q.options.size():
		labels.append("%d. %s" % [i + 1, q.options[i]])
	_fill_choices(labels, 2, true)
	_replay.visible = _say_text != "" and Game.can_speak()
	if _say_text != "":
		Game.speak(_say_text)
	var pick := await _wait_choice(false)
	var ok: bool = pick == int(q.answer)
	Game.stats["right" if ok else "wrong"] += 1
	Game.sfx("ok" if ok else "ng")
	var head := "[color=#7dffa0]◎ Correct! 正解！[/color]" if ok else "[color=#ff8a7a]× Not quite… 答え: %s[/color]" % q.options[q.answer]
	var body: String = q.get("explain", "")
	_show(speaker, q.get("tip", ""), "%s\n%s" % [head, body], q.label)
	if q.get("after", "") != "" and q.kind != "listen":
		Game.speak(q.after)
	await _wait_advance()
	close()
	return ok


func _unhandled_input(event: InputEvent) -> void:
	if not open:
		return
	if _choosing:
		if event is InputEventKey and event.pressed and not event.echo and event.keycode >= KEY_1 and event.keycode <= KEY_4:
			var b := _choices.get_child(event.keycode - KEY_1) as Button
			if b:
				b.pressed.emit()
			get_viewport().set_input_as_handled()
		elif event.is_action_pressed("accept"):
			var f := get_viewport().gui_get_focus_owner() as Button
			if f and _choices.is_ancestor_of(f):
				f.pressed.emit()
			get_viewport().set_input_as_handled()
		elif event.is_action_pressed("cancel") and _can_cancel:
			chosen.emit(-1)
			get_viewport().set_input_as_handled()
		return
	if _waiting and (event.is_action_pressed("accept") or event.is_action_pressed("cancel")):
		advanced.emit()
		get_viewport().set_input_as_handled()


func _on_box_input(event: InputEvent) -> void:
	if _waiting and not _choosing and event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		advanced.emit()
