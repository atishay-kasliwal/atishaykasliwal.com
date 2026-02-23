import { useState } from "react";

const SITE_LINKS = [
  { href: "/highlights", label: "HIGHLIGHTS" },
  { href: "/Atishay-Kasliwal-Resume.pdf?v=2", label: "RESUME" },
  { href: "https://www.linkedin.com/in/atishay-kasliwal/", label: "LINKEDIN" },
  { href: "/art", label: "ART" },
  { href: "/dashboard/", label: "DASHBOARD" },
];

type SiteShellProps = {
  children: React.ReactNode;
};

export default function SiteShell({ children }: SiteShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <div className="dashboard-bg-art" aria-hidden />
      <div className="dashboard-page-content">
        <header className="dashboard-site-header">
          <a href="/" className="logo" target="_top" rel="noopener noreferrer">
            <strong>Atishay Kasliwal</strong>
          </a>
          <button
            type="button"
            className="dashboard-mobile-menu-toggle"
            onClick={() => setMobileMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
          <nav
            className={`dashboard-site-nav ${mobileMenuOpen ? "open" : ""}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            {SITE_LINKS.map(({ href, label }) => (
              <a key={label} href={href} target="_top" rel="noopener noreferrer">
                {label}
              </a>
            ))}
          </nav>
        </header>
        {children}
      </div>
    </>
  );
}
