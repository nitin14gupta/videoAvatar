-- Users table
-- Columns: id (uuid/text PK), name (text), email (text unique), password_hash (text), created_at (timestamptz)
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

CREATE TABLE IF NOT EXISTS email_verifications (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email);

-- Create index on expires_at for cleanup operations
CREATE INDEX IF NOT EXISTS idx_email_verifications_expires_at ON email_verifications(expires_at);

-- Password reset codes table
-- Columns: email (text primary key), code (text), expires_at bigint (epoch seconds)
create table if not exists public.password_resets (
  email text primary key,
  code text not null,
  expires_at bigint not null
);

-- Avatars table
-- Stores both default system avatars and user-created avatars
create table if not exists public.avatars (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role_title text not null,
  description text,
  image_url text not null,
  audio_url text,
  language text default 'en',
  specialty text,
  personality text,
  template_prompt text,
  theme_color text,
  active boolean default true,
  created_by text not null, -- 'system' for default avatars, user_id for user-created
  training_status text default 'complete', -- 'pending', 'complete', 'failed' (for custom avatars)
  blinking_video_url text, -- R2 URL to pre-generated blinking animation video
  thinking_sound_url text, -- R2 URL to pre-generated thinking sound (backward compatibility - first variation)
  thinking_sound_urls text, -- JSON array of R2 URLs to multiple thinking sound variations (3-4 variations for natural variety)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create indexes for faster lookups
create index if not exists idx_avatars_created_by on public.avatars(created_by);
create index if not exists idx_avatars_active on public.avatars(active);
create index if not exists idx_avatars_role_title on public.avatars(role_title);
create index if not exists idx_avatars_training_status on public.avatars(training_status);

-- Conversations table
-- Stores conversation sessions between users and avatars
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  avatar_id uuid not null references public.avatars(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Messages table
-- Stores individual messages in conversations
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender text not null, -- 'user' or 'avatar'
  content text not null,
  created_at timestamptz not null default now()
);

-- Create indexes for faster lookups
create index if not exists idx_conversations_user_id on public.conversations(user_id);
create index if not exists idx_conversations_avatar_id on public.conversations(avatar_id);
create index if not exists idx_messages_conversation_id on public.messages(conversation_id);
create index if not exists idx_messages_created_at on public.messages(created_at);

-- Insert default avatars (created_by = 'system')
-- Doctor Avatar
INSERT INTO public.avatars (
    name, role_title, description, image_url, audio_url, language, specialty, 
    personality, template_prompt, theme_color, active, created_by
) VALUES (
    'Dr. Priya Sharma',
    'Dentist Specialist',
    'AI-Powered Oral Health Expert',
    'https://ccscontent.mafatlaleducation.dev/avatars/c476fded-87f4-40ab-9abf-21a783acd48d.png',
    'https://ccscontent.mafatlaleducation.dev/voices/4ea35882-3c87-4f75-86bd-7cfc1d2ac4bf.mp3',
    'en',
    'Dentistry',
    'Calm, reassuring, and educational',
    'You are a friendly, knowledgeable dentist assistant. Answer concisely and clearly for common oral health questions. Provide helpful advice about dental care, oral hygiene, and when to see a dentist.',
    '#4e99ff',
    true,
    'system'
) ON CONFLICT DO NOTHING;

-- Teacher Avatar
INSERT INTO public.avatars (
    name, role_title, description, image_url, audio_url, language, specialty, 
    personality, template_prompt, theme_color, active, created_by
) VALUES (
    'Prof. Sarah Johnson',
    'Educator',
    'Experienced AI Teaching Assistant',
    'https://ccscontent.mafatlaleducation.dev/avatars/538b8635-d019-47a6-a6c1-acfca60b4302.webp',
    'https://ccscontent.mafatlaleducation.dev/voices/c9e7191e-0540-4d13-ae0d-2964cf4511cf.mp3',
    'en',
    'General Education',
    'Patient, encouraging, and clear',
    'You are an experienced and patient educator. Help students understand concepts clearly, provide examples, and encourage learning. Break down complex topics into digestible parts and adapt your teaching style to the student''s needs.',
    '#0fffc3',
    true,
    'system'
) ON CONFLICT DO NOTHING;