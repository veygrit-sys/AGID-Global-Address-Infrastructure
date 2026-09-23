import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildAddressElementSession } from './addressElement';
import {
  buildAddressElementPublicEvent,
  buildAddressElementPublicEvents,
  summarizeAddressElementSessionForEvent,
} from './addressElementEvents';

function readySession() {
  return buildAddressElementSession({
    purpose: 'delivery',
    mode: 'server',
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
    languageTabs: [
      { language: 'ja', label: 'Japanese', source: 'native' },
      { language: 'en', label: 'English Shipping', source: 'english-shipping' },
    ],
  });
}

test('Address Element public events expose status and safe summaries only', () => {
  const session = readySession();
  const events = buildAddressElementPublicEvents({
    surface: 'ec',
    session,
    timestamp: '2026-06-18T00:00:00.000Z',
  });

  assert.ok(events.some(event => event.type === 'session_changed'));
  assert.ok(events.some(event => event.type === 'intent_preview'));
  assert.ok(events.some(event => event.type === 'ready'));
  assert.equal(events[0].privacyBoundary, 'address-element-event-no-raw-address');
  assert.equal(events[0].surface, 'ec');
  assert.doesNotMatch(
    JSON.stringify(events),
    /Private Receiver|\+81-3|Marunouchi|1-9-1|100-0005/,
  );
});

test('Address Element public event metadata rejects private key names', () => {
  const session = readySession();
  assert.throws(
    () => buildAddressElementPublicEvent({
      type: 'session_changed',
      session,
      metadata: {
        rawAddress: 'Tokyo Chiyoda Marunouchi',
      },
    }),
    /address-element-event-private-metadata/,
  );
});

test('Address Element event session summary is compact and no-raw', () => {
  const summary = summarizeAddressElementSessionForEvent(readySession());
  assert.equal(typeof summary.fieldStateSummary, 'object');
  assert.equal(typeof summary.evidenceSummary, 'object');
  assert.equal(typeof summary.languageSummary, 'object');
  assert.doesNotMatch(JSON.stringify(summary), /Private Receiver|\+81-3|Marunouchi|1-9-1/);
});
