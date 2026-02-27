'use client';

import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type { Character } from '../types';
import { INITIAL_CHARACTERS } from '../data/mockCharacters';

interface FilterState {
  gender: string;
  race: string;
  occupation: string;
}

interface CreatureState {
  characters: Character[];
  friends: Character[];
  filters: FilterState;
  discoverIndex: number;
  currentImageIndex: number;
}

interface CreatureActions {
  setCharacters: (chars: Character[]) => void;
  setFriends: (friends: Character[]) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  setDiscoverIndex: (idx: number) => void;
  setCurrentImageIndex: (idx: number) => void;
  addFriend: (char: Character) => void;
  deleteCharacter: (id: string) => void;
  addCharacter: (char: Character) => void;
  resetToInitial: () => void;
  addSwipeIndex: () => void;
}

export const useCreatureStore = create<CreatureState & CreatureActions>((set) => ({
  characters: INITIAL_CHARACTERS,
  friends: [],
  filters: { gender: 'All', race: 'All', occupation: 'All' },
  discoverIndex: 0,
  currentImageIndex: 0,

  setCharacters: (chars) => set({ characters: chars }),
  setFriends: (friends) => set({ friends }),
  setFilters: (filters) => set(s => ({ filters: { ...s.filters, ...filters } })),
  setDiscoverIndex: (idx) => set({ discoverIndex: idx }),
  setCurrentImageIndex: (idx) => set({ currentImageIndex: idx }),
  addFriend: (char) => set(s => {
    if (s.friends.some(f => f.id === char.id)) return s;
    return { friends: [...s.friends, char] };
  }),
  deleteCharacter: (id) => set(s => ({ characters: s.characters.filter(c => c.id !== id) })),
  addCharacter: (char) => set(s => ({ characters: [char, ...s.characters] })),
  resetToInitial: () => set({ characters: INITIAL_CHARACTERS, friends: [] }),
  addSwipeIndex: () => set(s => ({ discoverIndex: s.discoverIndex + 1, currentImageIndex: 0 })),
}));

/** Selector: characters filtered by current filter state */
export function useFilteredCharacters() {
  return useCreatureStore(useShallow(s => {
    const { characters, filters } = s;
    return characters.filter(char => {
      if (filters.gender !== 'All' && char.gender !== filters.gender) return false;
      if (filters.race !== 'All' && char.race !== filters.race) return false;
      if (filters.occupation !== 'All' && char.occupation !== filters.occupation) return false;
      return true;
    });
  }));
}

/** Selector: only user-created characters */
export function useCustomCharacters() {
  return useCreatureStore(useShallow(s => s.characters.filter(c => c.isCustom)));
}
