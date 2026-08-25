import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { EUROPE_OPEN_GEO_SOURCES, getEuropeOpenSourceIds } from './europeOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const BELGIUM_SOURCE_IDS = [
  'bpost-belgium-postcode-reference',
  'bpost-belgium-postal-cantons',
  'bpost-address-validation',
  'bosa-belgium-best-address',
  'digitaal-vlaanderen-address-register',
  'digitaal-vlaanderen-building-register',
  'digitaal-vlaanderen-grb',
  'spw-wallonia-icar-addresses',
  'spw-wallonia-picc-buildings',
  'paradigm-brussels-urbis-buildings-addresses',
  'fps-finance-belgium-cadastral-plan',
  'fps-finance-belgium-administrative-units',
] as const;

test('Belgium registry separates operator, postal-canton, federal address, regional building, cadastre, and administration evidence', () => {
  const ids = getEuropeOpenSourceIds('BE');
  const sources = BELGIUM_SOURCE_IDS.map(id => EUROPE_OPEN_GEO_SOURCES[id]);
  for (const source of sources) assert.ok(ids.includes(source.id));

  const [postcode, cantons, validation, best, flandersAddress, flandersBuilding, grb, icar, picc, urbis, cadastre, administration] = sources;
  assert.equal(postcode.kind, 'postal-code');
  assert.match(postcode.notes, /four-digit.*leading zeroes.*B-\/BE-.*neither.*polygon.*building/i);
  assert.equal(cantons.kind, 'postal-code');
  assert.match(cantons.license ?? '', /exact geo.be.*downloadable-layer terms.*attribution.*redistribution/i);
  assert.match(cantons.notes, /official postal-canton.*special codes.*exact versioned vector.*WMS pixels.*municipal.*containment.*deliverability/i);
  assert.equal(validation.usage, 'validation');
  assert.match(validation.notes, /validation.*not bundled.*building geometry.*BeSt/i);
  assert.equal(best.kind, 'address');
  assert.match(best.license ?? '', /CC BY 4.0.*BOSA.*regional.*attribution/i);
  assert.match(best.notes, /weekly.*three regional.*source identifiers.*not a building footprint/i);
  assert.equal(flandersAddress.kind, 'address');
  assert.match(flandersAddress.notes, /authentic.*building unit.*parcel.*berth.*stand.*explicit/i);
  assert.equal(flandersBuilding.kind, 'building');
  assert.match(flandersBuilding.notes, /stable.*explicit Address Register.*building units.*proximity/i);
  assert.equal(grb.kind, 'building');
  assert.match(grb.license ?? '', /Gratis open data.*v1.02.*GRB attribution/i);
  assert.match(grb.notes, /official.*Building Register.*containment/i);
  assert.equal(icar.kind, 'address');
  assert.match(icar.notes, /authentic.*exact PICC.*centroid.*not a footprint/i);
  assert.equal(picc.kind, 'building');
  assert.match(picc.notes, /high-precision.*explicit ICAR-PICC.*restricted PICC-vTOPO/i);
  assert.equal(urbis.kind, 'building');
  assert.match(urbis.notes, /official regional.*inspire_Id.*explicit UrbIS.*third-party/i);
  assert.equal(cadastre.kind, 'building');
  assert.match(cadastre.notes, /public plan.*not establish legal property.*parcel is not.*owner.*tax.*valuation/i);
  assert.equal(administration.kind, 'admin-boundary');
  assert.match(administration.notes, /region.*province.*arrondissement.*municipality.*context only.*postal cantons/i);
});

test('Belgium official catalog exposes canonical postal geometry and three-region address-building boundaries', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('BE').map(source => [source.id, source]));

  assert.equal(sources.get('bpost-belgium-postcode-reference')?.authority, 'postal-operator');
  assert.equal(sources.get('bpost-belgium-postal-cantons')?.availability, 'bulk-open-data');
  assert.equal(sources.get('bpost-belgium-postal-cantons')?.depth, 'postcode');
  assert.equal(sources.get('bosa-belgium-best-address')?.trustTier, 'authoritative');
  assert.equal(sources.get('digitaal-vlaanderen-address-register')?.depth, 'address');
  assert.equal(sources.get('digitaal-vlaanderen-building-register')?.depth, 'building');
  assert.equal(sources.get('spw-wallonia-icar-addresses')?.depth, 'address');
  assert.equal(sources.get('spw-wallonia-picc-buildings')?.depth, 'building');
  assert.equal(sources.get('paradigm-brussels-urbis-buildings-addresses')?.depth, 'building');
  assert.equal(sources.get('fps-finance-belgium-cadastral-plan')?.depth, 'building');
  assert.equal(sources.get('fps-finance-belgium-administrative-units')?.depth, 'geo-only');
});

test('Belgium address metadata uses official postal geometry and explicit regional address-to-building hierarchy', () => {
  const format = JSON.parse(readFileSync(
    resolve(root, 'src/data/address_formats/europe/western_europe/BE.json'),
    'utf8',
  )) as {
    postalCode: { api: string; source: string };
    openSourceIds: string[];
    addressRules: { regionalHierarchy: string[]; postalCode: { label: string } };
  };

  assert.equal(format.postalCode.api, 'https://www.bpost.be/nl/postcodevalidatie-tool');
  assert.match(format.postalCode.source, /bpost.*postal cantons.*BOSA BeSt.*Flanders.*Wallonia.*Brussels.*FPS Finance/i);
  assert.match(format.addressRules.postalCode.label, /4 digits.*no B-\/BE- prefix.*postal-canton polygon.*BeSt.*explicit.*building/i);
  assert.deepEqual(format.addressRules.regionalHierarchy, [
    'region',
    'provinceOrBrusselsCapital',
    'administrativeArrondissement',
    'municipalityNis',
    'postalCantonOrSpecialCode',
    'localityOrMunicipalityPart',
    'streetName',
    'houseNumberAndBox',
    'bestAddressIdAndRegionalSourceId',
    'addressableObjectType',
    'explicitRegionalBuildingOrCadastreLink',
    'exactRightsClearedBuilding',
  ]);
  for (const sourceId of BELGIUM_SOURCE_IDS) assert.ok(format.openSourceIds.includes(sourceId));
});
