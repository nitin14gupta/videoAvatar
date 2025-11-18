#!/usr/bin/env python3
"""
Script to clear Whisper model cache to fix vocabulary/model loading errors.
Run this if you get "Cannot load the target vocabulary from the model directory" error.
"""
import os
import shutil
from pathlib import Path

def clear_whisper_cache():
    """Clear the HuggingFace cache for faster-whisper models"""
    
    # Common cache locations
    cache_paths = [
        Path.home() / ".cache" / "huggingface" / "hub",
        Path.home() / ".cache" / "huggingface" / "transformers",
    ]
    
    model_patterns = [
        "models--Systran--faster-whisper-",
        "models--openai--whisper-",
    ]
    
    cleared = False
    
    for cache_path in cache_paths:
        if not cache_path.exists():
            print(f"Cache path does not exist: {cache_path}")
            continue
        
        print(f"Checking cache: {cache_path}")
        
        # Find model directories
        for item in cache_path.iterdir():
            if item.is_dir():
                for pattern in model_patterns:
                    if pattern in item.name:
                        print(f"Found model cache: {item}")
                        try:
                            shutil.rmtree(item)
                            print(f"  ✓ Deleted: {item}")
                            cleared = True
                        except Exception as e:
                            print(f"  ✗ Failed to delete {item}: {e}")
    
    if cleared:
        print("\n✓ Cache cleared! Restart your server to re-download the models.")
    else:
        print("\nNo Whisper model cache found. Models will be downloaded on first use.")
    
    return cleared

if __name__ == "__main__":
    print("Clearing Whisper model cache...")
    print("=" * 50)
    clear_whisper_cache()
    print("=" * 50)

