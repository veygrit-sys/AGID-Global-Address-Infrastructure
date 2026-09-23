import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  ADDRESS_QUALITY_FEEDBACK_OUTBOX_STORAGE_KEY,
  buildAddressQualityFeedbackSubmission,
  loadAddressQualityFeedbackOutbox,
  submitAddressQualityFeedback,
} from './addressQualityFeedbackSubmission';
import { createAddressFeedbackContext, createAddressFeedbackRecord } from '../addressFeedbackLearning';

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
}

function sampleRecord() {
  const record = createAddressFeedbackRecord({
    source: 'agid-panel',
    agid: 'JP05AV8TJGH8',
    countryCode: 'jp',
    languageTab: 'en',
    originalDisplay: '1-9-1 Marunouchi, Chiyoda-ku, Tokyo 100-0005, Japan',
    correctedDisplay: 'Tokyo Station, Marunouchi, Chiyoda-ku',
    issue: 'postal-code',
    severity: 3,
    userNote: 'Postal district wrong.',
    now: new Date('2026-06-25T00:00:00.000Z'),
    context: createAddressFeedbackContext({
      qualityDecision: 'partial',
      qualityScore: 0.42,
      sourceIds: ['osm', 'postal-api', 'osm'],
      carrierRejected: true,
      carrierId: 'dhl',
    }),
  });
  return {
    ...record,
    userNote: 'Postal district wrong. Contact field@example.com or +81-3-1234-5678',
  };
}

test('builds redacted field feedback without raw or corrected address payloads', () => {
  const submission = buildAddressQualityFeedbackSubmission(sampleRecord(), new Date('2026-06-25T01:00:00.000Z'));
  const json = JSON.stringify(submission);

  assert.equal(submission.version, 'address-quality-feedback-v1');
  assert.equal(submission.countryCode, 'JP');
  assert.equal(submission.privacy.rawAddressIncluded, false);
  assert.equal(submission.privacy.correctedAddressIncluded, false);
  assert.equal(submission.privacy.recipientIncluded, false);
  assert.equal(submission.context.qualityScoreExcluded, true);
  assert.deepEqual(submission.context.sourceIds, ['osm', 'postal-api']);
  assert.match(submission.operatorNote ?? '', /\[redacted-email\]/);
  assert.match(submission.operatorNote ?? '', /\[redacted-phone\]/);
  assert.doesNotMatch(json, /Marunouchi|Tokyo Station|100-0005|"qualityScore":/);
});

test('sends address quality feedback to the versioned endpoint when online', async () => {
  const sentBodies: unknown[] = [];
  const result = await submitAddressQualityFeedback(sampleRecord(), {
    now: new Date('2026-06-25T01:00:00.000Z'),
    fetchImpl: async (url, options) => {
      assert.equal(url, '/api/v1/address-quality/feedback');
      sentBodies.push(JSON.parse(String(options?.body)));
      return new Response(JSON.stringify({ data: { feedbackId: 'AQF-001' } }), { status: 200 });
    },
  });

  assert.equal(result.status, 'sent');
  assert.equal(result.responseId, 'AQF-001');
  assert.equal(sentBodies.length, 1);
  assert.doesNotMatch(JSON.stringify(sentBodies[0]), /originalDisplay|correctedDisplay|Marunouchi|Tokyo Station/);
});

test('queues redacted feedback locally when the field device is offline', async () => {
  const storage = memoryStorage();
  const result = await submitAddressQualityFeedback(sampleRecord(), {
    storage,
    fetchImpl: async () => {
      throw new Error('offline');
    },
  });

  assert.equal(result.status, 'queued');
  assert.equal(result.queuedReason, 'network-error');
  assert.match(storage.getItem(ADDRESS_QUALITY_FEEDBACK_OUTBOX_STORAGE_KEY) ?? '', /address-quality-feedback-v1/);
  assert.equal(loadAddressQualityFeedbackOutbox(storage).length, 1);
});
