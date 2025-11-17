import os
import uuid
import boto3
from io import BytesIO
from typing import Optional, Dict, Any
from dotenv import load_dotenv

load_dotenv()

class R2Client:
    """Client for Cloudflare R2 Storage operations"""
    
    def __init__(self):
        """Initialize the R2 client with credentials from environment variables"""
        self.r2_account_id = os.getenv("R2_ACCOUNT_ID")
        self.r2_access_key = os.getenv("R2_ACCESS_KEY")
        self.r2_secret_key = os.getenv("R2_SECRET_KEY")
        self.r2_bucket = os.getenv("R2_BUCKET")
        self.r2_baseurl = os.getenv("R2_BASEURL")
        self.r2_endpoint = os.getenv("R2_ENDPOINT")
        
        # Initialize the boto3 client with SSL verification disabled for development
        import urllib3
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

        self.r2_client = boto3.client("s3", 
                        endpoint_url=f'https://{self.r2_account_id}.r2.cloudflarestorage.com', 
                        aws_access_key_id=self.r2_access_key, 
                        aws_secret_access_key=self.r2_secret_key
                        # verify=False
        )
        # self.client = boto3.client(
        #     "s3",
        #     endpoint_url=self.r2_endpoint,
        #     aws_access_key_id=self.r2_access_key,
        #     aws_secret_access_key=self.r2_secret_key,
        #     verify=False,
        #     config=boto3.session.Config(signature_version='s3v4')
        # )
    
    def upload_file(self, file_bytes: BytesIO, file_name: str, folder: str = "storyboard") -> Dict[str, Any]:
        """
        Upload a file to R2 storage
        
        Args:
            file_bytes: The file content as BytesIO
            file_name: Original file name
            folder: Folder to store the file in (default: storyboard)
            
        Returns:
            Dictionary with file information including URL
        """
        # Get file size before any operations
        file_size = file_bytes.getbuffer().nbytes
        
        # Get file extension
        _, ext = os.path.splitext(file_name)
        ext = ext.lstrip('.').lower()
        
        # Generate a unique filename
        unique_filename = f"{uuid.uuid4()}.{ext}"
        
        # Create the key (path) in R2
        r2_key = f"{folder}/{unique_filename}"
        
        # Map content types
        content_type_map = {
            "jpg": "image/jpeg",
            "jpeg": "image/jpeg",
            "png": "image/png",
            "gif": "image/gif",
            "webp": "image/webp",
            "svg": "image/svg+xml",
            "pdf": "application/pdf",
            "mp3": "audio/mpeg",
            "wav": "audio/wav",
            "m4a": "audio/mp4",
            "ogg": "audio/ogg",
            "aac": "audio/aac",
            "flac": "audio/flac",
            "mp4": "video/mp4",
            "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "ppt": "application/vnd.ms-powerpoint"
        }
        
        content_type = content_type_map.get(ext, "application/octet-stream")
        
        # Make sure we're at the beginning of the file
        file_bytes.seek(0)
        
        # Upload the file
        self.r2_client.upload_fileobj(
            file_bytes,
            self.r2_bucket,
            r2_key,
            ExtraArgs={
                "ACL": "public-read",
                "ContentType": content_type
            }
        )
        
        # Construct the public URL
        # Ensure no double slashes by removing trailing slash from base URL
        base_url = self.r2_baseurl.rstrip('/')
        file_url = f"{base_url}/{r2_key}"
        
        return {
            "url": file_url,
            "filename": unique_filename,
            "original_filename": file_name,
            "content_type": content_type,
            "size": file_size,
            "path": r2_key
        }
    
    def delete_file(self, file_path: str) -> bool:
        """
        Delete a file from R2 storage
        
        Args:
            file_path: The path of the file in R2
            
        Returns:
            True if successful, False otherwise
        """
        try:
            self.r2_client.delete_object(
                Bucket=self.r2_bucket,
                Key=file_path
            )
            return True
        except Exception as e:
            print(f"Error deleting file from R2: {e}")
            return False

# Create a singleton instance
r2_client = R2Client()
