"""
Test script for complete avatar processing (blinking video + thinking sound)
This tests the full pipeline used during avatar creation
"""
import os
import sys
import tempfile
import asyncio
from io import BytesIO

# Add the server directory to the path so we can import utils
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.liveportrait_utils import generate_blinking_animation_from_urls
from utils.tts_utils import text_to_speech_with_voice_cloning
from utils.r2_client import r2_client


async def test_avatar_processing(
    image_url: str = None,
    audio_url: str = None,
    language: str = "en",
    upload_to_r2: bool = False
):
    """
    Test complete avatar processing pipeline:
    1. Generate blinking video using LivePortrait
    2. Generate thinking sound using TTS
    
    Args:
        image_url: URL to avatar image
        audio_url: URL to reference audio file for voice cloning
        language: Language code (default: "en")
        upload_to_r2: Whether to upload results to R2
    """
    try:
        # Get inputs if not provided
        if image_url is None:
            image_url = input("Enter avatar image URL: ").strip()
            if not image_url:
                print("ERROR: Please provide an image URL")
                return None
        
        if audio_url is None:
            audio_url = input("Enter reference audio URL: ").strip()
            if not audio_url:
                print("WARNING: No audio URL provided, skipping thinking sound generation")
        
        print("\n" + "="*60)
        print("AVATAR PROCESSING TEST")
        print("="*60)
        print(f"Image URL: {image_url}")
        print(f"Audio URL: {audio_url or 'None'}")
        print(f"Language: {language}")
        print("="*60 + "\n")
        
        temp_dir = tempfile.gettempdir()
        results = {}
        
        # Step 1: Generate blinking video
        print("STEP 1: Generating blinking video...")
        print("This may take several minutes...\n")
        
        blinking_video_path = os.path.join(
            os.path.dirname(__file__), "..", "static", "blinking.mp4"
        )
        
        if not os.path.exists(blinking_video_path):
            print(f"ERROR: Blinking video template not found at: {blinking_video_path}")
            return None
        
        output_video_path = os.path.join(temp_dir, "test_blinking_animation.mp4")
        
        video_result = await asyncio.to_thread(
            generate_blinking_animation_from_urls,
            avatar_image_url=image_url,
            blinking_video_path=blinking_video_path,
            output_path=output_video_path
        )
        
        if not video_result or not os.path.exists(video_result):
            print("ERROR: Failed to generate blinking video")
            return None
        
        print(f"✅ Blinking video generated: {video_result}")
        results['blinking_video'] = video_result
        
        # Upload blinking video to R2 if requested
        if upload_to_r2:
            print("\nUploading blinking video to R2...")
            with open(video_result, 'rb') as f:
                video_bytes = BytesIO(f.read())
            
            video_upload = r2_client.upload_file(
                file_bytes=video_bytes,
                file_name="test_blinking_animation.mp4",
                folder="blinking_videos"
            )
            results['blinking_video_url'] = video_upload['url']
            print(f"✅ Uploaded: {video_upload['url']}")
        
        # Step 2: Generate thinking sound (if audio URL provided)
        if audio_url:
            print("\n" + "-"*60)
            print("STEP 2: Generating thinking sound...")
            print("This may take a minute...\n")
            
            thinking_text = "hmm... hmmm... hmm"
            thinking_sound_path = os.path.join(temp_dir, "test_thinking_sound.wav")
            
            thinking_result = await asyncio.to_thread(
                text_to_speech_with_voice_cloning,
                text=thinking_text,
                reference_audio_url=audio_url,
                language=language,
                output_path=thinking_sound_path
            )
            
            if thinking_result and os.path.exists(thinking_result):
                print(f"✅ Thinking sound generated: {thinking_result}")
                results['thinking_sound'] = thinking_result
                
                # Upload thinking sound to R2 if requested
                if upload_to_r2:
                    print("\nUploading thinking sound to R2...")
                    with open(thinking_result, 'rb') as f:
                        audio_bytes = BytesIO(f.read())
                    
                    audio_upload = r2_client.upload_file(
                        file_bytes=audio_bytes,
                        file_name="test_thinking_sound.wav",
                        folder="thinking_sounds"
                    )
                    results['thinking_sound_url'] = audio_upload['url']
                    print(f"✅ Uploaded: {audio_upload['url']}")
            else:
                print("WARNING: Failed to generate thinking sound")
        else:
            print("\nSkipping thinking sound generation (no audio URL)")
        
        # Summary
        print("\n" + "="*60)
        print("PROCESSING COMPLETE")
        print("="*60)
        print("\nResults:")
        if 'blinking_video' in results:
            print(f"  Blinking Video: {results['blinking_video']}")
        if 'blinking_video_url' in results:
            print(f"  Blinking Video URL: {results['blinking_video_url']}")
        if 'thinking_sound' in results:
            print(f"  Thinking Sound: {results['thinking_sound']}")
        if 'thinking_sound_url' in results:
            print(f"  Thinking Sound URL: {results['thinking_sound_url']}")
        print("="*60)
        
        return results
        
    except Exception as e:
        print(f"ERROR: Error in avatar processing: {e}")
        import traceback
        traceback.print_exc()
        return None


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Test complete avatar processing pipeline")
    parser.add_argument("--image-url", type=str, help="URL to avatar image")
    parser.add_argument("--audio-url", type=str, help="URL to reference audio file")
    parser.add_argument("--language", type=str, default="en", help="Language code (default: en)")
    parser.add_argument("--upload", action="store_true", help="Upload results to R2")
    
    args = parser.parse_args()
    
    result = asyncio.run(test_avatar_processing(
        image_url=args.image_url,
        audio_url=args.audio_url,
        language=args.language,
        upload_to_r2=args.upload
    ))
    
    if result:
        print("\n✅ All tests completed successfully!")
    else:
        print("\n❌ Tests failed!")
        sys.exit(1)

