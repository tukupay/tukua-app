"""Regenerate Tukua logo assets from the source PNG.

UI logos use a transparent square canvas; splash/icons use white backing.
"""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
IMAGES = ROOT / 'assets' / 'images'
DEFAULT_SRC = Path(
    r'C:/Users/user/.cursor/projects/d-GithubDesktop-tukua-mobile/assets/'
    'c__Users_user_AppData_Roaming_Cursor_User_workspaceStorage_79f40038c72947e78f00468b6c7885c1_images_'
    'Gemini_Generated_Image_2simi32simi32sim-0fc3f556-1d88-4469-9bb5-ad25a6289dd7.png'
)
WHITE = (255, 255, 255, 255)


def load_source(src_arg: Path | None) -> Image.Image:
    if src_arg and src_arg.exists():
        return Image.open(src_arg)
    if DEFAULT_SRC.exists():
        return Image.open(DEFAULT_SRC)
    trimmed = IMAGES / 'logo' / 'logo-trimmed.png'
    if trimmed.exists():
        return Image.open(trimmed)
    raise SystemExit('No source logo found. Pass a path to the master PNG.')


def trim_white(im: Image.Image, threshold: int = 248, padding: int = 3) -> Image.Image:
    im = im.convert('RGBA')
    w, h = im.size
    px = im.load()
    min_x, min_y, max_x, max_y = w, h, 0, 0
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a > 10 and not (r >= threshold and g >= threshold and b >= threshold):
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)
    return im.crop(
        (
            max(0, min_x - padding),
            max(0, min_y - padding),
            min(w, max_x + padding + 1),
            min(h, max_y + padding + 1),
        )
    )


def trim_to_square(im: Image.Image, bg=None) -> Image.Image:
    trimmed = trim_white(im)
    w, h = trimmed.size
    side = max(w, h)
    fill = bg if bg is not None else (0, 0, 0, 0)
    canvas = Image.new('RGBA', (side, side), fill)
    canvas.paste(trimmed, ((side - w) // 2, (side - h) // 2), trimmed)
    return canvas


def resize_square(im: Image.Image, size: int) -> Image.Image:
    return im.resize((size, size), Image.Resampling.LANCZOS)


def square_icon(im: Image.Image, size: int, fill: float, bg=WHITE) -> Image.Image:
    w, h = im.size
    target = int(size * fill)
    scale = target / max(w, h)
    nw, nh = max(1, round(w * scale)), max(1, round(h * scale))
    scaled = im.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new('RGBA', (size, size), bg)
    canvas.paste(scaled, ((size - nw) // 2, (size - nh) // 2), scaled)
    return canvas


def splash_asset(im: Image.Image, size: int, fill: float = 0.52, bg=WHITE) -> Image.Image:
    """Square splash — bird scaled smaller with padding so it never clips on device."""
    trimmed = trim_white(im)
    w, h = trimmed.size
    target = int(size * fill)
    scale = target / max(w, h)
    nw, nh = max(1, round(w * scale)), max(1, round(h * scale))
    scaled = trimmed.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new('RGBA', (size, size), bg)
    canvas.paste(scaled, ((size - nw) // 2, (size - nh) // 2), scaled)
    return canvas


def main() -> None:
    src_arg = Path(sys.argv[1]) if len(sys.argv) > 1 else None
    source = load_source(src_arg)

    ui_master = trim_to_square(source)
    splash_bird = splash_asset(source, 512, fill=0.52)

    logo_dir = IMAGES / 'logo'
    icons_dir = IMAGES / 'icons'
    logo_dir.mkdir(parents=True, exist_ok=True)
    icons_dir.mkdir(parents=True, exist_ok=True)

    ui_master.save(logo_dir / 'logo-trimmed.png', optimize=True)
    resize_square(ui_master, 128).save(logo_dir / 'navbar-bird.png', optimize=True)
    splash_bird.convert('RGB').save(logo_dir / 'splash-bird.png', optimize=True)

    for size, name, fill in [
        (1024, 'app-icon-1024.png', 0.88),
        (1024, 'adaptive-foreground-1024.png', 0.72),
        (512, 'app-icon-512.png', 0.88),
        (192, 'app-icon-192.png', 0.85),
        (96, 'notification-96.png', 0.82),
        (48, 'favicon-48.png', 0.82),
    ]:
        square_icon(ui_master, size, fill).convert('RGB').save(icons_dir / name, optimize=True)

    square_icon(ui_master, 1024, 0.88).convert('RGB').save(icons_dir / 'tukua-icon.png', optimize=True)
    splash_bird.convert('RGB').save(IMAGES / 'splash-logo.png', optimize=True)
    splash_bird.convert('RGB').save(IMAGES / 'splash.png', optimize=True)

    print('Generated square logo assets from', ui_master.size)


if __name__ == '__main__':
    main()
