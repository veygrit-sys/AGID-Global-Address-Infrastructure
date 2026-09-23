import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { EUROPE_OPEN_GEO_SOURCES, getEuropeOpenSourceIds } from './europeOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

test('Romania registry separates postcode lookup, structure, Infocod, geography status, RENNS, INIS, property, and SIRUTA evidence', () => {
  const ids = getEuropeOpenSourceIds('RO');
  const search = EUROPE_OPEN_GEO_SOURCES['posta-romana-postcode-search'];
  const structure = EUROPE_OPEN_GEO_SOURCES['posta-romana-postcode-structure'];
  const infocod = EUROPE_OPEN_GEO_SOURCES['posta-romana-infocod'];
  const status = EUROPE_OPEN_GEO_SOURCES['posta-romana-postcode-geography-status'];
  const renns = EUROPE_OPEN_GEO_SOURCES['ancpi-romania-renns'];
  const inis = EUROPE_OPEN_GEO_SOURCES['ancpi-romania-inis-addresses-buildings'];
  const viewer = EUROPE_OPEN_GEO_SOURCES['ancpi-romania-registered-property-viewer'];
  const siruta = EUROPE_OPEN_GEO_SOURCES['insse-romania-siruta-localities'];
  for (const id of [
    search.id, structure.id, infocod.id, status.id,
    renns.id, inis.id, viewer.id, siruta.id,
  ]) assert.ok(ids.includes(id));
  assert.equal(search.kind, 'postal-code');
  assert.match(search.notes, /six-digit.*county.*locality.*street.*number.*not.*bulk.*polygon/i);
  assert.match(structure.notes, /street.*street-part.*building.*locality.*not.*current allocation.*geometry/i);
  assert.match(infocod.license ?? '', /controlled.*contract/i);
  assert.match(status.notes, /dated.*no geographic coordinates.*future/i);
  assert.equal(renns.kind, 'address');
  assert.match(renns.notes, /CUA.*SIRUTA.*parcel.*point.*bulk.*not.*building footprint/i);
  assert.equal(inis.kind, 'building');
  assert.match(inis.notes, /EPSG:3844.*explicit.*relationship.*query.*not.*redistribution/i);
  assert.equal(viewer.usage, 'validation');
  assert.match(viewer.notes, /viewer.*not.*reusable vector.*owner/i);
  assert.equal(siruta.kind, 'admin-boundary');
  assert.match(siruta.notes, /SIRUTA.*hierarchy.*county.*not.*postal.*sovereignty/i);
});

test('Romania official catalog exposes distinct operator, ANCPI, and INSSE authorities', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('RO').map(source => [source.id, source]));
  assert.equal(sources.get('posta-romana-postcode-search')?.authority, 'postal-operator');
  assert.equal(sources.get('posta-romana-postcode-search')?.depth, 'address');
  assert.equal(sources.get('posta-romana-infocod')?.availability, 'commercial-or-restricted');
  assert.equal(sources.get('posta-romana-postcode-geography-status')?.validationReadiness, 'metadata-only');
  assert.equal(sources.get('ancpi-romania-renns')?.depth, 'address');
  assert.equal(sources.get('ancpi-romania-inis-addresses-buildings')?.depth, 'building');
  assert.equal(sources.get('ancpi-romania-registered-property-viewer')?.trustTier, 'official');
  assert.equal(sources.get('insse-romania-siruta-localities')?.depth, 'locality');
});

test('Romania address metadata uses official sources and an explicit CUA-to-construction hierarchy', () => {
  const format = JSON.parse(readFileSync(
    resolve(root, 'src/data/address_formats/europe/eastern_europe/RO.json'),
    'utf8',
  )) as {
    postalCode: { api: string; source: string };
    openSourceIds: string[];
    addressRules: { regionalHierarchy: string[]; postalCode: { label: string } };
  };
  assert.equal(format.postalCode.api, 'https://www.posta-romana.ro/cauta-cod-postal.html');
  assert.match(format.postalCode.source, /Poșta Română.*Infocod.*RENNS.*ANCPI INIS.*INSSE SIRUTA/i);
  assert.match(format.addressRules.postalCode.label, /6 digits.*assignment class.*derived.*CUA.*explicit ANCPI.*property.*private/i);
  assert.deepEqual(format.addressRules.regionalHierarchy, [
    'countyOrBucharest',
    'municipalityCityCommuneOrBucharestSector',
    'localitySiruta',
    'postalAssignmentClass',
    'streetOrStreetSection',
    'administrativeNumber',
    'uniqueAddressCodeCua',
    'addressPointAndParcelReference',
    'explicitAncpiConstructionIdentifier',
    'exactRightsClearedBuilding',
  ]);
  for (const sourceId of [
    'posta-romana-postcode-search',
    'posta-romana-postcode-structure',
    'posta-romana-infocod',
    'posta-romana-postcode-geography-status',
    'ancpi-romania-renns',
    'ancpi-romania-inis-addresses-buildings',
    'ancpi-romania-registered-property-viewer',
    'insse-romania-siruta-localities',
  ]) assert.ok(format.openSourceIds.includes(sourceId));
});
