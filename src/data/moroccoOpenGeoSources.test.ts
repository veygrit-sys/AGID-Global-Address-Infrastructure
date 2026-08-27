import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { parse } from 'yaml';

import { AFRICA_OPEN_GEO_SOURCES, getAfricaOpenSourceIds } from './africaOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const EXPECTED = ['upu-morocco-postcode-manual', 'poste-maroc-codepostal', 'morocco-open-data-postal', 'morocco-open-data-license', 'ancfcc-morocco-cartography'] as const;

test('Morocco registry separates typed postcode semantics, operator lookup, open data, licence, and cartography', () => {
  const ids = getAfricaOpenSourceIds('MA');
  for (const id of EXPECTED) {
    const source = AFRICA_OPEN_GEO_SOURCES[id];
    assert.ok(ids.includes(source.id));
    assert.match(source.url, /^https?:\/\//);
  }
  assert.match(AFRICA_OPEN_GEO_SOURCES['upu-morocco-postcode-manual'].notes, /five digits.*routeing zone.*province.*0.*1.*7.*8.*sector.*2.*6.*agency.*9.*recipient.*not.*polygon/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['poste-maroc-codepostal'].notes, /official.*record.*not.*geometry.*bulk/i);
  assert.equal(AFRICA_OPEN_GEO_SOURCES['morocco-open-data-postal'].usage, 'primary');
  assert.match(AFRICA_OPEN_GEO_SOURCES['morocco-open-data-postal'].notes, /district.*locality.*agency.*2018.*point.*not.*surface/i);
  assert.equal(AFRICA_OPEN_GEO_SOURCES['morocco-open-data-license'].kind, 'standard');
  assert.match(AFRICA_OPEN_GEO_SOURCES['morocco-open-data-license'].notes, /ODbL.*exact.*dataset.*not.*postal/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['ancfcc-morocco-cartography'].notes, /topographic.*administrative.*cadastral.*not.*postal.*redistribution/i);
});

test('Morocco official catalog exposes matching authority boundaries', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('MA').map(source => [source.id, source]));
  assert.equal(sources.get('upu-morocco-postcode-manual')?.authority, 'postal-operator');
  assert.equal(sources.get('upu-morocco-postcode-manual')?.validationReadiness, 'metadata-only');
  assert.equal(sources.get('poste-maroc-codepostal')?.depth, 'postcode');
  assert.equal(sources.get('poste-maroc-codepostal')?.validationReadiness, 'metadata-only');
  assert.equal(sources.get('morocco-open-data-postal')?.authority, 'official-open-data');
  assert.equal(sources.get('morocco-open-data-postal')?.availability, 'bulk-open-data');
  assert.equal(sources.get('morocco-open-data-license')?.sourceRole, 'legal-framework-only');
  assert.equal(sources.get('ancfcc-morocco-cartography')?.depth, 'geo-only');
});

test('Morocco address metadata encodes typed five-digit sectors and explicit building gates', () => {
  const format = JSON.parse(readFileSync(resolve(root, 'src/data/address_formats/africa/northern_africa/MA.json'), 'utf8')) as { postalCode: { format: string; regex: string; api: string; source: string }; openSourceIds: string[]; addressRules: { regionalHierarchy: string[]; postalCode: { label: string; required: boolean; usage: string } } };
  assert.equal(format.postalCode.format, 'NNNNN');
  assert.equal(format.postalCode.regex, '^\\d{5}$');
  assert.equal(format.postalCode.api, 'https://www.codepostal.ma/search.aspx');
  assert.match(format.postalCode.source, /UPU.*Barid Al-Maghrib.*Open Data.*ANCFCC/i);
  assert.match(format.addressRules.postalCode.label, /5 digits.*0\/1\/7\/8.*sector.*2–6.*agency.*9.*recipient.*not.*polygon.*building.*explicit/i);
  assert.equal(format.addressRules.postalCode.required, true);
  assert.equal(format.addressRules.postalCode.usage, 'required');
  assert.deepEqual(format.addressRules.regionalHierarchy, ['region', 'provinceOrPrefecture', 'commune', 'localityOrDistrict', 'typedFiveDigitPostcode', 'officialHomeDeliverySectorOrNoCanonicalGeometry', 'explicitCivicAddressPoint', 'explicitAddressLinkedBuildingFeature', 'exactRightsClearedBuilding']);
  for (const id of EXPECTED) assert.ok(format.openSourceIds.includes(id));
});

test('Morocco JSON and YAML address profiles remain semantically identical', () => {
  const json = JSON.parse(readFileSync(resolve(root, 'src/data/address_formats/africa/northern_africa/MA.json'), 'utf8'));
  const yaml = parse(readFileSync(resolve(root, 'src/data/address_formats/africa/northern_africa/MA.yaml'), 'utf8'));
  assert.deepEqual(yaml, json);
});
