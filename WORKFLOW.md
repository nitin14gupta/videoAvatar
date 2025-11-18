# Complete Workflow: User Speaking to Avatar Listening

## Overview
This document describes the complete end-to-end flow from when a user speaks to when they hear the avatar's response, including all database operations and R2 storage interactions.

---

## Step-by-Step Flow

### 1. **User Starts Recording** (Frontend: `Session/[id]/page.tsx`)

**Location:** `client/src/app/(routes)/Session/[id]/page.tsx`

**What happens:**
- User clicks the microphone button
- `startRecording()` function is called
- WebSocket connection to Whisper is established
- Web Audio API captures raw PCM audio from microphone
- Audio is converted from float32 to int16 PCM format
- Audio chunks are sent via WebSocket to backend every ~100ms

**Technical details:**
- Uses `ScriptProcessorNode` to capture audio directly (no encoding/decoding)
- Sample rate: 16kHz (required by Whisper)
- Format: PCM 16-bit mono
- Buffer size: 4096 samples

---

### 2. **Speech-to-Text Processing** (Backend: Whisper WebSocket)

**Location:** `server/routes/whisper_routes.py`

**What happens:**
- WebSocket receives PCM audio chunks
- Audio is converted from int16 to float32 and normalized to [-1, 1]
- Audio chunks are fed to Faster Whisper ASR (Online ASR Processor)
- Optional: Voice Activity Detection (VAD) using Silero VAD
- Whisper transcribes audio in real-time
- Partial transcriptions are sent back via WebSocket

**Technical details:**
- Model: Faster Whisper "base" model
- Device: CUDA (GPU) if available, else CPU
- Sample rate: 16kHz
- Language: Detected automatically or set to "en"
- Latency: ~3.3 seconds with LocalAgreement policy

**WebSocket messages sent:**
```json
{
  "type": "transcription",
  "text": "partial or complete transcription",
  "start": 0.0,
  "end": 5.2
}
```

---

### 3. **User Stops Recording** (Frontend)

**Location:** `client/src/app/(routes)/Session/[id]/page.tsx`

**What happens:**
- User clicks microphone button again
- `stopRecording()` is called
- WebSocket connection is closed
- Final transcription is collected
- Transcription is sent to LLM via `sendToLLM()`

**Data sent:**
```typescript
{
  avatar_id: "uuid",
  message: "transcribed text",
  conversation_id: "uuid or undefined"
}
```

---

### 4. **LLM Processing** (Backend: Conversation Route)

**Location:** `server/routes/conversation_routes.py` → `chat_with_avatar()`

**What happens:**

#### 4.1. **Get Avatar Details**
- Query Supabase `avatars` table
- Fetch avatar's `template_prompt`, `personality`, `name`, `role_title`, `audio_url`, `language`
- If avatar not found → 404 error

#### 4.2. **Get or Create Conversation**
- If `conversation_id` provided:
  - Verify conversation exists and belongs to user
  - Use existing conversation
- If no `conversation_id`:
  - Create new conversation in `conversations` table
  - Fields: `user_id`, `avatar_id`, `created_at`, `updated_at`
  - Returns new `conversation_id`

#### 4.3. **Get Conversation History**
- Query `messages` table for last 10 messages in conversation
- Order by `created_at` ascending
- Build context for LLM

#### 4.4. **Build LLM Messages**
- System message: Avatar's `template_prompt` (or default prompt)
- History messages: Previous user/avatar exchanges
- Current user message: Transcribed text

#### 4.5. **Call LLM**
- Use LangChain with OpenRouter API
- Model: `google/gemini-2.5-flash` (configurable)
- Temperature: 0.7
- Get conversational response

#### 4.6. **Save Messages to Database**
- Save user message to `messages` table:
  - `conversation_id`, `sender: "user"`, `content`, `created_at`
- Save avatar response to `messages` table:
  - `conversation_id`, `sender: "avatar"`, `content`, `created_at`
