'use client';

import { translations } from './translations';
import { useUIStore } from '../store/useUIStore';

export function useTranslation() {
  const language = useUIStore(s => s.language);
  return translations[language];
}
