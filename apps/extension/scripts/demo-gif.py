"""Builds docs/demo.gif from the frames written by e2e/demo.spec.ts (dev-only, needs Pillow)."""
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

frames_dir = Path(sys.argv[1])
out = Path(sys.argv[2])
font = None
for f in ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", "/usr/share/fonts/TTF/DejaVuSans-Bold.ttf"]:
    if Path(f).exists():
        font = ImageFont.truetype(f, 30)
font = font or ImageFont.load_default()

size = None
frames = []
for png in sorted(frames_dir.glob("*.png")):
    caption = png.stem.split("__", 1)[1]
    img = Image.open(png).convert("RGB")
    size = size or img.size
    if img.size != size:  # e.g. the popup: centered on the page background
        page = Image.new("RGB", size, "#f3f5f7")
        page.paste(img, ((size[0] - img.width) // 2, (size[1] - img.height) // 2))
        img = page
    bar = Image.new("RGB", (img.width, 64), "#2448c8")
    ImageDraw.Draw(bar).text((20, 14), caption, fill="white", font=font)
    canvas = Image.new("RGB", (img.width, img.height + 64), "white")
    canvas.paste(bar, (0, 0))
    canvas.paste(img, (0, 64))
    frames.append(canvas.resize((canvas.width * 2 // 3, canvas.height * 2 // 3)).quantize(colors=128, method=Image.Quantize.MEDIANCUT))

frames[0].save(out, save_all=True, append_images=frames[1:], duration=2200, loop=0, optimize=True)
print(out, out.stat().st_size // 1024, "KB")
