'use client';

import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useUIStore } from '../../store/useUIStore';
import { useCreatureStore } from '../../store/useCreatureStore';
import { useEscapeClose } from '../../hooks/useEscapeClose';
import { useTranslation } from '../../i18n/useTranslation';

export function FilterModal() {
  const t = useTranslation();
  const { isFilterOpen, setFilterOpen } = useUIStore();
  const { filters, setFilters } = useCreatureStore();
  useEscapeClose(isFilterOpen, () => setFilterOpen(false));

  if (!isFilterOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={() => setFilterOpen(false)}
      >
        <motion.div
          initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="w-full max-w-md bg-white rounded-t-[40px] p-8 space-y-8"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-2xl text-display">{t.filterSouls}</h3>
            <button onClick={() => setFilterOpen(false)} className="p-2 rounded-full hover:bg-ramos-gray"><X className="w-6 h-6" /></button>
          </div>
          <div className="space-y-6">
            {[
              { label: 'Gender', key: 'gender', options: ['All', 'Male', 'Female', 'Non-binary'] },
              { label: 'Race', key: 'race', options: ['All', 'Human', 'Deity', 'Android', 'Elf', 'Beast'] },
              { label: 'Occupation', key: 'occupation', options: ['All', 'Hacker', 'Explorer', 'Guardian', 'Artist', 'Psychologist', 'Wellness Expert'] },
            ].map(group => (
              <div key={group.key} className="space-y-3">
                <label className="text-[10px] text-accent text-ramos-muted uppercase tracking-widest">{group.label}</label>
                <div className="flex flex-wrap gap-2">
                  {group.options.map(opt => (
                    <button
                      key={opt}
                      onClick={() => setFilters({ [group.key]: opt })}
                      className={cn(
                        "px-4 py-2 rounded-full text-xs font-medium transition-all",
                        filters[group.key as keyof typeof filters] === opt
                          ? "bg-ramos-accent text-white shadow-lg"
                          : "bg-ramos-gray text-ramos-muted hover:bg-ramos-border"
                      )}
                    >{opt}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setFilterOpen(false)} className="btn-primary w-full py-5 text-lg">{t.applyFilters}</button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
