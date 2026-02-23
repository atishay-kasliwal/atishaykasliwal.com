import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { login, setStoredSession, type AuthSession } from "../lib/api";

type AuthPageProps = {
  onAuthenticated: (session: AuthSession) => void;
};

const OWNER_EMAIL = "katishay@gmail.com";

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
      <div className="auth-card">
        <h1>Login to dashboard</h1>
        <p>Only owner access is enabled for now.</p>
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
          {error ? <div className="error">{error}</div> : null}
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Please wait..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
