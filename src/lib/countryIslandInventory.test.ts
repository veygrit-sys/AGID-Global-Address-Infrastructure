import test from 'node:test';
import assert from 'node:assert/strict';

import { buildCountryIslandInventory } from './countryIslandInventory';

test('records island counts and names by country from local AGID seed repositories', () => {
  const inventory = buildCountryIslandInventory();
  const countries = new Map(inventory.countries.map(country => [country.countryCode, country]));

  assert.ok(inventory.countryCount > 0);
  assert.ok(inventory.totalRecordedIslandAnchors >= 113);

  const marshall = countries.get('MH');
  assert.equal(marshall?.recordedIslandCount, 34);
  assert.equal(marshall?.claimScope, 'needs-authoritative-inventory');
  for (const name of ['Erikub Atoll', 'Jemo Island', 'Taka Atoll', 'Bikar Atoll', 'Bokak Atoll']) {
    assert.ok(marshall?.islandNames.includes(name), `MH inventory should include ${name}`);
  }

  const kiribati = countries.get('KI');
  assert.equal(kiribati?.recordedIslandCount, 33);
  assert.equal(kiribati?.claimScope, 'complete-all-islands');
  assert.equal(kiribati?.expectedIslandCount, 33);

  const faroe = countries.get('FO');
  assert.equal(faroe?.recordedIslandCount, 18);
  assert.equal(faroe?.claimScope, 'complete-main-islands');
  assert.equal(faroe?.expectedIslandCount, 18);
});

test('keeps island inventory non-claims explicit', () => {
  const inventory = buildCountryIslandInventory();

  assert.ok(inventory.nonClaims.some(claim => claim.includes('not an official total island count')));
  assert.ok(inventory.nonClaims.some(claim => claim.includes('no private address')));
  assert.ok(inventory.nonClaims.some(claim => claim.includes('authoritative per-country island inventory')));
});
