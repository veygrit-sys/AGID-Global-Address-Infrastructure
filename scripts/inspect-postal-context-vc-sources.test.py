#!/usr/bin/env python3

from __future__ import annotations

import json
import os
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "inspect-postal-context-vc-sources.py"
SOURCE = ROOT / ".m2-sources-vc"


class VcSourceInspectionTests(unittest.TestCase):
    def run_inspector(self, source_dir: Path) -> subprocess.CompletedProcess[str]:
        env = os.environ.copy()
        env["AGID_VC_SOURCE_DIR"] = str(source_dir)
        return subprocess.run(
            [os.environ.get("AGID_PYTHON", "python"), str(SCRIPT)],
            cwd=ROOT,
            env=env,
            text=True,
            capture_output=True,
            check=False,
        )

    def copied_source(self) -> tuple[tempfile.TemporaryDirectory, Path]:
        temporary = tempfile.TemporaryDirectory()
        destination = Path(temporary.name) / "sources"
        shutil.copytree(SOURCE, destination)
        return temporary, destination

    def test_exact_sources_validate_fail_closed_findings(self) -> None:
        result = self.run_inspector(SOURCE)
        self.assertEqual(result.returncode, 0, result.stderr)
        report = json.loads(result.stdout)
        self.assertEqual(report["exactBodyCount"], 5)
        self.assertEqual(report["totalBytes"], 815998)
        self.assertEqual(report["distinctOfficialReferenceCodes"], 58)
        self.assertTrue(report["mixedPostalObjectSemantics"])
        self.assertFalse(report["censusDivisionGeometryIsPostalGeometry"])
        self.assertEqual(report["officialPostalGeometryRecords"], 0)

    def test_changed_body_is_rejected(self) -> None:
        temporary, copied = self.copied_source()
        self.addCleanup(temporary.cleanup)
        with (copied / "svgpost-about-us.html").open("ab") as stream:
            stream.write(b"changed")
        result = self.run_inspector(copied)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("exact body mismatch", result.stderr)

    def test_missing_body_is_rejected(self) -> None:
        temporary, copied = self.copied_source()
        self.addCleanup(temporary.cleanup)
        (copied / "upu-vc-addressing.pdf").unlink()
        result = self.run_inspector(copied)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("source set mismatch", result.stderr)

    def test_marker_drift_is_rejected_even_with_updated_receipt_contract(self) -> None:
        temporary, copied = self.copied_source()
        self.addCleanup(temporary.cleanup)
        target = copied / "svgpost-post-codes.html"
        target.write_text(target.read_text(encoding="utf-8").replace("Kingstown (General Delivery)", "Kingstown"), encoding="utf-8")
        result = self.run_inspector(copied)
        self.assertNotEqual(result.returncode, 0)


if __name__ == "__main__":
    unittest.main()
