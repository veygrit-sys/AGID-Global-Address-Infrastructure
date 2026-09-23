import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AFRICA_OPEN_GEO_SOURCES, getAfricaOpenSourceIds } from './africaOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const OFFICIAL = ['somalia-moct-posta', 'somalia-moct-postal-revival-2025', 'somalia-national-postal-policy-2026', 'somalia-moct-digital-addressing', 'somalia-sobs-address-observation', 'somalia-sobs-cbca-jurisdiction', 'somalia-snbs-gis', 'somalia-nira-principles', 'somalia-nca-privacy'] as const;

test('Somalia registry separates postal operation, observed syntax, policy, addressing, jurisdiction, GIS, identity, privacy and ODbL', () => {
  const ids = new Set(getAfricaOpenSourceIds('SO'));
  for (const id of [...OFFICIAL, 'osm-somalia'] as const) assert.ok(ids.has(id));
  assert.match(AFRICA_OPEN_GEO_SOURCES['somalia-moct-postal-revival-2025'].notes, /resumed in May 2025.*not.*postcode assignment.*polygon/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['somalia-national-postal-policy-2026'].notes, /January 2026.*does not prove.*assignment.*geometry/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['somalia-sobs-address-observation'].notes, /BN03010.*AA plus five-digit.*not nationwide.*geometry/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['somalia-snbs-gis'].notes, /enumeration areas.*not postal polygons.*address-building/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['somalia-nira-principles'].notes, /11-digit.*not a postcode or address.*in-country/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['osm-somalia'].license ?? '', /ODbL.*separate/i);
});

test('Somalia official catalog exposes matching validation and control boundaries', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('SO').map(source => [source.id, source]));
  for (const id of OFFICIAL) assert.ok(sources.has(id));
  assert.equal(sources.get('somalia-moct-postal-revival-2025')?.validationReadiness, 'metadata-only');
  assert.equal(sources.get('somalia-national-postal-policy-2026')?.sourceRole, 'legal-framework-only');
  assert.equal(sources.get('somalia-sobs-address-observation')?.validationReadiness, 'reference-eligible');
  assert.equal(sources.get('somalia-snbs-gis')?.requiresCredential, true);
  assert.equal(sources.get('somalia-nira-principles')?.sourceRole, 'legal-framework-only');
  assert.equal(sources.get('somalia-nca-privacy')?.sourceRole, 'legal-framework-only');
});
