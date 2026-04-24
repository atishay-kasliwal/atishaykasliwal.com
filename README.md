# Personal Portfolio & Engineering Hub

A full-stack portfolio platform showcasing production-grade ML, data, and systems engineering — with live products, a developer API, and an in-browser AI assistant.

**Live:** [atishaykasliwal.com](https://atishaykasliwal.com)

---

## Demo

> Visit [atishaykasliwal.com](https://atishaykasliwal.com) — the site runs fully in production on Cloudflare's edge network.

Key live demos:

- **FOMC Market Predictor** — interactive dashboard replaying ML model predictions on Federal Reserve press conferences second-by-second
- **Legal RAG** — multilingual Q&A over the Indian Income Tax Act 1961 backed by vector search + Llama 3.3 70B
- **In-Browser AI Chat** — on-device LLM (WebLLM / MLC) running entirely in the browser, zero server round-trips
- **MRI Viewer** — multi-modality medical image viewer (ADC, DWI, FLAIR, T1, T2) with slice navigation

---

## Problem

Most engineering portfolios are static PDF resumes with GitHub links — they don't show *how* you think or *what* you can ship end-to-end. Hiring managers have ~30 seconds per candidate. There is no room for "trust me, the code is good."

The goal here was to build a portfolio that *is* the evidence: live products, a real developer API with auth and rate-limiting, and ML research that runs in the browser.

---

## Solution

Each "project" in this repo is a **working product**, not a demo script:

- The **FOMC API** is a public developer API with token-based auth, monthly quotas, cursor-paginated endpoints, OpenAPI docs, and JSON/CSV export
- The **Legal RAG** service supports 15 languages out of the box and streams tokens via SSE
- The **in-browser AI** uses WebAssembly-compiled models — no API key, no backend, no latency
- The **portfolio site** is React 19 with CI/CD, SEO, schema markup, and Cloudflare edge caching

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   atishaykasliwal.com                   │
│            React 19 SPA  ·  Cloudflare Pages            │
└────────────┬─────────────────────────────┬──────────────┘
             │                             │
   ┌──────────▼──────────┐     ┌───────────▼────────────┐
   │  Cloudflare Worker  │     │   FastAPI (Railway)    │
   │  legal-rag-api      │     │   Legal RAG fallback   │
   │  + FOMC Data API    │     │                        │
   └──────────┬──────────┘     └───────────┬────────────┘
              │                            │
   ┌──────────▼──────────┐     ┌───────────▼────────────┐
   │  Cloudflare D1      │     │  ChromaDB Cloud        │
   │  (FOMC sessions,    │     │  (income_tax_sections) │
   │   predictions, news,│     │  multilingual-e5-small │
   │   API keys, usage)  │     │  Groq · Llama 3.3 70B  │
   └─────────────────────┘     └────────────────────────┘

In-browser AI path (no server):
Browser → @mlc-ai/web-llm (WASM) → WebGPU inference
```

---

## Tech Stack

**Frontend**
- React 19, React Router v6, CRA
- `@mlc-ai/web-llm` for in-browser inference (WebGPU/WASM)
- Firebase (Firestore), EmailJS
- Cloudflare Pages, GitHub Actions CI

**FOMC API — Cloudflare Worker**
- TypeScript, Wrangler v4
- Cloudflare D1 (SQLite at the edge) for session data, ML predictions, API keys, usage tracking
- SHA-256 token hashing with pepper, cursor-based pagination, OpenAPI 3.0 + Swagger UI
- 5 model variants: GPT (1 / 5 / 10 min, news / no-news), Longformer (5 min)

**Legal RAG — Python FastAPI**
- `fastapi`, `uvicorn`, streamed SSE responses
- `sentence-transformers` — `intfloat/multilingual-e5-small` (15 languages)
- ChromaDB Cloud vector store, `langdetect` for query language routing
- Groq API — Llama 3.3 70B Versatile (max_tokens 600, temperature 0.2)
- Deployed on Railway with Procfile

---

## Features

**FOMC Market Prediction API**
- Second-by-second GPT and Longformer predictions against FOMC press conference transcripts
- Correlated with live news context (rank-scored headlines per interval)
- REST API: sessions, models, raw intervals, transcript slices, news, predictions, bulk export
- Token auth with self-serve key creation, monthly quota, rate-limit headers
- Full OpenAPI spec + Swagger UI at `/docs`

**Legal RAG — Indian Income Tax Act 1961**
- Semantic search over chunked Income Tax Act sections via vector embeddings
- Auto-detects query language; responds in the same language as the question
- Streaming token delivery via SSE — section citations included in response
- Deployed behind CORS, fully stateless — cold start under 2 seconds on Railway free tier

**In-Browser AI Chat**
- LLM inference runs in the visitor's browser using WebGPU (no server, no API key)
- Falls back gracefully when WebGPU is unavailable
- Loaded on demand; does not block initial page render

**Portfolio Site**
- Full SEO: Open Graph, Twitter cards, JSON-LD schema, canonical URLs, sitemap, robots.txt
- Custom analytics with `web-vitals`, Firebase Firestore logging
- `_redirects` + `_headers` for SPA routing on Cloudflare Pages
- Lighthouse-friendly — static assets on edge CDN

---

## Results / Metrics

| Product | Metric |
|---|---|
| FOMC API | 5 ML model variants across 1 / 5 / 10 min intervals covering multiple FOMC sessions |
| FOMC API | Up to 25,000 rows per bulk export; cursor-paginated at up to 1,000 rows/request |
| Legal RAG | 15 languages supported out of the box via multilingual-e5-small |
| Legal RAG | ~2 s cold start on Railway free tier; token streaming starts in < 1 s |
| In-browser AI | Zero network calls after model load — runs fully on-device via WebGPU |
| Portfolio | Deployed to Cloudflare's global edge network; CDN-cached static assets |

---

## Installation

```bash
git clone https://github.com/atishay-kasliwal/atishay-kasliwal.github.io
cd atishay-kasliwal.github.io
npm install
npm start
```

**Cloudflare Worker (FOMC API + Legal RAG routing):**

```bash
cd worker
npm install
cp wrangler.toml.example wrangler.toml   # add your D1 binding + secrets
npx wrangler secret put GROQ_API_KEY
npx wrangler secret put CHROMADB_API_KEY
npx wrangler secret put API_TOKEN_PEPPER
npm run dev
```

**Python FastAPI (Legal RAG fallback):**

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env                     # set CHROMADB_API_KEY, GROQ_API_KEY
uvicorn main:app --reload
```

---

## Future Work

- Replace ChromaDB Cloud with a self-hosted instance on Fly.io to cut cold-start latency
- Add feedback loop to FOMC predictions (user-rated accuracy → fine-tuning signal)
- Expand Legal RAG to cover GST and Companies Act sections
- Add WebRTC screen-sharing to the MRI viewer for async annotation
- Move from CRA to Vite for faster dev builds and smaller bundles

---

## Author

**Atishay Kasliwal**
[atishaykasliwal.com](https://atishaykasliwal.com) · [LinkedIn](https://linkedin.com/in/atishaykasliwal) · [katishay@gmail.com](mailto:katishay@gmail.com)
