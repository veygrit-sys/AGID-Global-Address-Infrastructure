import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { AMERICAS_OPEN_GEO_SOURCES, getAmericasOpenSourceIds } from './americasOpenGeoSources';
import { classifyPostalSourceTrust, getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const EXPECTED = [
  'codigo-postal-ec',
  'codigo-postal-ec-technical-standard',
  'dinarp-ecuador-postal-interoperability',
  'inec-ecuador-census-cartography',
  'igm-ecuador-base-cartography',
  'sistema-nacional-catastro-ecuador',
  'osm-ecuador',
] as const;
const CATALOG = EXPECTED.filter(id => id !== 'osm-ecuador');

test('Ecuador registry separates postal lookup, legal semantics, interoperability, census, IGM, cadastre, and community evidence', () => {
  const ids = getAmericasOpenSourceIds('EC');
  for (const id of EXPECTED) {
    assert.ok(ids.includes(id));
    assert.equal(AMERICAS_OPEN_GEO_SOURCES[id].id, id);
    assert.equal(AMERICAS_OPEN_GEO_SOURCES[id].url.startsWith('http'), true);
  }
  assert.match(AMERICAS_OPEN_GEO_SOURCES['codigo-postal-ec'].notes, /six-digit.*address.*referential.*precision.*not.*bulk polygon/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['codigo-postal-ec-technical-standard'].notes, /province.*district.*postal zone.*not current.*polygons/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['dinarp-ecuador-postal-interoperability'].notes, /intersection.*parish.*latitude.*not.*authorization.*building/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['inec-ecuador-census-cartography'].notes, /entrances.*census-building.*without metric precision.*not postal.*footprints/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['igm-ecuador-base-cartography'].notes, /scale.*licence.*not postal assignment.*publication/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['sistema-nacional-catastro-ecuador'].notes, /municipal.*not an open parcel corpus.*privacy/i);
});

test('Ecuador catalog keeps official lookup above legal, census, base-cartography, and cadastral context', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('EC').map(source => [source.id, source]));
  for (const id of CATALOG) assert.ok(sources.has(id), id);
  assert.equal(sources.get('codigo-postal-ec')?.trustTier, 'authoritative');
  assert.equal(sources.get('codigo-postal-ec')?.availability, 'web-search');
  assert.equal(sources.get('codigo-postal-ec-technical-standard')?.sourceRole, 'legal-framework-only');
  assert.equal(sources.get('dinarp-ecuador-postal-interoperability')?.requiresCredential, true);
  assert.equal(sources.get('inec-ecuador-census-cartography')?.depth, 'building');
  assert.equal(sources.get('igm-ecuador-base-cartography')?.validationReadiness, 'metadata-only');
  assert.equal(sources.get('sistema-nacional-catastro-ecuador')?.sourceRole, 'legal-framework-only');
  const classification = classifyPostalSourceTrust({
    countryCode: 'EC',
    source: 'Sistema Código Postal Ecuador',
  });
  assert.equal(classification.strength, 'strong');
  assert.equal(classification.tier, 'authoritative');
});

test('Ecuador address metadata encodes six digits, lookup evidence, building links, time, rights, and AGID', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const value = JSON.parse(
    readFileSync(resolve(here, 'address_formats/americas/south_america/EC.json'), 'utf8'),
  ) as any;
  assert.equal(value.postalCode.format, 'NNNNNN');
  assert.equal(new RegExp(value.postalCode.regex).test('999999'), true);
  assert.equal(new RegExp(value.postalCode.regex).test('EC-999999'), false);
  assert.match(value.postalCode.source, /Código Postal Ecuador.*Norma Técnica.*DINARP.*INEC.*IGM.*Catastro.*OpenStreetMap/i);
  assert.match(value.addressRules.postalCode.usage, /six-digit.*time-bound assignment evidence.*not automatically.*postal polygon.*building relation.*AGID/i);
  for (const key of [
    'recipient', 'attention', 'organization', 'building', 'street', 'houseNumber', 'crossStreet',
    'block', 'lot', 'floor', 'unit', 'poBox', 'sector', 'neighborhood', 'city', 'parish',
    'canton', 'province', 'postcode',
  ]) assert.ok(value.native.fields.some((item: any) => item.key === key), key);
  assert.ok(value.native.fields.every((item: any) => item.placeholder === ''));
  for (const id of EXPECTED) assert.ok(value.openSourceIds.includes(id));
});
