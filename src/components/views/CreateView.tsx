'use client';

import { useRef } from 'react';
import { motion } from 'motion/react';
import {
  Sparkles, ArrowLeft, ChevronRight, Shield, Zap,
  PlusCircle, RefreshCw, FileUp, Languages, Loader2,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import { useUIStore } from '../../store/useUIStore';
import { useCreateStore } from '../../store/useCreateStore';
import { useCreatureStore } from '../../store/useCreatureStore';
import { useChatStore } from '../../store/useChatStore';
import { useTranslation } from '../../i18n/useTranslation';
import { PERSONALITY_TEMPLATES } from '../../data/personalityTemplates';
import { APPEARANCE_STYLES } from '../../data/appearanceStyles';
import type { CreateFormState, ImportPreview } from '../../types';
import type { Translations } from '../../i18n/translations';

export function CreateView() {
  const t = useTranslation();
  const language = useUIStore(s => s.language);
  const { setActiveView, setEnergy } = useUIStore();
  const {
    createFlow, createStep, createForm, isGenerating, generatingField, createError, isPremium,
    showAgeVerification, importType, importUrl, importFile, importPreview,
    setCreateFlow, setCreateStep, setCreateForm, setShowAgeVerification,
    setImportType, setImportUrl, handleImportFile, handleGenerateCharacter,
    generateFieldText,
  } = useCreateStore();
  const { addCharacter } = useCreatureStore();
  const { startChat } = useChatStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateField = (field: string) => {
    generateFieldText(field);
  };

  const onGenerate = () => {
    handleGenerateCharacter(
      (char) => {
        addCharacter(char);
        startChat(char);
        setActiveView('chat');
      },
      setEnergy,
    );
  };

  const maxSteps = createFlow === 'simple' ? 1 : createFlow === 'detailed' ? 6 : 5;

  return (
    <motion.div
      key="create"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className="space-y-8 pt-6 px-6 pb-32 overflow-y-auto h-full max-w-4xl mx-auto w-full"
    >
      {/* Header */}
      <div className="space-y-6 mb-8">
        <div>
          <h2 className="text-4xl text-display mb-1">{t.create}</h2>
          <p className="text-ramos-muted text-[10px] font-medium uppercase tracking-wider">{t.bringImaginationToLife}</p>
        </div>
        <div className="flex bg-ramos-gray p-1 rounded-2xl border border-ramos-border w-fit">
          {(['simple', 'detailed', 'import'] as const).map((flow) => (
            <button
              key={flow}
              onClick={() => { setCreateFlow(flow); setCreateStep(1); }}
              className={cn(
                "px-6 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all",
                createFlow === flow ? "bg-white text-ramos-accent shadow-sm" : "text-ramos-muted hover:text-ramos-black"
              )}
            >
              {t[flow]}
            </button>
          ))}
        </div>
      </div>

      {createError && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-600 text-xs text-center animate-in fade-in">
          {createError}
        </div>
      )}

      {/* Progress Bar */}
      {createFlow !== 'simple' && (
        <div className="flex items-center gap-2 mb-12">
          {Array.from({ length: createFlow === 'detailed' ? 6 : 5 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all duration-500",
                i + 1 <= createStep ? "bg-ramos-accent shadow-[0_0_10px_rgba(255,92,0,0.3)]" : "bg-ramos-gray"
              )}
            />
          ))}
        </div>
      )}

      {/* Flow Content */}
      <div className="min-h-[400px]">
        {createFlow === 'simple' && <SimpleFlow t={t} language={language} createForm={createForm} isPremium={isPremium} generatingField={generatingField} setCreateForm={setCreateForm} generateField={generateField} />}
        {createFlow === 'detailed' && <DetailedFlow t={t} language={language} createForm={createForm} createStep={createStep} isPremium={isPremium} generatingField={generatingField} showAgeVerification={showAgeVerification} setCreateForm={setCreateForm} setShowAgeVerification={setShowAgeVerification} generateField={generateField} />}
        {createFlow === 'import' && <ImportFlow t={t} language={language} createForm={createForm} createStep={createStep} importType={importType} importUrl={importUrl} importFile={importFile} importPreview={importPreview} setCreateForm={setCreateForm} setImportType={setImportType} setImportUrl={setImportUrl} setCreateStep={setCreateStep} handleImportFile={handleImportFile} fileInputRef={fileInputRef} />}
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-4 pt-8">
        {createFlow !== 'simple' && createStep > 1 && (
          <button
            onClick={() => setCreateStep(createStep - 1)}
            className="flex-1 py-5 bg-ramos-gray text-ramos-black rounded-[24px] font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-ramos-border transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.back}
          </button>
        )}
        <button
          onClick={() => {
            if (createStep < maxSteps) setCreateStep(createStep + 1);
            else onGenerate();
          }}
          disabled={isGenerating || (createFlow !== 'simple' && createStep === 1 && !createForm.name) || (createFlow === 'simple' && (!createForm.name || !createForm.personalityTemplate || !createForm.appearanceStyle)) || (createFlow === 'import' && createStep === 2 && !importPreview)}
          className="flex-[2] py-5 bg-ramos-accent text-white rounded-[24px] font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {createFlow === 'simple' || createStep === maxSteps ? (
            <><Sparkles className="w-4 h-4" />{t.confirm}</>
          ) : (
            <>{t.next}<ChevronRight className="w-4 h-4" /></>
          )}
        </button>
      </div>

      {/* Age Verification Modal */}
      {showAgeVerification && <AgeVerificationModal t={t} setShowAgeVerification={setShowAgeVerification} setCreateForm={setCreateForm} />}
    </motion.div>
  );
}

