import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
buildAddressPid,
clusterAddressCandidates,
resolveAddressMorphism,
structuralDissimilarity,
structuralDistance,
} from './addressMorphism';

const tokyoStationNative = {
  id: 'native',
  label: '東京都千代田区丸の内1丁目9-1',
  canonical: {
    country_code: 'jp',
    country: 'Japan',
    state: 'Tokyo',
    city: 'Chiyoda',
    subdistrict: 'Marunouchi',
    road: 'Marunouchi',
    house_number: '1-9-1',
    postcode: '1000005',
  },
  lat: 35.681236,
  lon: 139.767125,
  sources: ['jp-open-data', 'nominatim'],
  confidence: 0.92,
};

const tokyoStationEnglish = {
  id: 'english',
  label: '1-9-1 Marunouchi, Chiyoda City, Tokyo 100-0005, Japan',
  canonical: {
    country_code: 'jp',
    country: 'Japan',
    state: 'Tokyo',
    city: 'Chiyoda',
    subdistrict: 'Marunouchi',
    road: 'Marunouchi',
    house_number: '1-9-1',
    postcode: '1000005',
  },
  lat: 35.68124,
  lon: 139.76713,
  sources: ['parser', 'libpostal'],
  confidence: 0.86,
};

test('structural distance treats multilingual variants of the same address as close', () => {
  const distance = structuralDistance(tokyoStationNative, tokyoStationEnglish);
  assert.ok(distance < 0.15);
});

test('structural dissimilarity symmetrizes directional distance for bounded clustering', () => {
  const kiyamachi = {
    id: 'z-kiyamachi',
    label: 'Kyoto Kiyamachi 1',
    canonical: {
      country_code: 'jp',
      state: 'Kyoto',
      city: 'Kyoto',
      road: 'Kiyamachi',
      house_number: '1',
    },
    lat: 35.01,
    lon: 135.77,
    sources: ['parser'],
    confidence: 0.7,
  };
  const karasuma = {
    id: 'a-karasuma',
    label: 'Kyoto Karasuma 99',
    canonical: {
      country_code: 'jp',
      state: 'Kyoto',
      city: 'Kyoto',
      road: 'Karasuma',
      house_number: '99',
    },
    lat: 35.011,
    lon: 135.76,
    sources: ['parser'],
    confidence: 0.7,
  };

  const forward = structuralDistance(kiyamachi, karasuma);
  const reverse = structuralDistance(karasuma, kiyamachi);

  assert.ok(forward > 0.34);
  assert.ok(reverse <= 0.34);
  assert.equal(structuralDissimilarity(kiyamachi, karasuma), forward);
  assert.equal(structuralDissimilarity(kiyamachi, karasuma), structuralDissimilarity(karasuma, kiyamachi));
  assert.equal(clusterAddressCandidates([kiyamachi, karasuma], 0.34).length, 2);
});

test('clusters candidates that refer to the same address entity', () => {
  const clusters = clusterAddressCandidates([
    tokyoStationNative,
    tokyoStationEnglish,
    {
      id: 'osaka',
      label: 'Osaka Station',
      canonical: { country_code: 'jp', state: 'Osaka', city: 'Osaka' },
      lat: 34.7025,
      lon: 135.4959,
      sources: ['nominatim'],
      confidence: 0.7,
    },
  ]);

  assert.equal(clusters.length, 2);
  assert.equal(clusters[0].candidates.length, 2);
});

test('cluster canonical fields are chosen by evidence consensus rather than longest label', () => {
  const clusters = clusterAddressCandidates([
    {
      id: 'official-main',
      label: '10 Main Street, Metro',
      canonical: {
        country_code: 'us',
        state: 'Test',
        city: 'Metro',
        road: 'Main Street',
        house_number: '10',
        postcode: '10000',
      },
      sources: ['official-regional-api'],
      confidence: 0.95,
    },
    {
      id: 'openaddresses-main',
      label: '10 Main St, Metro',
      canonical: {
        country_code: 'us',
        state: 'Test',
        city: 'Metro',
        road: 'Main Street',
        house_number: '10',
        postcode: '10000',
      },
      sources: ['openaddresses'],
      confidence: 0.9,
    },
    {
      id: 'weak-long-road',
      label: '10 Main Street Administrative Service Road, Metro',
      canonical: {
        country_code: 'us',
        state: 'Test',
        city: 'Metro',
        road: 'Main Street Administrative Service Road',
        house_number: '10',
        postcode: '10000',
      },
      sources: ['parser'],
      confidence: 0.2,
    },
  ]);

  assert.equal(clusters.length, 1);
  assert.equal(clusters[0].canonical.road, 'Main Street');
  assert.ok(clusters[0].support.consensus > 0.7);
});

