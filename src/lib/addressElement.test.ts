import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildAddressElementSession, listAddressElementCapabilities } from './addressElement';

test('Address Element builds a ready session with postal and AGID evidence without returning raw fields', () => {
  const session = buildAddressElementSession({
    purpose: 'delivery',
    mode: 'server',
    countryCode: 'JP',
    selectedLanguage: 'ja',
    fields: {
      countryCode: 'JP',
      postcode: '100-0005',
      state: 'Tokyo',
      city: 'Chiyoda',
      street: 'Marunouchi',
      houseNumber: '1-9-1',
      recipient: 'Private Receiver',
      phone: '+81-3-0000-0000',
    },
    postalCandidates: [
      {
        source: 'japan-post',
        countryCode: 'JP',
        postalCode: '100-0005',
        state: 'Tokyo',
        city: 'Chiyoda',
        confidence: 0.96,
      },
    ],
    agidCandidate: {
      present: true,
      exposure: 'commitment',
      safeFingerprint: 'agid-cmt-jp-tokyo-station',
      confidence: 0.9,
    },
  });

  assert.equal(session.status, 'ready');
  assert.equal(session.quality.internalOnly, true);
  assert.equal(session.privacy.rawFieldValuesReturned, false);
  assert.ok(session.evidenceForIntent.some(item => item.source === 'postal-api'));
  assert.ok(session.evidenceForIntent.some(item => item.source === 'agid-reverse-geocode'));
  assert.equal(session.intentPreview.purpose, 'delivery');
  assert.doesNotMatch(JSON.stringify(session), /Private Receiver|\+81-3|Marunouchi|1-9-1/);
});

test('Address Element high-risk mode blocks public AGID and asks for secure live proof', () => {
  const session = buildAddressElementSession({
    purpose: 'aid',
    mode: 'local',
    countryCode: 'JP',
    fieldPresence: {
      countryCode: true,
      postcode: true,
      city: true,
      street: true,
    },
    agidCandidate: {
      present: true,
      agid: 'JP05AV8TJGH8',
      exposure: 'public',
    },
    highRiskMode: true,
    scanCapabilities: {
      qr: true,
      agidSecure: false,
    },
  });

  assert.equal(session.status, 'blocked');
  assert.equal(session.quality.decision, 'blocked');
  assert.ok(session.warnings.includes('high-risk-mode-should-not-use-public-agid'));
  assert.ok(session.nextActions.includes('request_recipient_proof'));
  assert.equal(session.intentPreview.status, 'rejected');
  assert.doesNotMatch(JSON.stringify(session), /JP05AV8TJGH8/);
});

test('Address Element high-risk mode can proceed only with secure QR/NFC or commitment intake', () => {
  const secure = buildAddressElementSession({
    purpose: 'aid',
    mode: 'local',
    countryCode: 'JP',
    fieldPresence: {
      countryCode: true,
      postcode: true,
      city: true,
      street: true,
    },
    highRiskMode: true,
    scanCapabilities: {
      qr: true,
      nfc: true,
      agidSecure: true,
    },
  });

  assert.notEqual(secure.status, 'blocked');
  assert.equal(secure.scanSecurity.publicDecision, 'ok');
  assert.equal(secure.scanSecurity.privacyBoundary, 'address-element-scan-no-raw-payload');

  const unsafe = buildAddressElementSession({
    purpose: 'aid',
    mode: 'local',
    countryCode: 'JP',
    fieldPresence: {
      countryCode: true,
      postcode: true,
      city: true,
      street: true,
    },
    highRiskMode: true,
    scanCapabilities: {
      qr: true,
      nfc: false,
      agidSecure: false,
    },
  });

  assert.equal(unsafe.status, 'blocked');
  assert.equal(unsafe.scanSecurity.publicDecision, 'restricted');
  assert.ok(unsafe.warnings.includes('high-risk-mode-requires-agid-s-or-equivalent-commitment'));
});

