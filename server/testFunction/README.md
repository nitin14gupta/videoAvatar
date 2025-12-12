# Test Functions

This directory contains standalone test scripts for testing various avatar processing functions.

## Available Tests

### 1. `test_blinking_video.py`
Test blinking video generation using LivePortrait.

**Usage:**
```bash
# Interactive mode (will prompt for image URL)
python testFunction/test_blinking_video.py

# With command line arguments
python testFunction/test_blinking_video.py --image-url "https://example.com/avatar.jpg"

# With output path
python testFunction/test_blinking_video.py --image-url "https://example.com/avatar.jpg" --output "/tmp/output.mp4"

# Upload to R2
python testFunction/test_blinking_video.py --image-url "https://example.com/avatar.jpg" --upload
```

**Options:**
- `--image-url`: URL to avatar image
- `--output`: Output path for video file
- `--upload`: Upload result to R2 storage

---

### 2. `test_thinking_sound.py`
Test thinking sound generation using TTS with voice cloning.

**Usage:**
```bash
# Interactive mode
python testFunction/test_thinking_sound.py

# With command line arguments (single variation)
python testFunction/test_thinking_sound.py --audio-url "https://ccscontent.mafatlaleducation.dev/voices/9033b107-7fd1-4c78-97d7-39ddaaca93d4.webm" --upload

# With custom thinking text
python testFunction/test_thinking_sound.py --audio-url "https://ccscontent.mafatlaleducation.dev/voices/9033b107-7fd1-4c78-97d7-39ddaaca93d4.webm" --text "hmm… mm-hmm… ahh-hmm… mm…" --upload

# Generate multiple variations (like production - 5 variations)
python testFunction/test_thinking_sound.py --audio-url "https://ccscontent.mafatlaleducation.dev/voices/9033b107-7fd1-4c78-97d7-39ddaaca93d4.webm" --variations --upload

# Upload to R2
python testFunction/test_thinking_sound.py --audio-url "https://example.com/voice.webm" --upload
```

**Options:**
- `--audio-url`: URL to reference audio file for voice cloning
- `--language`: Language code (default: "en")
- `--output`: Output path for audio file
- `--text`: Thinking sound text (ignored if `--variations` is used)
- `--variations`: Generate multiple variations (5 variations: "Hmm", "Hmm, hmm", "Uh, hmm", "Let me think", "Hmm, just a moment")
- `--upload`: Upload result to R2 storage

**Note:** The `--variations` flag generates 5 different thinking sound variations using the same voice cloning, just like in production. This allows for natural variety when playing thinking sounds during conversations.

---

### 3. `test_avatar_processing.py`
Test complete avatar processing pipeline (blinking video + thinking sound).

**Usage:**
```bash
# Interactive mode
python testFunction/test_avatar_processing.py

# With command line arguments
python testFunction/test_avatar_processing.py \
    --image-url "https://example.com/avatar.jpg" \
    --audio-url "https://example.com/voice.webm"

# Upload to R2
python testFunction/test_avatar_processing.py \
    --image-url "https://example.com/avatar.jpg" \
    --audio-url "https://example.com/voice.webm" \
    --upload
```

**Options:**
- `--image-url`: URL to avatar image
- `--audio-url`: URL to reference audio file
- `--language`: Language code (default: "en")
- `--upload`: Upload results to R2 storage

---

## Examples

### Test blinking video only:
```bash
cd server
python testFunction/test_blinking_video.py \
    --image-url "https://ccscontent.mafatlaleducation.dev/avatars/test.png" \
    --upload
```

### Test thinking sound only:
```bash
cd server
python testFunction/test_thinking_sound.py \
    --audio-url "https://ccscontent.mafatlaleducation.dev/voices/test.webm" \
    --upload
```

### Test complete pipeline:
```bash
cd server
python testFunction/test_avatar_processing.py \
    --image-url "https://ccscontent.mafatlaleducation.dev/avatars/test.png" \
    --audio-url "https://ccscontent.mafatlaleducation.dev/voices/test.webm" \
    --upload
```

---

## Notes

- All test scripts can be run interactively (will prompt for missing inputs)
- Output files are saved to temp directory by default
- Use `--upload` flag to upload results to R2 storage
- Blinking video generation takes several minutes (LivePortrait processing)
- Thinking sound generation takes about a minute (TTS processing)






# Test blinking video only
cd server
python testFunction/test_blinking_video.py --image-url "https://..." --upload

# Test thinking sound only
python testFunction/test_thinking_sound.py --audio-url "https://..." --upload

# Test complete pipeline
python testFunction/test_avatar_processing.py \
    --image-url "https://..." \
    --audio-url "https://..." \
    --upload