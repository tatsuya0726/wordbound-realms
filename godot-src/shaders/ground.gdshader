// Terrain: blends tileable meadow, dirt and cobble textures by a soft splat map with noisy edges.
// Splat channels: r cobble, g dirt, b unused, a baked ambient occlusion.
shader_type spatial;

uniform sampler2D splat : filter_linear;
uniform sampler2D tex_grass : source_color, filter_nearest_mipmap, repeat_enable;
uniform sampler2D tex_cobble : source_color, filter_nearest_mipmap, repeat_enable;
uniform sampler2D tex_dirt : source_color, filter_nearest_mipmap, repeat_enable;
uniform vec2 map_origin = vec2(0.0);
uniform vec2 map_size = vec2(1.0);
uniform float tile_scale = 0.5;

varying vec3 wpos;

float hash(vec2 p) {
	return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float vnoise(vec2 p) {
	vec2 i = floor(p);
	vec2 f = fract(p);
	f = f * f * (3.0 - 2.0 * f);
	return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

void vertex() {
	wpos = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
}

void fragment() {
	vec2 suv = (wpos.xz - map_origin) / map_size;
	vec4 s = texture(splat, suv);
	if (suv.x < 0.0 || suv.y < 0.0 || suv.x > 1.0 || suv.y > 1.0) {
		s = vec4(0.0, 0.0, 0.0, 1.0);
	}
	vec2 tuv = wpos.xz * tile_scale;
	float n = vnoise(wpos.xz * 1.6) * 0.6 + vnoise(wpos.xz * 5.0) * 0.4;
	float wc = smoothstep(0.4, 0.6, s.r + (n - 0.5) * 0.45);
	float wd = smoothstep(0.4, 0.6, s.g + (n - 0.5) * 0.45);
	vec3 col = texture(tex_grass, tuv).rgb;
	col = mix(col, texture(tex_dirt, tuv * 0.9).rgb, wd);
	col = mix(col, texture(tex_cobble, tuv).rgb, wc);
	col *= mix(0.86, 1.1, vnoise(wpos.xz * 0.18));
	ALBEDO = col * s.a;
	ROUGHNESS = 0.95;
}
