extends Control
## Entry point: hands the scene host to the Game autoload and opens the title.
## For checks: `godot --path godot-src -- scene=village shot=C:/tmp/v.png after=4` opens a scene and saves a screenshot.

func _ready() -> void:
	Game.host = self
	var opts := {}
	for a in OS.get_cmdline_user_args():
		var kv := a.split("=", true, 1)
		if kv.size() == 2:
			opts[kv[0]] = kv[1]
	if opts.has("bake"):
		await Game.bake()
		get_tree().quit()
		return
	Game.goto(opts.get("scene", "title"))
	# press=accept@2.5,move_up@3 injects actions at the given seconds (for scripted screenshots).
	for p in str(opts.get("press", "")).split(",", false):
		var at := p.split("@")
		get_tree().create_timer(float(at[1])).timeout.connect(_press.bind(at[0]))
	if opts.has("shot"):
		await get_tree().create_timer(float(opts.get("after", "3"))).timeout
		get_viewport().get_texture().get_image().save_png(opts.shot)
		get_tree().quit()


func _press(action: String) -> void:
	for pressed in [true, false]:
		var e := InputEventAction.new()
		e.action = action
		e.pressed = pressed
		Input.parse_input_event(e)
		await get_tree().create_timer(0.25 if action.begins_with("move") else 0.05).timeout
