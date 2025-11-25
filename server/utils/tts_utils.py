"""
Text-to-Speech utility using Coqui XTTS-v2 with voice cloning
"""
import os
import logging
import torch
import requests
from typing import Optional
from TTS.api import TTS
from pathlib import Path
import tempfile
import soundfile as sf
import numpy as np

# Fix for PyTorch 2.6+ compatibility with XTTS-v2
os.environ["TORCH_FORCE_NO_WEIGHTS_ONLY_LOAD"] = "1"

# Disable torchcodec to avoid FFmpeg dependency issues
# Force torchaudio to use soundfile backend
os.environ["TORCHAUDIO_USE_SOUNDFILE"] = "1"

logger = logging.getLogger(__name__)


def patch_torchaudio_load():
    """
    Patch torchaudio.load to use soundfile backend instead of torchcodec.
    This fixes the FFmpeg/torchcodec dependency issue.
    """
    try:
        import torchaudio
        import sys
        
        # Prevent torchcodec from being imported/loaded
        # This is a more aggressive approach
        if 'torchcodec' not in sys.modules:
            # Create a dummy module to prevent actual import
            class DummyTorchcodec:
                pass
            sys.modules['torchcodec'] = DummyTorchcodec()
            sys.modules['torchcodec.decoders'] = DummyTorchcodec()
            logger.info("Blocked torchcodec import")
        
        # Try to set backend preference to soundfile
        try:
            # Check if backend registration is available
            if hasattr(torchaudio, 'set_audio_backend'):
                torchaudio.set_audio_backend('soundfile')
                logger.info("Set torchaudio backend to soundfile")
        except Exception:
            pass
        
        # Also patch the load function directly as fallback
        from functools import wraps
        
        # Store original load function
        if not hasattr(torchaudio, '_original_load'):
            torchaudio._original_load = torchaudio.load
        
        @wraps(torchaudio.load)
        def patched_load(filepath, *args, **kwargs):
            """Load audio using soundfile instead of torchcodec"""
            try:
                # Use soundfile to load audio
                data, sample_rate = sf.read(filepath)
                
                # Convert to torch tensor
                if data.dtype != np.float32:
                    data = data.astype(np.float32)
                
                # Handle mono/stereo - torchaudio expects [channels, samples]
                if len(data.shape) == 1:
                    # Mono: add channel dimension [1, samples]
                    data = data.reshape(1, -1)
                elif len(data.shape) == 2:
                    # Stereo: ensure channels are first [channels, samples]
                    if data.shape[0] < data.shape[1]:
                        # Samples are first, transpose
                        data = data.T
                
                # Convert to torch tensor
                tensor = torch.from_numpy(data)
                
                return tensor, sample_rate
            except Exception as e:
                logger.warning(f"Soundfile load failed, trying original torchaudio.load: {e}")
                # Fallback to original if soundfile fails
                try:
                    return torchaudio._original_load(filepath, *args, **kwargs)
                except Exception as fallback_error:
                    logger.error(f"Both soundfile and torchaudio.load failed: {fallback_error}")
                    raise
        
        # Replace torchaudio.load
        torchaudio.load = patched_load
        logger.info("Patched torchaudio.load to use soundfile backend")
        
    except Exception as e:
        logger.warning(f"Could not patch torchaudio.load: {e}. TTS may fail if torchcodec is not available.")


