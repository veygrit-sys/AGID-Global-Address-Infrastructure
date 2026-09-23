from __future__ import annotations

import html
import re
from dataclasses import dataclass
from pathlib import Path

import fitz


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "output" / "pdf"
SOURCES = [
    {
        "lang": "en",
        "source": ROOT / "docs" / "address-morphism-theory-paper-professional-draft.md",
        "output": OUT_DIR / "address-morphism-theory-en.pdf",
        "toc_label": "Table of Contents",
        "language_label": "English edition",
    },
    {
        "lang": "ja",
        "source": ROOT / "docs" / "address-morphism-theory-paper-professional-draft-ja.md",
        "output": OUT_DIR / "address-morphism-theory-ja.pdf",
        "toc_label": "目次",
        "language_label": "日本語版",
    },
]

PAGE_W = 595.276
PAGE_H = 841.89
MARGIN_L = 54
MARGIN_R = 54
MARGIN_T = 58
MARGIN_B = 62
BODY_W = PAGE_W - MARGIN_L - MARGIN_R

FONT_DIR = Path("C:/Windows/Fonts")
FONT_ARCHIVE = fitz.Archive(str(FONT_DIR)) if FONT_DIR.exists() else None

CSS = """
@font-face { font-family: JPan; src: url(hpsimplifiedjpan-regular.ttf); }
@font-face { font-family: JPanLight; src: url(hpsimplifiedjpan-light.ttf); }
body, p, li, td, th, div, span {
  font-family: JPan, sans-serif;
  color: #111827;
  font-size: 9.7pt;
  line-height: 1.42;
}
h1 {
  font-family: JPan, sans-serif;
  font-size: 24pt;
  line-height: 1.15;
  margin: 0;
  color: #0f172a;
}
h2 {
  font-family: JPan, sans-serif;
  font-size: 14.2pt;
  line-height: 1.25;
  margin: 0;
  color: #0f172a;
}
h3 {
  font-family: JPan, sans-serif;
  font-size: 11.4pt;
  line-height: 1.25;
  margin: 0;
  color: #172033;
}
p { margin: 0; }
.subtitle {
  font-family: JPanLight, JPan, sans-serif;
  font-size: 13pt;
  line-height: 1.35;
  color: #334155;
}
.meta {
  font-size: 9.2pt;
  line-height: 1.45;
  color: #475569;
}
.toc-line {
  font-size: 9.8pt;
  line-height: 1.45;
  color: #1f2937;
}
blockquote {
  margin: 0;
  padding: 7pt 10pt;
  border-left: 3pt solid #94a3b8;
  background: #f8fafc;
}
ul, ol { margin: 0; padding-left: 18pt; }
li { margin: 0 0 2.5pt 0; }
table {
  width: 100%;
  border-collapse: collapse;
}
th {
  font-family: JPan, sans-serif;
  font-size: 8.4pt;
  background: #eef2f7;
  border: 0.6pt solid #cbd5e1;
  padding: 4pt;
  vertical-align: top;
}
td {
  font-size: 8.0pt;
  border: 0.5pt solid #d6dee8;
  padding: 4pt;
  vertical-align: top;
}
pre {
  font-family: monospace;
  font-size: 8.0pt;
  line-height: 1.25;
  white-space: pre-wrap;
  background: #f8fafc;
  border: 0.6pt solid #d1d5db;
  padding: 7pt;
  margin: 0;
}
code {
  font-family: monospace;
  font-size: 0.92em;
  color: #1f2937;
}
.footer {
  font-size: 7.2pt;
  color: #64748b;
}
"""


@dataclass
class Block:
    kind: str
    html: str
    plain: str = ""
    level: int = 0


def escape(text: str) -> str:
    return html.escape(text, quote=False)


def strip_inline_math(text: str) -> str:
    text = re.sub(r"\\\((.*?)\\\)", lambda m: m.group(1), text)
    text = re.sub(r"\$(.*?)\$", lambda m: m.group(1), text)
    return text


def inline_markdown(text: str) -> str:
    text = strip_inline_math(text)
    parts = text.split("`")
    rendered: list[str] = []
    for idx, part in enumerate(parts):
        if idx % 2:
            rendered.append(f"<code>{escape(part)}</code>")
        else:
            normal = escape(part)
            normal = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", normal)
            rendered.append(normal)
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


