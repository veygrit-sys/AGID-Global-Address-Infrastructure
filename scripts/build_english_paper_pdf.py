from __future__ import annotations

import argparse
import re
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Flowable,
    Frame,
    KeepTogether,
    ListFlowable,
    ListItem,
    LongTable,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE = ROOT / "docs" / "address-morphism-theory-full-paper-en-v3.md"
DEFAULT_OUTPUT = ROOT / "output" / "pdf" / "address-morphism-theory-full-paper-en-v3.pdf"
FONT_DIR = Path("C:/Windows/Fonts")


def register_font(name: str, filename: str, fallback: str) -> str:
    path = FONT_DIR / filename
    if not path.exists():
        return fallback
    pdfmetrics.registerFont(TTFont(name, str(path)))
    return name


BODY_FONT = register_font("AGIDBody", "arial.ttf", "Helvetica")
BOLD_FONT = register_font("AGIDBodyBold", "arialbd.ttf", "Helvetica-Bold")
ITALIC_FONT = register_font("AGIDBodyItalic", "ariali.ttf", "Helvetica-Oblique")
MONO_FONT = register_font("AGIDMono", "CascadiaMono.ttf", "Courier")


def strip_inline_math(text: str) -> str:
    text = re.sub(r"\\\((.*?)\\\)", lambda m: m.group(1), text)
    text = re.sub(r"\$(.*?)\$", lambda m: m.group(1), text)
    return text


def normal_inline(text: str) -> str:
    text = escape(strip_inline_math(text))
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)", r"<i>\1</i>", text)
    return text


def inline_markdown(text: str) -> str:
    parts = text.split("`")
    rendered: list[str] = []
    for idx, part in enumerate(parts):
        if idx % 2:
            rendered.append(f'<font name="{MONO_FONT}">{escape(part)}</font>')
        else:
            rendered.append(normal_inline(part))
    return "".join(rendered)


def split_md_row(line: str) -> list[str]:
    line = line.strip()
    if line.startswith("|"):
        line = line[1:]
    if line.endswith("|"):
        line = line[:-1]
    return [cell.strip() for cell in line.split("|")]


def is_table_separator(line: str) -> bool:
    cells = split_md_row(line)
    return bool(cells) and all(re.fullmatch(r":?-{3,}:?", cell or "") for cell in cells)


def is_table_start(lines: list[str], idx: int) -> bool:
    return idx + 1 < len(lines) and "|" in lines[idx] and is_table_separator(lines[idx + 1])


def parse_metadata(lines: list[str]) -> tuple[str, str, dict[str, str], list[str]]:
    idx = 0
    while idx < len(lines) and not lines[idx].strip():
        idx += 1

    title = "Address Morphism Theory"
    subtitle = ""
    if idx < len(lines) and lines[idx].startswith("# "):
        title = lines[idx][2:].strip()
        idx += 1

    while idx < len(lines) and not lines[idx].strip():
        idx += 1

    if idx < len(lines) and lines[idx].startswith("## "):
        candidate = lines[idx][3:].strip()
        if not re.match(r"^(\d+\.|Abstract|Keywords|Appendix|Manuscript Status)", candidate, flags=re.I):
            subtitle = candidate
            idx += 1

    while idx < len(lines) and not lines[idx].strip():
        idx += 1

    meta: dict[str, str] = {}
    while idx < len(lines):
        line = lines[idx].strip()
        if not line:
            idx += 1
            break
        if ":" not in line:
            break
        key, value = line.split(":", 1)
        meta[key.strip().lower()] = value.strip()
        idx += 1

    return title, subtitle, meta, lines[idx:]


def clean_heading(text: str) -> str:
    text = text.strip()
    text = re.sub(r"^Appendix\s+([A-Z])\.\s+", r"Appendix \1. ", text)
    return text


