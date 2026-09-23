import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  ADDRESS_FEEDBACK_MODEL_STORAGE_KEY,
  ADDRESS_FEEDBACK_RECORDS_STORAGE_KEY,
  appendAddressFeedbackRecord,
  createAddressFeedbackContext,
  createAddressFeedbackRecord,
  createInitialAddressFeedbackModel,
  recommendAddressFeedbackActions,
  stripPrivateAddressFeedbackFields,
  updateAddressFeedbackModel,
} from './addressFeedbackLearning';

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}

test('address display feedback trains a closed local contextual bandit model', () => {
  const record = createAddressFeedbackRecord({
    source: 'agid-panel',
    agid: 'JP01R1A0ZTR4',
    countryCode: 'JP',
    languageTab: 'ja',
    originalDisplay: 'Tokyo, Japan',
    correctedDisplay: '東京都千代田区',
    issue: 'wrong-language',
    severity: 2,
    context: createAddressFeedbackContext({
      details: { country_code: 'JP', postcode: '100-0001', road: '千代田通り' },
      qualityDecision: 'review',
      qualityScore: 0.42,
      sourceIds: ['osm', 'postal'],
    }),
    now: new Date('2026-06-16T00:00:00Z'),
  });

  const model = updateAddressFeedbackModel(createInitialAddressFeedbackModel(), record);

  assert.equal(record.privateMode, 'closed-local');
  assert.equal(record.agidTail, 'R1A0ZTR4');
  assert.equal(model.version, 'address-feedback-bandit-v1');
  assert.equal(model.samples, 1);
  assert.ok(model.weights['issue:wrong-language'] < 0);
  assert.ok(model.actionValues['queue-reverification'].count > 0);
});

test('address display feedback storage keeps records and model on the provided local store', () => {
  const storage = memoryStorage();
  const record = createAddressFeedbackRecord({
    source: 'pos-terminal',
    countryCode: 'KE',
    languageTab: 'en',
    originalDisplay: 'Unknown road',
    correctedDisplay: 'Moi Avenue, Nairobi, Kenya',
    issue: 'missing-field',
    severity: 3,
    context: createAddressFeedbackContext({
      details: { country_code: 'KE', city: 'Nairobi' },
    }),
  });

  const summary = appendAddressFeedbackRecord(record, storage);

  assert.equal(summary.privacy, 'closed-device-local');
  assert.ok(storage.getItem(ADDRESS_FEEDBACK_RECORDS_STORAGE_KEY)?.includes('address-display-feedback'));
  assert.ok(storage.getItem(ADDRESS_FEEDBACK_MODEL_STORAGE_KEY)?.includes('address-feedback-bandit-v1'));
  assert.ok(summary.topActions.some(item => item.action === 'queue-reverification'));
});

test('address feedback recommendations prefer map features for named natural or built places', () => {
  const record = createAddressFeedbackRecord({
    source: 'agid-panel',
    countryCode: 'IS',
    languageTab: 'is',
    originalDisplay: 'unnamed area',
    correctedDisplay: 'Thingvellir National Park, Iceland',
    issue: 'building-or-poi',
    severity: 2,
    context: createAddressFeedbackContext({
      details: { country_code: 'IS', name: 'Thingvellir National Park' },
    }),
  });

  const actions = recommendAddressFeedbackActions(record);

  assert.equal(actions[0].action, 'boost-map-feature');
  assert.ok(actions.some(item => item.action === 'require-manual-review'));
});

test('carrier refusal feedback records undeliverable regions without storing raw address data', () => {
  const record = createAddressFeedbackRecord({
    source: 'pos-terminal',
    countryCode: 'CA',
    languageTab: 'en',
    originalDisplay: 'redacted shipping area',
    issue: 'undeliverable-region',
    severity: 3,
    context: createAddressFeedbackContext({
      undeliverableRegion: true,
      carrierRejected: true,
      carrierId: 'carrier-demo',
      qualityDecision: 'blocked',
    }),
    now: new Date('2026-06-17T00:00:00Z'),
  });

  const actions = recommendAddressFeedbackActions(record);
  const model = updateAddressFeedbackModel(createInitialAddressFeedbackModel(), record);

  assert.equal(record.context.undeliverableRegion, true);
  assert.equal(record.context.carrierRejected, true);
  assert.equal(record.context.carrierId, 'CARRIER-DEMO');
  assert.equal(actions[0].action, 'record-carrier-rejection');
  assert.ok(actions.some(item => item.action === 'update-deliverability-policy'));
  assert.ok(model.weights['issue:undeliverable-region'] < 0);
  assert.ok(model.weights['deliverability:undeliverable-region'] < 0);
  assert.ok(model.fieldReliability.deliverability < 0.5);
});

test('PO Box and auto-lock feedback prefers carrier policy updates and manual review', () => {
  const poBox = createAddressFeedbackRecord({
    source: 'address-registration',
    countryCode: 'US',
    languageTab: 'en',
    originalDisplay: 'P.O. Box area',
    issue: 'po-box',
    severity: 2,
    context: createAddressFeedbackContext({
      poBox: true,
      carrierRejected: true,
    }),
  });
  const autoLock = createAddressFeedbackRecord({
    source: 'address-registration',
    countryCode: 'JP',
    languageTab: 'ja',
    originalDisplay: 'auto-lock building',
    issue: 'auto-lock',
    severity: 2,
    context: createAddressFeedbackContext({
      autoLock: true,
      carrierRejected: true,
    }),
  });

  const poBoxActions = recommendAddressFeedbackActions(poBox).map(item => item.action);
  const autoLockModel = updateAddressFeedbackModel(createInitialAddressFeedbackModel(), autoLock);

  assert.deepEqual(poBoxActions.slice(0, 3), [
    'record-carrier-rejection',
    'update-deliverability-policy',
    'require-manual-review',
  ]);
  assert.ok(autoLockModel.weights['access:auto-lock'] < 0);
  assert.ok(autoLockModel.fieldReliability.access < 0.5);
});

test('unreachable access feedback updates access and carrier policy signals', () => {
  const record = createAddressFeedbackRecord({
    source: 'pos-terminal',
    countryCode: 'NZ',
    languageTab: 'en',
    originalDisplay: 'remote access area',
    issue: 'unreachable',
    severity: 3,
    context: createAddressFeedbackContext({
      unreachableAccess: true,
      carrierRejected: true,
      carrierId: 'field-team-b',
    }),
  });

  const actions = recommendAddressFeedbackActions(record).map(item => item.action);
  const model = updateAddressFeedbackModel(createInitialAddressFeedbackModel(), record);

  assert.equal(record.context.unreachableAccess, true);
  assert.equal(record.context.carrierRejected, true);
  assert.equal(record.context.carrierId, 'FIELD-TEAM-B');
  assert.deepEqual(actions.slice(0, 3), [
    'record-carrier-rejection',
    'update-deliverability-policy',
    'require-manual-review',
  ]);
  assert.ok(model.weights['issue:unreachable'] < 0);
  assert.ok(model.weights['access:unreachable'] < 0);
  assert.ok(model.fieldReliability.access < 0.5);
});

test('address feedback strips private fields before any future manual export', () => {
  const sanitized = stripPrivateAddressFeedbackFields({
    recipient: 'Private Person',
    phone: '+81 90 0000 0000',
    country: 'JP',
    city: 'Tokyo',
  });

  assert.deepEqual(sanitized, { country: 'JP', city: 'Tokyo' });
});
