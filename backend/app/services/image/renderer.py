"""
Image Renderer
--------------
DOCX → PDF (LibreOffice) → PNG (pdftoppm / Pillow)
"""
import asyncio, os, subprocess, shutil, tempfile
from pathlib import Path
from loguru import logger
from app.core.config import settings


class DocxRenderer:
    """Render a .docx file to PNG using LibreOffice."""

    async def to_png(self, docx_path: str, dpi: int = 150, page: int = 1) -> str | None:
        """Convert docx → PNG. Returns path to PNG or None on failure."""
        pdf_path = await self._to_pdf(docx_path)
        if not pdf_path:
            return None
        return await self._pdf_to_png(pdf_path, dpi=dpi, page=page)

    async def to_pngs_all_pages(self, docx_path: str, dpi: int = 120) -> list[str]:
        """Convert all pages to PNG list (for multi-page planners)."""
        pdf_path = await self._to_pdf(docx_path)
        if not pdf_path:
            return []
        return await self._pdf_to_pngs(pdf_path, dpi=dpi)

    async def _to_pdf(self, docx_path: str) -> str | None:
        """Use LibreOffice to convert docx → PDF in a temp dir."""
        with tempfile.TemporaryDirectory() as tmp:
            try:
                loop = asyncio.get_event_loop()
                result = await loop.run_in_executor(None, self._run_libreoffice, docx_path, tmp)
                if result.returncode != 0:
                    logger.error(f"LibreOffice failed: {result.stderr}")
                    return None

                # LibreOffice saves PDF next to source
                pdf_name = Path(docx_path).stem + ".pdf"
                pdf_in_tmp = os.path.join(tmp, pdf_name)

                if not os.path.exists(pdf_in_tmp):
                    # Some versions save in same dir as source
                    pdf_in_src = os.path.join(os.path.dirname(docx_path), pdf_name)
                    if os.path.exists(pdf_in_src):
                        return pdf_in_src
                    logger.error(f"PDF not found after conversion: {pdf_name}")
                    return None

                # Move to stable location
                stable_pdf = docx_path.replace(".docx", ".pdf")
                shutil.copy2(pdf_in_tmp, stable_pdf)
                return stable_pdf

            except Exception as e:
                logger.error(f"PDF conversion error: {e}")
                return None

    def _run_libreoffice(self, docx_path: str, output_dir: str):
        return subprocess.run(
            [
                settings.LIBREOFFICE_PATH,
                "--headless",
                "--convert-to", "pdf",
                "--outdir", output_dir,
                docx_path,
            ],
            capture_output=True,
            text=True,
            timeout=60,
        )

    async def _pdf_to_png(self, pdf_path: str, dpi: int, page: int = 1) -> str | None:
        """Convert a single PDF page to PNG using pdftoppm."""
        out_prefix = pdf_path.replace(".pdf", "_page")
        loop = asyncio.get_event_loop()

        try:
            result = await loop.run_in_executor(
                None,
                lambda: subprocess.run(
                    ["pdftoppm", "-jpeg", f"-r{dpi}", "-l", str(page),
                     "-f", str(page), pdf_path, out_prefix],
                    capture_output=True, timeout=30,
                )
            )
            if result.returncode != 0:
                logger.error(f"pdftoppm failed: {result.stderr}")
                return None

            # pdftoppm outputs: prefix-000001.jpg
            expected = f"{out_prefix}-{page:06d}.jpg"
            alt      = f"{out_prefix}-{page}.jpg"
            simple   = f"{out_prefix}-1.jpg"

            for candidate in [expected, alt, simple]:
                if os.path.exists(candidate):
                    return candidate

            return None
        except Exception as e:
            logger.error(f"PNG render error: {e}")
            return None

    async def _pdf_to_pngs(self, pdf_path: str, dpi: int) -> list[str]:
        """Convert all PDF pages to PNG list."""
        out_prefix = pdf_path.replace(".pdf", "_p")
        loop = asyncio.get_event_loop()

        await loop.run_in_executor(
            None,
            lambda: subprocess.run(
                ["pdftoppm", "-jpeg", f"-r{dpi}", pdf_path, out_prefix],
                capture_output=True, timeout=120,
            )
        )

        # Collect all output pages sorted
        parent = os.path.dirname(pdf_path)
        prefix = os.path.basename(out_prefix)
        pages = sorted(
            [os.path.join(parent, f) for f in os.listdir(parent)
             if f.startswith(prefix) and f.endswith(".jpg")]
        )
        return pages
