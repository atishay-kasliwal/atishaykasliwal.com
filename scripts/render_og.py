"""Render the link-preview image and the iPhone home-screen icon.

    .venv/bin/python scripts/render_og.py

public/og.jpg             1200×630 share card from scripts/og.html (headline + project cards)
public/projects/media/<slug>/og.jpg  one per case study (run `npm run build` first to write scripts/og/)
public/apple-touch-icon.png  180×180 from public/favicon.svg, on a solid background (iOS rounds it)
"""

from pathlib import Path
import sys

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
projects_only = "--projects-only" in sys.argv

with sync_playwright() as p:
    browser = p.chromium.launch(channel="chrome")

    page = browser.new_page(viewport={"width": 1200, "height": 630})
    if not projects_only:
        page.goto((ROOT / "scripts" / "og.html").as_uri())
        page.wait_for_function("document.fonts.ready.then(() => [...document.images].every(i => i.complete))")
        page.screenshot(path=str(PUBLIC / "og.jpg"), type="jpeg", quality=88)

    # One share card per case study, from the sources scripts/build-case-studies.mjs writes.
    for source in sorted((ROOT / "scripts" / "og").glob("*.html")):
        out = PUBLIC / "projects" / "media" / source.stem / "og.jpg"
        if projects_only and out.exists():
            continue
        out.parent.mkdir(parents=True, exist_ok=True)
        page.goto(source.as_uri())
        page.wait_for_function("document.fonts.ready.then(() => [...document.images].every(i => i.complete && i.naturalWidth))")
        page.screenshot(path=str(out), type="jpeg", quality=88)
        print(f"projects/media/{source.stem}/og.jpg: {out.stat().st_size / 1024:.0f} KB")

    if not projects_only:
        icon = browser.new_page(viewport={"width": 180, "height": 180})
        svg = (PUBLIC / "favicon.svg").read_text().replace("<svg ", '<svg width="180" height="180" ', 1)
        icon.set_content(f'<body style="margin:0;background:#111">{svg}</body>')
        icon.screenshot(path=str(PUBLIC / "apple-touch-icon.png"))

    browser.close()

if not projects_only:
    for name in ("og.jpg", "apple-touch-icon.png"):
        print(f"{name}: {(PUBLIC / name).stat().st_size / 1024:.0f} KB")
