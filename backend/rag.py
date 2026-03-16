import os
import time
from typing import Generator

import chromadb
from sentence_transformers import SentenceTransformer
from groq import Groq
from langdetect import detect, LangDetectException

# ── Config ─────────────────────────────────────────────────────────────────────

CHROMA_TENANT = "3a276dc9-8efb-4bca-a9c5-74a9970b2943"
CHROMA_DATABASE = "PortfolioRAG"
CHROMA_COLLECTION = "income_tax_sections"
EMBED_MODEL_NAME = "intfloat/multilingual-e5-small"
GROQ_MODEL = "llama-3.3-70b-versatile"

LANG_MAP = {
    "en": "English", "hi": "Hindi", "es": "Spanish",
    "fr": "French",  "de": "German", "zh-cn": "Chinese",
    "ar": "Arabic",  "pt": "Portuguese", "mr": "Marathi",
    "ta": "Tamil",   "te": "Telugu",  "bn": "Bengali",
    "gu": "Gujarati","kn": "Kannada", "ml": "Malayalam",
}

# ── Lazy singletons ────────────────────────────────────────────────────────────

_collection = None
_embed_model = None
_groq_client = None


def get_collection():
    global _collection
    if _collection is None:
        client = chromadb.CloudClient(
            tenant=CHROMA_TENANT,
            database=CHROMA_DATABASE,
            api_key=os.environ["CHROMADB_API_KEY"],
        )
        _collection = client.get_collection(CHROMA_COLLECTION)
    return _collection


def get_embed_model():
    global _embed_model
    if _embed_model is None:
        _embed_model = SentenceTransformer(EMBED_MODEL_NAME)
    return _embed_model


def get_groq_client():
    global _groq_client
    if _groq_client is None:
        _groq_client = Groq(api_key=os.environ["GROQ_API_KEY"])
    return _groq_client


# ── Core RAG steps ─────────────────────────────────────────────────────────────

def detect_language(text: str) -> str:
    try:
        code = detect(text)
        return LANG_MAP.get(code, code.title())
    except LangDetectException:
        return "English"


def embed_query(text: str) -> list[float]:
    # multilingual-e5 requires "query: " prefix for retrieval queries
    model = get_embed_model()
    vec = model.encode(f"query: {text}", normalize_embeddings=True)
    return vec.tolist()


def search(query_embedding: list[float], n_results: int = 3) -> list[dict]:
    results = get_collection().query(
        query_embeddings=[query_embedding],
        n_results=n_results,
        include=["documents", "metadatas", "distances"],
    )
    sections = []
    for doc, meta, dist in zip(
        results["documents"][0],
        results["metadatas"][0],
        results["distances"][0],
    ):
        # ChromaDB returns cosine distance (0–2); convert to similarity (0–1)
        similarity = round(max(0.0, 1.0 - dist / 2), 4)
        sections.append({"document": doc, "metadata": meta, "similarity": similarity})
    return sections


def build_messages(query: str, sections: list[dict], language: str) -> list[dict]:
    context_parts = []
    for i, s in enumerate(sections):
        meta = s["metadata"]
        header = meta.get("section_number") or meta.get("section_title") or f"Section {i+1}"
        context_parts.append(f"[{header}]\n{s['document']}")
    context = "\n\n---\n\n".join(context_parts)

    system = (
        f"You are a multilingual legal assistant specializing in Indian tax law (Income Tax Act 1961). "
        f"Answer accurately and concisely using only the provided context. "
        f"The user is writing in {language} — respond in the same language. "
        f"Cite section numbers when relevant. If the context is insufficient, say so."
    )
    user = f"Context:\n{context}\n\nQuestion: {query}"
    return [{"role": "system", "content": system}, {"role": "user", "content": user}]


def stream_answer(messages: list[dict]) -> Generator[str, None, None]:
    stream = get_groq_client().chat.completions.create(
        model=GROQ_MODEL,
        messages=messages,
        stream=True,
        max_tokens=600,
        temperature=0.2,
    )
    for chunk in stream:
        token = chunk.choices[0].delta.content
        if token:
            yield token


# ── High-level pipeline (used by main.py) ─────────────────────────────────────

def run_pipeline(query: str, n_results: int = 3):
    """
    Returns a dict with:
      language, sections, messages, start_time
    Ready to be consumed by the streaming endpoint.
    """
    language = detect_language(query)
    embedding = embed_query(query)
    sections = search(embedding, n_results=n_results)
    messages = build_messages(query, sections, language)
    return {
        "language": language,
        "sections": sections,
        "messages": messages,
        "start_time": time.time(),
    }
