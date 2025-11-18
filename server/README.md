# videoAvatar
Real-Time AI Avatar with Lip-Sync & Voice Interaction System

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variables (copy from `env.example`)

3. Run the server:
```bash
fastapi dev main.py
```

## Troubleshooting Whisper Issues

If you get "Cannot load the target vocabulary from the model directory" error:

1. Clear the model cache:
```bash
python clear_whisper_cache.py
```

2. Or manually delete the cache folder:
   - Windows: `C:\Users\<YourUsername>\.cache\huggingface\hub\models--Systran--faster-whisper-base`
   - Linux/Mac: `~/.cache/huggingface/hub/models--Systran--faster-whisper-base`

3. Restart the server - it will re-download the model automatically

## Environment Variables

- `WHISPER_MODEL_SIZE` - Model size (tiny, base, small, medium, large-v2, etc.) - Default: "base"
- `WHISPER_LANGUAGE` - Language code (en, es, fr, etc.) - Default: "en"
- `WHISPER_CACHE_DIR` - Custom cache directory (optional)
