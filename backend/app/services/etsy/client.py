"""
Etsy API Service
----------------
OAuth 2.0 + Etsy Open API v3
Endpoints: listings, shop, taxonomy
Docs: https://developers.etsy.com/documentation
"""
import httpx, hashlib, secrets, base64, json
from urllib.parse import urlencode
from typing import Optional
from loguru import logger
from app.core.config import settings


ETSY_API_BASE  = "https://openapi.etsy.com/v3"
ETSY_AUTH_URL  = "https://www.etsy.com/oauth/connect"
ETSY_TOKEN_URL = "https://api.etsy.com/v3/public/oauth/token"


class EtsyAuthError(Exception):
    pass


class EtsyClient:
    """Thin async wrapper around Etsy Open API v3."""

    def __init__(self, access_token: Optional[str] = None):
        self._token = access_token
        self._http  = httpx.AsyncClient(
            base_url=ETSY_API_BASE,
            timeout=30.0,
        )

    # ── OAuth helpers ─────────────────────────────────────────────────────────

    def get_auth_url(self, state: str) -> tuple[str, str]:
        """
        Generate OAuth2 PKCE authorization URL.
        Returns (auth_url, code_verifier) — store code_verifier in session.
        """
        code_verifier  = secrets.token_urlsafe(32)
        code_challenge = base64.urlsafe_b64encode(
            hashlib.sha256(code_verifier.encode()).digest()
        ).rstrip(b"=").decode()

        params = {
            "response_type":         "code",
            "redirect_uri":          settings.ETSY_REDIRECT_URI,
            "scope":                 "listings_r listings_w listings_d shops_r transactions_r",
            "client_id":             settings.ETSY_API_KEY,
            "state":                 state,
            "code_challenge":        code_challenge,
            "code_challenge_method": "S256",
        }
        return f"{ETSY_AUTH_URL}?{urlencode(params)}", code_verifier

    async def exchange_code(self, code: str, code_verifier: str) -> dict:
        """Exchange authorization code for access + refresh tokens."""
        async with httpx.AsyncClient() as client:
            resp = await client.post(ETSY_TOKEN_URL, data={
                "grant_type":    "authorization_code",
                "client_id":     settings.ETSY_API_KEY,
                "redirect_uri":  settings.ETSY_REDIRECT_URI,
                "code":          code,
                "code_verifier": code_verifier,
            })
        if resp.status_code != 200:
            raise EtsyAuthError(f"Token exchange failed: {resp.text}")
        return resp.json()

    async def refresh_token(self, refresh_token: str) -> dict:
        """Refresh an expired access token."""
        async with httpx.AsyncClient() as client:
            resp = await client.post(ETSY_TOKEN_URL, data={
                "grant_type":    "refresh_token",
                "client_id":     settings.ETSY_API_KEY,
                "refresh_token": refresh_token,
            })
        if resp.status_code != 200:
            raise EtsyAuthError(f"Token refresh failed: {resp.text}")
        return resp.json()

    # ── Request helpers ───────────────────────────────────────────────────────

    def _headers(self) -> dict:
        if not self._token:
            raise EtsyAuthError("No access token — connect Etsy first")
        return {
            "Authorization": f"Bearer {self._token}",
            "x-api-key":     settings.ETSY_API_KEY,
        }

    async def _get(self, path: str, **params) -> dict:
        resp = await self._http.get(path, headers=self._headers(), params=params)
        resp.raise_for_status()
        return resp.json()

    async def _post(self, path: str, data: dict) -> dict:
        resp = await self._http.post(path, headers=self._headers(), json=data)
        resp.raise_for_status()
        return resp.json()

    async def _patch(self, path: str, data: dict) -> dict:
        resp = await self._http.patch(path, headers=self._headers(), json=data)
        resp.raise_for_status()
        return resp.json()

    async def _delete(self, path: str) -> dict:
        resp = await self._http.delete(path, headers=self._headers())
        resp.raise_for_status()
        return resp.json()

    # ── Shop ──────────────────────────────────────────────────────────────────

    async def get_shop(self, shop_id: str) -> dict:
        return await self._get(f"/shops/{shop_id}")

    async def get_shop_stats(self, shop_id: str) -> dict:
        return await self._get(f"/shops/{shop_id}/stats")

    # ── Listings ──────────────────────────────────────────────────────────────

    async def get_listings(
        self,
        shop_id: str,
        state: str = "active",
        limit: int = 25,
        offset: int = 0,
    ) -> dict:
        return await self._get(
            f"/shops/{shop_id}/listings",
            state=state, limit=limit, offset=offset,
        )

    async def create_listing(self, shop_id: str, payload: dict) -> dict:
        """
        Create a new draft listing.
        payload keys: title, description, price, quantity, tags,
                      taxonomy_id, who_made, when_made, is_digital
        """
        return await self._post(f"/shops/{shop_id}/listings", payload)

    async def update_listing(self, shop_id: str, listing_id: str, payload: dict) -> dict:
        return await self._patch(f"/shops/{shop_id}/listings/{listing_id}", payload)

    async def delete_listing(self, listing_id: str) -> dict:
        return await self._delete(f"/listings/{listing_id}")

    async def upload_listing_image(
        self, shop_id: str, listing_id: str, image_path: str, rank: int = 1
    ) -> dict:
        """Upload a thumbnail image to a listing."""
        with open(image_path, "rb") as f:
            img_data = f.read()
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{ETSY_API_BASE}/shops/{shop_id}/listings/{listing_id}/images",
                headers={"Authorization": f"Bearer {self._token}", "x-api-key": settings.ETSY_API_KEY},
                files={"image": (f"listing_{rank}.jpg", img_data, "image/jpeg")},
                data={"rank": rank, "overwrite": "true"},
                timeout=60,
            )
        resp.raise_for_status()
        return resp.json()

    async def upload_digital_file(
        self, shop_id: str, listing_id: str, file_path: str, rank: int = 1
    ) -> dict:
        """Upload the actual digital product file (.docx / .zip)."""
        fname = file_path.split("/")[-1]
        with open(file_path, "rb") as f:
            file_data = f.read()
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{ETSY_API_BASE}/shops/{shop_id}/listings/{listing_id}/files",
                headers={"Authorization": f"Bearer {self._token}", "x-api-key": settings.ETSY_API_KEY},
                files={"file": (fname, file_data, "application/octet-stream")},
                data={"rank": rank},
                timeout=120,
            )
        resp.raise_for_status()
        return resp.json()

    async def publish_listing(self, shop_id: str, listing_id: str) -> dict:
        """Change listing state from draft → active."""
        return await self._patch(
            f"/shops/{shop_id}/listings/{listing_id}",
            {"state": "active"}
        )

    # ── Taxonomy ──────────────────────────────────────────────────────────────

    async def get_taxonomy_id_for_templates(self) -> int:
        """
        Returns the Etsy taxonomy ID for 'Printable Digital Downloads'.
        Hardcoded for speed — confirmed stable taxonomy IDs.
        """
        # 2078 = Printables & Digital Downloads > Templates
        return 2078

    # ── Convenience: full publish pipeline ───────────────────────────────────

    async def publish_full(
        self,
        shop_id: str,
        title: str,
        description: str,
        tags: list[str],
        price_usd: float,
        docx_path: str,
        thumbnail_path: Optional[str],
        zip_path: Optional[str] = None,
    ) -> dict:
        """
        Full publish pipeline:
        1. Create draft listing
        2. Upload thumbnail image
        3. Upload digital file (.docx or .zip)
        4. Activate listing

        Returns the final listing dict.
        """
        taxonomy_id = await self.get_taxonomy_id_for_templates()

        # 1. Create draft
        listing = await self.create_listing(shop_id, {
            "title":          title[:140],
            "description":    description,
            "price":          {"amount": int(price_usd * 100), "divisor": 100, "currency_code": "USD"},
            "quantity":       999,
            "tags":           tags[:13],
            "taxonomy_id":    taxonomy_id,
            "who_made":       "i_did",
            "when_made":      "2020_2025",
            "is_digital":     True,
            "state":          "draft",
            "type":           "download",
            "should_auto_renew": True,
        })
        listing_id = listing["listing_id"]
        logger.info(f"Created draft listing: {listing_id}")

        # 2. Upload thumbnail
        if thumbnail_path:
            await self.upload_listing_image(shop_id, listing_id, thumbnail_path, rank=1)
            logger.info(f"Uploaded thumbnail: {thumbnail_path}")

        # 3. Upload digital file
        file_to_upload = zip_path or docx_path
        await self.upload_digital_file(shop_id, listing_id, file_to_upload, rank=1)
        logger.info(f"Uploaded digital file: {file_to_upload}")

        # 4. Publish
        result = await self.publish_listing(shop_id, listing_id)
        logger.info(f"Published listing: {listing_id}")
        return result
