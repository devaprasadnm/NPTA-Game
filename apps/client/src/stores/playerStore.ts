// ============================================
// Player Store — Identity & session
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PlayerState {
  id: string | null;
  displayName: string;
  avatarUrl: string | null;
  sessionToken: string | null;
  isAuthenticated: boolean;

  setPlayer: (data: { id: string; displayName: string; avatarUrl: string | null; token: string }) => void;
  setDisplayName: (name: string) => void;
  clearSession: () => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set) => ({
      id: null,
      displayName: '',
      avatarUrl: null,
      sessionToken: null,
      isAuthenticated: false,

      setPlayer: (data) =>
        set({
          id: data.id,
          displayName: data.displayName,
          avatarUrl: data.avatarUrl,
          sessionToken: data.token,
          isAuthenticated: true,
        }),

      setDisplayName: (name) => set({ displayName: name }),

      clearSession: () =>
        set({
          id: null,
          displayName: '',
          avatarUrl: null,
          sessionToken: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'npta-player',
    },
  ),
);
