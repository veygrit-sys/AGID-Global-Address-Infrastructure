from __future__ import annotations

import argparse
import importlib.util
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DOCS_DIR = ROOT / "docs"
OUT_DIR = ROOT / "output" / "pdf" / "docs"
BUILDER_PATH = ROOT / "scripts" / "build_address_morphism_bilingual_pdfs.py"


def load_builder():
    spec = importlib.util.spec_from_file_location("agid_markdown_pdf_builder", BUILDER_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Could not load PDF builder from {BUILDER_PATH}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def slugify(path: Path) -> str:
    stem = path.stem.lower()
    stem = re.sub(r"[^a-z0-9._-]+", "-", stem)
    stem = re.sub(r"-{2,}", "-", stem).strip("-")
    return stem or "document"


def looks_japanese(path: Path) -> bool:
    if "-ja" in path.stem.lower() or "japanese" in path.stem.lower():
        return True
    text = path.read_text(encoding="utf-8", errors="ignore")[:3000]
    return bool(re.search(r"[\u3040-\u30ff\u3400-\u9fff]", text))


def iter_sources(patterns: list[str]) -> list[Path]:
    if patterns:
        sources: list[Path] = []
        for pattern in patterns:
            matches = sorted(DOCS_DIR.glob(pattern))
            if not matches:
                candidate = Path(pattern)
                if candidate.exists():
                    matches = [candidate]
            sources.extend(path.resolve() for path in matches if path.suffix.lower() == ".md")
        return sorted(set(sources))
    return sorted(path.resolve() for path in DOCS_DIR.glob("*.md"))


def main() -> None:
    parser = argparse.ArgumentParser(description="Build PDFs for Markdown documents under docs/.")
    parser.add_argument("patterns", nargs="*", help="Optional docs/ glob patterns or Markdown file paths.")
    parser.add_argument("--force", action="store_true", help="Rebuild PDFs even when the output exists.")
    args = parser.parse_args()

    builder = load_builder()
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    created: list[Path] = []
    skipped: list[Path] = []
    failed: list[tuple[Path, Exception]] = []

    for source in iter_sources(args.patterns):
        output = OUT_DIR / f"{slugify(source)}.pdf"
        if output.exists() and not args.force:
            skipped.append(output)
            continue

        try:
            is_ja = looks_japanese(source)
            page_count, toc = builder.render_pdf(
                source,
                output,
                "目次" if is_ja else "Table of Contents",
                "日本語版" if is_ja else "English edition",
            )
            created.append(output)
            print(f"created {output} ({page_count} pages, {len(toc)} outline entries)")
        except Exception as exc:  # noqa: BLE001 - collect all failures for batch reporting.
            failed.append((source, exc))
            print(f"failed {source}: {exc}")

    if skipped:
        print(f"skipped {len(skipped)} existing PDF(s)")
    if failed:
        print("\nFailures:")
        for source, exc in failed:
            print(f"- {source}: {exc}")
        raise SystemExit(1)
    print(f"built {len(created)} PDF(s) into {OUT_DIR}")


if __name__ == "__main__":
    main()
