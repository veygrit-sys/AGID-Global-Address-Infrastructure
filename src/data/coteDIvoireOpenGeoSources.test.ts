import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AFRICA_OPEN_GEO_SOURCES, getAfricaOpenSourceIds } from './africaOpenGeoSources';
import { classifyPostalSourceTrust, getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

test('CI sources separate no-postcode authority from office/BP and OSS context', () => {
  const ids = getAfricaOpenSourceIds('CI');
  for (const id of [
    'upu-cote-divoire-no-postcode-2026',
    'upu-cote-divoire-addressing-2004',
    'artci-cote-divoire-postal-sector-2024',
    'osm-cote-divoire',
  ]) {
    assert.ok(ids.includes(id as never));
    assert.ok(AFRICA_OPEN_GEO_SOURCES[id as keyof typeof AFRICA_OPEN_GEO_SOURCES]);
  }
  assert.equal(AFRICA_OPEN_GEO_SOURCES['osm-cote-divoire'].usage, 'validation');
  assert.equal(AFRICA_OPEN_GEO_SOURCES['la-poste-cote-divoire'].kind, 'address');
});

test('official CI catalog is metadata-only and cannot validate postal areas', () => {
  const sources = getOfficialPostalSourcesForCountry('CI');
  const upu = sources.find(source => source.id === 'upu-cote-divoire-no-postcode-2026');
  assert.equal(upu?.availability, 'no-normal-postcode');
  assert.equal(upu?.validationReadiness, 'metadata-only');
  const classified = classifyPostalSourceTrust({ countryCode: 'CI', sourceIds: ['upu-cote-divoire-no-postcode-2026'] });
  assert.equal(classified.strength, 'weak');
  assert.match(classified.reason, /context-only reference|metadata only/i);
});
