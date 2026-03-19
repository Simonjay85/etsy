"""Unit tests — DOCX color swap logic."""
import pytest, zipfile, os, re, tempfile, shutil
from app.services.docx.generator import DocxColorSwapper, THEMES


SAMPLE_DOCX = os.path.join(os.path.dirname(__file__), "..", "fixtures", "sample.docx")


def _make_minimal_docx(path: str, accent: str = "5C94A3", header: str = "141622"):
    """Create a minimal .docx with known accent + header colors for testing."""
    import zipfile
    doc_xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>Test template</w:t></w:r></w:p>
    <w:p><w:r>
      <a:solidFill><a:srgbClr val="{accent}"/></a:solidFill>
    </w:r></w:p>
    <w:p><w:r>
      <a:solidFill><a:srgbClr val="{header}"/></a:solidFill>
    </w:r></w:p>
  </w:body>
</w:document>"""
    ct_xml = """<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Override PartName="/word/document.xml"
            ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>"""
    rels_xml = """<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument"
                Target="word/document.xml"/>
</Relationships>"""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with zipfile.ZipFile(path, "w") as z:
        z.writestr("[Content_Types].xml", ct_xml)
        z.writestr("_rels/.rels", rels_xml)
        z.writestr("word/document.xml", doc_xml)


# ── Tests ──────────────────────────────────────────────────────────────────────

class TestDocxColorSwapper:

    def setup_method(self):
        self.tmp   = tempfile.mkdtemp()
        self.src   = os.path.join(self.tmp, "src.docx")
        self.dst   = os.path.join(self.tmp, "dst.docx")
        _make_minimal_docx(self.src, accent="5C94A3", header="141622")
        self.swapper = DocxColorSwapper()

    def teardown_method(self):
        shutil.rmtree(self.tmp, ignore_errors=True)

    def test_swap_creates_file(self):
        self.swapper.swap(self.src, self.dst, "midnight_navy")
        assert os.path.exists(self.dst)

    def test_swap_replaces_accent_color(self):
        self.swapper.swap(self.src, self.dst, "midnight_navy",
                         orig_accent="5C94A3", orig_header="141622")
        with zipfile.ZipFile(self.dst) as z:
            xml = z.read("word/document.xml").decode()
        new_accent = THEMES["midnight_navy"]["accent"].upper()
        assert new_accent in xml
        assert "5C94A3" not in xml

    def test_swap_replaces_header_color(self):
        self.swapper.swap(self.src, self.dst, "midnight_navy",
                         orig_accent="5C94A3", orig_header="141622")
        with zipfile.ZipFile(self.dst) as z:
            xml = z.read("word/document.xml").decode()
        new_header = THEMES["midnight_navy"]["header"].upper()
        assert new_header in xml
        assert "141622" not in xml

    def test_all_themes_produce_files(self):
        for theme_id in THEMES:
            dst = os.path.join(self.tmp, f"{theme_id}.docx")
            self.swapper.swap(self.src, dst, theme_id,
                             orig_accent="5C94A3", orig_header="141622")
            assert os.path.exists(dst), f"Missing output for theme {theme_id}"

    def test_detect_colors_returns_known_colors(self):
        acc, hdr = self.swapper._detect_colors(self.src)
        assert acc.upper() == "5C94A3"

    def test_us_letter_page_size(self):
        import re
        # Create src with A4 page size in XML
        doc_xml = """<?xml version="1.0" encoding="UTF-8"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:sectPr><w:pgSz w:w="11906" w:h="16838"/></w:sectPr>
  </w:body>
</w:document>"""
        with zipfile.ZipFile(self.src, "a") as z:
            z.writestr("word/document.xml", doc_xml)
        self.swapper.swap(self.src, self.dst, "charcoal", page_format="USLetter",
                         orig_accent="5C94A3", orig_header="141622")
        with zipfile.ZipFile(self.dst) as z:
            xml = z.read("word/document.xml").decode()
        assert '12240' in xml   # US Letter width


class TestDocxColorSwapperEdgeCases:

    def test_unknown_theme_raises(self):
        with pytest.raises(ValueError, match="Unknown theme"):
            DocxColorSwapper().swap("x.docx", "y.docx", "nonexistent_theme")

    def test_detect_colors_fallback(self):
        """Fallback colors when file is empty/invalid."""
        swapper = DocxColorSwapper()
        # Pass non-existent path — should return defaults
        acc, hdr = swapper._detect_colors("/nonexistent/path.docx")
        assert acc == "5C94A3"
        assert hdr == "141622"
