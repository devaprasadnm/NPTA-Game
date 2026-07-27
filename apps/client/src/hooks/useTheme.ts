// ============================================
// useTheme Hook — Dark/Light mode
// ============================================

import { useEffect } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';

export function useTheme() {
  const theme = useSettingsStore((s) => s.theme);
  const toggleTheme = useSettingsStore((s) => s.toggleTheme);

  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [theme]);

  return { theme, toggleTheme, isDark: theme === 'dark' };
}
