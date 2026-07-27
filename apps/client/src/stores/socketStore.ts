// ============================================
// Socket Store — Connection state & singleton
// ============================================

import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@npta/shared';

type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface SocketState {
  socket: GameSocket | null;
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;

  connect: (token: string) => void;
  disconnect: () => void;
  setConnected: (connected: boolean) => void;
  setError: (error: string | null) => void;
}

const WS_URL = import.meta.env.VITE_WS_URL ?? '';

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  isConnecting: false,
  connectionError: null,

  connect: (token: string) => {
    const existing = get().socket;
    if (existing?.connected) return;

    set({ isConnecting: true, connectionError: null });

    const socket: GameSocket = io(WS_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    socket.on('connect', () => {
      set({ isConnected: true, isConnecting: false, connectionError: null });
    });

    socket.on('disconnect', () => {
      set({ isConnected: false });
    });

    socket.on('connect_error', (error) => {
      set({
        isConnected: false,
        isConnecting: false,
        connectionError: error.message,
      });
    });

    set({ socket });
  },

  disconnect: () => {
    const socket = get().socket;
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
    }
    set({ socket: null, isConnected: false, isConnecting: false });
  },

  setConnected: (connected) => set({ isConnected: connected }),
  setError: (error) => set({ connectionError: error }),
}));
