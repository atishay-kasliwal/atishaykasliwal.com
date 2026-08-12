---
title: "Atriveo: build capture before analytics"
description: "Atriveo started from a simple premise: if a job tracker depends on manual entry, it fails. This is how I designed passive capture, per-board heuristics, and the analytics layer on top."
date: "2026-08-11"
tags: ["Product", "Chrome Extension", "Systems Design", "Analytics"]
category: "Engineering"
featured: false
image: "/projects/atriveo-tile.jpg"
draft: false
---

The first thing I learned building Atriveo was that job-search analytics are not the hard part. Capture is.

Almost every tracker in this category starts from the same assumption: the user will log each application manually, keep the spreadsheet tidy, and update statuses as replies come in. That assumption collapses fast. The people who need a tracker most are applying under time pressure, juggling portals, and already context-switching across dozens of roles. The system falls apart exactly when the user needs it most.

Atriveo exists because I wanted the tracking step to disappear.

## The real problem was adherence

The surface problem looks like organization: people want a better way to see applications, interviews, rejections, and response rates. The real problem underneath it is adherence. If capture is manual, the data goes stale in a week. Once the data is stale, every chart on top of it becomes decorative.

That drove the entire product direction. I was less interested in making a prettier dashboard than in making sure the dashboard had a chance to stay true.

## Why the browser extension came first

The key move was pushing collection to the point where the action actually happens: the job board itself.

Atriveo's Chrome extension watches for submission events in the page, extracts the structured payload, and sends it to the backend without asking the user to do anything else. The point was not novelty for its own sake. It was to turn tracking into a byproduct of applying.

That decision made the rest of the system possible:

- analytics could assume fresh data instead of reminding users to update it
- the backend could deduplicate and normalize centrally instead of trusting local notes
- the product could compete on signal quality rather than on how disciplined the user felt that week

It was also the part that created the most product leverage. A dashboard can be copied. Reliable passive capture is much harder.

## Generic parsing was the wrong abstraction

One lesson from the early builds was that a "universal" parser sounds elegant and performs badly.

Job boards look similar at a glance and wildly different in the DOM. The long tail is especially messy: custom components, inconsistent field names, and submission flows that change without warning. A one-size-fits-all parser degraded exactly where users were counting on it.

I moved to explicit per-board heuristics for the highest-traffic sites instead. That raised maintenance cost, but the trade was worth it. Precision matters more than architectural neatness when a false positive means someone's pipeline history is wrong.

That same trade showed up elsewhere too. I kept as much logic as possible server-side because a fix in the API can ship immediately, while a fix in the extension waits on Chrome Web Store review and then waits again for users to update.

## The backend exists to make the analytics honest

Once passive capture worked, the rest of the product could focus on what the data meant.

The API validates incoming events, deduplicates repeated applications, and persists them into a normalized PostgreSQL schema. That structure mattered because the questions users actually ask are relational:

- which sources convert best
- which companies respond fastest
- which stages stall
- whether application volume is turning into interviews at all

Those queries become simple once companies, roles, sources, and stages are modeled cleanly. They become painful if everything is stored as free-form documents and fixed later in application code.

The result is a system that now serves 100+ active customers, handles 2K+ daily queries, and stays up at 99.9% uptime. Those numbers matter, but they are downstream of the more important decision: make the input automatic.

## What I would keep and what I would change

I would absolutely keep the principle that capture comes before analytics. It was the right product call and the right technical one.

I would also keep the discipline of responding closely to users early. The 5.0 rating on the Chrome Web Store did not come from feature count. It came from closing feedback loops quickly and treating small product friction as serious.

What I would change is the tooling around detector health. The most dangerous failures in Atriveo are silent ones: a board changes its DOM, capture rate drops, and the user assumes nothing is wrong. Health checks around board-specific detection should have existed earlier and should probably be even more aggressive now.

The main thing Atriveo taught me is simple: in products like this, the moat is not the chart. The moat is the boring, reliable system that makes the chart worth believing.
