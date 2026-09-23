import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { ASIA_OPEN_GEO_SOURCES, getAsiaOpenSourceIds } from './asiaOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const EXPECTED = ['pakistan-post-postcode-directory', 'upu-pakistan-addressing', 'pakistan-post-postcode-amendments', 'survey-of-pakistan-mapping-law', 'survey-of-pakistan-geospatial-products', 'pakistan-nsdi', 'pakistan-pbs-census-gis'] as const;

test('Pakistan registry separates postal directory, amendments, mapping law, products, NSDI, and census evidence', () => {
  const ids = getAsiaOpenSourceIds('PK');
  for (const id of EXPECTED) {
    const source = ASIA_OPEN_GEO_SOURCES[id];
    assert.ok(ids.includes(source.id));
    assert.equal(source.url.startsWith('http'), true);
  }
  assert.equal(ASIA_OPEN_GEO_SOURCES['pakistan-post-postcode-directory'].usage, 'primary');
  assert.match(ASIA_OPEN_GEO_SOURCES['pakistan-post-postcode-directory'].notes, /delivery and non-delivery.*five-digit.*account office.*branch.*not.*polygon.*building.*licence/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['upu-pakistan-addressing'].notes, /five digits.*first two.*routing district.*last three.*delivery post office.*not.*allocation.*polygon.*building/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['pakistan-post-postcode-amendments'].notes, /additions.*amendments.*effective edition.*not.*consolidated.*polygon.*reuse/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['survey-of-pakistan-mapping-law'].notes, /registration.*official base.*vetting.*licensing.*not.*permission.*non-official/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['survey-of-pakistan-geospatial-products'].notes, /national mapping authority.*request.*not.*open licence.*postal.*building/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['pakistan-nsdi'].notes, /coordination.*exact permitted layer.*licence.*not automatically postal/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['pakistan-pbs-census-gis'].notes, /census blocks.*workload.*not postal.*delivery points.*buildings/i);
});

test('Pakistan official catalog exposes matching authority and readiness boundaries', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('PK').map(source => [source.id, source]));
  assert.equal(sources.get('pakistan-post-postcode-directory')?.authority, 'postal-operator');
  assert.equal(sources.get('upu-pakistan-addressing')?.authority, 'intergovernmental-postal-standard');
  assert.equal(sources.get('pakistan-post-postcode-amendments')?.depth, 'postcode');
  assert.equal(sources.get('survey-of-pakistan-mapping-law')?.depth, 'legal-framework');
  assert.equal(sources.get('survey-of-pakistan-geospatial-products')?.requiresCredential, true);
  assert.equal(sources.get('pakistan-nsdi')?.depth, 'geo-only');
  assert.equal(sources.get('pakistan-pbs-census-gis')?.authority, 'government');
});

test('Pakistan address metadata encodes leading zeroes, typed offices, census separation, mapping compliance, and exact building gate', () => {
  const format = JSON.parse(readFileSync(resolve(root, 'src/data/address_formats/asia/south_asia/PK.json'), 'utf8')) as { native: { fields: Array<{ key: string; required?: boolean }> }; english: { fields: Array<{ key: string; required?: boolean }> }; postalCode: { format: string; regex: string; api: string; source: string }; openSourceIds: string[]; addressRules: { regionalHierarchy: string[]; postalCode: { label: string; required: boolean; usage: string } } };
  assert.equal(format.postalCode.format, 'NNNNN');
  assert.equal(format.postalCode.regex, '^\\d{5}$');
  assert.equal(format.postalCode.api, 'https://pakpost.gov.pk/postcodes.php');
  assert.match(format.postalCode.source, /Pakistan Post.*UPU.*Survey of Pakistan.*NSDI.*PBS/i);
  assert.match(format.addressRules.postalCode.label, /5 digits.*text.*leading zeroes.*first two.*routing-district.*last three.*delivery post office.*non-delivery.*no canonical polygon.*census blocks.*not postal.*building.*explicit/i);
  assert.equal(format.addressRules.postalCode.required, true);
  assert.equal(format.addressRules.postalCode.usage, 'required');
  assert.deepEqual(format.addressRules.regionalHierarchy, ['provinceOrTerritory', 'division', 'district', 'tehsilOrTaluka', 'localityOrSector', 'deliveryPostOffice', 'accountOffice', 'attachedBranchOfficeCode', 'fiveDigitPostcode', 'typedDeliveryOrNonDeliveryAssignment', 'officialPostalSurfaceOrNoCanonicalGeometry', 'optionalDerivedPostalSurface', 'explicitRightsClearedCivicAddressPoint', 'explicitAddressLinkedBuilding', 'exactRightsClearedBuildingGeometry']);
  assert.equal(format.native.fields.find(field => field.key === 'postcode')?.required, true);
  assert.equal(format.english.fields.some(field => field.key === 'buildingId'), true);
  for (const id of EXPECTED) assert.ok(format.openSourceIds.includes(id));
});
