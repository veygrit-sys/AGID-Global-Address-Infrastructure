import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AFRICA_OPEN_GEO_SOURCES, getAfricaOpenSourceIds } from './africaOpenGeoSources';
import { classifyPostalSourceTrust, getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

test('CD sources distinguish official assignments, context, geometry candidates and ML candidates', () => {
  const ids = getAfricaOpenSourceIds('CD');
  for (const id of ['scpt-rdc-postcode-directory', 'upu-dr-congo-addressing-2022',
    'arptc-dr-congo-postal-market-2021-2022', 'osm-dr-congo', 'hf-libpostal-address-parser-candidate']) {
    assert.ok(ids.includes(id as never)); assert.ok(AFRICA_OPEN_GEO_SOURCES[id as keyof typeof AFRICA_OPEN_GEO_SOURCES]);
  }
  assert.equal(AFRICA_OPEN_GEO_SOURCES['osm-dr-congo'].usage, 'validation');
  assert.match(AFRICA_OPEN_GEO_SOURCES['hf-libpostal-address-parser-candidate'].license ?? '', /do not ingest/i);
});

test('official CD catalog remains metadata-only until assignment and geometry rights pass', () => {
  const sources = getOfficialPostalSourcesForCountry('CD');
  const scpt = sources.find(source => source.id === 'scpt-rdc-postcode-directory');
  assert.equal(scpt?.validationReadiness, 'metadata-only'); assert.equal(scpt?.depth, 'postcode');
  const classified = classifyPostalSourceTrust({ countryCode: 'CD', sourceIds: ['scpt-rdc-postcode-directory'] });
  assert.equal(classified.strength, 'weak'); assert.match(classified.reason, /metadata only/i);
});
