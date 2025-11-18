import os
import sys
import numpy as np
import logging
import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Header, HTTPException, status
from typing import Optional
import io
import soundfile as sf
import librosa
from utils.whisper.whisper_online import FasterWhisperASR, OnlineASRProcessor, asr_factory
from utils.whisper.silero_vad_iterator import FixedVADIterator
import torch

logger = logging.getLogger(__name__)
whisper_router = APIRouter()

# Global ASR instance (initialized once)
_asr_instance = None
_online_asr_instance = None
_vad_instance = None

def get_asr_instance():
    """Initialize and return ASR instance (singleton)"""
    global _asr_instance, _online_asr_instance, _vad_instance
    
    if _asr_instance is None:
        try:
            # Initialize faster-whisper ASR
            model_size = os.getenv("WHISPER_MODEL_SIZE", "base")
            language = os.getenv("WHISPER_LANGUAGE", "en")
            cache_dir = os.getenv("WHISPER_CACHE_DIR", None)
            
            logger.info(f"Initializing Whisper model: {model_size}, language: {language}")
            
            # Try to initialize with proper error handling
            try:
                # Create FasterWhisperASR instance
                # This will handle model downloading and loading with automatic GPU/CPU detection
                logger.info("Creating FasterWhisperASR instance...")
                _asr_instance = FasterWhisperASR(
                    modelsize=model_size,
                    lan=language,
                    cache_dir=cache_dir
                )
                logger.info("FasterWhisperASR instance created successfully")
                
            except Exception as e:
                error_msg = str(e)
                logger.error(f"Failed to initialize Whisper ASR: {error_msg}")
                
                # Check if it's a vocabulary/model file issue
                if "vocabulary" in error_msg.lower() or "model directory" in error_msg.lower() or "tokenizer" in error_msg.lower():
                    logger.error("Model files may be incomplete or corrupted.")
                    logger.error("Solution: Clear the model cache and re-download.")
                    logger.error(f"Cache location: {cache_dir or 'default HuggingFace cache (usually ~/.cache/huggingface/hub)'}")
                    logger.error("To fix: Delete the model cache folder and restart the server.")
                    raise Exception(f"Model initialization failed: {error_msg}. The model files appear to be incomplete. Please clear the HuggingFace cache at ~/.cache/huggingface/hub/models--Systran--faster-whisper-{model_size} and restart the server to re-download the model.")
                else:
                    raise
            
            # Initialize online ASR processor
            _online_asr_instance = OnlineASRProcessor(
                _asr_instance,
                tokenizer=None,
                buffer_trimming=("segment", 15),
                logfile=sys.stderr
            )
            
            # Initialize VAD if available
            try:
                model, _ = torch.hub.load(
                    repo_or_dir='snakers4/silero-vad',
                    model='silero_vad'
                )
                _vad_instance = FixedVADIterator(model)
                logger.info("VAD initialized successfully")
            except Exception as e:
                logger.warning(f"VAD initialization failed: {e}. Continuing without VAD.")
                _vad_instance = None
            
            logger.info("Whisper ASR initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Whisper ASR: {e}")
            raise
    
    return _asr_instance, _online_asr_instance, _vad_instance


