import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AFRICA_OPEN_GEO_SOURCES, getAfricaOpenSourceIds } from './africaOpenGeoSources';
import { classifyPostalSourceTrust, getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

test('CM sources separate no-postcode authority, BP examples and OSS context', () => {
  const ids = getAfricaOpenSourceIds('CM');
  for (const id of [
    'upu-cameroon-no-postcode-2026',
    'upu-cameroon-addressing-2002',
    'minpostel-cameroon-postal-operators-2024',
    'minesup-cameroon-bp-address-example',
    'osm-cameroon',
  ]) {
    assert.ok(ids.includes(id as never));
    assert.ok(AFRICA_OPEN_GEO_SOURCES[id as keyof typeof AFRICA_OPEN_GEO_SOURCES]);
  }
  assert.equal(AFRICA_OPEN_GEO_SOURCES['osm-cameroon'].usage, 'validation');
  assert.equal(AFRICA_OPEN_GEO_SOURCES['minesup-cameroon-bp-address-example'].kind, 'address');
});

test('official CM catalog is metadata-only and cannot validate postal areas', () => {
  const sources = getOfficialPostalSourcesForCountry('CM');
  const upu = sources.find(source => source.id === 'upu-cameroon-no-postcode-2026');
  assert.equal(upu?.availability, 'no-normal-postcode');
  assert.equal(upu?.validationReadiness, 'metadata-only');
  const classified = classifyPostalSourceTrust({ countryCode: 'CM', sourceIds: ['upu-cameroon-no-postcode-2026'] });
  assert.equal(classified.strength, 'weak');
  assert.match(classified.reason, /context-only reference|metadata only/i);
});
