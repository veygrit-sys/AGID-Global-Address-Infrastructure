import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildAddressElementSession } from './addressElement';
import {
  ADDRESS_REGISTRATION_PROFESSIONAL_ROLES,
  assessAddressRegistrationReadiness,
} from './addressRegistrationReadiness';

function baseReadySession() {
  return buildAddressElementSession({
    purpose: 'delivery',
    mode: 'local',
    countryCode: 'JP',
    selectedLanguage: 'ja',
    fields: {
      countryCode: 'JP',
      postcode: '100-0005',
      state: 'Tokyo',
      city: 'Chiyoda',
      district: 'Marunouchi',
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
        district: 'Marunouchi',
        confidence: 0.96,
      },
    ],
    agidCandidate: {
      present: true,
      exposure: 'commitment',
      safeFingerprint: 'agid-cmt-jp-marunouchi',
      confidence: 0.9,
    },
    languageTabs: [
      { language: 'ja', label: 'Japanese', source: 'native' },
      { language: 'en', label: 'English Shipping', source: 'english-shipping' },
    ],
  });
}

test('Address Registration readiness summarizes professional roles without leaking raw address values', () => {
  const readiness = assessAddressRegistrationReadiness({
    session: baseReadySession(),
    renderedPreview: 'Tokyo preview redacted from public metadata',
    addressLanguageTabs: [
      { code: 'ja', label: 'Japanese', kind: 'native' },
      { code: 'en', label: 'English', kind: 'international' },
    ],
    selectedAddressLanguage: 'ja',
    hasPostalAutofill: true,
    hasAgidAutofill: true,
    hasClosedCorrectionFeedback: true,
  });

  assert.equal(readiness.modelVersion, 'address-registration-readiness-v1');
  assert.equal(readiness.status, 'usable');
  assert.ok(readiness.score >= 0.85);
  assert.deepEqual(
    readiness.roleSummaries.map(role => role.role).sort(),
    [...ADDRESS_REGISTRATION_PROFESSIONAL_ROLES].sort(),
  );
  assert.equal(readiness.publicMetadata.privacyBoundary, 'no-raw-address-public-metadata');
  assert.doesNotMatch(
    JSON.stringify(readiness.publicMetadata),
    /Private Receiver|\+81-3|Marunouchi|1-9-1|Tokyo preview/,
  );
});

test('Address Registration readiness pushes incomplete records into review with explicit actions', () => {
  const session = buildAddressElementSession({
    purpose: 'delivery',
    countryCode: 'US',
    selectedLanguage: 'en',
    fields: {
      countryCode: 'US',
      city: 'Austin',
    },
    languageTabs: [
      { language: 'en', label: 'US English', source: 'native' },
    ],
  });
  const readiness = assessAddressRegistrationReadiness({
    session,
    renderedPreview: '',
    addressLanguageTabs: [{ code: 'en', label: 'US English', kind: 'native' }],
    selectedAddressLanguage: 'en',
  });

  assert.equal(readiness.status, 'needs_review');
  assert.ok(readiness.publicMetadata.checkSummary.fail > 0);
  assert.ok(readiness.nextActions.some(action => /required address fields|postal-code lookup|AGID hint/i.test(action)));
});

test('Address Registration readiness blocks high-risk public AGID registrations', () => {
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
  });
  const readiness = assessAddressRegistrationReadiness({
    session,
    renderedPreview: 'Redacted disaster-area preview',
    addressLanguageTabs: [
      { code: 'ja', label: 'Japanese', kind: 'native' },
      { code: 'en', label: 'English', kind: 'international' },
    ],
    selectedAddressLanguage: 'ja',
    hasAgidAutofill: true,
  });

  assert.equal(readiness.status, 'blocked');
  assert.ok(readiness.checks.some(check => check.id === 'high-risk-safety' && check.status === 'fail'));
  assert.ok(readiness.nextActions.some(action => /AGID-S|recipient proof/i.test(action)));
  assert.doesNotMatch(JSON.stringify(readiness.publicMetadata), /JP05AV8TJGH8|disaster-area/);
});