def make_styles():
    sheet = getSampleStyleSheet()
    sheet.add(ParagraphStyle(
        "PaperTitle",
        parent=sheet["Title"],
        fontName=BOLD_FONT,
        fontSize=26,
        leading=31,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#0f172a"),
        spaceAfter=14,
    ))
    sheet.add(ParagraphStyle(
        "PaperSubtitle",
        parent=sheet["Normal"],
        fontName=ITALIC_FONT,
        fontSize=13,
        leading=18,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#334155"),
        spaceAfter=20,
    ))
    sheet.add(ParagraphStyle(
        "Meta",
        parent=sheet["Normal"],
        fontName=BODY_FONT,
        fontSize=9,
        leading=13,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#475569"),
    ))
    sheet.add(ParagraphStyle(
        "Body",
        parent=sheet["Normal"],
        fontName=BODY_FONT,
        fontSize=9.4,
        leading=13.2,
        alignment=TA_JUSTIFY,
        textColor=colors.HexColor("#111827"),
        spaceAfter=6,
    ))
    sheet.add(ParagraphStyle(
        "BlockQuote",
        parent=sheet["Body"],
        leftIndent=12,
        rightIndent=8,
        borderColor=colors.HexColor("#94a3b8"),
        borderWidth=1,
        borderPadding=6,
        backColor=colors.HexColor("#f8fafc"),
    ))
    sheet.add(ParagraphStyle(
        "PaperCode",
        parent=sheet["Body"],
        fontName=MONO_FONT,
        fontSize=7.8,
        leading=10.2,
        alignment=TA_LEFT,
        leftIndent=4,
        rightIndent=4,
        borderColor=colors.HexColor("#cbd5e1"),
        borderWidth=0.5,
        borderPadding=5,
        backColor=colors.HexColor("#f8fafc"),
        wordWrap="CJK",
    ))
    sheet.add(ParagraphStyle(
        "Heading1Paper",
        parent=sheet["Heading1"],
        fontName=BOLD_FONT,
        fontSize=16,
        leading=20,
        spaceBefore=8,
        spaceAfter=8,
        keepWithNext=True,
        textColor=colors.HexColor("#0f172a"),
    ))
    sheet.add(ParagraphStyle(
        "Heading2Paper",
        parent=sheet["Heading2"],
        fontName=BOLD_FONT,
        fontSize=12.3,
        leading=16,
        spaceBefore=8,
        spaceAfter=5,
        keepWithNext=True,
        textColor=colors.HexColor("#172033"),
    ))
    sheet.add(ParagraphStyle(
        "Heading3Paper",
        parent=sheet["Heading3"],
        fontName=BOLD_FONT,
        fontSize=10.5,
        leading=14,
        spaceBefore=6,
        spaceAfter=4,
        keepWithNext=True,
        textColor=colors.HexColor("#1f2937"),
    ))
    sheet.add(ParagraphStyle(
        "TocTitle",
        parent=sheet["Heading1Paper"],
        fontSize=17,
        alignment=TA_CENTER,
        spaceAfter=14,
    ))
    sheet.add(ParagraphStyle(
        "TOCLevel0",
        fontName=BODY_FONT,
        fontSize=9.2,
        leading=12,
        leftIndent=0,
        firstLineIndent=0,
    ))
    sheet.add(ParagraphStyle(
        "TOCLevel1",
        fontName=BODY_FONT,
        fontSize=8.8,
        leading=11,
        leftIndent=12,
        firstLineIndent=0,
    ))
    sheet.add(ParagraphStyle(
        "TOCLevel2",
        fontName=BODY_FONT,
        fontSize=8.4,
        leading=10.5,
        leftIndent=24,
        firstLineIndent=0,
    ))
    sheet.add(ParagraphStyle(
        "TableCell",
        parent=sheet["Body"],
        fontSize=7.2,
        leading=9.0,
        alignment=TA_LEFT,
        spaceAfter=0,
    ))
    sheet.add(ParagraphStyle(
        "TableHead",
        parent=sheet["TableCell"],
        fontName=BOLD_FONT,
        textColor=colors.HexColor("#0f172a"),
    ))
    return sheet


class HeadingParagraph(Paragraph):
    def __init__(self, text: str, style: ParagraphStyle, level: int, plain: str):
        super().__init__(text, style)
        self.toc_level = level
        self.plain_text = plain


