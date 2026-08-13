import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AdminPageActionsContext = createContext(null);

export function AdminPageActionsProvider({ children }) {
  const [actions, setActions] = useState({});

  const value = useMemo(
    () => ({
      actions,
      setActions,
      clearActions: () => setActions({}),
    }),
    [actions]
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

export function useRegisterAdminPageActions(nextActions) {
  const { setActions, clearActions } = useAdminPageActions();

  useEffect(() => {
    setActions(nextActions || {});
    return clearActions;
  }, [clearActions, nextActions, setActions]);
}
