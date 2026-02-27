-- Migration 002: Creatures, Chat, Friends, Daily Check-ins
-- Run: psql -U clawti -d clawti -f db/002_creatures_chat_friends.sql

-- Creatures / Characters
CREATE TABLE IF NOT EXISTS creatures (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id        TEXT NOT NULL,
  name              TEXT NOT NULL,
  bio               TEXT DEFAULT '',
  personality       TEXT DEFAULT '',
  greeting          TEXT DEFAULT '',
  first_mes         TEXT DEFAULT '',
  gender            TEXT DEFAULT '',
  age               INT,
  occupation        TEXT DEFAULT '',
  world_description TEXT DEFAULT '',
  photos            TEXT[] DEFAULT '{}',
  rating            NUMERIC(3,1) DEFAULT 0,
  is_public         BOOLEAN DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_creatures_public ON creatures(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_creatures_creator ON creatures(creator_id);

-- User ↔ Creature friends (junction)
CREATE TABLE IF NOT EXISTS user_friends (
  user_id      TEXT NOT NULL,
  creature_id  UUID NOT NULL REFERENCES creatures(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, creature_id)
);

-- Chat message history
CREATE TABLE IF NOT EXISTS chat_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL,
  creature_id UUID NOT NULL REFERENCES creatures(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_lookup ON chat_messages(user_id, creature_id, created_at);

-- Daily check-in (one per user per day)
CREATE TABLE IF NOT EXISTS daily_checkins (
  user_id       TEXT NOT NULL,
  checked_in_at DATE NOT NULL DEFAULT CURRENT_DATE,
  energy_gained INT DEFAULT 50,
  created_at    TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, checked_in_at)
);

-- Seed the 6 default characters with deterministic UUIDs
-- creator_id = system sentinel so isCustom = false in creatureMapper
INSERT INTO creatures (id, creator_id, name, bio, personality, greeting, first_mes, gender, age, occupation, world_description, photos, rating, is_public)
VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000',
   'Luna', '月光下的神秘占卜师，能看透人心的秘密。', '神秘, 温柔, 智慧',
   '你好，我感应到你的到来了...让我看看星象对你说了什么。',
   '你好，我感应到你的到来了...让我看看星象对你说了什么。',
   '女', 22, '占卜师', '一个充满星光和水晶球的神秘占卜小屋',
   ARRAY['https://picsum.photos/seed/luna/400/400'], 4.8, true),

  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000',
   'Nova', '来自未来的AI研究员，对人类情感充满好奇。', '好奇, 聪明, 活泼',
   '嗨！我是Nova，一个来自2150年的研究员。你能告诉我，现在的人类是怎么恋爱的吗？',
   '嗨！我是Nova，一个来自2150年的研究员。你能告诉我，现在的人类是怎么恋爱的吗？',
   '女', 25, '研究员', '一个充满全息投影的未来实验室',
   ARRAY['https://picsum.photos/seed/nova/400/400'], 4.9, true),

  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000',
   'Atlas', '沉默寡言的冒险家，背负着未知的过去。', '沉稳, 勇敢, 神秘',
   '...你也是来寻找答案的吗？这条路很危险，但也许...我们可以同行。',
   '...你也是来寻找答案的吗？这条路很危险，但也许...我们可以同行。',
   '男', 28, '冒险家', '被遗忘的古代遗迹和无尽的荒野',
   ARRAY['https://picsum.photos/seed/atlas/400/400'], 4.7, true),

  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000',
   'Eara', '森林精灵族的末裔，守护着最后一片魔法森林。', '善良, 自然, 坚定',
   '欢迎来到翡翠森林...请轻声说话，树木们正在倾听。',
   '欢迎来到翡翠森林...请轻声说话，树木们正在倾听。',
   '女', 200, '森林守护者', '一片充满魔法生物和古老树木的翡翠森林',
   ARRAY['https://picsum.photos/seed/eara/400/400'], 4.6, true),

  ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000',
   'Kael', '堕落天使，在人间寻找救赎的意义。', '傲慢, 深情, 矛盾',
   '又一个凡人...不过，你的眼神倒是有些不同。说吧，你想要什么？',
   '又一个凡人...不过，你的眼神倒是有些不同。说吧，你想要什么？',
   '男', 1000, '堕天使', '人间与天界的交界处，一个永恒黄昏的世界',
   ARRAY['https://picsum.photos/seed/kael/400/400'], 4.9, true),

  ('00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000',
   'Seraphina', '皇家首席魔法师，外表冷漠内心炽热。', '高冷, 强大, 细腻',
   '我是Seraphina，皇家魔法师。如果你是来浪费我时间的，现在就可以离开了。',
   '我是Seraphina，皇家魔法师。如果你是来浪费我时间的，现在就可以离开了。',
   '女', 26, '魔法师', '一座浮空的魔法塔，俯瞰整个王国',
   ARRAY['https://picsum.photos/seed/seraphina/400/400'], 4.8, true)
ON CONFLICT (id) DO NOTHING;
