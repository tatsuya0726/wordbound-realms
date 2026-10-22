// HD-2D finishing pass: tilt-shift blur toward the top and bottom, warm grade and vignette.
shader_type canvas_item;

uniform sampler2D screen_texture : hint_screen_texture, filter_linear;
uniform float focus_y = 0.55;
uniform float band = 0.16;
uniform float blur_px = 4.0;
uniform float vignette = 0.42;
uniform vec3 lift = vec3(0.015, 0.01, 0.0);
uniform vec3 gain = vec3(1.03, 1.01, 0.97);

void fragment() {
	vec2 uv = SCREEN_UV;
	float d = smoothstep(band, band + 0.34, abs(uv.y - focus_y));
	vec3 c = texture(screen_texture, uv).rgb;
	if (d > 0.01) {
		vec3 acc = c * 0.16;
		// Golden-angle disc taps keep the blur round without texture arrays.
		for (int i = 0; i < 14; i++) {
			float a = float(i) * 2.39996;
			float r = sqrt((float(i) + 0.5) / 14.0) * blur_px * d;
			acc += texture(screen_texture, uv + vec2(cos(a), sin(a)) * r * SCREEN_PIXEL_SIZE).rgb * (0.84 / 14.0);
		}
		c = acc;
	}
	vec2 q = uv - 0.5;
	float v = 1.0 - dot(q, q) * vignette * 1.9;
	COLOR = vec4(c * gain * v + lift, 1.0);
}
