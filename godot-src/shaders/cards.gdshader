// Grass and flower cards: alpha-cut texture tinted per instance, tips sway with the wind.
shader_type spatial;
render_mode cull_disabled;

uniform sampler2D albedo : source_color, filter_nearest_mipmap;
uniform float sway = 0.08;

void vertex() {
	vec3 origin = (MODEL_MATRIX * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
	float tip = 1.0 - UV.y;
	float gust = sin(TIME * 0.9 + origin.x * 0.25) * 0.5 + 0.5;
	VERTEX.x += sin(TIME * 2.2 + origin.x * 0.9 + origin.z * 0.6) * sway * tip * (0.6 + gust);
	VERTEX.z += cos(TIME * 1.7 + origin.x * 0.5) * sway * 0.5 * tip;
	NORMAL = vec3(0.0, 1.0, 0.0);
}

void fragment() {
	vec4 c = texture(albedo, UV);
	ALBEDO = c.rgb * COLOR.rgb;
	ALPHA = c.a;
	ALPHA_SCISSOR_THRESHOLD = 0.5;
	ROUGHNESS = 1.0;
}
