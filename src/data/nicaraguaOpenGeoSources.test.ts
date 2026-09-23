import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { AMERICAS_OPEN_GEO_SOURCES, getAmericasOpenSourceIds } from './americasOpenGeoSources';
import { classifyPostalSourceTrust, getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const EXPECTED = [
  'correos-nicaragua-postcode-search',
  'upu-nicaragua-addressing-2014',
  'inide-nicaragua-territorial-2023',
  'ineter-ni-ide',
  'ineter-nicaragua-cartographic-base',
  'ineter-nicaragua-cadastral-ide',
  'osm-nicaragua',
] as const;
const CATALOG = [
  'correos-nicaragua-postcode-search',
  'upu-nicaragua-addressing-2014',
  'inide-nicaragua-territorial-2023',
  'ineter-ni-ide',
  'ineter-nicaragua-cartographic-base',
  'ineter-nicaragua-cadastral-ide',
] as const;

test('Nicaraguan registry separates Correos observations, addressing semantics, administration, cartography, restricted cadastre, and community evidence', () => {
  const ids = getAmericasOpenSourceIds('NI');
  for (const id of EXPECTED) {
    assert.ok(ids.includes(id), id);
    assert.equal(AMERICAS_OPEN_GEO_SOURCES[id].id, id);
    assert.equal(AMERICAS_OPEN_GEO_SOURCES[id].url.startsWith('http'), true);
  }
  assert.match(AMERICAS_OPEN_GEO_SOURCES['correos-nicaragua-postcode-search'].notes, /five-digit.*geopostal.*municipality.*barrio.*comarca.*Código Maestro.*time-bound.*not.*polygon/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['upu-nicaragua-addressing-2014'].notes, /five digits.*municipality.*traditional.*not current/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['inide-nicaragua-territorial-2023'].notes, /departments.*autonomous.*153 municipalities.*not Correos/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['ineter-ni-ide'].notes, /national.*departmental.*municipal.*WMS.*WFS.*not.*postal/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['ineter-nicaragua-cadastral-ide'].license ?? '', /non-commercial.*authorization/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['ineter-nicaragua-cadastral-ide'].notes, /cadastral.*not bulk-open.*not.*address-to-building/i);
});

test('Nicaraguan catalog treats Correos observations as authoritative but keeps contextual geometry metadata-only', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('NI').map(source => [source.id, source]));
  for (const id of CATALOG) assert.ok(sources.has(id), id);
  assert.equal(sources.get('correos-nicaragua-postcode-search')?.trustTier, 'authoritative');
  assert.equal(sources.get('correos-nicaragua-postcode-search')?.sourceRole, 'postal-reference-data');
  assert.equal(sources.get('correos-nicaragua-postcode-search')?.validationReadiness, 'reference-eligible');
  assert.equal(sources.get('upu-nicaragua-addressing-2014')?.sourceRole, 'context-only');
  assert.equal(sources.get('inide-nicaragua-territorial-2023')?.validationReadiness, 'metadata-only');
  assert.equal(sources.get('ineter-ni-ide')?.sourceRole, 'context-only');
  assert.equal(sources.get('ineter-nicaragua-cadastral-ide')?.availability, 'commercial-or-restricted');
  const classification = classifyPostalSourceTrust({
    countryCode: 'NI',
    sourceIds: ['correos-nicaragua-postcode-search'],
    source: 'Correos de Nicaragua postcode search',
  });
  assert.equal(classification.strength, 'strong');
  assert.equal(classification.tier, 'authoritative');
});

test('Nicaraguan address metadata encodes five digits, directional addressing, typed postal objects, building boundaries, and AGID', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const value = JSON.parse(
    readFileSync(resolve(here, 'address_formats/americas/central_america/NI.json'), 'utf8'),
  ) as any;
  assert.equal(value.postalCode.format, 'NNNNN');
  assert.equal(new RegExp(value.postalCode.regex).test('99999'), true);
  assert.equal(new RegExp(value.postalCode.regex).test('9999'), false);
  assert.equal(new RegExp(value.postalCode.regex).test('NI-99999'), false);
  assert.match(value.postalCode.source, /Correos de Nicaragua.*UPU.*05\/2014.*INIDE.*INETER.*BCN50.*IDEC/i);
  assert.match(value.addressRules.postalCode.usage, /area-or-non-area.*Código Maestro.*not automatically a polygon.*directional.*building display.*AGID/i);
  for (const key of [
    'recipient', 'attention', 'organization', 'directionalReference', 'street', 'houseNumber',
    'buildingOrResidentialName', 'floor', 'unit', 'barrioOrComarca', 'localityOrCommunity',
    'municipality', 'departmentOrAutonomousRegion', 'poBox', 'postOffice', 'postcode',
  ]) assert.ok(value.native.fields.some((item: any) => item.key === key), key);
  assert.ok(value.native.fields.every((item: any) => item.placeholder === ''));
  for (const id of EXPECTED) assert.ok(value.openSourceIds.includes(id), id);
});
