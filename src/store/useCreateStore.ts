'use client';

import { create } from 'zustand';
import type { Character, CreateFormState, ImportPreview } from '../types';
import { api } from '../api/client';
import { PERSONALITY_TEMPLATES } from '../data/personalityTemplates';

const DEFAULT_FORM: CreateFormState = {
  name: '',
  gender: 'Other',
  age: 18,
  personalityTemplate: '',
  appearanceStyle: '',
  bio: '',
  tags: [],
  occupation: '',
  world: '',
  personality: '',
  interests: [],
  values: [],
  emotion: { intensityDial: 50, resilience: 50, expressiveness: 50, restraint: 50 },
  growth: { enabled: false },
  proactive: { enabled: false },
  rpMode: 'off',
  appearanceDescription: '',
  images: [],
};

interface CreateState {
  createFlow: 'simple' | 'detailed' | 'import';
  createStep: number;
  createForm: CreateFormState;
  isGenerating: boolean;
  generatingField: string | null;
  isPremium: boolean;
  showAgeVerification: boolean;
  importType: 'file' | 'url';
  importUrl: string;
  importFile: File | null;
  importPreview: ImportPreview | null;
}

interface CreateActions {
  setCreateFlow: (flow: CreateState['createFlow']) => void;
  setCreateStep: (step: number) => void;
  setCreateForm: (form: Partial<CreateFormState>) => void;
  setIsPremium: (v: boolean) => void;
  setShowAgeVerification: (v: boolean) => void;
  setImportType: (t: 'file' | 'url') => void;
  setImportUrl: (url: string) => void;
  setImportFile: (file: File | null) => void;
  setImportPreview: (preview: ImportPreview | null) => void;
  resetForm: () => void;
  handleImportFile: (file: File) => Promise<void>;
  generateFieldText: (field: string) => Promise<void>;
  handleGenerateCharacter: (
    onSuccess: (char: Character) => void,
    onEnergyUpdate: (e: number) => void
  ) => Promise<void>;
}

