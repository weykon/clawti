'use client';

import { create } from 'zustand';
import type { View } from '../types';

type Language = 'en' | 'zh';

export type ToastType = 'error' | 'success' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface UIState {
  language: Language;
  activeView: View;
  energy: number;
  isNavExpanded: boolean;
  isFilterOpen: boolean;
  isFriendsListOpen: boolean;
  isCharProfileOpen: boolean;
  isRechargeOpen: boolean;
  isSettingsOpen: boolean;
  isPaymentOpen: boolean;
  selectedPlan: { label?: string; energy?: string; price: string } | null;
  rechargeTab: 'subscribe' | 'recharge' | 'earn';
  rechargeNotice: string | null;
  toasts: Toast[];
}

interface UIActions {
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  setActiveView: (view: View) => void;
  setEnergy: (energy: number) => void;
  setNavExpanded: (v: boolean) => void;
  setFilterOpen: (v: boolean) => void;
  setFriendsListOpen: (v: boolean) => void;
  setCharProfileOpen: (v: boolean) => void;
  setRechargeOpen: (v: boolean) => void;
  setSettingsOpen: (v: boolean) => void;
  setPaymentOpen: (v: boolean) => void;
  setSelectedPlan: (plan: UIState['selectedPlan']) => void;
  setRechargeTab: (tab: UIState['rechargeTab']) => void;
  showRechargeNotice: (msg: string) => void;
  showToast: (message: string, type?: ToastType) => void;
  dismissToast: (id: string) => void;
  closeAllModals: () => void;
}

// Always 'en' on first render for SSR consistency — layout detects browser lang in useEffect
const getInitialLanguage = (): Language => 'en';

let rechargeNoticeTimer: ReturnType<typeof setTimeout> | null = null;

export const useUIStore = create<UIState & UIActions>((set) => ({
  language: getInitialLanguage(),
  activeView: 'discover',
  energy: 1000,
  isNavExpanded: false,
  isFilterOpen: false,
  isFriendsListOpen: false,
  isCharProfileOpen: false,
  isRechargeOpen: false,
  isSettingsOpen: false,
  isPaymentOpen: false,
  selectedPlan: null,
  rechargeTab: 'recharge',
  rechargeNotice: null,
  toasts: [],

  setLanguage: (lang) => set({ language: lang }),
  toggleLanguage: () => set(s => ({ language: s.language === 'en' ? 'zh' : 'en' })),
  setActiveView: (view) => set({ activeView: view }),
  setEnergy: (energy) => set({ energy }),
  setNavExpanded: (v) => set({ isNavExpanded: v }),
  setFilterOpen: (v) => set({ isFilterOpen: v }),
  setFriendsListOpen: (v) => set({ isFriendsListOpen: v }),
  setCharProfileOpen: (v) => set({ isCharProfileOpen: v }),
  setRechargeOpen: (v) => set({ isRechargeOpen: v }),
  setSettingsOpen: (v) => set({ isSettingsOpen: v }),
  setPaymentOpen: (v) => set({ isPaymentOpen: v }),
  setSelectedPlan: (plan) => set({ selectedPlan: plan }),
  setRechargeTab: (tab) => set({ rechargeTab: tab }),
  showRechargeNotice: (msg) => {
    if (rechargeNoticeTimer) clearTimeout(rechargeNoticeTimer);
    set({ rechargeNotice: msg });
    rechargeNoticeTimer = setTimeout(() => set({ rechargeNotice: null }), 4000);
  },
  showToast: (message, type = 'error') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    set(s => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), 4000);
  },
  dismissToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
  closeAllModals: () => set({
    isFilterOpen: false,
    isFriendsListOpen: false,
    isCharProfileOpen: false,
    isRechargeOpen: false,
    isSettingsOpen: false,
    isPaymentOpen: false,
  }),
}));
