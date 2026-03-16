import React, { useState, useRef, useEffect, useCallback } from 'react';
import './LegalRAGChat.css';

// ── Config ─────────────────────────────────────────────────────────────────────

const API_BASE = process.env.REACT_APP_API_URL || 'https://legal-rag-api.katishay.workers.dev';

const MOCK_STATS = {
  dataset: 'Income Tax Act 1961',
  embeddings: 'multilingual-e5',
  sectionsIndexed: 300,
};

const EXAMPLE_QUERIES = [
  'What are penalties for concealing property?',
  'राजनीतिक दलों की आय के प्रावधान क्या हैं?',
  '¿Qué es la sección 292A?',
];

const PIPELINE_STEPS = [
  'Query',
  'Embedding',
  'Vector Search',
  'Context Assembly',
  'Generate Answer',
];


function SimilarityBar({ label, score, animate }) {
  const pct = Math.round(score * 100);
  return (
    <div className="rag-sim-row">
      <span className="rag-sim-label">{label}</span>
      <div className="rag-sim-track">
        <div
          className="rag-sim-fill"
          style={{ width: animate ? `${pct}%` : '0%' }}
        />
      </div>
      <span className="rag-sim-score">{score.toFixed(2)}</span>
    </div>
  );
}

function PipelineViz({ activeStep }) {
  return (
    <div className="rag-pipeline">
      {PIPELINE_STEPS.map((step, i) => (
        <React.Fragment key={step}>
          <div
            className={`rag-pipeline-step ${
              activeStep > i ? 'done' : activeStep === i ? 'active' : ''
            }`}
          >
            <div className="rag-pipeline-dot" />
            <span>{step}</span>
          </div>
          {i < PIPELINE_STEPS.length - 1 && (
            <div className={`rag-pipeline-line ${activeStep > i ? 'done' : ''}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function LegalRAGChat({ project }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hello! I can answer questions about the Income Tax Act 1961 in multiple languages. Try asking about penalties, recovery provisions, or political party income rules.',
      sections: [],
      meta: null,
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState({
    language: null,
    sections: [],
    animateBars: false,
  });
  const [pipelineStep, setPipelineStep] = useState(-1);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const runPipeline = useCallback(async (query) => {
    setIsLoading(true);
    setInsights({ language: null, sections: [], animateBars: false });
    setPipelineStep(1); // Query received

    try {
      const response = await fetch(`${API_BASE}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, n_results: 3 }),
      });

      if (!response.ok) throw new Error(`API error ${response.status}`);

      setPipelineStep(2); // Embedding

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let assistantAdded = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete line

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = JSON.parse(line.slice(6));

          if (payload.type === 'meta') {
            setPipelineStep(3); // Vector Search done
            const sections = payload.sections.map((s, i) => ({
              id: `s${i}`,
              title: s.title,
              subtitle: s.subtitle,
              similarity: s.similarity,
            }));
            setInsights({ language: payload.language, sections, animateBars: false });
            setPipelineStep(4); // Context Assembly

            // Add placeholder assistant message
            setMessages((prev) => [
              ...prev,
              { role: 'assistant', text: '', sections, meta: null },
            ]);
            assistantAdded = true;
            setPipelineStep(5); // Generate Answer
          }

          if (payload.type === 'token' && assistantAdded) {
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              updated[updated.length - 1] = { ...last, text: last.text + payload.text };
              return updated;
            });
          }

          if (payload.type === 'done') {
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              updated[updated.length - 1] = {
                ...last,
                meta: {
                  count: last.sections?.length ?? 0,
                  time: payload.response_time,
                  model: payload.model,
                },
              };
              return updated;
            });
            setInsights((prev) => ({ ...prev, animateBars: true }));
          }
        }
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `Sorry, I couldn't reach the server. Make sure the backend is running. (${err.message})`,
          sections: [],
          meta: null,
        },
      ]);
    }

    setIsLoading(false);
    setPipelineStep(-1);
  }, []);

  const handleSend = useCallback(
    async (query) => {
      const q = (query || inputValue).trim();
      if (!q || isLoading) return;
      setInputValue('');
      setMessages((prev) => [...prev, { role: 'user', text: q }]);
      await runPipeline(q);
    },
    [inputValue, isLoading, runPipeline]
  );

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="rag-page project-detail-page">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="rag-header">
        <div className="rag-header-text">
          <h1 className="rag-title">Multilingual Legal Intelligence</h1>
          <p className="rag-subtitle">Query Indian tax law in multiple languages</p>
        </div>
        <div className="rag-header-badges">
          <span className="rag-badge">Dataset: {MOCK_STATS.dataset}</span>
          <span className="rag-badge">Embeddings: {MOCK_STATS.embeddings}</span>
          <span className="rag-badge">
            Sections indexed: <strong>{MOCK_STATS.sectionsIndexed}</strong>
          </span>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────── */}
      <div className="rag-body">
        {/* ── Chat Panel ────────────────────────────────────── */}
        <div className="rag-chat-panel">
          <div className="rag-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`rag-msg rag-msg--${msg.role}`}>
                {msg.role === 'assistant' && (
                  <div className="rag-msg-avatar">AI</div>
                )}
                <div className="rag-msg-content">
                  <p className="rag-msg-text">
                    {msg.text}
                    {msg.role === 'assistant' &&
                      isLoading &&
                      idx === messages.length - 1 && (
                        <span className="rag-cursor" />
                      )}
                  </p>

                  {/* Evidence cards */}
                  {msg.sections && msg.sections.length > 0 && (
                    <div className="rag-evidence">
                      <p className="rag-evidence-label">Retrieved sections</p>
                      <div className="rag-evidence-cards">
                        {msg.sections.map((s) => (
                          <div key={s.id} className="rag-evidence-card">
                            <span className="rag-evidence-card-id">{s.title}</span>
                            <span className="rag-evidence-card-sub">{s.subtitle}</span>
                            <span className="rag-evidence-card-sim">
                              Similarity: {s.similarity.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                      {msg.meta && (
                        <p className="rag-msg-meta">
                          Retrieved {msg.meta.count} sections &bull; Response time{' '}
                          {msg.meta.time} &bull; Model: {msg.meta.model}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="rag-msg-avatar rag-msg-avatar--user">You</div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* ── Input area ────────────────────────────────── */}
          <div className="rag-input-area">
            <div className="rag-example-queries">
              {EXAMPLE_QUERIES.map((q) => (
                <button
                  key={q}
                  className="rag-example-btn"
                  onClick={() => handleSend(q)}
                  disabled={isLoading}
                >
                  {q}
                </button>
              ))}
            </div>
            <div className="rag-input-row">
              <textarea
                ref={inputRef}
                className="rag-input"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about Indian tax law..."
                rows={1}
                disabled={isLoading}
              />
              <button
                className="rag-send-btn"
                onClick={() => handleSend()}
                disabled={isLoading || !inputValue.trim()}
              >
                {isLoading ? (
                  <span className="rag-send-spinner" />
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── Model Insights Panel ──────────────────────── */}
        <aside className="rag-insights-panel">
          {/* Detected Language */}
          <div className="rag-insight-card">
            <h3 className="rag-insight-title">Detected Language</h3>
            {insights.language ? (
              <p className="rag-insight-language">{insights.language}</p>
            ) : (
              <p className="rag-insight-empty">Awaiting query…</p>
            )}
          </div>

          {/* Top Retrieved Sections */}
          <div className="rag-insight-card">
            <h3 className="rag-insight-title">Top Retrieved Sections</h3>
            {insights.sections.length > 0 ? (
              <ul className="rag-insight-sections">
                {insights.sections.map((s) => (
                  <li key={s.id} className="rag-insight-section-item">
                    <span className="rag-insight-section-id">{s.title}</span>
                    <span className="rag-insight-section-sub">{s.subtitle}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rag-insight-empty">No results yet</p>
            )}
          </div>

          {/* Similarity Scores */}
          <div className="rag-insight-card">
            <h3 className="rag-insight-title">Similarity Scores</h3>
            {insights.sections.length > 0 ? (
              <div className="rag-sim-bars">
                {insights.sections.map((s) => (
                  <SimilarityBar
                    key={s.id}
                    label={s.title.replace('Section ', '')}
                    score={s.similarity}
                    animate={insights.animateBars}
                  />
                ))}
              </div>
            ) : (
              <p className="rag-insight-empty">No scores yet</p>
            )}
          </div>

          {/* AI Pipeline */}
          <div className="rag-insight-card">
            <h3 className="rag-insight-title">AI Pipeline</h3>
            <PipelineViz activeStep={pipelineStep} />
          </div>
        </aside>
      </div>
    </div>
  );
}
