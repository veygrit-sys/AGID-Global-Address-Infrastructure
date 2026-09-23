import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { scanNoRawAddressReleaseText } from './noRawAddressReleaseScan';

test('accepts redacted public release examples', () => {
  const result = scanNoRawAddressReleaseText(`
    {
      "rawAddress": "REDACTED",
      "recipientName": "<redacted>",
      "phoneNumber": "redacted",
      "publicStatus": "Address OK"
    }
    AGID sample: AGID-XXXX-XXXX
  `);

  assert.equal(result.valid, true);
  assert.deepEqual(result.findings.filter(finding => finding.severity === 'error'), []);
});

test('rejects private field values, precise coordinates, and AGID-S ciphertext samples', () => {
  const result = scanNoRawAddressReleaseText(`
    {
      "rawAddress": "1-2-3 Private Street, Example City",
      "recipientName": "Private Receiver",
      "lat": 35.681236,
      "lng": 139.767125
    }
    AGIDS1-ABCDEFGH234567ABCDEFGH234567
  `);

  assert.equal(result.valid, false);
  assert.ok(result.findings.some(finding => finding.code === 'private-field-value:rawAddress'));
  assert.ok(result.findings.some(finding => finding.code === 'private-field-value:recipientName'));
  assert.ok(result.findings.some(finding => finding.code === 'precise-coordinate-pair'));
  assert.ok(result.findings.some(finding => finding.code === 'agid-s-ciphertext-public-sample'));
});

test('flags Japanese postal-code address combinations as release blockers', () => {
  const result = scanNoRawAddressReleaseText('〒100-0001 東京都千代田区千代田1丁目1番地 サンプルビル101号室');

  assert.equal(result.valid, false);
  assert.ok(result.findings.some(finding => finding.code === 'postal-code-with-detailed-address'));
});

test('rejects QR/NFC payload fields, decrypted AGID, witness, and secret examples', () => {
  const result = scanNoRawAddressReleaseText(`
    {
      "qrPayload": "agid:address:%7B%22record%22%3A%7B%7D%7D",
      "nfcPayload": "agid:nfc:%7B%22payload%22%3A%22AGIDS1-ABCDEFGH234567ABCDEFGH234567%22%7D",
      "decryptedAgid": "JP05AV8TJGH8",
      "witness": "private witness material",
      "secret": "recipient local secret"
    }
  `);

  assert.equal(result.valid, false);
  assert.ok(result.findings.some(finding => finding.code === 'private-field-value:qrPayload'));
  assert.ok(result.findings.some(finding => finding.code === 'private-field-value:nfcPayload'));
  assert.ok(result.findings.some(finding => finding.code === 'private-field-value:decryptedAgid'));
  assert.ok(result.findings.some(finding => finding.code === 'private-field-value:witness'));
  assert.ok(result.findings.some(finding => finding.code === 'private-field-value:secret'));
  assert.ok(result.findings.some(finding => finding.code === 'nfc-wrapped-payload-public-sample'));
});

test('rejects address component fields that would expose a reconstructable address', () => {
  const result = scanNoRawAddressReleaseText(`
    {
      "streetAddress": "Private Road 12",
      "buildingName": "Private Residence Tower",
      "deliveryInstructions": "leave at private side door",
      "floorNumber": "28F"
    }
  `);

  assert.equal(result.valid, false);
  assert.ok(result.findings.some(finding => finding.code === 'private-field-value:streetAddress'));
  assert.ok(result.findings.some(finding => finding.code === 'private-field-value:buildingName'));
  assert.ok(result.findings.some(finding => finding.code === 'private-field-value:deliveryInstructions'));
  assert.ok(result.findings.some(finding => finding.code === 'private-field-value:floorNumber'));
});

test('release scan includes the Address Morphism Theory repository boundary note', () => {
  const script = readFileSync('scripts/verify-no-raw-address-release.ts', 'utf8');
  const docPath = 'docs/product/address-morphism-repository-boundary.md';
  const doc = readFileSync(docPath, 'utf8');
  const result = scanNoRawAddressReleaseText(doc);

  assert.match(script, new RegExp(docPath.replaceAll('/', '\\/')));
  assert.equal(result.valid, true);
  assert.deepEqual(result.findings.filter(finding => finding.severity === 'error'), []);
});
