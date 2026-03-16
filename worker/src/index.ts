export interface Env {
  CHROMADB_API_KEY: string;
  GROQ_API_KEY: string;
  COHERE_API_KEY: string;
}

// ── Config ─────────────────────────────────────────────────────────────────────

const CHROMA_TENANT   = '3a276dc9-8efb-4bca-a9c5-74a9970b2943';
const CHROMA_DATABASE = 'PortfolioRAG';
const CHROMA_COLLECTION = 'income_tax_sections';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

// ── Language detection (script + keyword heuristics) ──────────────────────────

function detectLanguage(text: string): string {
  if (/[\u0900-\u097F]/.test(text)) return 'Hindi';
  if (/[\u0600-\u06FF]/.test(text)) return 'Arabic';
  if (/[\u4E00-\u9FFF]/.test(text)) return 'Chinese';
  if (/[\u0B80-\u0BFF]/.test(text)) return 'Tamil';
  if (/[\u0C00-\u0C7F]/.test(text)) return 'Telugu';
  if (/[\u0A80-\u0AFF]/.test(text)) return 'Gujarati';
  if (/\b(qué|cómo|cuál|por qué|una|las|los|para|con|del)\b/i.test(text)) return 'Spanish';
  if (/\b(kya|hai|mein|ka|ki|ke|aur|nahi|hota|kaise)\b/i.test(text)) return 'Hindi';
  return 'English';
}

// ── Cohere — embed query text (multilingual-v2.0, 768 dims) ──────────────────

async function embedQuery(text: string, cohereApiKey: string): Promise<number[]> {
  const res = await fetch('https://api.cohere.com/v2/embed', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cohereApiKey}`,
    },
    body: JSON.stringify({
      texts: [text],
      model: 'embed-multilingual-v2.0',
      input_type: 'search_query',
      embedding_types: ['float'],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Cohere ${res.status}: ${body}`);
  }

  const data = await res.json<{ embeddings: { float: number[][] } }>();
  return data.embeddings.float[0];
}

// ── ChromaDB Cloud — resolve collection name → UUID (cached per Worker instance)

let cachedCollectionId: string | null = null;

async function getCollectionId(apiKey: string): Promise<string> {
  if (cachedCollectionId) return cachedCollectionId;

  const url =
    `https://api.trychroma.com/api/v2/tenants/${CHROMA_TENANT}` +
    `/databases/${CHROMA_DATABASE}/collections/${CHROMA_COLLECTION}`;

  const res = await fetch(url, {
    headers: { 'x-chroma-token': apiKey },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`ChromaDB collection lookup ${res.status}: ${body}`);
  }

  const data = await res.json<{ id: string }>();
  cachedCollectionId = data.id;
  return data.id;
}

// ── ChromaDB Cloud — query with pre-computed embeddings ───────────────────────

async function queryChroma(
  queryEmbedding: number[],
  nResults: number,
  apiKey: string,
): Promise<{ documents: string[][]; metadatas: Record<string, string>[][]; distances: number[][] }> {
  const collectionId = await getCollectionId(apiKey);

  const url =
    `https://api.trychroma.com/api/v2/tenants/${CHROMA_TENANT}` +
    `/databases/${CHROMA_DATABASE}/collections/${collectionId}/query`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-chroma-token': apiKey,
    },
    body: JSON.stringify({
      query_embeddings: [queryEmbedding],
      n_results: nResults,
      include: ['documents', 'metadatas', 'distances'],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`ChromaDB ${res.status}: ${body}`);
  }

  return res.json();
}

// ── Groq streaming ─────────────────────────────────────────────────────────────

