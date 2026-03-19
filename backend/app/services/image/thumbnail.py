"""
Thumbnail Generator
-------------------
Creates Etsy-spec 2000×2000 px listing thumbnails using Pillow.
Styles: "single" | "grid" | "mockup"
"""
from PIL import Image, ImageDraw, ImageFont
import os
from typing import Literal
from loguru import logger


ETSY_SIZE   = (2000, 2000)
BG_DARK     = (14, 16, 22)
BG_LIGHT    = (248, 247, 244)
ACCENT      = (200, 169, 110)     # warm gold


class ThumbnailGenerator:

    async def create_etsy_thumbnail(
        self,
        preview_pngs: list[str],
        title: str,
        style: Literal["single", "grid", "mockup"] = "mockup",
        output_path: str = "thumbnail.jpg",
        dark: bool = True,
    ) -> str:
        """Generate Etsy 2000×2000 thumbnail. Returns output_path."""

        bg_color = BG_DARK if dark else BG_LIGHT

        if style == "single" and preview_pngs:
            img = self._single_style(preview_pngs[0], bg_color)
        elif style == "grid" and preview_pngs:
            img = self._grid_style(preview_pngs[:4], bg_color)
        elif style == "mockup" and preview_pngs:
            img = self._mockup_style(preview_pngs[0], title, bg_color, dark)
        else:
            img = self._placeholder(title, bg_color)

        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        img.save(output_path, "JPEG", quality=92, optimize=True)
        logger.info(f"Thumbnail saved: {output_path}")
        return output_path

    def _single_style(self, png_path: str, bg_color: tuple) -> Image.Image:
        """One large CV centered on background."""
        canvas = Image.new("RGB", ETSY_SIZE, bg_color)
        try:
            cv = Image.open(png_path).convert("RGB")
            # Scale to 80% of canvas height
            target_h = int(ETSY_SIZE[1] * 0.82)
            ratio     = target_h / cv.height
            cv_r      = cv.resize((int(cv.width * ratio), target_h), Image.LANCZOS)
            x = (ETSY_SIZE[0] - cv_r.width) // 2
            y = (ETSY_SIZE[1] - cv_r.height) // 2
            canvas.paste(cv_r, (x, y))
        except Exception as e:
            logger.error(f"Single style error: {e}")
        return canvas

    def _grid_style(self, png_paths: list[str], bg_color: tuple) -> Image.Image:
        """2×2 grid of CV previews."""
        canvas = Image.new("RGB", ETSY_SIZE, bg_color)
        GAP    = 24
        cols, rows = 2, 2
        cell_w = (ETSY_SIZE[0] - GAP * 3) // cols
        cell_h = (ETSY_SIZE[1] - GAP * 3) // rows

        for i, path in enumerate(png_paths[:4]):
            try:
                cv = Image.open(path).convert("RGB")
                cv_r = cv.resize((cell_w, cell_h), Image.LANCZOS)
                x = GAP + (i % cols) * (cell_w + GAP)
                y = GAP + (i // cols) * (cell_h + GAP)
                canvas.paste(cv_r, (x, y))
            except Exception as e:
                logger.warning(f"Grid cell {i} error: {e}")
        return canvas

    def _mockup_style(self, png_path: str, title: str, bg_color: tuple, dark: bool) -> Image.Image:
        """
        Professional mockup: CV slightly angled on left,
        title text on right — like top Etsy sellers use.
        """
        canvas = Image.new("RGB", ETSY_SIZE, bg_color)
        draw   = ImageDraw.Draw(canvas)

        # ── Accent bar at top ──────────────────────────────────
        draw.rectangle([0, 0, ETSY_SIZE[0], 12], fill=ACCENT)

        # ── CV preview (left side, slightly offset) ───────────
        try:
            cv = Image.open(png_path).convert("RGB")
            target_h = int(ETSY_SIZE[1] * 0.78)
            ratio    = target_h / cv.height
            cv_r     = cv.resize((int(cv.width * ratio), target_h), Image.LANCZOS)

            # Paste with slight vertical centering
            x = 80
            y = (ETSY_SIZE[1] - cv_r.height) // 2
            canvas.paste(cv_r, (x, y))

            # Subtle shadow lines beside CV
            shadow_x = x + cv_r.width
            draw.rectangle([shadow_x, y + 8, shadow_x + 6, y + cv_r.height - 8],
                          fill=(30, 30, 35) if dark else (220, 218, 214))
        except Exception as e:
            logger.error(f"Mockup CV error: {e}")

        # ── Text block (right side) ───────────────────────────
        text_x = ETSY_SIZE[0] * 0.6
        text_color_primary   = (240, 240, 238) if dark else (30, 30, 28)
        text_color_secondary = (138, 141, 150) if dark else (100, 100, 98)

        # Try to load a font; fall back to default
        try:
            font_lg = ImageFont.truetype("/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf", 80)
            font_sm = ImageFont.truetype("/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf", 42)
            font_xs = ImageFont.truetype("/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf", 34)
        except Exception:
            font_lg = font_sm = font_xs = ImageFont.load_default()

        # Product type label
        draw.text((int(text_x), 700), "RESUME TEMPLATE",
                 fill=ACCENT, font=font_xs)

        # Main title (wrap at 14 chars)
        words  = title.split()
        lines  = []
        line   = ""
        for w in words[:6]:   # max 2 lines
            if len(line + w) > 14 and line:
                lines.append(line.strip())
                line = w + " "
            else:
                line += w + " "
        if line: lines.append(line.strip())

        for i, l in enumerate(lines[:2]):
            draw.text((int(text_x), 820 + i * 96), l,
                     fill=text_color_primary, font=font_lg)

        # Subtitle
        draw.text((int(text_x), 1040),
                 "Fully editable · ATS friendly",
                 fill=text_color_secondary, font=font_sm)
        draw.text((int(text_x), 1100),
                 "A4 + US Letter · Word .docx",
                 fill=text_color_secondary, font=font_sm)
        draw.text((int(text_x), 1160),
                 "Instant download",
                 fill=text_color_secondary, font=font_sm)

        # ── Bottom accent bar ──────────────────────────────────
        draw.rectangle([0, ETSY_SIZE[1] - 12, ETSY_SIZE[0], ETSY_SIZE[1]], fill=ACCENT)

        return canvas

    def _placeholder(self, title: str, bg_color: tuple) -> Image.Image:
        canvas = Image.new("RGB", ETSY_SIZE, bg_color)
        draw   = ImageDraw.Draw(canvas)
        draw.text((ETSY_SIZE[0]//2, ETSY_SIZE[1]//2), title,
                 fill=(200, 200, 200), anchor="mm")
        return canvas
