import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { AMERICAS_OPEN_GEO_SOURCES, getAmericasOpenSourceIds } from './americasOpenGeoSources';
import { classifyPostalSourceTrust, getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';
const EXPECTED = ['mtc-peru-postcode-lookup', 'mtc-peru-postcode-open-data-2018', 'mtc-peru-cpn-legal-2011', 'mtc-peru-cpn-structure-2017', 'upu-peru-designated-operator', 'inei-peru-ubigeo-2022', 'ign-peru-open-boundaries-settlements', 'geo-vivienda-pe', 'cofopri-peru-geo-llaqta', 'osm-peru'] as const;
const CATALOG = EXPECTED.slice(0, -1);
test('Peruvian registry separates MTC lookup and release, postal structure, administration, cadastre, and community evidence', () => {
  const ids = getAmericasOpenSourceIds('PE'); for (const id of EXPECTED) { assert.ok(ids.includes(id), id); assert.equal(AMERICAS_OPEN_GEO_SOURCES[id].id, id); assert.equal(AMERICAS_OPEN_GEO_SOURCES[id].url.startsWith('http'), true); }
  const lookup = AMERICAS_OPEN_GEO_SOURCES['mtc-peru-postcode-lookup'].notes; assert.match(lookup, /Official five-digit/i); assert.match(lookup, /boundaries are referential/i); assert.match(lookup, /not bulk data.*official polygon/i);
  const release = AMERICAS_OPEN_GEO_SOURCES['mtc-peru-postcode-open-data-2018']; assert.match(release.license ?? '', /Open Data Commons Attribution/i); assert.match(release.notes, /23 March 2018/); assert.match(release.notes, /not a polygon release/i);
  const structure = AMERICAS_OPEN_GEO_SOURCES['mtc-peru-cpn-structure-2017'].notes; assert.match(structure, /2,670 codes/); assert.match(structure, /road-network routing zone/); assert.match(structure, /postal district.*locality.*populated centre/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['inei-peru-ubigeo-2022'].notes, /department.*province.*district.*not an MTC assignment/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['ign-peru-open-boundaries-settlements'].notes, /referential.*not MTC assignments/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['cofopri-peru-geo-llaqta'].notes, /street.*lot.*block.*construction.*not postal assignment/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['osm-peru'].license ?? '', /ODbL/i);
});
test('Peruvian catalog treats MTC assignment evidence as authoritative while keeping context metadata-only', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('PE').map(source => [source.id, source])); for (const id of CATALOG) assert.ok(sources.has(id), id);
  assert.equal(sources.get('mtc-peru-postcode-lookup')?.trustTier, 'authoritative'); assert.equal(sources.get('mtc-peru-postcode-lookup')?.sourceRole, 'postal-reference-data'); assert.equal(sources.get('mtc-peru-postcode-lookup')?.validationReadiness, 'reference-eligible');
  assert.equal(sources.get('mtc-peru-postcode-open-data-2018')?.availability, 'bulk-open-data'); assert.equal(sources.get('mtc-peru-postcode-open-data-2018')?.sourceRole, 'postal-reference-data');
  assert.equal(sources.get('mtc-peru-cpn-legal-2011')?.sourceRole, 'legal-framework-only'); assert.equal(sources.get('mtc-peru-cpn-structure-2017')?.validationReadiness, 'metadata-only'); assert.equal(sources.get('cofopri-peru-geo-llaqta')?.sourceRole, 'context-only');
  const classification = classifyPostalSourceTrust({ countryCode: 'PE', sourceIds: ['mtc-peru-postcode-open-data-2018'], source: 'MTC Codigo Postal Peru 2018' }); assert.equal(classification.strength, 'strong'); assert.equal(classification.tier, 'authoritative');
});
test('Peruvian address metadata encodes five digits, routing/locality semantics, specialist fields, buildings, and AGID', () => {
  const here = dirname(fileURLToPath(import.meta.url)); const value = JSON.parse(readFileSync(resolve(here, 'address_formats/americas/south_america/PE.json'), 'utf8')) as any;
  assert.equal(value.postalCode.format, 'NNNNN'); assert.equal(new RegExp(value.postalCode.regex).test('99999'), true); assert.equal(new RegExp(value.postalCode.regex).test('99-999'), false); assert.equal(new RegExp(value.postalCode.regex).test('PE-99999'), false);
  assert.match(value.postalCode.source, /MTC.*2018.*007-2011-MTC.*2017.*UPU.*INEI.*IGN.*GeoVivienda.*COFOPRI/i);
  const usage = value.addressRules.postalCode.usage; assert.match(usage, /first two digits.*third.*final two/i); assert.match(usage, /routing-locality-first|routing zone/i); assert.match(usage, /not official MTC postcode geometry/i); assert.match(usage, /Building display requires/i); assert.match(usage, /AGID remains an independent/i);
  for (const key of ['recipient', 'attention', 'organization', 'street', 'houseNumber', 'block', 'lot', 'premisesOrBuilding', 'floor', 'unitOrInterior', 'urbanizationOrSettlement', 'referenceOrPointOfInterest', 'localityOrPopulatedPlace', 'district', 'province', 'departmentOrConstitutionalProvince', 'poBox', 'postcode']) assert.ok(value.native.fields.some((item: any) => item.key === key), key);
  assert.ok(value.native.fields.every((item: any) => item.placeholder === '')); for (const id of EXPECTED) assert.ok(value.openSourceIds.includes(id), id);
});
