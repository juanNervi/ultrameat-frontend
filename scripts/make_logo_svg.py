from PIL import Image
from pathlib import Path
import base64
import io

src = Path(
    r"C:\Users\NerviJu\.cursor\projects\c-Users-NerviJu-OneDrive-BASF-Desktop-Repos-ORT-ultrameat-frontend\assets\c__Users_NerviJu_AppData_Roaming_Cursor_User_workspaceStorage_12af123127b86799a24549103c4653ba_images_image-d00c1145-dc3a-486c-8618-77cda33fbcd0.png"
)
out_png = Path(
    r"c:\Users\NerviJu\OneDrive - BASF\Desktop\Repos\ORT\ultrameat-frontend\public\logo-ultra-meat-transparent.png"
)
out_svg = Path(
    r"c:\Users\NerviJu\OneDrive - BASF\Desktop\Repos\ORT\ultrameat-frontend\public\logo-ultra-meat.svg"
)

im = Image.open(src).convert("RGBA")
pixels = im.load()
w, h = im.size

corners = [pixels[2, 2], pixels[w - 3, 2], pixels[2, h - 3], pixels[w - 3, h - 3]]
bg = tuple(sum(c[i] for c in corners) // 4 for i in range(3))


def bg_score(r, g, b):
    dr, dg, db = r - bg[0], g - bg[1], b - bg[2]
    dist = (dr * dr + dg * dg + db * db) ** 0.5
    mx, mn = max(r, g, b), min(r, g, b)
    sat = (mx - mn) / (mx + 1e-6)
    brightness = (r + g + b) / 3.0
    # higher = more background-like
    score = 0.0
    if dist < 18:
        score += 1.0
    elif dist < 35:
        score += 0.55
    if brightness > 210 and sat < 0.1:
        score += 0.8
    elif brightness > 195 and sat < 0.07:
        score += 0.5
    return score


xs, ys = [], []
for y in range(h):
    for x in range(w):
        r, g, b, a = pixels[x, y]
        if bg_score(r, g, b) < 0.9:
            xs.append(x)
            ys.append(y)

pad = 6
left, right = max(0, min(xs) - pad), min(w, max(xs) + pad + 1)
top, bottom = max(0, min(ys) - pad), min(h, max(ys) + pad + 1)
im = im.crop((left, top, right, bottom))
pixels = im.load()
w, h = im.size

for y in range(h):
    for x in range(w):
        r, g, b, a = pixels[x, y]
        s = bg_score(r, g, b)
        if s >= 1.0:
            pixels[x, y] = (0, 0, 0, 0)
        elif s >= 0.45:
            # soft edge: partial alpha
            alpha = int(max(0, 255 * (1 - s)))
            pixels[x, y] = (r, g, b, alpha)
        else:
            pixels[x, y] = (r, g, b, 255)

im.save(out_png, "PNG")
buf = io.BytesIO()
im.save(buf, format="PNG", optimize=True)
b64 = base64.b64encode(buf.getvalue()).decode("ascii")

svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" role="img" aria-label="Ultra Meat">
  <title>Ultra Meat</title>
  <image href="data:image/png;base64,{b64}" width="{w}" height="{h}" />
</svg>
"""
out_svg.write_text(svg, encoding="utf-8")
print("dims", w, h, "svg_kb", round(len(svg) / 1024, 1))
