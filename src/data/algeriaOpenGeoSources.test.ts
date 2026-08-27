import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { AFRICA_OPEN_GEO_SOURCES, getAfricaOpenSourceIds } from './africaOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const EXPECTED = ["algerie-poste","algerie-poste-mobile-offices","algerie-poste-privacy","upu-algeria-addressing-2002","algeria-postal-addressing-regulation-2019","algeria-national-address-referential","algeria-local-authorities-directory","inct-algeria-digital-geodata","osm-algeria"] as const;
const OFFICIAL = EXPECTED.filter(id => id !== 'osm-algeria');

test('Algeria registry separates fixed and mobile postal objects, historical and legal context, national addressing, administration, commercial GIS, and community data', () => {
  const ids = getAfricaOpenSourceIds('DZ');
  for (const id of EXPECTED) {
    const source = AFRICA_OPEN_GEO_SOURCES[id];
    assert.ok(ids.includes(source.id));
    assert.match(source.url, /^https?:\/\//);
  }
  assert.equal(AFRICA_OPEN_GEO_SOURCES['algerie-poste'].usage, 'primary');
  assert.match(AFRICA_OPEN_GEO_SOURCES['algerie-poste'].notes, /official.*five-digit.*observation.*not.*bulk.*geometry.*redistribution/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['algerie-poste-mobile-offices'].notes, /mobile.*non-area.*not.*route.*polygon/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['upu-algeria-addressing-2002'].notes, /Dated.*five-digit.*delivery-area.*wilaya.*not.*current.*polygon/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['algeria-postal-addressing-regulation-2019'].notes, /six-line.*five-digit.*commune.*not.*address rows.*geometry.*building/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['algeria-national-address-referential'].notes, /institutional.*not.*public nationwide.*dataset.*licence.*building/i);
  assert.equal(AFRICA_OPEN_GEO_SOURCES['inct-algeria-digital-geodata'].license, 'Commercial or product-specific permission required');
  assert.match(AFRICA_OPEN_GEO_SOURCES['osm-algeria'].license ?? '', /ODbL.*separate/i);
});

test('Algeria official catalog exposes matching authority and reuse boundaries', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('DZ').map(source => [source.id, source]));
  for (const id of OFFICIAL) assert.ok(sources.has(id));
  assert.equal(sources.get('algerie-poste')?.authority, 'postal-operator');
  assert.equal(sources.get('algerie-poste')?.validationReadiness, 'reference-eligible');
  assert.equal(sources.get('algerie-poste-mobile-offices')?.depth, 'postcode');
  assert.equal(sources.get('upu-algeria-addressing-2002')?.validationReadiness, 'metadata-only');
  assert.equal(sources.get('algeria-postal-addressing-regulation-2019')?.sourceRole, 'legal-framework-only');
  assert.equal(sources.get('algeria-national-address-referential')?.depth, 'address');
  assert.equal(sources.get('algeria-local-authorities-directory')?.sourceRole, 'context-only');
  assert.equal(sources.get('inct-algeria-digital-geodata')?.availability, 'commercial-or-restricted');
});

test('Algeria address metadata preserves five digits and gates areas and buildings', () => {
  const format = JSON.parse(readFileSync(resolve(root, 'src/data/address_formats/africa/northern_africa/DZ.json'), 'utf8')) as { postalCode: { format: string; regex: string; api: string; source: string }; openSourceIds: string[]; addressRules: { regionalHierarchy: string[]; postalCode: { label: string; required: boolean; usage: string } } };
  assert.equal(format.postalCode.format, 'NNNNN');
  assert.equal(format.postalCode.regex, '^\\d{5}$');
  assert.equal(format.postalCode.api, 'https://www.poste.dz/customer/bureaux_postaux');
  assert.match(format.postalCode.source, /Algérie Poste.*UPU.*Decree 19-258.*Interior.*INCT/i);
  assert.match(format.addressRules.postalCode.label, /5 digits.*text.*area or non-area.*no automatic polygon.*building.*explicit/i);
  assert.deepEqual(format.addressRules.regionalHierarchy, ['wilaya', 'daira', 'commune', 'localityOrDeliveryPoint', 'typedFiveDigitPostalObject', 'officialPostalSurfaceOrNoCanonicalGeometry', 'explicitCivicAddressPoint', 'explicitAddressLinkedBuildingFeature', 'exactRightsClearedBuilding']);
  for (const id of EXPECTED) assert.ok(format.openSourceIds.includes(id));
});
