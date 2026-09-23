import assert from 'node:assert/strict';
import { test } from 'node:test';

import { AFRICA_OPEN_GEO_SOURCES, getAfricaOpenSourceIds } from './africaOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const OFFICIAL = ['zampost', 'zampost-locations', 'upu-zambia-addressing-2013', 'zicta-zambia-national-addressing-postcode', 'zambia-parliament-addressing-statement-2013', 'zambia-ecommerce-strategy-2023', 'znsdi-zambia-policy-2026', 'znsdi-zambia-cadastre-lots', 'zilas-zambia', 'zambia-data-protection-act-2021', 'dpc-zambia-location-data-guidance'] as const;

test('Zambia registry separates postcode, holder objects, project status, cadastre, privacy and community data', () => {
  const ids = new Set(getAfricaOpenSourceIds('ZM'));
  for (const id of [...OFFICIAL, 'osm-zambia'] as const) assert.ok(ids.has(id));
  assert.equal(AFRICA_OPEN_GEO_SOURCES.zampost.usage, 'primary');
  assert.match(AFRICA_OPEN_GEO_SOURCES.zampost.notes, /operator.*not.*complete current postcode.*polygon.*building.*bulk API/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['zampost-locations'].notes, /city.*province.*postal code.*distinguishes.*not.*complete.*boundary/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['upu-zambia-addressing-2013'].notes, /five-digit.*P.O. Box.*private bag.*not.*current.*geometry/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['zicta-zambia-national-addressing-postcode'].notes, /current regulator.*project.*each property.*does not.*operational/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['zambia-parliament-addressing-statement-2013'].notes, /10101.*proposal.*not representative.*phased/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['znsdi-zambia-policy-2026'].notes, /custodian.*parcel.*sensitive.*not.*open.*postal/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['znsdi-zambia-cadastre-lots'].notes, /polygon lots.*plot identifiers.*not.*postcode.*building.*address relation/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['zilas-zambia'].notes, /land registration.*survey.*not.*owner.*title.*crosswalk/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['dpc-zambia-location-data-guidance'].notes, /location data.*personal data.*purpose-limited.*gated/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['osm-zambia'].license ?? '', /ODbL.*separate/i);
});

test('Zambia official catalog exposes matching assignment, status, access, spatial and privacy boundaries', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('ZM').map(source => [source.id, source]));
  for (const id of OFFICIAL) assert.ok(sources.has(id));
  assert.equal(sources.get('zampost')?.trustTier, 'authoritative');
  assert.equal(sources.get('zampost-locations')?.validationReadiness, 'reference-eligible');
  assert.equal(sources.get('zicta-zambia-national-addressing-postcode')?.validationReadiness, 'metadata-only');
  assert.equal(sources.get('zambia-parliament-addressing-statement-2013')?.sourceRole, 'legal-framework-only');
  assert.equal(sources.get('znsdi-zambia-policy-2026')?.depth, 'geo-only');
  assert.equal(sources.get('znsdi-zambia-cadastre-lots')?.availability, 'public-api');
  assert.equal(sources.get('zilas-zambia')?.requiresCredential, true);
  assert.equal(sources.get('dpc-zambia-location-data-guidance')?.sourceRole, 'legal-framework-only');
});
