"""
Test script for blinking video generation using LivePortrait
"""
import os
import sys
import tempfile
from io import BytesIO

# Add the server directory to the path so we can import utils
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.liveportrait_utils import generate_blinking_animation_from_urls
from utils.r2_client import r2_client


def test_blinking_video(image_url: str = None, output_path: str = None, upload_to_r2: bool = False):
    """
    Test blinking video generation
    
    Args:
        image_url: URL to avatar image (if None, uses a default test image)
        output_path: Path to save output video (if None, uses temp file)
        upload_to_r2: Whether to upload the result to R2
    """
    try:
        # Default test image URL (you can change this)
        if image_url is None:
            # Use a default avatar image URL - replace with your test image
            image_url = input("Enter avatar image URL (or press Enter to use default): ").strip()
            if not image_url:
                print("ERROR: Please provide an image URL")
                return None
        
        # Path to blinking video template
        blinking_video_path = os.path.join(
            os.path.dirname(__file__), "..", "static", "blinking.mp4"
        )
        
        if not os.path.exists(blinking_video_path):
            print(f"ERROR: Blinking video template not found at: {blinking_video_path}")
            return None
        
        print(f"Using blinking video template: {blinking_video_path}")
        print(f"Processing image: {image_url}")
        
        # Generate output path if not provided
        if output_path is None:
            temp_dir = tempfile.gettempdir()
            output_path = os.path.join(temp_dir, "test_blinking_animation.mp4")
        
        print(f"Generating blinking animation...")
        print("This may take several minutes...")
        
        # Generate blinking animation
        result_path = generate_blinking_animation_from_urls(
            avatar_image_url=image_url,
            blinking_video_path=blinking_video_path,
            output_path=output_path
        )
        
        if not result_path or not os.path.exists(result_path):
            print("ERROR: Failed to generate blinking animation")
            return None
        
        print(f"SUCCESS: Blinking animation generated!")
        print(f"Output path: {result_path}")
        
        # Upload to R2 if requested
        if upload_to_r2:
            print("\nUploading to R2...")
            with open(result_path, 'rb') as f:
                video_bytes = BytesIO(f.read())
            
            upload_result = r2_client.upload_file(
                file_bytes=video_bytes,
                file_name="test_blinking_animation.mp4",
                folder="blinking_videos"
            )
            
            print(f"SUCCESS: Uploaded to R2!")
            print(f"URL: {upload_result['url']}")
            print(f"Path: {upload_result['path']}")
            return upload_result['url']
        
        return result_path
        
    except Exception as e:
        print(f"ERROR: Error generating blinking video: {e}")
        import traceback
        traceback.print_exc()
        return None


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Test blinking video generation")
    parser.add_argument("--image-url", type=str, help="URL to avatar image")
    parser.add_argument("--output", type=str, help="Output path for video")
    parser.add_argument("--upload", action="store_true", help="Upload result to R2")
    
    args = parser.parse_args()
    
    result = test_blinking_video(
        image_url=args.image_url,
        output_path=args.output,
        upload_to_r2=args.upload
    )
    
    if result:
        print("\n✅ Test completed successfully!")
    else:
        print("\n❌ Test failed!")
        sys.exit(1)