- Update conversation `updated_at` timestamp

---

### 5. **Text-to-Speech Generation** (Backend: TTS Utility)

**Location:** `server/utils/tts_utils.py` → `text_to_speech_with_voice_cloning()`

**What happens:**

#### 5.1. **Download Reference Audio**
- Download avatar's `audio_url` (reference voice sample)
- Save to temp file: `ref_audio_{pid}.wav`
- This is the 6+ second audio sample used for voice cloning

#### 5.2. **Initialize TTS Model** (Singleton)
- Load XTTS-v2 model: `tts_models/multilingual/multi-dataset/xtts_v2`
- Device: CUDA if available, else CPU
- Apply patch for `GPT2InferenceModel.generate()` if needed
- Model is cached globally (only loads once)

#### 5.3. **Generate Speech**
- Call `tts.tts_to_file()` with:
  - `text`: LLM response
  - `speaker_wav`: Path to reference audio
  - `language`: Avatar's language (default: "en")
- Output: WAV file at 24kHz sample rate
- Save to temp file: `tts_output_{pid}.wav`

#### 5.4. **Verify Sample Rate**
- Check if audio is at 24kHz
- If not, resample using librosa to 24kHz
- This ensures proper playback speed

#### 5.5. **Cleanup Reference Audio**
- Delete temporary reference audio file

---

### 6. **Upload to R2 Storage** (Backend: R2 Client)

**Location:** `server/utils/r2_client.py` → `upload_file()`

**What happens:**

#### 6.1. **Prepare File**
- Read generated TTS audio file
- Convert to `BytesIO` object
- Generate unique filename: `{uuid}.wav`

#### 6.2. **Upload to R2**
- Folder: `tts/`
- Key: `tts/{uuid}.wav`
- Content-Type: `audio/wav`
- ACL: `public-read` (so frontend can access)

#### 6.3. **Get Public URL**
- Construct URL: `{R2_BASEURL}/tts/{uuid}.wav`
- Example: `https://ccscontent.mafatlaleducation.dev/tts/abc123.wav`

#### 6.4. **Cleanup**
- Delete temporary TTS audio file from server

**R2 Storage Structure:**
```
R2 Bucket: content-generation
├── avatars/
│   ├── {uuid}.png (avatar images)
│   └── {uuid}.webp
├── voices/
│   └── {uuid}.mp3 (reference audio samples)
└── tts/
    └── {uuid}.wav (generated TTS audio) ← NEW
```

---

### 7. **Return Response to Frontend** (Backend)

**Location:** `server/routes/conversation_routes.py`

**Response sent:**
```json
{
  "conversation_id": "uuid",
  "message": "user's transcribed text",
  "avatar_response": "LLM generated text",
  "audio_url": "https://ccscontent.mafatlaleducation.dev/tts/abc123.wav"
}
```

---

### 8. **Frontend Receives Response** (Frontend)

**Location:** `client/src/app/(routes)/Session/[id]/page.tsx`

**What happens:**

#### 8.1. **Update UI**
- Add user message to conversation UI
- Add avatar message to conversation UI
- Show "thinking" indicator while processing
- Clear transcription display

#### 8.2. **Play TTS Audio**
- If `audio_url` is present:
  - Create HTML5 `Audio` element
  - Set `src` to `audio_url`
  - Call `audio.play()`
  - Show "🔊 {avatar.name} is speaking..." indicator
  - Auto-hide indicator when audio ends

#### 8.3. **Error Handling**
- If audio fails to load/play, log error but don't break flow
- User still sees text response

---

## Database Schema

### `conversations` Table
```sql
- id (uuid, PK)
- user_id (text, FK to users.id)
- avatar_id (uuid, FK to avatars.id)
- created_at (timestamptz)
- updated_at (timestamptz)
```

### `messages` Table
```sql
- id (uuid, PK)
- conversation_id (uuid, FK to conversations.id)
- sender (text) -- "user" or "avatar"
- content (text) -- message text
- created_at (timestamptz)
```

