import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const AdminPageActionsContext = createContext(null);

export function AdminPageActionsProvider({ children }) {
  const [actions, setActions] = useState({});

  /* Stable identity. As an inline arrow it was rebuilt whenever `actions`
     changed, which made it useless as an effect dependency downstream. */
  const clearActions = useCallback(() => setActions({}), []);

  const value = useMemo(
    () => ({
      actions,
      setActions,
      clearActions,
    }),
    [actions, clearActions]
  );

  return <AdminPageActionsContext.Provider value={value}>{children}</AdminPageActionsContext.Provider>;
}

export function useAdminPageActions() {
  const context = useContext(AdminPageActionsContext);
  if (!context) {
    throw new Error('useAdminPageActions must be used within AdminPageActionsProvider.');
  }
  return context;
}

/**
 * Publish a page's save/publish actions to the shell.
 *
 * Callers pass an object literal, so `nextActions` has a new identity on every
 * render. Depending on it directly — as this did until Aug 2026 — meant each
 * render stored a new object on the provider, which re-rendered every admin
 * page, which registered again: an unbounded loop that React eventually killed
 * with "Maximum update depth exceeded", taking the editor down with it.
 *
 * So registration is keyed on what actually changes — the set of handler names
 * and the plain values — while the stored handlers delegate through a ref, and
 * therefore always call the current render's closures without re-registering.
 */
export function useRegisterAdminPageActions(nextActions) {
  const { setActions, clearActions } = useAdminPageActions();

  const latestRef = useRef(nextActions);
  latestRef.current = nextActions;

  const entries = Object.entries(nextActions || {});
  const handlerKeys = entries
    .filter(([, value]) => typeof value === 'function')
    .map(([key]) => key)
    .sort()
    .join(',');
  const valueSignature = JSON.stringify(
    entries.filter(([, value]) => typeof value !== 'function').sort(([a], [b]) => a.localeCompare(b))
  );

  useEffect(() => {
    const stored = Object.fromEntries(
      Object.entries(latestRef.current || {}).map(([key, value]) => [
        key,
        typeof value === 'function' ? (...args) => latestRef.current?.[key]?.(...args) : value,
      ])
    );

    setActions(stored);
    return clearActions;
  }, [clearActions, handlerKeys, setActions, valueSignature]);
}
