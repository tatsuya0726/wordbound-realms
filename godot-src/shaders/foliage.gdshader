// Leafy canopies and hedges: speckled two-tone colour lit from above, gentle wind sway.
shader_type spatial;

uniform vec4 dark : source_color = vec4(0.13, 0.33, 0.17, 1.0);
uniform vec4 light : source_color = vec4(0.55, 0.78, 0.33, 1.0);
uniform float sway = 0.04;
uniform float speckle = 10.0;

varying vec3 wpos;
varying vec3 wnrm;

void vertex() {
	wpos = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
	wnrm = normalize((MODEL_MATRIX * vec4(NORMAL, 0.0)).xyz);
	VERTEX.x += sin(TIME * 1.2 + wpos.x * 0.8 + wpos.z * 0.4) * sway * max(VERTEX.y + 0.5, 0.0);
}

void fragment() {
	vec3 cell = floor(wpos * speckle);
	float n = fract(sin(dot(cell, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
	float up = clamp(wnrm.y * 0.55 + 0.45, 0.0, 1.0);
	ALBEDO = mix(dark.rgb, light.rgb, clamp(up * 0.85 + n * 0.32 - 0.12, 0.0, 1.0));
	ROUGHNESS = 0.95;
}
