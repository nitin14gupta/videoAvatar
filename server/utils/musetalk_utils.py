"""
MuseTalk utility for real-time lip synchronization
Integrates MuseTalk v1.5 for generating lip-synced video frames from audio
"""
import os
import sys
import logging
import torch
import numpy as np
import cv2
import tempfile
import base64
from typing import Optional, Tuple, List
from pathlib import Path

# Add MuseTalk to path
# Handle both Windows and Linux paths
_project_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
MUSETALK_DIR = os.path.join(_project_root, "MuseTalk")
# Also check if running from WSL/Linux with Windows mount
if not os.path.exists(MUSETALK_DIR):
    # Try Windows path from Linux
    _project_root_win = os.path.join("/mnt/c", "Project", "videoAvatar")
    MUSETALK_DIR = os.path.join(_project_root_win, "MuseTalk")
if MUSETALK_DIR not in sys.path:
    sys.path.insert(0, MUSETALK_DIR)

from musetalk.utils.utils import load_all_model
from musetalk.utils.audio_processor import AudioProcessor
from musetalk.utils.face_parsing import FaceParsing
from musetalk.utils.preprocessing import get_landmark_and_bbox, read_imgs, coord_placeholder
from musetalk.utils.blending import get_image_prepare_material, get_image_blending
from musetalk.utils.utils import datagen
from transformers import WhisperModel

logger = logging.getLogger(__name__)

# Global MuseTalk instances
_vae = None
_unet = None
_pe = None
_whisper = None
_audio_processor = None
_face_parser = None
_device = None
_weight_dtype = None
_timesteps = None
_initialized = False

# Avatar cache - stores preprocessed avatar data
_avatar_cache = {}


class AvatarProcessor:
    """Processes avatar images and generates lip-synced frames"""
    
    def __init__(self, avatar_id: str, image_path: str, bbox_shift: int = 0, 
                 extra_margin: int = 10, parsing_mode: str = "jaw",
                 left_cheek_width: int = 90, right_cheek_width: int = 90):
        self.avatar_id = avatar_id
        self.image_path = image_path
        self.bbox_shift = bbox_shift
        self.extra_margin = extra_margin
        self.parsing_mode = parsing_mode
        self.left_cheek_width = left_cheek_width
        self.right_cheek_width = right_cheek_width
        
        # Preprocessed data
        self.frame_list_cycle = None
        self.coord_list_cycle = None
        self.input_latent_list_cycle = None
        self.mask_list_cycle = None
        self.mask_coords_list_cycle = None
        
        self._preprocess()
    
    def _preprocess(self):
        """Preprocess avatar image - extract frames, landmarks, latents, masks"""
        logger.info(f"Preprocessing avatar {self.avatar_id}...")
        
        # Read image
        if os.path.isfile(self.image_path):
            frame = cv2.imread(self.image_path)
            frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            input_img_list = [self.image_path]
        else:
            raise ValueError(f"Image path does not exist: {self.image_path}")
        
        # Extract landmarks and bbox
        coord_list, frame_list = get_landmark_and_bbox(input_img_list, self.bbox_shift)
        
        if not coord_list or coord_list[0] == coord_placeholder:
            raise ValueError(f"No face detected in avatar image: {self.image_path}")
        
        # Extract latents
        input_latent_list = []
        bbox = coord_list[0]
        x1, y1, x2, y2 = bbox
        y2 = y2 + self.extra_margin
        y2 = min(y2, frame.shape[0])
        
        crop_frame = frame[y1:y2, x1:x2]
        crop_frame = cv2.resize(crop_frame, (256, 256), interpolation=cv2.INTER_LANCZOS4)
        latents = _vae.get_latents_for_unet(crop_frame)
        input_latent_list.append(latents)
        
        # Create cycle (forward + reverse for smooth looping)
        self.frame_list_cycle = frame_list + frame_list[::-1]
        self.coord_list_cycle = coord_list + coord_list[::-1]
        self.input_latent_list_cycle = input_latent_list + input_latent_list[::-1]
        
        # Prepare masks
        self.mask_list_cycle = []
        self.mask_coords_list_cycle = []
        
        for i, frame in enumerate(self.frame_list_cycle):
            x1, y1, x2, y2 = self.coord_list_cycle[i]
            mask, crop_box = get_image_prepare_material(
                frame, [x1, y1, x2, y2], 
                fp=_face_parser, 
                mode=self.parsing_mode
            )
            self.mask_list_cycle.append(mask)
            self.mask_coords_list_cycle.append(crop_box)
        
        logger.info(f"Avatar {self.avatar_id} preprocessed successfully")
    
    @torch.no_grad()
    def generate_frames(self, audio_path: str, fps: int = 25, 
                       batch_size: int = 8) -> List[np.ndarray]:
        """
        Generate lip-synced frames from audio
        
        Args:
            audio_path: Path to audio file
            fps: Frames per second
            batch_size: Batch size for inference
            
        Returns:
            List of RGB frames (numpy arrays)
        """
        if not _initialized:
            raise RuntimeError("MuseTalk not initialized. Call initialize_musetalk() first.")
        
        logger.info(f"Generating lip-sync frames for avatar {self.avatar_id}...")
        
        # Extract audio features
        whisper_input_features, librosa_length = _audio_processor.get_audio_feature(
            audio_path, weight_dtype=_weight_dtype
        )
        
        whisper_chunks = _audio_processor.get_whisper_chunk(
            whisper_input_features,
            _device,
            _weight_dtype,
            _whisper,
            librosa_length,
            fps=fps,
            audio_padding_length_left=2,
            audio_padding_length_right=2,
        )
        
        # Generate frames batch by batch
        video_num = len(whisper_chunks)
        gen = datagen(
            whisper_chunks=whisper_chunks,
            vae_encode_latents=self.input_latent_list_cycle,
            batch_size=batch_size,
            delay_frame=0,
            device=_device,
        )
        
        res_frame_list = []
        for i, (whisper_batch, latent_batch) in enumerate(gen):
            audio_feature_batch = _pe(whisper_batch.to(_device))
            latent_batch = latent_batch.to(device=_device, dtype=_weight_dtype)
            
            pred_latents = _unet.model(
                latent_batch,
                _timesteps,
                encoder_hidden_states=audio_feature_batch
            ).sample
            
            pred_latents = pred_latents.to(device=_device, dtype=_vae.vae.dtype)
            recon = _vae.decode_latents(pred_latents)
            
            for res_frame in recon:
                res_frame_list.append(res_frame)
        
        # Blend frames back to original image
        final_frames = []
        for i, res_frame in enumerate(res_frame_list):
            bbox = self.coord_list_cycle[i % len(self.coord_list_cycle)]
            ori_frame = self.frame_list_cycle[i % len(self.frame_list_cycle)].copy()
            x1, y1, x2, y2 = bbox
            
            try:
                res_frame_resized = cv2.resize(res_frame.astype(np.uint8), (x2 - x1, y2 - y1))
            except:
                continue
            
            mask = self.mask_list_cycle[i % len(self.mask_list_cycle)]
            mask_crop_box = self.mask_coords_list_cycle[i % len(self.mask_coords_list_cycle)]
            
            combine_frame = get_image_blending(
                ori_frame, res_frame_resized, bbox, mask, mask_crop_box
            )
            
            final_frames.append(combine_frame)
        
        logger.info(f"Generated {len(final_frames)} lip-sync frames")
        return final_frames


