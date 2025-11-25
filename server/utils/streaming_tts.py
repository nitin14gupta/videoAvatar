"""
Streaming TTS utilities for faster audio generation
Optimized for low-latency voice responses
"""
import asyncio
import logging
from typing import Optional, AsyncGenerator
from utils.tts_utils import text_to_speech_with_voice_cloning_bytes
from utils.tts_text_cleaner import clean_text_for_tts, is_tts_worthy

logger = logging.getLogger(__name__)

# Global semaphore to limit concurrent TTS operations
# XTTS-v2 doesn't handle many parallel CUDA operations well
# Limit to 1 concurrent TTS operation to prevent CUDA errors
TTS_SEMAPHORE = asyncio.Semaphore(1)


async def generate_tts_async(
    text: str,
    reference_audio_url: str,
    language: str = "en"
) -> Optional[bytes]:
    """
    Generate TTS audio asynchronously (non-blocking)
    Uses semaphore to prevent concurrent CUDA operations
    
    Args:
        text: Text to convert to speech
        reference_audio_url: URL to reference audio
        language: Language code
        
    Returns:
        Audio bytes or None
    """
    # Clean and validate text for TTS
    if not text or not text.strip():
        logger.warning(f"Empty text provided for TTS")
        return None
    
    # Clean the text (remove markdown, code blocks, etc.)
    cleaned_text = clean_text_for_tts(text)
    
    # Validate text is TTS-worthy
    if not is_tts_worthy(cleaned_text, min_length=3):
        logger.warning(f"Text not TTS-worthy after cleaning: {text[:50]}... -> {cleaned_text[:50]}...")
        return None
    
    try:
        # Use semaphore to ensure only one TTS operation at a time
        # This prevents CUDA concurrency issues with XTTS-v2
        async with TTS_SEMAPHORE:
            # Run TTS in thread pool to avoid blocking
            # Use cleaned_text instead of original text
            audio_bytes = await asyncio.to_thread(
                text_to_speech_with_voice_cloning_bytes,
                cleaned_text,
                reference_audio_url,
                language
            )
            return audio_bytes
    except Exception as e:
        error_str = str(e)
        logger.error(f"Error in async TTS generation: {error_str}")
        
        # Check if it's a CUDA error
        if "CUDA" in error_str or "cuda" in error_str.lower():
            logger.error("CUDA error detected - attempting to clear CUDA cache")
            try:
                import torch
                if torch.cuda.is_available():
                    torch.cuda.empty_cache()
                    logger.info("CUDA cache cleared")
            except Exception as cache_error:
                logger.error(f"Failed to clear CUDA cache: {cache_error}")
        
        return None


class TTSQueue:
    """
    Queue for managing parallel TTS generation
    Allows starting TTS for next phrase while previous is still generating
    """
    def __init__(self):
        self.completed_queue = asyncio.Queue()
        self.active_tasks = []
        self.task_counter = 0
    
    async def add_tts_task(
        self,
        text: str,
        reference_audio_url: str,
        language: str = "en",
        chunk_id: Optional[int] = None
    ):
        """
        Add a TTS generation task to the queue
        
        Args:
            text: Text to convert
            reference_audio_url: Reference audio URL
            language: Language code
            chunk_id: Optional ID for tracking
        """
        task_id = self.task_counter
        self.task_counter += 1
        
        task = asyncio.create_task(
            self._generate_with_id(text, reference_audio_url, language, chunk_id or task_id)
        )
        self.active_tasks.append((task_id, task))
        return task
    
    async def _generate_with_id(
        self,
        text: str,
        reference_audio_url: str,
        language: str,
        chunk_id: Optional[int]
    ):
        """Generate TTS and put result in queue"""
        try:
            # Validate text before processing
            if not text or len(text.strip()) < 3:
                logger.warning(f"Skipping invalid TTS text (chunk {chunk_id}): too short")
                return None
            
            audio_bytes = await generate_tts_async(text, reference_audio_url, language)
            if audio_bytes:
                chunk_data = {
                    "chunk_id": chunk_id,
                    "text": text,
                    "audio": audio_bytes
                }
                await self.completed_queue.put(chunk_data)
                return chunk_data
            else:
                logger.warning(f"TTS generation returned None for chunk {chunk_id}")
        except Exception as e:
            error_msg = str(e)
            logger.error(f"TTS task failed (chunk {chunk_id}): {error_msg}")
            # Check for CUDA errors specifically
            if "CUDA" in error_msg or "cuda" in error_msg.lower() or "Assertion" in error_msg:
                logger.error(f"CUDA/Assertion error in TTS generation - this may indicate concurrent access issue")
                try:
                    import torch
                    if torch.cuda.is_available():
                        torch.cuda.empty_cache()
                        logger.info("CUDA cache cleared after error")
                except Exception as cache_error:
                    logger.error(f"Failed to clear CUDA cache: {cache_error}")
        return None
    
    async def wait_for_chunk(self, timeout: float = 30.0) -> Optional[dict]:
        """
        Wait for the next completed chunk
        
        Args:
            timeout: Maximum time to wait
            
        Returns:
            Chunk dict with audio bytes or None
        """
        try:
            chunk = await asyncio.wait_for(self.completed_queue.get(), timeout=timeout)
            return chunk
        except asyncio.TimeoutError:
            return None
    
    async def wait_all(self):
        """Wait for all active tasks to complete"""
        if self.active_tasks:
            # Wait for all tasks
            tasks = [task for _, task in self.active_tasks]
            await asyncio.gather(*tasks, return_exceptions=True)
        self.active_tasks.clear()
        
        # DON'T clear the queue - chunks need to be retrieved by the caller
        # The queue will be empty naturally as chunks are consumed
    
    def is_queue_empty(self) -> bool:
        """Check if the completed queue is empty"""
        return self.completed_queue.empty()
    
    def get_queue_size(self) -> int:
        """Get the approximate size of the completed queue"""
        return self.completed_queue.qsize()