/* ─── SIMPLE FLOW ─── */
function SimpleFlow({ t, language, createForm, isPremium, generatingField, setCreateForm, generateField }: {
  t: Translations; language: string; createForm: CreateFormState; isPremium: boolean;
  generatingField: string | null; setCreateForm: (f: Partial<CreateFormState>) => void; generateField: (f: string) => void;
}) {
  return (
    <div className="space-y-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
        {/* Basic Info */}
        <section className="space-y-6">
          <h3 className="text-2xl text-display">{t.basicInfo}</h3>
          <div className="space-y-4">
            <label className="text-[10px] text-accent text-ramos-muted uppercase tracking-widest font-bold">{t.nameLabel}</label>
            <input type="text" value={createForm.name} onChange={(e) => setCreateForm({ name: e.target.value })} placeholder={t.namePlaceholder} className="w-full bg-ramos-gray border border-ramos-border rounded-[24px] p-5 text-sm focus:outline-none focus:border-ramos-accent/50 transition-all font-medium" />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="text-[10px] text-accent text-ramos-muted uppercase tracking-widest font-bold">{t.gender}</label>
              <div className="flex bg-ramos-gray p-1 rounded-2xl border border-ramos-border">
                {([t.female, t.male, t.other] as const).map((g) => (
                  <button key={g} onClick={() => setCreateForm({ gender: g })} className={cn("flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all", createForm.gender === g ? "bg-white text-ramos-accent shadow-sm" : "text-ramos-muted hover:text-ramos-black")}>{g}</button>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-[10px] text-accent text-ramos-muted uppercase tracking-widest font-bold">{t.age}</label>
              <input type="number" min="1" max="120" value={createForm.age} onChange={(e) => setCreateForm({ age: parseInt(e.target.value) || 0 })} className="w-full bg-ramos-gray border border-ramos-border rounded-[24px] p-5 text-sm focus:outline-none focus:border-ramos-accent/50 transition-all font-medium" />
            </div>
          </div>
        </section>

        {/* Personality */}
        <section className="space-y-6">
          <h3 className="text-2xl text-display">{t.personalityTemplate}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {PERSONALITY_TEMPLATES.map((tmpl) => (
              <button key={tmpl.id} onClick={() => setCreateForm({ personalityTemplate: tmpl.id })} className={cn("p-4 rounded-[32px] border-2 transition-all text-left flex flex-col gap-3 group", createForm.personalityTemplate === tmpl.id ? "bg-ramos-accent/5 border-ramos-accent shadow-lg shadow-ramos-accent/10" : "bg-white border-ramos-border hover:border-ramos-accent/30")}>
                <span className="text-3xl">{tmpl.icon}</span>
                <div>
                  <h4 className={cn("font-bold text-sm mb-1", createForm.personalityTemplate === tmpl.id ? "text-ramos-accent" : "text-ramos-black")}>{language === 'en' ? tmpl.name_en : tmpl.name}</h4>
                  <p className="text-[9px] text-ramos-muted leading-tight line-clamp-2">{language === 'en' ? tmpl.desc_en : tmpl.desc}</p>
                </div>
              </button>
            ))}
          </div>
          {createForm.personalityTemplate && (
            <div className="p-6 bg-ramos-accent/5 rounded-[24px] border border-ramos-accent/20">
              <p className="text-[10px] text-accent text-ramos-accent uppercase tracking-widest font-bold mb-3">{t.personalityHighlights}</p>
              <div className="flex flex-wrap gap-2">
                {PERSONALITY_TEMPLATES.find(t => t.id === createForm.personalityTemplate)?.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-white rounded-full text-[10px] font-bold text-ramos-accent border border-ramos-accent/20">#{tag}</span>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Appearance */}
        <section className="space-y-6">
          <h3 className="text-2xl text-display">{t.appearanceStyle}</h3>
          <div className="grid grid-cols-2 gap-4">
            {APPEARANCE_STYLES.map((style) => (
              <button key={style.id} onClick={() => setCreateForm({ appearanceStyle: style.id })} className={cn("p-6 rounded-[32px] border-2 transition-all flex items-center gap-4", createForm.appearanceStyle === style.id ? "bg-ramos-accent/5 border-ramos-accent shadow-lg" : "bg-white border-ramos-border hover:border-ramos-accent/30")}>
                <span className="text-4xl">{style.icon}</span>
                <span className="font-bold text-lg">{language === 'en' ? style.name_en : style.name}</span>
              </button>
            ))}
          </div>
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-accent text-ramos-muted uppercase tracking-widest font-bold">{t.styleDescription}</label>
              <button onClick={() => generateField('appearanceDescription')} disabled={generatingField === 'appearanceDescription'} className="text-[10px] text-ramos-accent font-bold uppercase tracking-widest flex items-center gap-1 disabled:opacity-50">
                {generatingField === 'appearanceDescription' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}{t.generate}
              </button>
            </div>
            <textarea value={createForm.appearanceDescription} onChange={(e) => setCreateForm({ appearanceDescription: e.target.value })} placeholder={t.appearancePlaceholder} rows={4} className="w-full bg-ramos-gray border border-ramos-border rounded-[32px] p-6 text-sm focus:outline-none focus:border-ramos-accent/50 transition-all resize-none font-medium" />
          </div>
        </section>

        {/* Mode & Cost */}
        <section className="space-y-6">
          <div className="bento-card p-8">
            <div className="flex items-center justify-center md:justify-start gap-2">
              {isPremium ? (
                <div className="flex items-center gap-1.5 text-ramos-accent bg-ramos-accent/10 px-3 py-1 rounded-full">
                  <Sparkles className="w-3 h-3 fill-current" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{t.enhancedMode} ✨</span>
                </div>
              ) : (
                <div className="flex flex-col items-center md:items-start gap-1">
                  <div className="flex items-center gap-1.5 text-ramos-muted bg-ramos-gray px-3 py-1 rounded-full">
                    <span className="text-[10px] font-bold uppercase tracking-widest">{t.classicMode}</span>
                  </div>
                  <p className="text-[8px] text-ramos-muted italic">{t.upgradeToUnlock}</p>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between p-6 bg-ramos-gray rounded-[24px]">
            <span className="text-xs font-bold text-ramos-muted uppercase tracking-widest">{t.energyCost}</span>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-ramos-accent fill-current" />
              <span className="text-xl font-bold text-ramos-accent">100</span>
            </div>
          </div>
        </section>
      </motion.div>
    </div>
  );
}

/* ─── DETAILED FLOW ─── */
function DetailedFlow({ t, language, createForm, createStep, isPremium, generatingField, showAgeVerification, setCreateForm, setShowAgeVerification, generateField }: {
  t: Translations; language: string; createForm: CreateFormState; createStep: number; isPremium: boolean;
  generatingField: string | null; showAgeVerification: boolean; setCreateForm: (f: Partial<CreateFormState>) => void; setShowAgeVerification: (v: boolean) => void; generateField: (f: string) => void;
}) {
  return (
    <div className="space-y-8">
      {createStep === 1 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
          <h3 className="text-2xl text-display">{t.basicInfo}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="text-[10px] text-accent text-ramos-muted uppercase tracking-widest font-bold">{t.nameLabel}</label>
              <input type="text" value={createForm.name} onChange={(e) => setCreateForm({ name: e.target.value })} placeholder={t.namePlaceholder} className="w-full bg-ramos-gray border border-ramos-border rounded-[24px] p-5 text-sm focus:outline-none focus:border-ramos-accent/50 transition-all font-medium" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <label className="text-[10px] text-accent text-ramos-muted uppercase tracking-widest font-bold">{t.gender}</label>
                <div className="flex bg-ramos-gray p-1 rounded-2xl border border-ramos-border">
                  {([t.female, t.male, t.other] as const).map((g) => (
                    <button key={g} onClick={() => setCreateForm({ gender: g })} className={cn("flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all", createForm.gender === g ? "bg-white text-ramos-accent shadow-sm" : "text-ramos-muted hover:text-ramos-black")}>{g}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] text-accent text-ramos-muted uppercase tracking-widest font-bold">{t.age}</label>
                <input type="number" min="1" max="120" value={createForm.age} onChange={(e) => setCreateForm({ age: parseInt(e.target.value) || 0 })} className="w-full bg-ramos-gray border border-ramos-border rounded-[24px] py-4 px-5 text-sm focus:outline-none focus:border-ramos-accent/50 transition-all font-medium" />
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-accent text-ramos-muted uppercase tracking-widest font-bold">{t.bio} ({t.maxChars.replace('{n}', '100')})</label>
              <button onClick={() => generateField('bio')} disabled={generatingField === 'bio'} className="text-[10px] text-ramos-accent font-bold uppercase tracking-widest flex items-center gap-1 disabled:opacity-50">{generatingField === 'bio' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}{t.generate}</button>
            </div>
            <textarea maxLength={100} value={createForm.bio} onChange={(e) => setCreateForm({ bio: e.target.value })} className="w-full bg-ramos-gray border border-ramos-border rounded-[24px] p-5 text-sm focus:outline-none focus:border-ramos-accent/50 transition-all resize-none font-medium" rows={3} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] text-accent text-ramos-muted uppercase tracking-widest font-bold">{t.occupation}</label>
                <button onClick={() => generateField('occupation')} disabled={generatingField === 'occupation'} className="text-[10px] text-ramos-accent font-bold uppercase tracking-widest flex items-center gap-1 disabled:opacity-50">{generatingField === 'occupation' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}{t.generate}</button>
              </div>
              <input type="text" value={createForm.occupation} onChange={(e) => setCreateForm({ occupation: e.target.value })} className="w-full bg-ramos-gray border border-ramos-border rounded-[24px] p-5 text-sm focus:outline-none focus:border-ramos-accent/50 transition-all font-medium" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] text-accent text-ramos-muted uppercase tracking-widest font-bold">{t.worldview}</label>
                <button onClick={() => generateField('world')} disabled={generatingField === 'world'} className="text-[10px] text-ramos-accent font-bold uppercase tracking-widest flex items-center gap-1 disabled:opacity-50">{generatingField === 'world' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}{t.generate}</button>
              </div>
              <input type="text" value={createForm.world} onChange={(e) => setCreateForm({ world: e.target.value })} className="w-full bg-ramos-gray border border-ramos-border rounded-[24px] p-5 text-sm focus:outline-none focus:border-ramos-accent/50 transition-all font-medium" />
            </div>
          </div>
        </motion.div>
      )}

      {createStep === 2 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
          <h3 className="text-2xl text-display">{t.personalitySettings}</h3>
          <div className="space-y-4">
            <label className="text-[10px] text-accent text-ramos-muted uppercase tracking-widest font-bold">{t.personalityTemplate}</label>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
              {PERSONALITY_TEMPLATES.map((tmpl) => (
                <button key={tmpl.id} onClick={() => setCreateForm({ personalityTemplate: tmpl.id })} title={language === 'en' ? tmpl.name_en : tmpl.name} className={cn("aspect-square rounded-2xl border-2 transition-all flex items-center justify-center text-xl", createForm.personalityTemplate === tmpl.id ? "bg-ramos-accent/10 border-ramos-accent" : "bg-white border-ramos-border hover:border-ramos-accent/30")}>{tmpl.icon}</button>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <label className="text-[10px] text-accent text-ramos-muted uppercase tracking-widest font-bold">{t.customPersonalityDesc}</label>
            <textarea value={createForm.personality} onChange={(e) => setCreateForm({ personality: e.target.value })} className="w-full bg-ramos-gray border border-ramos-border rounded-[24px] p-5 text-sm focus:outline-none focus:border-ramos-accent/50 transition-all resize-none font-medium" rows={4} placeholder={t.overwriteTemplate} />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-accent text-ramos-muted uppercase tracking-widest font-bold">{t.interests} ({t.maxInterests.replace('{n}', '6')})</label>
              <button onClick={() => generateField('interests')} disabled={generatingField === 'interests'} className="text-[10px] text-ramos-accent font-bold uppercase tracking-widest flex items-center gap-1 disabled:opacity-50">{generatingField === 'interests' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}{t.generate}</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { label: t.music, value: 'Music' }, { label: t.reading, value: 'Reading' },
                { label: t.gaming, value: 'Gaming' }, { label: t.cooking, value: 'Cooking' },
                { label: t.travel, value: 'Travel' }, { label: t.art, value: 'Art' },
                { label: t.coding, value: 'Coding' }, { label: t.sports, value: 'Sports' },
              ].map(interest => (
                <button key={interest.value} onClick={() => {
                  const interests = createForm.interests.includes(interest.value)
                    ? createForm.interests.filter((i: string) => i !== interest.value)
                    : createForm.interests.length < 6 ? [...createForm.interests, interest.value] : createForm.interests;
                  setCreateForm({ interests });
                }} className={cn("px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border", createForm.interests.includes(interest.value) ? "bg-ramos-accent text-white border-ramos-accent" : "bg-white text-ramos-muted border-ramos-border hover:border-ramos-accent/30")}>{interest.label}</button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {createStep === 3 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl text-display">{t.emotionalParams}</h3>
            {!isPremium && <span className="px-3 py-1 bg-ramos-gray rounded-full text-[8px] font-bold uppercase tracking-widest text-ramos-muted">🔒 {t.paidFeature}</span>}
          </div>
          <div className={cn("space-y-8", !isPremium && "opacity-50 pointer-events-none grayscale")}>
            {[
              { label: t.intensity, key: 'intensityDial' },
              { label: t.resilience, key: 'resilience' },
              { label: t.expressiveness, key: 'expressiveness' },
              { label: t.restraint, key: 'restraint' },
            ].map(param => (
              <div key={param.key} className="space-y-4">
                <div className="flex justify-between">
                  <label className="text-[10px] text-accent text-ramos-muted uppercase tracking-widest font-bold">{param.label}</label>
                  <span className="text-xs font-bold text-ramos-accent">{createForm.emotion[param.key as keyof typeof createForm.emotion]}%</span>
                </div>
                <input type="range" min="0" max="100" value={createForm.emotion[param.key as keyof typeof createForm.emotion]} onChange={(e) => setCreateForm({ emotion: { ...createForm.emotion, [param.key]: parseInt(e.target.value) } })} className="w-full accent-ramos-accent" />
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {createStep === 4 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl text-display">{t.behaviorSwitches}</h3>
            {!isPremium && <span className="px-3 py-1 bg-ramos-gray rounded-full text-[8px] font-bold uppercase tracking-widest text-ramos-muted">🔒 {t.paidFeature}</span>}
          </div>
          <div className={cn("space-y-6", !isPremium && "opacity-50 pointer-events-none grayscale")}>
            <div className="flex items-center justify-between p-6 bg-ramos-gray rounded-[24px]">
              <div>
                <p className="font-bold text-sm">{t.allowGrowth}</p>
                <p className="text-[10px] text-ramos-muted">{t.growthDescription}</p>
              </div>
              <button onClick={() => setCreateForm({ growth: { enabled: !createForm.growth.enabled } })} className={cn("w-12 h-6 rounded-full transition-all relative", createForm.growth.enabled ? "bg-ramos-accent" : "bg-ramos-border")}>
                <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", createForm.growth.enabled ? "left-7" : "left-1")} />
              </button>
            </div>
            <div className="flex items-center justify-between p-6 bg-ramos-gray rounded-[24px]">
              <div>
                <p className="font-bold text-sm">{t.proactiveContact}</p>
                <p className="text-[10px] text-ramos-muted">{t.proactiveDescription}</p>
              </div>
              <button onClick={() => setCreateForm({ proactive: { enabled: !createForm.proactive.enabled } })} className={cn("w-12 h-6 rounded-full transition-all relative", createForm.proactive.enabled ? "bg-ramos-accent" : "bg-ramos-border")}>
                <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", createForm.proactive.enabled ? "left-7" : "left-1")} />
              </button>
            </div>
            <div className="space-y-4">
              <label className="text-[10px] text-accent text-ramos-muted uppercase tracking-widest font-bold">{t.rpMode}</label>
              <div className="flex bg-ramos-gray p-1 rounded-2xl border border-ramos-border">
                {(['off', 'sfw', 'nsfw'] as const).map((mode) => (
                  <button key={mode} onClick={() => { if (mode === 'nsfw') setShowAgeVerification(true); setCreateForm({ rpMode: mode }); }} className={cn("flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1", createForm.rpMode === mode ? "bg-white text-ramos-accent shadow-sm" : "text-ramos-muted hover:text-ramos-black")}>
                    {mode === 'nsfw' && <Shield className="w-3 h-3" />}
                    {mode.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {createStep === 5 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
          <h3 className="text-2xl text-display">{t.appearance}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {APPEARANCE_STYLES.map((style) => (
              <button key={style.id} onClick={() => setCreateForm({ appearanceStyle: style.id })} className={cn("p-4 rounded-[32px] border-2 transition-all flex flex-col items-center gap-2", createForm.appearanceStyle === style.id ? "bg-ramos-accent/5 border-ramos-accent" : "bg-white border-ramos-border hover:border-ramos-accent/30")}>
                <span className="text-3xl">{style.icon}</span>
                <span className="font-bold text-[10px] uppercase tracking-widest">{style.name}</span>
              </button>
            ))}
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-accent text-ramos-muted uppercase tracking-widest font-bold">{t.appearanceDesc}</label>
              <button onClick={() => generateField('appearanceDescription')} disabled={generatingField === 'appearanceDescription'} className="text-[10px] text-ramos-accent font-bold uppercase tracking-widest flex items-center gap-1 disabled:opacity-50">{generatingField === 'appearanceDescription' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}{t.generate}</button>
            </div>
            <textarea value={createForm.appearanceDescription} onChange={(e) => setCreateForm({ appearanceDescription: e.target.value })} className="w-full bg-ramos-gray border border-ramos-border rounded-[24px] p-5 text-sm focus:outline-none focus:border-ramos-accent/50 transition-all resize-none font-medium" rows={3} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="aspect-square rounded-3xl bg-ramos-gray border border-ramos-border flex items-center justify-center overflow-hidden relative group">
                {createForm.images[i-1] ? (
                  <img src={createForm.images[i-1]} className="w-full h-full object-cover" />
                ) : (
                  <PlusCircle className="w-6 h-6 text-ramos-muted opacity-30" />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button className="p-2 bg-white rounded-full text-ramos-black shadow-lg"><RefreshCw className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full py-4 bg-ramos-gray border border-ramos-border rounded-[24px] text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-ramos-border transition-all">
            <FileUp className="w-4 h-4" />
            {t.uploadPhoto}
          </button>
        </motion.div>
      )}

      {createStep === 6 && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
          <h3 className="text-2xl text-display">{t.confirm}</h3>
          <div className="bento-card p-8 space-y-6">
            <div className="flex items-center gap-6">
              <img src={`https://picsum.photos/seed/${createForm.name}/400/400`} className="w-24 h-24 rounded-[32px] object-cover border-2 border-ramos-accent shadow-lg" />
              <div>
                <h4 className="text-3xl text-display">{createForm.name}</h4>
                <p className="text-xs text-ramos-muted font-medium">{createForm.occupation} • {createForm.age} {t.years}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-ramos-gray rounded-2xl">
                <p className="text-[8px] text-ramos-muted uppercase tracking-widest font-bold mb-1">{t.personality}</p>
                <p className="text-xs font-bold">{language === 'en' ? PERSONALITY_TEMPLATES.find(t => t.id === createForm.personalityTemplate)?.name_en || PERSONALITY_TEMPLATES.find(t => t.id === createForm.personalityTemplate)?.name : PERSONALITY_TEMPLATES.find(t => t.id === createForm.personalityTemplate)?.name || t.custom}</p>
              </div>
              <div className="p-4 bg-ramos-gray rounded-2xl">
                <p className="text-[8px] text-ramos-muted uppercase tracking-widest font-bold mb-1">{t.style}</p>
                <p className="text-xs font-bold">{language === 'en' ? APPEARANCE_STYLES.find(t => t.id === createForm.appearanceStyle)?.name_en || APPEARANCE_STYLES.find(t => t.id === createForm.appearanceStyle)?.name : APPEARANCE_STYLES.find(t => t.id === createForm.appearanceStyle)?.name || t.custom}</p>
              </div>
            </div>
            <div className="p-4 bg-ramos-gray rounded-2xl">
              <p className="text-[8px] text-ramos-muted uppercase tracking-widest font-bold mb-1">{t.bio}</p>
              <p className="text-xs leading-relaxed">{createForm.bio || t.noBio}</p>
            </div>
          </div>
          <div className="flex items-center justify-between p-6 bg-ramos-gray rounded-[24px]">
            <span className="text-xs font-bold text-ramos-muted uppercase tracking-widest">{t.energyCost}</span>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-ramos-accent fill-current" />
              <span className="text-xl font-bold text-ramos-accent">100</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ─── IMPORT FLOW ─── */
function ImportFlow({ t, language, createForm, createStep, importType, importUrl, importFile, importPreview, setCreateForm, setImportType, setImportUrl, setCreateStep, handleImportFile, fileInputRef }: {
  t: Translations; language: string; createForm: CreateFormState; createStep: number;
  importType: 'file' | 'url'; importUrl: string; importFile: File | null; importPreview: ImportPreview | null;
  setCreateForm: (f: Partial<CreateFormState>) => void; setImportType: (t: 'file' | 'url') => void;
  setImportUrl: (url: string) => void; setCreateStep: (step: number) => void;
  handleImportFile: (file: File) => Promise<void>; fileInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div className="space-y-8">
      {createStep === 1 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
          <h3 className="text-2xl text-display">{t.chooseImportMethod}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button onClick={() => { setImportType('file'); setCreateStep(2); }} className="p-10 bg-white border-2 border-ramos-border rounded-[40px] hover:border-ramos-accent transition-all flex flex-col items-center gap-6 group">
              <div className="w-20 h-20 rounded-[32px] bg-ramos-gray flex items-center justify-center group-hover:bg-ramos-accent group-hover:text-white transition-all"><FileUp className="w-10 h-10" /></div>
              <div className="text-center"><h4 className="text-xl font-bold mb-2">{t.importFile}</h4><p className="text-xs text-ramos-muted">{t.supportFormats}</p></div>
            </button>
            <button onClick={() => { setImportType('url'); setCreateStep(2); }} className="p-10 bg-white border-2 border-ramos-border rounded-[40px] hover:border-ramos-accent transition-all flex flex-col items-center gap-6 group">
              <div className="w-20 h-20 rounded-[32px] bg-ramos-gray flex items-center justify-center group-hover:bg-ramos-accent group-hover:text-white transition-all"><Languages className="w-10 h-10" /></div>
              <div className="text-center"><h4 className="text-xl font-bold mb-2">{t.pasteUrl}</h4><p className="text-xs text-ramos-muted">{t.importFromSillyTavern}</p></div>
            </button>
          </div>
        </motion.div>
      )}

      {createStep === 2 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
          <h3 className="text-2xl text-display">{importType === 'file' ? t.importFile : t.pasteUrl}</h3>
          {importType === 'file' ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e) => { e.preventDefault(); e.stopPropagation(); const f = e.dataTransfer.files[0]; if (f) handleImportFile(f); }}
              className="border-2 border-dashed border-ramos-border rounded-[40px] p-12 flex flex-col items-center justify-center gap-6 bg-ramos-gray/30 hover:bg-ramos-gray transition-all cursor-pointer"
            >
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm"><PlusCircle className="w-8 h-8 text-ramos-accent" /></div>
              <div className="text-center">
                {importFile ? (<><p className="font-bold text-lg mb-1">{importFile.name}</p><p className="text-xs text-ramos-muted">{(importFile.size / 1024).toFixed(1)} KB</p></>) : (<><p className="font-bold text-lg mb-1">{t.selectFile}</p><p className="text-xs text-ramos-muted">{t.dragAndDrop}</p></>)}
              </div>
              <input ref={fileInputRef} type="file" accept=".json,.png" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImportFile(f); }} className="hidden" />
            </div>
          ) : (
            <div className="space-y-4">
              <label className="text-[10px] text-accent text-ramos-muted uppercase tracking-widest font-bold">URL</label>
              <input type="text" value={importUrl} onChange={(e) => setImportUrl(e.target.value)} placeholder="https://..." className="w-full bg-ramos-gray border border-ramos-border rounded-[24px] p-5 text-sm focus:outline-none focus:border-ramos-accent/50 transition-all font-medium" />
              <p className="text-[10px] text-ramos-muted italic">{t.pasteUrlDescription}</p>
            </div>
          )}
        </motion.div>
      )}

      {createStep === 3 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
          <h3 className="text-2xl text-display">{t.parsePreview}</h3>
          {importPreview?.error ? (
            <div className="p-6 bg-red-50 border border-red-200 rounded-[24px] text-red-700 text-sm">{importPreview.error}</div>
          ) : (
            <div className="bento-card p-8 space-y-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-[28px] bg-ramos-gray flex items-center justify-center"><PlusCircle className="w-10 h-10 text-ramos-muted opacity-30" /></div>
                <div>
                  <h4 className="text-2xl font-bold">{importPreview?.name || createForm.name || t.unknown}</h4>
                  <p className="text-xs text-ramos-muted">{importPreview?.personality?.slice(0, 80) || t.noPersonalityData}{(importPreview?.personality?.length || 0) > 80 ? '...' : ''}</p>
                </div>
              </div>
              {importPreview?.firstMes && (
                <div className="p-4 bg-ramos-gray/50 rounded-2xl">
                  <p className="text-[10px] text-ramos-muted uppercase tracking-widest font-bold mb-2">{t.greeting}</p>
                  <p className="text-sm text-ramos-muted italic">{importPreview.firstMes.slice(0, 200)}{importPreview.firstMes.length > 200 ? '...' : ''}</p>
                </div>
              )}
              <div className="space-y-4">
                <label className="text-[10px] text-accent text-ramos-muted uppercase tracking-widest font-bold">{t.bio}</label>
                <textarea value={createForm.bio} onChange={(e) => setCreateForm({ bio: e.target.value })} className="w-full bg-ramos-gray border border-ramos-border rounded-[24px] p-5 text-sm focus:outline-none focus:border-ramos-accent/50 transition-all resize-none font-medium" rows={3} />
              </div>
              {importPreview?.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {importPreview.tags.slice(0, 10).map((tag: string, i: number) => (
                    <span key={i} className="px-3 py-1 bg-ramos-gray rounded-full text-[10px] font-bold text-ramos-muted uppercase tracking-wider">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {createStep === 4 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
          <h3 className="text-2xl text-display">{t.appearance}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {APPEARANCE_STYLES.map((style) => (
              <button key={style.id} onClick={() => setCreateForm({ appearanceStyle: style.id })} className={cn("p-4 rounded-[32px] border-2 transition-all flex flex-col items-center gap-2", createForm.appearanceStyle === style.id ? "bg-ramos-accent/5 border-ramos-accent" : "bg-white border-ramos-border hover:border-ramos-accent/30")}>
                <span className="text-3xl">{style.icon}</span>
                <span className="font-bold text-[10px] uppercase tracking-widest">{style.name}</span>
              </button>
            ))}
          </div>
          <div className="relative">
            <button disabled className="w-full py-6 bg-ramos-accent/40 text-white rounded-[32px] font-bold uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl cursor-not-allowed">
              <Sparkles className="w-6 h-6" />
              {t.generatePhotos}
            </button>
            <span className="absolute top-1/2 right-6 -translate-y-1/2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[9px] font-bold text-white uppercase tracking-widest">{t.comingSoon}</span>
          </div>
        </motion.div>
      )}

      {createStep === 5 && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
          <h3 className="text-2xl text-display">{t.confirm}</h3>
          <div className="flex items-center justify-between p-6 bg-ramos-gray rounded-[24px]">
            <span className="text-xs font-bold text-ramos-muted uppercase tracking-widest">{t.energyCost}</span>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-ramos-accent fill-current" />
              <span className="text-xl font-bold text-ramos-accent">100</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ─── AGE VERIFICATION MODAL ─── */
function AgeVerificationModal({ t, setShowAgeVerification, setCreateForm }: {
  t: Translations; setShowAgeVerification: (v: boolean) => void; setCreateForm: (f: Partial<CreateFormState>) => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-6">
      <div className="w-full max-w-sm bg-white rounded-[40px] p-10 text-center space-y-8 shadow-2xl">
        <div className="w-20 h-20 bg-ramos-accent/10 rounded-full flex items-center justify-center mx-auto">
          <Shield className="w-10 h-10 text-ramos-accent" />
        </div>
        <div className="space-y-3">
          <h3 className="text-2xl text-display">{t.ageVerification}</h3>
          <p className="text-sm text-ramos-muted leading-relaxed">{t.ageVerificationDesc}</p>
        </div>
        <div className="flex flex-col gap-3">
          <button onClick={() => setShowAgeVerification(false)} className="w-full py-5 bg-ramos-accent text-white rounded-full font-bold text-sm shadow-lg shadow-ramos-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all">{t.confirmAge}</button>
          <button onClick={() => { setShowAgeVerification(false); setCreateForm({ rpMode: 'sfw' }); }} className="w-full py-5 bg-ramos-gray text-ramos-muted rounded-full font-bold text-sm hover:bg-ramos-border transition-all">{t.cancel}</button>
        </div>
      </div>
    </div>
  );
}
