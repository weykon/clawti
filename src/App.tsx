/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
'use client';

import { useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { useAuthStore } from './store/useAuthStore';
import { useUIStore } from './store/useUIStore';
import { useCreatureStore } from './store/useCreatureStore';
import { api } from './api/client';
import { creatureToCharacter } from './lib/creatureMapper';

import { LoginScreen } from './components/auth/LoginScreen';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { DiscoverView } from './components/views/DiscoverView';
import { ChatView } from './components/views/ChatView';
import { CreateView } from './components/views/CreateView';
import { ProfileView } from './components/views/ProfileView';
import { CharacterProfileModal } from './components/modals/CharacterProfileModal';
import { FilterModal } from './components/modals/FilterModal';
import { FriendsListModal } from './components/modals/FriendsListModal';
import { RechargeModal } from './components/modals/RechargeModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  const { isLoggedIn } = useAuthStore();
  const { activeView, setEnergy } = useUIStore();
  const { setCharacters, setFriends } = useCreatureStore();
  const { setProfileData } = useAuthStore();

  // Initialize: load creatures (public) + validate token
  useEffect(() => {
    if (api.getToken()) {
      // Logged in: validate token, then load all user data (includes discover)
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
      // Not logged in: just load public discover
      loadPublicDiscover();
    }
  }, []);

  const loadPublicDiscover = () => {
    api.creatures.discover({ limit: 50 }).then(res => {
      const discovered = Array.isArray(res) ? res : (res?.creatures || []);
      if (discovered.length > 0) setCharacters(discovered.map(creatureToCharacter));
    }).catch(err => console.warn('Failed to load discover:', err));
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
      const discovered = Array.isArray(discoverRes) ? discoverRes : (discoverRes?.creatures || []);
      if (discovered.length > 0) {
        setCharacters(discovered.map(creatureToCharacter));
      }
      const friendsData = 'friends' in friendsRes ? friendsRes.friends : [];
      if (Array.isArray(friendsData)) {
        setFriends(friendsData.map((f) => {
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
          <AnimatePresence mode="wait">
            {activeView === 'discover' && <DiscoverView key="discover" />}
            {activeView === 'chat' && <ChatView key="chat" />}
            {activeView === 'create' && <CreateView key="create" />}
            {activeView === 'profile' && <ProfileView key="profile" />}
          </AnimatePresence>
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
