"""
The Tukua AI mark: the Tukua bird in a chat bubble on a dark green tile, with a lime spark for "AI".

    python scripts/generate-tukua-ai-icon.py

Drawn at four times the size and scaled down, so edges are smooth. Writes, under assets/images/:

    icons/tukua-ai-icon-1024.png   the tile, for an app icon or a splash
    icons/tukua-ai-icon-2048.png   the same in HD
    icons/tukua-ai-icon-512.png    for the web and small places
    logo/splash-tukua-ai.png       1024, for the splash screen (app.json points here)
    logo/splash-tukua-ai-hd.png    2048

The bird comes from icons/app-icon-1024.png (the master); its white background is taken out from the
edges inward, so the pale lines inside the feathers stay.
"""
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
IMAGES = ROOT / 'assets' / 'images'
MASTER = IMAGES / 'icons' / 'app-icon-1024.png'

TILE = (22, 41, 28, 255)        # dark green, the tile
TILE_EDGE = (36, 56, 42, 255)   # the tile's lighter rim
CREAM = (248, 246, 241, 255)    # the bubble
LIME = (143, 191, 43, 255)      # the spark badge
SIZE = 1024
SS = 4                          # drawn this many times larger, then scaled down


def bird_without_background() -> Image.Image:
    """The master bird with its white surround made clear, cropped to the bird."""
    src = Image.open(MASTER).convert('RGB')
    w, h = src.size
    # Near-white pixels joined to the border are background; near-white inside the bird is kept.
    near_white = src.point(lambda v: 255 if v > 236 else 0).convert('L')
    r, g, b = src.split()
    near_white = ImageChops.darker(ImageChops.darker(r.point(lambda v: 255 if v > 236 else 0), g.point(lambda v: 255 if v > 236 else 0)), b.point(lambda v: 255 if v > 236 else 0))
    fill = near_white.copy()
    for seed in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1), (w // 2, 0), (w // 2, h - 1), (0, h // 2), (w - 1, h // 2)]:
        if fill.getpixel(seed) == 255:
            ImageDraw.floodfill(fill, seed, 128)
    background = fill.point(lambda v: 255 if v == 128 else 0)
    alpha = ImageChops.invert(background).filter(ImageFilter.GaussianBlur(1.2))
    # Pull the soft edge in a little so no white halo is left.
    alpha = alpha.point(lambda v: 0 if v < 110 else min(255, int((v - 110) * 1.76)))
    bird = src.convert('RGBA')
    bird.putalpha(alpha)
    return bird.crop(bird.getbbox())


def spark(draw: ImageDraw.ImageDraw, cx: float, cy: float, r: float, fill) -> None:
    """A four-point spark: long points up, down, left and right, pinched between them."""
    pinch = r * 0.26
    points = []
    for i, (dx, dy) in enumerate([(0, -1), (1, 0), (0, 1), (-1, 0)]):
        points.append((cx + dx * r, cy + dy * r))
        nx, ny = [(1, -1), (1, 1), (-1, 1), (-1, -1)][i]
        points.append((cx + nx * pinch, cy + ny * pinch))
    draw.polygon(points, fill=fill)


def tile(size: int) -> Image.Image:
    s = size * SS
    u = s / 1024  # one unit of the 1024 design grid
    img = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # The tile and its rim
    d.rounded_rectangle([40 * u, 40 * u, 984 * u, 984 * u], radius=236 * u, fill=TILE_EDGE)
    d.rounded_rectangle([70 * u, 70 * u, 954 * u, 954 * u], radius=208 * u, fill=TILE)

    # The chat bubble, with its tail at the lower left
    d.rounded_rectangle([196 * u, 190 * u, 828 * u, 734 * u], radius=150 * u, fill=CREAM)
    d.polygon([(270 * u, 690 * u), (236 * u, 838 * u), (420 * u, 726 * u)], fill=CREAM)

    # The bird, inside the bubble
    bird = bird_without_background()
    target_h = int(470 * u)
    target_w = int(bird.width * target_h / bird.height)
    bird = bird.resize((target_w, target_h), Image.LANCZOS)
    img.alpha_composite(bird, (int(512 * u - target_w / 2 - 6 * u), int(462 * u - target_h / 2)))

    # The spark badge, lower right, ringed in the tile's colour so it sits clear of the bubble
    d = ImageDraw.Draw(img)
    bx, by, br = 770 * u, 742 * u, 118 * u
    d.ellipse([bx - br - 26 * u, by - br - 26 * u, bx + br + 26 * u, by + br + 26 * u], fill=TILE)
    d.ellipse([bx - br, by - br, bx + br, by + br], fill=LIME)
    spark(d, bx - 10 * u, by + 6 * u, 70 * u, TILE)
    spark(d, bx + 52 * u, by - 52 * u, 26 * u, TILE)

    return img.resize((size, size), Image.LANCZOS)


def main() -> None:
    (IMAGES / 'icons').mkdir(parents=True, exist_ok=True)
    (IMAGES / 'logo').mkdir(parents=True, exist_ok=True)
    hd = tile(2048)
    hd.save(IMAGES / 'icons' / 'tukua-ai-icon-2048.png', optimize=True)
    hd.save(IMAGES / 'logo' / 'splash-tukua-ai-hd.png', optimize=True)
    full = hd.resize((1024, 1024), Image.LANCZOS)
    full.save(IMAGES / 'icons' / 'tukua-ai-icon-1024.png', optimize=True)
    full.save(IMAGES / 'logo' / 'splash-tukua-ai.png', optimize=True)
    hd.resize((512, 512), Image.LANCZOS).save(IMAGES / 'icons' / 'tukua-ai-icon-512.png', optimize=True)
    for name in ['icons/tukua-ai-icon-2048.png', 'icons/tukua-ai-icon-1024.png', 'icons/tukua-ai-icon-512.png', 'logo/splash-tukua-ai.png', 'logo/splash-tukua-ai-hd.png']:
        print('wrote', name)


if __name__ == '__main__':
    main()
