'use client';

import { Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuthStore } from '../../store/useAuthStore';
import { useTranslation } from '../../i18n/useTranslation';

export function LoginScreen() {
  const t = useTranslation();
  const { authMode, authForm, authError, authLoading, setAuthMode, setAuthForm, handleAuth } = useAuthStore();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-8 text-center"
    >
      <div className="w-24 h-24 bg-ramos-accent rounded-[32px] flex items-center justify-center text-white mb-8 shadow-2xl rotate-3 group cursor-pointer overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <Sparkles className="w-12 h-12 transition-transform duration-700 group-hover:scale-125 group-hover:rotate-12" />
      </div>
      <h1 className="text-4xl text-display mb-2">{t.appName}</h1>
      <p className="text-ramos-muted mb-12 max-w-xs">{t.loginDesc}</p>

      <div className="w-full max-w-sm space-y-4">
        {authError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-600 text-center">
            {authError}
          </div>
        )}
        {authMode === 'register' && (
          <input
            type="text"
            value={authForm.username}
            onChange={(e) => setAuthForm({ username: e.target.value })}
            placeholder={t.username}
            className="w-full bg-ramos-gray border border-ramos-border rounded-[24px] p-5 text-sm focus:outline-none focus:border-ramos-accent/50 transition-all font-medium"
          />
        )}
        <input
          type="email"
          value={authForm.email}
          onChange={(e) => setAuthForm({ email: e.target.value })}
          placeholder={t.email}
          className="w-full bg-ramos-gray border border-ramos-border rounded-[24px] p-5 text-sm focus:outline-none focus:border-ramos-accent/50 transition-all font-medium"
        />
        <input
          type="password"
          value={authForm.password}
          onChange={(e) => setAuthForm({ password: e.target.value })}
          placeholder={t.password}
          onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
          className="w-full bg-ramos-gray border border-ramos-border rounded-[24px] p-5 text-sm focus:outline-none focus:border-ramos-accent/50 transition-all font-medium"
        />
        <button
          onClick={handleAuth}
          disabled={authLoading || !authForm.email || !authForm.password}
          className="w-full py-5 bg-black text-white rounded-[24px] font-bold flex items-center justify-center gap-3 hover:bg-black/90 transition-all disabled:opacity-50"
        >
          {authLoading
            ? t.loading
            : authMode === 'login'
              ? t.logIn
              : t.register}
        </button>
        <button
          onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
          className="w-full py-5 bg-ramos-gray text-black rounded-[24px] font-bold flex items-center justify-center gap-3 hover:bg-ramos-border transition-all"
        >
          {authMode === 'login' ? t.createAccount : t.alreadyHaveAccount}
        </button>
      </div>

      <p className="mt-12 text-[10px] text-ramos-muted uppercase tracking-widest">
        {t.byContinuing}{' '}
        <span className="text-black font-bold">{t.terms}</span> &{' '}
        <span className="text-black font-bold">{t.privacyPolicy}</span>
      </p>
    </motion.div>
  );
}
