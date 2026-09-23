import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { AMERICAS_OPEN_GEO_SOURCES, getAmericasOpenSourceIds } from './americasOpenGeoSources';
import { classifyPostalSourceTrust, getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';
const EXPECTED = ['correos-mexico', 'sepomex-postal-polygons-2025', 'mexico-postal-service-law', 'upu-mexico-addressing-2017', 'inegi-mexico-geo-key-service', 'inegi-mexico-geostatistical-framework-2025', 'inegi-mexico-address-standard-2024', 'inegi-mexico-denue-2025', 'osm-mexico'] as const;
const CATALOG = EXPECTED.slice(0, -1);

test('Mexican registry separates SEPOMEX catalog and polygons, UPU, INEGI, DENUE, law, and community evidence', () => {
  const ids = getAmericasOpenSourceIds('MX'); for (const id of EXPECTED) { assert.ok(ids.includes(id), id); assert.equal(AMERICAS_OPEN_GEO_SOURCES[id].id, id); assert.equal(AMERICAS_OPEN_GEO_SOURCES[id].url.startsWith('http'), true); }
  const catalog = AMERICAS_OPEN_GEO_SOURCES['correos-mexico'].notes; assert.match(catalog, /Official five-digit/i); assert.match(catalog, /not itself polygon geometry/i);
  const polygons = AMERICAS_OPEN_GEO_SOURCES['sepomex-postal-polygons-2025']; assert.match(polygons.license ?? '', /Creative Commons Attribution 4.0/i); assert.match(polygons.notes, /32.*state.*SHP/i); assert.match(polygons.notes, /official-source.*Polygon.*MultiPolygon/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['upu-mexico-addressing-2017'].notes, /five digits.*before locality/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['inegi-mexico-geo-key-service'].notes, /federative.*municipality.*locality.*not SEPOMEX/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['inegi-mexico-geostatistical-framework-2025'].notes, /AGEB.*block.*not.*postal/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['inegi-mexico-address-standard-2024'].notes, /structured.*property.*building.*not.*address register/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['inegi-mexico-denue-2025'].notes, /business.*approximate.*rural.*centroid.*not postal/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['osm-mexico'].license ?? '', /ODbL/i);
});

test('Mexican catalog treats SEPOMEX catalog and polygons as authoritative while keeping context metadata-only', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('MX').map(source => [source.id, source])); for (const id of CATALOG) assert.ok(sources.has(id), id);
  assert.equal(sources.get('correos-mexico')?.trustTier, 'authoritative'); assert.equal(sources.get('correos-mexico')?.sourceRole, 'postal-reference-data'); assert.equal(sources.get('correos-mexico')?.validationReadiness, 'reference-eligible');
  assert.equal(sources.get('sepomex-postal-polygons-2025')?.availability, 'bulk-open-data'); assert.equal(sources.get('sepomex-postal-polygons-2025')?.sourceRole, 'postal-reference-data');
  assert.equal(sources.get('mexico-postal-service-law')?.sourceRole, 'legal-framework-only'); assert.equal(sources.get('inegi-mexico-denue-2025')?.sourceRole, 'context-only');
  const classification = classifyPostalSourceTrust({ countryCode: 'MX', sourceIds: ['sepomex-postal-polygons-2025'], source: 'SEPOMEX postal polygons 2025' }); assert.equal(classification.strength, 'strong'); assert.equal(classification.tier, 'authoritative');
});

test('Mexican address metadata encodes five digits, official polygon gates, specialist fields, buildings, and AGID', () => {
  const here = dirname(fileURLToPath(import.meta.url)); const value = JSON.parse(readFileSync(resolve(here, 'address_formats/americas/north_america/MX.json'), 'utf8')) as any;
  assert.equal(value.postalCode.format, 'NNNNN'); assert.equal(new RegExp(value.postalCode.regex).test('99999'), true); assert.equal(new RegExp(value.postalCode.regex).test('99-999'), false); assert.equal(new RegExp(value.postalCode.regex).test('MX-99999'), false);
  assert.match(value.postalCode.source, /SEPOMEX.*2025.*CC BY 4.0.*UPU.*INEGI.*DENUE/i);
  const usage = value.addressRules.postalCode.usage; assert.match(usage, /32 resource.*CRS.*SHA-256/i); assert.match(usage, /official-source Polygon or MultiPolygon/i); assert.match(usage, /derived-review/i); assert.match(usage, /Building display requires/i); assert.match(usage, /AGID remains an independent/i);
  for (const key of ['recipient', 'attention', 'organization', 'street', 'houseNumber', 'interiorNumber', 'buildingOrPremises', 'floor', 'localOrUnit', 'settlementType', 'settlementName', 'betweenStreets', 'reference', 'municipalityOrTerritorialDemarcation', 'locality', 'state', 'poBox', 'postcode']) assert.ok(value.native.fields.some((item: any) => item.key === key), key);
  assert.ok(value.native.fields.every((item: any) => item.placeholder === '')); for (const id of EXPECTED) assert.ok(value.openSourceIds.includes(id), id);
});
