"""
Test script for thinking sound generation using TTS
"""
import os
import sys
import tempfile
from io import BytesIO

# Add the server directory to the path so we can import utils
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.tts_utils import text_to_speech_with_voice_cloning
from utils.r2_client import r2_client


def test_thinking_sound(
    audio_url: str = None,
    language: str = "en",
    output_path: str = None,
    upload_to_r2: bool = False,
    thinking_text: str = ""
):
    """
    Test thinking sound generation using TTS with voice cloning
    
    Args:
        audio_url: URL to reference audio file for voice cloning
        language: Language code (default: "en")
        output_path: Path to save output audio (if None, uses temp file)
        upload_to_r2: Whether to upload the result to R2
        thinking_text: Text to generate as thinking sound (default: "hmm... hmmm... hmm")
    """
    try:
        # Get audio URL if not provided
        if audio_url is None:
            audio_url = input("Enter reference audio URL (or press Enter to use default): ").strip()
            if not audio_url:
                print("ERROR: Please provide an audio URL")
                return None
        
        print(f"Using reference audio: {audio_url}")
        print(f"Language: {language}")
        print(f"Thinking text: {thinking_text}")
        
        # Generate output path if not provided
        if output_path is None:
            temp_dir = tempfile.gettempdir()
            output_path = os.path.join(temp_dir, "test_thinking_sound.wav")
        
        print(f"\nGenerating thinking sound...")
        print("This may take a minute...")
        
        # Generate thinking sound
        result_path = text_to_speech_with_voice_cloning(
            text=thinking_text,
            reference_audio_url=audio_url,
            language=language,
            output_path=output_path
        )
        
        if not result_path or not os.path.exists(result_path):
            print("ERROR: Failed to generate thinking sound")
            return None
        
        # Check file size
        file_size = os.path.getsize(result_path)
        print(f"SUCCESS: Thinking sound generated!")
        print(f"Output path: {result_path}")
        print(f"File size: {file_size} bytes ({file_size / 1024:.2f} KB)")
        
        # Upload to R2 if requested
        if upload_to_r2:
            print("\nUploading to R2...")
            with open(result_path, 'rb') as f:
                audio_bytes = BytesIO(f.read())
            
            upload_result = r2_client.upload_file(
                file_bytes=audio_bytes,
                file_name="test_thinking_sound.wav",
                folder="thinking_sounds"
            )
            
            print(f"SUCCESS: Uploaded to R2!")
            print(f"URL: {upload_result['url']}")
            print(f"Path: {upload_result['path']}")
            return upload_result['url']
        
        return result_path
        
    except Exception as e:
        print(f"ERROR: Error generating thinking sound: {e}")
        import traceback
        traceback.print_exc()
        return None


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Test thinking sound generation")
    parser.add_argument("--audio-url", type=str, help="URL to reference audio file")
    parser.add_argument("--language", type=str, default="en", help="Language code (default: en)")
    parser.add_argument("--output", type=str, help="Output path for audio file")
    parser.add_argument("--text", type=str, default="hmm... hmmm... hmm", help="Thinking sound text")
    parser.add_argument("--upload", action="store_true", help="Upload result to R2")
    
    args = parser.parse_args()
    
    result = test_thinking_sound(
        audio_url=args.audio_url,
        language=args.language,
        output_path=args.output,
        upload_to_r2=args.upload,
        thinking_text=args.text
    )
    
    if result:
        print("\n✅ Test completed successfully!")
    else:
        print("\n❌ Test failed!")
        sys.exit(1)