class PaperDocTemplate(BaseDocTemplate):
    def __init__(self, filename: str, title: str):
        self.paper_title = title
        self.heading_counter = 0
        width, height = A4
        margin_left = 22 * mm
        margin_right = 22 * mm
        margin_top = 20 * mm
        margin_bottom = 22 * mm
        frame = Frame(
            margin_left,
            margin_bottom,
            width - margin_left - margin_right,
            height - margin_top - margin_bottom,
            id="body",
        )
        super().__init__(
            filename,
            pagesize=A4,
            leftMargin=margin_left,
            rightMargin=margin_right,
            topMargin=margin_top,
            bottomMargin=margin_bottom,
        )
        self.addPageTemplates([PageTemplate(id="paper", frames=[frame], onPage=self.draw_page)])

    def draw_page(self, canvas, doc):
        canvas.saveState()
        width, _height = A4
        canvas.setStrokeColor(colors.HexColor("#cbd5e1"))
        canvas.setLineWidth(0.4)
        canvas.line(self.leftMargin, A4[1] - 15 * mm, width - self.rightMargin, A4[1] - 15 * mm)
        canvas.setFont(BODY_FONT, 7.2)
        canvas.setFillColor(colors.HexColor("#64748b"))
        title = self.paper_title[:72]
        canvas.drawString(self.leftMargin, A4[1] - 12 * mm, title)
        canvas.drawRightString(width - self.rightMargin, 12 * mm, str(canvas.getPageNumber()))
        canvas.restoreState()

    def afterFlowable(self, flowable: Flowable):
        if not isinstance(flowable, HeadingParagraph):
            return
        text = flowable.plain_text
        level = flowable.toc_level
        key = f"heading-{self.heading_counter}"
        self.heading_counter += 1
        self.canv.bookmarkPage(key)
        self.canv.addOutlineEntry(text, key, level=level, closed=False)
        self.notify("TOCEntry", (level, text, self.page, key))


def paragraph(text: str, styles, name: str = "Body") -> Paragraph:
    return Paragraph(inline_markdown(text), styles[name])


def code_block(text: str, styles) -> Paragraph:
    escaped = escape(text).replace("\n", "<br/>")
    return Paragraph(f'<font name="{MONO_FONT}">{escaped}</font>', styles["PaperCode"])


