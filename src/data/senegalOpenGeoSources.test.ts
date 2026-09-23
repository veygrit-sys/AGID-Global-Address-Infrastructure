import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AFRICA_OPEN_GEO_SOURCES, getAfricaOpenSourceIds } from './africaOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const OFFICIAL = ['la-poste-senegal-codes', 'la-poste-senegal-po-box', 'upu-senegal-addressing-2015', 'artp-senegal-national-addressing-2015', 'geosenegal-basegeo', 'geosenegal-basegeo-license', 'geosenegal-urban-buildings-2019', 'dgid-senegal-nicad', 'senegal-data-protection-law-2008-12'] as const;

test('Senegal registry separates postcode, BP, dated addressing, licensed geodata, NICAD, privacy and community data', () => {
  const ids = new Set(getAfricaOpenSourceIds('SN'));
  for (const id of [...OFFICIAL, 'osm-senegal'] as const) assert.ok(ids.has(id));
  assert.equal(AFRICA_OPEN_GEO_SOURCES['la-poste-senegal-codes'].usage, 'primary');
  assert.match(AFRICA_OPEN_GEO_SOURCES['la-poste-senegal-codes'].notes, /Current operator.*five-digit.*nearest post office.*not.*complete.*catchment/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['la-poste-senegal-po-box'].notes, /nominative BP.*separates.*home address.*separate from postcode.*building/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['upu-senegal-addressing-2015'].notes, /five-digit.*delivery-office.*P.O. Box.*not.*current.*geometry/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['artp-senegal-national-addressing-2015'].notes, /Dated report.*numbering gaps.*single national system.*do not prove current/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['geosenegal-basegeo-license'].notes, /attribution.*commercial derived.*annual.*termination/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['geosenegal-urban-buildings-2019'].notes, /city-specific.*not nationwide.*postal assignment.*address relation.*NICAD/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['dgid-senegal-nicad'].notes, /16-character parcel.*not.*postcode.*building ID.*owner/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['senegal-data-protection-law-2008-12'].notes, /identifying personal data.*third countries/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['osm-senegal'].license ?? '', /ODbL.*separate/i);
});

test('Senegal official catalog exposes matching assignment, BP, licence, building, cadastral and privacy boundaries', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('SN').map(source => [source.id, source]));
  for (const id of OFFICIAL) assert.ok(sources.has(id));
  assert.equal(sources.get('la-poste-senegal-codes')?.validationReadiness, 'reference-eligible');
  assert.equal(sources.get('la-poste-senegal-po-box')?.depth, 'delivery-point');
  assert.equal(sources.get('upu-senegal-addressing-2015')?.validationReadiness, 'metadata-only');
  assert.equal(sources.get('geosenegal-basegeo')?.availability, 'licensed-bulk-data');
  assert.equal(sources.get('geosenegal-basegeo-license')?.sourceRole, 'legal-framework-only');
  assert.equal(sources.get('geosenegal-urban-buildings-2019')?.depth, 'building');
  assert.equal(sources.get('dgid-senegal-nicad')?.sourceRole, 'context-only');
  assert.equal(sources.get('senegal-data-protection-law-2008-12')?.sourceRole, 'legal-framework-only');
});
