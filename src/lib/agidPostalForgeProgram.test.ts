import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildAgidPostalCountryPack,
  type AgidPostalCountryPack,
} from './agidPostalCountryPack';
import {
  AGID_POSTAL_FORGE_PROGRAM_VERSION,
  buildAgidPostalForgeProgramPlan,
  evaluateAgidPostalForgeCountryPackRelease,
} from './agidPostalForgeProgram';

test('builds a maintainable Postal Forge country-pack program plan', () => {
  const plan = buildAgidPostalForgeProgramPlan({
    countryCodes: ['FJ', 'AE', 'SO'],
    maxCountriesPerRun: 2,
  });

  assert.equal(plan.version, AGID_POSTAL_FORGE_PROGRAM_VERSION);
  assert.equal(plan.centralIndex.repositoryName, 'agid-postal-country-index');
  assert.equal(plan.centralIndex.lazyLoadOnly, true);
  assert.equal(plan.centralIndex.containsPersonalData, false);
  assert.deepEqual(plan.centralIndex.countryCodes, ['AE', 'FJ', 'SO']);
  assert.equal(plan.qualitySummary.totalCountries, 3);
  assert.ok(plan.qualitySummary.byCoveragePolicy['no-postal-strong-geo'] >= 1);
  assert.ok(plan.qualitySummary.byCoveragePolicy['no-postal-weak-geo'] >= 1);
  assert.ok(plan.updateBatches.length >= 1);
  assert.ok(plan.updateBatches.every(batch => batch.countries.length <= 2));

  const fiji = plan.countryRepositories.find(record => record.countryCode === 'FJ');
  assert.ok(fiji);
  assert.equal(fiji.containsPersonalData, false);
  assert.equal(fiji.containsRawThirdPartyData, false);
  assert.equal(fiji.lazyLoad.countryPackPath, 'data/postal_country_packs/fj/agid-postal-country-pack.json');
  assert.equal(fiji.lazyLoad.suggestedDynamicImport, "import('@agid/agid-postal-pack-fj')");
  assert.ok(fiji.requiredFiles.includes('quality-evidence-index.json'));
  assert.ok(fiji.requiredFiles.includes('test-vectors.json'));
});

test('published Postal Forge country packs require official and operational approval', () => {
  const pack = buildAgidPostalCountryPack({ countryCode: 'FJ' });
  const release = evaluateAgidPostalForgeCountryPackRelease({
    pack,
    override: {
      countryCode: 'FJ',
      requestedStage: 'published',
      approvedActors: ['government', 'carrier'],
    },
  });

  assert.equal(release.requestedStage, 'published');
  assert.equal(release.effectiveStage, 'review');
  assert.equal(release.canPublish, false);
  assert.ok(release.blockers.includes('published-release-approval'));
  assert.ok(release.gates.some(gate => gate.id === 'published-release-approval' && !gate.passed));
});

test('deprecated Postal Forge country packs require successor mappings', () => {
  const pack = buildAgidPostalCountryPack({ countryCode: 'FJ' });
  const missingSuccessor = evaluateAgidPostalForgeCountryPackRelease({
    pack,
    override: {
      countryCode: 'FJ',
      requestedStage: 'deprecated',
    },
  });
  const withSuccessor = evaluateAgidPostalForgeCountryPackRelease({
    pack,
    override: {
      countryCode: 'FJ',
      requestedStage: 'deprecated',
      successorCode: 'FJ-BA-01',
    },
  });

  assert.equal(missingSuccessor.effectiveStage, 'review');
  assert.ok(missingSuccessor.blockers.includes('deprecated-release-successor'));
  assert.equal(withSuccessor.effectiveStage, 'deprecated');
  assert.equal(withSuccessor.transition.successorCode, 'FJ-BA-01');
});

test('published stage is allowed only after the pack leaves draft official status', () => {
  const base = buildAgidPostalCountryPack({ countryCode: 'FJ' });
  const pilotPack: AgidPostalCountryPack = {
    ...base,
    manifest: {
      ...base.manifest,
      officialStatus: 'supplementary',
    },
  };
  const release = evaluateAgidPostalForgeCountryPackRelease({
    pack: pilotPack,
    override: {
      countryCode: 'FJ',
      requestedStage: 'published',
      approvedActors: ['government', 'carrier'],
    },
  });

  assert.equal(release.effectiveStage, 'published');
  assert.equal(release.canPublish, true);
  assert.deepEqual(release.blockers, []);
});

test('program plan applies release overrides without mutating country packs', () => {
  const plan = buildAgidPostalForgeProgramPlan({
    countryCodes: ['FJ'],
    releaseOverrides: [{
      countryCode: 'FJ',
      requestedStage: 'deprecated',
      successorCode: 'FJ-RE-01',
      approvedActors: ['data-steward'],
    }],
  });
  const record = plan.countryRepositories[0];

  assert.equal(record.countryCode, 'FJ');
  assert.equal(record.publicationStage, 'deprecated');
  assert.equal(record.updateCadence, 'manual-review');
  assert.equal(record.release.transition.successorCode, 'FJ-RE-01');
  assert.equal(plan.qualitySummary.deprecated, 1);
});
