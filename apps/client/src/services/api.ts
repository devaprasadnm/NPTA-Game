// ============================================
// API Service — REST API client
// ============================================

import type { GuestLoginResponse, SessionValidationResponse, ApiResponse } from '@npta/shared';

const API_URL = import.meta.env.VITE_API_URL || 'https://npta-game.onrender.com';

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('npta-player')
    ? JSON.parse(localStorage.getItem('npta-player')!).state?.sessionToken
    : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) ?? {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return response.json() as Promise<ApiResponse<T>>;
}

export const api = {
  auth: {
    guestLogin: (displayName: string) =>
      request<GuestLoginResponse>('/api/auth/guest', {
        method: 'POST',
        body: JSON.stringify({ displayName }),
      }),

    validateSession: () =>
      request<SessionValidationResponse>('/api/auth/session'),
  },

  health: {
    check: () => request('/api/health'),
  },
};
