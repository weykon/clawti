'use client';

import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowLeft, ChevronRight, Sparkles, MessageSquare } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useUIStore } from '../../store/useUIStore';
import { useCreatureStore, useFilteredCharacters } from '../../store/useCreatureStore';
import { useChatStore } from '../../store/useChatStore';
import { useTranslation } from '../../i18n/useTranslation';
import { useEscapeClose } from '../../hooks/useEscapeClose';

export function CharacterProfileModal() {
  const t = useTranslation();
  const language = useUIStore(s => s.language);
  const { isCharProfileOpen, setCharProfileOpen, setActiveView } = useUIStore();
  const { discoverIndex, currentImageIndex, setCurrentImageIndex } = useCreatureStore();
  const { startChat, selectedCharacter } = useChatStore();
  useEscapeClose(isCharProfileOpen, () => setCharProfileOpen(false));

  const filteredCharacters = useFilteredCharacters();

  const currentDiscoverChar = selectedCharacter || filteredCharacters[discoverIndex % Math.max(filteredCharacters.length, 1)];

  if (!isCharProfileOpen || !currentDiscoverChar) return null;

  const images = currentDiscoverChar.images || [currentDiscoverChar.avatar];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-md p-4"
        onClick={() => setCharProfileOpen(false)}
      >
        <motion.div
          initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="w-full max-w-md md:max-w-2xl bg-white rounded-t-[40px] md:rounded-[40px] overflow-hidden flex flex-col max-h-[90vh] md:max-h-[85vh] md:my-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Image Gallery */}
          <div className="relative h-96 shrink-0 group">
            <AnimatePresence mode="wait">
              <motion.img
                key={currentImageIndex}
                src={images[currentImageIndex]}
                alt={currentDiscoverChar.name}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full object-cover"
              />
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />

            {/* Image Navigation */}
            <div className="absolute inset-0 flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(currentImageIndex > 0 ? currentImageIndex - 1 : images.length - 1); }}
                className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(currentImageIndex < images.length - 1 ? currentImageIndex + 1 : 0); }}
                className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Indicators */}
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-1.5 px-8">
              {images.map((_, idx) => (
                <div key={idx} className={cn("h-1 w-8 rounded-full transition-all duration-300", idx === currentImageIndex ? "bg-ramos-accent" : "bg-black/10")} />
              ))}
            </div>

            <button
              onClick={() => setCharProfileOpen(false)}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white z-10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Character Details */}
          <div className="p-8 space-y-8 overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-5xl text-display mb-2">{currentDiscoverChar.name}</h3>
                <p className="text-ramos-accent text-sm font-accent tracking-widest uppercase">{language === 'en' ? currentDiscoverChar.tagline_en || currentDiscoverChar.tagline : currentDiscoverChar.tagline}</p>
              </div>
              <div className="flex flex-col gap-2 items-end">
                <div className="flex items-center gap-1.5 text-ramos-accent bg-ramos-accent/10 px-4 py-2 rounded-2xl">
                  <Sparkles className="w-5 h-5 fill-current" />
                  <span className="text-lg font-bold font-accent">{currentDiscoverChar.rating || '4.8'}</span>
                </div>
                {(currentDiscoverChar.chatCount ?? 0) > 0 && (
                  <div className="flex items-center gap-1.5 text-ramos-muted bg-ramos-gray px-3 py-1.5 rounded-xl">
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-xs font-bold font-accent">{currentDiscoverChar.chatCount} {t.chatCount}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-ramos-gray p-4 rounded-3xl space-y-1">
                <p className="text-[10px] text-accent text-ramos-muted uppercase tracking-widest">{t.age}</p>
                <p className="text-sm font-bold">{currentDiscoverChar.age || t.unknown} {t.years}</p>
              </div>
              <div className="bg-ramos-gray p-4 rounded-3xl space-y-1">
                <p className="text-[10px] text-accent text-ramos-muted uppercase tracking-widest">{t.worldview}</p>
                <p className="text-sm font-bold truncate">{language === 'en' ? currentDiscoverChar.world_en || currentDiscoverChar.world : currentDiscoverChar.world || t.unknown}</p>
              </div>
              <div className="bg-ramos-gray p-4 rounded-3xl space-y-1">
                <p className="text-[10px] text-accent text-ramos-muted uppercase tracking-widest">{t.race}</p>
                <p className="text-sm font-bold">{language === 'en' ? currentDiscoverChar.race_en || currentDiscoverChar.race : currentDiscoverChar.race || t.unknown}</p>
              </div>
              <div className="bg-ramos-gray p-4 rounded-3xl space-y-1">
                <p className="text-[10px] text-accent text-ramos-muted uppercase tracking-widest">{t.occupation}</p>
                <p className="text-sm font-bold truncate">{language === 'en' ? currentDiscoverChar.occupation_en || currentDiscoverChar.occupation : currentDiscoverChar.occupation || t.unknown}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] text-accent text-ramos-muted uppercase tracking-widest">{t.bio}</h4>
              <p className="text-base text-ramos-muted leading-relaxed font-medium">{language === 'en' ? currentDiscoverChar.description_en || currentDiscoverChar.description : currentDiscoverChar.description}</p>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] text-accent text-ramos-muted uppercase tracking-widest">{t.personality}</h4>
              <p className="text-base text-ramos-muted leading-relaxed font-medium italic bg-ramos-gray p-6 rounded-[32px]">"{language === 'en' ? currentDiscoverChar.personality_en || currentDiscoverChar.personality : currentDiscoverChar.personality}"</p>
            </div>

            {currentDiscoverChar.world && (
              <div className="space-y-4">
                <h4 className="text-[10px] text-accent text-ramos-muted uppercase tracking-widest">{t.worldIntro}</h4>
                <p className="text-base text-ramos-muted leading-relaxed font-medium bg-ramos-gray p-6 rounded-[32px]">
                  {language === 'en' ? currentDiscoverChar.world_en || currentDiscoverChar.world : currentDiscoverChar.world}
                </p>
              </div>
            )}

            <div className="pt-4">
              <button
                onClick={() => { startChat(currentDiscoverChar); setCharProfileOpen(false); setActiveView('chat'); }}
                className="btn-primary w-full py-6 text-xl flex items-center justify-center gap-4"
              >
                <MessageSquare className="w-7 h-7" />
                Start Connection
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
