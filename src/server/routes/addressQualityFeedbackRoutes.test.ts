import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import express from 'express';
import type { Server } from 'node:http';

import { registerAddressQualityFeedbackRoutes } from './addressQualityFeedbackRoutes';

let server: Server;
let baseUrl = '';

before(async () => {
  const app = express();
  app.use(express.json());
  registerAddressQualityFeedbackRoutes(app);
  await new Promise<void>(resolve => {
    server = app.listen(0, () => {
      const address = server.address();
      if (address && typeof address === 'object') baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise<void>(resolve => server.close(() => resolve()));
});

test('accepts redacted address quality feedback from field devices', async () => {
  const response = await fetch(`${baseUrl}/api/address-quality/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      version: 'address-quality-feedback-v1',
      id: 'aqf-test-001',
      submittedAt: '2026-06-25T00:00:00.000Z',
      recordId: 'adf-test-001',
      source: 'agid-panel',
      agidTail: 'AV8TJGH8',
      countryCode: 'JP',
      languageTab: 'en',
      issue: 'postal-code',
      severity: 2,
      context: {
        hasPostcode: true,
        hasStreet: true,
        hasBuilding: false,
        isSea: false,
        sourceIds: ['osm'],
        qualityScoreExcluded: true,
      },
      privacy: {
        privateMode: 'redacted-field-report',
        rawAddressIncluded: false,
        correctedAddressIncluded: false,
        recipientIncluded: false,
      },
    }),
  });
  const body = await response.json() as { ok: boolean; data: { rawAddressStorage: boolean; feedbackId: string } };

  assert.equal(response.status, 202);
  assert.equal(body.ok, true);
  assert.equal(body.data.rawAddressStorage, false);
  assert.match(body.data.feedbackId, /^srv_/);
});

test('rejects field feedback when raw address fields are included', async () => {
  const response = await fetch(`${baseUrl}/api/address-quality/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      version: 'address-quality-feedback-v1',
      originalDisplay: '1-9-1 Marunouchi, Tokyo',
      privacy: {
        privateMode: 'redacted-field-report',
        rawAddressIncluded: false,
        correctedAddressIncluded: false,
        recipientIncluded: false,
      },
    }),
  });
  const body = await response.json() as { ok: boolean; error: string };

  assert.equal(response.status, 400);
  assert.equal(body.ok, false);
  assert.match(body.error, /Raw address/);
});

test('rejects field feedback when private contact text is included', async () => {
  const response = await fetch(`${baseUrl}/api/address-quality/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      version: 'address-quality-feedback-v1',
      id: 'aqf-test-private',
      recordId: 'adf-test-private',
      source: 'agid-panel',
      issue: 'other',
      severity: 1,
      operatorNote: 'call +81-3-1234-5678',
      privacy: {
        privateMode: 'redacted-field-report',
        rawAddressIncluded: false,
        correctedAddressIncluded: false,
        recipientIncluded: false,
      },
    }),
  });
  const body = await response.json() as { ok: boolean; error: string };

  assert.equal(response.status, 400);
  assert.equal(body.ok, false);
  assert.match(body.error, /Private text/);
});
