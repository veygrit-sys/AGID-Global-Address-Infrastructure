import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import AdmZip from 'adm-zip';
import {
  compareAssignments,
  parseSemicolonCsv,
  profileCertificate,
  profileSingleCsvArchive,
  sourceDigest,
  validateCzechiaAuditReport,
} from './inspect-postal-context-cz-sources.mjs';

const report = JSON.parse(readFileSync(new URL('../reports/postal-context-m2/cz-source-review-2026-08-30.json', import.meta.url), 'utf8'));

test('Czech source digests and Windows-1250 CSV rows are deterministic', () => {
  assert.equal(sourceDigest(Buffer.from('cz')), 'sha256:c4e98e070d2cdcd8b6486826223be4f528c54306c9e9c7191a5af6628ffb32e9');
  const parsed = parseSemicolonCsv(Buffer.from('PSC;TYP_PSC\r\n10000;1\r\n', 'latin1'));
  assert.deepEqual(parsed.header, ['PSC', 'TYP_PSC']);
  assert.deepEqual(parsed.records, [{ PSC: '10000', TYP_PSC: '1' }]);
  assert.throws(() => parseSemicolonCsv(Buffer.from('A;B\n1\n')), /cz-csv-columns-2/);
});

test('single CSV archives preserve leading-zero-safe PSČ and type classes', () => {
  const zip = new AdmZip();
  zip.addFile('zv_psc_adr.csv', Buffer.from('PSC;TYP_PSC\r\n00100;3\r\n10000;1\r\n', 'latin1'));
  const profile = profileSingleCsvArchive(zip.toBuffer(), { id: 'fixture', expected_profile: { entry: 'zv_psc_adr.csv' } });
  assert.equal(profile.rows, 2);
  assert.equal(profile.distinct_postcodes, 2);
  assert.equal(profile.invalid_postcodes, 0);
  assert.deepEqual(profile.type_counts, { 1: 1, 3: 1 });
});

test('legacy and OOXML certificates survive run boundaries', () => {
  const legacyText = 'Certifikát Cyklus aktualizace měsíčně Nabývá účinnosti dnem 1.4.2014 výjimečné případy';
  const legacy = Buffer.concat([Buffer.from('d0cf11e0a1b11ae1', 'hex'), Buffer.from(legacyText, 'utf16le')]);
  assert.equal(profileCertificate(legacy, {
    id: 'legacy', kind: 'legacy-word-certificate', expected_profile: {
      effective_date: '1.4.2014', update_cycle: 'monthly-first-day', states_exceptional_no_delivery_cases: true,
    },
  }).effective_date, '1.4.2014');

  const zip = new AdmZip();
  zip.addFile('word/document.xml', Buffer.from('<w:document><w:t>Cyklus </w:t><w:t>aktualizace měsíčně 1. 2. 20</w:t><w:t>20 Typ PSČ 1 – 3 – 4 – 5 – 10 –</w:t></w:document>'));
  assert.deepEqual(profileCertificate(zip.toBuffer(), {
    id: 'docx', kind: 'docx-certificate', expected_profile: {
      effective_date: '1. 2. 2020', update_cycle: 'monthly-first-day', declares_type_codes: ['1', '3', '4', '5', '10'],
    },
  }).declares_type_codes, ['1', '3', '4', '5', '10']);
});

test('assignment comparison keeps special classes and address membership separate', () => {
  const profile = (records, field) => ({ _records: records, _postcode_field: field });
  const compared = compareAssignments({
    'ceska-posta-address-postcode-types-2026-08': profile([{ PSC: '10000', TYP_PSC: '1' }, { PSC: '10001', TYP_PSC: '3' }], 'PSC'),
    'ceska-posta-locality-postcodes-2026-08': profile([{ PSC: '10000' }], 'PSC'),
    'ceska-posta-municipality-part-postcodes-2026-08': profile([{ psc: '10000' }], 'psc'),
    'ceska-posta-no-delivery-service-2026-08': profile([{ 'ADRESNÍ PSČ': '10000' }], 'ADRESNÍ PSČ'),
    'cuzk-ruian-addresses-2026-07-31': { _codes: new Set(['10000']) },
  });
  assert.equal(compared.matched_codes, 1);
  assert.equal(compared.operator_codes_without_ruian_address_rows, 1);
  assert.deepEqual(compared.ruian_type_counts, { 1: 1 });
});

test('fixed Czechia report remains fail-closed without production polygons', () => {
  assert.deepEqual(validateCzechiaAuditReport(report), {
    references: 9,
    operatorCodes: 15666,
    ruianRows: 3020222,
    productionEligibleRecords: 0,
    countryM2Achieved: false,
  });
});
