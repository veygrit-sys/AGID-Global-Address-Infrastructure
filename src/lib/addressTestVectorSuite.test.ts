import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  ADDRESS_TEST_VECTOR_SUITE_VERSION,
  buildAddressTestVectorSuite,
  validateAddressTestVectorSuite,
} from './addressTestVectorSuite';

test('builds an OSS-safe Address Test Vector Suite manifest', () => {
  const suite = buildAddressTestVectorSuite();

  assert.equal(suite.manifest.suiteId, 'address-test-vector-suite');
  assert.equal(suite.manifest.version, ADDRESS_TEST_VECTOR_SUITE_VERSION);
  assert.equal(suite.manifest.counts.vectors, suite.vectors.length);
  assert.ok(suite.manifest.counts.countries >= 4);
  assert.ok(suite.manifest.counts.surfaces.validation >= 4);
  assert.ok(suite.manifest.counts.surfaces.rendering >= 4);
  assert.ok(suite.manifest.counts.surfaces['privacy-boundary'] >= suite.vectors.length);
  assert.equal(suite.manifest.files.every(file => file.containsPersonalData === false), true);
  assert.equal(suite.manifest.files.every(file => file.containsThirdPartyData === false), true);
});

test('keeps public vectors synthetic or redacted and rejects private-material keys', () => {
  const suite = buildAddressTestVectorSuite();
  const validation = validateAddressTestVectorSuite(suite);

  assert.equal(validation.valid, true);
  assert.deepEqual(validation.errors, []);
  assert.deepEqual(validation.warnings, []);
  assert.equal(suite.vectors.every(vector => vector.privacyClass === 'synthetic-public' || vector.privacyClass === 'redacted-public'), true);
  assert.ok(suite.conformance.forbiddenPrivateKeys.includes('rawAddress'));
  assert.ok(suite.conformance.forbiddenPrivateKeys.includes('proofCode'));
  assert.ok(suite.conformance.forbiddenPrivateKeys.includes('aoidSecret'));
});

test('fixes Japan synthetic postal validation, renderings, and language tabs', () => {
  const suite = buildAddressTestVectorSuite();
  const vector = suite.vectors.find(item => item.vectorId === 'addrvec-jp-postal-render-v1');

  assert.ok(vector);
  assert.equal(vector.expected.validation?.status, 'verified');
  assert.equal(vector.expected.validation?.qualityMode, 'postal-verified');
  assert.equal(vector.expected.validation?.postalCodeValid, true);
  assert.equal(vector.expected.validation?.confidenceLabel, 'Confidence 99%');
  assert.match(vector.expected.renderings?.ja || '', /〒100-0001/);
  assert.match(vector.expected.renderings?.ja || '', /東京都/);
  assert.match(vector.expected.renderings?.intl_en || '', /JAPAN/);
  assert.ok(vector.expected.languageTabs?.some(tab => tab.code === 'ja'));
  assert.ok(vector.expected.displayTabs?.includes('en'));
});

test('keeps invalid US postcode partial and non-autoverified', () => {
  const suite = buildAddressTestVectorSuite();
  const vector = suite.vectors.find(item => item.vectorId === 'addrvec-us-invalid-postcode-v1');

  assert.ok(vector);
  assert.equal(vector.expected.validation?.status, 'partial');
  assert.equal(vector.expected.validation?.qualityMode, 'partial-postal');
  assert.equal(vector.expected.validation?.postalCodeValid, false);
  assert.ok(vector.expected.validation?.missingRequiredFields.length === 0);
  assert.match(vector.expected.renderings?.intl_en || '', /UNITED STATES/);
});

test('allows no-postal-code countries to become geo verified with strong open geography evidence', () => {
  const suite = buildAddressTestVectorSuite();
  const vector = suite.vectors.find(item => item.vectorId === 'addrvec-ae-no-postal-geo-v1');

  assert.ok(vector);
  assert.equal(vector.expected.validation?.status, 'verified');
  assert.equal(vector.expected.validation?.qualityMode, 'geo-verified');
  assert.equal(vector.expected.validation?.postalCodeValid, null);
  assert.match(vector.expected.validation?.checkedWith.join(' ') || '', /overture-synthetic/);
  assert.match(vector.expected.renderings?.intl_en || '', /UNITED ARAB EMIRATES/);
});

test('detects forbidden private keys in supplied public vectors', () => {
  const suite = buildAddressTestVectorSuite({
    vectors: [
      {
        vectorId: 'addrvec-bad-private-key',
        title: 'Bad vector',
        surfaces: ['privacy-boundary'],
        privacyClass: 'redacted-public',
        description: 'This intentionally contains forbidden material.',
        input: {
          rawObject: {
            proofCode: '123456',
            addressRef: 'addr_ref',
          },
        },
      },
    ],
  });
  const validation = validateAddressTestVectorSuite(suite);

  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some(error => error.includes('forbidden-private-key:addrvec-bad-private-key')));
});
