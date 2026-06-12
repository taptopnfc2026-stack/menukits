import { useEffect, useState, useCallback } from 'react';
import {
  loadThemeId,
  loadCustomTheme,
  saveTheme,
  applyTheme,
  type ThemeId,
} from '@/lib/admin-theme';

/**
 * Hook for the active admin theme — re-applies CSS variables on change
 * and persists the selection to localStorage.
 */
export function useAdminTheme() {
  const [themeId, setThemeId] = useState<ThemeId>(() => loadThemeId());
  const [customAccent, setCustomAccent] = useState<string>(
    () => loadCustomTheme()?.accent || '#6366F1',
  );

  // Apply theme on mount + whenever it changes
  useEffect(() => {
    if (themeId === 'custom') {
      applyTheme('custom', customAccent);
    } else {
      applyTheme(themeId);
    }
  }, [themeId, customAccent]);

  const setTheme = useCallback((id: ThemeId, customHex?: string) => {
    if (id === 'custom' && customHex) {
      setCustomAccent(customHex);
    }
    setThemeId(id);
    saveTheme(id, id === 'custom' ? customHex : undefined);
  }, []);

  return { themeId, customAccent, setTheme };
}
