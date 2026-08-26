import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { ASIA_OPEN_GEO_SOURCES, getAsiaOpenSourceIds } from './asiaOpenGeoSources';
import { classifyPostalSourceTrust, getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const EXPECTED = ['bhutan-post-postcode-finder', 'bhutan-post-domestic-footprint', 'upu-bhutan-addressing', 'bhutan-nlcs-geoportal', 'bhutan-nlcs-map-products', 'bhutan-nlcs-cadastral-information', 'bhutan-nsb-phcb-2017', 'bhutan-esakor-land-building-transactions'] as const;

test('Bhutan open geo registry separates locator, routing semantics, maps, census, cadastre, and private transactions', () => {
  const ids = getAsiaOpenSourceIds('BT');
  for (const id of EXPECTED) {
    assert.ok(ids.includes(id));
    assert.equal(ASIA_OPEN_GEO_SOURCES[id].id, id);
    assert.equal(ASIA_OPEN_GEO_SOURCES[id].url.startsWith('http'), true);
  }
  assert.equal(ASIA_OPEN_GEO_SOURCES['bhutan-post-postcode-finder'].usage, 'primary');
  assert.match(ASIA_OPEN_GEO_SOURCES['bhutan-post-postcode-finder'].notes, /five-digit.*Dzongkhag.*Gewog.*Post Office.*routing-assignment.*not a polygon.*address.*building.*licence/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['bhutan-post-domestic-footprint'].notes, /post offices.*codes.*network.*not catchment polygons.*address points.*building links/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['upu-bhutan-addressing'].notes, /five digits.*Dzongdey.*Dzongkhag.*Dungkhag.*building.*flat.*shop.*village.*Gewog.*not boundaries.*building identities/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['bhutan-nlcs-geoportal'].notes, /map.*data.*metadata.*not.*postal authority.*nationwide.*redistribution rights/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['bhutan-nlcs-map-products'].notes, /topographic.*administrative.*application.*approval.*payment.*use agreements.*cadastral maps are not public.*not.*postal.*building relation/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['bhutan-nlcs-cadastral-information'].notes, /cadastral.*eSakor.*parcels.*Thrams.*controlled.*not.*postal surfaces.*civic addresses.*owner.*occupant/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['bhutan-nsb-phcb-2017'].notes, /house listing.*enumeration areas.*statistics.*not postal boundaries.*public address points.*confidential/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['bhutan-esakor-land-building-transactions'].notes, /NDI.*identity.*permanent-address.*party.*witness.*Thram.*plot.*private.*not.*public address.*postcode polygon/i);
});

test('Bhutan official catalog exposes matching authority and readiness boundaries', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('BT').map(source => [source.id, source]));
  assert.equal(sources.get('bhutan-post-postcode-finder')?.authority, 'postal-operator');
  assert.equal(sources.get('bhutan-post-postcode-finder')?.validationReadiness, 'reference-eligible');
  assert.equal(sources.get('bhutan-post-domestic-footprint')?.depth, 'geo-only');
  assert.equal(sources.get('upu-bhutan-addressing')?.authority, 'intergovernmental-postal-standard');
  assert.equal(sources.get('bhutan-nlcs-geoportal')?.validationReadiness, 'metadata-only');
  assert.equal(sources.get('bhutan-nlcs-map-products')?.availability, 'commercial-or-restricted');
  assert.equal(sources.get('bhutan-nlcs-cadastral-information')?.depth, 'building');
  assert.equal(sources.get('bhutan-nsb-phcb-2017')?.requiresCredential, true);
  assert.equal(sources.get('bhutan-esakor-land-building-transactions')?.availability, 'auth-required-api');
  const classification = classifyPostalSourceTrust({ countryCode: 'BT', source: 'Bhutan Post Postcode Finder' });
  assert.equal(classification.strength, 'strong');
  assert.equal(classification.tier, 'authoritative');
});

test('Bhutan address metadata encodes five-digit routing, evidence separation, and building gate', () => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  const value = JSON.parse(readFileSync(resolve(root, 'src/data/address_formats/asia/south_asia/BT.json'), 'utf8')) as { native: { fields: Array<{ key: string }> }; english: { fields: Array<{ key: string }> }; postalCode: { format: string; regex: string; api: string; source: string }; openSourceIds: string[]; addressRules: { regionalHierarchy: string[]; postalCode: { label: string; required: boolean; usage: string } } };
  assert.equal(value.postalCode.format, 'NNNNN'); assert.equal(value.postalCode.regex, '^\\d{5}$'); assert.equal(value.postalCode.api, 'https://bhutanpost.bt/postcode/'); assert.match(value.postalCode.source, /Bhutan Post.*UPU Bhutan.*NLCS.*NSB PHCB.*eSakor/i);
  assert.equal(value.addressRules.postalCode.label, '5 digits used'); assert.equal(value.addressRules.postalCode.required, false); assert.equal(value.addressRules.postalCode.usage, 'used');
  assert.deepEqual(value.addressRules.regionalHierarchy, ['postalRegionOrDzongdey', 'dzongkhag', 'dungkhagIfAny', 'gewogOrThromde', 'villageOrUrbanZone', 'streetOrLam', 'houseBuildingFlatShopOrUnit', 'postOfficeOrCommunityMailOffice', 'fiveDigitPostcode', 'officialPostalSurfaceOrNoCanonicalGeometry', 'optionalDerivedDeliverySurface', 'explicitRightsClearedCivicAddressPoint', 'explicitAddressLinkedBuilding', 'exactRightsClearedBuildingGeometry']);
  assert.equal(value.native.fields.some(field => field.key === 'buildingId'), true); assert.equal(value.english.fields.some(field => field.key === 'buildingId'), true); for (const id of EXPECTED) assert.ok(value.openSourceIds.includes(id));
});
