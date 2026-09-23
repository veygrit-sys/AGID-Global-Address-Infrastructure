import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildAddressElementSession } from '../lib/addressElement';
import { assessAddressElementReadiness } from '../lib/addressElementReadiness';
import {
  AGID_ADDRESS_ELEMENT_TAG_NAME,
  buildAgidAddressElementWebComponentDetail,
  defineAgidAddressElement,
  listAgidAddressElementWebComponentContract,
} from './agid-address-element';

function privateSession() {
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
      street: 'Marunouchi',
      houseNumber: '1-9-1',
      recipient: 'Private Receiver',
      phone: '+81-3-0000-0000',
    },
    postalCandidates: [{
      source: 'japan-post',
      countryCode: 'JP',
      postalCode: '100-0005',
      state: 'Tokyo',
      city: 'Chiyoda',
      confidence: 0.95,
    }],
    agidCandidate: {
      present: true,
      exposure: 'commitment',
      safeFingerprint: 'agid-cmt-web-component-test',
      confidence: 0.9,
    },
    languageTabs: [
      { language: 'ja', label: 'Japanese', source: 'native' },
      { language: 'en', label: 'English Shipping', source: 'english-shipping' },
    ],
  });
}

test('Web Component contract declares tag, attributes, events, methods, and privacy boundary', () => {
  const contract = listAgidAddressElementWebComponentContract();

  assert.equal(contract.tagName, AGID_ADDRESS_ELEMENT_TAG_NAME);
  assert.ok(contract.attributes.includes('country-code'));
  assert.ok(contract.attributes.includes('default-language'));
  assert.ok(contract.attributes.includes('high-risk'));
  assert.ok(contract.events.includes('agid-address-element:session-change'));
  assert.ok(contract.events.includes('agid-address-element:submit'));
  assert.ok(contract.methods.includes('setFields(fields)'));
  assert.equal(contract.privacy.rawFieldValuesReturned, false);
  assert.equal(contract.privacy.publicEventsNoRawAddress, true);
});

test('Web Component public detail excludes raw address, recipient, phone, and street values', () => {
  const session = privateSession();
  const readiness = assessAddressElementReadiness({
    session,
    hostSurface: 'ec',
    addressLinkStatus: 'ready',
    requestedCapabilities: ['delivery-eligibility'],
    grantedScopes: ['delivery:eligible'],
    hasHostEventCallbacks: true,
    hasAddressLink: true,
    hasQrNfcControls: true,
    hasHighRiskToggle: true,
    hasVisibleNextAction: true,
  });
  const detail = buildAgidAddressElementWebComponentDetail({
    session,
    readiness,
    surface: 'ec',
    timestamp: '2026-06-20T00:00:00.000Z',
  });
  const serialized = JSON.stringify(detail);

  assert.equal(detail.privacyBoundary, 'web-component-no-raw-address');
  assert.equal(detail.tagName, 'agid-address-element');
  assert.ok(detail.publicEvents.length >= 2);
  assert.doesNotMatch(serialized, /Private Receiver|\+81-3|Marunouchi|1-9-1|100-0005/);
  assert.match(serialized, /address-element-event-no-raw-address/);
});

test('defineAgidAddressElement is safe to import in non-DOM test runtimes', () => {
  const result = defineAgidAddressElement(undefined);

  assert.equal(result.defined, false);
  assert.equal(result.tagName, 'agid-address-element');
  assert.equal(result.reason, 'dom-unavailable');
});