def patch_xtts_load_audio():
    """
    Patch XTTS model's load_audio function to use soundfile instead of torchaudio.
    This is a more direct fix for the torchcodec issue.
    """
    try:
        from TTS.tts.models.xtts import load_audio as xtts_load_audio
        from functools import wraps
        
        @wraps(xtts_load_audio)
        def patched_xtts_load_audio(file_path, load_sr=24000):
            """Load audio using soundfile for XTTS - returns 2D tensor [channels, samples]"""
            try:
                # Load with soundfile
                # soundfile returns: mono -> (samples,), stereo -> (samples, channels)
                data, sr = sf.read(file_path)
                
                # Convert to float32 if needed
                if data.dtype != np.float32:
                    data = data.astype(np.float32)
                
                # Resample if needed
                if sr != load_sr:
                    import librosa
                    data = librosa.resample(data, orig_sr=sr, target_sr=load_sr)
                
                # Handle channels - XTTS expects [channels, samples] format (2D tensor)
                # soundfile returns: mono -> (samples,), stereo -> (samples, channels)
                if len(data.shape) == 1:
                    # Mono: reshape to [1, samples] for 2D tensor
                    data = data.reshape(1, -1)
                elif len(data.shape) == 2:
                    # Stereo: soundfile returns (samples, channels), need (channels, samples)
                    # Transpose to get [channels, samples]
                    data = data.T
                else:
                    # Unexpected shape (more than 2D), flatten and convert to mono
                    data = data.flatten()
                    data = data.reshape(1, -1)
                
                # Ensure we have 2D tensor [channels, samples]
                if len(data.shape) != 2:
                    logger.warning(f"Unexpected data shape after processing: {data.shape}, reshaping to 2D")
                    if len(data.shape) == 1:
                        data = data.reshape(1, -1)
                    else:
                        data = data.flatten().reshape(1, -1)
                
                # Convert to torch tensor - XTTS expects 2D tensor [channels, samples]
                audio_tensor = torch.from_numpy(data).float()
                
                # Verify shape is correct
                if len(audio_tensor.shape) != 2:
                    logger.error(f"Audio tensor has wrong shape: {audio_tensor.shape}, expected 2D [channels, samples]")
                    # Force reshape
                    if len(audio_tensor.shape) == 1:
                        audio_tensor = audio_tensor.unsqueeze(0)  # Add channel dimension
                
                # Return only the tensor, NOT a tuple
                # XTTS load_audio should return just the audio tensor with shape [channels, samples]
                return audio_tensor
            except Exception as e:
                logger.warning(f"Soundfile load failed in XTTS patch, trying original: {e}")
                # Fallback to original
                try:
                    result = xtts_load_audio(file_path, load_sr)
                    # Ensure we return only tensor even from original
                    if isinstance(result, tuple):
                        return result[0]  # Return only tensor
                    return result
                except Exception as fallback_error:
                    logger.error(f"Original load_audio also failed: {fallback_error}")
                    raise
        
        # Replace the function in the module
        import TTS.tts.models.xtts as xtts_module
        xtts_module.load_audio = patched_xtts_load_audio
        logger.info("Patched XTTS load_audio to use soundfile")
        
    except Exception as e:
        logger.warning(f"Could not patch XTTS load_audio: {e}")


def patch_gpt_inference_model():
    """
    Patch GPT2InferenceModel to add generate method if missing.
    This fixes compatibility issues with newer transformers versions.
    The patch needs to be applied before the TTS model is instantiated.
    """
    try:
        # Try to import and patch the GPT2InferenceModel class
        from TTS.tts.layers.xtts.gpt import GPT2InferenceModel
        
        # Check if generate method already exists
        if hasattr(GPT2InferenceModel, 'generate'):
            logger.info("GPT2InferenceModel already has generate method")
            return
        
        # Create a generate method that matches the expected signature
        # Based on the error trace, it's called from gpt.py line 590
        def generate_method(self, input_ids, attention_mask=None, max_length=256, temperature=1.0, top_k=50, top_p=0.85, repetition_penalty=1.2, **kwargs):
            """
            Generate method for GPT2InferenceModel.
            This implements a simple autoregressive generation.
            """
            device = input_ids.device
            batch_size = input_ids.size(0)
            generated = input_ids.clone()
            
            # Create attention mask if not provided
            if attention_mask is None:
                attention_mask = torch.ones_like(input_ids)
            
            # Generation loop
            for step in range(max_length - input_ids.size(1)):
                with torch.no_grad():
                    # Forward pass through the model
                    try:
                        # Try calling the model directly
                        outputs = self(generated, attention_mask=attention_mask)
                    except Exception:
                        # Fallback to forward method
                        outputs = self.forward(generated, attention_mask=attention_mask)
                    
                    # Extract logits
                    if isinstance(outputs, tuple):
                        logits = outputs[0]
                    elif hasattr(outputs, 'logits'):
                        logits = outputs.logits
                    else:
                        logits = outputs
                    
                    # Get next token logits (last position)
                    next_token_logits = logits[:, -1, :] / temperature
                    
                    # Apply top-k filtering
                    if top_k > 0:
                        indices_to_remove = next_token_logits < torch.topk(next_token_logits, top_k)[0][..., -1, None]
                        next_token_logits[indices_to_remove] = float('-inf')
                    
                    # Apply top-p (nucleus) filtering
                    if top_p < 1.0:
                        sorted_logits, sorted_indices = torch.sort(next_token_logits, descending=True)
                        cumulative_probs = torch.cumsum(torch.softmax(sorted_logits, dim=-1), dim=-1)
                        sorted_indices_to_remove = cumulative_probs > top_p
                        sorted_indices_to_remove[..., 1:] = sorted_indices_to_remove[..., :-1].clone()
                        sorted_indices_to_remove[..., 0] = 0
                        indices_to_remove = sorted_indices_to_remove.scatter(1, sorted_indices, sorted_indices_to_remove)
                        next_token_logits[indices_to_remove] = float('-inf')
                    
                    # Apply repetition penalty
                    if repetition_penalty != 1.0:
                        for token_id in torch.unique(generated):
                            next_token_logits[:, token_id] /= repetition_penalty
                    
                    # Sample next token (greedy for now, can be changed to sampling)
                    probs = torch.softmax(next_token_logits, dim=-1)
                    next_token = torch.multinomial(probs, num_samples=1)
                    
                    # Append to generated sequence
                    generated = torch.cat([generated, next_token], dim=1)
                    attention_mask = torch.cat([attention_mask, torch.ones((batch_size, 1), device=device)], dim=1)
                    
                    # Check for EOS token (50256 is GPT-2 EOS)
                    if (next_token == 50256).all():
                        break
            
            return generated
        
        # Add the generate method to the class
        GPT2InferenceModel.generate = generate_method
        logger.info("Successfully patched GPT2InferenceModel with generate method")
        
    except ImportError as e:
        logger.warning(f"Could not import GPT2InferenceModel for patching: {e}")
        logger.warning("TTS may fail if transformers version is incompatible. Consider: pip install 'transformers<4.36.0'")
    except Exception as e:
        logger.warning(f"Error patching GPT2InferenceModel: {e}")
        logger.warning("TTS may fail. Consider downgrading transformers: pip install 'transformers<4.36.0'")

