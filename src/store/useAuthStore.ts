'use client';

import { create } from 'zustand';
import { api } from '../api/client';
import type { UserProfile } from '../api/types';

interface AuthState {
  isLoggedIn: boolean;
  authMode: 'login' | 'register';
  authForm: { username: string; email: string; password: string };
  authError: string;
  authLoading: boolean;
  profileData: UserProfile | null;
}

interface AuthActions {
  setAuthMode: (mode: 'login' | 'register') => void;
  setAuthForm: (form: Partial<AuthState['authForm']>) => void;
  setAuthError: (error: string) => void;
  setProfileData: (data: UserProfile | null) => void;
  handleAuth: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  isLoggedIn: !!api.getToken(),
  authMode: 'login',
  authForm: { username: '', email: '', password: '' },
  authError: '',
  authLoading: false,
  profileData: null,

  setAuthMode: (mode) => set({ authMode: mode, authError: '' }),
  setAuthForm: (form) => set(s => ({ authForm: { ...s.authForm, ...form } })),
  setAuthError: (error) => set({ authError: error }),
  setProfileData: (data) => set({ profileData: data }),

  handleAuth: async () => {
    const { authMode, authForm } = get();
    set({ authLoading: true, authError: '' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authForm.email)) {
      set({ authError: 'Please enter a valid email address', authLoading: false });
      return;
    }
    try {
      let res;
      if (authMode === 'register') {
        res = await api.auth.register(
          authForm.username || authForm.email.split('@')[0],
          authForm.email,
          authForm.password
        );
      } else {
        res = await api.auth.login(authForm.email, authForm.password);
      }
      api.setToken(res.token);
      set({
        isLoggedIn: true,
        authForm: { username: '', email: '', password: '' },
        authLoading: false,
      });
    } catch (err) {
      set({
        authError: err instanceof Error ? err.message : 'Authentication failed',
        authLoading: false,
      });
    }
  },

  logout: () => {
    api.setToken(null);
    set({ isLoggedIn: false, profileData: null });
  },
}));
