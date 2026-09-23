import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  ADDRESS_SEARCH_FEDERATION_VERSION,
  buildAddressSearchIndex,
  explainAddressSearchResult,
  searchAddressFederation,
} from './addressSearchFederation';

const index = buildAddressSearchIndex([
  {
    id: 'jp-tokyo-chiyoda-1000001',
    kind: 'address',
    sourceId: 'jp-post-local',
    sourcePriority: 0.95,
    countryCode: 'JP',
    languages: ['ja', 'en'],
    names: [
      { text: '東京都千代田区千代田', language: 'ja', preferred: true },
      { text: 'Chiyoda, Chiyoda-ku, Tokyo', language: 'en' },
    ],
    aliases: [
      { text: 'Tokyo Imperial Palace', language: 'en', source: 'exonym' },
      { text: '皇居', language: 'ja', source: 'local-name' },
    ],
    oldNames: [
      { text: 'Edo Castle', language: 'en', source: 'historical' },
      { text: '江戸城', language: 'ja', source: 'historical' },
    ],
    postalCodes: ['100-0001'],
    agids: ['AGID-JP-TOKYO-0001'],
    adminHierarchy: [
      { text: 'Japan', level: 'country', language: 'en' },
      { text: '東京都', level: 'prefecture', language: 'ja' },
      { text: '千代田区', level: 'ward', language: 'ja' },
    ],
  },
  {
    id: 'de-munich-altstadt',
    kind: 'admin-area',
    sourceId: 'open-address-reference',
    sourcePriority: 0.8,
    countryCode: 'DE',
    languages: ['de', 'en'],
    names: [
      { text: 'München', language: 'de', preferred: true },
      { text: 'Munich', language: 'en' },
    ],
    aliases: [
      { text: 'Muenchen', language: 'de', source: 'transliteration' },
    ],
    postalCodes: ['80331'],
    adminHierarchy: [
      { text: 'Bayern', level: 'state', language: 'de' },
      { text: 'Germany', level: 'country', language: 'en' },
    ],
  },
  {
    id: 'eg-nile-cairo',
    kind: 'natural-feature',
    sourceId: 'natural-feature-reference',
    sourcePriority: 0.7,
    countryCode: 'EG',
    languages: ['ar', 'en'],
    names: [
      { text: 'نهر النيل', language: 'ar', preferred: true },
      { text: 'Nile River', language: 'en' },
    ],
    naturalFeatures: [
      { text: 'Nile', language: 'en', featureType: 'river' },
      { text: 'النيل', language: 'ar', featureType: 'river' },
    ],
    adminHierarchy: [
      { text: 'Egypt', level: 'country', language: 'en' },
      { text: 'Cairo', level: 'city', language: 'en' },
    ],
  },
  {
    id: 'us-nyc',
    kind: 'admin-area',
    sourceId: 'open-address-reference',
    sourcePriority: 0.85,
    countryCode: 'US',
    languages: ['en'],
    names: [{ text: 'New York City', language: 'en', preferred: true }],
    aliases: [{ text: 'NYC', language: 'en', source: 'abbreviation' }],
    oldNames: [{ text: 'New Amsterdam', language: 'en', source: 'historical' }],
    postalCodes: ['10001'],
    adminHierarchy: [
      { text: 'United States', level: 'country', language: 'en' },
      { text: 'New York', level: 'state', language: 'en' },
    ],
  },
], [
  { type: 'regular', terms: ['big apple', 'new york city'] },
  { type: 'one-way', input: 'imperial residence', synonyms: ['tokyo imperial palace'] },
]);

test('builds a local search federation index with postal, AGID, alias, and natural feature indexes', () => {
  assert.equal(index.version, ADDRESS_SEARCH_FEDERATION_VERSION);
  assert.equal(index.stats.records, 4);
  assert.equal(index.stats.postalCodes, 3);
  assert.equal(index.stats.agids, 1);
  assert.ok(index.stats.tokens > 10);
  assert.ok(index.stats.synonyms >= 3);
});

test('returns postal-code matches with explainable reasons', () => {
  const results = searchAddressFederation(index, '100-0001', { language: 'ja', explain: true });

  assert.equal(results[0].record.id, 'jp-tokyo-chiyoda-1000001');
  assert.ok(results[0].reasons.some(reason => reason.code === 'postal-code-match'));
  assert.ok(results[0].reasons.some(reason => reason.code === 'language-preferred'));
  assert.ok(results[0].explanation.some(line => /Postal code matched/.test(line)));
});

test('matches AGID exactly and does not need raw coordinates', () => {
  const results = searchAddressFederation(index, 'AGID-JP-TOKYO-0001');

  assert.equal(results[0].record.id, 'jp-tokyo-chiyoda-1000001');
  assert.equal(results[0].reasons[0].code, 'agid-match');
  assert.equal(results[0].record.lat, undefined);
  assert.equal(results[0].record.lng, undefined);
});

test('explains old place-name and alias matches separately', () => {
  const oldNameResults = searchAddressFederation(index, 'Edo Castle');
  assert.equal(oldNameResults[0].record.id, 'jp-tokyo-chiyoda-1000001');
  assert.ok(oldNameResults[0].reasons.some(reason => reason.code === 'old-address-match'));

  const aliasResults = searchAddressFederation(index, '皇居', { language: 'ja' });
  assert.equal(aliasResults[0].record.id, 'jp-tokyo-chiyoda-1000001');
  assert.ok(aliasResults[0].reasons.some(reason => reason.code === 'alias-match'));
});

test('supports natural feature search for rivers, lakes, mountains, deserts, and similar named places', () => {
  const results = searchAddressFederation(index, 'Nile', { countryCode: 'EG' });

  assert.equal(results[0].record.id, 'eg-nile-cairo');
  assert.equal(results[0].record.kind, 'natural-feature');
  assert.ok(results[0].reasons.some(reason => reason.code === 'natural-feature-match'));
  assert.ok(results[0].matchedFields.includes('naturalFeatures'));
});

test('supports multilingual names, transliteration aliases, and typo-tolerant matching', () => {
  const transliteration = searchAddressFederation(index, 'Muenchen', { language: 'de' });
  assert.equal(transliteration[0].record.id, 'de-munich-altstadt');
  assert.ok(transliteration[0].reasons.some(reason => reason.code === 'alias-match'));

  const typo = searchAddressFederation(index, 'Munihc', { language: 'en' });
  assert.equal(typo[0].record.id, 'de-munich-altstadt');
  assert.ok(typo[0].reasons.some(reason => reason.code === 'typo-tolerant-match'));
});

test('supports synonym-style query expansion while keeping an explanation trail', () => {
  const results = searchAddressFederation(index, 'Big Apple', { language: 'en' });

  assert.equal(results[0].record.id, 'us-nyc');
  assert.ok(results[0].reasons.some(reason => reason.code === 'synonym-match'));

  const explanation = explainAddressSearchResult(results[0]);
  assert.equal(explanation.id, 'us-nyc');
  assert.ok(explanation.reasons.some(reason => reason.code === 'synonym-match'));
});

test('supports CJK token matching for Japanese address names', () => {
  const results = searchAddressFederation(index, '千代田区', { language: 'ja', countryCode: 'JP' });

  assert.equal(results[0].record.id, 'jp-tokyo-chiyoda-1000001');
  assert.ok(results[0].reasons.some(reason => reason.code === 'administrative-match'));
});
