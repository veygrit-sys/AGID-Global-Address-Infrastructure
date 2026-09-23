import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
buildNominatimSearchUrl,
matchesAdvancedSearchCategory,
matchesAdvancedSearchLocation,
normalizeAdvancedSearchOptions,
} from './advancedSearch';

test('normalizes advanced search country codes, radius, and limit', () => {
  assert.deepEqual(normalizeAdvancedSearchOptions({
    countryCodes: ' JP, us  USA ca jp ',
    radiusKm: 999,
    limit: 1,
    category: 'address',
    nearbyOnly: true,
  }), {
    countryCodes: 'jp,us,ca',
    category: 'address',
    nearbyOnly: true,
    radiusKm: 500,
    limit: 3,
  });
});

test('builds Nominatim search URL with detailed filters', () => {
  const url = buildNominatimSearchUrl('Tokyo Station', 35.681236, 139.767125, {
    countryCodes: 'JP',
    nearbyOnly: true,
    radiusKm: 10,
    limit: 25,
  });

  const parsed = new URL(url, 'http://localhost');
  assert.equal(parsed.pathname, '/api/v1/osm-search');
  assert.equal(parsed.searchParams.get('q'), 'Tokyo Station');
  assert.equal(parsed.searchParams.get('countrycodes'), 'jp');
  assert.equal(parsed.searchParams.get('bounded'), '1');
  assert.equal(parsed.searchParams.get('limit'), '10');
  assert.ok(parsed.searchParams.get('viewbox')?.includes('139.'));
});

test('adds search-only provider language hints when provided', () => {
  const url = buildNominatimSearchUrl('東京駅', undefined, undefined, {
    countryCodes: 'JP',
    limit: 5,
  }, 'ja,en,local');

  const parsed = new URL(url, 'http://localhost');
  assert.equal(parsed.searchParams.get('q'), '東京駅');
  assert.equal(parsed.searchParams.get('accept_language'), 'ja,en,local');
  assert.equal(parsed.searchParams.has('lang'), false);
});

test('matches advanced category filters across OSM-style result fields', () => {
  assert.equal(matchesAdvancedSearchCategory({ class: 'natural', type: 'peak', display_name: 'Mount Fuji' }, { category: 'nature' }), true);
  assert.equal(matchesAdvancedSearchCategory({ category: 'shop', type_name: 'supermarket' }, { category: 'business' }), true);
  assert.equal(matchesAdvancedSearchCategory({ category: 'shop' }, { category: 'transport' }), false);
});

test('filters nearby-only results by radius', () => {
  assert.equal(matchesAdvancedSearchLocation({ lat: 35.6812, lon: 139.7671 }, 35.681, 139.767, {
    nearbyOnly: true,
    radiusKm: 2,
  }), true);
  assert.equal(matchesAdvancedSearchLocation({ lat: 35.0, lon: 139.0 }, 35.681, 139.767, {
    nearbyOnly: true,
    radiusKm: 2,
  }), false);
});
