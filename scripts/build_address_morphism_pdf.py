from __future__ import annotations

import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "address-morphism-theory-paper-draft.md"
OUT_DIR = ROOT / "output" / "pdf"
OUT_TEX = OUT_DIR / "address-morphism-theory-paper.tex"


SPECIALS = {
    "\\": r"\textbackslash{}",
    "&": r"\&",
    "%": r"\%",
    "$": r"\$",
    "#": r"\#",
    "_": r"\_",
    "{": r"\{",
    "}": r"\}",
    "~": r"\textasciitilde{}",
    "^": r"\textasciicircum{}",
}


def escape_plain(text: str) -> str:
    out: list[str] = []
    i = 0
    while i < len(text):
        if text[i] == "`":
            j = text.find("`", i + 1)
            if j != -1:
                code = text[i + 1 : j]
                out.append(r"\texttt{" + escape_plain(code) + "}")
                i = j + 1
                continue
        out.append(SPECIALS.get(text[i], text[i]))
        i += 1
    return "".join(out)


def split_math_segments(text: str) -> list[tuple[bool, str]]:
    segments: list[tuple[bool, str]] = []
    i = 0
    while i < len(text):
        starts = [(text.find(r"\(", i), r"\)"), (text.find("$", i), "$")]
        starts = [(pos, end) for pos, end in starts if pos != -1]
        if not starts:
            segments.append((False, text[i:]))
            break
        start, end_token = min(starts, key=lambda item: item[0])
        if start > i:
            segments.append((False, text[i:start]))
        if end_token == "$":
            end = text.find("$", start + 1)
            if end == -1:
                segments.append((False, text[start:]))
                break
            segments.append((True, text[start : end + 1]))
            i = end + 1
        else:
            end = text.find(end_token, start + 2)
            if end == -1:
                segments.append((False, text[start:]))
                break
            segments.append((True, text[start : end + 2]))
            i = end + 2
    return segments


def convert_inline(text: str) -> str:
    converted: list[str] = []
    for is_math, segment in split_math_segments(text):
        if is_math:
            converted.append(segment)
        else:
            converted.append(escape_plain(segment))
    return "".join(converted)


def clean_heading(text: str) -> tuple[str, bool]:
    text = text.strip()
    appendix = bool(re.match(r"^Appendix\s+[A-Z]\.\s+", text))
    if appendix:
        text = re.sub(r"^Appendix\s+[A-Z]\.\s+", "", text)
        return text, True
    text = re.sub(r"^\d+(?:\.\d+)*\.\s+", "", text)
    return text, False


def split_md_row(line: str) -> list[str]:
    line = line.strip()
    if line.startswith("|"):
        line = line[1:]
    if line.endswith("|"):
        line = line[:-1]
    return [part.strip() for part in line.split("|")]


def is_table_separator(line: str) -> bool:
    cells = split_md_row(line)
    if not cells:
        return False
    return all(re.fullmatch(r":?-{3,}:?", cell or "") for cell in cells)


def is_table_start(lines: list[str], idx: int) -> bool:
    return idx + 1 < len(lines) and "|" in lines[idx] and is_table_separator(lines[idx + 1])


def table_colspec(ncols: int) -> str:
    if ncols <= 2:
        widths = [0.28, 0.64]
    elif ncols == 3:
        widths = [0.24, 0.34, 0.34]
    elif ncols == 4:
        widths = [0.20, 0.22, 0.22, 0.24]
    elif ncols == 5:
        widths = [0.14, 0.17, 0.17, 0.20, 0.16]
    else:
        widths = [0.86 / ncols for _ in range(ncols)]
    return "@{}" + "".join(
        rf">{{\raggedright\arraybackslash}}p{{{width:.2f}\linewidth}}" for width in widths[:ncols]
    ) + "@{}"


def convert_table(rows: list[str]) -> list[str]:
    header = split_md_row(rows[0])
    body = [split_md_row(row) for row in rows[2:]]
    ncols = len(header)
    font_size = r"\scriptsize" if ncols >= 5 else r"\small"
    tabcolsep = "2pt" if ncols >= 5 else "3pt"
    out = [
        r"\begingroup",
        font_size,
        rf"\setlength{{\tabcolsep}}{{{tabcolsep}}}",
        r"\renewcommand{\arraystretch}{1.18}",
        rf"\begin{{longtable}}{{{table_colspec(ncols)}}}",
        r"\toprule",
        " & ".join(convert_inline(cell) for cell in header) + r" \\",
        r"\midrule",
        r"\endhead",
    ]
    for row in body:
        padded = row + [""] * (ncols - len(row))
        out.append(" & ".join(convert_inline(cell) for cell in padded[:ncols]) + r" \\")
    out.extend([r"\bottomrule", r"\end{longtable}", r"\endgroup"])
    return out


