// Fountain water: moving interference ripples with glinting caustics.
shader_type spatial;
render_mode blend_mix, cull_disabled;

uniform vec4 deep : source_color = vec4(0.1, 0.36, 0.52, 1.0);
uniform vec4 shallow : source_color = vec4(0.5, 0.86, 0.92, 1.0);

varying vec3 wpos;

void vertex() {
	wpos = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
}

void fragment() {
	float w = sin(wpos.x * 7.0 + TIME * 2.2) * sin(wpos.z * 6.0 - TIME * 1.7) + 0.5 * sin(length(wpos.xz) * 9.0 - TIME * 3.0);
	float caustic = smoothstep(0.55, 1.2, w * 0.5 + 0.5);
	ALBEDO = mix(deep.rgb, shallow.rgb, 0.35 + caustic * 0.5);
	EMISSION = vec3(0.7, 0.95, 1.0) * caustic * 0.35;
	ALPHA = 0.86;
	ROUGHNESS = 0.06;
	SPECULAR = 0.9;
}