def initialize_musetalk(use_float16: bool = True, gpu_id: int = 0):
    """
    Initialize MuseTalk models on server startup
    
    Args:
        use_float16: Use float16 for faster inference (requires GPU)
        gpu_id: GPU ID to use
    """
    global _vae, _unet, _pe, _whisper, _audio_processor, _face_parser
    global _device, _weight_dtype, _timesteps, _initialized
    
    if _initialized:
        logger.info("MuseTalk already initialized")
        return
    
    logger.info("Initializing MuseTalk models...")
    
    # Set device
    _device = torch.device(f"cuda:{gpu_id}" if torch.cuda.is_available() else "cpu")
    logger.info(f"MuseTalk Device: {_device}")
    
    # Set model paths
    musetalk_dir = os.path.join(MUSETALK_DIR, "models")
    unet_model_path = os.path.join(musetalk_dir, "musetalkV15", "unet.pth")
    unet_config = os.path.join(musetalk_dir, "musetalkV15", "musetalk.json")
    vae_type = "sd-vae"
    whisper_dir = os.path.join(musetalk_dir, "whisper")
    
    if not os.path.exists(unet_model_path):
        raise FileNotFoundError(f"MuseTalk model not found: {unet_model_path}")
    
    # Load models
    try:
        _vae, _unet, _pe = load_all_model(
            unet_model_path=unet_model_path,
            vae_type=vae_type,
            unet_config=unet_config,
            device=_device
        )
        logger.info("✓ MuseTalk VAE and UNet loaded")
    except Exception as e:
        logger.error(f"✗ Failed to load MuseTalk models: {e}")
        raise
    
    # Set data type
    if use_float16 and _device.type == "cuda":
        _weight_dtype = torch.float16
        _pe = _pe.half().to(_device)
        _vae.vae = _vae.vae.half().to(_device)
        _unet.model = _unet.model.half().to(_device)
        logger.info("✓ Models converted to float16")
    else:
        _weight_dtype = torch.float32
        _pe = _pe.to(_device)
        _vae.vae = _vae.vae.to(_device)
        _unet.model = _unet.model.to(_device)
        logger.info("✓ Models using float32")
    
    _timesteps = torch.tensor([0], device=_device)
    
    # Initialize audio processor and Whisper
    try:
        _audio_processor = AudioProcessor(feature_extractor_path=whisper_dir)
        _whisper = WhisperModel.from_pretrained(whisper_dir)
        _whisper = _whisper.to(device=_device, dtype=_weight_dtype).eval()
        _whisper.requires_grad_(False)
        logger.info("✓ Whisper model loaded for MuseTalk")
    except Exception as e:
        logger.error(f"✗ Failed to load Whisper: {e}")
        raise
    
    # Initialize face parser
    try:
        _face_parser = FaceParsing(
            left_cheek_width=90,
            right_cheek_width=90
        )
        logger.info("✓ Face parser initialized")
    except Exception as e:
        logger.error(f"✗ Failed to initialize face parser: {e}")
        raise
    
    _initialized = True
    logger.info("✓ MuseTalk initialized successfully")