def close_list(out: list[str], list_state: str | None) -> str | None:
    if list_state == "itemize":
        out.append(r"\end{itemize}")
    elif list_state == "enumerate":
        out.append(r"\end{enumerate}")
    return None


def parse_metadata(lines: list[str]) -> tuple[str, str, dict[str, str], list[str]]:
    title_lines: list[str] = []
    meta: dict[str, str] = {}
    idx = 0
    while idx < len(lines) and lines[idx].startswith("# "):
        title_lines.append(lines[idx][2:].strip())
        idx += 1
    while idx < len(lines) and not lines[idx].strip():
        idx += 1
    while idx < len(lines):
        line = lines[idx].strip()
        if not line:
            idx += 1
            break
        if ":" in line:
            key, value = line.split(":", 1)
            meta[key.strip().lower()] = value.strip().rstrip()
            idx += 1
        else:
            break
    title = title_lines[0] if title_lines else "Address Morphism Theory"
    subtitle = title_lines[1] if len(title_lines) > 1 else ""
    return title, subtitle, meta, lines[idx:]


def convert_markdown(lines: list[str]) -> list[str]:
    out: list[str] = []
    in_code = False
    in_math = False
    in_abstract = False
    list_state: str | None = None
    appendix_started = False
    i = 0
    while i < len(lines):
        line = lines[i].rstrip("\n")
        stripped = line.strip()

        if in_code:
            if stripped.startswith("```"):
                out.append(r"\end{lstlisting}")
                in_code = False
            else:
                out.append(line)
            i += 1
            continue

        if stripped.startswith("```"):
            list_state = close_list(out, list_state)
            out.append(r"\begin{lstlisting}")
            in_code = True
            i += 1
            continue

        if stripped == r"\[":
            list_state = close_list(out, list_state)
            in_math = True
            out.append(r"\[")
            i += 1
            continue

        if in_math:
            out.append(line)
            if stripped == r"\]":
                in_math = False
            i += 1
            continue

        if is_table_start(lines, i):
            list_state = close_list(out, list_state)
            table_rows = [lines[i].rstrip("\n"), lines[i + 1].rstrip("\n")]
            i += 2
            while i < len(lines) and "|" in lines[i] and lines[i].strip():
                table_rows.append(lines[i].rstrip("\n"))
                i += 1
            out.extend(convert_table(table_rows))
            out.append("")
            continue

        if not stripped:
            list_state = close_list(out, list_state)
            out.append("")
            i += 1
            continue

        quote = re.match(r"^>\s*(.+)$", stripped)
        if quote:
            list_state = close_list(out, list_state)
            out.append(r"\begin{quote}")
            out.append(convert_inline(quote.group(1)))
            out.append(r"\end{quote}")
            i += 1
            continue

        heading = re.match(r"^(#{2,4})\s+(.+)$", stripped)
        if heading:
            list_state = close_list(out, list_state)
            if in_abstract:
                out.append(r"\end{abstract}")
                in_abstract = False
            level = len(heading.group(1))
            text, is_appendix = clean_heading(heading.group(2))
            if is_appendix and not appendix_started:
                out.append(r"\appendix")
                appendix_started = True
            if text.lower() == "abstract":
                out.append(r"\begin{abstract}")
                in_abstract = True
            elif text.lower() == "keywords":
                out.append(r"\paragraph{Keywords.}")
            elif level == 2:
                out.append(r"\section{" + convert_inline(text) + "}")
            elif level == 3:
                out.append(r"\subsection{" + convert_inline(text) + "}")
            else:
                out.append(r"\subsubsection{" + convert_inline(text) + "}")
            out.append("")
            i += 1
            continue

        bullet = re.match(r"^[-*]\s+(.+)$", stripped)
        numbered = re.match(r"^\d+\.\s+(.+)$", stripped)
        if bullet:
            if list_state != "itemize":
                list_state = close_list(out, list_state)
                out.append(r"\begin{itemize}")
                list_state = "itemize"
            out.append(r"\item " + convert_inline(bullet.group(1)))
            i += 1
            continue
        if numbered:
            if list_state != "enumerate":
                list_state = close_list(out, list_state)
                out.append(r"\begin{enumerate}")
                list_state = "enumerate"
            out.append(r"\item " + convert_inline(numbered.group(1)))
            i += 1
            continue

        list_state = close_list(out, list_state)
        out.append(convert_inline(stripped))
        i += 1

    close_list(out, list_state)
    if in_abstract:
        out.append(r"\end{abstract}")
    return out


