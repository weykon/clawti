'use client';

import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import { Compass, Sparkles, Filter, X, Heart, MessageSquare, Eye } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useUIStore } from '../../store/useUIStore';
import { useCreatureStore, useFilteredCharacters } from '../../store/useCreatureStore';
import { useChatStore } from '../../store/useChatStore';
import { useTranslation } from '../../i18n/useTranslation';
import { api } from '../../api/client';

export function DiscoverView() {
  const t = useTranslation();
  const router = useRouter();
  const language = useUIStore(s => s.language);
  const { setFilterOpen, setCharProfileOpen, setActiveView } = useUIStore();
  const { characters, friends, filters, discoverIndex, currentImageIndex, setCurrentImageIndex, addFriend, addSwipeIndex } = useCreatureStore();
  const { startChat, setSelectedCharacter } = useChatStore();

  const filteredCharacters = useFilteredCharacters();

  const currentDiscoverChar = filteredCharacters[discoverIndex % Math.max(filteredCharacters.length, 1)];

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (direction === 'right' && currentDiscoverChar) {
      // Add friend via API; only update local state on success
      api.friends.add(currentDiscoverChar.id)
        .then(() => addFriend(currentDiscoverChar))
        .catch(err => console.error('Failed to add friend:', err));
      startChat(currentDiscoverChar);
      setActiveView('chat');
      router.push('/chat');
    }
    addSwipeIndex();
  };

  const handleStartChat = (char: typeof currentDiscoverChar) => {
    startChat(char);
    setActiveView('chat');
    router.push('/chat');
  };

  return (
    <motion.div
      key="discover"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="h-full relative overflow-y-auto md:p-12"
    >
      {/* Mobile Header */}
      <header className="px-6 py-6 flex items-center justify-end z-20 bg-transparent absolute top-0 left-0 right-0 md:hidden">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setFilterOpen(true)}
            aria-label="Open filters"
            className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/40 transition-all"
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between mb-12">
        <div>
          <h2 className="text-5xl text-display mb-2">{t.discover}</h2>
          <p className="text-ramos-muted text-sm font-accent tracking-widest uppercase">{t.tagline}</p>
        </div>
        <button
          onClick={() => setFilterOpen(true)}
          className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white border border-ramos-border text-ramos-black hover:bg-ramos-gray transition-all shadow-sm font-bold text-xs uppercase tracking-widest"
        >
          <Filter className="w-4 h-4" />
          {t.filters}
        </button>
      </div>

      {/* Cards */}
      <div className="md:grid md:grid-cols-2 lg:grid-cols-3 gap-8 h-full md:h-auto">
        {filteredCharacters.length > 0 && currentDiscoverChar ? (
          <>
            {/* Mobile Swipe Card */}
            <div className="md:hidden h-full w-full relative overflow-hidden">
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={currentDiscoverChar.id}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  onDragEnd={(_, info) => {
                    if (info.offset.x > 100) handleSwipe('right');
                    else if (info.offset.x < -100) handleSwipe('left');
                  }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, x: 500, transition: { duration: 0.3 } }}
                  className="h-full w-full absolute inset-0 touch-none"
                >
                  <div
                    className="relative h-full w-full"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const images = currentDiscoverChar.images || [currentDiscoverChar.avatar];
                      if (x < rect.width / 3) {
                        setCurrentImageIndex(currentImageIndex > 0 ? currentImageIndex - 1 : images.length - 1);
                      } else if (x > (rect.width * 2) / 3) {
                        setCurrentImageIndex(currentImageIndex < images.length - 1 ? currentImageIndex + 1 : 0);
                      } else {
                        setCharProfileOpen(true);
                      }
                    }}
                  >
                    <img
                      src={(currentDiscoverChar.images || [currentDiscoverChar.avatar])[currentImageIndex]}
                      alt={currentDiscoverChar.name}
                      className="w-full h-full object-cover pointer-events-none"
                      referrerPolicy="no-referrer"
                    />

                    {/* Image Indicators */}
                    <div className="absolute top-6 left-0 right-0 flex justify-center gap-1.5 px-8 z-10">
                      {(currentDiscoverChar.images || [currentDiscoverChar.avatar]).map((_, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            'h-1 flex-1 rounded-full transition-all duration-300',
                            idx === currentImageIndex ? 'bg-white' : 'bg-white/30'
                          )}
                        />
                      ))}
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-95 pointer-events-none" />

                    <div className="absolute bottom-20 md:bottom-6 left-0 right-0 p-6 space-y-3 pointer-events-none">
                      <div className="flex flex-wrap gap-1.5 mb-1">
                        {currentDiscoverChar.occupation && (
                          <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/10">
                            <span className="text-[9px] font-extrabold font-accent text-white uppercase tracking-wider">
                              {language === 'en' ? currentDiscoverChar.occupation_en || currentDiscoverChar.occupation : currentDiscoverChar.occupation}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 bg-ramos-accent/80 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/10">
                          <Sparkles className="w-2.5 h-2.5 text-white fill-current" />
                          <span className="text-[9px] font-extrabold font-accent text-white">{currentDiscoverChar.rating || '4.8'}</span>
                        </div>
                      </div>

                      <h2 className="text-4xl text-display text-white text-dense mb-0.5">{currentDiscoverChar.name}</h2>

                      <div className="flex flex-wrap gap-1.5">
                        {(language === 'en' ? currentDiscoverChar.personality_en || currentDiscoverChar.personality : currentDiscoverChar.personality || '')
                          .split(',').slice(0, 3).filter(Boolean).map((trait, i) => (
                            <span key={i} className="px-2 py-0.5 bg-white/5 backdrop-blur-md rounded-full text-[9px] font-bold text-white/80 border border-white/5 uppercase tracking-wider">
                              {trait.trim()}
                            </span>
                          ))}
                      </div>

                      <p className="text-xs text-white/70 font-medium leading-snug line-clamp-2 max-w-[90%]">
                        {language === 'en' ? currentDiscoverChar.description_en || currentDiscoverChar.description : currentDiscoverChar.description}
                      </p>

                      <div className="flex items-center justify-center gap-6 pt-2 pb-4 pointer-events-auto">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSwipe('left'); }}
                          aria-label="Skip character"
                          className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-all"
                        >
                          <X className="w-6 h-6" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSwipe('right'); }}
                          aria-label="Add to friends"
                          className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-ramos-accent hover:bg-ramos-accent hover:text-white transition-all shadow-lg"
                        >
                          <Heart className="w-6 h-6 fill-current" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Desktop Grid */}
            {filteredCharacters.map((char) => (
              <motion.div
                key={char.id}
                whileHover={{ y: -10 }}
                className="hidden md:block group relative aspect-[3/4] rounded-[40px] overflow-hidden cursor-pointer shadow-2xl"
                onClick={() => handleStartChat(char)}
              >
                <img
                  src={char.avatar}
                  alt={char.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-8 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 bg-ramos-accent/90 px-3 py-1 rounded-full">
                      <Sparkles className="w-3 h-3 text-white fill-current" />
                      <span className="text-[10px] font-bold font-accent text-white">{char.rating || '4.8'}</span>
                    </div>
                    {(char.chatCount ?? 0) > 0 && (
                      <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full">
                        <MessageSquare className="w-3 h-3 text-white" />
                        <span className="text-[10px] font-bold font-accent text-white">{char.chatCount}</span>
                      </div>
                    )}
                    {char.occupation && (
                      <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full">
                        <span className="text-[10px] font-bold font-accent text-white uppercase tracking-wider">
                          {language === 'en' ? char.occupation_en || char.occupation : char.occupation}
                        </span>
                      </div>
                    )}
                  </div>
                  <h3 className="text-4xl text-display text-white">
                    {char.name}{char.age ? <span className="text-lg text-white/60 font-accent ml-2">{char.age}</span> : null}
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {(language === 'en' ? char.personality_en || char.personality : char.personality || '')
                      .split(',').slice(0, 3).filter(Boolean).map((trait, i) => (
                        <span key={i} className="px-2 py-0.5 bg-white/5 backdrop-blur-md rounded-full text-[9px] font-bold text-white/80 border border-white/5 uppercase tracking-wider">
                          {trait.trim()}
                        </span>
                      ))}
                  </div>
                  <p className="text-sm text-white/70 line-clamp-2 font-medium">
                    {language === 'en' ? char.description_en || char.description : char.description}
                  </p>
                  <div className="pt-4 opacity-0 group-hover:opacity-100 transition-opacity translate-y-4 group-hover:translate-y-0 duration-500 flex gap-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleStartChat(char); }}
                      className="flex-1 py-4 bg-white text-black rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl hover:bg-white/90 active:scale-[0.98] transition-all"
                    >
                      {t.connectNow}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedCharacter(char); setCharProfileOpen(true); }}
                      className="py-4 px-5 bg-white/20 backdrop-blur-md text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-white/30 active:scale-[0.98] transition-all flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      {t.viewDetails}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </>
        ) : (
          <div className="col-span-full h-full flex flex-col items-center justify-center text-ramos-muted gap-6 opacity-30 p-12 text-center">
            <div className="w-32 h-32 rounded-[48px] bg-ramos-gray flex items-center justify-center mb-4">
              <Compass className="w-16 h-16" />
            </div>
            <h3 className="text-2xl text-display">{t.noSoulsFound}</h3>
            <p className="max-w-xs text-sm font-medium">{t.tryAdjustingFilters}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
