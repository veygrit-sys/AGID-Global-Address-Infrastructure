import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { EUROPE_OPEN_GEO_SOURCES, getEuropeOpenSourceIds } from './europeOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const BELARUS_SOURCE_IDS = [
  'belpost-belarus-postcode-reference',
  'nca-belarus-postal-code-zones',
  'nca-belarus-address-register',
  'nca-belarus-capital-structure-addresses',
  'nca-belarus-real-estate-register',
  'nca-belarus-property-characteristics-register',
  'nca-belarus-ate-register',
  'nca-belarus-soato-classifier',
  'nca-belarus-public-cadastral-map',
] as const;

test('Belarus registry separates operator, postal zone, address, building, administration, and viewer evidence', () => {
  const ids = getEuropeOpenSourceIds('BY');
  const sources = BELARUS_SOURCE_IDS.map(id => EUROPE_OPEN_GEO_SOURCES[id]);
  for (const source of sources) assert.ok(ids.includes(source.id));

  const [postcodes, zones, address, structures, realEstate, characteristics, ate, soato, viewer] = sources;
  assert.equal(postcodes.kind, 'postal-code');
  assert.match(postcodes.notes, /six-digit.*assignment.*not.*polygon.*building.*bulk/i);
  assert.equal(zones.kind, 'postal-code');
  assert.match(zones.license ?? '', /public map.*exact data-service terms.*contract.*redistribution/i);
  assert.match(zones.notes, /2020.*six months.*official-derived.*not.*Belpost-authored.*bulk licence/i);
  assert.equal(address.kind, 'address');
  assert.match(address.license ?? '', /controlled.*paid.*contract.*output rights/i);
  assert.match(address.notes, /geocode is not a building footprint.*land parcel.*isolated premise.*person/i);
  assert.equal(structures.kind, 'address');
  assert.match(structures.notes, /capital structures.*object type.*postcode.*not.*building footprint.*national mirror/i);
  assert.equal(realEstate.kind, 'building');
  assert.match(realEstate.notes, /real-estate.*explicit address relation.*parcel.*parking-space.*owner/i);
  assert.equal(characteristics.kind, 'building');
  assert.match(characteristics.notes, /building characteristics.*explicitly identified.*valuation.*proximity/i);
  assert.equal(ate.kind, 'admin-boundary');
  assert.match(ate.notes, /administrative.*context only.*postcode.*building.*coverage/i);
  assert.equal(soato.kind, 'gazetteer');
  assert.match(soato.notes, /SOATO.*context.*not postal assignment.*special-regime omissions/i);
  assert.equal(viewer.usage, 'reference');
  assert.match(viewer.notes, /viewer.*visible map layer.*not.*licensed artifact.*building-address relation/i);
});

test('Belarus official catalog exposes operator assignment, official-derived zone, and controlled address/building boundaries', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('BY').map(source => [source.id, source]));

  assert.equal(sources.get('belpost-belarus-postcode-reference')?.authority, 'postal-operator');
  assert.equal(sources.get('belpost-belarus-postcode-reference')?.availability, 'web-search');
  assert.equal(sources.get('nca-belarus-postal-code-zones')?.trustTier, 'official-derived');
  assert.equal(sources.get('nca-belarus-postal-code-zones')?.depth, 'postcode');
  assert.equal(sources.get('nca-belarus-address-register')?.depth, 'address');
  assert.equal(sources.get('nca-belarus-address-register')?.requiresCredential, true);
  assert.equal(sources.get('nca-belarus-capital-structure-addresses')?.availability, 'commercial-or-restricted');
  assert.equal(sources.get('nca-belarus-real-estate-register')?.depth, 'building');
  assert.equal(sources.get('nca-belarus-property-characteristics-register')?.requiresCredential, true);
  assert.equal(sources.get('nca-belarus-ate-register')?.depth, 'geo-only');
  assert.equal(sources.get('nca-belarus-soato-classifier')?.depth, 'locality');
  assert.equal(sources.get('nca-belarus-public-cadastral-map')?.availability, 'web-search');
});

test('Belarus address metadata uses official evidence and an explicit address-to-building hierarchy', () => {
  const format = JSON.parse(readFileSync(
    resolve(root, 'src/data/address_formats/europe/eastern_europe/BY.json'),
    'utf8',
  )) as {
    postalCode: { api: string; source: string };
    openSourceIds: string[];
    addressRules: { regionalHierarchy: string[]; postalCode: { label: string } };
  };

  assert.equal(format.postalCode.api, 'https://www.belpost.by/');
  assert.match(format.postalCode.source, /Belpost.*NCA postal-code zones.*Address Register.*capital-structure.*ATE\/SOATO/i);
  assert.match(format.addressRules.postalCode.label, /6 digits.*Belpost assignment.*official-derived.*semiannual zone.*isolated premise.*capital structure/i);
  assert.deepEqual(format.addressRules.regionalHierarchy, [
    'oblastOrMinskCity',
    'rayonOrCityOfRegionalSubordination',
    'villageCouncilOrCityDistrict',
    'settlementSoato',
    'postalAssignmentOrSpecialEndpoint',
    'streetRoadOrInternalAddressElement',
    'capitalStructureNumberAndCorpus',
    'entranceFloorApartmentOrIsolatedPremise',
    'authoritativeAddressIdAndGeocode',
    'capitalStructureOrRealEstateIdentifier',
    'explicitRightsClearedBuilding',
  ]);
  for (const sourceId of BELARUS_SOURCE_IDS) assert.ok(format.openSourceIds.includes(sourceId));
});
