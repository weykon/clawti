'use client';

import { motion, AnimatePresence } from 'motion/react';
import { X, MessageSquare } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useCreatureStore } from '../../store/useCreatureStore';
import { useChatStore } from '../../store/useChatStore';
import { useTranslation } from '../../i18n/useTranslation';
import { useEscapeClose } from '../../hooks/useEscapeClose';

export function FriendsListModal() {
  const t = useTranslation();
  const { isFriendsListOpen, setFriendsListOpen } = useUIStore();
  const { characters, friends } = useCreatureStore();
  const { startChat } = useChatStore();
  useEscapeClose(isFriendsListOpen, () => setFriendsListOpen(false));

  if (!isFriendsListOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={() => setFriendsListOpen(false)}
      >
        <motion.div
          initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="w-full max-w-md bg-white rounded-t-[40px] p-8 space-y-8"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-2xl text-display">{t.friendsList}</h3>
            <button onClick={() => setFriendsListOpen(false)} className="p-2 rounded-full hover:bg-ramos-gray"><X className="w-6 h-6" /></button>
          </div>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {(friends.length > 0 ? friends : characters).map(char => (
              <div
                key={char.id}
                onClick={() => { startChat(char); setFriendsListOpen(false); }}
                className="flex items-center gap-4 p-3 rounded-2xl border border-ramos-border hover:bg-ramos-gray transition-colors cursor-pointer group"
              >
                <img src={char.avatar} alt={char.name} className="w-12 h-12 rounded-xl object-cover border border-ramos-border group-hover:scale-105 transition-transform" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-lg text-display truncate">{char.name}</h4>
                  <p className="text-[10px] text-ramos-muted truncate font-medium uppercase tracking-wider">{char.tagline}</p>
                </div>
                <div className="p-2 bg-ramos-accent/10 text-ramos-accent rounded-xl group-hover:bg-ramos-accent group-hover:text-white transition-colors">
                  <MessageSquare className="w-5 h-5" />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
