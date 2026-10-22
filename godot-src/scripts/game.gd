extends Node
## Global state for the Godot prototype: learning data, a read-only view of the web save,
## question generation, speech, synthesized sound and scene changes.

const WEB_SAVE_KEY := "wordbound-realms-v1"
const RATE := 16000

var host: Node
var current: Node
var learning: Dictionary
var world: Dictionary
var bands: Array[String] = []
var theme: Theme
var font: Font

## Prototype session state. Seeded from the web save when one exists; never written back.
var hero := {"lv": 1, "hp": 34, "mp": 9, "exp": 0, "gold": 30, "herb": 3, "berry": 3, "band": 0}
var team: Array = []
var save_note := ""
var stats := {"right": 0, "wrong": 0}

var _fade: ColorRect
var _loading: Label
var _busy := false
var _sfx: Dictionary = {}
var _sfx_players: Array[AudioStreamPlayer] = []
var _music: AudioStreamPlayer
var _music_cache: Dictionary = {}
var _music_name := ""
var _voice := ""


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	learning = _load_json("res://data/learning.json")
	world = _load_json("res://data/world.json")
	for q in learning.spells:
		if not bands.has(q.learning_level):
			bands.append(q.learning_level)
	_setup_theme()
	_setup_input()
	_setup_audio()
	_read_web_save()
	var layer := CanvasLayer.new()
	layer.layer = 128
	add_child(layer)
	_fade = ColorRect.new()
	_fade.color = Color(0.02, 0.03, 0.05, 1)
	_fade.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_fade.mouse_filter = Control.MOUSE_FILTER_IGNORE
	layer.add_child(_fade)
	_loading = Label.new()
	_loading.text = "よみこみ中…"
	_loading.add_theme_font_size_override("font_size", 26)
	_loading.add_theme_color_override("font_color", Color(1, 0.9, 0.6))
	_loading.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_RIGHT)
	_loading.grow_horizontal = Control.GROW_DIRECTION_BEGIN
	_loading.grow_vertical = Control.GROW_DIRECTION_BEGIN
	_loading.position -= Vector2(28, 24)
	_loading.visible = false
	layer.add_child(_loading)


func _load_json(path: String) -> Dictionary:
	return JSON.parse_string(FileAccess.get_file_as_string(path))


# ---------------------------------------------------------------- stats

func max_hp() -> int: return 26 + 8 * int(hero.lv)
func max_mp() -> int: return 6 + 3 * int(hero.lv)
func atk() -> int: return 6 + 3 * int(hero.lv)
func defense() -> int: return 2 + 2 * int(hero.lv)
func need_exp() -> int: return 10 * int(hero.lv) * int(hero.lv)


func team_power() -> int:
	var p := 0
	for m in team:
		p += int(world.species.get(m.id, {}).get("power", 0)) + int(m.lv) / 3
	return p


func _read_web_save() -> void:
	if not OS.has_feature("web"):
		save_note = "Web版のセーブは読み込みません（PC実行）"
		return
	var raw = JavaScriptBridge.eval("window.localStorage.getItem('%s')" % WEB_SAVE_KEY, true)
	if typeof(raw) != TYPE_STRING or raw == "":
		save_note = "Web版のセーブはありません。Lv.1で試遊します"
		return
	var data = JSON.parse_string(raw)
	if typeof(data) != TYPE_DICTIONARY or typeof(data.get("S")) != TYPE_DICTIONARY:
		save_note = "Web版のセーブを読めませんでした。Lv.1で試遊します"
		return
	var s: Dictionary = data.S
	hero.lv = maxi(1, int(s.get("lv", 1)))
	hero.exp = int(s.get("exp", 0))
	hero.gold = int(s.get("gold", 30))
	hero.hp = clampi(int(s.get("hp", max_hp())), 1, max_hp())
	hero.mp = clampi(int(s.get("mp", max_mp())), 0, max_mp())
	var items: Dictionary = s.get("items", {})
	hero.herb = int(items.get("herb", 0))
	hero.berry = int(items.get("berry", 0))
	if typeof(data.get("opt")) == TYPE_DICTIONARY:
		hero.band = clampi(int(data.opt.get("band", 0)), 0, bands.size() - 1)
	var comp = s.get("companions", {})
	if typeof(comp) == TYPE_DICTIONARY:
		for uid in comp.get("team", []):
			for m in comp.get("owned", []):
				if m.get("uid") == uid and world.species.has(m.get("id")):
					team.append({"id": m.id, "lv": int(m.get("lv", 1))})
	save_note = "Web版のセーブ（Lv.%d）を読み込みました。試作版からは書き込みません" % hero.lv


