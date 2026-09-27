# Portfolio design references

## Goal

Create a visually expressive developer portfolio that looks great on desktop and feels even better on mobile, with a single-screen layout and no page scrolling.

## Confirmed preferences

- **Dennis Snellenberg’s multilingual introduction:** I like the opening sequence that cycles through greetings in different languages. Use this as inspiration for the portfolio’s intro.
- **Elliott Mangham’s bottom project carousel:** I like the project carousel at the bottom of his portfolio. Use this as the reference for presenting selected work.
- **Elliott Mangham’s single-screen experience:** I like having the website in one view, with no page scrolling. Make this the main layout direction on desktop and mobile.
- Strong visual design, with particular attention to the mobile experience.

## Reference websites

| Reference | Direction to explore |
| --- | --- |
| [Elliott Mangham](https://elliott.mangham.dev/) | Confirmed preferences: the project carousel at the bottom and the single-screen experience with no page scrolling, as identified by the user. |
| [Dennis Snellenberg](https://dennissnellenberg.com/) | Multilingual greeting intro, oversized typography, personal identity, and polished transitions. The intro is a confirmed preference; the other elements are ideas to explore. |
| [Diego Toda de Oliveira](https://www.diegoliv.works/) | Expressive typography and playful cards. [Desktop and mobile previews](https://onepagelove.com/diegoliv). Scrolling layouts are no longer part of the proposed direction. |
| [Olivier Larose](https://www.olivierlarose.com/) | Playful lettering and visual project storytelling. |
| [Keita Yamada](https://p5aholic.me/) | Experimental graphics paired with restrained typography and simple navigation. |
| [Rauno Freiberg](https://rauno.me/) | Carefully crafted interactions, compact navigation, and focused content. |

Only the elements listed under confirmed preferences are selected directions; the other references remain ideas to explore. Their current touch behavior and performance have not been tested on a phone.

## Proposed intro direction

- Open with a brief sequence of greetings in multiple languages, inspired by Dennis’s introduction.
- Keep the greeting readable and visually prominent on both phone and desktop screens.
- Transition smoothly into the name, developer introduction, and selected work.
- Keep the sequence short so visitors can reach the portfolio quickly.
- Respect reduced-motion preferences with a static greeting or immediate access to the page.

The exact languages, order, typography, colors, timing, and repeat-visit behavior are still to be decided.

## Proposed main layout

- Transition from the multilingual intro into one composed screen containing the identity, short developer introduction, key links, and selected work.
- Place the project carousel along the bottom of that view, inspired by Elliott’s portfolio.
- Keep the main page within the visible screen on desktop and mobile, with no page scrolling.
- Explore swipe and tap controls for moving through projects within the carousel.

This replaces the earlier suggestion of a long vertical flow and scroll-driven storytelling. Carousel controls and how visitors open project details are still to be decided.

## Mobile design ideas

- Compose the introduction and bottom project carousel to fit comfortably within one phone screen.
- Scale typography and spacing for short screens while keeping content readable and controls reachable.
- Make navigation and project links comfortable to tap.
- Ensure key content and interactions work without hovering.
- Use motion selectively for the intro and carousel transitions.
- Verify the final design at phone and desktop sizes, including short viewports, mobile browser controls, readability, touch behavior, and loading performance. Ensure the single-screen layout does not clip essential content.

## First implementation

- Built the single-screen layout and bottom project carousel, using Elliott’s dark palette, compact information columns, prominent introduction, and horizontal project previews as visual references.
- Used six original demo projects, as requested. Their content lives in `src/projects.js` for replacement later.
- Replaced the demo projects with six real ones from GitHub: four live products shown as screenshots (the Cortex screenshot is cropped to its marketing panel, because its home page is a sign-in screen) and two code-only repos drawn in CSS. Each preview window shows the project's stack and links to the live site or its code. Carousel cards use a styled render of each page, made with the codex-imagegen skill, one style per project: tablet flat lay on a light desk (Tracker), taped poster (Insurance), screen-history ribbon (Cortex), isometric layers (Bio), blueprint of the six-step pipeline (Job Search), newspaper page (FedTalk). The preview window keeps the real screenshot or flat artwork; for Tracker, Bio and Job Search it plays a looping top-to-bottom scroll recording of the live site instead. Insurance, Cortex and FedTalk play short animated scenes built from their artwork and READMEs: events flowing Providers → Kafka → Elasticsearch → Gateway; captured screens becoming projects, commitments and ideas with "What am I forgetting?" typed out; and the market reacting to the 2:00 PM statement while Transcribe → Retrieve → Predict light up. Reduced-motion visitors keep the still artwork.
- Added the GitHub profile README as project seven, linked to `atishay-kasliwal/atishay-kasliwal`. Its carousel card uses the untouched original portrait as the composition itself: the studio-grey background extends into a restrained editorial identity panel, with no frame, tilt, drop shadow, or separate illustration beneath it. A quiet line graphic maps Build → Ship → Systems → Frame across the open lower area, connecting development and photography without competing with the portrait. Hovering the card opens a portrait-free eight-second systems loop.
- Expanded the carousel to eleven projects with four visually distinct public repositories. Their cards and eight-second hover loops use repository evidence rather than illustrative product claims. Atriveo Reel mirrors its real Media / Trim / Layout / Text editor and uses two freely licensed Pexels video stills for a clean source-media example; attribution and license details live beside the assets in `public/projects/media/atriveo-reel/SOURCES.md`. Kaggriculture combines the synced 489.2 public score, 22 episodes and v9 benchmark results with the earlier illustrated farm replay map; Bayesian Marketing Mix displays its exported actual-vs-predicted and budget-allocation charts; InsureRaft follows the README's real `POLICY_CREATED` → `CLAIM_FILED` → `CLAIM_APPROVED` → `PAYMENT_ISSUED` flow at log indexes 1–4.
- Replaced the oversized browser-window preview with a compact editorial panel. A warm paper rail now carries the project number, category, title, description, stack, year and actions, while the motion preview has its own uninterrupted stage. The panel sizes itself to the space above the carousel, switches to a short information strip on phones, and uses a compressed rail in short landscape viewports.
- Added looping navigation, mouse dragging, touch swipes, arrow controls, keyboard navigation, and project preview dialogs.
- For search: the page title names the role ("Software & AI Engineer, New York"), the masthead shows the full, uncropped headshot small beside the lines under the name (hidden on phones, which keep the slim top bar), "AI" appears in the role line and the third statement, and the name is the page's only main heading.
- Took two more details from Elliott's site. Scrolling on desktop swaps three statements (left, centre, right columns) word by word, each word rising out of its own mask, with a "Scroll" progress bar; the page scroll also drifts the carousel. Hovering a project card shows a violet pill that follows the pointer with "Name — Year —" scrolling inside. Years come from each repo's first commit (FedTalk: repo creation, since its history was squashed).
- Matched the reference’s continuous leftward carousel motion at approximately 18 pixels per second, with seamless wrapping and pause on hover. Added an explicit pause/resume control and wheel/trackpad navigation. Automatic movement also pauses for keyboard interaction, the intro, open dialogs, and hidden tabs, and is disabled for reduced motion.
- Kept the main page within the viewport on desktop and mobile. Short landscape screens use a compact side-by-side composition. Dialogs can scroll when needed.
- Checked eight viewport sizes from 320 × 568 through 1440 × 900, including tablet and phone landscape layouts. Verified carousel looping, touch input, keyboard controls, reduced motion, and no main-page scrolling in Chrome emulation.
- Added Dennis’s multilingual greeting intro: eight greetings, a dark full-screen overlay, and a curved upward reveal. The sequence lasts about three seconds, replays on refresh, supports Skip and Escape, and is bypassed for reduced motion. Edit languages and timing in `src/intro.js`.

## Header and typography

- Replaced the five slogan columns with four columns of facts: name and role, what I'm doing now, stack, and contact. Removed the logo from the header and removed the "About this portfolio" dialog, since the header now carries that information.
- Each column is two lines, with extra detail in brackets ("Full-stack engineer (5+ years in production)"). "Open to roles" sits next to the Contact label. Columns size to their text and spread evenly, so Contact ends at the right edge; below 960px they form a 2×2 grid.
- Switched the site to Geist and Geist Mono. Facts are set in Geist at 13–14px; Geist Mono is used only for small labels, counters and the clock.
- The clock shows New York time.
- Phones get their own layout instead of a shrunken desktop header: a slim top bar (name, role, New York time and an "Open to roles" badge), Contact / Résumé / ⋯ buttons in place of the footer, and a bottom sheet laid out like the desktop masthead: an "Open to roles" status and the name beside the full, uncropped headshot (6px corners, like the project cards), a spec table (Now, Study, Stack, Based) with small labels and hairline rules, the email with a Copy control, and GitHub / LinkedIn / Résumé as one three-part bar with their logos. The sheet closes with a swipe down, a tap outside it, or Escape.
- Header details were drafted from the old site's `about-me.json` and still need confirming.

## Project pages (chosen design: H · Showcase)

Picked from nine mockups (kept in `~/Desktop/project-page-designs/`). Layout taken from a reference the user shared; all styling taken from this site.

- **Layout:** left column with a small project label, a first-person headline (white, then grey, like the homepage), a two-line summary, a Stack / Status spec list with hairlines, and three stats. Right: the homepage's own browser-window preview (traffic lights, stack, "Open site ↗"), showing the carousel card image and playing the scroll recording on hover; beside it, four screen thumbnails that behave like carousel cards (dimmed, white ring when selected).
- **Below:** four unboxed columns like the masthead (01 Problem, 02 Solution, 03 Engineering with a small node diagram, 04 Key decisions as a checklist), then an "Engineering insight" quote in the headline style, then the site footer.
- **Style rules:** #111 background, Geist and Geist Mono, #efefec / #b6b5ae / #848480 text, #2a2a27 hairlines, no filled tiles or icons. Purple only on label dots and ↗ arrows. The reference's purple highlights, glow and purple stats were dropped on purpose.
- **Spacing:** content centred between the top bar and footer, with equal space above and below; fits one screen at laptop sizes, scrolls below that.
- **Content:** drafted only from each repo's README; the insight quote needs the user's own wording before launch.
- Reached from a "Case study" link in the preview window's title bar; each project gets its own prerendered page at `/projects/<name>` for search.
