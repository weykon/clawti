'use client';

import { create } from 'zustand';
import type { View } from '../types';
import { useAuthStore } from './useAuthStore';

type Language = 'en' | 'zh';

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
  closeAllModals: () => void;
}

// Always 'en' on first render for SSR consistency — layout detects browser lang in useEffect
const getInitialLanguage = (): Language => 'en';

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

  setLanguage: (lang) => set({ language: lang }),
  toggleLanguage: () => set(s => ({ language: s.language === 'en' ? 'zh' : 'en' })),
  setActiveView: (view) => set({ activeView: view }),
  setEnergy: (energy) => {
    set({ energy });
    // Sync energy to profileData to prevent dual source of truth
    const pd = useAuthStore.getState().profileData;
    if (pd) useAuthStore.setState({ profileData: { ...pd, energy } });
  },
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
    set({ rechargeNotice: msg });
    setTimeout(() => set({ rechargeNotice: null }), 4000);
  },
  closeAllModals: () => set({
    isFilterOpen: false,
    isFriendsListOpen: false,
    isCharProfileOpen: false,
    isRechargeOpen: false,
    isSettingsOpen: false,
    isPaymentOpen: false,
  }),
}));
