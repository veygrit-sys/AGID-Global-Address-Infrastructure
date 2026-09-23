import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  addressDocumentResultToAssistanceCandidate,
  extractPrintableTextFromBinary,
  inferAddressDocumentKind,
  readAddressDocument,
} from './addressDocumentReading';

test('reads Japanese address candidates from text-bearing documents', () => {
  const result = readAddressDocument({
    fileName: 'shipping-label.txt',
    mimeType: 'text/plain',
    countryHint: 'JP',
    supportedCountryCodes: ['JP', 'US'],
    text: [
      'お届け先',
      '山田 太郎',
      '〒100-0005',
      '東京都千代田区丸の内1丁目',
      '電話 +81-3-1234-5678',
    ].join('\n'),
  });

  assert.equal(result.kind, 'text');
  assert.equal(result.status, 'ready');
  assert.equal(result.patch.country, 'JP');
  assert.equal(result.patch.recipient, '山田 太郎');
  assert.equal(result.patch.postcode, '100-0005');
  assert.equal(result.patch.street, '東京都千代田区丸の内1丁目');
  assert.equal(result.privacyBoundary, 'device-local-no-upload');
  assert.ok(result.confidence >= 0.8);
});

test('reads international shipping-label style address candidates', () => {
  const result = readAddressDocument({
    fileName: 'label.csv',
    mimeType: 'text/csv',
    countryHint: 'GB',
    supportedCountryCodes: ['GB'],
    text: [
      'SHIP TO',
      'Jane Smith',
      'ACME Ltd',
      '221B Baker Street',
      'London NW1 6XE',
      'United Kingdom',
    ].join('\n'),
  });

  assert.equal(result.status, 'ready');
  assert.equal(result.patch.country, 'GB');
  assert.equal(result.patch.recipient, 'Jane Smith');
  assert.equal(result.patch.organization, 'ACME Ltd');
  assert.equal(result.patch.street, '221B Baker Street');
  assert.equal(result.patch.postcode, 'NW1 6XE');

  const candidate = addressDocumentResultToAssistanceCandidate(result);
  assert.equal(candidate?.source, 'document-ai');
  assert.equal(candidate?.requiresUserReview, true);
  assert.equal(candidate?.patch.street, '221B Baker Street');
});

test('extracts printable text from simple PDF-like binary payloads', () => {
  const payload = new TextEncoder().encode('%PDF-1.7\nBT\n(Ship To Jane Smith 221B Baker Street London NW1 6XE) Tj\nET');
  const text = extractPrintableTextFromBinary(payload.buffer);
  assert.match(text, /221B Baker Street/);
});

test('classifies image uploads as needing an OCR worker when no text is available', () => {
  assert.equal(inferAddressDocumentKind('receipt.jpg', 'image/jpeg'), 'image');
  const result = readAddressDocument({
    fileName: 'receipt.jpg',
    mimeType: 'image/jpeg',
    text: '',
  });

  assert.equal(result.status, 'needs-ocr-engine');
  assert.equal(result.confidence, 0);
  assert.ok(result.warnings.includes('image-ocr-worker-not-configured'));
});
