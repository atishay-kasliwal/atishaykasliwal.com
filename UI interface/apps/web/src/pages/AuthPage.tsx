import { useState, useMemo, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { login, setStoredSession, type AuthSession } from "../lib/api";

type AuthPageProps = {
  onAuthenticated: (session: AuthSession) => void;
};

const OWNER_EMAIL = "katishay@gmail.com";

function generateSparkline(seedKey: string, points = 32) {
  const today = new Date();
  const base = Number(
    `${today.getFullYear()}${today.getMonth() + 1}${today.getDate()}`,
  );
  let seed = base || 1;
  for (let i = 0; i < seedKey.length; i += 1) {
    seed = (seed * 31 + seedKey.charCodeAt(i)) & 0x7fffffff;
  }
  const values: number[] = [];
  let x = seed || 1;
  for (let i = 0; i < points; i += 1) {
    x = (1103515245 * x + 12345) & 0x7fffffff;
    const t = x / 0x7fffffff;
    const v = 0.25 + t * 0.6; // keep between 0.25 and 0.85
    values.push(v);
  }
  return values;
}

type HeroMetricCardProps = {
  title: string;
  subtitle: string;
  primary: string;
  change: string;
  seedKey: string;
};

function HeroMetricCard({ title, subtitle, primary, change, seedKey }: HeroMetricCardProps) {
  const points = useMemo(() => generateSparkline(seedKey), [seedKey]);
  const pathD = useMemo(() => {
    if (!points.length) return "";
    const lastIndex = points.length - 1 || 1;
    return points
      .map((v, idx) => {
        const x = (idx / lastIndex) * 100;
        const y = 35 - v * 22;
        return `${idx === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(" ");
  }, [points]);

  const lineId = `auth-hero-line-${seedKey}`;
  const fillId = `auth-hero-fill-${seedKey}`;

  return (
    <article className="auth-hero-card">
      <header className="auth-hero-card-header">
        <div>
          <p className="auth-hero-card-title">{title}</p>
          <p className="auth-hero-card-subtitle">{subtitle}</p>
        </div>
        <div className="auth-hero-card-metric">
          <span className="auth-hero-card-value">{primary}</span>
          <span className="auth-hero-card-change">{change}</span>
        </div>
      </header>
      <svg
        className="auth-hero-chart"
        viewBox="0 0 100 40"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={lineId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0ea5e9" />
          </linearGradient>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(56, 189, 248, 0.35)" />
            <stop offset="100%" stopColor="rgba(15, 23, 42, 0)" />
          </linearGradient>
        </defs>
        {pathD ? (
          <>
            <path
              d={`${pathD} V 40 H 0 Z`}
              fill={`url(#${fillId})`}
              stroke="none"
            />
            <path
              d={pathD}
              fill="none"
              stroke={`url(#${lineId})`}
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          </>
        ) : null}
      </svg>
      <footer className="auth-hero-card-footer">
        <span>Today&apos;s illustrative signal</span>
        <span className="auth-hero-card-footnote">Updates daily</span>
      </footer>
    </article>
  );
}

export default function AuthPage({ onAuthenticated }: AuthPageProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState(OWNER_EMAIL);
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }
    if (email.trim().toLowerCase() !== OWNER_EMAIL) {
      setError("Only owner access is enabled.");
      return;
    }

    try {
      setIsLoading(true);
      const response = await login(email, password);
      const session: AuthSession = {
        token: response.token,
        user: response.user,
      };
      setStoredSession(session);
      onAuthenticated(session);
      navigate("/", { replace: true });
    } catch (err) {
      setError((err as Error).message || "Authentication failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-hero" aria-label="Preview of upcoming dashboard">
        <p className="auth-hero-kicker">Currently building something meaningful.</p>
        <h1 className="auth-hero-title">Private workspace. Owner access only.</h1>
        <p className="auth-hero-subtitle">Launching soon. This space is under active development.</p>
        <p className="auth-hero-description">
          Live, market-style signals below are illustrative snapshots of the type of insights this
          dashboard will surface. The shapes update every day based on today&apos;s date.
        </p>
        <div className="auth-hero-grid">
          <HeroMetricCard
            title="S&amp;P 500"
            subtitle="Real-time snapshot"
            primary="4,538.73"
            change="+10.34%"
            seedKey="sp500"
          />
          <HeroMetricCard
            title="Nasdaq 100"
            subtitle="Market momentum"
            primary="15,436.12"
            change="+12.80%"
            seedKey="nasdaq100"
          />
        </div>
        <p className="auth-hero-footnote">Data is illustrative only. Product insights coming soon.</p>
      </section>

      <section className="auth-card-wrap" aria-label="Owner login">
        <div className="auth-card">
          <div className="auth-card-accent" aria-hidden />
          <div className="auth-card-icon" aria-hidden>
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 className="auth-card-title">Private access</h1>
          <p className="auth-card-subtitle">Owner access only. Sign in to continue.</p>
          <form className="auth-form" onSubmit={onSubmit}>
            <label className="auth-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className="auth-input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={OWNER_EMAIL}
            />
            <label className="auth-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className="auth-input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter owner password"
            />
            {error ? <div className="auth-error">{error}</div> : null}
            <button type="submit" className="auth-submit" disabled={isLoading}>
              {isLoading ? (
                <span className="auth-submit-loading">
                  <span className="auth-spinner" aria-hidden /> Signing in…
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
