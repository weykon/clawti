'use client';

import { motion, AnimatePresence } from 'motion/react';
import { X, Languages, Shield, HelpCircle, LogOut, ChevronRight } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useChatStore } from '../../store/useChatStore';
import { useCreatureStore } from '../../store/useCreatureStore';
import { useTranslation } from '../../i18n/useTranslation';
import { useEscapeClose } from '../../hooks/useEscapeClose';

export function SettingsModal() {
  const t = useTranslation();
  const { language, setLanguage, isSettingsOpen, setSettingsOpen } = useUIStore();
  const { logout } = useAuthStore();
  const { resetAll: resetChat } = useChatStore();
  const { resetToInitial: resetCreatures } = useCreatureStore();
  useEscapeClose(isSettingsOpen, () => setSettingsOpen(false));

  if (!isSettingsOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] flex items-end justify-center bg-black/80 backdrop-blur-md p-4"
        onClick={() => setSettingsOpen(false)}
      >
        <motion.div
          initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="w-full max-w-md bg-white rounded-t-[40px] p-8 space-y-8"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-2xl text-display">{t.accountSettings}</h3>
            <button onClick={() => setSettingsOpen(false)} aria-label="Close settings" className="p-2 rounded-full hover:bg-ramos-gray">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="bg-ramos-gray rounded-[32px] overflow-hidden border border-ramos-border">
            <button
              onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
              className="w-full px-8 py-5 flex items-center justify-between hover:bg-ramos-border border-b border-ramos-border transition-colors"
            >
              <div className="flex items-center gap-3">
                <Languages className="w-5 h-5 text-ramos-muted" />
                <span className="text-sm font-medium">{t.language}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-ramos-muted">{language === 'en' ? 'English' : '中文'}</span>
                <ChevronRight className="w-5 h-5 text-ramos-muted" />
              </div>
            </button>
            <button className="w-full px-8 py-5 flex items-center justify-between hover:bg-ramos-border border-b border-ramos-border transition-colors">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-ramos-muted" />
                <span className="text-sm font-medium">{t.privacy}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-ramos-muted" />
            </button>
            <button className="w-full px-8 py-5 flex items-center justify-between hover:bg-ramos-border border-b border-ramos-border transition-colors">
              <div className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-ramos-muted" />
                <span className="text-sm font-medium">{t.help}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-ramos-muted" />
            </button>
            <button
              onClick={() => {
                if (confirm(t.logoutConfirm)) {
                  logout();
                  setSettingsOpen(false);
                  resetChat();
                  resetCreatures();
                }
              }}
              className="w-full px-8 py-5 flex items-center justify-between hover:bg-red-500/10 text-red-500 transition-colors"
            >
              <div className="flex items-center gap-3">
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium">{t.logout}</span>
              </div>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
