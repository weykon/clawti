'use client';

import { useRouter } from 'next/navigation';
import { Compass, MessageSquare, PlusCircle, User } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/cn';
import { useUIStore } from '../../store/useUIStore';
import { useChatStore } from '../../store/useChatStore';
import { useTranslation } from '../../i18n/useTranslation';
import type { View } from '../../types';

export function MobileNav() {
  const t = useTranslation();
  const router = useRouter();
  const { activeView, setActiveView } = useUIStore();
  const { selectedCharacter, setSelectedCharacter } = useChatStore();

  // Hide nav when in a chat conversation
  if (activeView === 'chat' && selectedCharacter) return null;

  const navItems = [
    { id: 'discover' as View, label: t.discover, icon: <Compass className="w-5 h-5" /> },
    { id: 'chat' as View, label: t.chats, icon: <MessageSquare className="w-5 h-5" /> },
    { id: 'create' as View, label: t.create, icon: <PlusCircle className="w-5 h-5" /> },
    { id: 'profile' as View, label: t.profile, icon: <User className="w-5 h-5" /> },
  ];

  return (
    <div className="md:hidden fixed bottom-4 left-4 right-4 z-50 flex justify-center pointer-events-none">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="pointer-events-auto flex items-center gap-1 bg-black/90 backdrop-blur-3xl border border-white/10 rounded-[32px] p-1.5 shadow-2xl w-full max-w-[320px]"
      >
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveView(item.id);
              router.push(`/${item.id}`);
              if (item.id === 'discover') setSelectedCharacter(null);
            }}
            className={cn(
              'flex-1 flex flex-col items-center justify-center h-14 rounded-[24px] transition-all duration-300',
              activeView === item.id
                ? 'bg-ramos-accent text-white shadow-lg'
                : 'text-white/40 hover:text-white'
            )}
          >
            <div className={cn('transition-transform duration-300', activeView === item.id && 'scale-110')}>
              {item.icon}
            </div>
            <span className="text-[7px] mt-1 uppercase tracking-[0.1em] font-extrabold opacity-80">{item.label}</span>
          </button>
        ))}
      </motion.div>
    </div>
  );
}