# ---------------------------------------------------------------- questions

func _pick(arr: Array):
	return arr[randi() % arr.size()]


func _choices(right: String, wrong: Array) -> Dictionary:
	var opts: Array = [right]
	for w in wrong:
		if not opts.has(w) and opts.size() < 4:
			opts.append(w)
	opts.shuffle()
	return {"options": opts, "answer": opts.find(right)}


func q_vocab(tier: int) -> Dictionary:
	var pool: Array = learning.vocab.filter(func(v): return int(v.tier) == tier)
	var w = _pick(pool)
	var others: Array = pool.filter(func(v): return v != w)
	others.shuffle()
	var ej := randf() < 0.6
	var q := {"kind": "vocab", "label": "VOCAB 単語", "prompt": w.en if ej else w.ja,
		"sub": "意味は？ What does it mean?" if ej else "英語では？ Which English word?",
		"say": w.en if ej else "", "after": w.en, "explain": "%s = %s" % [w.en, w.ja], "tip": ""}
	q.merge(_choices(w.ja if ej else w.en, others.slice(0, 3).map(func(o): return o.ja if ej else o.en)))
	return q


func q_spell() -> Dictionary:
	var level: String = bands[hero.band]
	var src = _pick(learning.spells.filter(func(s): return s.learning_level == level))
	var filled: String = src.prompt_en.replace("____", src.answer)
	var q := {"kind": "spell", "label": "SPELL 呪文 · " + level, "prompt": src.prompt_en.replace("____", "［ ? ］"),
		"sub": src.cue_ja, "say": "", "after": filled, "explain": filled, "tip": src.explanation_ja}
	q.merge(_choices(src.answer, src.options.filter(func(o): return o != src.answer)))
	return q


func q_listen(tier: int) -> Dictionary:
	var pool: Array = learning.listen.filter(func(v): return int(v.tier) == tier)
	var l = _pick(pool)
	var others: Array = pool.filter(func(v): return v != l)
	others.shuffle()
	var heard := randf() < 0.5
	var q := {"kind": "listen", "label": "ECHO リスニング",
		"prompt": "♪ 聞こえた英文はどれ？" if heard else "♪ 意味はどれ？",
		"sub": "Which sentence did you hear?" if heard else "What does it mean?",
		"say": l.en, "after": l.en, "explain": "%s\n%s" % [l.en, l.ja], "tip": "", "hidden_text": l.en}
	q.merge(_choices(l.en if heard else l.ja, others.slice(0, 3).map(func(o): return o.en if heard else o.ja)))
	return q


# ---------------------------------------------------------------- speech

func can_speak() -> bool:
	return _pick_voice() != ""


func _pick_voice() -> String:
	if _voice != "":
		return _voice
	var voices := DisplayServer.tts_get_voices_for_language("en")
	if voices.size() > 0:
		_voice = voices[0]
	return _voice


func speak(text: String, rate := 0.9) -> void:
	if text == "" or _pick_voice() == "":
		return
	DisplayServer.tts_stop()
	DisplayServer.tts_speak(text, _voice, 90, 1.0, rate)


# ---------------------------------------------------------------- scenes

func goto(scene_name: String, args := {}) -> void:
	if _busy:
		return
	_busy = true
	var t := create_tween()
	t.tween_property(_fade, "color:a", 1.0, 0.35)
	await t.finished
	_loading.visible = true
	# Let the label reach the screen before the next scene's synchronous build.
	await get_tree().process_frame
	await get_tree().process_frame
	if current:
		current.queue_free()
		await current.tree_exited
	current = load("res://scripts/%s.gd" % scene_name).new()
	if current.has_method("setup"):
		current.setup(args)
	host.add_child(current)
	await get_tree().process_frame
	_loading.visible = false
	t = create_tween()
	t.tween_property(_fade, "color:a", 0.0, 0.45)
	await t.finished
	_busy = false


