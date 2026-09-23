import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { AMERICAS_OPEN_GEO_SOURCES, getAmericasOpenSourceIds } from './americasOpenGeoSources';
import { classifyPostalSourceTrust, getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const EXPECTED = [
  'codigo-postal-colombia-472-viewer',
  'codigo-postal-colombia-csv',
  'codigo-postal-colombia-shapefile',
  'codigo-postal-colombia-open-license',
  'codigo-postal-colombia-arcgis',
  'upu-colombia-addressing-2022',
  'upu-colombia-s42-2021',
  'dane-colombia-divipola-mgn-2025',
  'igac-colombia-open-cadastre',
  'igac-colombia-sinic-open-constructions',
  'colombia-en-mapas',
  'osm-colombia',
] as const;
const CATALOG = [
  'codigo-postal-colombia-472',
  'codigo-postal-colombia-bulk',
  'codigo-postal-colombia-open-license',
  'codigo-postal-colombia-arcgis',
  'upu-colombia-addressing-2022',
  'upu-colombia-s42-2021',
  'dane-colombia-divipola-mgn-2025',
  'igac-colombia-open-cadastre',
  'igac-colombia-sinic-open-constructions',
] as const;

test('Colombia registry separates 4-72 release, licence, layers, UPU, DANE, IGAC, and community evidence', () => {
  const ids = getAmericasOpenSourceIds('CO');
  for (const id of EXPECTED) {
    assert.ok(ids.includes(id), id);
    assert.equal(AMERICAS_OPEN_GEO_SOURCES[id].id, id);
    assert.equal(AMERICAS_OPEN_GEO_SOURCES[id].url.startsWith('http'), true);
  }
  assert.match(AMERICAS_OPEN_GEO_SOURCES['codigo-postal-colombia-472-viewer'].notes, /six digits.*area.*normal and expanded.*not.*address.*building/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['codigo-postal-colombia-shapefile'].notes, /official direct polygon.*digest-pinned.*open clause.*all-rights-reserved/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['codigo-postal-colombia-open-license'].notes, /source attribution.*update metadata.*personal-data.*rights gate/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['codigo-postal-colombia-arcgis'].notes, /EPSG:4326.*normal.*expanded.*property.*Do not conflate/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['upu-colombia-addressing-2022'].notes, /six digits.*department.*postal-zone.*district.*not a reusable/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['upu-colombia-s42-2021'].notes, /organization.*placa.*building.*apartment.*not address existence/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['dane-colombia-divipola-mgn-2025'].notes, /department.*municipality.*statistical.*not 4-72/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['igac-colombia-open-cadastre'].notes, /monthly.*parcel.*construction.*nomenclature.*not postal geometry/i);
});

test('Colombia catalog makes exact 4-72 release artifacts reference-eligible and contextual layers metadata-only', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('CO').map(source => [source.id, source]));
  for (const id of CATALOG) assert.ok(sources.has(id), id);
  assert.equal(sources.get('codigo-postal-colombia-472')?.trustTier, 'authoritative');
  assert.equal(sources.get('codigo-postal-colombia-472')?.sourceRole, 'postal-reference-data');
  assert.equal(sources.get('codigo-postal-colombia-472')?.validationReadiness, 'reference-eligible');
  assert.equal(sources.get('codigo-postal-colombia-bulk')?.trustTier, 'authoritative');
  assert.equal(sources.get('codigo-postal-colombia-bulk')?.sourceRole, 'postal-reference-data');
  assert.equal(sources.get('codigo-postal-colombia-bulk')?.validationReadiness, 'reference-eligible');
  assert.equal(sources.get('codigo-postal-colombia-open-license')?.sourceRole, 'legal-framework-only');
  assert.equal(sources.get('codigo-postal-colombia-arcgis')?.sourceRole, 'context-only');
  assert.equal(sources.get('codigo-postal-colombia-arcgis')?.validationReadiness, 'metadata-only');
  assert.equal(sources.get('dane-colombia-divipola-mgn-2025')?.sourceRole, 'context-only');
  assert.equal(sources.get('igac-colombia-sinic-open-constructions')?.sourceRole, 'context-only');
  const classification = classifyPostalSourceTrust({
    countryCode: 'CO',
    sourceIds: ['codigo-postal-colombia-bulk'],
    source: '4-72 national postcode Shapefile',
  });
  assert.equal(classification.strength, 'strong');
  assert.equal(classification.tier, 'authoritative');
});

test('Colombia address metadata encodes six digits, S42 fields, official polygons, construction links, rights, time, and AGID', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const value = JSON.parse(
    readFileSync(resolve(here, 'address_formats/americas/south_america/CO.json'), 'utf8'),
  ) as any;
  assert.equal(value.postalCode.format, 'NNNNNN');
  assert.equal(new RegExp(value.postalCode.regex).test('110111'), true);
  assert.equal(new RegExp(value.postalCode.regex).test('99999'), false);
  assert.equal(new RegExp(value.postalCode.regex).test('CO-110111'), false);
  assert.match(value.postalCode.source, /4-72.*MINTIC.*UPU.*10\/2022.*S42.*DANE.*IGAC.*SINIC/i);
  assert.match(value.addressRules.postalCode.usage, /department.*postal zone.*district.*official release geometry.*all-rights-reserved.*DANE.*IGAC.*SINIC.*building display.*AGID/i);
  for (const key of [
    'recipient', 'attention', 'organization', 'street', 'primaryQuadrant', 'generatingRoad',
    'houseNumber', 'secondaryQuadrant', 'neighborhood', 'ruralLocality', 'premises',
    'floor', 'unit', 'poBox', 'municipality', 'department', 'postcode',
  ]) assert.ok(value.native.fields.some((item: any) => item.key === key), key);
  assert.ok(value.native.fields.every((item: any) => item.placeholder === ''));
  for (const id of EXPECTED) assert.ok(value.openSourceIds.includes(id), id);
});
