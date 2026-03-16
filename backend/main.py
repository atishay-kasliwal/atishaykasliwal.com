import json
import time
import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from rag import run_pipeline, stream_answer

# ── App ────────────────────────────────────────────────────────────────────────

app = FastAPI(title="Legal RAG API", version="1.0.0")

ALLOWED_ORIGINS = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,https://atishaykasliwal.com",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# ── Schema ─────────────────────────────────────────────────────────────────────

class QueryRequest(BaseModel):
    query: str
    n_results: int = 3

# ── Routes ─────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/query")
def query(req: QueryRequest):
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    # Run non-streaming steps (embed + ChromaDB search)
    pipeline = run_pipeline(req.query, n_results=req.n_results)

    def event_stream():
        # ── Event 1: metadata (language + retrieved sections) ──────────────
        sections_payload = []
        for s in pipeline["sections"]:
            meta = s["metadata"]
            sections_payload.append({
                "title": meta.get("section_number") or s["document"][:20],
                "subtitle": meta.get("section_title") or s["document"][:60] + "…",
                "similarity": s["similarity"],
            })

        yield f"data: {json.dumps({'type': 'meta', 'language': pipeline['language'], 'sections': sections_payload})}\n\n"

        # ── Event 2…N: streamed answer tokens ──────────────────────────────
        for token in stream_answer(pipeline["messages"]):
            yield f"data: {json.dumps({'type': 'token', 'text': token})}\n\n"

        # ── Final event: done ───────────────────────────────────────────────
        elapsed = round(time.time() - pipeline["start_time"], 2)
        yield f"data: {json.dumps({'type': 'done', 'response_time': f'{elapsed}s', 'model': 'Llama 3.3 70B'})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # disables Nginx buffering on Railway
        },
    )