# Global TTS instance (singleton pattern)
_tts_instance = None
_device = None


def get_device():
    """Get the device (CUDA or CPU)"""
    global _device
    if _device is None:
        _device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"TTS Device: {_device}")
    return _device


def get_tts_instance():
    """Get or create TTS instance (singleton)"""
    global _tts_instance
    if _tts_instance is None:
        try:
            device = get_device()
            logger.info("Initializing XTTS-v2 model...")
            
            # CRITICAL: Patch audio loading BEFORE loading the model
            # This prevents torchcodec from being used
            try:
                patch_torchaudio_load()
            except Exception as e:
                logger.warning(f"torchaudio patch failed: {e}")
            
            try:
                patch_xtts_load_audio()
            except Exception as e:
                logger.warning(f"XTTS load_audio patch failed: {e}")
            
            # Patch the model before loading
            patch_gpt_inference_model()
            
            # Use the newer API without deprecated 'gpu' parameter
            _tts_instance = TTS(
                model_name="tts_models/multilingual/multi-dataset/xtts_v2"
            )
            # Move to device using the newer method
            if device == "cuda":
                _tts_instance = _tts_instance.to(device)
            logger.info(f"XTTS-v2 model loaded successfully on {device}")
        except Exception as e:
            logger.error(f"Failed to initialize TTS model: {e}")
            raise
    return _tts_instance


def download_reference_audio(audio_url: str, output_path: str) -> bool:
    """Download reference audio file from URL"""
    try:
        response = requests.get(audio_url, timeout=30)
        if response.status_code == 200:
            with open(output_path, 'wb') as f:
                f.write(response.content)
            logger.info(f"Downloaded reference audio: {audio_url}")
            return True
        else:
            logger.error(f"Failed to download audio: {response.status_code}")
            return False
    except Exception as e:
        logger.error(f"Error downloading reference audio: {e}")
        return False


