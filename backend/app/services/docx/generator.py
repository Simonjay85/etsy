"""
DOCX Service
------------
Two strategies:
1. color_swap  — fastest; works on any .docx by replacing hex colors in XML
2. generate    — full python-docx rebuild from data; for digital planners
"""
import zipfile, re, os, asyncio
from pathlib import Path
from typing import Optional
from loguru import logger


# ── Color themes ──────────────────────────────────────────────────────────────
THEMES: dict[str, dict] = {
    "teal_original":  {"accent": "5C94A3", "header": "141622"},
    "midnight_navy":  {"accent": "3A6186", "header": "0D1B2A"},
    "forest_green":   {"accent": "2E7D52", "header": "0D2318"},
    "burgundy":       {"accent": "8B2635", "header": "1A0608"},
    "deep_purple":    {"accent": "5B3A8C", "header": "160E24"},
    "charcoal":       {"accent": "546E7A", "header": "1C2427"},
    "terracotta":     {"accent": "A0522D", "header": "240E06"},
    "slate_blue":     {"accent": "4A6FA5", "header": "0F1E35"},
    "rose_gold":      {"accent": "B5656A", "header": "2A1010"},
    "ocean":          {"accent": "1E7A8C", "header": "061820"},
    "olive_green":    {"accent": "5C6B2A", "header": "1A1E08"},
    "warm_brown":     {"accent": "7B5C3A", "header": "1C1008"},
}

PAGE_SIZES = {
    "A4":       {"width": "11906", "height": "16838"},
    "USLetter": {"width": "12240", "height": "15840"},
}


class DocxColorSwapper:
    """
    Fast variant generation: replace hex colors in docx XML.
    Preserves 100% of original layout, fonts, images.
    Works on any .docx regardless of how it was created.
    """

    def swap(
        self,
        src_path: str,
        dst_path: str,
        theme_id: str,
        page_format: str = "A4",
        orig_accent: Optional[str] = None,
        orig_header: Optional[str] = None,
    ) -> str:
        theme = THEMES.get(theme_id)
        if not theme:
            raise ValueError(f"Unknown theme: {theme_id}")

        # Auto-detect original colors if not provided
        if not orig_accent or not orig_header:
            orig_accent, orig_header = self._detect_colors(src_path)

        new_accent = theme["accent"]
        new_header = theme["header"]
        page       = PAGE_SIZES[page_format]

        with zipfile.ZipFile(src_path, "r") as zin:
            names    = zin.namelist()
            contents = {n: zin.read(n) for n in names}

        for name in names:
            if not (name.endswith(".xml") or name.endswith(".rels")):
                continue
            try:
                text = contents[name].decode("utf-8")
                text = text.replace(orig_accent.upper(), new_accent.upper())
                text = text.replace(orig_accent.lower(), new_accent.lower())
                text = text.replace(orig_header.upper(), new_header.upper())
                text = text.replace(orig_header.lower(), new_header.lower())

                # Resize page if different format
                if "document.xml" in name and page_format == "USLetter":
                    text = text.replace(
                        'w:w="11906" w:h="16838"',
                        f'w:w="{page["width"]}" w:h="{page["height"]}"'
                    )
                contents[name] = text.encode("utf-8")
            except Exception as e:
                logger.warning(f"Skipping {name}: {e}")

        os.makedirs(os.path.dirname(dst_path), exist_ok=True)
        with zipfile.ZipFile(dst_path, "w", zipfile.ZIP_DEFLATED) as zout:
            for name in names:
                zout.writestr(zipfile.ZipInfo(name), contents[name])

        return dst_path

    def _detect_colors(self, docx_path: str) -> tuple[str, str]:
        """Auto-detect accent + header color from a docx file."""
        from collections import Counter
        try:
            with zipfile.ZipFile(docx_path) as z:
                xml = z.read("word/document.xml").decode("utf-8", errors="ignore")
            colors = re.findall(r'srgbClr val="([A-Fa-f0-9]{6})"', xml)
            cnt = Counter(
                c.upper() for c in colors
                if c.upper() not in ("000000", "FFFFFF", "EEEEEE", "F2F2F2")
            )
            top = [c for c, _ in cnt.most_common(4)]

            def brightness(h: str) -> float:
                r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
                return r * 0.299 + g * 0.587 + b * 0.114

            if len(top) >= 2:
                s = sorted(top, key=brightness)
                return s[-1], s[0]   # brightest = accent, darkest = header
            elif len(top) == 1:
                return top[0], "141622"
        except Exception as e:
            logger.warning(f"Color detection failed for {docx_path}: {e}")
        return "5C94A3", "141622"   # fallback


class DocxBatchProcessor:
    """Orchestrates batch generation across themes × fonts × page formats."""

    def __init__(self, swapper: Optional[DocxColorSwapper] = None):
        self.swapper = swapper or DocxColorSwapper()

    async def run_batch(
        self,
        src_path: str,
        output_dir: str,
        theme_ids: list[str],
        page_formats: list[str],
        orig_accent: Optional[str] = None,
        orig_header: Optional[str] = None,
    ) -> list[str]:
        """
        Generate all variants asynchronously.
        Returns list of output file paths.
        """
        tasks = []
        for theme_id in theme_ids:
            for page in page_formats:
                theme_name = THEMES[theme_id]["accent"]
                fname      = f"CV_{theme_id}_{page}.docx"
                dst        = os.path.join(output_dir, fname)
                tasks.append((theme_id, page, dst))

        generated = []
        loop = asyncio.get_event_loop()

        for theme_id, page, dst in tasks:
            try:
                path = await loop.run_in_executor(
                    None,
                    lambda t=theme_id, p=page, d=dst: self.swapper.swap(
                        src_path, d, t, p, orig_accent, orig_header
                    ),
                )
                generated.append(path)
                logger.info(f"Generated: {os.path.basename(path)}")
            except Exception as e:
                logger.error(f"Failed {theme_id}/{page}: {e}")

        return generated