@whisper_router.websocket("/transcribe")
async def websocket_transcribe(websocket: WebSocket):
    """WebSocket endpoint for real-time audio transcription"""
    await websocket.accept()
    logger.info("WebSocket connection accepted")
    
    try:
        # Initialize ASR instance with error handling
        try:
            asr, online_asr, vad = get_asr_instance()
        except Exception as init_error:
            error_msg = str(init_error)
            logger.error(f"ASR initialization failed: {error_msg}")
            await websocket.send_json({
                "type": "error",
                "message": f"Failed to initialize Whisper: {error_msg}. Please check server logs."
            })
            await websocket.close()
            return
        
        online_asr.init()
        
        if vad:
            vad.reset_states()
        
        audio_buffer = np.array([], dtype=np.float32)
        SAMPLING_RATE = 16000
        
        while True:
            # Receive audio data
            try:
                data = await websocket.receive_bytes()
            except WebSocketDisconnect:
                logger.info("WebSocket disconnected")
                break
            
            if not data:
                continue
            
            try:
                # Convert bytes to audio array
                # Expected format: PCM 16-bit, mono, 16kHz (Int16Array from frontend)
                try:
                    # Try to interpret as raw PCM 16-bit
                    audio_array = np.frombuffer(data, dtype=np.int16).astype(np.float32)
                    # Normalize to [-1, 1]
                    audio_chunk = audio_array / 32768.0
                    
                    # Ensure it's the right sample rate (should already be 16kHz from frontend)
                    if len(audio_chunk) > 0:
                        # If we need to resample, librosa can do it, but we expect 16kHz
                        pass
                except Exception as pcm_error:
                    logger.warning(f"Failed to parse as raw PCM: {pcm_error}. Trying SoundFile...")
                    # Fallback: try SoundFile format
                    audio_file = io.BytesIO(data)
                    try:
                        sf_file = sf.SoundFile(
                            audio_file,
                            channels=1,
                            endian="LITTLE",
                            samplerate=SAMPLING_RATE,
                            subtype="PCM_16",
                            format="RAW"
                        )
                        audio_chunk, _ = librosa.load(
                            sf_file,
                            sr=SAMPLING_RATE,
                            dtype=np.float32
                        )
                    except Exception as sf_error:
                        logger.error(f"Failed to parse audio with SoundFile: {sf_error}")
                        await websocket.send_json({
                            "type": "error",
                            "message": f"Failed to decode audio: {str(sf_error)}"
                        })
                        continue
                
                # Process with VAD if available
                if vad:
                    vad_result = vad(audio_chunk)
                    if vad_result and 'start' in vad_result:
                        # Voice activity detected
                        online_asr.insert_audio_chunk(audio_chunk)
                    elif vad_result and 'end' in vad_result:
                        # End of voice activity
                        online_asr.insert_audio_chunk(audio_chunk)
                        # Process and get transcription
                        result = online_asr.process_iter()
                        if result[2]:  # If there's text
                            await websocket.send_json({
                                "type": "transcription",
                                "text": result[2],
                                "start": result[0],
                                "end": result[1]
                            })
                    else:
                        # Continue voice activity
                        online_asr.insert_audio_chunk(audio_chunk)
                else:
                    # Without VAD, just process directly
                    online_asr.insert_audio_chunk(audio_chunk)
                
                # Process audio chunk
                result = online_asr.process_iter()
                
                if result[2]:  # If there's transcribed text
                    await websocket.send_json({
                        "type": "transcription",
                        "text": result[2],
                        "start": result[0],
                        "end": result[1]
                    })
                
            except Exception as e:
                logger.error(f"Error processing audio chunk: {e}")
                await websocket.send_json({
                    "type": "error",
                    "message": str(e)
                })
        
        # Finalize transcription
        final_result = online_asr.finish()
        if final_result[2]:
            await websocket.send_json({
                "type": "final",
                "text": final_result[2],
                "start": final_result[0],
                "end": final_result[1]
            })
            
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        try:
            await websocket.send_json({
                "type": "error",
                "message": str(e)
            })
        except:
            pass
    finally:
        try:
            await websocket.close()
        except:
            pass
        logger.info("WebSocket connection closed")


@whisper_router.post("/transcribe-chunk")
async def transcribe_audio_chunk(
    audio_data: bytes,
    user_id: Optional[str] = None
):
    """HTTP endpoint for transcribing a single audio chunk (fallback)"""
    try:
        asr, online_asr, vad = get_asr_instance()
        online_asr.init()
        
        # Convert bytes to audio
        audio_file = io.BytesIO(audio_data)
        sf_file = sf.SoundFile(
            audio_file,
            channels=1,
            endian="LITTLE",
            samplerate=16000,
            subtype="PCM_16",
            format="RAW"
        )
        audio, _ = librosa.load(sf_file, sr=16000, dtype=np.float32)
        
        online_asr.insert_audio_chunk(audio)
        result = online_asr.process_iter()
        
        return {
            "text": result[2] if result[2] else "",
            "start": result[0],
            "end": result[1]
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Transcription failed: {str(e)}"
        )

