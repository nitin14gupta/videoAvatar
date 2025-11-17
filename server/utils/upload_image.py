"""
Script to upload doctor.png to R2 storage
"""
import os
from io import BytesIO
from utils.r2_client import r2_client

def upload_doctor_image():
    """Upload doctor.png to R2 avatars folder"""
    try:
        # Read the doctor.png file
        image_path = os.path.join(os.path.dirname(__file__), "doctor.png")
        
        if not os.path.exists(image_path):
            print(f"Error: {image_path} not found")
            return None
        
        with open(image_path, "rb") as f:
            file_bytes = BytesIO(f.read())
        
        # Upload to R2
        result = r2_client.upload_file(file_bytes, "doctor.png", folder="avatars")
        
        print(f"✅ Doctor image uploaded successfully!")
        print(f"URL: {result['url']}")
        print(f"Path: {result['path']}")
        
        return result['url']
    except Exception as e:
        print(f"❌ Error uploading doctor image: {e}")
        return None

if __name__ == "__main__":
    upload_doctor_image()