test('clusters stay bounded instead of chaining distant candidates transitively', () => {
  const chainA = {
    id: 'chain-a',
    label: '1 Main Street, Metro',
    canonical: {
      country_code: 'us',
      state: 'Test',
      city: 'Metro',
      road: 'Main Street',
      house_number: '1',
      postcode: '10000',
    },
    lat: 0,
    lon: 0,
    sources: ['nominatim'],
    confidence: 0.8,
  };
  const chainB = {
    id: 'chain-b',
    label: '2 Main Street, Metro',
    canonical: {
      country_code: 'us',
      state: 'Test',
      city: 'Metro',
      road: 'Main Street',
      house_number: '2',
      postcode: '10000',
    },
    lat: 0.009,
    lon: 0,
    sources: ['nominatim'],
    confidence: 0.8,
  };
  const chainC = {
    id: 'chain-c',
    label: '2 Market Street, Metro',
    canonical: {
      country_code: 'us',
      state: 'Test',
      city: 'Metro',
      road: 'Market Street',
      house_number: '2',
      postcode: '10000',
    },
    lat: 0.018,
    lon: 0,
    sources: ['nominatim'],
    confidence: 0.8,
  };

  assert.ok(structuralDistance(chainA, chainB) <= 0.34);
  assert.ok(structuralDistance(chainB, chainC) <= 0.34);
  assert.ok(structuralDistance(chainA, chainC) > 0.34);

  const clusters = clusterAddressCandidates([chainA, chainB, chainC], 0.34);

  assert.equal(clusters.length, 2);
  assert.equal(clusters.every(cluster => cluster.candidates.length < 3), true);
});

test('builds AMT PID from SHA-256 upper 128 bits', () => {
  const pid = buildAddressPid({
    country_code: 'jp',
    state: 'Tokyo',
    city: 'Chiyoda',
    subdistrict: 'Marunouchi',
    road: 'Marunouchi',
    house_number: '1-9-1',
    postcode: '1000005',
  });

  assert.match(pid, /^AMT-[0-9A-F]{32}$/);
  assert.equal(pid, buildAddressPid({
    country_code: 'jp',
    state: 'Tokyo',
    city: 'Chiyoda',
    subdistrict: 'Marunouchi',
    road: 'Marunouchi',
    house_number: '1-9-1',
    postcode: '1000005',
  }));
});

test('resolves a clear candidate to a stable PID and verified status', () => {
  const result = resolveAddressMorphism({
    input: 'Tokyo Station Marunouchi 1-9-1',
    context: { lat: 35.6812, lon: 139.7671, countryCode: 'jp', postcode: '1000005' },
    candidates: [tokyoStationNative, tokyoStationEnglish],
  });

  assert.equal(result.status, 'verified');
  assert.equal(result.selected?.canonical.country_code, 'jp');
  assert.ok(result.pid?.startsWith('AMT-'));
  assert.equal(result.pid, buildAddressPid(result.selected!.canonical));
  assert.ok(result.confidence > 0.95);
  assert.ok(result.entropy >= 0);
  assert.ok(Number.isFinite(result.energySummary.best));
  assert.ok(result.energySummary.best <= result.energySummary.average);
});

test('history events can move selection away from a repeatedly failing candidate', () => {
  const result = resolveAddressMorphism({
    input: 'Main Street Springfield',
    context: { countryCode: 'us' },
    candidates: [
      {
        id: 'springfield-il',
        label: 'Main Street, Springfield, Illinois, United States',
        canonical: { country_code: 'us', state: 'Illinois', city: 'Springfield', road: 'Main Street' },
        sources: ['nominatim'],
        confidence: 0.72,
        historyEvents: [
          { kind: 'delivery_failure', weight: 8 },
          { kind: 'manual_rejection', weight: 4 },
        ],
      },
      {
        id: 'springfield-ma',
        label: 'Main Street, Springfield, Massachusetts, United States',
        canonical: { country_code: 'us', state: 'Massachusetts', city: 'Springfield', road: 'Main Street' },
        sources: ['nominatim'],
        confidence: 0.7,
        historyEvents: [
          { kind: 'delivery_success', weight: 8 },
          { kind: 'manual_confirmation', weight: 4 },
        ],
      },
    ],
  });

  assert.equal(result.selected?.candidates[0].id, 'springfield-ma');
  assert.ok(result.clusters[0].support.history > result.clusters[1].support.history);
  assert.ok(result.decision.margin !== null && result.decision.margin > 0);
});

test('marks near-tied unrelated candidates as ambiguous instead of forcing a decision', () => {
  const result = resolveAddressMorphism({
    input: 'Springfield Main Street',
    context: { countryCode: 'us' },
    candidates: [
      {
        id: 'springfield-il',
        label: 'Main Street, Springfield, Illinois, United States',
        canonical: { country_code: 'us', state: 'Illinois', city: 'Springfield', road: 'Main Street' },
        sources: ['nominatim'],
        confidence: 0.7,
      },
      {
        id: 'springfield-ma',
        label: 'Main Street, Springfield, Massachusetts, United States',
        canonical: { country_code: 'us', state: 'Massachusetts', city: 'Springfield', road: 'Main Street' },
        sources: ['nominatim'],
        confidence: 0.7,
      },
    ],
  });

  assert.equal(result.status, 'ambiguous');
  assert.equal(result.pid, null);
  assert.ok(result.confidence < 0.6);
  assert.ok(result.entropy > 0.65);
});

test('returns unresolved when no candidate has enough evidence', () => {
  const result = resolveAddressMorphism({
    input: 'unknown address fragment',
    candidates: [{
      id: 'weak',
      label: 'unknown',
      canonical: {},
      sources: [],
      confidence: 0.1,
    }],
  });

  assert.equal(result.status, 'unresolved');
  assert.equal(result.pid, null);
});