func flash(color: Color, time := 0.25) -> void:
	_fade.color = Color(color, 0.85)
	var t := create_tween()
	t.tween_property(_fade, "color:a", 0.0, time)
	t.tween_callback(func(): _fade.color = Color(0.02, 0.03, 0.05, 0))


# ---------------------------------------------------------------- look & input

func _setup_theme() -> void:
	font = load("res://assets/fonts/DotGothic16-Regular.ttf")
	# The engine default theme reaches every Control, including those under CanvasLayers.
	ThemeDB.fallback_font = font
	ThemeDB.fallback_font_size = 24
	theme = ThemeDB.get_default_theme()
	theme.default_font = font
	theme.default_font_size = 24
	var normal := frame_box(Color(0.04, 0.05, 0.09, 0.94), Color(0.92, 0.94, 1.0), 3)
	var hover := frame_box(Color(0.13, 0.17, 0.32, 0.97), Color(1.0, 0.9, 0.55), 3)
	var pressed := frame_box(Color(0.22, 0.2, 0.08, 0.97), Color(1.0, 0.86, 0.4), 3)
	var disabled := frame_box(Color(0.06, 0.06, 0.08, 0.8), Color(0.4, 0.42, 0.48), 3)
	for state in [["normal", normal], ["hover", hover], ["pressed", pressed], ["focus", hover], ["disabled", disabled]]:
		theme.set_stylebox(state[0], "Button", state[1])
	theme.set_color("font_color", "Button", Color(0.95, 0.96, 1.0))
	theme.set_color("font_hover_color", "Button", Color(1.0, 0.93, 0.6))
	theme.set_color("font_focus_color", "Button", Color(1.0, 0.93, 0.6))
	theme.set_color("font_pressed_color", "Button", Color(1.0, 0.86, 0.4))
	theme.set_color("font_disabled_color", "Button", Color(0.45, 0.47, 0.52))
	theme.set_stylebox("panel", "PanelContainer", frame_box(Color(0.03, 0.04, 0.08, 0.92), Color(0.92, 0.94, 1.0), 3))
	theme.set_color("font_outline_color", "Label", Color(0.02, 0.02, 0.05))
	theme.set_constant("outline_size", "Label", 0)


func frame_box(bg: Color, border: Color, width: int) -> StyleBoxFlat:
	var b := StyleBoxFlat.new()
	b.bg_color = bg
	b.border_color = border
	b.set_border_width_all(width)
	b.set_corner_radius_all(6)
	b.set_content_margin_all(14)
	b.shadow_color = Color(0, 0, 0, 0.45)
	b.shadow_size = 6
	b.shadow_offset = Vector2(0, 3)
	return b


func _setup_input() -> void:
	var map := {
		"move_up": [KEY_UP, KEY_W], "move_down": [KEY_DOWN, KEY_S],
		"move_left": [KEY_LEFT, KEY_A], "move_right": [KEY_RIGHT, KEY_D],
		"accept": [KEY_Z, KEY_ENTER, KEY_SPACE], "cancel": [KEY_X, KEY_ESCAPE]}
	for action in map:
		if not InputMap.has_action(action):
			InputMap.add_action(action, 0.3)
		for k in map[action]:
			var e := InputEventKey.new()
			e.physical_keycode = k
			InputMap.action_add_event(action, e)


# ---------------------------------------------------------------- sound

func _setup_audio() -> void:
	for i in 6:
		var p := AudioStreamPlayer.new()
		add_child(p)
		_sfx_players.append(p)
	_music = AudioStreamPlayer.new()
	_music.volume_db = -9.0
	add_child(_music)


func sfx(sound_name: String) -> void:
	if not _sfx.has(sound_name):
		_sfx[sound_name] = _make_sfx(sound_name)
	for p in _sfx_players:
		if not p.playing:
			p.stream = _sfx[sound_name]
			p.play()
			return


func music(track: String) -> void:
	if track == _music_name:
		return
	_music_name = track
	if track == "":
		_music.stop()
		return
	if not _music_cache.has(track):
		var baked := "res://assets/baked/%s.wav" % track
		_music_cache[track] = load(baked) if ResourceLoader.exists(baked) else _make_music(track)
	_music.stream = _music_cache[track]
	_music.play()