def build_tex() -> str:
    raw_lines = SOURCE.read_text(encoding="utf-8").splitlines()
    title, subtitle, meta, body_lines = parse_metadata(raw_lines)
    version = meta.get("version", "draft")
    date = meta.get("date", "")
    author = meta.get("author", "to be supplied")
    body = convert_markdown(body_lines)

    title_tex = convert_inline(title)
    subtitle_tex = convert_inline(subtitle)
    author_tex = convert_inline(author)
    if date:
        date_tex = convert_inline(f"Version: {version}") + r"\\Date: " + convert_inline(date)
    else:
        date_tex = convert_inline(f"Version: {version}")

    preamble = rf"""
\documentclass[11pt]{{article}}
\usepackage[a4paper,margin=22mm]{{geometry}}
\usepackage{{iftex}}
\ifPDFTeX
  \usepackage[T1]{{fontenc}}
  \usepackage{{lmodern}}
  \IfFileExists{{glyphtounicode.tex}}{{\input{{glyphtounicode}}}}{{}}
  \pdfgentounicode=1
\else
  \usepackage{{fontspec}}
  \defaultfontfeatures{{Ligatures={{TeX,NoCommon}},Renderer=HarfBuzz}}
  \setmainfont{{Latin Modern Roman}}
  \setsansfont{{Latin Modern Sans}}
  \setmonofont{{Latin Modern Mono}}[Scale=MatchLowercase]
  \ifLuaTeX
    \ifdefined\pdfvariable
      \pdfvariable gentounicode=1
    \fi
    \usepackage{{luatexja}}
    \usepackage{{luatexja-fontspec}}
    \IfFontExistsTF{{HaranoAjiMincho-Regular}}
      {{\setmainjfont{{HaranoAjiMincho-Regular}}}}
      {{\IfFontExistsTF{{Yu Mincho}}
        {{\setmainjfont{{Yu Mincho}}}}
        {{\IfFontExistsTF{{MS Mincho}}{{\setmainjfont{{MS Mincho}}}}{{}}}}}}
    \IfFontExistsTF{{HaranoAjiGothic-Regular}}
      {{\setsansjfont{{HaranoAjiGothic-Regular}}}}
      {{\IfFontExistsTF{{Yu Gothic}}
        {{\setsansjfont{{Yu Gothic}}}}
        {{\IfFontExistsTF{{MS Gothic}}{{\setsansjfont{{MS Gothic}}}}{{}}}}}}
  \fi
\fi
\usepackage{{amsmath,amssymb,mathtools}}
\usepackage{{booktabs,longtable,array}}
\usepackage{{enumitem}}
\usepackage{{listings}}
\usepackage{{microtype}}
\ifLuaTeX
  \ifdefined\DisableLigatures
    \DisableLigatures{{encoding = *, family = *}}
  \fi
\fi
\usepackage[hidelinks,unicode,pdfencoding=auto,psdextra]{{hyperref}}
\usepackage{{bookmark}}
\usepackage{{xcolor}}

\setlength{{\parindent}}{{0pt}}
\setlength{{\parskip}}{{0.58em}}
\setlist[itemize]{{leftmargin=1.4em,itemsep=0.16em,topsep=0.18em}}
\setlist[enumerate]{{leftmargin=1.6em,itemsep=0.16em,topsep=0.18em}}
\lstset{{
  basicstyle=\ttfamily\small,
  breaklines=true,
  columns=fullflexible,
  frame=single,
  framerule=0.2pt,
  xleftmargin=0.5em,
  xrightmargin=0.5em
}}
\hypersetup{{
  pdftitle={{{title_tex}}},
  pdfauthor={{{author_tex}}},
  pdfsubject={{Address Morphism Theory}},
  pdfkeywords={{address resolution, AGID, AOID, PID, zero-knowledge proof, GIS}}
}}
\sloppy

\title{{\textbf{{{title_tex}}}\\[0.35em]\large {subtitle_tex}}}
\author{{{author_tex}}}
\date{{{date_tex}}}

\begin{{document}}
\maketitle
\tableofcontents
\newpage
"""
    return preamble + "\n".join(body) + "\n\\end{document}\n"


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    OUT_TEX.write_text(build_tex(), encoding="utf-8")
    print(OUT_TEX)


if __name__ == "__main__":
    main()
