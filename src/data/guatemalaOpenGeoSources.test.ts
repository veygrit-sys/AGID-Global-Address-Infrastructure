import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { AMERICAS_OPEN_GEO_SOURCES, getAmericasOpenSourceIds } from './americasOpenGeoSources';
import { classifyPostalSourceTrust, getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const EXPECTED = [
  'correos-guatemala-postal',
  'correos-guatemala-postcode-directory',
  'upu-guatemala-addressing-2025',
  'correos-guatemala-postal-legal-framework',
  'segeplan-gt-ide',
  'ine-guatemala-census-settlements',
  'ign-guatemala-cartography',
  'ric-guatemala-cadastre',
  'osm-guatemala',
] as const;
const CATALOG = EXPECTED.filter(id => id !== 'osm-guatemala');

test('Guatemala registry separates operator, directory, UPU, law, spatial, census, cartographic, cadastral, and community evidence', () => {
  const ids = getAmericasOpenSourceIds('GT');
  for (const id of EXPECTED) {
    assert.ok(ids.includes(id), id);
    assert.equal(AMERICAS_OPEN_GEO_SOURCES[id].id, id);
    assert.equal(AMERICAS_OPEN_GEO_SOURCES[id].url.startsWith('http'), true);
  }
  assert.match(AMERICAS_OPEN_GEO_SOURCES['correos-guatemala-postal'].notes, /government postal operator.*not a reusable.*address corpus.*geometry.*building/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['correos-guatemala-postcode-directory'].notes, /department PDFs.*five-digit.*municipalities.*zones.*localities.*not postal polygons/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['upu-guatemala-addressing-2025'].notes, /November 2025.*five digits.*distribution-route.*delivery-office.*does not provide.*geometry/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['segeplan-gt-ide'].notes, /downloads.*OGC.*producer.*CRS.*not a Correos assignment/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['ine-guatemala-census-settlements'].notes, /CC BY.*self-identified.*not automatically official municipal names.*postal/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['ric-guatemala-cadastre'].notes, /registered or tariffed.*parcel.*not postal assignment.*exact address-to-building/i);
});

test('Guatemala catalog makes the official directory reference-eligible without treating context as assignment or geometry', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('GT').map(source => [source.id, source]));
  for (const id of CATALOG) assert.ok(sources.has(id), id);
  assert.equal(sources.get('correos-guatemala-postal')?.trustTier, 'authoritative');
  assert.equal(sources.get('correos-guatemala-postcode-directory')?.sourceRole, 'postal-reference-data');
  assert.equal(sources.get('correos-guatemala-postcode-directory')?.validationReadiness, 'reference-eligible');
  assert.equal(sources.get('upu-guatemala-addressing-2025')?.sourceRole, 'context-only');
  assert.equal(sources.get('segeplan-gt-ide')?.validationReadiness, 'metadata-only');
  assert.equal(sources.get('ine-guatemala-census-settlements')?.availability, 'bulk-open-data');
  assert.equal(sources.get('ric-guatemala-cadastre')?.availability, 'commercial-or-restricted');
  assert.equal(sources.get('ric-guatemala-cadastre')?.requiresCredential, true);
  const classification = classifyPostalSourceTrust({
    countryCode: 'GT',
    source: 'Dirección General de Correos y Telégrafos de Guatemala',
  });
  assert.equal(classification.strength, 'strong');
  assert.equal(classification.tier, 'authoritative');
});

test('Guatemala address metadata encodes five digits, official layout, explicit building links, rights, time, and AGID', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const value = JSON.parse(
    readFileSync(resolve(here, 'address_formats/americas/central_america/GT.json'), 'utf8'),
  ) as any;
  assert.equal(value.postalCode.format, 'NNNNN');
  assert.equal(new RegExp(value.postalCode.regex).test('01001'), true);
  assert.equal(new RegExp(value.postalCode.regex).test('GT-01001'), false);
  assert.match(value.postalCode.source, /Correos.*department.*UPU.*11\/2025/i);
  assert.match(value.addressRules.postalCode.usage, /five-digit.*UPU.*not automatically.*full-code polygon.*building relation.*AGID/i);
  for (const key of [
    'recipient', 'attention', 'organization', 'street', 'houseNumber', 'neighborhood', 'premises',
    'tower', 'apartment', 'kilometer', 'finca', 'lot', 'poBox', 'locality', 'municipality',
    'department', 'postcode',
  ]) assert.ok(value.native.fields.some((item: any) => item.key === key), key);
  assert.ok(value.native.fields.every((item: any) => item.placeholder === ''));
  for (const id of EXPECTED) assert.ok(value.openSourceIds.includes(id), id);
});
