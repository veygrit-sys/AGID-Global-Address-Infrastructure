import assert from 'node:assert/strict';
import test from 'node:test';
import { encodeAGID16 } from './agid';
import { resolveAgidLocal } from './agidLocalResolver';
import { assessAgidGeography } from './geographicAssessment';

test('an island shared by countries produces a different territorial code for each interior pin', () => {
  for (const [name, lat, lon, code] of [
    ['Port-au-Prince, Hispaniola', 18.539, -72.33, 'HT'],
    ['Santo Domingo, Hispaniola', 18.47, -69.92, 'DO'],
    ['Dili, Timor', -8.565, 125.58, 'TL'],
    ['Kupang, Timor', -10.175, 123.62, 'ID'],
    ['Dublin, Ireland', 53.35, -6.26, 'IE'],
    ['Belfast, Ireland', 54.596, -5.93, 'GB'],
  ] as const) {
    const assessment = assessAgidGeography({ kind: 'pin', lat, lon });
    assert.equal(assessment.island?.status, 'mapped', name);
    assert.deepEqual(assessment.regionCandidates, [code], name);
    assert.deepEqual(assessment.island.countryCodes, [code], name);
    assert.equal(assessment.deliveryRegion, null, name);
    assert.equal(encodeAGID16(lat, lon).regionCode, code, name);
  }
});

test('preserves overseas territory and sovereign codes, and an explicitly chosen postal destination', async () => {
  for (const [lat, lon, territory, sovereign] of [[-21.11, 55.53, 'RE', 'FR'], [-9.1821835, -171.837823, 'TK', 'NZ']] as const) {
    const assessment = assessAgidGeography({ kind: 'pin', lat, lon });
    assert.deepEqual(assessment.island?.countryCodes, [territory]);
    assert.deepEqual(assessment.island.sovereignCodes, [sovereign]);
    assert.equal(assessment.deliveryRegion, null);
    let requestedCountry = '';
    await resolveAgidLocal({
      coordinates: { lat, lon }, countryCode: territory,
      addressFormatResolver: async code => { requestedCountry = code; return null; },
    });
    assert.equal(requestedCountry, territory);
  }
});

test('a known minor island without political evidence remains land and has no automatic country', () => {
  const result = assessAgidGeography({kind: 'pin', lat: -56.509698, lon: -68.712745});
  assert.equal(result.surface, 'land');
  assert.equal(result.status, 'needs-confirmation');
  assert.equal(result.island?.status, 'unresolved');
  assert.deepEqual(result.regionCandidates, []);
  assert.equal(result.deliveryRegion, null);
  const nearbyWater = assessAgidGeography({kind:'pin', lat: -9.1821835, lon: -171.82});
  assert.equal(nearbyWater.island, undefined);
  assert.deepEqual(nearbyWater.regionCandidates, []);
});
