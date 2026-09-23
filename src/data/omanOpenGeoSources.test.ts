import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { ASIA_OPEN_GEO_SOURCES, getAsiaOpenSourceIds } from './asiaOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const EXPECTED_SOURCE_IDS = [
  'upu-oman-postal-addressing',
  'oman-post-office-locator',
  'oman-post-website-terms',
  'gov-oman-building-addressing-service',
  'ncsi-oman-wilayat-boundaries',
  'ncsi-oman-open-government-data-policy',
  'nsgia-oman-geospatial-governance',
  'nsgia-oman-portal-terms',
] as const;

test('Oman registry separates postal semantics, office points, legal terms, civic numbering, administration, and geodetic governance', () => {
  const ids = getAsiaOpenSourceIds('OM');
  for (const sourceId of EXPECTED_SOURCE_IDS) {
    const source = ASIA_OPEN_GEO_SOURCES[sourceId];
    assert.ok(ids.includes(source.id));
    assert.match(source.url, /^https?:\/\//);
  }

  const upu = ASIA_OPEN_GEO_SOURCES['upu-oman-postal-addressing'];
  const locator = ASIA_OPEN_GEO_SOURCES['oman-post-office-locator'];
  const terms = ASIA_OPEN_GEO_SOURCES['oman-post-website-terms'];
  const building = ASIA_OPEN_GEO_SOURCES['gov-oman-building-addressing-service'];
  const wilayat = ASIA_OPEN_GEO_SOURCES['ncsi-oman-wilayat-boundaries'];
  const policy = ASIA_OPEN_GEO_SOURCES['ncsi-oman-open-government-data-policy'];
  const nsgia = ASIA_OPEN_GEO_SOURCES['nsgia-oman-geospatial-governance'];
  assert.equal(upu.kind, 'standard');
  assert.match(upu.notes, /three digits.*post office.*region.*P\.O\. box.*not.*polygon/i);
  assert.equal(locator.kind, 'postal-code');
  assert.match(locator.notes, /office.*code.*point.*not.*catchment.*subscriber/i);
  assert.match(terms.license ?? '', /republishing.*harvesting.*separate permission/i);
  assert.match(building.notes, /workflow.*not.*register.*footprint.*national/i);
  assert.equal(wilayat.kind, 'admin-boundary');
  assert.match(wilayat.notes, /Ministry of Interior.*licence.*not.*postal/i);
  assert.match(policy.notes, /policy.*not.*dataset licence.*every portal layer/i);
  assert.match(nsgia.notes, /geospatial.*ONGD17.*not.*postal.*building datasets/i);
});

test('Oman official catalog exposes the same evidence boundaries', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('OM').map(source => [source.id, source]));
  assert.equal(sources.get('upu-oman-postal-addressing')?.authority, 'postal-operator');
  assert.equal(sources.get('upu-oman-postal-addressing')?.validationReadiness, 'metadata-only');
  assert.equal(sources.get('oman-post-office-locator')?.depth, 'postcode');
  assert.equal(sources.get('oman-post-office-locator')?.validationReadiness, 'metadata-only');
  assert.equal(sources.get('oman-post-website-terms')?.sourceRole, 'legal-framework-only');
  assert.equal(sources.get('gov-oman-building-addressing-service')?.depth, 'address');
  assert.equal(sources.get('ncsi-oman-wilayat-boundaries')?.depth, 'geo-only');
  assert.equal(sources.get('ncsi-oman-open-government-data-policy')?.sourceRole, 'legal-framework-only');
  assert.equal(sources.get('nsgia-oman-geospatial-governance')?.depth, 'geo-only');
  assert.equal(sources.get('nsgia-oman-portal-terms')?.sourceRole, 'legal-framework-only');
});

test('Oman address metadata preserves three digits and gates office, P.O. box, and building claims', () => {
  const format = JSON.parse(readFileSync(
    resolve(root, 'src/data/address_formats/asia/middle_east/OM.json'),
    'utf8',
  )) as {
    postalCode: { format: string; regex: string; api: string; source: string };
    openSourceIds: string[];
    addressRules: { regionalHierarchy: string[]; postalCode: { label: string; required: boolean; usage: string } };
  };
  assert.equal(format.postalCode.format, 'NNN');
  assert.equal(format.postalCode.regex, '^\\d{3}$');
  assert.equal(format.postalCode.api, 'https://www.omanpost.om/index.php/office-locator');
  assert.match(format.postalCode.source, /UPU.*Oman Post.*office.*NCSI.*NSGIA/i);
  assert.match(format.addressRules.postalCode.label, /3 digits.*post.?office.*point.*not.*polygon.*P\.O\. box.*building.*explicit.*private/i);
  assert.equal(format.addressRules.postalCode.required, true);
  assert.equal(format.addressRules.postalCode.usage, 'required');
  assert.deepEqual(format.addressRules.regionalHierarchy, [
    'governorate',
    'wilayat',
    'locality',
    'threeDigitPostOfficeRoutingCode',
    'postOfficePointOrNoCanonicalGeometry',
    'poBoxNumberWhenProvided',
    'buildingNumber',
    'wayNumberOrStreet',
    'explicitCivicAddressPoint',
    'explicitAddressLinkedBuildingFeature',
    'exactRightsClearedBuilding',
  ]);
  for (const sourceId of EXPECTED_SOURCE_IDS) assert.ok(format.openSourceIds.includes(sourceId));
});