def get_avatar_processor(avatar_id: str, image_url: str, 
                        bbox_shift: int = 0) -> AvatarProcessor:
    """
    Get or create avatar processor (with caching)
    
    Args:
        avatar_id: Unique avatar ID
        image_url: URL or path to avatar image
        bbox_shift: Bounding box shift parameter
        
    Returns:
        AvatarProcessor instance
    """
    cache_key = f"{avatar_id}_{bbox_shift}"
    
    if cache_key in _avatar_cache:
        logger.info(f"Using cached avatar processor for {avatar_id}")
        return _avatar_cache[cache_key]
    
    # Download image if URL
    if image_url.startswith("http"):
        import requests
        temp_dir = tempfile.gettempdir()
        image_path = os.path.join(temp_dir, f"avatar_{avatar_id}.png")
        
        if not os.path.exists(image_path):
            response = requests.get(image_url, timeout=30)
            if response.status_code == 200:
                with open(image_path, 'wb') as f:
                    f.write(response.content)
                logger.info(f"Downloaded avatar image: {image_url}")
            else:
                raise ValueError(f"Failed to download avatar image: {response.status_code}")
    else:
        image_path = image_url
    
    # Create processor
    processor = AvatarProcessor(
        avatar_id=avatar_id,
        image_path=image_path,
        bbox_shift=bbox_shift,
        extra_margin=10,
        parsing_mode="jaw",
        left_cheek_width=90,
        right_cheek_width=90
    )
    
    _avatar_cache[cache_key] = processor
    return processor


def generate_lip_sync_video(audio_bytes: bytes, avatar_id: str, 
                           image_url: str, fps: int = 25) -> bytes:
    """
    Generate lip-synced video from audio bytes
    
    Args:
        audio_bytes: Audio data as bytes (WAV format)
        avatar_id: Avatar ID
        image_url: Avatar image URL
        fps: Frames per second
        
    Returns:
        Video bytes (MP4 format)
    """
    if not _initialized:
        raise RuntimeError("MuseTalk not initialized")
    
    # Save audio to temp file
    temp_audio = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
    temp_audio.write(audio_bytes)
    temp_audio.close()
    
    try:
        # Get avatar processor
        processor = get_avatar_processor(avatar_id, image_url)
        
        # Generate frames
        frames = processor.generate_frames(temp_audio.name, fps=fps, batch_size=8)
        
        # Convert frames to video
        temp_video = tempfile.NamedTemporaryFile(suffix='.mp4', delete=False)
        temp_video.close()
        
        # Use imageio to save video
        import imageio
        imageio.mimwrite(
            temp_video.name,
            frames,
            'FFMPEG',
            fps=fps,
            codec='libx264',
            pixelformat='yuv420p'
        )
        
        # Read video bytes
        with open(temp_video.name, 'rb') as f:
            video_bytes = f.read()
        
        # Cleanup
        os.unlink(temp_audio.name)
        os.unlink(temp_video.name)
        
        return video_bytes
        
    except Exception as e:
        logger.error(f"Error generating lip-sync video: {e}")
        # Cleanup on error
        if os.path.exists(temp_audio.name):
            os.unlink(temp_audio.name)
        raise


def is_initialized() -> bool:
    """Check if MuseTalk is initialized"""
    return _initialized

