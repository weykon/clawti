'use client';

import { motion } from 'motion/react';
import { Settings, Sparkles, Zap, ChevronRight, PlusCircle } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useCreatureStore, useCustomCharacters } from '../../store/useCreatureStore';
import { useChatStore } from '../../store/useChatStore';
import { useTranslation } from '../../i18n/useTranslation';

export function ProfileView() {
  const t = useTranslation();
  const language = useUIStore(s => s.language);
  const { energy, setActiveView, setSettingsOpen, setRechargeOpen, setRechargeTab } = useUIStore();
  const { profileData } = useAuthStore();
  const { friends } = useCreatureStore();
  const customCharacters = useCustomCharacters();
  const { startChat } = useChatStore();

  return (
    <motion.div
      key="profile"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className="space-y-12 pt-6 px-6 pb-32 overflow-y-auto h-full max-w-6xl mx-auto w-full relative"
    >
      <button onClick={() => setSettingsOpen(true)} className="absolute top-6 right-6 p-3 md:p-4 rounded-2xl bg-white border border-ramos-border hover:bg-ramos-gray transition-all shadow-sm z-10">
        <Settings className="w-5 h-5 md:w-6 md:h-6 text-ramos-muted" />
      </button>

      {/* User Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="relative">
            <div className="w-20 h-20 md:w-32 md:h-32 rounded-[28px] md:rounded-[48px] bg-ramos-gray border-2 border-ramos-accent p-1 rotate-2 shadow-xl">
              <img src="https://picsum.photos/seed/user/400/400" alt="User" className="w-full h-full rounded-[20px] md:rounded-[40px] object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-ramos-accent p-1.5 md:p-3 rounded-lg md:rounded-2xl border-2 border-white shadow-lg">
              <Sparkles className="w-2.5 h-2.5 md:w-4 md:h-4 text-white" />
            </div>
          </div>
          <div className="text-left">
            <h2 className="text-2xl md:text-5xl text-display mb-0.5 md:mb-1">{profileData?.username || t.soulExplorer}</h2>
            <p className="text-ramos-muted text-xs md:text-base font-medium">{profileData?.membershipTier ? `${profileData.membershipTier} member` : t.userLevelInfo}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 md:gap-6">
        <div className="bento-card p-4 md:p-8 text-center flex flex-col items-center justify-center">
          <span className="text-2xl md:text-5xl text-display text-ramos-accent">{profileData?.friendsCount ?? friends.length}</span>
          <p className="text-[8px] md:text-xs text-accent text-ramos-muted mt-1 md:mt-3 uppercase tracking-widest font-bold">{t.friends}</p>
        </div>
        <div className="bento-card p-4 md:p-8 text-center flex flex-col items-center justify-center">
          <span className="text-2xl md:text-5xl text-display text-ramos-accent">{profileData?.creationsCount ?? customCharacters.length}</span>
          <p className="text-[8px] md:text-xs text-accent text-ramos-muted mt-1 md:mt-3 uppercase tracking-widest font-bold">{t.creations}</p>
        </div>
        <div className="bento-card p-4 md:p-8 text-center flex flex-col items-center justify-center">
          <span className="text-2xl md:text-5xl text-display text-ramos-accent">—</span>
          <p className="text-[8px] md:text-xs text-accent text-ramos-muted mt-1 md:mt-3 uppercase tracking-widest font-bold">{t.likes}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Energy Status */}
        <div className="bento-card space-y-6 md:space-y-8 p-6 md:p-10">
          <div className="flex items-center justify-between">
            <h3 className="text-xl md:text-2xl text-display">{t.energyStatus}</h3>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 md:w-5 md:h-5 text-ramos-accent fill-current" />
              <span className="text-lg md:text-xl font-bold text-ramos-accent">{energy}</span>
            </div>
          </div>
          <div className="w-full h-2 md:h-3 bg-ramos-gray rounded-full overflow-hidden shadow-inner">
            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (energy / 1000) * 100)}%` }} className="h-full bg-ramos-accent shadow-[0_0_20px_rgba(255,92,0,0.5)]" />
          </div>
          <p className="text-[10px] md:text-xs text-accent text-ramos-muted leading-relaxed">{t.energyDescription}</p>
          <div className="grid grid-cols-3 gap-2 md:gap-3">
            <button onClick={() => { setRechargeTab('subscribe'); setRechargeOpen(true); }} className="bg-ramos-accent text-white py-3 md:py-4 rounded-xl md:rounded-2xl text-[8px] md:text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg hover:scale-105 active:scale-95">{t.subscribe}</button>
            <button onClick={() => { setRechargeTab('recharge'); setRechargeOpen(true); }} className="bg-ramos-gray hover:bg-ramos-border py-3 md:py-4 rounded-xl md:rounded-2xl text-[8px] md:text-[10px] font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95">{t.recharge}</button>
            <button onClick={() => { setRechargeTab('earn'); setRechargeOpen(true); }} className="bg-ramos-gray hover:bg-ramos-border py-3 md:py-4 rounded-xl md:rounded-2xl text-[8px] md:text-[10px] font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95">{t.earn}</button>
          </div>
        </div>

        {/* My Creations */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs text-accent text-ramos-muted uppercase tracking-widest font-bold">{t.myCreations}</h3>
            <button onClick={() => setActiveView('create')} className="text-[10px] text-ramos-accent font-bold uppercase tracking-widest hover:underline">{t.createNow}</button>
          </div>
          <div className="bg-white rounded-[40px] overflow-hidden border border-ramos-border shadow-sm">
            {customCharacters.length > 0 ? (
              customCharacters.map((char, idx) => (
                <button key={char.id} onClick={() => startChat(char)} className={`w-full px-5 md:px-8 py-4 md:py-6 flex items-center justify-between hover:bg-ramos-gray transition-colors group ${idx !== customCharacters.length - 1 ? 'border-b border-ramos-border' : ''}`}>
                  <div className="flex items-center gap-3 md:gap-5">
                    <div className="relative">
                      <img src={char.avatar} alt={char.name} className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl object-cover border border-ramos-border group-hover:scale-110 transition-transform" referrerPolicy="no-referrer" />
                      {char.isCustom && <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-ramos-accent rounded-full border-2 border-white" />}
                    </div>
                    <div className="text-left">
                      <span className="text-base md:text-lg font-bold block group-hover:text-ramos-accent transition-colors">{char.name}</span>
                      <span className="text-[8px] md:text-[10px] text-ramos-muted uppercase tracking-widest font-medium">{language === 'en' ? char.tagline_en || char.tagline : char.tagline}</span>
                    </div>
                  </div>
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-ramos-gray flex items-center justify-center text-ramos-muted group-hover:bg-ramos-accent group-hover:text-white transition-all">
                    <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                </button>
              ))
            ) : (
              <div className="px-8 py-20 text-center space-y-6">
                <div className="w-20 h-20 bg-ramos-gray rounded-[32px] flex items-center justify-center mx-auto opacity-50">
                  <PlusCircle className="w-10 h-10 text-ramos-muted" />
                </div>
                <p className="text-sm text-ramos-muted italic">{t.noCreations}</p>
                <button onClick={() => setActiveView('create')} className="text-xs text-ramos-accent font-bold uppercase tracking-widest border-2 border-ramos-accent/20 px-8 py-3 rounded-2xl hover:bg-ramos-accent hover:text-white transition-all shadow-sm">{t.createNow}</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