async function* streamGroq(
  messages: { role: string; content: string }[],
  apiKey: string,
): AsyncGenerator<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      stream: true,
      max_tokens: 600,
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Groq ${res.status}: ${body}`);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') return;
      try {
        const token = JSON.parse(data)?.choices?.[0]?.delta?.content;
        if (token) yield token;
      } catch { /* skip malformed chunks */ }
    }
  }
}

// ── Prompt builder ─────────────────────────────────────────────────────────────

function buildMessages(
  query: string,
  sections: { document: string; metadata: Record<string, string> }[],
  language: string,
) {
  const context = sections
    .map((s, i) => {
      const label = s.metadata?.section_number || s.metadata?.section_title || `Section ${i + 1}`;
      return `[${label}]\n${s.document}`;
    })
    .join('\n\n---\n\n');

  return [
    {
      role: 'system',
      content:
        `You are a multilingual legal assistant specializing in Indian tax law (Income Tax Act 1961). ` +
        `Answer accurately and concisely using only the provided context. ` +
        `The user is writing in ${language} — respond in the same language. ` +
        `Cite section numbers when relevant. If the context is insufficient, say so clearly.`,
    },
    {
      role: 'user',
      content: `Context:\n${context}\n\nQuestion: ${query}`,
    },
  ];
}

// ── SSE helper ─────────────────────────────────────────────────────────────────

function sse(payload: unknown): string {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

// ── Main handler ───────────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Health check
    if (url.pathname === '/health') {
      return Response.json({ status: 'ok' });
    }

    // Query endpoint
    if (url.pathname === '/query' && request.method === 'POST') {
      const { query, n_results = 3 } = await request.json<{ query: string; n_results?: number }>();

      if (!query?.trim()) {
        return Response.json({ error: 'Query cannot be empty.' }, { status: 400 });
      }

      const startTime = Date.now();
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const encoder = new TextEncoder();

      const write = (payload: unknown) =>
        writer.write(encoder.encode(sse(payload)));

      // Run pipeline in background (non-blocking) so we can start streaming immediately
      (async () => {
        try {
          const language = detectLanguage(query);

          // 1. Embed query with Cohere
          const embedding = await embedQuery(query, env.COHERE_API_KEY);

          // 2. ChromaDB vector search
          const chromaResult = await queryChroma(embedding, n_results, env.CHROMADB_API_KEY);

          const sections = chromaResult.documents[0].map((doc, i) => ({
            document: doc,
            metadata: chromaResult.metadatas[0][i] ?? {},
            similarity: parseFloat((1 / (1 + (chromaResult.distances[0][i] ?? 100) / 100)).toFixed(4)),
          }));

          // Send metadata event
          await write({
            type: 'meta',
            language,
            sections: sections.map((s) => ({
              title: s.metadata?.section_number || s.document.slice(0, 20),
              subtitle: s.metadata?.section_title || s.document.slice(0, 60) + '…',
              similarity: s.similarity,
            })),
          });

          // 2. Build prompt + stream Groq answer
          const messages = buildMessages(query, sections, language);

          for await (const token of streamGroq(messages, env.GROQ_API_KEY)) {
            await write({ type: 'token', text: token });
          }

          // Done event
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
          await write({ type: 'done', response_time: `${elapsed}s`, model: 'Llama 3.3 70B' });
        } catch (err) {
          await write({ type: 'error', message: (err as Error).message });
        } finally {
          await writer.close();
        }
      })();

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Debug endpoint — remove after diagnosis
    if (url.pathname === '/debug' && request.method === 'POST') {
      const { query } = await request.json<{ query: string }>();
      const embedding = await embedQuery(query, env.COHERE_API_KEY);
      const collectionId = await getCollectionId(env.CHROMADB_API_KEY);
      const raw = await fetch(
        `https://api.trychroma.com/api/v2/tenants/${CHROMA_TENANT}/databases/${CHROMA_DATABASE}/collections/${collectionId}/query`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-chroma-token': env.CHROMADB_API_KEY },
          body: JSON.stringify({
            query_embeddings: [embedding],
            n_results: 3,
            include: ['documents', 'metadatas', 'distances'],
          }),
        }
      );
      const data = await raw.json();
      return Response.json(data, { headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  },
};
