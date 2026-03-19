"""
Digital Planner Builder
-----------------------
Generates multi-page digital planner .docx files using python-docx.

Layouts:
  - weekly   : 52 weekly spreads (Mon–Sun grid)
  - monthly  : 12 monthly calendar pages
  - daily    : 365 daily pages with time blocks
  - habit    : habit tracker grids
  - budget   : budget/expense tracker
  - notes    : lined/dotted note pages
"""
from docx import Document
from docx.shared import Inches, Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
import os
from typing import Literal
from loguru import logger


PageLayout = Literal["weekly", "monthly", "daily", "habit", "budget", "notes"]

MONTHS = ["January","February","March","April","May","June",
          "July","August","September","October","November","December"]
DAYS   = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]
DAYS_S = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]


def hex_to_rgb(h: str) -> RGBColor:
    h = h.lstrip('#')
    return RGBColor(int(h[0:2],16), int(h[2:4],16), int(h[4:6],16))


def set_cell_bg(cell, hex_color: str):
    """Set table cell background color."""
    tc   = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd  = OxmlElement('w:shd')
    shd.set(qn('w:val'),   'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'),  hex_color.lstrip('#'))
    tcPr.append(shd)


def set_cell_border(cell, top=None, bottom=None, left=None, right=None):
    """Set individual cell borders."""
    tc   = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcBorders = OxmlElement('w:tcBorders')
    for side, val in [('top',top),('bottom',bottom),('left',left),('right',right)]:
        if val:
            el = OxmlElement(f'w:{side}')
            el.set(qn('w:val'),   val.get('val','single'))
            el.set(qn('w:sz'),    str(val.get('sz', 4)))
            el.set(qn('w:color'), val.get('color','auto'))
            tcBorders.append(el)
    tcPr.append(tcBorders)


def no_space_para(doc: Document) -> None:
    """Add a zero-height paragraph (page separator)."""
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after  = Pt(0)


