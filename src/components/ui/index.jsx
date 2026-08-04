import React from 'react';
import { Link } from 'react-router-dom';
import './ui.css';

/**
 * Shared UI primitives.
 *
 * Every page composes from these rather than hand-rolling markup, which is what
 * keeps spacing, heading levels, and focus behaviour consistent across a
 * dozen routes. They are deliberately unclever — props map to CSS custom
 * properties, no runtime style objects, no CSS-in-JS.
 */

/* ── Layout ────────────────────────────────────────────────────────────── */

export function Container({ children, width = 'content', className = '', ...rest }) {
  const mod = width === 'content' ? '' : ` container--${width}`;
  return (
    <div className={`container${mod} ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function Section({ children, className = '', id, label, ...rest }) {
  return (
    <section
      id={id}
      className={`section ${className}`}
      aria-label={label}
      {...rest}
    >
      {children}
    </section>
  );
}

/* ── Breadcrumbs ───────────────────────────────────────────────────────── */

/**
 * Visible breadcrumbs. The matching BreadcrumbList JSON-LD is emitted by the
 * SEO layer — Google wants both, and a rich result will not show without the
 * structured data even when the visual trail is present.
 */
export function Breadcrumbs({ items = [] }) {
  if (!items.length) return null;
  const trail = [{ name: 'Home', path: '/' }, ...items];

  return (
    <nav aria-label="Breadcrumb" className="crumbs">
      <ol className="crumbs-list">
        {trail.map((item, i) => {
          const last = i === trail.length - 1;
          return (
            <li key={item.path} className="crumbs-item">
              {last ? (
                <span aria-current="page">{item.name}</span>
              ) : (
                <>
                  <Link to={item.path}>{item.name}</Link>
                  <span className="crumbs-sep" aria-hidden="true">
                    /
                  </span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ── Page header ───────────────────────────────────────────────────────── */

export function PageHeader({ eyebrow, title, lede, breadcrumbs, children }) {
  return (
    <header className="page-header">
      <Container>
        {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
        {eyebrow && <p className="eyebrow page-header-eyebrow">{eyebrow}</p>}
        <h1 className="page-header-title">{title}</h1>
        {lede && <p className="lede page-header-lede">{lede}</p>}
        {children && <div className="page-header-actions">{children}</div>}
      </Container>
    </header>
  );
}

/* ── Buttons ───────────────────────────────────────────────────────────── */

/**
 * Renders as <a>, <Link>, or <button> depending on what it does. This is an
 * accessibility requirement, not a convenience: a div with onClick is not
 * reachable by keyboard and is not announced as actionable.
 */
export function Button({
  children,
  to,
  href,
  variant = 'primary',
  size = 'md',
  icon,
  external,
  className = '',
  ...rest
}) {
  const cls = `btn btn--${variant} btn--${size} ${className}`.trim();
  const content = (
    <>
      {children}
      {icon && (
        <span className="btn-icon" aria-hidden="true">
          {icon}
        </span>
      )}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={cls} {...rest}>
        {content}
      </Link>
    );
  }

  if (href) {
    const isExternal = external ?? /^https?:\/\//.test(href);
    return (
      <a
        href={href}
        className={cls}
        {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        {...rest}
      >
        {content}
      </a>
    );
  }

  return (
    <button type="button" className={cls} {...rest}>
      {content}
    </button>
  );
}

/* ── Tags ──────────────────────────────────────────────────────────────── */

export function Tag({ children, active, as = 'span', ...rest }) {
  const Comp = as;
  return (
    <Comp className={`tag${active ? ' tag--active' : ''}`} {...rest}>
      {children}
    </Comp>
  );
}

export function TagList({ items = [], className = '' }) {
  if (!items.length) return null;
  return (
    <ul className={`tag-list ${className}`}>
      {items.map((t) => (
        <li key={t}>
          <Tag>{t}</Tag>
        </li>
      ))}
    </ul>
  );
}

/* ── Metrics ───────────────────────────────────────────────────────────── */

/**
 * A single number with its label. `value` is rendered in tabular figures so a
 * row of these stays optically aligned regardless of digit widths.
 */
export function Metric({ value, label, className = '' }) {
  return (
    <div className={`metric ${className}`}>
      <span className="metric-value tabular">{value}</span>
      <span className="metric-label">{label}</span>
    </div>
  );
}

export function MetricRow({ items = [], className = '' }) {
  if (!items.length) return null;
  return (
    <dl className={`metric-row ${className}`}>
      {items.map((m) => (
        <div key={m.label} className="metric">
          <dd className="metric-value tabular">{m.value}</dd>
          <dt className="metric-label">{m.label}</dt>
        </div>
      ))}
    </dl>
  );
}

/* ── Empty state ───────────────────────────────────────────────────────── */

/**
 * Used by /speaking and /research before real entries exist. Says plainly that
 * there is nothing here yet rather than faking content — an honest empty state
 * costs nothing, and invented talks are checkable.
 */
export function EmptyState({ title, description, action }) {
  return (
    <div className="empty-state">
      <h2 className="empty-state-title">{title}</h2>
      <p className="empty-state-desc">{description}</p>
      {action}
    </div>
  );
}

/* ── Icons ─────────────────────────────────────────────────────────────── */

export const ArrowIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M3 8h10M9 4l4 4-4 4"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ExternalIcon = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M6 3h7v7M13 3L6.5 9.5M11 9.5V13H3V5h3.5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const DownloadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M8 2v8M4.5 7L8 10.5 11.5 7M2.5 13.5h11"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
