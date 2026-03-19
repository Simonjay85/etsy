"""
Storage Service
---------------
Unified file storage abstraction.
Backend: local filesystem (dev) or Cloudflare R2 / S3 (production).

Usage:
    from app.services.storage import storage
    url  = await storage.save("thumbnails/job_abc.jpg", file_bytes)
    data = await storage.load("thumbnails/job_abc.jpg")
    await storage.delete("thumbnails/job_abc.jpg")
"""
import os, asyncio
from pathlib import Path
from typing import Optional
from loguru import logger
from app.core.config import settings


class LocalStorage:
    """Simple local filesystem storage for development."""

    def __init__(self, base_path: str):
        self.base = Path(base_path)
        self.base.mkdir(parents=True, exist_ok=True)

    async def save(self, key: str, data: bytes) -> str:
        path = self.base / key
        path.parent.mkdir(parents=True, exist_ok=True)
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, path.write_bytes, data)
        return str(path)

    async def save_file(self, key: str, src_path: str) -> str:
        """Copy an existing file into storage."""
        with open(src_path, "rb") as f:
            data = f.read()
        return await self.save(key, data)

    async def load(self, key: str) -> Optional[bytes]:
        path = self.base / key
        if not path.exists():
            return None
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, path.read_bytes)

    async def delete(self, key: str) -> bool:
        path = self.base / key
        if path.exists():
            path.unlink()
            return True
        return False

    async def exists(self, key: str) -> bool:
        return (self.base / key).exists()

    def public_url(self, key: str) -> str:
        """Return a URL path for serving static files."""
        return f"/static/{key}"

    def local_path(self, key: str) -> str:
        return str(self.base / key)


class R2Storage:
    """Cloudflare R2 storage (S3-compatible API)."""

    def __init__(self):
        import boto3
        self.s3 = boto3.client(
            "s3",
            endpoint_url=settings.R2_ENDPOINT_URL,
            aws_access_key_id=settings.R2_ACCESS_KEY_ID,
            aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
            region_name="auto",
        )
        self.bucket = settings.R2_BUCKET_NAME

    async def save(self, key: str, data: bytes) -> str:
        loop = asyncio.get_event_loop()
        content_type = self._guess_content_type(key)
        await loop.run_in_executor(
            None,
            lambda: self.s3.put_object(
                Bucket=self.bucket, Key=key, Body=data,
                ContentType=content_type,
            )
        )
        logger.info(f"R2 saved: {key} ({len(data):,} bytes)")
        return self.public_url(key)

    async def save_file(self, key: str, src_path: str) -> str:
        with open(src_path, "rb") as f:
            data = f.read()
        return await self.save(key, data)

    async def load(self, key: str) -> Optional[bytes]:
        try:
            loop   = asyncio.get_event_loop()
            obj    = await loop.run_in_executor(
                None, lambda: self.s3.get_object(Bucket=self.bucket, Key=key)
            )
            return obj["Body"].read()
        except Exception:
            return None

    async def delete(self, key: str) -> bool:
        try:
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                None, lambda: self.s3.delete_object(Bucket=self.bucket, Key=key)
            )
            return True
        except Exception:
            return False

    async def exists(self, key: str) -> bool:
        try:
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                None, lambda: self.s3.head_object(Bucket=self.bucket, Key=key)
            )
            return True
        except Exception:
            return False

    def public_url(self, key: str) -> str:
        return f"{settings.R2_ENDPOINT_URL}/{self.bucket}/{key}"

    def local_path(self, key: str) -> str:
        raise RuntimeError("local_path not available for R2 storage — use load() instead")

    @staticmethod
    def _guess_content_type(key: str) -> str:
        ext = key.lower().rsplit(".", 1)[-1]
        return {
            "jpg": "image/jpeg", "jpeg": "image/jpeg",
            "png": "image/png",  "gif": "image/gif",
            "pdf": "application/pdf",
            "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "zip": "application/zip",
            "csv": "text/csv",
        }.get(ext, "application/octet-stream")


def _make_storage():
    if settings.STORAGE_BACKEND == "r2":
        logger.info("Storage: Cloudflare R2")
        return R2Storage()
    logger.info(f"Storage: local ({settings.STORAGE_PATH})")
    return LocalStorage(settings.STORAGE_PATH)


# Singleton — import and use throughout the app
storage = _make_storage()
