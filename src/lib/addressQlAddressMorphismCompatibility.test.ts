import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  ADDRESSQL_ADDRESS_MORPHISM_COMPATIBILITY_VERSION,
  projectAddressQlPlaceNameRankingToMorphism,
} from './addressQlAddressMorphismCompatibility';
import {
  rankAddressQlOfficialPlaceNameCandidates,
  type AddressQlOfficialPlaceNameCatalog,
  type AddressQlPlaceNameHoldoutPack,
} from './addressQlOfficialPlaceNames';

const FIXTURE_PATH =
  'docs/specs/fixtures/addressql-official-place-name-conformance-v1.json';
const NOW = '2026-07-27T00:00:00Z';
const fixture = JSON.parse(readFileSync(FIXTURE_PATH, 'utf8')) as {
  catalog: AddressQlOfficialPlaceNameCatalog;
  holdout: AddressQlPlaceNameHoldoutPack;
};

test('projects a source-backed official place-name ranking without retaining its query', () => {
  const ranking = rankAddressQlOfficialPlaceNameCandidates({
    catalog: fixture.catalog,
    countryCode: 'JP',
    query: '日本橋',
    targetLanguage: 'en',
    purpose: 'international-shipping',
    hierarchyLevel: 'locality',
    parentPlaceIds: ['jp-tokyo', 'jp-tokyo-chuo'],
    now: NOW,
  });
  const report = projectAddressQlPlaceNameRankingToMorphism({
    catalog: fixture.catalog,
    ranking,
    now: NOW,
  });

  assert.equal(report.version, ADDRESSQL_ADDRESS_MORPHISM_COMPATIBILITY_VERSION);
  assert.equal(report.catalog.evidenceIntegrity, 'verified');
  assert.equal(report.candidateSet.rankingStatus, 'ranked');
  assert.deepEqual(report.candidateSet.candidatePlaceIds, ['jp-tokyo-nihonbashi']);
  assert.equal(report.candidateSet.coverageState, 'not-established');
  assert.equal(report.candidateSet.policy.state, 'source_insufficient');
  assert.equal(report.candidateSet.policy.canEnterResolution, false);
  assert.equal(report.candidateSet.policy.identityDecisionAllowed, false);
  assert.equal(report.resolution.conclusion, 'resolved');
  assert.equal(report.resolution.operationalDecision, 'manual-review');
  assert.equal(report.resolution.translationPerformed, false);
  assert.equal(report.resolution.automaticUseAllowed, false);
  assert.equal(report.preservation.officialNameAuthority, 'preserved');
  assert.equal(report.disclosure.queryEchoed, false);
  assert.equal(report.disclosure.privateDeliveryDataHandled, false);
  assert.equal(report.disclosure.agidIssued, false);
  assert.equal(report.disclosure.aoidHandled, false);
  assert.doesNotMatch(JSON.stringify(report), /日本橋|Nihonbashi/);
});

test('turns missing administrative context into a non-automatic query for context', () => {
  const ranking = rankAddressQlOfficialPlaceNameCandidates({
    catalog: fixture.catalog,
    countryCode: 'JP',
    query: '日本橋',
    targetLanguage: 'en',
    purpose: 'international-shipping',
    now: NOW,
  });
  const report = projectAddressQlPlaceNameRankingToMorphism({
    catalog: fixture.catalog,
    ranking,
    now: NOW,
  });

  assert.equal(report.candidateSet.rankingStatus, 'ambiguous');
  assert.equal(report.candidateSet.coverageState, 'ambiguous');
  assert.equal(report.resolution.conclusion, 'ambiguous');
  assert.equal(report.resolution.operationalDecision, 'request-administrative-context');
  assert.ok(report.loss.reasons.includes('administrative-context-required'));
});

test('fails closed when a ranking cannot be bound to the supplied catalog receipt', () => {
  const ranking = rankAddressQlOfficialPlaceNameCandidates({
    catalog: fixture.catalog,
    countryCode: 'HK',
    query: '香港',
    targetLanguage: 'en',
    purpose: 'international-shipping',
    now: NOW,
  });
  const mismatched = {
    ...ranking,
    catalogDigest: `sha256:${'0'.repeat(64)}`,
  };
  const report = projectAddressQlPlaceNameRankingToMorphism({
    catalog: fixture.catalog,
    ranking: mismatched,
    now: NOW,
  });

  assert.equal(report.catalog.evidenceIntegrity, 'rejected');
  assert.equal(report.candidateSet.rankingStatus, 'rejected-evidence');
  assert.equal(report.candidateSet.candidateCount, 0);
  assert.equal(report.candidateSet.policy.state, 'normalization_insufficient');
  assert.equal(report.resolution.operationalDecision, 'stop');
  assert.equal(report.evidence.sources.length, 0);
  assert.ok(report.loss.reasons.includes('evidence-rejected'));
});
