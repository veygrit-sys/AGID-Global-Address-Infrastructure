import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { AMERICAS_OPEN_GEO_SOURCES, getAmericasOpenSourceIds } from './americasOpenGeoSources';
import { classifyPostalSourceTrust, getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const EXPECTED = [
  'inposdom-postcode-search',
  'upu-dominican-republic-addressing-2005',
  'one-dominican-territorial-division-2021',
  'iderd-dominican-geoservices',
  'ign-dominican-cartographic-base',
  'registro-inmobiliario-dominican-cadastre',
  'osm-dominican-republic',
] as const;
const CATALOG = [
  'inposdom-postcode-search',
  'upu-dominican-republic-addressing-2005',
  'one-dominican-territorial-division-2021',
  'iderd-dominican-geoservices',
  'ign-dominican-cartographic-base',
  'registro-inmobiliario-dominican-cadastre',
] as const;

test('Dominican registry separates INPOSDOM observations, addressing semantics, administration, cartography, cadastre, and community evidence', () => {
  const ids = getAmericasOpenSourceIds('DO');
  for (const id of EXPECTED) {
    assert.ok(ids.includes(id), id);
    assert.equal(AMERICAS_OPEN_GEO_SOURCES[id].id, id);
    assert.equal(AMERICAS_OPEN_GEO_SOURCES[id].url.startsWith('http'), true);
  }
  assert.match(AMERICAS_OPEN_GEO_SOURCES['inposdom-postcode-search'].notes, /address.*sector.*five-digit.*static index.*polygon\.php.*2021.*coverage proof.*official\/derived\/virtual.*not an approved national artifact.*building/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['upu-dominican-republic-addressing-2005'].notes, /five digits.*locality.*district.*not current/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['one-dominican-territorial-division-2021'].notes, /provinces.*municipalities.*sections.*barrios.*not INPOSDOM/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['iderd-dominican-geoservices'].notes, /CSW.*WMS.*WFS.*not postal/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['registro-inmobiliario-dominican-cadastre'].notes, /parcel.*not bulk-open.*not.*address-to-building/i);
});

test('Dominican catalog treats INPOSDOM observations as authoritative but keeps contextual geometry metadata-only', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('DO').map(source => [source.id, source]));
  for (const id of CATALOG) assert.ok(sources.has(id), id);
  assert.equal(sources.get('inposdom-postcode-search')?.trustTier, 'authoritative');
  assert.equal(sources.get('inposdom-postcode-search')?.sourceRole, 'postal-reference-data');
  assert.equal(sources.get('inposdom-postcode-search')?.validationReadiness, 'reference-eligible');
  assert.match(sources.get('inposdom-postcode-search')?.notes.join(' ') ?? '', /static 2021 index.*Polygon.*coverage proof.*official\/derived\/virtual.*bulk redistribution\/public-serving rights/i);
  assert.equal(sources.get('upu-dominican-republic-addressing-2005')?.sourceRole, 'context-only');
  assert.equal(sources.get('one-dominican-territorial-division-2021')?.validationReadiness, 'metadata-only');
  assert.equal(sources.get('iderd-dominican-geoservices')?.sourceRole, 'context-only');
  assert.equal(sources.get('registro-inmobiliario-dominican-cadastre')?.availability, 'commercial-or-restricted');
  const classification = classifyPostalSourceTrust({
    countryCode: 'DO',
    sourceIds: ['inposdom-postcode-search'],
    source: 'INPOSDOM postcode search',
  });
  assert.equal(classification.strength, 'strong');
  assert.equal(classification.tier, 'authoritative');
});

test('Dominican address metadata encodes five digits, territorial hierarchy, building boundaries, and AGID', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const value = JSON.parse(
    readFileSync(resolve(here, 'address_formats/americas/caribbean/DO.json'), 'utf8'),
  ) as any;
  assert.equal(value.postalCode.format, 'NNNNN');
  assert.equal(new RegExp(value.postalCode.regex).test('99999'), true);
  assert.equal(new RegExp(value.postalCode.regex).test('9999'), false);
  assert.equal(new RegExp(value.postalCode.regex).test('DO-99999'), false);
  assert.match(value.postalCode.source, /INPOSDOM.*UPU.*03\/2005.*ONE.*IDE-RD.*IGN-JJHM.*Registro Inmobiliario/i);
  assert.match(value.addressRules.postalCode.usage, /postal-area-first.*not automatically a polygon.*RI parcels.*building display.*AGID/i);
  for (const key of [
    'recipient', 'attention', 'organization', 'street', 'houseNumber', 'buildingName',
    'floor', 'unit', 'sectorOrBarrio', 'sectionOrParaje', 'municipalDistrict',
    'municipality', 'provinceOrNationalDistrict', 'poBox', 'postOffice', 'postcode',
  ]) assert.ok(value.native.fields.some((item: any) => item.key === key), key);
  assert.ok(value.native.fields.every((item: any) => item.placeholder === ''));
  for (const id of EXPECTED) assert.ok(value.openSourceIds.includes(id), id);
});
