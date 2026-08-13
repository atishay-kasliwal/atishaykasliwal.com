import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminWorkspace } from '../context/AdminWorkspaceProvider.jsx';
import { useAdminPageActions } from '../context/AdminPageActionsContext.jsx';
import { useAdminAuth } from '../auth/AdminAuthProvider.jsx';
import AdminIcon from './AdminIcon.jsx';

function matchItem(item, query) {
  if (!query) return true;
  const haystack = [item.title, item.subtitle, item.keywords].filter(Boolean).join(' ').toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export default function AdminCommandPalette({ open, onClose }) {
  const navigate = useNavigate();
  const auth = useAdminAuth();
  const { commandItems } = useAdminWorkspace();
  const { actions } = useAdminPageActions();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setActiveIndex(0);
    }
  }, [open]);

  const actionItems = useMemo(() => {
    const local = [...commandItems];

    if (actions?.onSave) {
      local.unshift({
        id: 'current-save',
        title: 'Save current item',
        subtitle: 'Save changes in the active editor.',
        type: 'action',
        action: 'saveCurrent',
        icon: 'check',
      });
    }

    if (actions?.onPublish) {
      local.unshift({
        id: 'current-publish',
        title: 'Publish current item',
        subtitle: 'Change the active document status to published.',
        type: 'action',
        action: 'publishCurrent',
        icon: 'sparkles',
      });
    }

    return local.filter((item) => matchItem(item, query)).slice(0, 14);
  }, [actions, commandItems, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return undefined;

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveIndex((current) =>
          actionItems.length === 0 ? 0 : (current + 1) % actionItems.length
        );
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveIndex((current) =>
          actionItems.length === 0 ? 0 : (current - 1 + actionItems.length) % actionItems.length
        );
        return;
      }

      if (event.key === 'Enter' && actionItems[activeIndex]) {
        event.preventDefault();
        handleSelect(actionItems[activeIndex]);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actionItems, activeIndex, onClose, open]);

  if (!open) return null;

  async function handleSelect(item) {
    if (item.action === 'saveCurrent' && actions?.onSave) {
      await actions.onSave();
      onClose();
      return;
    }

    if (item.action === 'publishCurrent' && actions?.onPublish) {
      await actions.onPublish();
      onClose();
      return;
    }

    if (item.action === 'signOut') {
      await auth.signOut();
      onClose();
      return;
    }

    if (item.href) {
      navigate(item.href);
      onClose();
    }
  }

  return (
    <div className="admin-commandPaletteLayer" role="presentation" onClick={onClose}>
      <div className="admin-commandPalette" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <label className="admin-commandPalette__search">
          <AdminIcon name="search" size={18} />
          <input
            autoFocus
            type="text"
            placeholder="Search content, navigate, or run an action…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <span>Esc</span>
        </label>

        <div className="admin-commandPalette__results">
          {actionItems.length === 0 ? (
            <div className="admin-commandPalette__empty">
              <p>No matching commands or content.</p>
            </div>
          ) : (
            actionItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`admin-commandPalette__item${actionItems[activeIndex]?.id === item.id ? ' is-active' : ''}`}
                onClick={() => handleSelect(item)}
                onMouseEnter={() =>
                  setActiveIndex(actionItems.findIndex((candidate) => candidate.id === item.id))
                }
              >
                <span className="admin-commandPalette__itemIcon">
                  <AdminIcon name={item.icon || 'dot'} size={16} />
                </span>
                <span className="admin-commandPalette__itemCopy">
                  <strong>{item.title}</strong>
                  {item.subtitle ? <small>{item.subtitle}</small> : null}
                </span>
                <AdminIcon name="chevronRight" size={16} />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
