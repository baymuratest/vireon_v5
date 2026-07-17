import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

// mode: 'auto' | 'light' | 'dark'
const ThemeCtx = createContext({ mode: 'auto', resolved: 'dark', setMode: () => {} });

function getSystem() {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState(() => {
    try { return localStorage.getItem('vireon_theme') || 'auto'; } catch { return 'auto'; }
  });
  const [system, setSystem] = useState(getSystem);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const fn = () => setSystem(mq.matches ? 'light' : 'dark');
    mq.addEventListener?.('change', fn);
    return () => mq.removeEventListener?.('change', fn);
  }, []);

  const resolved = mode === 'auto' ? system : mode;

  useEffect(() => {
    document.documentElement.dataset.theme = resolved;
  }, [resolved]);

  const setMode = useCallback((m) => {
    setModeState(m);
    try { localStorage.setItem('vireon_theme', m); } catch {}
  }, []);

  return (
    <ThemeCtx.Provider value={{ mode, resolved, setMode }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export const useTheme = () => useContext(ThemeCtx);