class PlannerBuilder:
    """Build digital planner .docx files."""

    def __init__(self, accent: str = "5C94A3", header: str = "141622"):
        self.accent = accent.lstrip('#')
        self.header = header.lstrip('#')
        self.accent_rgb = hex_to_rgb(accent)
        self.header_rgb = hex_to_rgb(header)

    # ── Public API ────────────────────────────────────────────────────────────

    def build(
        self,
        output_path: str,
        layout: PageLayout = "weekly",
        year: int = 2025,
        pages: int = 52,
        page_format: str = "A4",
    ) -> str:
        doc = self._new_doc(page_format)

        if layout == "weekly":
            self._add_cover(doc, f"{year} Weekly Planner")
            self._add_yearly_overview(doc, year)
            for week in range(1, pages + 1):
                self._add_weekly_spread(doc, year, week)

        elif layout == "monthly":
            self._add_cover(doc, f"{year} Monthly Planner")
            for month in range(1, 13):
                self._add_monthly_page(doc, year, month)

        elif layout == "daily":
            self._add_cover(doc, f"{year} Daily Planner")
            count = min(pages, 366)
            for day in range(1, count + 1):
                self._add_daily_page(doc, day)

        elif layout == "habit":
            self._add_cover(doc, "Habit Tracker")
            for month in range(1, 13):
                self._add_habit_tracker(doc, MONTHS[month-1], year)

        elif layout == "budget":
            self._add_cover(doc, f"{year} Budget Planner")
            for month in range(1, 13):
                self._add_budget_page(doc, MONTHS[month-1], year)

        elif layout == "notes":
            self._add_cover(doc, "Notes")
            for _ in range(pages):
                self._add_notes_page(doc)

        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        doc.save(output_path)
        logger.info(f"Planner saved: {output_path} ({layout}, {pages} pages)")
        return output_path

    # ── Document setup ────────────────────────────────────────────────────────

    def _new_doc(self, page_format: str) -> Document:
        doc = Document()
        sec = doc.sections[0]
        if page_format == "A4":
            sec.page_width  = Cm(21)
            sec.page_height = Cm(29.7)
        else:  # USLetter
            sec.page_width  = Inches(8.5)
            sec.page_height = Inches(11)
        sec.top_margin    = Cm(1.5)
        sec.bottom_margin = Cm(1.5)
        sec.left_margin   = Cm(1.8)
        sec.right_margin  = Cm(1.8)
        # Default style
        style = doc.styles['Normal']
        style.font.name = 'Calibri'
        style.font.size = Pt(10)
        return doc

    def _page_break(self, doc: Document):
        doc.add_page_break()

    # ── Cover page ────────────────────────────────────────────────────────────

    def _add_cover(self, doc: Document, title: str):
        # Header accent block (table trick for background color)
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = tbl.cell(0, 0)
        set_cell_bg(cell, self.header)
        cell.width = Inches(8)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(40)
        p.paragraph_format.space_after  = Pt(40)
        run = p.add_run(title.upper())
        run.font.size  = Pt(32)
        run.font.bold  = True
        run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

        no_space_para(doc)

        # Accent underline
        tbl2 = doc.add_table(rows=1, cols=1)
        cell2 = tbl2.cell(0, 0)
        set_cell_bg(cell2, self.accent)
        p2 = cell2.paragraphs[0]
        p2.paragraph_format.space_before = Pt(4)
        p2.paragraph_format.space_after  = Pt(4)

        self._page_break(doc)

    # ── Yearly overview ───────────────────────────────────────────────────────

    def _add_yearly_overview(self, doc: Document, year: int):
        h = doc.add_heading(str(year), level=1)
        h.runs[0].font.color.rgb = self.accent_rgb
        h.paragraph_format.space_after = Pt(12)

        # 4×3 month grid
        tbl = doc.add_table(rows=3, cols=4)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        border = {'val': 'single', 'sz': 2, 'color': self.accent}
        for row_idx in range(3):
            for col_idx in range(4):
                month_num = row_idx * 4 + col_idx + 1
                cell = tbl.cell(row_idx, col_idx)
                set_cell_border(cell, top=border, bottom=border, left=border, right=border)
                p = cell.paragraphs[0]
                p.paragraph_format.space_before = Pt(4)
                # Month name
                run = p.add_run(MONTHS[month_num - 1].upper() + '\n')
                run.font.size  = Pt(9)
                run.font.bold  = True
                run.font.color.rgb = self.accent_rgb
                # Day headers
                run2 = p.add_run('  '.join(d[0] for d in DAYS_S) + '\n')
                run2.font.size = Pt(7)

        self._page_break(doc)

    # ── Weekly spread ─────────────────────────────────────────────────────────

    def _add_weekly_spread(self, doc: Document, year: int, week: int):
        # Week header
        p = doc.add_paragraph()
        run = p.add_run(f"WEEK {week:02d}  ·  {year}")
        run.font.size  = Pt(18)
        run.font.bold  = True
        run.font.color.rgb = self.accent_rgb
        p.paragraph_format.space_after = Pt(6)

        # 7-day grid: 2 cols × rows
        tbl = doc.add_table(rows=4, cols=2)
        tbl.alignment = WD_TABLE_ALIGNMENT.LEFT
        border = {'val': 'single', 'sz': 4, 'color': self.accent}

        day_idx = 0
        for row in range(4):
            for col in range(2):
                if day_idx >= 7: break
                cell = tbl.cell(row, col)
                set_cell_border(cell, top=border, bottom=border, left=border, right=border)
                p = cell.paragraphs[0]
                p.paragraph_format.space_before = Pt(4)
                # Day label
                run = p.add_run(DAYS[day_idx].upper() + '\n')
                run.font.size  = Pt(9)
                run.font.bold  = True
                run.font.color.rgb = self.accent_rgb
                # Lines for writing
                for _ in range(6):
                    line_run = p.add_run('_' * 38 + '\n')
                    line_run.font.size  = Pt(8)
                    line_run.font.color.rgb = RGBColor(0xCC, 0xCC, 0xCC)
                day_idx += 1

        # Notes section below
        notes_p = doc.add_paragraph()
        notes_p.paragraph_format.space_before = Pt(8)
        nr = notes_p.add_run("NOTES  ")
        nr.font.size = Pt(9)
        nr.font.bold = True
        nr.font.color.rgb = self.accent_rgb
        for _ in range(3):
            line_run = notes_p.add_run('_' * 80 + '\n')
            line_run.font.size = Pt(8)
            line_run.font.color.rgb = RGBColor(0xCC, 0xCC, 0xCC)

        self._page_break(doc)

    # ── Monthly calendar ──────────────────────────────────────────────────────

    def _add_monthly_page(self, doc: Document, year: int, month: int):
        import calendar
        # Header
        p = doc.add_paragraph()
        run = p.add_run(f"{MONTHS[month-1].upper()}  {year}")
        run.font.size  = Pt(22)
        run.font.bold  = True
        run.font.color.rgb = self.accent_rgb
        p.paragraph_format.space_after = Pt(8)

        # Calendar grid: 7 cols (days) × 6 rows (weeks)
        tbl = doc.add_table(rows=7, cols=7)
        border = {'val': 'single', 'sz': 2, 'color': 'DDDDDD'}

        # Day headers
        for i, day in enumerate(DAYS_S):
            cell = tbl.cell(0, i)
            set_cell_bg(cell, self.accent)
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            run = p.add_run(day)
            run.font.size  = Pt(8)
            run.font.bold  = True
            run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

        # Fill days
        cal    = calendar.monthcalendar(year, month)
        for row_idx, week in enumerate(cal[:6]):
            for col_idx, day_num in enumerate(week):
                cell = tbl.cell(row_idx + 1, col_idx)
                set_cell_border(cell, top=border, bottom=border, left=border, right=border)
                p = cell.paragraphs[0]
                p.paragraph_format.space_before = Pt(2)
                if day_num:
                    run = p.add_run(str(day_num) + '\n\n\n')
                    run.font.size  = Pt(9)
                    run.font.bold  = True
                    run.font.color.rgb = self.accent_rgb if col_idx >= 5 else RGBColor(0x33,0x33,0x33)

        # Monthly goals
        goals_p = doc.add_paragraph()
        goals_p.paragraph_format.space_before = Pt(12)
        gr = goals_p.add_run("GOALS THIS MONTH\n")
        gr.font.size = Pt(9)
        gr.font.bold = True
        gr.font.color.rgb = self.accent_rgb
        for _ in range(4):
            line = goals_p.add_run('□  ' + '_' * 50 + '\n')
            line.font.size = Pt(9)

        self._page_break(doc)

    # ── Daily page ────────────────────────────────────────────────────────────

    def _add_daily_page(self, doc: Document, day_num: int):
        p = doc.add_paragraph()
        run = p.add_run(f"DAY {day_num:03d}")
        run.font.size  = Pt(20)
        run.font.bold  = True
        run.font.color.rgb = self.accent_rgb
        p.paragraph_format.space_after = Pt(6)

        # Time blocks 6am–10pm
        tbl = doc.add_table(rows=17, cols=2)
        border = {'val': 'single', 'sz': 2, 'color': 'EEEEEE'}
        for i, hour in enumerate(range(6, 23)):
            time_str = f"{hour:02d}:00"
            # Time cell
            tc = tbl.cell(i, 0)
            set_cell_border(tc, bottom=border)
            tp = tc.paragraphs[0]
            tr = tp.add_run(time_str)
            tr.font.size  = Pt(8)
            tr.font.color.rgb = self.accent_rgb
            tc.width = Inches(0.7)
            # Content cell
            cc = tbl.cell(i, 1)
            set_cell_border(cc, bottom=border)
            cp = cc.paragraphs[0]
            cr = cp.add_run(' ')
            cr.font.size = Pt(10)

        # Bottom sections
        for section, lines in [("TODAY'S PRIORITIES", 4), ("NOTES", 4), ("GRATITUDE", 2)]:
            sp = doc.add_paragraph()
            sp.paragraph_format.space_before = Pt(10)
            sr = sp.add_run(section + '\n')
            sr.font.size = Pt(8)
            sr.font.bold = True
            sr.font.color.rgb = self.accent_rgb
            for j in range(lines):
                prefix = f"{j+1}. " if section == "TODAY'S PRIORITIES" else "□  " if j == 0 else "   "
                lr = sp.add_run(prefix + '_' * 55 + '\n')
                lr.font.size = Pt(9)
                lr.font.color.rgb = RGBColor(0xCC, 0xCC, 0xCC)

        self._page_break(doc)

    # ── Habit tracker ─────────────────────────────────────────────────────────

    def _add_habit_tracker(self, doc: Document, month_name: str, year: int):
        import calendar
        days_in_month = calendar.monthrange(year, MONTHS.index(month_name) + 1)[1]

        p = doc.add_paragraph()
        run = p.add_run(f"HABIT TRACKER  ·  {month_name.upper()} {year}")
        run.font.size  = Pt(18)
        run.font.bold  = True
        run.font.color.rgb = self.accent_rgb
        p.paragraph_format.space_after = Pt(8)

        # 10 habits × days_in_month grid
        cols = days_in_month + 1  # +1 for habit name column
        tbl  = doc.add_table(rows=11, cols=cols)
        border = {'val': 'single', 'sz': 2, 'color': 'DDDDDD'}

        # Header row: day numbers
        h_cell = tbl.cell(0, 0)
        set_cell_bg(h_cell, self.header)
        hp = h_cell.paragraphs[0]
        hr = hp.add_run("HABIT")
        hr.font.size = Pt(7)
        hr.font.bold = True
        hr.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

        for d in range(1, days_in_month + 1):
            cell = tbl.cell(0, d)
            set_cell_bg(cell, self.accent if d % 7 in (0, 6) else self.header)
            p2 = cell.paragraphs[0]
            p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
            r2 = p2.add_run(str(d))
            r2.font.size  = Pt(6)
            r2.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

        # Habit rows
        for row in range(1, 11):
            name_cell = tbl.cell(row, 0)
            set_cell_border(name_cell, top=border, bottom=border, left=border, right=border)
            np_ = name_cell.paragraphs[0]
            nr_ = np_.add_run(f"Habit {row}")
            nr_.font.size  = Pt(8)
            nr_.font.color.rgb = RGBColor(0x55, 0x55, 0x55)

            for d in range(1, days_in_month + 1):
                cell = tbl.cell(row, d)
                set_cell_border(cell, top=border, bottom=border, left=border, right=border)
                cp_ = cell.paragraphs[0]
                cp_.alignment = WD_ALIGN_PARAGRAPH.CENTER
                cr_ = cp_.add_run("○")
                cr_.font.size  = Pt(8)
                cr_.font.color.rgb = RGBColor(0xCC, 0xCC, 0xCC)

        self._page_break(doc)

    # ── Budget page ───────────────────────────────────────────────────────────

    def _add_budget_page(self, doc: Document, month_name: str, year: int):
        p = doc.add_paragraph()
        run = p.add_run(f"BUDGET  ·  {month_name.upper()} {year}")
        run.font.size  = Pt(18)
        run.font.bold  = True
        run.font.color.rgb = self.accent_rgb
        p.paragraph_format.space_after = Pt(8)

        for section, rows_ in [("INCOME", 5), ("FIXED EXPENSES", 8), ("VARIABLE EXPENSES", 8)]:
            sp = doc.add_paragraph()
            sr = sp.add_run(section)
            sr.font.size  = Pt(10)
            sr.font.bold  = True
            sr.font.color.rgb = self.accent_rgb
            sp.paragraph_format.space_after = Pt(4)

            tbl = doc.add_table(rows=rows_ + 1, cols=3)
            border = {'val': 'single', 'sz': 2, 'color': 'DDDDDD'}
            # Header
            for i, hdr in enumerate(["Description", "Budget", "Actual"]):
                cell = tbl.cell(0, i)
                set_cell_bg(cell, self.accent)
                hh = cell.paragraphs[0]
                hr2 = hh.add_run(hdr)
                hr2.font.size  = Pt(8)
                hr2.font.bold  = True
                hr2.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
            # Data rows
            for row in range(1, rows_ + 1):
                for col in range(3):
                    cell = tbl.cell(row, col)
                    set_cell_border(cell, bottom=border, right=border)
                    cell.paragraphs[0].add_run(' ')

            doc.add_paragraph().paragraph_format.space_after = Pt(8)

        self._page_break(doc)

    # ── Notes page ────────────────────────────────────────────────────────────

    def _add_notes_page(self, doc: Document):
        p = doc.add_paragraph()
        run = p.add_run("NOTES")
        run.font.size  = Pt(18)
        run.font.bold  = True
        run.font.color.rgb = self.accent_rgb
        p.paragraph_format.space_after = Pt(12)

        # Ruled lines
        for _ in range(24):
            lp = doc.add_paragraph()
            lr = lp.add_run('_' * 90)
            lr.font.size  = Pt(10)
            lr.font.color.rgb = RGBColor(0xDD, 0xDD, 0xDD)
            lp.paragraph_format.space_before = Pt(4)
            lp.paragraph_format.space_after  = Pt(4)

        self._page_break(doc)
