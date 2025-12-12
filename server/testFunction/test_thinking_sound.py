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
    thinking_text: str = "",
    generate_variations: bool = False
):
    """
    Test thinking sound generation using TTS with voice cloning
    
    Args:
        audio_url: URL to reference audio file for voice cloning
        language: Language code (default: "en")
        output_path: Path to save output audio (if None, uses temp file)
        upload_to_r2: Whether to upload the result to R2
        thinking_text: Text to generate as thinking sound (if empty and generate_variations=False, uses default)
        generate_variations: If True, generates multiple variations (3-4) like in production
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
        
        # If generating variations, use the standard set
        if generate_variations:
            thinking_texts = [
                "Hmm",
                "Hmm, hmm",
                "Uh, hmm",
                "Let me think",
                "Hmm, just a moment",
            ]
            print(f"Generating {len(thinking_texts)} thinking sound variations...")
        else:
            # Use provided text or default
            if not thinking_text:
                thinking_text = "hmm... hmmm... hmm"
            thinking_texts = [thinking_text]
            print(f"Thinking text: {thinking_text}")
        
        temp_dir = tempfile.gettempdir()
        results = []
        
        # Generate each variation
        for i, text in enumerate(thinking_texts):
            print(f"\n[{i+1}/{len(thinking_texts)}] Generating: '{text}'...")
            
            # Generate output path if not provided
            if output_path is None or generate_variations:
                variation_path = os.path.join(temp_dir, f"test_thinking_sound_{i}.wav")
            else:
                variation_path = output_path
            
            # Generate thinking sound
            result_path = text_to_speech_with_voice_cloning(
                text=text,
                reference_audio_url=audio_url,
                language=language,
                output_path=variation_path
            )
            
            if not result_path or not os.path.exists(result_path):
                print(f"ERROR: Failed to generate thinking sound variation {i+1}")
                continue
            
            # Check file size
            file_size = os.path.getsize(result_path)
            print(f"✅ Variation {i+1} generated: {file_size} bytes ({file_size / 1024:.2f} KB)")
            
            # Upload to R2 if requested
            if upload_to_r2:
                print(f"Uploading variation {i+1} to R2...")
                with open(result_path, 'rb') as f:
                    audio_bytes = BytesIO(f.read())
                
                upload_result = r2_client.upload_file(
                    file_bytes=audio_bytes,
                    file_name=f"test_thinking_sound_{i}.wav",
                    folder="thinking_sounds"
                )
                
                print(f"✅ Uploaded: {upload_result['url']}")
                results.append(upload_result['url'])
            else:
                results.append(result_path)
        
        if not results:
            print("ERROR: No thinking sounds were generated")
            return None
        
        if generate_variations:
            print(f"\n✅ Successfully generated {len(results)} thinking sound variations!")
            if upload_to_r2:
                print(f"\nURLs:")
                for i, url in enumerate(results):
                    print(f"  Variation {i+1}: {url}")
        else:
            print(f"\n✅ Thinking sound generated!")
            print(f"Output: {results[0]}")
        
        return results if generate_variations else results[0]
        
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
    parser.add_argument("--text", type=str, default="", help="Thinking sound text (ignored if --variations is used)")
    parser.add_argument("--upload", action="store_true", help="Upload result to R2")
    parser.add_argument("--variations", action="store_true", help="Generate multiple variations (like production)")
    
    args = parser.parse_args()
    
    result = test_thinking_sound(
        audio_url=args.audio_url,
        language=args.language,
        output_path=args.output,
        upload_to_r2=args.upload,
        thinking_text=args.text,
        generate_variations=args.variations
    )
    
    if result:
        print("\n✅ Test completed successfully!")
    else:
        print("\n❌ Test failed!")
        sys.exit(1)

