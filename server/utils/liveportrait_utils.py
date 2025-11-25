"""
LivePortrait utility for generating blinking animations
Uses the cloned LivePortrait repository to animate avatar images with blinking video
"""
import os
import logging
import subprocess
import sys
import tempfile
import requests
from typing import Optional
from pathlib import Path

logger = logging.getLogger(__name__)

# Path to LivePortrait repository (relative to server directory)
LIVEPORTRAIT_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "LivePortrait")


def get_liveportrait_path():
    """Get the absolute path to LivePortrait repository"""
    abs_path = os.path.abspath(LIVEPORTRAIT_PATH)
    if not os.path.exists(abs_path):
        logger.warning(f"LivePortrait not found at {abs_path}")
        return None
    return abs_path


def download_image(url: str, output_path: str) -> bool:
    """Download image from URL"""
    try:
        response = requests.get(url, timeout=30)
        if response.status_code == 200:
            with open(output_path, 'wb') as f:
                f.write(response.content)
            logger.info(f"Downloaded image: {url}")
            return True
        else:
            logger.error(f"Failed to download image: {response.status_code}")
            return False
    except Exception as e:
        logger.error(f"Error downloading image: {e}")
        return False




def generate_blinking_animation_liveportrait(
    avatar_image_path: str,
    blinking_video_path: str,
    output_path: str
) -> Optional[str]:
    """
    Generate blinking animation using LivePortrait
    
    Args:
        avatar_image_path: Path to avatar image
        blinking_video_path: Path to blinking driving video
        output_path: Output video path
        
    Returns:
        Path to generated video or None if failed
    """
    try:
        liveportrait_path = get_liveportrait_path()
        if not liveportrait_path:
            logger.error("LivePortrait repository not found")
            return None
        
        # Ensure output directory exists
        output_dir = os.path.dirname(output_path)
        if output_dir:
            os.makedirs(output_dir, exist_ok=True)
        
        # Get inference script path
        inference_script = os.path.join(liveportrait_path, "inference.py")
        if not os.path.exists(inference_script):
            logger.error(f"Inference script not found: {inference_script}")
            return None
        
        logger.info(f"Generating blinking animation with LivePortrait...")
        logger.info(f"Avatar image: {avatar_image_path}")
        logger.info(f"Blinking video: {blinking_video_path}")
        logger.info(f"Output path: {output_path}")
        
        # Prepare command - use conda run to use LivePortrait environment
        # Try conda run first, fallback to direct python if conda not available
        cmd = [
            "conda", "run", "-n", "LivePortrait",
            "python", inference_script,
            "-s", avatar_image_path,
            "-d", blinking_video_path,
            "-o", output_dir
        ]
        
        logger.info(f"Running command: {' '.join(cmd)}")
        
        # Run LivePortrait inference
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            cwd=liveportrait_path
        )
        
        # If conda run fails, try direct python from LivePortrait environment
        if result.returncode != 0:
            logger.warning("conda run failed, trying direct python path...")
            # Try common conda environment paths
            python_paths = [
                os.path.expanduser("~/miniconda3/envs/LivePortrait/bin/python"),
                os.path.expanduser("~/anaconda3/envs/LivePortrait/bin/python"),
                "/opt/conda/envs/LivePortrait/bin/python"
            ]
            
            for python_path in python_paths:
                if os.path.exists(python_path):
                    logger.info(f"Trying python at: {python_path}")
                    cmd = [
                        python_path,
                        inference_script,
                        "-s", avatar_image_path,
                        "-d", blinking_video_path,
                        "-o", output_dir
                    ]
                    result = subprocess.run(
                        cmd,
                        capture_output=True,
                        text=True,
                        cwd=liveportrait_path
                    )
                    if result.returncode == 0:
                        break
        
        if result.returncode != 0:
            logger.error(f"LivePortrait failed with return code {result.returncode}")
            logger.error(f"STDERR: {result.stderr}")
            logger.error(f"STDOUT: {result.stdout}")
            return None
        
        logger.info(f"LivePortrait output: {result.stdout}")
        
        # Wait a moment for file system to sync
        import time
        time.sleep(1)
        
        # LivePortrait generates files with pattern: {source_name}--{driving_name}.mp4
        # We need to find the generated file
        source_name = Path(avatar_image_path).stem
        driving_name = Path(blinking_video_path).stem
        
        # Check for generated file in output directory
        generated_file = os.path.join(output_dir, f"{source_name}--{driving_name}.mp4")
        
        # Also check for concat version (LivePortrait sometimes generates both)
        generated_file_concat = os.path.join(output_dir, f"{source_name}--{driving_name}_concat.mp4")
        
        # Try to find the generated file
        found_file = None
        if os.path.exists(generated_file):
            found_file = generated_file
        elif os.path.exists(generated_file_concat):
            found_file = generated_file_concat
        else:
            # Try to find any .mp4 file in output directory (most recent)
            if os.path.exists(output_dir):
                output_files = [f for f in os.listdir(output_dir) if f.endswith('.mp4')]
                if output_files:
                    # Use the most recent one
                    latest_file = max(
                        [os.path.join(output_dir, f) for f in output_files],
                        key=os.path.getmtime
                    )
                    found_file = latest_file
        
        if found_file and os.path.exists(found_file):
            # Move/rename to desired output path if different
            if found_file != output_path:
                import shutil
                # Remove target if it exists
                if os.path.exists(output_path):
                    os.remove(output_path)
                shutil.move(found_file, output_path)
            logger.info(f"Blinking animation generated: {output_path}")
            return output_path
        else:
            logger.error(f"Generated video not found in {output_dir}")
            logger.error(f"Expected: {generated_file} or {generated_file_concat}")
            if os.path.exists(output_dir):
                logger.error(f"Files in output dir: {os.listdir(output_dir)}")
            return None
            
    except Exception as e:
        logger.error(f"Error generating blinking animation with LivePortrait: {e}", exc_info=True)
        return None


def generate_blinking_animation_from_urls(
    avatar_image_url: str,
    blinking_video_path: str,
    output_path: Optional[str] = None
) -> Optional[str]:
    """
    Generate blinking animation from avatar image URL
    
    Args:
        avatar_image_url: URL to avatar image
        blinking_video_path: Path to blinking driving video
        output_path: Optional output path. If None, creates temp file
        
    Returns:
        Path to generated video or None if failed
    """
    try:
        # Create temp file for avatar image
        temp_dir = tempfile.gettempdir()
        avatar_image_path = os.path.join(temp_dir, f"avatar_{os.getpid()}.jpg")
        
        # Download avatar image
        if not download_image(avatar_image_url, avatar_image_path):
            logger.error("Failed to download avatar image")
            return None
        
        # Create output path if not provided
        if output_path is None:
            output_path = os.path.join(temp_dir, f"blinking_animation_{os.getpid()}.mp4")
        
        # Generate animation
        result = generate_blinking_animation_liveportrait(
            avatar_image_path=avatar_image_path,
            blinking_video_path=blinking_video_path,
            output_path=output_path
        )
        
        # Cleanup temp avatar image
        try:
            if os.path.exists(avatar_image_path):
                os.remove(avatar_image_path)
        except Exception as e:
            logger.warning(f"Failed to cleanup temp avatar image: {e}")
        
        return result
        
    except Exception as e:
        logger.error(f"Error generating blinking animation from URLs: {e}")
        return None
