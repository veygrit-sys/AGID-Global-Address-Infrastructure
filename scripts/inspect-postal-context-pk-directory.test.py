"""Synthetic tests only; no upstream rows or assignment evidence."""
import importlib.util
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location("pk_directory", Path(__file__).with_name("inspect-postal-context-pk-directory.py"))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def row(values):
    return "<tr>" + "".join("<td>" + v + "</td>" for v in values) + "</tr>"


def table(key, rows, footer=False):
    h = row(module.HEADERS[key])
    return '<table id="' + key + '"><thead>' + h + '</thead><tbody>' + ''.join(row(r) for r in rows) + '</tbody>' + ('<tfoot>' + h + '</tfoot>' if footer else '') + '</table>'


def document(delivery=None, nondelivery=None):
    return table('dpo', delivery or [['Synthetic D', '00000', 'Synthetic A', 'Synthetic P', '00009']]) + table('ndpo', nondelivery or [['Synthetic N', '00002', 'Synthetic A', 'Synthetic P']])


class PakistanDirectoryTests(unittest.TestCase):
    def profile(self, html):
        return module.profile_bytes(html.encode('utf8'))

    def test_preserves_roles_zeroes_and_no_arithmetic(self):
        p = self.profile(document())
        self.assertEqual(p['tables']['dpo']['leadingZeroRows'], 1)
        self.assertFalse(p['tables']['dpo']['attachedBranchCode']['generatedByArithmetic'])
        self.assertEqual(p['tables']['ndpo']['assignmentClass'], 'non_delivery_post_office')
        self.assertFalse(p['countryM2Achieved'])
        self.assertIsNone(p['nationalCompleteness'])
        self.assertEqual(p['rowsExported'], 0)

    def test_non_delivery_class_is_not_inferred_from_zero_prefix(self):
        p = self.profile(document(nondelivery=[['Synthetic N', '99999', 'Synthetic A', 'Synthetic P']]))
        self.assertEqual(p['tables']['ndpo']['nonLeadingZeroRows'], 1)
        self.assertEqual(p['tables']['ndpo']['assignmentClass'], 'non_delivery_post_office')

    def test_repeated_header_and_footer_are_not_assignments(self):
        html = table('dpo', [['D', '00000', 'A', 'P', '00009']]) + table('ndpo', [module.HEADERS['ndpo'], ['N', '00002', 'A', 'P']], True)
        p = self.profile(html)['tables']['ndpo']
        self.assertEqual((p['bodyRows'], p['repeatedHeaderRows'], p['footerHeaderRows'], p['populatedRows']), (2, 1, 1, 1))

    def test_no_deduplication_or_cross_class_merging(self):
        r = ['D', '00000', 'A', 'P', '00009']
        p = self.profile(document([r, r, ['D2', '00000', 'A', 'P', '00008']], [['N', '00000', 'A', 'P']]))
        self.assertEqual(p['tables']['dpo']['populatedRows'], 3)
        self.assertEqual(p['tables']['dpo']['duplicateRowsBeyondFirst'], 1)
        self.assertEqual(p['crossClassSharedCodes'], 1)
        self.assertEqual(p['rowsDeduplicated'], 0)

    def test_no_padding_truncation_unicode_digit_coercion(self):
        p = self.profile(document(nondelivery=[['N', v, 'A', 'P'] for v in ['0000', '000000', '００００２', '00 002', '']]))
        self.assertEqual(p['tables']['ndpo']['invalidCodeRows'], 5)
        self.assertEqual(p['rowsRepaired'], 0)
        self.assertNotIn('Synthetic N', str(p))

    def test_missing_and_branch_exceptions_remain_distinct(self):
        p = self.profile(document([['D', '00000', '', 'P', ''], ['D2', '00001', 'A', 'P', 'bad'], ['D3', '00002', 'A', 'P', '00002']]))['tables']['dpo']
        self.assertEqual(p['attachedBranchCode']['missingRows'], 1)
        self.assertEqual(p['attachedBranchCode']['invalidNonemptyRows'], 1)
        self.assertEqual(p['attachedBranchCode']['sameAsOfficeCodeRows'], 1)
        self.assertEqual(p['missingFields']['ACCOUNT OFFICE'], 1)

    def test_optional_html_end_tags_are_accounted_for(self):
        html = document().replace('<td>Synthetic A</td>', '<td><p>Synthetic A</td>', 1).replace('</tbody></table>', '</table>', 1)
        self.assertEqual(self.profile(html)['optionalHtmlEndTags'], {'p': 1, 'tbody': 1})

    def test_entities_normalize_without_row_export(self):
        self.assertEqual(self.profile(document().replace('Synthetic A', 'A &amp; B'))['rowsExported'], 0)

    def test_fail_closed_structural_drift(self):
        html = document()
        cases = [html + table('dpo', [['D','00000','A','P','00001']]), html.replace('id="ndpo"','id="other"'),
                 html.replace('POST CODE</td>', 'CODE</td>', 1), html.replace('<td>00000</td>',''),
                 html.replace('<td>00000</td>','<td>00000'), html.replace('<td>00000','<td colspan="2">00000'),
                 html.replace('<td>00000','<td hidden>00000'), html.replace('<td>00000','<td style="display:none">00000'),
                 html.replace('<td>00000','<td id="a" id="b">00000'), html.replace('<td>00000','<td><script>x</script>00000'),
                 html.replace('<td>00000','<td><table></table>00000')]
        for altered in cases:
            with self.subTest(altered=altered[:20]), self.assertRaises(ValueError):
                self.profile(altered)

    def test_limits_and_encoding(self):
        for data in [b'', b'x' * (module.MAX_BYTES + 1), b'\xff']:
            with self.assertRaises((ValueError, UnicodeError)):
                module.profile_bytes(data)
        with self.assertRaisesRegex(ValueError, 'cell-limit'):
            self.profile(document().replace('Synthetic D', 'x' * 513))

    def test_digest_binding(self):
        data = document().encode()
        self.assertEqual(module.profile_bytes(data, module.digest(data))['inputDigest'], module.digest(data))
        with self.assertRaisesRegex(ValueError, 'digest-mismatch'):
            module.profile_bytes(data, 'sha256:' + '0' * 64)


if __name__ == '__main__':
    unittest.main()
