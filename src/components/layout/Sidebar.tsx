'use client';

import { useRouter } from 'next/navigation';
import { Compass, MessageSquare, PlusCircle, User, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/cn';
import { useUIStore } from '../../store/useUIStore';
import { useChatStore } from '../../store/useChatStore';
import { useTranslation } from '../../i18n/useTranslation';
import type { View } from '../../types';

export function Sidebar() {
  const t = useTranslation();
  const router = useRouter();
  const { activeView, setActiveView, energy } = useUIStore();
  const setSelectedCharacter = useChatStore(s => s.setSelectedCharacter);

  const navItems = [
    { id: 'discover' as View, label: t.discover, icon: <Compass className="w-6 h-6" /> },
    { id: 'chat' as View, label: t.chats, icon: <MessageSquare className="w-6 h-6" /> },
    { id: 'create' as View, label: t.create, icon: <PlusCircle className="w-6 h-6" /> },
    { id: 'profile' as View, label: t.profile, icon: <User className="w-6 h-6" /> },
  ];

  return (
    <aside className="hidden md:flex flex-col w-72 border-r border-ramos-border bg-white z-40">
      <div className="p-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-ramos-accent rounded-2xl flex items-center justify-center text-white shadow-lg shadow-ramos-accent/30 rotate-3 group cursor-pointer overflow-hidden">
            <div className="relative w-full h-full flex items-center justify-center">
              <Sparkles className="w-6 h-6 absolute transition-transform duration-500 group-hover:scale-150 group-hover:rotate-12" />
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <h1 className="text-3xl text-display text-ramos-accent tracking-tight">{t.appName}</h1>
        </div>
      </div>

      <nav className="flex-1 px-6 space-y-3">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => { setActiveView(item.id); setSelectedCharacter(null); router.push(`/${item.id}`); }}
            className={cn(
              'w-full flex items-center gap-4 px-6 py-4 rounded-[24px] transition-all duration-500 group',
              activeView === item.id
                ? 'bg-ramos-accent text-white shadow-xl shadow-ramos-accent/20 translate-x-1'
                : 'text-ramos-muted hover:bg-ramos-gray hover:text-ramos-black'
            )}
          >
            <span className={cn('transition-transform duration-500', activeView === item.id ? 'scale-110' : 'group-hover:scale-110')}>
              {item.icon}
            </span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-8 border-t border-ramos-border bg-ramos-gray/30">
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-accent text-ramos-muted uppercase tracking-widest font-bold">{t.energy}</span>
            <span className="text-xs font-bold text-ramos-accent">{energy}</span>
          </div>
          <div className="w-full h-2 bg-ramos-gray rounded-full overflow-hidden shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (energy / 1000) * 100)}%` }}
              className="h-full bg-ramos-accent shadow-[0_0_10px_rgba(255,92,0,0.3)]"
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
