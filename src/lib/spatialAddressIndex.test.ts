import assert from 'node:assert/strict';
import { test } from 'node:test';

import { encodeAGID } from './agid';
import { createSpatialAddressIndex } from './spatialAddressIndex';

test('spatial address index finds multilingual address aliases and postcodes', () => {
  const index = createSpatialAddressIndex([
    {
      id: 'jp-tokyo-station',
      label: 'Tokyo Station',
      addressText: '1-9-1 Marunouchi, Chiyoda City, Tokyo 100-0005, Japan',
      aliases: ['東京都千代田区丸の内一丁目', '東京駅', 'Tokio Station'],
      canonical: {
        country_code: 'JP',
        state: 'Tokyo',
        city: 'Chiyoda',
        road: 'Marunouchi',
        house_number: '1-9-1',
        postcode: '100-0005',
      },
      lat: 35.681236,
      lon: 139.767125,
      source: 'fixture',
      confidence: 0.96,
    },
  ]);

  const japanese = index.search({ query: '東京駅', limit: 1 });
  assert.equal(japanese[0]?.record.id, 'jp-tokyo-station');
  assert.ok(japanese[0].reasons.some(reason => reason.startsWith('address-index:')));

  const postcode = index.search({ postcode: '1000005', countryCode: 'jp', limit: 1 });
  assert.equal(postcode[0]?.record.id, 'jp-tokyo-station');
  assert.ok(postcode[0].reasons.includes('address-index:postcode-filter'));
});

test('spatial address index returns nearby records before distant ones', () => {
  const index = createSpatialAddressIndex([
    {
      id: 'tokyo',
      label: 'Tokyo Station',
      lat: 35.681236,
      lon: 139.767125,
      countryCode: 'JP',
      confidence: 0.9,
    },
    {
      id: 'osaka',
      label: 'Osaka Station',
      lat: 34.702485,
      lon: 135.495951,
      countryCode: 'JP',
      confidence: 0.9,
    },
  ]);

  const results = index.search({ lat: 35.681236, lon: 139.767125, radiusKm: 5 });
  assert.equal(results[0]?.record.id, 'tokyo');
  assert.ok(!results.some(result => result.record.id === 'osaka'));
  assert.ok((results[0].distanceKm ?? 1) < 0.01);
});

test('spatial address index supports bbox records for islands and natural features', () => {
  const index = createSpatialAddressIndex([
    {
      id: 'feature-island',
      label: 'Example Island',
      aliases: ['Example Islet'],
      bounds: {
        minLat: -17.71,
        maxLat: -17.67,
        minLon: 177.11,
        maxLon: 177.16,
      },
      tags: ['island', 'natural-feature'],
      countryCode: 'FJ',
      confidence: 0.82,
    },
  ]);

  const results = index.search({
    bounds: {
      minLat: -17.70,
      maxLat: -17.69,
      minLon: 177.12,
      maxLon: 177.13,
    },
    query: 'island',
    countryCode: 'FJ',
  });

  assert.equal(results[0]?.record.id, 'feature-island');
  assert.ok(results[0].reasons.includes('spatial-index:bbox-overlap'));
});

test('spatial address index can derive geometry from AGID-only records', () => {
  const agid = encodeAGID(35.681236, 139.767125).id;
  const index = createSpatialAddressIndex([
    {
      id: 'agid-only',
      label: 'AGID cell around Tokyo Station',
      agid,
      countryCode: 'JP',
      confidence: 0.7,
    },
  ]);

  const aroundPoint = index.search({ lat: 35.681236, lon: 139.767125, radiusKm: 1, limit: 1 });
  assert.equal(aroundPoint[0]?.record.id, 'agid-only');
  assert.ok(aroundPoint[0].reasons.some(reason => reason.startsWith('spatial-index:')));

  const byAgid = index.search({ agid, limit: 1 });
  assert.equal(byAgid[0]?.record.id, 'agid-only');
  assert.ok(byAgid[0].reasons.includes('address-index:agid-match'));
});

test('spatial address index keeps public stats commitment oriented', () => {
  const index = createSpatialAddressIndex([
    {
      id: 'private-safe-record',
      label: 'Commitment only address reference',
      addressReferenceCommitment: '0xaddress',
      agidCommitment: '0xagid',
      aoidCommitment: '0xaoid',
      countryCode: 'US',
    },
  ]);

  const stats = index.stats();
  assert.equal(stats.version, 'spatial-address-index-v1');
  assert.equal(stats.records, 1);
  assert.equal(stats.privacy.rawAoidIndexed, false);
  assert.equal(stats.privacy.rawRecipientIndexed, false);
  assert.equal(stats.privacy.recommendedPublicMode, 'commitments-only');
});
