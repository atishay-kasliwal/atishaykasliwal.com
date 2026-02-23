import { NavLink, Outlet } from "react-router-dom";

type LayoutProps = {
  userEmail: string;
  onLogout: () => void;
};

export default function Layout({ userEmail, onLogout }: LayoutProps) {
  return (
    <div className="page">
      <header className="hero">
        <h1>Job Tracker</h1>
        <p>Applications, referrals & notes — atishaykasliwal.com</p>
        <div className="auth-user-row">
          <span className="auth-user-email">Signed in as {userEmail}</span>
          <button type="button" className="auth-logout-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>
      <nav className="app-nav">
        <NavLink to="/" end className={({ isActive }) => (isActive ? "app-nav-link active" : "app-nav-link")}>
          Dashboard
        </NavLink>
        <NavLink to="/jobs" className={({ isActive }) => (isActive ? "app-nav-link active" : "app-nav-link")}>
          Jobs
        </NavLink>
        <NavLink to="/referrals" className={({ isActive }) => (isActive ? "app-nav-link active" : "app-nav-link")}>
          Referrals
        </NavLink>
        <NavLink to="/notes" className={({ isActive }) => (isActive ? "app-nav-link active" : "app-nav-link")}>
          Notes
        </NavLink>
        <NavLink to="/pending" className={({ isActive }) => (isActive ? "app-nav-link active" : "app-nav-link")}>
          Pending
        </NavLink>
      </nav>
      <main className="page-main">
        <Outlet />
      </main>
    </div>
  );
}