export const useCreateStore = create<CreateState & CreateActions>((set, get) => ({
  createFlow: 'simple',
  createStep: 1,
  createForm: { ...DEFAULT_FORM },
  isGenerating: false,
  generatingField: null,
  isPremium: false,
  showAgeVerification: false,
  importType: 'file',
  importUrl: '',
  importFile: null,
  importPreview: null,

  setCreateFlow: (flow) => set({ createFlow: flow, createStep: 1 }),
  setCreateStep: (step) => set({ createStep: step }),
  setCreateForm: (form) => set(s => ({ createForm: { ...s.createForm, ...form } })),
  setIsPremium: (v) => set({ isPremium: v }),
  setShowAgeVerification: (v) => set({ showAgeVerification: v }),
  setImportType: (t) => set({ importType: t }),
  setImportUrl: (url) => set({ importUrl: url }),
  setImportFile: (file) => set({ importFile: file }),
  setImportPreview: (preview) => set({ importPreview: preview }),
  resetForm: () => set({ createForm: { ...DEFAULT_FORM }, createStep: 1, importFile: null, importPreview: null, importUrl: '' }),

  generateFieldText: async (field) => {
    const { createForm } = get();
    set({ generatingField: field });
    try {
      const context: Record<string, unknown> = {
        name: createForm.name,
        gender: createForm.gender,
        age: createForm.age,
        personality: createForm.personality || createForm.personalityTemplate,
        occupation: createForm.occupation,
        appearanceStyle: createForm.appearanceStyle,
      };
      const result = await api.generate.text(field, context);
      if (result.text) {
        if (field === 'interests') {
          // Parse comma-separated interests
          const interests = result.text.split(',').map((s: string) => s.trim()).filter(Boolean).slice(0, 6);
          set(s => ({ createForm: { ...s.createForm, interests } }));
        } else {
          set(s => ({ createForm: { ...s.createForm, [field]: result.text } }));
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Generation failed';
      console.error(`Failed to generate ${field}:`, msg);
      alert(`AI generation failed: ${msg}`);
    } finally {
      set({ generatingField: null });
    }
  },

  handleImportFile: async (file) => {
    set({ importFile: file });
    try {
      let cardData: Record<string, unknown> | null = null;

      if (file.name.endsWith('.json')) {
        const text = await file.text();
        cardData = JSON.parse(text);
      } else if (file.name.endsWith('.png')) {
        const buf = await file.arrayBuffer();
        const bytes = new Uint8Array(buf);
        let offset = 8;
        // PNG chunk format: 4-byte length + 4-byte type + data + 4-byte CRC
        while (offset + 12 <= bytes.length) {
          const len = (bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3];
          // Guard against malformed chunks (negative/huge length)
          if (len < 0 || len > bytes.length - offset - 12) break;
          const type = String.fromCharCode(bytes[offset + 4], bytes[offset + 5], bytes[offset + 6], bytes[offset + 7]);
          if (type === 'tEXt' || type === 'iTXt') {
            const chunkData = bytes.slice(offset + 8, offset + 8 + len);
            const str = new TextDecoder('latin1').decode(chunkData);
            const nullIdx = str.indexOf('\0');
            if (nullIdx > 0 && str.substring(0, nullIdx) === 'chara') {
              cardData = JSON.parse(atob(str.substring(nullIdx + 1)));
              break;
            }
          }
          offset += 12 + len;
        }
      }

      if (!cardData) {
        set({ importPreview: { error: 'Could not parse card data from file' } });
        return;
      }

      const card = (cardData.data as Record<string, unknown>) || cardData;
      const parsed: ImportPreview = {
        name: (card.name || card.char_name || '') as string,
        description: (card.description || '') as string,
        personality: (card.personality || '') as string,
        firstMes: (card.first_mes || card.firstMes || card.greeting || '') as string,
        mesExample: (card.mes_example || card.mesExample || '') as string,
        scenario: (card.scenario || '') as string,
        creatorNotes: (card.creator_notes || card.creatorNotes || '') as string,
        tags: (card.tags || []) as string[],
      };

      set({
        importPreview: parsed,
        createForm: {
          ...get().createForm,
          name: parsed.name || '',
          bio: (parsed.description || '').slice(0, 500),
          personality: parsed.personality || '',
          world: parsed.scenario || '',
          tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 10) : [],
        },
        createStep: 3,
      });
    } catch (err) {
      set({ importPreview: { error: (err as Error).message || 'Failed to parse file' } });
    }
  },

  handleGenerateCharacter: async (onSuccess, onEnergyUpdate) => {
    const { createForm, isPremium, importPreview } = get();
    if (!createForm.name) return;
    set({ isGenerating: true });

    try {
      const templatePersonality = PERSONALITY_TEMPLATES.find(t => t.id === createForm.personalityTemplate);
      const result = await api.creatures.create({
        name: createForm.name,
        card: {
          personality: createForm.personality || templatePersonality?.desc || '',
          description: importPreview?.description || createForm.bio || '',
          firstMes: importPreview?.firstMes || '',
          mesExample: importPreview?.mesExample || '',
          scenario: importPreview?.scenario || createForm.world || '',
          creatorNotes: importPreview?.creatorNotes || '',
        },
        metadata: {
          gender: createForm.gender,
          age: createForm.age,
          bio: createForm.bio,
          tags: createForm.tags,
          occupation: createForm.occupation,
          worldDescription: createForm.world,
          photos: createForm.images,
          appearanceStyle: createForm.appearanceStyle,
        },
        mode: isPremium ? 'enhanced' : 'classic',
      });

      onSuccess({
        id: result.agentId || result.agent_id || result.id || Date.now().toString(),
        name: createForm.name,
        tagline: createForm.bio || '',
        description: createForm.world || createForm.bio || '',
        avatar: createForm.images[0] || `https://picsum.photos/seed/${createForm.name}/400/400`,
        images: createForm.images,
        personality: createForm.personality || templatePersonality?.desc || '',
        greeting: '',
        gender: createForm.gender,
        age: createForm.age,
        occupation: createForm.occupation,
        isCustom: true,
      });

      if (result.energyRemaining != null) onEnergyUpdate(result.energyRemaining);
      else if (result.energy != null) onEnergyUpdate(result.energy);

      set({ createForm: { ...DEFAULT_FORM }, createStep: 1, importFile: null, importPreview: null, importUrl: '' });
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to create creature');
    } finally {
      set({ isGenerating: false });
    }
  },
}));
