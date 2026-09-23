import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { ASIA_OPEN_GEO_SOURCES, getAsiaOpenSourceIds } from './asiaOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const EXPECTED = ['bahrain-post-services-directory', 'upu-bahrain-addressing', 'iga-bahrain-address-services', 'bahrain-open-data-terms', 'bahrain-open-data-geographic-locations', 'bahrain-municipal-geographic-explorer', 'slrb-bahrain-cadastre'] as const;

test('Bahrain registry separates postal/block, iGA address, portal licence, points, municipal, and cadastral evidence', () => {
  const ids = getAsiaOpenSourceIds('BH');
  for (const id of EXPECTED) {
    const source = ASIA_OPEN_GEO_SOURCES[id];
    assert.ok(ids.includes(source.id));
    assert.equal(source.url.startsWith('http'), true);
  }
  assert.equal(ASIA_OPEN_GEO_SOURCES['bahrain-post-services-directory'].usage, 'reference');
  assert.match(ASIA_OPEN_GEO_SOURCES['bahrain-post-services-directory'].notes, /three-.*four-digit.*not.*complete.*assignment.*boundary.*bulk/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['upu-bahrain-addressing'].notes, /three or four.*1XX.*12XX.*P.O. box.*not.*allocation.*polygon.*building/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['iga-bahrain-address-services'].notes, /address certificates.*strong.*evidence.*not.*footprint.*CPR.*excluded/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['bahrain-open-data-terms'].notes, /royalty-free.*attribution.*transformation.*disclaimer.*sublicence.*removal.*portal terms cover.*linked iGA.*other government sites/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['bahrain-open-data-geographic-locations'].notes, /points.*27 rows.*20 distinct block.*no explicit postcode.*not.*complete.*register.*polygon.*footprint/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['bahrain-municipal-geographic-explorer'].notes, /viewer.*not.*vector licence.*postcode.*legal survey/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['slrb-bahrain-cadastre'].notes, /cadastral.*paid.*parcel.*not.*postal block.*building.*owner.*never public/i);
});

test('Bahrain official catalog exposes matching authority and readiness boundaries', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('BH').map(source => [source.id, source]));
  assert.equal(sources.get('bahrain-post-services-directory')?.authority, 'postal-operator');
  assert.equal(sources.get('upu-bahrain-addressing')?.authority, 'intergovernmental-postal-standard');
  assert.equal(sources.get('iga-bahrain-address-services')?.depth, 'building');
  assert.equal(sources.get('iga-bahrain-address-services')?.requiresCredential, true);
  assert.equal(sources.get('bahrain-open-data-terms')?.depth, 'legal-framework');
  assert.equal(sources.get('bahrain-open-data-geographic-locations')?.availability, 'public-api');
  assert.equal(sources.get('bahrain-municipal-geographic-explorer')?.depth, 'geo-only');
  assert.equal(sources.get('slrb-bahrain-cadastre')?.requiresCredential, true);
});

test('Bahrain address metadata encodes range, explicit postcode-block relation, iGA identifier, derived surface, and exact building gate', () => {
  const format = JSON.parse(readFileSync(resolve(root, 'src/data/address_formats/asia/middle_east/BH.json'), 'utf8')) as { native: { fields: Array<{ key: string; required?: boolean }> }; english: { fields: Array<{ key: string; required?: boolean }> }; postalCode: { format: string; regex: string; api: string; source: string }; openSourceIds: string[]; addressRules: { regionalHierarchy: string[]; postalCode: { label: string; required: boolean; usage: string } } };
  assert.equal(format.postalCode.format, 'NNN or NNNN (1XX-12XX)');
  assert.equal(format.postalCode.regex, '^(?:[1-9]\\d{2}|1[0-2]\\d{2})$');
  assert.equal(format.postalCode.api, 'https://www.bahrainpost.gov.bh/en/images/pdf/services-directory-eng.pdf');
  assert.match(format.postalCode.source, /Bahrain Post.*UPU.*iGA.*Open Data.*Municipalities.*SLRB/i);
  assert.match(format.addressRules.postalCode.label, /3 or 4 digits.*1XX-12XX.*block.*explicit.*P.O. boxes.*non-building.*derived.*non-canonical.*buildings.*iGA.*permitted/i);
  assert.equal(format.addressRules.postalCode.required, true);
  assert.equal(format.addressRules.postalCode.usage, 'required');
  assert.deepEqual(format.addressRules.regionalHierarchy, ['governorate', 'municipalityOrLocality', 'blockNumber', 'roadNameOrNumber', 'buildingNumber', 'unitOrFlat', 'currentThreeOrFourDigitPostcode', 'explicitPostcodeBlockRelation', 'officialBlockPostalSurfaceOrNoCanonicalGeometry', 'optionalDerivedBlockSurface', 'explicitIgaAddressCertificate', 'explicitAddressLinkedBuildingOrParcel', 'exactRightsClearedBuildingGeometry']);
  assert.equal(format.native.fields.find(field => field.key === 'postcode')?.required, true);
  assert.equal(format.english.fields.some(field => field.key === 'buildingId'), true);
  for (const id of EXPECTED) assert.ok(format.openSourceIds.includes(id));
});
