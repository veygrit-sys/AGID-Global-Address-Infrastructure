import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AFRICA_OPEN_GEO_SOURCES, getAfricaOpenSourceIds } from './africaOpenGeoSources';
import { classifyPostalSourceTrust, getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

test('CF sources separate no-postcode authority from non-postal OSS context', () => {
  const ids = getAfricaOpenSourceIds('CF');
  for (const id of [
    'upu-central-african-republic-no-postcode-2026',
    'upu-central-african-republic-addressing-2022',
    'arcep-central-african-republic-postal',
    'osm-central-african-republic',
  ]) {
    assert.ok(ids.includes(id as never));
    assert.ok(AFRICA_OPEN_GEO_SOURCES[id as keyof typeof AFRICA_OPEN_GEO_SOURCES]);
  }
  assert.equal(AFRICA_OPEN_GEO_SOURCES['osm-central-african-republic'].usage, 'validation');
});

test('official CF catalog is metadata-only and cannot validate postal areas', () => {
  const sources = getOfficialPostalSourcesForCountry('CF');
  const upu = sources.find(source => source.id === 'upu-central-african-republic-no-postcode-2026');
  assert.equal(upu?.availability, 'no-normal-postcode');
  assert.equal(upu?.validationReadiness, 'metadata-only');
  const classified = classifyPostalSourceTrust({
    countryCode: 'CF', sourceIds: ['upu-central-african-republic-no-postcode-2026'],
  });
  assert.equal(classified.strength, 'weak');
  assert.match(classified.reason, /context-only reference|metadata only/i);
});
