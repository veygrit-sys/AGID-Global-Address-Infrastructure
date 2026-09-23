import test from 'node:test';
import assert from 'node:assert/strict';

import placement from '../../data/global_entities/agid-repository-placement.json' assert { type: 'json' };
import {
  buildUsStateRepositoryPacks,
  summarizeUsStateRepositoryPacks,
  validateUsStateRepositoryPacks,
} from './usStateRepositoryPacks';

test('builds GitHub-ready packs for all 50 US states', () => {
  const packs = buildUsStateRepositoryPacks();
  const errors = validateUsStateRepositoryPacks(packs);

  assert.deepEqual(errors, []);
  assert.equal(packs.length, 50);
  assert.equal(new Set(packs.map(pack => pack.repository)).size, 50);
  assert.ok(packs.some(pack => pack.repository === 'agid-us-california'));
  assert.ok(packs.some(pack => pack.repository === 'agid-us-texas'));
  assert.ok(packs.some(pack => pack.repository === 'agid-us-new-york'));
  assert.ok(packs.some(pack => pack.repository === 'agid-us-wyoming'));
});

test('keeps every state pack safe for public open-source release', () => {
  const packs = buildUsStateRepositoryPacks();

  for (const pack of packs) {
    assert.equal(pack.parentRepository, 'agid-country-us');
    assert.equal(pack.privacyBoundary.containsPersonalData, false);
    assert.equal(pack.privacyBoundary.containsRawAddresses, false);
    assert.equal(pack.privacyBoundary.containsProofSecrets, false);
    assert.ok(pack.qualityGates.includes('no-raw-personal-addresses'));
    assert.ok(pack.nonClaims.some(claim => claim.includes('Not a complete address dataset')));
    assert.ok(pack.sources.some(source => source.sourceId === 'usps-web-tools' && source.redistribution === 'not-bundled'));
  }
});

test('matches the planned US state repositories in the global placement index', () => {
  const countries = placement.continents.flatMap(continent =>
    continent.regions.flatMap(region => region.countries),
  );
  const planned = new Set(
    countries
      .find(country => country.code === 'US')
      ?.recommendedChildren.filter(repository => repository.startsWith('agid-us-'))
      .filter(repository => !['district-of-columbia', 'puerto-rico', 'guam', 'us-virgin-islands', 'american-samoa', 'northern-mariana-islands'].some(suffix => repository.endsWith(suffix)))
      .filter(repository => !repository.endsWith('-city')) ?? [],
  );
  const built = new Set(buildUsStateRepositoryPacks().map(pack => pack.repository));

  for (const repository of built) {
    assert.ok(planned.has(repository), `${repository} missing from global placement index`);
  }
});

test('summarizes geodata and gazetteer seed coverage', () => {
  const summary = summarizeUsStateRepositoryPacks();

  assert.equal(summary.stateRepositoryCount, 50);
  assert.equal(summary.geodataSeedCount, 50);
  assert.ok(summary.placeSeedCount >= 250);
  assert.deepEqual(summary.sourceIds, [
    'openstreetmap',
    'us-census-geocoder',
    'us-census-tiger-line',
    'usgs-gnis',
    'usps-web-tools',
  ]);
});