## Writes the synthesized music and the village ground to assets/baked so the web build skips the slow generation.
## Run from a desktop build: `godot --path godot-src -- bake=1`, then re-export.
func bake() -> void:
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path("res://assets/baked"))
	for track in ["title", "village", "battle"]:
		_make_music(track).save_to_wav(ProjectSettings.globalize_path("res://assets/baked/%s.wav" % track))
	var v = load("res://scripts/village.gd").new()
	v.load_map()
	v.paint_ground().save_png(ProjectSettings.globalize_path("res://assets/baked/ground.png"))
	v.free()
	print("baked assets")


func _wav(buf: PackedFloat32Array, loop := false) -> AudioStreamWAV:
	var bytes := PackedByteArray()
	bytes.resize(buf.size() * 2)
	for i in buf.size():
		bytes.encode_s16(i * 2, int(clampf(buf[i], -1.0, 1.0) * 30000.0))
	var w := AudioStreamWAV.new()
	w.format = AudioStreamWAV.FORMAT_16_BITS
	w.mix_rate = RATE
	w.data = bytes
	if loop:
		w.loop_mode = AudioStreamWAV.LOOP_FORWARD
		w.loop_end = buf.size()
	return w


## Adds one enveloped note. wave: 0 pulse, 1 triangle, 2 sine, 3 noise.
func _note(buf: PackedFloat32Array, start: float, dur: float, freq: float, wave: int, vol: float, slide := 0.0, release := 0.08) -> void:
	var n0 := int(start * RATE)
	var n := int(dur * RATE)
	var phase := 0.0
	var lp := 0.0
	for i in n:
		var idx := n0 + i
		if idx >= buf.size():
			break
		var t := float(i) / RATE
		var f := freq * (1.0 + slide * t / dur)
		phase = fmod(phase + f / RATE, 1.0)
		var s := 0.0
		match wave:
			0: s = 1.0 if phase < 0.3 else -1.0
			1: s = 4.0 * absf(phase - 0.5) - 1.0
			2: s = sin(phase * TAU)
			3: s = randf_range(-1.0, 1.0)
		lp += (s - lp) * (0.45 if wave == 0 else 1.0)
		var env := minf(1.0, t / 0.006) * clampf((dur - t) / release, 0.0, 1.0)
		buf[idx] += lp * vol * env


func _midi(m: float) -> float:
	return 440.0 * pow(2.0, (m - 69.0) / 12.0)


func _make_sfx(sound_name: String) -> AudioStreamWAV:
	var buf := PackedFloat32Array()
	buf.resize(int(RATE * 0.9))
	match sound_name:
		"blip": _note(buf, 0, 0.035, 1250, 0, 0.12, 0.0, 0.02)
		"move": _note(buf, 0, 0.05, 880, 0, 0.18, 0.2, 0.03)
		"select": _note(buf, 0, 0.06, 988, 0, 0.2); _note(buf, 0.06, 0.09, 1319, 0, 0.2)
		"ok":
			for i in 3:
				_note(buf, i * 0.07, 0.16, _midi(76 + [0, 4, 7][i]), 0, 0.2)
			_note(buf, 0.21, 0.3, _midi(88), 2, 0.25)
		"ng": _note(buf, 0, 0.14, _midi(57), 0, 0.22); _note(buf, 0.13, 0.28, _midi(52), 0, 0.22, -0.1)
		"hit": _note(buf, 0, 0.16, 1, 3, 0.55, 0.0, 0.14); _note(buf, 0, 0.18, 140, 2, 0.6, -0.6, 0.12)
		"crit":
			_note(buf, 0, 0.22, 1, 3, 0.6, 0.0, 0.2); _note(buf, 0, 0.25, 220, 0, 0.3, -0.7)
			_note(buf, 0.05, 0.3, _midi(84), 2, 0.2, 0.0, 0.25)
		"hurt": _note(buf, 0, 0.2, 1, 3, 0.45, 0.0, 0.18); _note(buf, 0, 0.25, 110, 0, 0.35, -0.5)
		"heal":
			for i in 4:
				_note(buf, i * 0.06, 0.25, _midi(72 + [0, 4, 7, 12][i]), 2, 0.22)
		"encounter":
			_note(buf, 0, 0.5, 220, 0, 0.22, 3.0, 0.1)
			_note(buf, 0.04, 0.5, 330, 0, 0.12, 3.0, 0.1)
		"win":
			var seq := [72, 76, 79, 84]
			for i in 4:
				_note(buf, i * 0.1, 0.14 if i < 3 else 0.5, _midi(seq[i]), 0, 0.22)
				_note(buf, i * 0.1, 0.14 if i < 3 else 0.5, _midi(seq[i] - 12), 1, 0.25)
	return _wav(buf)


