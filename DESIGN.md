# Mobile design: Builder’s pocketbook

Brief: Atishay’s software engineering portfolio, for visitors and collaborators browsing on a phone. Retain the existing desktop experience and real project imagery. Vite and existing CSS/JavaScript remain the stack.

Concepts considered:
- Pocketbook: a personal cover, a live GitHub activity note, and swipeable project entries. Anchor: engineer, active Atriveo projects, and photography. Originality 4, fit 5, feasibility 5, portability 3.
- Systems diagram: a node map joining projects and experience. Anchor: distributed systems. Originality 4, fit 4, feasibility 3, portability 4.
- New York contact sheet: portrait and photography-led project grid. Anchor: New York and photography. Originality 4, fit 4, feasibility 4, portability 3.

Chosen: Pocketbook gives a phone visitor a person, current context, and browsable work without demanding a desktop-sized canvas.

Idea: A personal pocketbook of things Atishay is building.
Metaphor: A compact notebook, with a cover and entries rather than a desktop dashboard.
Signature: Native project swipes with full card captions, then compact indexed sections.
Emotion: Personal, assured, approachable.
Motion verb: Slide and settle.
Screenshot: Portrait/name above a compact typographic introduction, a live GitHub activity note, and the first dark project image on a charcoal page.

Palette: match the existing website exactly: black #000000, ink #efefec, secondary #b6b5ae, muted #848480, line #2a2a27, accent #8c5eff. Dark theme only, per the owner’s direction. The project art supplies its own colors. Geist for all body/display type, Geist Mono only for utility labels. 20px gutters, 4px rhythm, 14px card corners, 8px portrait corners. Quiet at rest by intention: visitors choose when to move projects. Native scrolling and snap carry the motion; reduced motion uses immediate settling. Do not add WebGL or a new animation library to this existing mobile correction.

Composition:
- Header: portrait + name/role at left, availability dot at right.
- Intro: left aligned personal copy; the existing GitHub activity disclosure below.
- Work: compact label and count; horizontally swiped project entries with their own captions.
- More: compact numbered accordion rows with substantial touch targets.
- Contact: dark full-width primary action and two secondary actions.

Genericness check: Remove the desktop’s centered moving card, system-fact grid, control cluster, and uppercase mono headings. Keep the owner’s real portrait, first-person voice, live GitHub activity, and original code-review evidence. No invented credentials or images.
