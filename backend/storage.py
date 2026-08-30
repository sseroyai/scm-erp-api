import os
from abc import ABC, abstractmethod
from typing import Optional
from dotenv import load_dotenv
import boto3
from botocore.config import Config
import logging

# Load environment variables
load_dotenv()

class StorageProvider(ABC):
    @abstractmethod
    def get_file_path(self, filename: str) -> Optional[str]:
        """Return local file path if file exists, else None"""
        pass

    @abstractmethod
    def get_download_url(self, filename: str) -> Optional[str]:
        """For S3-like providers, return signed URL. Local providers may return None."""
        pass


class LocalStorageProvider(StorageProvider):
    def __init__(self, base_path: str):
        self.base_path = base_path
        os.makedirs(self.base_path, exist_ok=True)

    def get_file_path(self, filename: str) -> Optional[str]:
        # Basic sanitization to prevent directory traversal
        safe_filename = os.path.basename(filename)
        file_path = os.path.join(self.base_path, safe_filename)
        if os.path.exists(file_path):
            return file_path
        return None

    def get_download_url(self, filename: str) -> Optional[str]:
        # Local storage doesn't provide a direct external URL here; 
        # it will be streamed via FastAPI FileResponse.
        return None


class S3StorageProvider(StorageProvider):
    def __init__(self, bucket_name: str, endpoint_url: str, aws_access_key_id: str, aws_secret_access_key: str):
        self.bucket_name = bucket_name
        
        # Configure botocore to use signature version s3v4, required by R2
        my_config = Config(
            signature_version='s3v4',
        )

        self.s3_client = boto3.client(
            's3',
            endpoint_url=endpoint_url,
            aws_access_key_id=aws_access_key_id,
            aws_secret_access_key=aws_secret_access_key,
            config=my_config,
            region_name='auto' # Cloudflare R2 usually uses 'auto' or 'us-east-1'
        )

    def get_file_path(self, filename: str) -> Optional[str]:
        # S3 does not have a local file path
        return None

    def get_download_url(self, filename: str) -> Optional[str]:
        try:
            url = self.s3_client.generate_presigned_url(
                ClientMethod='get_object',
                Params={'Bucket': self.bucket_name, 'Key': filename},
                ExpiresIn=3600
            )
            return url
        except Exception as e:
            logging.error(f"Error generating presigned URL for {filename}: {e}")
            return None

# Initialize the default provider
R2_BUCKET_NAME = os.getenv("R2_BUCKET_NAME")
R2_ENDPOINT_URL = os.getenv("R2_ENDPOINT_URL")
R2_ACCESS_KEY_ID = os.getenv("R2_ACCESS_KEY_ID")
R2_SECRET_ACCESS_KEY = os.getenv("R2_SECRET_ACCESS_KEY")

if R2_BUCKET_NAME and R2_ENDPOINT_URL and R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY:
    print(f"Using Cloudflare R2 Storage Provider with bucket: {R2_BUCKET_NAME}")
    default_storage = S3StorageProvider(
        bucket_name=R2_BUCKET_NAME,
        endpoint_url=R2_ENDPOINT_URL,
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY
    )
else:
    print("Using Local Storage Provider for documents")
    DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "documents")
    default_storage = LocalStorageProvider(base_path=DATA_DIR)
