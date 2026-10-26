extends Node
## Bakes one Effekseer effect into PNG frames for a 2D game: the same moment is rendered over black and over white by
## two cameras sharing one World3D, so a later step can recover colour and alpha (additive glow included).
## Run: godot --path <lab> --fixed-fps 60 res://bake/Bake.tscn -- <effect id> <frames> <every> <out dir> <mode> <ortho size> <centre y> <px> [<pitch deg>]
##   mode "still": the effect plays in place (impacts, strikes); "fly": it travels +X at 7 m/s and the cameras follow
##   the head (projectiles), so trail layers stream behind it.

var cams: Array[Camera3D] = []
var views: Array[SubViewport] = []

func _ready() -> void:
	var a := OS.get_cmdline_user_args()
	var id: String = a[0]
	var frames := int(a[1])
	var every := int(a[2])
	var out: String = a[3]
	var mode: String = a[4]
	var size := float(a[5])
	var centre := float(a[6])
	var px := int(a[7])
	var pitch := float(a[8]) if a.size() > 8 else -14.0
	DirAccess.make_dir_recursive_absolute(out)
	var world := World3D.new()
	for colour in [Color.BLACK, Color.WHITE]:
		var vp := SubViewport.new()
		vp.size = Vector2i(px, px)
		vp.world_3d = world
		vp.render_target_update_mode = SubViewport.UPDATE_ALWAYS
		vp.msaa_3d = Viewport.MSAA_4X
		add_child(vp)
		var env := Environment.new()
		env.background_mode = Environment.BG_COLOR
		env.background_color = colour
		env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
		env.ambient_light_color = Color(1, 1, 1)
		var cam := Camera3D.new()
		cam.projection = Camera3D.PROJECTION_ORTHOGONAL
		cam.size = size
		cam.environment = env
		cam.near = 0.05
		cam.far = 100.0
		vp.add_child(cam)
		cam.current = true
		views.append(vp)
		cams.append(cam)
	var resource: EffekseerEffect = load("res://effects/%s.efkefc" % id)
	if resource == null:
		push_error("missing effect " + id)
		get_tree().quit(1)
		return
	var emitter := EffekseerEmitter3D.new()
	emitter.autoplay = false
	emitter.autofree = false
	emitter.effect = resource
	views[0].add_child(emitter)
	emitter.play()
	var saved := 0
	for f in frames * every:
		var x := 0.0
		if mode == "fly":
			x = f / 60.0 * 7.0
			emitter.global_position = Vector3(x, 1.0, 0)
		for cam in cams:
			cam.global_position = Vector3(x, centre + 10.0 * sin(deg_to_rad(-pitch)), 10.0 * cos(deg_to_rad(-pitch)))
			cam.rotation_degrees = Vector3(pitch, 0, 0)
		await RenderingServer.frame_post_draw
		if f % every == 0:
			views[0].get_texture().get_image().save_png("%s/B_%03d.png" % [out, saved])
			views[1].get_texture().get_image().save_png("%s/W_%03d.png" % [out, saved])
			saved += 1
	print("baked ", id, " frames ", saved)
	get_tree().quit()
