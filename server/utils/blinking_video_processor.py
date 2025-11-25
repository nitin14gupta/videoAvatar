"""
Background task processor for generating blinking videos for avatars
"""
import os
import time
import logging
import asyncio
from typing import Optional
from io import BytesIO
from utils.liveportrait_utils import generate_blinking_animation_from_urls
from utils.r2_client import r2_client
from db.config import get_supabase_client

logger = logging.getLogger(__name__)


async def process_blinking_video_for_avatar(avatar_id: str) -> bool:
    """
    Background task to generate blinking video for an avatar and upload to R2
    
    Args:
        avatar_id: UUID of the avatar
        
    Returns:
        True if successful, False otherwise
    """
    try:
        logger.info(f"Starting blinking video generation for avatar: {avatar_id}")
        
        # Get avatar details
        avatars = get_supabase_client().table("avatars")
        res = avatars.select("*").eq("id", avatar_id).limit(1).execute()
        
        if not res.data:
            logger.error(f"Avatar not found: {avatar_id}")
            return False
        
        avatar = res.data[0]
        avatar_image_url = avatar.get("image_url")
        
        if not avatar_image_url:
            logger.error(f"Avatar {avatar_id} has no image URL")
            # Update status to failed
            avatars.update({
                "training_status": "failed",
                "updated_at": time.strftime("%Y-%m-%d %H:%M:%S")
            }).eq("id", avatar_id).execute()
            return False
        
        # Path to blinking video
        blinking_video_path = os.path.join(
            os.path.dirname(__file__), "..", "static", "blinking.mp4"
        )
        
        if not os.path.exists(blinking_video_path):
            logger.error(f"Blinking video not found at: {blinking_video_path}")
            avatars.update({
                "training_status": "failed",
                "updated_at": __import__("time").strftime("%Y-%m-%d %H:%M:%S")
            }).eq("id", avatar_id).execute()
            return False
        
        # Generate blinking animation in a thread pool to avoid blocking
        import tempfile
        temp_dir = tempfile.gettempdir()
        output_path = os.path.join(temp_dir, f"blinking_animation_{avatar_id}.mp4")
        
        logger.info(f"Generating blinking animation for avatar {avatar_id}...")
        result_path = await asyncio.to_thread(
            generate_blinking_animation_from_urls,
            avatar_image_url=avatar_image_url,
            blinking_video_path=blinking_video_path,
            output_path=output_path
        )
        
        if not result_path or not os.path.exists(result_path):
            logger.error(f"Failed to generate blinking animation for avatar {avatar_id}")
            avatars.update({
                "training_status": "failed",
                "updated_at": __import__("time").strftime("%Y-%m-%d %H:%M:%S")
            }).eq("id", avatar_id).execute()
            return False
        
        logger.info(f"Blinking animation generated: {result_path}")
        
        # Upload to R2
        try:
            with open(result_path, 'rb') as f:
                video_bytes = BytesIO(f.read())
            
            upload_result = r2_client.upload_file(
                file_bytes=video_bytes,
                file_name=f"blinking_animation_{avatar_id}.mp4",
                folder="blinking_videos"
            )
            
            blinking_video_url = upload_result["url"]
            logger.info(f"Uploaded blinking video to R2: {blinking_video_url}")
            
            # Update avatar with blinking video URL and set status to complete
            avatars.update({
                "blinking_video_url": blinking_video_url,
                "training_status": "complete",
                "updated_at": time.strftime("%Y-%m-%d %H:%M:%S")
            }).eq("id", avatar_id).execute()
            
            # Cleanup temp file
            try:
                if os.path.exists(result_path):
                    os.remove(result_path)
            except Exception as e:
                logger.warning(f"Failed to cleanup temp file: {e}")
            
            logger.info(f"Successfully processed blinking video for avatar {avatar_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error uploading blinking video to R2: {e}", exc_info=True)
            avatars.update({
                "training_status": "failed",
                "updated_at": time.strftime("%Y-%m-%d %H:%M:%S")
            }).eq("id", avatar_id).execute()
            return False
            
    except Exception as e:
        logger.error(f"Error processing blinking video for avatar {avatar_id}: {e}", exc_info=True)
        # Update status to failed
        try:
            avatars = get_supabase_client().table("avatars")
            avatars.update({
                "training_status": "failed",
                "updated_at": time.strftime("%Y-%m-%d %H:%M:%S")
            }).eq("id", avatar_id).execute()
        except:
            pass
        return False

