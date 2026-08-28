import copy
import csv
import datetime
import io
import json
from pathlib import Path
import runpy
import unittest

MODULE = runpy.run_path(str(Path(__file__).with_name('inspect-postal-context-ps-sources.py')))
profile_list, inspect, digest = (MODULE[k] for k in ['profile_list', 'inspect', 'digest'])
NOW = datetime.datetime(2026, 8, 29, tzinfo=datetime.timezone.utc)


def csv_bytes(rows):
    text = io.StringIO(newline='')
    writer = csv.writer(text)
    writer.writerow(MODULE['HEADER'])
    writer.writerows(rows)
    return text.getvalue().encode('utf-8')


def specimen():
    data = csv_bytes([['P001', 'District', 'منطقة', 'بلدة', 'Town', '']])
    observed = '2026-08-28T23:00:00Z'
    ref = {'id': 'list', 'url': 'https://opendata.ps/test-only', 'observed_at': observed, 'edition': 'synthetic', 'kind': 'p3-list', 'bytes': len(data), 'digest': digest(data), 'accepted_mime': ['text/csv'], 'reviewed_profile': profile_list(data)}
    config = {'references': [ref], 'limits': {'max_reference_bytes': 4194304}, 'm2_criterion': {'id': 'M2_official_p3_postal_areas'}}
    observation = {'id': 'list', 'requestedUrl': ref['url'], 'observedAt': observed, 'finalUrl': ref['url'], 'httpStatus': 200, 'redirects': [], 'contentType': 'text/csv', 'bytes': data, 'byteLength': len(data), 'responseDigest': digest(data)}
    return [observation], config


class SourceReviewTests(unittest.TestCase):
    def test_shared_codes_are_relations_not_duplicates_to_drop(self):
        report = profile_list(csv_bytes([['P001', 'A', 'a', 'b', 'X', ''], ['P001', 'A', 'a', 'c', 'Y', '']]))
        self.assertEqual((report['rows'], report['distinctP3Codes'], report['sharedCodeGroups']), (2, 1, 1))
        self.assertEqual(report['rowsDropped'], 0)
        self.assertIsNone(report['nationalCompleteness'])

    def test_no_silent_repairs_or_p7_truncation(self):
        for code in ['P0010001', '001', 'Px', 'P12', 'P0000', 'P１２３', 'p001', ' P001']:
            with self.subTest(code=code):
                report = profile_list(csv_bytes([[code, 'A', 'a', 'b', 'X', '']]))
                self.assertEqual(report['invalidCodeRows'], 1)
                self.assertEqual(report['codeRepairs'], 0)

    def test_blank_coverage_is_unknown_not_zero(self):
        report = profile_list(csv_bytes([['P001', 'A', 'a', 'b', 'X', '']]))
        self.assertEqual(report['emptyFields']['Coverage'], 1)
        self.assertIsNone(report['postalAreaAccuracy'])
        self.assertEqual(report['geometriesProduced'], 0)

    def test_duplicate_rows_and_district_conflicts_are_counted(self):
        a = ['P001', 'A', 'a', 'b', 'X', '']
        report = profile_list(csv_bytes([a, a, ['P001', 'B', 'a', 'b', 'X', '']]))
        self.assertEqual(report['duplicateFullRows'], 1)
        self.assertEqual(report['codesAcrossMultipleDistrictLabels'], 1)

    def test_bom_and_quoted_multiline_fields(self):
        data = b'\xef\xbb\xbf' + csv_bytes([['P001', 'A', 'a', 'b', 'X, Y', 'two\nlines']])
        self.assertEqual(profile_list(data)['rows'], 1)

    def test_bad_schema_width_encoding_and_truncation_fail_closed(self):
        for data in [b'', b'html', b'\xff', csv_bytes([['P001']]), csv_bytes([['P001', 'A', 'a', 'b', 'X', '']]) + b'"truncated', b'\x00', b'x' * (1024 * 1024 + 1)]:
            with self.subTest(size=len(data)), self.assertRaises((ValueError, csv.Error, UnicodeError)):
                profile_list(data)

    def test_complete_receipt_recomputes_profile_but_never_m2(self):
        obs, config = specimen()
        report = inspect(obs, config, NOW)
        self.assertTrue(report['references'][0]['structureRecomputed'])
        self.assertFalse(report['countryM2Achieved'])
        self.assertEqual(report['currentPostalAssignmentsValidated'], 0)

    def test_receipt_fields_and_partial_payload_are_bound(self):
        changes = {'requestedUrl': 'https://other.invalid/', 'finalUrl': 'https://other.invalid/', 'redirects': ['https://opendata.ps/test-only'], 'httpStatus': 206, 'byteLength': 0, 'responseDigest': 'sha256:' + '0'*64, 'contentType': 'text/html', 'bytes': b'partial', 'observedAt': '2099-01-01T00:00:00Z'}
        for key, value in changes.items():
            with self.subTest(key=key), self.assertRaises(ValueError):
                obs, config = specimen(); obs[0][key] = value; inspect(obs, config, NOW)

    def test_missing_duplicate_or_extra_observations_rejected(self):
        obs, config = specimen()
        for rows in [[], obs + obs]:
            with self.assertRaises(ValueError): inspect(rows, config, NOW)

    def test_profile_tampering_rejected(self):
        obs, config = specimen(); config['references'][0]['reviewed_profile']['rows'] = 999
        with self.assertRaisesRegex(ValueError, 'fresh-profile-mismatch'): inspect(obs, config, NOW)

    def test_failed_transfer_cannot_supply_verified_source_bytes(self):
        obs, config = specimen()
        config['references'][0].update(kind='unavailable', http_status=None, failure_kind='curl-exit-56')
        obs[0].update(httpStatus=None, failureKind='curl-exit-56')
        with self.assertRaisesRegex(ValueError, 'failed-source-cannot-prove-content'): inspect(obs, config, NOW)
        for key in ['bytes', 'byteLength', 'responseDigest']: obs[0].pop(key)
        report = inspect(obs, config, NOW)
        self.assertFalse(report['references'][0]['contentVerified'])
        self.assertIsNone(report['references'][0]['sourceDocumentDigest'])

    def test_generic_licence_is_not_auto_promoted(self):
        raw = {'success': True, 'result': {'name': 'postcodes', 'organization': {'name': 'mtde'}, 'license_id': 'cc-by', 'isopen': True, 'resources': [{'id': 'sample', 'name': 'Sample file'}]}}
        report = MODULE['profile_catalog'](json.dumps(raw).encode())
        self.assertFalse(report['licenceVersionConfirmed'])
        self.assertFalse(report['rightsClearedForProduction'])
        self.assertEqual(report['sampleResources'], 1)
        raw['result']['organization']['name'] = 'other'
        with self.assertRaises(ValueError): MODULE['profile_catalog'](json.dumps(raw).encode())


if __name__ == '__main__':
    unittest.main()
