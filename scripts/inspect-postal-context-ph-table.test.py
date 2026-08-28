"""Synthetic parser tests, not evidence of Philippine data completeness."""
import importlib.util
import json
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location("ph_table", Path(__file__).with_name("inspect-postal-context-ph-table.py"))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def html(rows, headers=None):
    heads = "".join(f"<th>{h}</th>" for h in (headers or module.HEADERS))
    body = "".join("<tr>" + "".join(f"<td><span>{c}</span></td>" for c in r) + "</tr>" for r in rows)
    return f'<html><table id="offices"><thead><tr>{heads}</tr></thead><tbody>{body}</tbody></table></html>'.encode()


class ProfileTest(unittest.TestCase):
    def test_blank_rows_not_assignments(self):
        p = module.profile_bytes(html([["", "", "", ""], ["r", "p", "c", "9999"]]))
        self.assertEqual((p["htmlBodyRows"], p["allBlankRows"], p["populatedRows"]), (2, 1, 1))
        self.assertFalse(p["countryM2Achieved"])

    def test_leading_zero_is_text(self):
        p = module.profile_bytes(html([["r", "p", "c", "0001"]]))
        self.assertEqual(p["leadingZeroCodeRows"], 1)
        self.assertEqual(p["fourDigitRows"], 1)

    def test_invalid_codes_not_repaired(self):
        codes = ["Locality", "123", "１２３４", "12345", "AB00001", "1 234", "", "1234,5678"]
        p = module.profile_bytes(html([["r", "p", "c", code] for code in codes]))
        self.assertEqual(p["invalidOrMissingCodeRows"], len(codes))
        self.assertEqual(p["rowsRepaired"], 0)

    def test_missing_label_not_filled_from_code(self):
        p = module.profile_bytes(html([["r", "", "c", "9999"]]))
        self.assertEqual(p["fourDigitRows"], 1)
        self.assertEqual(p["completeFourFieldCandidates"], 0)
        self.assertEqual(p["missingFieldsInPopulatedRows"]["Provinces"], 1)

    def test_duplicate_and_shared_code_distinct(self):
        p = module.profile_bytes(html([["r", "p", "a", "9999"], ["r", "p", "a", "9999"], ["r", "p", "b", "9999"]]))
        self.assertEqual(p["duplicateRowsBeyondFirst"], 1)
        self.assertEqual(p["rowsInSharedCodeGroups"], 3)
        self.assertEqual(p["rowsDeduplicated"], 0)

    def test_same_locality_multiple_codes_not_merged(self):
        p = module.profile_bytes(html([["r", "p", "a", "0001"], ["r", "p", "a", "0002"]]))
        self.assertEqual(p["localityKeysWithMultipleCodes"], 1)

    def test_entity_whitespace_and_unicode_determinism(self):
        a = module.profile_bytes(html([["r &amp; x", "e\u0301", " a\n b ", "9999"]]))
        b = module.profile_bytes(html([["r & x", "é", "a b", "9999"]]))
        self.assertEqual(a["decodedMatrixDigest"], b["decodedMatrixDigest"])
        self.assertNotEqual(a["inputDigest"], b["inputDigest"])

    def test_no_source_rows_in_output(self):
        p = module.profile_bytes(html([["r", "p", "Synthetic private label", "invalid-code"]]))
        result = json.dumps(p)
        self.assertNotIn("Synthetic private label", result)
        self.assertNotIn("invalid-code", result)
        self.assertEqual(p["rowsExported"], 0)

    def test_schema_and_extra_private_columns_rejected(self):
        for headers in [module.HEADERS[::-1], module.HEADERS + ["Owner"]]:
            with self.assertRaises(ValueError):
                module.profile_bytes(html([["r", "p", "c", "9999"]], headers))

    def test_html_structural_drift_rejected(self):
        data = html([["r", "p", "c", "9999"]])
        invalid = [data.replace(b"</table>", b""), data + data,
                   data.replace(b"<span>r", b"<table><span>r"),
                   data.replace(b"<td>", b'<td colspan="2">', 1),
                   data.replace(b"</th>", b"</td>", 1),
                   data.replace(b"<span>", b"<script>", 1)]
        for candidate in invalid:
            with self.subTest(candidate=candidate[:50]), self.assertRaises(ValueError):
                module.profile_bytes(candidate)

    def test_hidden_content_and_duplicate_attributes_rejected(self):
        data = html([["r", "p", "c", "9999"]])
        for attr in [b'hidden', b'aria-hidden="true"', b'style="display:none"', b'id="other"']:
            with self.subTest(attr=attr), self.assertRaises(ValueError):
                module.profile_bytes(data.replace(b'id="offices"', b'id="offices" ' + attr))

    def test_bounds_encoding_and_digest(self):
        data = html([["r", "p", "c", "9999"]])
        for candidate in [b"", b"x" * (module.MAX_BYTES + 1), data.replace(b"9999", b"\xff"), html([["r" * 513, "p", "c", "9999"]])]:
            with self.assertRaises((ValueError, UnicodeError)):
                module.profile_bytes(candidate)
        with self.assertRaisesRegex(ValueError, "digest-mismatch"):
            module.profile_bytes(data, "sha256:" + "0" * 64)
        self.assertEqual(module.profile_bytes(data, module.digest(data))["inputDigest"], module.digest(data))

    def test_empty_table_rejected_but_blank_population_is_explicit(self):
        with self.assertRaises(ValueError):
            module.profile_bytes(html([]))
        p = module.profile_bytes(html([["", "", "", ""]]))
        self.assertEqual(p["populatedRows"], 0)
        self.assertIsNone(p["nationalCompleteness"])


if __name__ == "__main__":
    unittest.main()