def table_flowable(rows: list[str], styles, available_width: float) -> LongTable:
    header = split_md_row(rows[0])
    body = [split_md_row(row) for row in rows[2:]]
    ncols = max(1, len(header))
    widths = [available_width / ncols] * ncols
    data = [[Paragraph(inline_markdown(cell), styles["TableHead"]) for cell in header]]
    for row in body:
        padded = row + [""] * (ncols - len(row))
        data.append([Paragraph(inline_markdown(cell), styles["TableCell"]) for cell in padded[:ncols]])
    table = LongTable(data, colWidths=widths, repeatRows=1, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#eef2f7")),
        ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#cbd5e1")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 3),
        ("RIGHTPADDING", (0, 0), (-1, -1), 3),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    return table


def is_major_chapter(text: str) -> bool:
    return bool(re.match(r"^(\d+\.|Appendix\s+[A-Z]\.)", text))


def build_body(lines: list[str], styles, available_width: float) -> list[Flowable]:
    story: list[Flowable] = []
    i = 0
    first_major_seen = False
    while i < len(lines):
        stripped = lines[i].strip()
        if not stripped:
            i += 1
            continue

        if stripped.startswith("```"):
            code: list[str] = []
            i += 1
            while i < len(lines) and not lines[i].strip().startswith("```"):
                code.append(lines[i].rstrip("\n"))
                i += 1
            if i < len(lines):
                i += 1
            story.append(code_block("\n".join(code), styles))
            story.append(Spacer(1, 4))
            continue

        if stripped == r"\[":
            formula: list[str] = []
            i += 1
            while i < len(lines) and lines[i].strip() != r"\]":
                formula.append(lines[i].rstrip("\n"))
                i += 1
            if i < len(lines):
                i += 1
            story.append(code_block("\n".join(formula), styles))
            story.append(Spacer(1, 4))
            continue

        if is_table_start(lines, i):
            table_rows = [lines[i].rstrip("\n"), lines[i + 1].rstrip("\n")]
            i += 2
            while i < len(lines) and "|" in lines[i] and lines[i].strip():
                table_rows.append(lines[i].rstrip("\n"))
                i += 1
            story.append(table_flowable(table_rows, styles, available_width))
            story.append(Spacer(1, 7))
            continue

        heading = re.match(r"^(#{2,4})\s+(.+)$", stripped)
        if heading:
            level_raw = len(heading.group(1))
            text = clean_heading(heading.group(2))
            if level_raw == 2 and is_major_chapter(text):
                if first_major_seen:
                    story.append(PageBreak())
                first_major_seen = True
            style_name = "Heading1Paper" if level_raw == 2 else "Heading2Paper" if level_raw == 3 else "Heading3Paper"
            toc_level = 0 if level_raw == 2 else 1 if level_raw == 3 else 2
            story.append(HeadingParagraph(inline_markdown(text), styles[style_name], toc_level, text))
            i += 1
            continue

        if stripped.startswith(">"):
            quote_lines: list[str] = []
            while i < len(lines) and lines[i].strip().startswith(">"):
                quote_lines.append(lines[i].strip().lstrip(">").strip())
                i += 1
            story.append(paragraph(" ".join(quote_lines), styles, "BlockQuote"))
            continue

        bullet = re.match(r"^[-*]\s+(.+)$", stripped)
        numbered = re.match(r"^\d+\.\s+(.+)$", stripped)
        if bullet or numbered:
            items: list[ListItem] = []
            pattern = r"^[-*]\s+(.+)$" if bullet else r"^\d+\.\s+(.+)$"
            while i < len(lines):
                match = re.match(pattern, lines[i].strip())
                if not match:
                    break
                items.append(ListItem(paragraph(match.group(1), styles), leftIndent=10))
                i += 1
            story.append(ListFlowable(items, bulletType="bullet" if bullet else "1", leftIndent=16))
            story.append(Spacer(1, 3))
            continue

        para_lines: list[str] = []
        while i < len(lines):
            current = lines[i]
            current_stripped = current.strip()
            if not current_stripped:
                break
            if current_stripped.startswith(("```", r"\[")):
                break
            if re.match(r"^(#{2,4})\s+.+$", current_stripped):
                break
            if re.match(r"^[-*]\s+.+$", current_stripped) or re.match(r"^\d+\.\s+.+$", current_stripped):
                break
            if is_table_start(lines, i):
                break
            para_lines.append(current_stripped)
            i += 1
        story.append(paragraph(" ".join(para_lines), styles))
    return story


def collect_toc_entries(lines: list[str]) -> list[tuple[int, str]]:
    entries: list[tuple[int, str]] = []
    for line in lines:
        match = re.match(r"^(#{2,4})\s+(.+)$", line.strip())
        if not match:
            continue
        level_raw = len(match.group(1))
        text = clean_heading(match.group(2))
        toc_level = 0 if level_raw == 2 else 1 if level_raw == 3 else 2
        entries.append((toc_level, text))
    return entries


def build_pdf(source: Path, output: Path) -> tuple[int, int]:
    lines = source.read_text(encoding="utf-8").splitlines()
    title, subtitle, meta, body = parse_metadata(lines)
    output.parent.mkdir(parents=True, exist_ok=True)
    styles = make_styles()
    doc = PaperDocTemplate(str(output), title)
    available_width = A4[0] - doc.leftMargin - doc.rightMargin

    story: list[Flowable] = [
        Spacer(1, 82),
        Paragraph(inline_markdown(title), styles["PaperTitle"]),
    ]
    if subtitle:
        story.append(Paragraph(inline_markdown(subtitle), styles["PaperSubtitle"]))
    meta_rows = [[Paragraph(f"<b>{escape(k.title())}</b>", styles["Meta"]), Paragraph(inline_markdown(v), styles["Meta"])] for k, v in meta.items()]
    if meta_rows:
        meta_table = Table(meta_rows, colWidths=[34 * mm, 92 * mm], hAlign="CENTER")
        meta_table.setStyle(TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#d1d5db")),
            ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f8fafc")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 5),
            ("RIGHTPADDING", (0, 0), (-1, -1), 5),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(meta_table)
    story.extend([
        Spacer(1, 36),
        Paragraph("English full manuscript PDF", styles["Meta"]),
        PageBreak(),
        Paragraph("Table of Contents", styles["TocTitle"]),
    ])

    for level, text in collect_toc_entries(body):
        story.append(Paragraph(inline_markdown(text), styles[f"TOCLevel{level}"]))
    story.append(PageBreak())
    body_flowables = build_body(body, styles, available_width)
    heading_count = len([flow for flow in body_flowables if isinstance(flow, HeadingParagraph)])
    story.extend(body_flowables)

    doc.build(story)
    return doc.page, heading_count


def main() -> None:
    parser = argparse.ArgumentParser(description="Build the English Address Morphism Theory paper PDF.")
    parser.add_argument("--source", default=str(DEFAULT_SOURCE), help="Markdown source path.")
    parser.add_argument("--output", default=str(DEFAULT_OUTPUT), help="Output PDF path.")
    args = parser.parse_args()

    page_count, heading_count = build_pdf(Path(args.source).resolve(), Path(args.output).resolve())
    print(f"created {Path(args.output).resolve()} ({page_count} pages, {heading_count} headings)")


if __name__ == "__main__":
    main()
