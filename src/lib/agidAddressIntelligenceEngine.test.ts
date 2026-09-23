import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { AddressFormat } from '../data/address_formats';
import {
  evaluateAgidAddressIntelligence,
  rankAgidAddressCandidates,
} from './agidAddressIntelligenceEngine';
import { createInitialAddressFeedbackModel } from './addressFeedbackLearning';

const japanFormat = {
  countryCode: 'JP',
  name: 'Japan',
  native: {
    addressFormat: '{{postcode}}\n{{state}}{{city}}{{street}}{{houseNumber}}\n{{organization}}',
    ordering: 'big-to-small',
    fields: [
      { key: 'countryCode', label: 'Country code', required: true },
      { key: 'postcode', label: 'Postal code', required: true },
      { key: 'state', label: 'Prefecture', required: true },
      { key: 'city', label: 'City', required: true },
    ],
  },
  english: {
    addressFormat: '{{organization}}\n{{houseNumber}} {{street}}, {{city}}, {{state}} {{postcode}}\n{{country}}',
    ordering: 'small-to-big',
    fields: [
      { key: 'organization', label: 'Organization' },
      { key: 'houseNumber', label: 'House number' },
      { key: 'street', label: 'Street' },
      { key: 'city', label: 'City' },
      { key: 'state', label: 'State' },
      { key: 'postcode', label: 'Postal code' },
      { key: 'country', label: 'Country' },
    ],
  },
  postalCode: {
    regex: '^\\d{3}-?\\d{4}$',
    source: 'japan-post',
    api: null,
    format: 'NNN-NNNN',
  },
  openSourceIds: ['japan-post', 'osm-nominatim'],
} satisfies AddressFormat;

test('evaluates a complete urban AGID address as acceptable and deliverable', () => {
  const result = evaluateAgidAddressIntelligence({
    agid: 'JP01R1A0ZTR4',
    countryCode: 'JP',
    format: japanFormat,
    selectedLanguageTab: 'ja',
    languageTabs: ['ja', 'en'],
    addressText: '100-0001 Tokyo Chiyoda Chiyoda 1-1 Imperial Palace',
    apiAddress: {
      country_code: 'jp',
      country: 'Japan',
      state: 'Tokyo',
      city: 'Chiyoda',
      road: 'Chiyoda',
      house_number: '1-1',
      postcode: '100-0001',
      building: 'Imperial Palace',
    },
    displayTextByTab: {
      ja: '〒100-0001 東京都千代田区千代田1-1 皇居',
      en: 'Imperial Palace\n1-1 Chiyoda, Chiyoda, Tokyo 100-0001\nJapan',
    },
    sources: ['japan-post', 'osm-nominatim'],
    feedbackModel: createInitialAddressFeedbackModel(new Date('2026-01-01T00:00:00Z')),
  });

  assert.equal(result.engineVersion, 'agid-address-intelligence-engine-v1');
  assert.equal(result.model.kind, 'local-contextual-bandit-and-rule-ensemble');
  assert.equal(result.decision, 'accept');
  assert.equal(result.delivery.decision, 'deliverable');
  assert.ok(result.confidence >= 0.75);
  assert.equal(result.canonicalAddress.postcode, '100-0001');
  assert.ok(!result.actions.includes('manual-review'));
});

test('ranks complete official-source candidates above sparse community candidates', () => {
  const ranks = rankAgidAddressCandidates([
    {
      id: 'sparse',
      displayText: 'Tokyo, Japan',
      apiAddress: { country_code: 'jp', city: 'Tokyo' },
      sources: ['community-map'],
    },
    {
      id: 'complete',
      displayText: '100-0001 Tokyo Chiyoda Chiyoda 1-1 Imperial Palace',
      apiAddress: {
        country_code: 'jp',
        state: 'Tokyo',
        city: 'Chiyoda',
        road: 'Chiyoda',
        house_number: '1-1',
        postcode: '100-0001',
        building: 'Imperial Palace',
      },
      sources: ['japan-post', 'official'],
    },
  ], {
    format: japanFormat,
    feedbackModel: createInitialAddressFeedbackModel(new Date('2026-01-01T00:00:00Z')),
  });

  assert.equal(ranks[0].candidate.id, 'complete');
  assert.equal(ranks[0].rank, 1);
  assert.ok(ranks[0].score > ranks[1].score);
});

test('flags marine or water AGID displays without a delivery anchor for review', () => {
  const result = evaluateAgidAddressIntelligence({
    agid: 'ZZ01WATER001',
    countryCode: 'ZZ',
    selectedLanguageTab: 'en',
    languageTabs: ['en'],
    addressText: 'Open sea near unnamed route',
    apiAddress: {
      country_code: 'zz',
      water: 'open sea',
    },
    displayTextByTab: {
      en: 'Open sea near unnamed route',
    },
    isSea: true,
    sources: ['osm-nominatim'],
    feedbackModel: createInitialAddressFeedbackModel(new Date('2026-01-01T00:00:00Z')),
  });

  assert.notEqual(result.delivery.decision, 'deliverable');
  assert.ok(result.actions.includes('manual-review'));
  assert.ok(result.learning.recommendedFeedbackActions.some(item => item.action === 'boost-map-feature'));
});

test('recommends a stronger language tab when the selected tab has weak display quality', () => {
  const result = evaluateAgidAddressIntelligence({
    countryCode: 'JP',
    format: japanFormat,
    selectedLanguageTab: 'ja',
    languageTabs: ['ja', 'en'],
    addressText: '100-0001 Tokyo Chiyoda Chiyoda 1-1 Imperial Palace',
    apiAddress: {
      country_code: 'jp',
      country: 'Japan',
      state: 'Tokyo',
      city: 'Chiyoda',
      road: 'Chiyoda',
      house_number: '1-1',
      postcode: '100-0001',
      building: 'Imperial Palace',
    },
    displayTextByTab: {
      ja: 'Resolving address...',
      en: 'Imperial Palace\n1-1 Chiyoda, Chiyoda, Tokyo 100-0001\nJapan',
    },
    sources: ['japan-post', 'osm-nominatim'],
    feedbackModel: createInitialAddressFeedbackModel(new Date('2026-01-01T00:00:00Z')),
  });

  assert.equal(result.recommendedTab, 'en');
  assert.equal(result.rendering.shouldSwitchTab, true);
  assert.equal(result.rendering.languageSwitchChangesDisplay, true);
  assert.ok(result.actions.includes('switch-language-tab'));
});
