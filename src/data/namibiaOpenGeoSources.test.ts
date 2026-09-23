import assert from 'node:assert/strict';
import { test } from 'node:test';

import { AFRICA_OPEN_GEO_SOURCES, getAfricaOpenSourceIds } from './africaOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const OFFICIAL = [
  'nampost-postal-codes',
  'nampost-post-offices',
  'upu-namibia-addressing',
  'nsa-namibia-geo-portal',
  'mawlr-namibia-survey-mapping',
  'namibia-constitution-article-13',
  'namibia-access-to-information-act-2022',
  'namibia-data-protection-status-2026',
] as const;

test('Namibia registry separates delivery-network codes, office observations, address rules, administrative geography, cadastre, privacy and ODbL data', () => {
  const ids = new Set(getAfricaOpenSourceIds('NA'));
  for (const id of [...OFFICIAL, 'osm-namibia'] as const) assert.ok(ids.has(id), id);
  assert.equal(AFRICA_OPEN_GEO_SOURCES['nampost-postal-codes'].usage, 'primary');
  assert.match(AFRICA_OPEN_GEO_SOURCES['nampost-postal-codes'].notes, /Phase 1.*sorting\/delivery.*not administrative or geographic.*third digit.*zero.*not.*polygon/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['nampost-post-offices'].notes, /delivery-office identity.*not.*catchment.*customer address.*building/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['upu-namibia-addressing'].notes, /PO Box.*Private Bag.*six-digit delivery-point.*not.*current assignments.*address-to-building/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['nsa-namibia-geo-portal'].notes, /region.*constituency.*context.*not NamPost.*building/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['mawlr-namibia-survey-mapping'].notes, /cadastral.*parcel.*independent.*cannot prove.*owner.*occupant/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['namibia-constitution-article-13'].notes, /privacy.*precise private addresses.*query trails/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['namibia-access-to-information-act-2022'].notes, /individual address.*personal information.*not permission/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['namibia-data-protection-status-2026'].notes, /absence.*Data Protection Act.*not permission/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['osm-namibia'].license ?? '', /ODbL.*separate/i);
});

test('Namibia official catalog exposes the same assignment, non-geometry, building-rights and privacy boundaries', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('NA').map(source => [source.id, source]));
  for (const id of OFFICIAL) assert.ok(sources.has(id), id);
  assert.equal(sources.get('nampost-postal-codes')?.availability, 'web-search');
  assert.equal(sources.get('nampost-postal-codes')?.validationReadiness, 'reference-eligible');
  assert.equal(sources.get('nampost-post-offices')?.sourceRole, 'context-only');
  assert.equal(sources.get('upu-namibia-addressing')?.sourceRole, 'context-only');
  assert.equal(sources.get('nsa-namibia-geo-portal')?.depth, 'geo-only');
  assert.equal(sources.get('mawlr-namibia-survey-mapping')?.availability, 'commercial-or-restricted');
  assert.equal(sources.get('namibia-constitution-article-13')?.sourceRole, 'legal-framework-only');
  assert.equal(sources.get('namibia-access-to-information-act-2022')?.sourceRole, 'legal-framework-only');
  assert.equal(sources.get('namibia-data-protection-status-2026')?.sourceRole, 'legal-framework-only');
});
