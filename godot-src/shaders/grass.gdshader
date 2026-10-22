// Instanced grass tufts. UV.y is blade height (0 root, 1 tip); instance colour tints the tips.
shader_type spatial;
render_mode cull_disabled;

uniform vec4 root_col : source_color = vec4(0.16, 0.34, 0.14, 1.0);
uniform vec4 tip_col : source_color = vec4(0.62, 0.84, 0.36, 1.0);

void vertex() {
	vec3 wp = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
	float h = UV.y;
	VERTEX.x += sin(TIME * 2.0 + wp.x * 0.9 + wp.z * 0.6) * 0.07 * h;
	VERTEX.z += cos(TIME * 1.6 + wp.x * 0.5) * 0.03 * h;
	NORMAL = vec3(0.0, 1.0, 0.0);
}

void fragment() {
	ALBEDO = mix(root_col.rgb, tip_col.rgb * COLOR.rgb, UV.y);
	ROUGHNESS = 1.0;
}
