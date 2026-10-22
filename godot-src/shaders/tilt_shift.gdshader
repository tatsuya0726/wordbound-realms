// HD-2D finishing pass: diorama tilt-shift, split-tone grade (teal shadows, warm highlights) and vignette.
shader_type canvas_item;

uniform sampler2D screen_texture : hint_screen_texture, filter_linear;
uniform float focus_y = 0.56;
uniform float band = 0.12;
uniform float blur_px = 7.0;
uniform float vignette = 0.5;
uniform vec3 shadow_tint = vec3(0.86, 0.96, 1.06);
uniform vec3 highlight_tint = vec3(1.06, 1.0, 0.9);
uniform float grade = 1.0;

void fragment() {
	vec2 uv = SCREEN_UV;
	float d = smoothstep(band, band + 0.32, abs(uv.y - focus_y));
	vec3 c = texture(screen_texture, uv).rgb;
	if (d > 0.01) {
		vec3 acc = c * 0.1;
		float wsum = 0.1;
		// Golden-angle disc taps keep the blur round without texture arrays.
		for (int i = 0; i < 22; i++) {
			float a = float(i) * 2.39996;
			float r = sqrt((float(i) + 0.5) / 22.0) * blur_px * d;
			acc += texture(screen_texture, uv + vec2(cos(a), sin(a)) * r * SCREEN_PIXEL_SIZE).rgb;
			wsum += 1.0;
		}
		c = acc / wsum;
	}
	float lum = dot(c, vec3(0.299, 0.587, 0.114));
	vec3 toned = c * mix(shadow_tint, highlight_tint, smoothstep(0.15, 0.75, lum));
	c = mix(c, toned, grade);
	vec2 q = uv - 0.5;
	q.x *= 1.3;
	float v = 1.0 - smoothstep(0.35, 0.95, length(q)) * vignette;
	COLOR = vec4(c * v, 1.0);
}
