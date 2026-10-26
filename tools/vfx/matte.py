"""Turn baked B_###/W_### frame pairs (same moment over black and over white) into one RGBA sprite sheet.

Over black a pixel is C (premultiplied colour); over white it is C + (1 - a). So a = 1 - (W - B) and the straight
colour is B / a. Frames are cropped to the union of their visible pixels, scaled to fit `cell`, and packed `cols`
per row into a lossless-alpha WebP, with a JSON sidecar giving the frame grid and the effect origin inside a cell.

usage: python matte.py <frames dir> <out base path> <cell px> <cols> <ortho size> <centre y> <pitch deg> [<origin y>]
"""
import glob, json, math, os, sys
import numpy as np
from PIL import Image

src, out, cell, cols = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
size, centre, pitch = float(sys.argv[5]), float(sys.argv[6]), float(sys.argv[7])
origin_y = float(sys.argv[8]) if len(sys.argv) > 8 else 0.0
pairs = sorted(glob.glob(os.path.join(src, 'B_*.png')))
frames = []
for b_path in pairs:
    b = np.asarray(Image.open(b_path).convert('RGB'), dtype=np.float32) / 255
    w = np.asarray(Image.open(b_path.replace('B_', 'W_')).convert('RGB'), dtype=np.float32) / 255
    a = np.clip(1 - (w - b).mean(axis=2), 0, 1)
    rgb = np.clip(b / np.maximum(a, 1e-3)[..., None], 0, 1)
    rgba = np.dstack([rgb, a])
    rgba[a < 2 / 255] = 0
    frames.append(rgba)
px = frames[0].shape[0]
alive = np.max([f[..., 3] for f in frames], axis=0) > 3 / 255
ys, xs = np.nonzero(alive)
pad = 4
x0, x1 = max(0, xs.min() - pad), min(px, xs.max() + pad + 1)
y0, y1 = max(0, ys.min() - pad), min(px, ys.max() + pad + 1)
cw, ch = x1 - x0, y1 - y0
k = cell / max(cw, ch)
tw, th = max(1, round(cw * k)), max(1, round(ch * k))
rows = math.ceil(len(frames) / cols)
sheet = Image.new('RGBA', (tw * cols, th * rows), (0, 0, 0, 0))
for i, f in enumerate(frames):
    img = Image.fromarray((f[y0:y1, x0:x1] * 255).astype(np.uint8), 'RGBA').resize((tw, th), Image.LANCZOS)
    sheet.paste(img, ((i % cols) * tw, (i // cols) * th))
sheet.save(out + '.webp', 'WEBP', lossless=False, quality=88, alpha_quality=90, method=6)
# Where world point (0, origin_y, 0) lands: image centre is (0, centre, 0); 1 m = px/size pixels; up shrinks by cos(pitch).
m = px / size
ox = (px / 2 - x0) * k
oy = (px / 2 + (centre - origin_y) * math.cos(math.radians(pitch)) * m - y0) * k
meta = dict(frames=len(frames), cols=cols, rows=rows, w=tw, h=th, origin=[round(ox, 1), round(oy, 1)], metre=round(m * k, 2))
json.dump(meta, open(out + '.json', 'w'), indent=1)
print(json.dumps(meta), os.path.getsize(out + '.webp'))
