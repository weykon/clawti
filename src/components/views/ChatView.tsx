'use client';

import { useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, MessageSquare, Users, Sparkles, Mic, Gift, Send } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useUIStore } from '../../store/useUIStore';
import { useChatStore } from '../../store/useChatStore';
import { useCreatureStore } from '../../store/useCreatureStore';
import { useTranslation } from '../../i18n/useTranslation';
import { useChat } from '../../hooks/useChat';
import type { Character } from '../../types';
import type { Translations } from '../../i18n/translations';

export function ChatView() {
  const t = useTranslation();
  const { setFriendsListOpen, setCharProfileOpen, setActiveView } = useUIStore();
  const { setSelectedCharacter } = useChatStore();
  const {
    messages, selectedCharacter, inputText, isTyping, chatError, energy,
    setInputText, send, startChat,
  } = useChat();
  const { characters, friends } = useCreatureStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedCharacter?.id, isTyping]);

  // Build active chats from characters that have messages
  const allChars = [...characters, ...friends];
  const activeChats = Object.keys(messages)
    .map(id => allChars.find(c => c.id === id))
    .filter((c): c is Character => !!c);

  const handleSendMessage = () => {
    if (!inputText.trim() || !selectedCharacter || energy <= 0) return;
    send();
  };

  return (
    <motion.div
      key="chat"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="h-full flex flex-row overflow-hidden bg-ramos-gray/30"
    >
      {/* Desktop Chat List Sidebar */}
      <div className={cn(
        "w-full md:w-80 flex-col border-r border-ramos-border bg-white/50 backdrop-blur-xl md:flex",
        selectedCharacter ? "hidden" : "flex"
      )}>
        <div className="pt-6 px-6 pb-32 flex-1 flex flex-col overflow-y-auto">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-3xl text-display mb-1">{t.chats}</h2>
              <p className="text-ramos-muted text-[10px] font-medium uppercase tracking-wider">{t.recentConversations}</p>
            </div>
            <button
              onClick={() => setFriendsListOpen(true)}
              className="p-3 rounded-2xl bg-white border border-ramos-border text-ramos-black hover:bg-ramos-gray transition-all shadow-sm"
            >
              <Users className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 space-y-4">
            {activeChats.length > 0 ? (
              activeChats.map(char => {
                const charMsgs = messages[char.id] || [];
                const lastMsg = charMsgs[charMsgs.length - 1];
                return (
                  <motion.div
                    key={char.id}
                    whileHover={{ x: 5 }}
                    onClick={() => setSelectedCharacter(char)}
                    className={cn(
                      "cursor-pointer flex items-center gap-4 hover:bg-ramos-gray transition-all p-4 rounded-[32px] border border-ramos-border bg-white mb-4 shadow-sm",
                      selectedCharacter?.id === char.id && "bg-ramos-accent/5 border-ramos-accent/20 ring-2 ring-ramos-accent/10"
                    )}
                  >
                    <div className="relative shrink-0">
                      <img src={char.avatar} alt={char.name} className="w-16 h-16 rounded-[24px] object-cover border border-ramos-border" referrerPolicy="no-referrer" />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-ramos-accent border-2 border-white rounded-full" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-2xl text-display truncate max-w-[120px]">{char.name}</h3>
                        <span className="text-[10px] font-accent text-ramos-muted">
                          {lastMsg ? new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : ''}
                        </span>
                      </div>
                      <p className="text-xs text-ramos-muted truncate font-medium">
                        {lastMsg ? lastMsg.content : t.startChatting}
                      </p>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-ramos-muted gap-8 opacity-40">
                <div className="w-24 h-24 rounded-[40px] bg-ramos-gray flex items-center justify-center">
                  <MessageSquare className="w-12 h-12" />
                </div>
                <p className="text-lg font-medium">{t.noActiveChats}</p>
                <button onClick={() => setActiveView('discover')} className="text-ramos-accent text-sm text-accent underline underline-offset-8">
                  {t.findCompanion}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Window */}
      <div className={cn(
        "flex-1 flex-col h-full bg-white md:flex relative",
        selectedCharacter ? "flex" : "hidden"
      )}>
        {selectedCharacter ? (
          <ChatConversation
            t={t}
            selectedCharacter={selectedCharacter}
            messages={messages[selectedCharacter.id] || []}
            inputText={inputText}
            isTyping={isTyping}
            chatError={chatError}
            energy={energy}
            messagesEndRef={messagesEndRef}
            onBack={() => setSelectedCharacter(null)}
            onProfileOpen={() => setCharProfileOpen(true)}
            onInputChange={setInputText}
            onSend={handleSendMessage}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-ramos-muted gap-6 opacity-30 p-12 text-center">
            <div className="w-32 h-32 rounded-[48px] bg-ramos-gray flex items-center justify-center mb-4">
              <MessageSquare className="w-16 h-16" />
            </div>
            <h3 className="text-2xl text-display">{t.selectConnection}</h3>
            <p className="max-w-xs text-sm font-medium">{t.chooseSoulDescription}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ChatConversation({
  t, selectedCharacter, messages, inputText, isTyping, chatError, energy,
  messagesEndRef, onBack, onProfileOpen, onInputChange, onSend,
}: {
  t: Translations;
  selectedCharacter: Character;
  messages: import('../../types').Message[];
  inputText: string;
  isTyping: boolean;
  chatError: string | null;
  energy: number;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onBack: () => void;
  onProfileOpen: () => void;
  onInputChange: (text: string) => void;
  onSend: () => void;
}) {
  return (
    <div className="h-full flex flex-col relative z-10">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <img src={selectedCharacter.avatar} alt="" className="w-full h-full object-cover blur-sm opacity-30" referrerPolicy="no-referrer" />
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Chat Header */}
      <div className="px-6 py-8 border-b border-white/10 flex items-center gap-6 bg-black/30 backdrop-blur-2xl sticky top-0 z-20 text-white">
        <button onClick={onBack} className="md:hidden p-3 -ml-2 rounded-2xl hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-7 h-7" />
        </button>
        <div className="flex items-center gap-5 cursor-pointer" onClick={onProfileOpen}>
          <div className="relative">
            <img src={selectedCharacter.avatar} alt={selectedCharacter.name} className="w-14 h-14 rounded-full object-cover border-2 border-ramos-accent/60 shadow-[0_0_15px_rgba(255,92,0,0.3)]" referrerPolicy="no-referrer" />
          </div>
          <div>
            <h3 className="text-2xl text-display leading-none">{selectedCharacter.name}</h3>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
            <Sparkles className="w-4 h-4 text-ramos-accent fill-current" />
            <span className="text-sm font-bold font-accent">{energy}</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-8 space-y-10 scroll-smooth pb-40 relative z-10">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={cn(
              "flex flex-col max-w-[85%] md:max-w-[70%]",
              msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
            )}
          >
            <div className={cn(
              "px-6 py-5 rounded-[28px] text-base font-medium leading-relaxed shadow-sm",
              msg.role === 'user'
                ? "bg-ramos-accent text-white rounded-tr-none shadow-[0_15px_30px_rgba(255,92,0,0.15)]"
                : "bg-white text-ramos-black rounded-tl-none border border-ramos-border"
            )}>
              <div className={cn("markdown-body prose prose-sm max-w-none", msg.role === 'user' ? "prose-invert" : "")}>
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
            <span className="text-[10px] font-accent text-ramos-muted mt-3 px-2 uppercase tracking-widest">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </motion.div>
        ))}
        {isTyping && (
          <div className="flex items-center gap-4 text-ramos-muted text-[11px] text-accent">
            <div className="flex gap-2">
              <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-ramos-accent rounded-full" />
              <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 bg-ramos-accent rounded-full" />
              <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 bg-ramos-accent rounded-full" />
            </div>
            {selectedCharacter.name} {t.isManifesting}
          </div>
        )}
        {chatError && (
          <div className="mx-4 mb-2 p-3 bg-red-500/20 border border-red-500/40 rounded-2xl text-red-300 text-xs text-center animate-in fade-in">
            {chatError}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="fixed bottom-12 left-0 right-0 max-w-md mx-auto px-6 z-30 md:relative md:bottom-0 md:max-w-none md:pb-12 md:pt-4 bg-transparent">
        <div className="relative flex items-center bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[40px] p-2 shadow-2xl">
          <button className="p-3 text-white/60 hover:text-white transition-colors">
            <Mic className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={inputText}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSend()}
            placeholder={energy > 0 ? t.typeMessage : t.outOfEnergy}
            disabled={energy <= 0}
            className="flex-1 bg-transparent border-none py-4 px-3 text-sm focus:outline-none disabled:opacity-50 font-medium text-white placeholder:text-white/30"
          />
          <div className="flex items-center gap-1 pr-1">
            <button className="p-3 text-white/60 hover:text-white transition-colors">
              <Gift className="w-5 h-5" />
            </button>
            <button
              onClick={onSend}
              disabled={!inputText.trim() || isTyping || energy <= 0}
              className="p-3 text-white/60 hover:text-white disabled:opacity-30 transition-all"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
