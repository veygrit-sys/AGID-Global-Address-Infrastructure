import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildAgidPostalCountryPackIndex,
  listAgidPostalCountryPackCandidates,
  recommendAgidPostalCountryPack,
} from './agidPostalCountryPackStrategy';

test('recommends a Fiji country pack for no-postal-code draft generation', () => {
  const recommendation = recommendAgidPostalCountryPack('FJ');

  assert.ok(recommendation);
  assert.equal(recommendation.repositoryMode, 'country-pack-recommended');
  assert.equal(recommendation.repositoryName, 'agid-postal-pack-fj');
  assert.equal(recommendation.packageName, '@agid/agid-postal-pack-fj');
  assert.equal(recommendation.recommendedUse, 'primary-agid-postal-draft');
  assert.ok(recommendation.requiredLayers.includes('locality-index'));
  assert.ok(recommendation.requiredLayers.includes('landform-index'));
  assert.ok(recommendation.requiredLayers.includes('ports-airports-and-terminals'));
  assert.ok(recommendation.requiredLayers.includes('vpl-seed-regions'));
  assert.ok(recommendation.preseededRecords.some(record => record.includes('stable locality IDs')));
});

test('keeps weak postal countries supplemental instead of primary replacement', () => {
  const panama = recommendAgidPostalCountryPack('PA');

  assert.ok(panama);
  assert.equal(panama.tier, 'weak-coarse-postal-code');
  assert.equal(panama.recommendedUse, 'supplemental-agid-postal-draft');
  assert.ok(panama.maintenanceRules.some(rule => rule.includes('simulation or draft')));
});

test('deduplicates overlapping country lists toward the safer high-risk tier', () => {
  const candidates = listAgidPostalCountryPackCandidates();
  const somaliaCandidate = candidates.find(candidate => candidate.countryCode === 'SO');
  const somalia = recommendAgidPostalCountryPack('SO');

  assert.ok(somaliaCandidate);
  assert.equal(somaliaCandidate.tier, 'fragile-address-infrastructure');
  assert.ok(somalia);
  assert.equal(somalia.recommendedUse, 'high-risk-coarse-draft');
  assert.equal(somalia.packWeight, 'thin-pack');
  assert.ok(somalia.preseededRecords.some(record => record.includes('high-risk safety defaults')));
});

test('rapid-growth countries get heavier packs with future capacity records', () => {
  const nigeria = recommendAgidPostalCountryPack('NG');

  assert.ok(nigeria);
  assert.equal(nigeria.tier, 'rapid-growth-address-pressure');
  assert.equal(nigeria.packWeight, 'heavy-pack');
  assert.equal(nigeria.recommendedUse, 'growth-pressure-supplement');
  assert.ok(nigeria.preseededRecords.some(record => record.includes('future capacity reserves')));
});

test('country pack compatibility contract excludes raw personal and unlicensed third-party data', () => {
  const recommendation = recommendAgidPostalCountryPack('AE');

  assert.ok(recommendation);
  assert.deepEqual(recommendation.compatibilityContract.countryPackDoesNotContain, [
    'personal-addresses',
    'recipient-names',
    'phone-numbers',
    'private-aoid-bodies',
    'agid-s-payloads',
    'raw-third-party-datasets-without-license',
  ]);
  assert.ok(recommendation.requiredLayers.includes('license-ledger'));
  assert.ok(recommendation.requiredLayers.includes('privacy-threat-model'));
});

test('builds a repository index for all supplied no-postal, weak, fragile, and growth countries', () => {
  const index = buildAgidPostalCountryPackIndex();

  assert.ok(index.totalCountries >= 45);
  assert.ok(index.byTier.noOrNotRequiredPostalCode >= 30);
  assert.ok(index.byTier.weakCoarsePostalCode >= 3);
  assert.ok(index.byTier.fragileAddressInfrastructure >= 4);
  assert.ok(index.byTier.rapidGrowthAddressPressure >= 5);
  assert.ok(index.byRegion.Oceania >= 5);
  assert.ok(index.byPackWeight['thin-pack'] >= 1);
  assert.equal(index.repositoryByCountryCode.FJ.repositoryName, 'agid-postal-pack-fj');
  assert.equal(index.repositoryByCountryCode.SO.recommendedUse, 'high-risk-coarse-draft');
  assert.ok(index.repositories.some(repository => repository.repositoryName === 'agid-postal-pack-fj'));
  assert.ok(index.repositories.every(repository => repository.packageName.startsWith('@agid/agid-postal-pack-')));
});

test('returns defensive copies for precomputed candidates and recommendations', () => {
  const candidates = listAgidPostalCountryPackCandidates();
  candidates[0].countryCode = 'XX';
  assert.notEqual(listAgidPostalCountryPackCandidates()[0].countryCode, 'XX');

  const firstRecommendation = recommendAgidPostalCountryPack('FJ');
  assert.ok(firstRecommendation);
  firstRecommendation.requiredLayers.push('road-and-route-corridors');
  firstRecommendation.compatibilityContract.countryPackDoesNotContain.push('phone-numbers');

  const secondRecommendation = recommendAgidPostalCountryPack('FJ');
  assert.ok(secondRecommendation);
  assert.equal(
    secondRecommendation.requiredLayers.filter(layer => layer === 'road-and-route-corridors').length,
    0,
  );
  assert.equal(
    secondRecommendation.compatibilityContract.countryPackDoesNotContain.filter(item => item === 'phone-numbers').length,
    1,
  );
});

test('returns defensive copies for the precomputed country pack index', () => {
  const firstIndex = buildAgidPostalCountryPackIndex();
  firstIndex.byRegion.Oceania = 0;
  firstIndex.byPackWeight['thin-pack'] = 0;
  firstIndex.repositoryByCountryCode.FJ.repositoryName = 'mutated';
  firstIndex.repositories[0].packageName = 'mutated';

  const secondIndex = buildAgidPostalCountryPackIndex();
  assert.ok(secondIndex.byRegion.Oceania >= 5);
  assert.ok(secondIndex.byPackWeight['thin-pack'] >= 1);
  assert.equal(secondIndex.repositoryByCountryCode.FJ.repositoryName, 'agid-postal-pack-fj');
  assert.ok(secondIndex.repositories.every(repository => repository.packageName.startsWith('@agid/')));
});
