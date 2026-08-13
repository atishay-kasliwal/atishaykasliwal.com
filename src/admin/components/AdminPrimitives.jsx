import React from 'react';
import { Link } from 'react-router-dom';
import { classNames } from '../lib/adminUtils.js';
import AdminIcon from './AdminIcon.jsx';

export function AdminButton({
  as = 'button',
  tone = 'default',
  size = 'md',
  icon = null,
  iconSide = 'left',
  className = '',
  children,
  ...props
}) {
  const sharedClassName = classNames(
    'admin-btn',
    `admin-btn--${tone}`,
    `admin-btn--${size}`,
    className
  );

  const content = (
    <>
      {icon && iconSide === 'left' ? <AdminIcon name={icon} size={16} /> : null}
      <span>{children}</span>
      {icon && iconSide === 'right' ? <AdminIcon name={icon} size={16} /> : null}
    </>
  );

  if (as === Link) {
    return (
      <Link className={sharedClassName} {...props}>
        {content}
      </Link>
    );
  }

  return (
    <button className={sharedClassName} {...props}>
      {content}
    </button>
  );
}

export function AdminBadge({ tone = 'neutral', children }) {
  return <span className={`admin-badge admin-badge--${tone}`}>{children}</span>;
}

export function AdminPanel({ className = '', children }) {
  return <section className={classNames('admin-panel', className)}>{children}</section>;
}

export function AdminSectionHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="admin-sectionHeader">
      <div className="admin-sectionHeader__copy">
        {eyebrow ? <p className="admin-sectionHeader__eyebrow">{eyebrow}</p> : null}
        <h2 className="admin-sectionHeader__title">{title}</h2>
        {description ? <p className="admin-sectionHeader__description">{description}</p> : null}
      </div>
      {actions ? <div className="admin-sectionHeader__actions">{actions}</div> : null}
    </div>
  );
}

export function AdminSearchField({ className = '', icon = 'search', ...props }) {
  return (
    <label className={classNames('admin-searchField', className)}>
      <AdminIcon name={icon} size={16} />
      <input {...props} />
    </label>
  );
}

export function AdminEmptyState({ icon = 'info', title, description, action = null }) {
  return (
    <div className="admin-emptyState">
      <span className="admin-emptyState__icon">
        <AdminIcon name={icon} size={18} />
      </span>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}

export function AdminField({
  label,
  hint,
  error,
  htmlFor,
  children,
  className = '',
}) {
  return (
    <label className={classNames('admin-field', className)} htmlFor={htmlFor}>
      <div className="admin-field__header">
        <span className="admin-field__label">{label}</span>
        {hint ? <span className="admin-field__hint">{hint}</span> : null}
      </div>
      {children}
      {error ? <span className="admin-field__error">{error}</span> : null}
    </label>
  );
}

export function AdminInput({ multiline = false, className = '', ...props }) {
  if (multiline) {
    return <textarea className={classNames('admin-input', 'admin-input--textarea', className)} {...props} />;
  }

  return <input className={classNames('admin-input', className)} {...props} />;
}

export function AdminSelect({ className = '', children, ...props }) {
  return (
    <div className={classNames('admin-selectWrap', className)}>
      <select className="admin-select" {...props}>
        {children}
      </select>
      <AdminIcon name="chevronDown" size={16} className="admin-selectWrap__icon" />
    </div>
  );
}

export function AdminTabs({ items, value, onChange, compact = false }) {
  return (
    <div className={classNames('admin-tabs', compact && 'admin-tabs--compact')} role="tablist">
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          role="tab"
          aria-selected={item.value === value}
          className={classNames('admin-tabs__item', item.value === value && 'is-active')}
          onClick={() => onChange(item.value)}
        >
          {item.label}
          {item.count != null ? <span>{item.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function AdminDialog({ open, title, description, children, footer, onClose }) {
  if (!open) return null;

  return (
    <div className="admin-dialogLayer" role="presentation" onClick={onClose}>
      <div
        className="admin-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="admin-dialog__header">
          <div>
            <h2 id="admin-dialog-title">{title}</h2>
            {description ? <p>{description}</p> : null}
          </div>
          <button type="button" className="admin-iconButton" onClick={onClose} aria-label="Close dialog">
            <AdminIcon name="chevronDown" size={16} />
          </button>
        </div>
        <div className="admin-dialog__body">{children}</div>
        {footer ? <div className="admin-dialog__footer">{footer}</div> : null}
      </div>
    </div>
  );
}

export function AdminToastRegion({ toasts, dismissToast }) {
  return (
    <div className="admin-toastRegion" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <article key={toast.id} className={`admin-toast admin-toast--${toast.tone}`}>
          <div className="admin-toast__copy">
            <strong>{toast.title}</strong>
            {toast.description ? <p>{toast.description}</p> : null}
          </div>
          <button type="button" className="admin-iconButton" onClick={() => dismissToast(toast.id)} aria-label="Dismiss notification">
            <AdminIcon name="dot" size={14} />
          </button>
        </article>
      ))}
    </div>
  );
}

export function AdminStatusBadge({ status }) {
  const tone =
    status === 'published'
      ? 'success'
      : status === 'draft'
        ? 'warning'
        : status === 'archived' || status === 'deleted'
          ? 'danger'
          : 'neutral';

  return <AdminBadge tone={tone}>{status || 'unknown'}</AdminBadge>;
}

export function AdminSkeleton({ className = '' }) {
  return <span className={classNames('admin-skeleton', className)} aria-hidden="true" />;
}
