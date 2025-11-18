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

# Fix for PyTorch 2.6+ compatibility with XTTS-v2
os.environ["TORCH_FORCE_NO_WEIGHTS_ONLY_LOAD"] = "1"

logger = logging.getLogger(__name__)


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
        # Try the standard API first
        try:
            tts.tts_to_file(
                text=text,
                file_path=output_path,
                speaker_wav=speaker_wav_path,
                language=language
            )
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
                    # Save the audio
                    import soundfile as sf
                    sf.write(output_path, wav, samplerate=22050)
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

