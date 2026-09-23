import assert from 'node:assert/strict';
import { afterEach,test } from 'node:test';

import { fetchPolarContext,fetchPolarOfficialData } from './PolarService';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test('polar context exposes open geodata sources for Antarctic natural features', async () => {
  globalThis.fetch = async () => new Response('[]', { status: 404 });

  const context = await fetchPolarContext(-75, 45);

  assert.ok(context, 'Antarctic coordinates should return polar context');
  assert.ok(context.openSourceIds?.includes('rema-antarctica'));
  assert.ok(context.openSourceIds?.includes('ibcso-southern-ocean'));
  assert.ok(context.naturalSources?.some(source => source.id === 'bedmap3-antarctica'));
  assert.ok(context.facilitySources?.some(source => source.id === 'comnap-antarctic-facilities'));
  assert.match(context.seaIce ?? '', /NSIDC/);
  assert.match(context.bathymetry ?? '', /IBCSO|GEBCO/);
});

test('polar context includes nearby Antarctic research facilities from local station JSON', async () => {
  globalThis.fetch = async () => new Response('[]', { status: 404 });

  const context = await fetchPolarContext(-77.85, 166.67);

  assert.ok(context, 'McMurdo-area coordinates should return polar context');
  assert.ok(context.researchFacilities?.some(facility => facility.name.includes('McMurdo')));
  assert.ok(context.features.some(feature => feature.name.includes('McMurdo')));
});

test('polar official data falls back to local Antarctic station JSON when Overpass is empty', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ elements: [] }), { status: 200 });

  const officialData = await fetchPolarOfficialData(-77.85, 166.67);

  assert.equal(officialData?.address.research_station, 'McMurdo');
  assert.equal(officialData?.address.source, 'antarcticResearchStations.json');
  assert.ok(officialData?.address.distance_meters < 10000);
});

test('polar context exposes Arctic DEM and ocean sources for Arctic natural features', async () => {
  globalThis.fetch = async () => new Response('[]', { status: 404 });

  const context = await fetchPolarContext(78, 15);

  assert.ok(context, 'Arctic coordinates should return polar context');
  assert.ok(context.openSourceIds?.includes('arcticdem'));
  assert.ok(context.openSourceIds?.includes('ibcao-arctic-ocean'));
  assert.ok(context.naturalSources?.some(source => source.id === 'glims-glacier-db'));
  assert.match(context.bathymetry ?? '', /IBCAO|GEBCO/);
});
