import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  getAddressPlatformBlueprint,
  getAddressPlatformBlueprints,
  getExternalInspirations,
  summarizeAddressPlatformBlueprints,
  validateAddressPlatformBlueprints,
} from './addressPlatformBlueprint';

test('address platform blueprint records the adopted external inspirations', () => {
  const sourceIds = getExternalInspirations().map(source => source.id);

  assert.deepEqual(sourceIds, [
    'google-maps-platform',
    'here-technologies',
    'tomtom',
    'mapbox',
    'overture-maps',
    'okta',
    'persona',
    'world-id',
    'vercel',
    'cloudflare',
    'clearbit',
    'opencorporates',
  ]);
});

test('address platform blueprint covers the adopted AGID/AOID feature names', () => {
  const ids = getAddressPlatformBlueprints().map(blueprint => blueprint.id);

  assert.deepEqual(ids, [
    'agid-place-record',
    'address-validation-pipeline',
    'address-identity',
    'address-enrichment',
    'address-developer-platform',
    'address-review-console',
    'address-search-federation',
    'edge-address-resolver',
    'zk-credential-uniqueness',
  ]);
});

test('address platform blueprint keeps optional services out of the core dependency path', () => {
  const summary = summarizeAddressPlatformBlueprints();

  assert.equal(summary.totalBlueprints, 9);
  assert.equal(summary.externalInspirations, 12);
  assert.deepEqual(summary.ossDataSources, ['overture-maps']);
  assert.ok(summary.optionalAdapters.includes('here-technologies'));
  assert.ok(summary.optionalAdapters.includes('tomtom'));
  assert.ok(summary.optionalAdapters.includes('mapbox'));
  assert.ok(summary.optionalAdapters.includes('opencorporates'));
  assert.equal(summary.privacyCriticalBlueprints.length, summary.totalBlueprints);
});

test('address validation pipeline explicitly combines geocoding and postal evidence', () => {
  const pipeline = getAddressPlatformBlueprint('address-validation-pipeline');

  assert.equal(pipeline.status, 'partial');
  assert.ok(pipeline.inspiredBy.includes('google-maps-platform'));
  assert.ok(pipeline.inspiredBy.includes('mapbox'));
  assert.match(pipeline.absorbedAs.join('\n'), /confidence|evidence/i);
  assert.match(pipeline.privacySafeguards.join('\n'), /AOID|AGID-S|redaction/i);
  assert.match(pipeline.antiPatterns.join('\n'), /proprietary|低品質/i);
});

test('address identity does not turn AGID into a person-identity system', () => {
  const identity = getAddressPlatformBlueprint('address-identity');
  const zkUniqueness = getAddressPlatformBlueprint('zk-credential-uniqueness');

  assert.match(identity.privacySafeguards.join('\n'), /用途別credential|domain separation|nullifier/i);
  assert.match(identity.antiPatterns.join('\n'), /生体情報|固定公開ID/i);
  assert.match(zkUniqueness.purpose, /本人そのものを登録せず/);
  assert.match(zkUniqueness.antiPatterns.join('\n'), /真実性|nullifier/i);
});

test('address platform blueprint validation rejects broken catalogs', () => {
  const validation = validateAddressPlatformBlueprints();

  assert.equal(validation.valid, true);
  assert.deepEqual(validation.errors, []);
  assert.ok(validation.warnings.some(warning => warning.includes('optional-paid-or-registered-adapter:mapbox')));
});
