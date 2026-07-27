// ============================================
// Settings Store — Theme & preferences
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  theme: 'light' | 'dark';
  soundEnabled: boolean;
  toggleTheme: () => void;
  setSoundEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      soundEnabled: true,

      toggleTheme: () => {
        const newTheme = get().theme === 'dark' ? 'light' : 'dark';
        set({ theme: newTheme });

        // Apply to document
        if (newTheme === 'dark') {
          document.body.classList.add('dark');
        } else {
          document.body.classList.remove('dark');
        }
      },

      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
    }),
    {
      name: 'npta-settings',
    },
  ),
);