test('Address Element correction feedback stays closed-local and produces learning actions', () => {
  const session = buildAddressElementSession({
    purpose: 'delivery',
    countryCode: 'US',
    fieldPresence: {
      countryCode: true,
      postcode: true,
      city: true,
      street: true,
    },
    feedback: {
      originalDisplay: 'Bad public display',
      correctedDisplay: 'Better public display',
      issue: 'wrong-language',
      severity: 2,
    },
  });

  assert.equal(session.feedback?.recordCreated, true);
  assert.equal(session.feedback?.privacy, 'closed-device-local');
  assert.ok(session.feedback?.suggestedActions.length);
  assert.doesNotMatch(JSON.stringify(session), /Bad public display|Better public display/);
});

test('Address Element does not require postal code for no-postal-code countries', () => {
  const session = buildAddressElementSession({
    purpose: 'delivery',
    countryCode: 'HK',
    selectedLanguage: 'en',
    fields: {
      countryCode: 'HK',
      city: 'Hong Kong',
      district: 'Central and Western',
      street: 'Queen Road Central',
      building: 'Landmark',
    },
    format: {
      countryCode: 'HK',
      name: 'Hong Kong',
      native: {
        fields: [
          { key: 'district', required: true },
          { key: 'street', required: true },
          { key: 'building' },
        ],
      },
      english: {
        fields: [
          { key: 'building' },
          { key: 'street', required: true },
          { key: 'district', required: true },
        ],
      },
      postalCode: {
        format: null,
        regex: null,
        api: null,
        source: 'Hongkong Post / LandsD / CSDI (No postal codes used)',
      },
      addressRules: {
        postalCode: null,
      },
    },
    agidCandidate: {
      present: true,
      exposure: 'commitment',
      safeFingerprint: 'agid-cmt-hk-no-postcode',
      confidence: 0.82,
    },
  });

  const postcode = session.fields.find(field => field.key === 'postcode');

  assert.equal(session.inputPolicy.postalCode.available, false);
  assert.equal(session.primaryIdentifier.kind, 'agid');
  assert.equal(session.primaryIdentifier.reason, 'no-postal-code-agid-primary');
  assert.equal(postcode?.required, false);
  assert.ok(!session.missingRequiredFields.includes('postcode'));
  assert.ok(['ready', 'needs_review', 'collecting'].includes(session.status));
});

test('Address Element treats fixed postal code regions as policy-driven input, not missing user input', () => {
  const session = buildAddressElementSession({
    purpose: 'delivery',
    countryCode: 'VA',
    selectedLanguage: 'en',
    fields: {
      countryCode: 'VA',
      city: 'Vatican City',
      street: 'Via della Posta',
      houseNumber: '1',
    },
    format: {
      countryCode: 'VA',
      name: 'Vatican City',
      english: {
        fields: [
          { key: 'street', required: true },
          { key: 'houseNumber', required: true },
        ],
      },
      postalCode: {
        format: '00120',
        regex: '^00120$',
        api: null,
        source: 'Vatican City postcode metadata',
      },
      addressRules: {
        postalCode: { label: '00120 Vatican City postcode', required: true, usage: 'required' },
      },
    },
  });

  const postcode = session.fields.find(field => field.key === 'postcode');

  assert.equal(session.inputPolicy.postalCode.fixedValue, '00120');
  assert.equal(postcode?.required, true);
  assert.equal(postcode?.present, true);
  assert.ok(!session.missingRequiredFields.includes('postcode'));
});

test('Address Element capabilities describe embeddable features and privacy boundary', () => {
  const capabilities = listAddressElementCapabilities();
  assert.equal(capabilities.supports.postalCodeAutocomplete, true);
  assert.equal(capabilities.supports.postalCodePolicy, true);
  assert.equal(capabilities.supports.highRiskMode, true);
  assert.equal(capabilities.supports.hostEventContract, true);
  assert.equal(capabilities.supports.professionalReadiness, true);
  assert.equal(capabilities.privacy.publicApiRawFieldValuesAccepted, false);
});
