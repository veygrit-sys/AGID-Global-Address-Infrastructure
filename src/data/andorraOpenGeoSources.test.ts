import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { EUROPE_OPEN_GEO_SOURCES, getEuropeOpenSourceIds } from './europeOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

test('Andorra registry separates postal, address, topographic-building, and boundary evidence', () => {
  const ids = getEuropeOpenSourceIds('AD');
  const postal = EUROPE_OPEN_GEO_SOURCES['correos-andorra-postcodes'];
  const address = EUROPE_OPEN_GEO_SOURCES['andorra-urban-address-guide'];
  const building = EUROPE_OPEN_GEO_SOURCES['andorra-topographic-buildings'];
  const cartography = EUROPE_OPEN_GEO_SOURCES['andorra-cartografia'];

  for (const id of [postal.id, address.id, building.id, cartography.id]) {
    assert.ok(ids.includes(id));
  }
  assert.equal(postal.kind, 'postal-code');
  assert.match(postal.notes, /licensed.*Andorra.*polygon.*scope/i);
  assert.equal(address.kind, 'address');
  assert.match(address.notes, /interactive.*not.*bulk/i);
  assert.equal(building.kind, 'building');
  assert.match(building.notes, /topographic.*authoritative identifier.*proximity/i);
  assert.equal(cartography.kind, 'admin-boundary');
  assert.match(cartography.notes, /layer-by-layer.*conditions|conditions.*layer-by-layer/i);
});

test('Andorra official catalog exposes distinct national source authorities', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('AD').map(source => [source.id, source]));

  assert.equal(sources.get('correos-andorra-postcodes')?.authority, 'postal-operator');
  assert.equal(sources.get('correos-andorra-postcodes')?.depth, 'postcode');
  assert.equal(sources.get('andorra-urban-address-guide')?.authority, 'government');
  assert.equal(sources.get('andorra-urban-address-guide')?.depth, 'address');
  assert.equal(sources.get('andorra-topographic-buildings')?.depth, 'building');
  assert.equal(sources.get('andorra-cartografia')?.depth, 'geo-only');
});

test('Andorra address metadata uses official sources and a building-aware hierarchy', () => {
  const profile = JSON.parse(readFileSync(
    resolve(root, 'src/data/address_formats/europe/southern_europe/AD.json'),
    'utf8',
  )) as {
    postalCode: { format: string; regex: string; api: string; source: string };
    addressRules: { regionalHierarchy: string[]; postalCode: { label: string } };
    openSourceIds: string[];
  };

  assert.equal(profile.postalCode.format, 'ADNNN');
  assert.equal(profile.postalCode.regex, '^AD\\d{3}$');
  assert.equal(profile.postalCode.api, 'https://www.correos.es/es/es/empresas/marketing/identifica-a-tus-clientes-potenciales/base-de-datos-de-codigos-postales');
  assert.match(profile.postalCode.source, /Correos.*UPU.*Urban Guide.*IDE Andorra/i);
  assert.deepEqual(profile.addressRules.regionalHierarchy, ['parish', 'populationCentre', 'street', 'addressNumber', 'building', 'entrance', 'unit']);
  assert.match(profile.addressRules.postalCode.label, /AD plus 3 digits.*parish-coded.*allocation.*geometry.*source evidence/i);
  for (const id of [
    'correos-andorra-postcodes',
    'andorra-urban-address-guide',
    'andorra-topographic-buildings',
    'andorra-cartografia',
  ]) {
    assert.ok(profile.openSourceIds.includes(id));
  }
  assert.equal(profile.openSourceIds.includes('geonames-postal'), true);
});