def table_html(rows: list[str]) -> str:
    header = split_md_row(rows[0])
    body = [split_md_row(row) for row in rows[2:]]
    out = ["<table><thead><tr>"]
    out.extend(f"<th>{inline_markdown(cell)}</th>" for cell in header)
    out.append("</tr></thead><tbody>")
    ncols = len(header)
    for row in body:
        padded = row + [""] * (ncols - len(row))
        out.append("<tr>")
        out.extend(f"<td>{inline_markdown(cell)}</td>" for cell in padded[:ncols])
        out.append("</tr>")
    out.append("</tbody></table>")
    return "".join(out)


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

    if idx < len(lines) and lines[idx].startswith("## ") and not re.match(
        r"^##\s+(\d+\.|Abstract|要旨|Keywords|キーワード|Appendix)",
        lines[idx],
        flags=re.IGNORECASE,
    ):
        subtitle = lines[idx][3:].strip()
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


def heading_plain(text: str) -> str:
    text = text.strip()
    text = re.sub(r"^Appendix\s+[A-Z]\.\s+", "Appendix: ", text)
    return text


def build_blocks(lines: list[str]) -> list[Block]:
    blocks: list[Block] = []
    i = 0
    while i < len(lines):
        line = lines[i].rstrip("\n")
        stripped = line.strip()

        if not stripped:
            i += 1
            continue

        if stripped.startswith("```"):
            code: list[str] = []
            i += 1
            while i < len(lines) and not lines[i].strip().startswith("```"):
                code.append(lines[i].rstrip("\n"))
                i += 1
            i += 1
            blocks.append(Block("pre", f"<pre>{escape(chr(10).join(code))}</pre>", "\n".join(code)))
            continue

        if stripped == r"\[":
            formula: list[str] = []
            i += 1
            while i < len(lines) and lines[i].strip() != r"\]":
                formula.append(lines[i].rstrip("\n"))
                i += 1
            if i < len(lines):
                i += 1
            text = "\n".join(formula)
            blocks.append(Block("math", f"<pre>{escape(text)}</pre>", text))
            continue

        if is_table_start(lines, i):
            rows = [lines[i].rstrip("\n"), lines[i + 1].rstrip("\n")]
            i += 2
            while i < len(lines) and "|" in lines[i] and lines[i].strip():
                rows.append(lines[i].rstrip("\n"))
                i += 1
            blocks.append(Block("table", table_html(rows)))
            continue

        heading = re.match(r"^(#{2,4})\s+(.+)$", stripped)
        if heading:
            level = len(heading.group(1))
            tag = "h2" if level == 2 else "h3"
            text = heading_plain(heading.group(2))
            blocks.append(Block(tag, f"<{tag}>{inline_markdown(text)}</{tag}>", text, 1 if level == 2 else 2))
            i += 1
            continue

        if stripped.startswith(">"):
            quote_lines: list[str] = []
            while i < len(lines) and lines[i].strip().startswith(">"):
                quote_lines.append(lines[i].strip().lstrip(">").strip())
                i += 1
            text = " ".join(quote_lines)
            blocks.append(Block("blockquote", f"<blockquote>{inline_markdown(text)}</blockquote>", text))
            continue

        bullet = re.match(r"^[-*]\s+(.+)$", stripped)
        numbered = re.match(r"^\d+\.\s+(.+)$", stripped)
        if bullet or numbered:
            tag = "ul" if bullet else "ol"
            items: list[str] = []
            pattern = r"^[-*]\s+(.+)$" if bullet else r"^\d+\.\s+(.+)$"
            while i < len(lines):
                m = re.match(pattern, lines[i].strip())
                if not m:
                    break
                items.append(m.group(1))
                i += 1
            body = "".join(f"<li>{inline_markdown(item)}</li>" for item in items)
            blocks.append(Block(tag, f"<{tag}>{body}</{tag}>", " ".join(items)))
            continue

        paragraph: list[str] = []
        while i < len(lines):
            current = lines[i].rstrip("\n")
            current_stripped = current.strip()
            if not current_stripped:
                break
            if (
                current_stripped.startswith("```")
                or current_stripped == r"\["
                or re.match(r"^(#{2,4})\s+", current_stripped)
                or current_stripped.startswith(">")
                or re.match(r"^[-*]\s+", current_stripped)
                or re.match(r"^\d+\.\s+", current_stripped)
                or is_table_start(lines, i)
            ):
                break
            paragraph.append(current_stripped)
            i += 1
        text = " ".join(paragraph)
        blocks.append(Block("p", f"<p>{inline_markdown(text)}</p>", text))

    return blocks


def add_footer(doc: fitz.Document, title: str, lang: str) -> None:
    for index, page in enumerate(doc, start=1):
        footer = f"<div class='footer'>{escape(title)} · {escape(lang)} · {index}</div>"
        rect = fitz.Rect(MARGIN_L, PAGE_H - 42, PAGE_W - MARGIN_R, PAGE_H - 24)
        page.insert_htmlbox(rect, footer, css=CSS, archive=FONT_ARCHIVE, scale_low=1)


