"""
Script to upload doctor.png to R2 storage
"""
import os
import sys
from io import BytesIO

# Add the server directory to the path so we can import utils
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.r2_client import r2_client

def upload_doctor_image():
    """Upload doctor.png to R2 avatars folder"""
    try:
        # Read the doctor.png file
        image_path = os.path.join(os.path.dirname(__file__), "doctor.jpeg")
        
        if not os.path.exists(image_path):
            print(f"Error: {image_path} not found")
            return None
        
        with open(image_path, "rb") as f:
            file_bytes = BytesIO(f.read())
        
        # Upload to R2
        result = r2_client.upload_file(file_bytes, "doctor.png", folder="avatars")
        
        print(f"SUCCESS: Doctor image uploaded successfully!")
        print(f"URL: {result['url']}")
        print(f"Path: {result['path']}")
        
        return result['url']
    except Exception as e:
        print(f"ERROR: Error uploading doctor image: {e}")
        return None

if __name__ == "__main__":
    upload_doctor_image()

