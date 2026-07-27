// ============================================
// Room Store — Room state & players
// ============================================

import { create } from 'zustand';
import type { RoomInfo, PlayerInfo, RoomSettings, RecentRoom } from '@npta/shared';
import { DEFAULT_ROOM_SETTINGS } from '@npta/shared';

interface RoomState {
  room: RoomInfo | null;
  players: PlayerInfo[];
  settings: RoomSettings;
  recentRooms: RecentRoom[];

  setRoom: (room: RoomInfo) => void;
  clearRoom: () => void;
  addPlayer: (player: PlayerInfo) => void;
  removePlayer: (playerId: string) => void;
  updatePlayer: (playerId: string, updates: Partial<PlayerInfo>) => void;
  setPlayers: (players: PlayerInfo[]) => void;
  setSettings: (settings: RoomSettings) => void;
  setHost: (newHostId: string) => void;
  addRecentRoom: (room: RecentRoom) => void;
}

export const useRoomStore = create<RoomState>((set, get) => ({
  room: null,
  players: [],
  settings: DEFAULT_ROOM_SETTINGS,
  recentRooms: JSON.parse(localStorage.getItem('npta-recent-rooms') ?? '[]') as RecentRoom[],

  setRoom: (room) =>
    set({
      room,
      players: room.players,
      settings: room.settings,
    }),

  clearRoom: () =>
    set({
      room: null,
      players: [],
      settings: DEFAULT_ROOM_SETTINGS,
    }),

  addPlayer: (player) =>
    set((state) => ({
      players: [...state.players.filter((p) => p.id !== player.id), player],
    })),

  removePlayer: (playerId) =>
    set((state) => ({
      players: state.players.filter((p) => p.id !== playerId),
    })),

  updatePlayer: (playerId, updates) =>
    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, ...updates } : p,
      ),
    })),

  setPlayers: (players) => set({ players }),

  setSettings: (settings) =>
    set((state) => ({
      settings,
      room: state.room ? { ...state.room, settings } : null,
    })),

  setHost: (newHostId) =>
    set((state) => ({
      room: state.room ? { ...state.room, hostId: newHostId } : null,
      players: state.players.map((p) => ({
        ...p,
        isHost: p.id === newHostId,
      })),
    })),

  addRecentRoom: (room) => {
    const recent = get().recentRooms.filter((r) => r.code !== room.code);
    const updated = [room, ...recent].slice(0, 5);
    localStorage.setItem('npta-recent-rooms', JSON.stringify(updated));
    set({ recentRooms: updated });
  },
}));
