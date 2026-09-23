import assert from 'node:assert/strict';
import { test } from 'node:test';

import { AFRICA_OPEN_GEO_SOURCES, getAfricaOpenSourceIds } from './africaOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const EXPECTED = ['correios-cabo-verde', 'correios-cabo-verde-contact-identifiers', 'correios-cabo-verde-cip', 'upu-cabo-verde-addressing-2014', 'upu-cabo-verde-postcode-length-2026', 'ingt-cabo-verde-idecv', 'ingt-cabo-verde-admin-feature-service', 'ingt-cabo-verde-cadastre', 'osm-cabo-verde'] as const;
const OFFICIAL = EXPECTED.filter(id => id !== 'osm-cabo-verde');

test('Cabo Verde registry separates postcode, extended contact identifier, CIP, UPU, INGT, cadastre, and community data', () => {
  const ids = getAfricaOpenSourceIds('CV');
  for (const id of EXPECTED) {
    const source = AFRICA_OPEN_GEO_SOURCES[id];
    assert.ok(ids.includes(source.id));
    assert.match(source.url, /^https?:\/\//);
  }
  assert.equal(AFRICA_OPEN_GEO_SOURCES['correios-cabo-verde'].usage, 'primary');
  assert.match(AFRICA_OPEN_GEO_SOURCES['correios-cabo-verde'].notes, /four-digit.*locality or zone.*not.*bulk.*polygon/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['correios-cabo-verde-contact-identifiers'].notes, /NNNN-NNN.*does not document.*schema.*four-digit.*CIP.*geometry/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['correios-cabo-verde-cip'].notes, /person or company.*georeference.*separate.*public four-digit.*personal/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['upu-cabo-verde-postcode-length-2026'].notes, /August 2026.*four digits.*length context.*not assignments.*geometry/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['ingt-cabo-verde-admin-feature-service'].notes, /2010.*1:5000.*island.*municipality.*parish.*not postcode polygons/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['ingt-cabo-verde-cadastre'].notes, /physical.*economic.*legal property.*not.*crosswalk.*owners/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['osm-cabo-verde'].license ?? '', /ODbL.*separate/i);
});

test('Cabo Verde official catalog exposes matching authority, privacy, and reuse boundaries', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('CV').map(source => [source.id, source]));
  for (const id of OFFICIAL) assert.ok(sources.has(id));
  assert.equal(sources.get('correios-cabo-verde')?.trustTier, 'authoritative');
  assert.equal(sources.get('correios-cabo-verde-cip')?.requiresCredential, true);
  assert.equal(sources.get('upu-cabo-verde-postcode-length-2026')?.validationReadiness, 'metadata-only');
  assert.equal(sources.get('ingt-cabo-verde-admin-feature-service')?.depth, 'geo-only');
  assert.equal(sources.get('ingt-cabo-verde-cadastre')?.depth, 'building');
});
