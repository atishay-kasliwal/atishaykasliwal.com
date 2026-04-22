import React, { useMemo, useState } from 'react';

const API_BASE = process.env.REACT_APP_FOMC_API_BASE || 'https://legal-rag-api.katishay.workers.dev';

export default function FOMCApiAccessPanel() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [useCase, setUseCase] = useState('');
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const canSubmit = useMemo(
    () => !loading && name.trim().length >= 2 && email.trim().length > 4 && agree,
    [loading, name, email, agree]
  );
  const sampleCurl = `curl -H "Authorization: Bearer YOUR_KEY" \\
  ${API_BASE}/v1/models`;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch(`${API_BASE}/v1/auth/keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          company: company.trim() || undefined,
          use_case: useCase.trim() || undefined,
          agree_to_terms: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error?.message || `Request failed (${res.status})`);
      }
      setResult(data);
    } catch (err) {
      setError(err.message || 'Could not create key.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fomc-api-col">
      <div className="fomc-panel fomc-api-panel">
        <div className="fomc-panel-hd">
          <span className="fomc-panel-ttl">Developer API Access</span>
          <a
            className="fomc-api-docs-link"
            href={`${API_BASE}/docs`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open Swagger Docs
          </a>
        </div>
        <div className="fomc-api-body">
          <p className="fomc-api-copy">
            Get a key for raw transcript/speech/news metadata and model reasoning. Free tier includes
            100 calls per month. Need more? Contact <a href="mailto:katishay@gmail.com">katishay@gmail.com</a>.
          </p>

          <form className="fomc-api-form" onSubmit={onSubmit}>
            <input
              className="fomc-api-input"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="fomc-api-input"
              placeholder="Work email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
            />
            <input
              className="fomc-api-input"
              placeholder="Company (optional)"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
            <textarea
              className="fomc-api-input fomc-api-textarea"
              placeholder="Use case (optional)"
              value={useCase}
              onChange={(e) => setUseCase(e.target.value)}
            />

            <label className="fomc-api-agree">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
              />
              <span>I agree to API usage terms and data policies.</span>
            </label>

            <button className="fomc-api-btn" disabled={!canSubmit}>
              {loading ? 'Creating Key…' : 'Create API Key'}
            </button>
          </form>

          {error && <div className="fomc-api-error">{error}</div>}

          {result?.api_key && (
            <div className="fomc-api-result">
              <div className="fomc-api-result-ttl">Your API key (shown once)</div>
              <code className="fomc-api-key">{result.api_key}</code>
              <div className="fomc-api-result-sub">
                Monthly quota: {result?.quota?.calls_per_month ?? 100} calls
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="fomc-panel fomc-api-mini">
        <div className="fomc-api-mini-body">
          <pre className="fomc-api-mini-code">{sampleCurl}</pre>
        </div>
      </div>
    </div>
  );
}
