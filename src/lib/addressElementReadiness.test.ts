import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildAddressElementSession } from './addressElement';
import {
  ADDRESS_ELEMENT_PROFESSIONAL_ROLES,
  assessAddressElementReadiness,
} from './addressElementReadiness';

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
        confidence: 0.96,
      },
    ],
    agidCandidate: {
      present: true,
      exposure: 'commitment',
      safeFingerprint: 'agid-cmt-jp-marunouchi',
      confidence: 0.9,
    },
    scanCapabilities: {
      qr: true,
      nfc: true,
      agidSecure: true,
    },
    languageTabs: [
      { language: 'ja', label: 'Japanese', source: 'native' },
      { language: 'en', label: 'English Shipping', source: 'english-shipping' },
    ],
  });
}

test('Address Element readiness summarizes professional roles without leaking raw values', () => {
  const readiness = assessAddressElementReadiness({
    session: baseReadySession(),
    hostSurface: 'ec',
    addressLinkStatus: 'ready',
    requestedCapabilities: ['delivery-eligibility', 'coarse-region'],
    grantedScopes: ['delivery:eligible', 'region:coarse'],
    hasHostEventCallbacks: true,
    hasAddressLink: true,
    hasQrNfcControls: true,
    hasHighRiskToggle: true,
    hasVisibleNextAction: true,
  });

  assert.equal(readiness.modelVersion, 'address-element-readiness-v1');
  assert.ok(['ready', 'usable'].includes(readiness.status));
  assert.deepEqual(
    readiness.roleSummaries.map(role => role.role).sort(),
    [...ADDRESS_ELEMENT_PROFESSIONAL_ROLES].sort(),
  );
  assert.equal(readiness.publicMetadata.privacyBoundary, 'address-element-no-raw-host-contract');
  assert.doesNotMatch(
    JSON.stringify(readiness.publicMetadata),
    /Private Receiver|\+81-3|Marunouchi|1-9-1|100-0005/,
  );
});

test('Address Element readiness flags missing host integration for embedded surfaces', () => {
  const readiness = assessAddressElementReadiness({
    session: baseReadySession(),
    hostSurface: 'cms',
    requestedCapabilities: ['delivery-eligibility'],
    grantedScopes: [],
    hasHostEventCallbacks: false,
    hasAddressLink: false,
    hasQrNfcControls: true,
    hasHighRiskToggle: true,
    hasVisibleNextAction: true,
  });

  assert.equal(readiness.status, 'needs_review');
  assert.ok(readiness.checks.some(check => check.id === 'host-event-contract' && check.status === 'warning'));
  assert.ok(readiness.checks.some(check => check.id === 'address-link-scopes' && check.status === 'fail'));
  assert.ok(readiness.nextActions.some(action => /Address Link consent|onPublicEvent/i.test(action)));
});

test('Address Element readiness blocks high-risk public AGID states', () => {
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
  const readiness = assessAddressElementReadiness({
    session,
    hostSurface: 'pos',
    addressLinkStatus: 'requires-proof',
    requestedCapabilities: ['recipient-confirmation'],
    grantedScopes: [],
    hasHostEventCallbacks: true,
    hasAddressLink: true,
    hasQrNfcControls: true,
    hasHighRiskToggle: true,
    hasVisibleNextAction: true,
  });

  assert.equal(readiness.status, 'blocked');
  assert.ok(readiness.checks.some(check => check.id === 'high-risk-controls' && check.status === 'fail'));
  assert.ok(readiness.nextActions.some(action => /AGID-S|recipient proof/i.test(action)));
  assert.doesNotMatch(JSON.stringify(readiness.publicMetadata), /JP05AV8TJGH8/);
});

test('Address Element readiness passes high-risk controls when AGID-S QR or NFC intake is enabled', () => {
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
    highRiskMode: true,
    scanCapabilities: {
      qr: true,
      nfc: true,
      agidSecure: true,
    },
  });
  const readiness = assessAddressElementReadiness({
    session,
    hostSurface: 'pos',
    addressLinkStatus: 'requires-proof',
    requestedCapabilities: ['recipient-confirmation'],
    grantedScopes: [],
    hasHostEventCallbacks: true,
    hasAddressLink: true,
    hasQrNfcControls: true,
    hasHighRiskToggle: true,
    hasVisibleNextAction: true,
  });

  assert.ok(readiness.checks.some(check => check.id === 'high-risk-controls' && check.status === 'pass'));
  assert.equal(readiness.publicMetadata.scanSecurityDecision, 'ok');
});
