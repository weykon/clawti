'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/src/store/useAuthStore';
import { useUIStore } from '@/src/store/useUIStore';
import { useCreatureStore } from '@/src/store/useCreatureStore';
import { api } from '@/src/api/client';
import { creatureToCharacter } from '@/src/lib/creatureMapper';

import { LoginScreen } from '@/src/components/auth/LoginScreen';
import { Sidebar } from '@/src/components/layout/Sidebar';
import { MobileNav } from '@/src/components/layout/MobileNav';
import { CharacterProfileModal } from '@/src/components/modals/CharacterProfileModal';
import { FilterModal } from '@/src/components/modals/FilterModal';
import { FriendsListModal } from '@/src/components/modals/FriendsListModal';
import { RechargeModal } from '@/src/components/modals/RechargeModal';
import { SettingsModal } from '@/src/components/modals/SettingsModal';
import { ErrorBoundary } from '@/src/components/ErrorBoundary';

import type { View } from '@/src/types';

/** Map URL pathname to the store's activeView so Sidebar/MobileNav stay in sync */
const pathnameToView: Record<string, View> = {
  '/discover': 'discover',
  '/chat': 'chat',
  '/create': 'create',
  '/profile': 'profile',
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isLoggedIn } = useAuthStore();
  const { setActiveView, setEnergy } = useUIStore();
  const { setCharacters, setFriends } = useCreatureStore();
  const { setProfileData } = useAuthStore();

  // Sync URL → activeView
  useEffect(() => {
    const view = pathnameToView[pathname];
    if (view) setActiveView(view);
  }, [pathname, setActiveView]);

  // Detect browser language after hydration (avoids SSR mismatch)
  useEffect(() => {
    const lang = navigator.language.split('-')[0] === 'zh' ? 'zh' : 'en';
    useUIStore.setState({ language: lang as 'en' | 'zh' });
  }, []);

  // Initialize: validate token + load data
  useEffect(() => {
    if (api.getToken()) {
      api.auth.me()
        .then(() => {
          useAuthStore.setState({ isLoggedIn: true });
          loadUserData();
        })
        .catch(() => {
          api.setToken(null);
          useAuthStore.setState({ isLoggedIn: false });
          loadPublicDiscover();
        });
    } else {
      loadPublicDiscover();
    }
  }, []);

  const loadPublicDiscover = () => {
    api.creatures.discover({ limit: 50 }).then(res => {
      const discovered = res?.creatures || [];
      if (discovered.length > 0) setCharacters(discovered.map(creatureToCharacter));
    }).catch(() => {});
  };

  const loadUserData = async () => {
    try {
      const [profileRes, discoverRes, friendsRes] = await Promise.all([
        api.user.profile().catch(() => null),
        api.creatures.discover({ limit: 50 }).catch(() => ({ creatures: [] })),
        api.friends.list().catch(() => ({ friends: [] })),
      ]);
      if (profileRes) {
        setProfileData(profileRes);
        setEnergy(profileRes.energy ?? 1000);
      }
      const discovered = discoverRes?.creatures || [];
      if (discovered.length > 0) {
        setCharacters(discovered.map(creatureToCharacter));
      }
      const friendsData = 'friends' in friendsRes ? friendsRes.friends : [];
      if (Array.isArray(friendsData)) {
        setFriends(friendsData.map((f: any) => {
          const creature = typeof f === 'object' && f !== null && 'creature' in f ? f.creature : f;
          return creatureToCharacter(creature);
        }));
      }
    } catch (err) {
      console.error('Failed to load user data:', err);
    }
  };

  return (
    <div className="flex h-screen bg-ramos-white overflow-hidden relative">
      <div className="mesh-bg" />
      {!isLoggedIn && <LoginScreen />}
      <Sidebar />
      <main className="flex-1 overflow-hidden relative">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
      <MobileNav />
      <CharacterProfileModal />
      <FilterModal />
      <FriendsListModal />
      <RechargeModal />
      <SettingsModal />
    </div>
  );
}
