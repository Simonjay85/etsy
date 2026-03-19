"""
Storage Service
---------------
Unified file storage that works with:
  - local filesystem (development)
  - Cloudflare R2 (production, S3-compatible, free tier up to 10GB)

Usage:
    storage = get_storage()
    url = await storage.save("output/job_123/file.docx", file_bytes)
    data = await storage.load("output/job_123/file.docx")
    await storage.delete("output/job_123/file.docx")
"""
import os, asyncio
from abc import ABC, abstractmethod
from pathlib import Path
from loguru import logger
from app.core.config import settings


class StorageBackend(ABC):

    @abstractmethod
    async def save(self, key: str, data: bytes) -> str:
        """Save bytes under key. Returns public URL or local path."""

    @abstractmethod
    async def load(self, key: str) -> bytes:
        """Load bytes from key."""

    @abstractmethod
    async def delete(self, key: str) -> bool:
        """Delete file. Returns True on success."""

    @abstractmethod
    async def exists(self, key: str) -> bool:
        """Check if key exists."""

    @abstractmethod
    async def list_prefix(self, prefix: str) -> list[str]:
        """List all keys with given prefix."""

    @abstractmethod
    def public_url(self, key: str) -> str:
        """Return the public-facing URL for a key."""


# ── Local storage ─────────────────────────────────────────────────────────────

class LocalStorage(StorageBackend):
    """Stores files on the local filesystem under STORAGE_PATH."""

    def __init__(self, base_path: str = None):
        self.base = Path(base_path or settings.STORAGE_PATH)
        self.base.mkdir(parents=True, exist_ok=True)

    def _abs(self, key: str) -> Path:
        p = self.base / key
        p.parent.mkdir(parents=True, exist_ok=True)
        return p

    async def save(self, key: str, data: bytes) -> str:
        loop = asyncio.get_event_loop()
        path = self._abs(key)
        await loop.run_in_executor(None, path.write_bytes, data)
        logger.debug(f"[local] saved {key} ({len(data):,} bytes)")
        return str(path)

    async def load(self, key: str) -> bytes:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._abs(key).read_bytes)

    async def delete(self, key: str) -> bool:
        try:
            self._abs(key).unlink(missing_ok=True)
            return True
        except Exception as e:
            logger.warning(f"[local] delete failed: {e}")
            return False

    async def exists(self, key: str) -> bool:
        return self._abs(key).exists()

    async def list_prefix(self, prefix: str) -> list[str]:
        base = self.base / prefix
        if not base.exists():
            return []
        return [
            str(p.relative_to(self.base))
            for p in base.rglob("*")
            if p.is_file()
        ]

    def public_url(self, key: str) -> str:
        return f"/storage/{key}"


# ── Cloudflare R2 storage ─────────────────────────────────────────────────────

class R2Storage(StorageBackend):
    """
    Cloudflare R2 via boto3 (S3-compatible).
    Free tier: 10 GB storage, 1M Class A ops/month.
    """

    def __init__(self):
        import boto3
        self.bucket = settings.R2_BUCKET_NAME
        self.s3 = boto3.client(
            "s3",
            endpoint_url=settings.R2_ENDPOINT_URL,
            aws_access_key_id=settings.R2_ACCESS_KEY_ID,
            aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
            region_name="auto",
        )
        self._base_url = settings.R2_ENDPOINT_URL.rstrip("/") + f"/{self.bucket}"

    async def save(self, key: str, data: bytes) -> str:
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None,
            lambda: self.s3.put_object(
                Bucket=self.bucket,
                Key=key,
                Body=data,
                ContentType=_guess_mime(key),
            )
        )
        logger.debug(f"[r2] saved {key} ({len(data):,} bytes)")
        return self.public_url(key)

    async def load(self, key: str) -> bytes:
        loop = asyncio.get_event_loop()
        obj = await loop.run_in_executor(
            None,
            lambda: self.s3.get_object(Bucket=self.bucket, Key=key)
        )
        return obj["Body"].read()

    async def delete(self, key: str) -> bool:
        loop = asyncio.get_event_loop()
        try:
            await loop.run_in_executor(
                None,
                lambda: self.s3.delete_object(Bucket=self.bucket, Key=key)
            )
            return True
        except Exception as e:
            logger.warning(f"[r2] delete failed: {e}")
            return False

    async def exists(self, key: str) -> bool:
        loop = asyncio.get_event_loop()
        try:
            await loop.run_in_executor(
                None,
                lambda: self.s3.head_object(Bucket=self.bucket, Key=key)
            )
            return True
        except Exception:
            return False

    async def list_prefix(self, prefix: str) -> list[str]:
        loop = asyncio.get_event_loop()
        resp = await loop.run_in_executor(
            None,
            lambda: self.s3.list_objects_v2(Bucket=self.bucket, Prefix=prefix)
        )
        return [obj["Key"] for obj in resp.get("Contents", [])]

    def public_url(self, key: str) -> str:
        return f"{self._base_url}/{key}"

    async def presigned_url(self, key: str, expires: int = 3600) -> str:
        """Generate a time-limited download URL."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None,
            lambda: self.s3.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket, "Key": key},
                ExpiresIn=expires,
            )
        )


# ── Factory ───────────────────────────────────────────────────────────────────

_storage_instance: StorageBackend | None = None


def get_storage() -> StorageBackend:
    global _storage_instance
    if _storage_instance is None:
        if settings.STORAGE_BACKEND == "r2":
            logger.info("Using Cloudflare R2 storage")
            _storage_instance = R2Storage()
        else:
            logger.info(f"Using local storage: {settings.STORAGE_PATH}")
            _storage_instance = LocalStorage()
    return _storage_instance


def _guess_mime(key: str) -> str:
    ext = key.rsplit(".", 1)[-1].lower()
    return {
        "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "zip":  "application/zip",
        "pdf":  "application/pdf",
        "png":  "image/png",
        "jpg":  "image/jpeg",
        "jpeg": "image/jpeg",
        "csv":  "text/csv",
    }.get(ext, "application/octet-stream")
