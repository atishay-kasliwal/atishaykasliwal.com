"""Record a top-to-bottom scroll of each live project site for the preview window.

Frames are captured one scroll step at a time, so the scroll is perfectly smooth and the
text stays sharp, then encoded with ffmpeg into a looping MP4 in public/projects/video/.

Setup (once):
    python3 -m venv .venv && .venv/bin/pip install playwright
Run:
    .venv/bin/python scripts/record_previews.py            # all sites
    .venv/bin/python scripts/record_previews.py tracker    # one site

Uses the installed Google Chrome (channel="chrome") and ffmpeg from PATH.
"""

import math
import subprocess
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

# name: (url, colour scheme). The scheme matches each site's poster screenshot in public/projects/.
SITES = {
    "tracker": ("https://tracker.atriveo.com", "dark"),
    "bio": ("https://bio.atriveo.com", "light"),
    "jobs": ("https://application.atriveo.com", "dark"),
}

# Same shape as the preview window's canvas (270:166).
WIDTH, HEIGHT = 1440, 885
FPS = 30
PIXELS_PER_SECOND = 650
HOLD_TOP, HOLD_BOTTOM, RETURN = 0.2, 1.5, 1.4  # seconds; a short top hold so motion starts at once
OUT_DIR = Path(__file__).resolve().parent.parent / "public" / "projects" / "video"


def ease_in_out(t):
    return 0.5 - 0.5 * math.cos(math.pi * t)


def scroll_to(page, y):
    # Double rAF so sticky headers and scroll-linked styles settle before the frame.
    page.evaluate(
        "y => new Promise(r => { scrollTo(0, y); requestAnimationFrame(() => requestAnimationFrame(r)); })",
        y,
    )


def record(page, name, url):
    page.goto(url, wait_until="load", timeout=60_000)
    try:
        page.wait_for_load_state("networkidle", timeout=10_000)
    except Exception:
        pass
    page.add_style_tag(content="html, body { scroll-behavior: auto !important; }")

    # Warm-up pass: trigger lazy images and reveal-on-scroll animations, then return to the top.
    height = page.evaluate("document.documentElement.scrollHeight - innerHeight")
    for y in range(0, int(height) + HEIGHT, HEIGHT // 2):
        scroll_to(page, y)
        page.wait_for_timeout(250)
    scroll_to(page, 0)
    page.wait_for_timeout(1200)
    height = page.evaluate("document.documentElement.scrollHeight - innerHeight")

    down = max(4.0, min(18.0, height / PIXELS_PER_SECOND))
    positions = [0.0] * int(HOLD_TOP * FPS)
    positions += [height * ease_in_out(i / (down * FPS)) for i in range(int(down * FPS) + 1)]
    positions += [height] * int(HOLD_BOTTOM * FPS)
    positions += [height * (1 - ease_in_out(i / (RETURN * FPS))) for i in range(int(RETURN * FPS) + 1)]

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out = OUT_DIR / f"{name}.mp4"
    ffmpeg = subprocess.Popen(
        ["ffmpeg", "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", str(FPS), "-i", "-",
         "-vf", "scale=1280:-2", "-c:v", "libx264", "-preset", "slow", "-crf", "26",
         "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", str(out)],
        stdin=subprocess.PIPE,
    )
    last_y, frame = None, None
    for y in positions:
        y = round(y)
        if y != last_y:
            scroll_to(page, y)
            frame = page.screenshot(type="jpeg", quality=92)
            last_y = y
        ffmpeg.stdin.write(frame)
    ffmpeg.stdin.close()
    if ffmpeg.wait() != 0:
        raise SystemExit(f"ffmpeg failed for {name}")
    seconds = len(positions) / FPS
    print(f"{name}: {out.relative_to(OUT_DIR.parent.parent.parent)}  {seconds:.1f}s  "
          f"{out.stat().st_size / 1024:.0f} KB  (page {int(height) + HEIGHT}px tall)")


def main():
    names = sys.argv[1:] or list(SITES)
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome")
        for name in names:
            url, scheme = SITES[name]
            context = browser.new_context(
                viewport={"width": WIDTH, "height": HEIGHT}, device_scale_factor=1, color_scheme=scheme
            )
            record(context.new_page(), name, url)
            context.close()
        browser.close()


if __name__ == "__main__":
    main()
