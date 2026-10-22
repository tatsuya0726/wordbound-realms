// Instanced leaf cards: pixel leaf clump texture, per-instance shade/tint, wind flutter, alpha-cut shadows.
shader_type spatial;
render_mode cull_disabled;

uniform sampler2D albedo : source_color, filter_nearest_mipmap;
uniform float sway = 0.06;

void vertex() {
	vec3 origin = (MODEL_MATRIX * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
	float t = TIME * 1.5 + origin.x * 0.7 + origin.z * 0.5;
	VERTEX += vec3(sin(t), sin(t * 1.3) * 0.3, cos(t * 0.8)) * sway * (1.0 - UV.y * 0.5);
	NORMAL = vec3(0.0, 1.0, 0.0);
}

void fragment() {
	vec4 c = texture(albedo, UV);
	ALBEDO = c.rgb * COLOR.rgb;
	ALPHA = c.a;
	ALPHA_SCISSOR_THRESHOLD = 0.5;
	ROUGHNESS = 0.9;
}