def render_pdf(source: Path, output: Path, toc_label: str, language_label: str) -> tuple[int, list[list[int | str]]]:
    lines = source.read_text(encoding="utf-8").splitlines()
    title, subtitle, meta, body_lines = parse_metadata(lines)
    blocks = build_blocks(body_lines)

    doc = fitz.open()
    page = doc.new_page(width=PAGE_W, height=PAGE_H)
    y = MARGIN_T
    toc: list[list[int | str]] = []

    def insert_block(block: Block, spacing: float | None = None) -> None:
        nonlocal page, y
        if spacing is None:
            spacing = {
                "h2": 11,
                "h3": 7,
                "p": 8,
                "table": 11,
                "pre": 10,
                "math": 10,
                "ul": 8,
                "ol": 8,
                "blockquote": 9,
            }.get(block.kind, 8)

        if block.kind == "h2" and y > MARGIN_T + 475:
            page = doc.new_page(width=PAGE_W, height=PAGE_H)
            y = MARGIN_T
        if block.kind in {"h2", "h3"} and PAGE_H - MARGIN_B - y < 90:
            page = doc.new_page(width=PAGE_W, height=PAGE_H)
            y = MARGIN_T

        rect = fitz.Rect(MARGIN_L, y, PAGE_W - MARGIN_R, PAGE_H - MARGIN_B)
        spare, scale = page.insert_htmlbox(rect, block.html, css=CSS, archive=FONT_ARCHIVE, scale_low=1)
        if spare < 0:
            page = doc.new_page(width=PAGE_W, height=PAGE_H)
            y = MARGIN_T
            rect = fitz.Rect(MARGIN_L, y, PAGE_W - MARGIN_R, PAGE_H - MARGIN_B)
            spare, scale = page.insert_htmlbox(rect, block.html, css=CSS, archive=FONT_ARCHIVE, scale_low=0.86)
        if spare < 0:
            compact = f"<div style='font-size:8pt; line-height:1.25'>{block.html}</div>"
            spare, scale = page.insert_htmlbox(rect, compact, css=CSS, archive=FONT_ARCHIVE, scale_low=0.70)
        if spare < 0:
            fallback = Block("pre", f"<pre>{escape(block.plain or block.html)}</pre>", block.plain)
            spare, scale = page.insert_htmlbox(rect, fallback.html, css=CSS, archive=FONT_ARCHIVE, scale_low=0.60)
        if spare < 0:
            raise RuntimeError(f"Could not fit block near: {block.plain[:120]}")

        used = rect.height - spare
        if block.level:
            toc.append([block.level, block.plain, page.number + 1])
        y += max(used, 1) + spacing

    title_html = (
        f"<h1>{inline_markdown(title)}</h1>"
        + (f"<p class='subtitle'>{inline_markdown(subtitle)}</p>" if subtitle else "")
        + f"<p class='meta'>{inline_markdown(language_label)}</p>"
        + "<p class='meta'>"
        + "<br>".join(
            inline_markdown(item)
            for item in [
                f"Version: {meta.get('version', 'draft')}",
                f"Date: {meta.get('date', '')}",
                f"Author: {meta.get('author', 'to be supplied')}",
            ]
        )
        + "</p>"
    )
    page.insert_htmlbox(
        fitz.Rect(MARGIN_L, 150, PAGE_W - MARGIN_R, 500),
        f"<div>{title_html}</div>",
        css=CSS,
        archive=FONT_ARCHIVE,
        scale_low=1,
    )

    page = doc.new_page(width=PAGE_W, height=PAGE_H)
    y = MARGIN_T
    insert_block(Block("h2", f"<h2>{inline_markdown(toc_label)}</h2>", toc_label), spacing=12)
    for block in blocks:
        if block.kind == "h2":
            indent = "" if block.level == 1 else "&nbsp;&nbsp;"
            insert_block(
                Block(
                    "p",
                    f"<div class='toc-line'>{indent}{inline_markdown(block.plain)}</div>",
                    block.plain,
                ),
                spacing=2,
            )
    page = doc.new_page(width=PAGE_W, height=PAGE_H)
    y = MARGIN_T

    toc = []
    for block in blocks:
        insert_block(block)

    add_footer(doc, title, language_label)
    if toc:
        doc.set_toc(toc)
    output.parent.mkdir(parents=True, exist_ok=True)
    doc.save(output, deflate=True, garbage=4)
    page_count = doc.page_count
    doc.close()
    return page_count, toc


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for spec in SOURCES:
        page_count, toc = render_pdf(
            spec["source"],
            spec["output"],
            spec["toc_label"],
            spec["language_label"],
        )
        print(f"{spec['output']} ({page_count} pages, {len(toc)} outline entries)")


if __name__ == "__main__":
    main()