def generate_speech(
    text: str,
    speaker_wav_path: str,
    language: str = "en",
    output_path: Optional[str] = None
) -> Optional[str]:
    """
    Generate speech from text using XTTS-v2 with voice cloning
    
    Args:
        text: Text to convert to speech
        speaker_wav_path: Path to reference audio file (6+ seconds for voice cloning)
        language: Language code (default: "en")
        output_path: Optional output path. If None, creates temp file
        
    Returns:
        Path to generated audio file, or None if failed
    """
    try:
        tts = get_tts_instance()
        
        # Create temp file if output_path not provided
        if output_path is None:
            temp_dir = tempfile.gettempdir()
            output_path = os.path.join(temp_dir, f"tts_output_{os.getpid()}.wav")
        
        # Ensure output directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        logger.info(f"Generating speech: text='{text[:50]}...', speaker='{speaker_wav_path}', language='{language}'")
        
        # Generate speech with voice cloning
        # XTTS-v2 generates at 24kHz sample rate
        # Try the standard API first
        try:
            tts.tts_to_file(
                text=text,
                file_path=output_path,
                speaker_wav=speaker_wav_path,
                language=language
            )
            # Verify and potentially fix sample rate if needed
            try:
                import soundfile as sf
                data, sr = sf.read(output_path)
                if sr != 24000:
                    logger.warning(f"Audio sample rate is {sr}, resampling to 24000 Hz")
                    import librosa
                    data_resampled = librosa.resample(data, orig_sr=sr, target_sr=24000)
                    sf.write(output_path, data_resampled, 24000)
            except Exception as resample_error:
                logger.warning(f"Could not verify/resample audio: {resample_error}")
        except AttributeError as attr_error:
            # If we get the 'generate' attribute error, try alternative approach
            if "'generate'" in str(attr_error) or "generate" in str(attr_error):
                logger.warning("Encountered generate attribute error, trying alternative method...")
                # Try using the synthesize method directly if available
                try:
                    # Alternative: use synthesize and save manually
                    wav = tts.tts(
                        text=text,
                        speaker_wav=speaker_wav_path,
                        language=language
                    )
                    # Save the audio with correct sample rate (XTTS-v2 uses 24kHz)
                    import soundfile as sf
                    sf.write(output_path, wav, samplerate=24000)
                except Exception as alt_error:
                    logger.error(f"Alternative method also failed: {alt_error}")
                    raise attr_error
            else:
                raise
        
        if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
            logger.info(f"Speech generated successfully: {output_path}")
            return output_path
        else:
            logger.error("Generated audio file is empty or doesn't exist")
            return None
            
    except Exception as e:
        logger.error(f"Error generating speech: {e}", exc_info=True)
        return None


def text_to_speech_with_voice_cloning_bytes(
    text: str,
    reference_audio_url: str,
    language: str = "en"
) -> Optional[bytes]:
    """
    Generate TTS audio and return as bytes (no file saving, no R2 upload)
    
    Args:
        text: Text to convert to speech
        reference_audio_url: URL to reference audio file for voice cloning
        language: Language code (default: "en")
        
    Returns:
        Audio bytes (WAV format, 24kHz) or None if failed
    """
    try:
        # Create temp file for reference audio
        temp_dir = tempfile.gettempdir()
        ref_audio_path = os.path.join(temp_dir, f"ref_audio_{os.getpid()}.wav")
        
        # Download reference audio
        if not download_reference_audio(reference_audio_url, ref_audio_path):
            logger.error("Failed to download reference audio")
            return None
        
        # Generate speech to temp file
        temp_output = os.path.join(temp_dir, f"tts_output_{os.getpid()}.wav")
        result_path = generate_speech(
            text=text,
            speaker_wav_path=ref_audio_path,
            language=language,
            output_path=temp_output
        )
        
        # Read audio bytes
        audio_bytes = None
        if result_path and os.path.exists(result_path):
            with open(result_path, 'rb') as f:
                audio_bytes = f.read()
        
        # Cleanup temp files
        try:
            if os.path.exists(ref_audio_path):
                os.remove(ref_audio_path)
            if os.path.exists(temp_output):
                os.remove(temp_output)
        except Exception as e:
            logger.warning(f"Failed to cleanup temp files: {e}")
        
        return audio_bytes
        
    except Exception as e:
        logger.error(f"Error in text_to_speech_with_voice_cloning_bytes: {e}")
        return None


def text_to_speech_with_voice_cloning(
    text: str,
    reference_audio_url: str,
    language: str = "en",
    output_path: Optional[str] = None
) -> Optional[str]:
    """
    Complete TTS pipeline: download reference audio and generate speech
    
    Args:
        text: Text to convert to speech
        reference_audio_url: URL to reference audio file for voice cloning
        language: Language code (default: "en")
        output_path: Optional output path. If None, creates temp file
        
    Returns:
        Path to generated audio file, or None if failed
    """
    try:
        # Create temp file for reference audio
        temp_dir = tempfile.gettempdir()
        ref_audio_path = os.path.join(temp_dir, f"ref_audio_{os.getpid()}.wav")
        
        # Download reference audio
        if not download_reference_audio(reference_audio_url, ref_audio_path):
            logger.error("Failed to download reference audio")
            return None
        
        # Generate speech
        result = generate_speech(
            text=text,
            speaker_wav_path=ref_audio_path,
            language=language,
            output_path=output_path
        )
        
        # Cleanup reference audio temp file
        try:
            if os.path.exists(ref_audio_path):
                os.remove(ref_audio_path)
        except Exception as e:
            logger.warning(f"Failed to cleanup reference audio: {e}")
        
        return result
        
    except Exception as e:
        logger.error(f"Error in text_to_speech_with_voice_cloning: {e}")
        return None