### `avatars` Table (Relevant Fields)
```sql
- id (uuid, PK)
- name (text)
- audio_url (text) -- Reference audio for voice cloning
- language (text) -- Default: "en"
- template_prompt (text) -- System prompt for LLM
```

---

## R2 Storage Details

### What Gets Stored in R2:

1. **Avatar Images** (`avatars/` folder)
   - Format: PNG, WebP
   - Purpose: Avatar profile pictures
   - Uploaded: When avatar is created/updated

2. **Reference Audio** (`voices/` folder)
   - Format: MP3, WAV
   - Purpose: Voice cloning reference (6+ seconds)
   - Uploaded: When avatar is created/updated
   - Used by: TTS system for voice cloning

3. **Generated TTS Audio** (`tts/` folder) ⭐ **NEW**
   - Format: WAV
   - Sample Rate: 24kHz
   - Purpose: Avatar's spoken responses
   - Generated: On-demand when LLM responds
   - Lifecycle: Generated → Uploaded → Served → (can be deleted after use)
   - Cleanup: Currently NOT auto-deleted (consider cleanup job)

### R2 Configuration:
- **Bucket:** `content-generation`
- **Base URL:** `https://ccscontent.mafatlaleducation.dev`
- **Access:** Public read (for frontend access)
- **Provider:** Cloudflare R2

---

## Performance & Latency

1. **Speech-to-Text:** ~3.3 seconds (Whisper processing)
2. **LLM Response:** ~1-2 seconds (OpenRouter API)
3. **TTS Generation:** ~2-5 seconds (XTTS-v2 on GPU, ~10-15s on CPU)
4. **R2 Upload:** ~0.5-1 second (depends on file size)
5. **Total:** ~7-12 seconds end-to-end

---

## Error Handling

### TTS Failures:
- If TTS generation fails, conversation still works
- `audio_url` will be `null` in response
- Frontend shows text-only response
- Error is logged but doesn't break flow

### Whisper Failures:
- WebSocket errors are shown to user
- User can retry recording
- Transcription errors don't prevent conversation

### R2 Upload Failures:
- If upload fails, `audio_url` is `null`
- TTS file is still deleted (temp cleanup)
- Frontend handles missing audio gracefully

---

## Cleanup & Optimization Opportunities

### Current State:
- ✅ Temp files are cleaned up (reference audio, TTS output)
- ❌ Generated TTS files in R2 are NOT auto-deleted
- ✅ Conversation history is preserved in database

### Recommendations:
1. **TTS File Cleanup:** Implement a job to delete old TTS files from R2 (e.g., after 24 hours)
2. **Caching:** Cache TTS for common responses (optional)
3. **Streaming:** Consider streaming TTS audio instead of full generation (future)

---

## File Flow Diagram

```
User Microphone
    ↓
Web Audio API (PCM 16kHz)
    ↓
WebSocket → Whisper Backend
    ↓
Transcription Text
    ↓
POST /conversations/chat
    ↓
[Database: Get Avatar, Get/Create Conversation, Get History]
    ↓
LLM (OpenRouter) → Response Text
    ↓
[Database: Save User Message, Save Avatar Message]
    ↓
TTS Generation (XTTS-v2)
    ↓
Temp WAV File (24kHz)
    ↓
R2 Upload → Public URL
    ↓
[Cleanup: Delete Temp Files]
    ↓
Response with audio_url
    ↓
Frontend: Play Audio
```

---

## Key Files Reference

- **Frontend Recording:** `client/src/app/(routes)/Session/[id]/page.tsx`
- **Whisper WebSocket:** `server/routes/whisper_routes.py`
- **Conversation/LLM:** `server/routes/conversation_routes.py`
- **TTS Generation:** `server/utils/tts_utils.py`
- **R2 Upload:** `server/utils/r2_client.py`
- **Database Config:** `server/db/config.py`
- **Database Schema:** `server/queries.sql`

