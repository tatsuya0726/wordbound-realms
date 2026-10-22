class_name TouchControls
extends CanvasLayer
## Multi-touch virtual stick (bottom left) and A/B buttons (bottom right) for phones in landscape.

const R := 74.0
const BTN := 50.0

var stick := Vector2.ZERO
var _pad: Control
var _stick_index := -1
var _stick_center := Vector2.ZERO
var _buttons := {}  # touch index -> action
var _lit := {"accept": false, "cancel": false}


func _ready() -> void:
	layer = 15
	_pad = Control.new()
	_pad.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_pad.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_pad.draw.connect(_draw_pad)
	add_child(_pad)
	visible = DisplayServer.is_touchscreen_available()


func _layout() -> Dictionary:
	var s := _pad.get_viewport_rect().size
	return {"stick": Vector2(140, s.y - 140), "accept": Vector2(s.x - 110, s.y - 170), "cancel": Vector2(s.x - 205, s.y - 90)}


func _input(event: InputEvent) -> void:
	if event is InputEventScreenTouch:
		if not visible:
			visible = true
		var l := _layout()
		if event.pressed:
			if _stick_index == -1 and event.position.distance_to(l.stick) < R * 1.7:
				_stick_index = event.index
				_stick_center = l.stick
				_move_knob(event.position)
				get_viewport().set_input_as_handled()
			else:
				for action in ["accept", "cancel"]:
					if event.position.distance_to(l[action]) < BTN * 1.25:
						_buttons[event.index] = action
						_send(action, true)
						get_viewport().set_input_as_handled()
		else:
			if event.index == _stick_index:
				_stick_index = -1
				stick = Vector2.ZERO
				_pad.queue_redraw()
			if _buttons.has(event.index):
				_send(_buttons[event.index], false)
				_buttons.erase(event.index)
	elif event is InputEventScreenDrag and event.index == _stick_index:
		_move_knob(event.position)
		get_viewport().set_input_as_handled()


func _move_knob(p: Vector2) -> void:
	var d := (p - _stick_center) / R
	stick = d.limit_length(1.0)
	if stick.length() < 0.18:
		stick = Vector2.ZERO
	_pad.queue_redraw()


func _send(action: String, pressed: bool) -> void:
	_lit[action] = pressed
	var e := InputEventAction.new()
	e.action = action
	e.pressed = pressed
	Input.parse_input_event(e)
	_pad.queue_redraw()


func release_all() -> void:
	_stick_index = -1
	stick = Vector2.ZERO
	_pad.queue_redraw()


func _notification(what: int) -> void:
	if what == NOTIFICATION_APPLICATION_FOCUS_OUT:
		release_all()


func _draw_pad() -> void:
	var l := _layout()
	var c: Vector2 = l.stick
	# Raised base: drop shadow, rim and inner well give the pad a physical look.
	_pad.draw_circle(c + Vector2(0, 8), R + 6, Color(0, 0, 0, 0.35))
	_pad.draw_circle(c, R + 6, Color(0.82, 0.86, 0.95, 0.55))
	_pad.draw_circle(c, R, Color(0.08, 0.1, 0.16, 0.6))
	_pad.draw_circle(c + Vector2(0, -R * 0.25), R * 0.7, Color(1, 1, 1, 0.05))
	var k := c + stick * R * 0.62
	_pad.draw_circle(k + Vector2(0, 6), 34, Color(0, 0, 0, 0.4))
	_pad.draw_circle(k, 34, Color(0.88, 0.9, 0.97, 0.95))
	_pad.draw_circle(k + Vector2(-7, -9), 18, Color(1, 1, 1, 0.9))
	for action in ["accept", "cancel"]:
		var p: Vector2 = l[action]
		var lit: bool = _lit[action]
		var base := Color(0.95, 0.75, 0.3) if action == "accept" else Color(0.55, 0.7, 0.95)
		_pad.draw_circle(p + Vector2(0, 7 if not lit else 2), BTN, Color(0, 0, 0, 0.4))
		_pad.draw_circle(p + Vector2(0, 0 if not lit else 5), BTN, base.darkened(0.25 if lit else 0.0))
		_pad.draw_circle(p + Vector2(-10, -12 if not lit else -7), BTN * 0.45, Color(1, 1, 1, 0.3))
		var label := "A" if action == "accept" else "B"
		_pad.draw_string(Game.font, p + Vector2(-11, 12 if not lit else 17), label, HORIZONTAL_ALIGNMENT_CENTER, -1, 34, Color(0.08, 0.08, 0.12))
