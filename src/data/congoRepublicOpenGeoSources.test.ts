import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AFRICA_OPEN_GEO_SOURCES, getAfricaOpenSourceIds } from './africaOpenGeoSources';
import { classifyPostalSourceTrust, getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

test('CG sources separate no-postcode authority from non-postal OSS context', () => {
  const ids = getAfricaOpenSourceIds('CG');
  for (const id of [
    'upu-congo-republic-no-postcode-2026',
    'upu-congo-republic-addressing-2004',
    'sopeco-congo-location',
    'osm-congo-republic',
  ]) {
    assert.ok(ids.includes(id as never));
    assert.ok(AFRICA_OPEN_GEO_SOURCES[id as keyof typeof AFRICA_OPEN_GEO_SOURCES]);
  }
  assert.equal(AFRICA_OPEN_GEO_SOURCES['osm-congo-republic'].usage, 'validation');
});

test('official CG catalog is metadata-only and cannot validate postal areas', () => {
  const sources = getOfficialPostalSourcesForCountry('CG');
  const upu = sources.find(source => source.id === 'upu-congo-republic-no-postcode-2026');
  assert.equal(upu?.availability, 'no-normal-postcode');
  assert.equal(upu?.validationReadiness, 'metadata-only');
  const classified = classifyPostalSourceTrust({ countryCode: 'CG', sourceIds: ['upu-congo-republic-no-postcode-2026'] });
  assert.equal(classified.strength, 'weak');
  assert.match(classified.reason, /context-only reference|metadata only/i);
});