## Small looping chiptune tracks. Steps are eighth notes: MIDI note, -1 holds, 0 rests.
func _make_music(track: String) -> AudioStreamWAV:
	var village := {
		"bpm": 104.0, "lead_wave": 0, "drums": false,
		"lead": [76,-1,79,-1,84,-1,83,79, 81,-1,-1,79,76,-1,72,-1, 77,-1,81,-1,79,77,76,-1, 74,-1,-1,-1,79,-1,-1,-1,
			76,-1,79,84,86,-1,84,-1, 83,-1,81,-1,79,-1,76,-1, 77,79,81,-1,84,-1,81,-1, 79,-1,-1,-1,72,-1,-1,0],
		"chords": [[48, [60, 64, 67, 72]], [45, [57, 60, 64, 69]], [41, [53, 57, 60, 65]], [43, [55, 59, 62, 67]]]}
	var battle := {
		"bpm": 152.0, "lead_wave": 0, "drums": true,
		"lead": [69,-1,72,-1,76,-1,74,72, 77,-1,76,-1,74,-1,72,-1, 74,-1,76,-1,79,-1,77,76, 76,-1,-1,-1,68,-1,71,-1,
			69,72,76,81,-1,79,77,76, 77,-1,81,-1,79,-1,77,-1, 79,-1,77,-1,76,-1,74,-1, 76,-1,-1,-1,-1,-1,0,0],
		"chords": [[45, [57, 60, 64, 69]], [41, [53, 57, 60, 65]], [43, [55, 59, 62, 67]], [40, [52, 56, 59, 64]]]}
	var title := {
		"bpm": 84.0, "lead_wave": 2, "drums": false,
		"lead": [72,-1,-1,76,79,-1,-1,-1, 81,-1,79,-1,76,-1,-1,-1, 77,-1,-1,81,84,-1,-1,-1, 83,-1,79,-1,-1,-1,-1,-1,
			72,-1,-1,76,79,-1,84,-1, 86,-1,84,-1,81,-1,-1,-1, 77,-1,81,-1,79,-1,76,-1, 74,-1,-1,-1,72,-1,-1,0],
		"chords": [[48, [60, 64, 67, 72]], [45, [57, 60, 64, 69]], [41, [53, 57, 60, 65]], [43, [55, 59, 62, 67]]]}
	var song: Dictionary = {"village": village, "battle": battle, "title": title}[track]
	var step: float = 60.0 / song.bpm / 2.0
	var lead: Array = song.lead
	var buf := PackedFloat32Array()
	buf.resize(int(lead.size() * step * RATE))
	var i := 0
	while i < lead.size():
		var m: int = lead[i]
		var hold := 1
		while i + hold < lead.size() and lead[i + hold] == -1:
			hold += 1
		if m > 0:
			_note(buf, i * step, hold * step, _midi(m), song.lead_wave, 0.13, 0.0, 0.12)
		i += hold
	var arp := [0, 1, 2, 3, 2, 1, 2, 1]
	for s in lead.size():
		var chord: Array = song.chords[(s / 8) % 4]
		var t := s * step
		if s % 2 == 0 or song.drums:
			_note(buf, t, step * (2.0 if not song.drums else 0.9), _midi(chord[0] + (12 if song.drums and s % 2 == 1 else 0)), 1, 0.2)
		_note(buf, t, step * 0.8, _midi(chord[1][arp[s % 8]]), 0, 0.045)
		if song.drums:
			_note(buf, t, 0.04, 1, 3, 0.07 if s % 2 else 0.12, 0.0, 0.03)
			if s % 4 == 2:
				_note(buf, t, 0.12, 1, 3, 0.16, 0.0, 0.1)
	return _wav(buf, true)
