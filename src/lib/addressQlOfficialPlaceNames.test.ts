import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  buildAddressQlPlaceNameCatalogReceipt,
  compareAddressQlPlaceNameCatalogReceipts,
  evaluateAddressQlPlaceNameHoldout,
  rankAddressQlOfficialPlaceNameCandidates,
  validateAddressQlOfficialPlaceNameCatalog,
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

test('versioned official-name catalog passes strict evidence gates', () => {
  assert.deepEqual(
    validateAddressQlOfficialPlaceNameCatalog(fixture.catalog, NOW),
    [],
  );
  const receipt = buildAddressQlPlaceNameCatalogReceipt(fixture.catalog);
  assert.match(receipt.catalogDigest, /^sha256:[a-f0-9]{64}$/);
  assert.equal(receipt.sourceVersions.length, 5);
  assert.equal(receipt.placeNameDigests.length, 6);
});

test('administrative context resolves Japanese same-glyph readings safely', () => {
  const tokyo = rankAddressQlOfficialPlaceNameCandidates({
    catalog: fixture.catalog,
    countryCode: 'JP',
    query: '日本橋',
    targetLanguage: 'en',
    purpose: 'international-shipping',
    hierarchyLevel: 'locality',
    parentPlaceIds: ['jp-tokyo', 'jp-tokyo-chuo'],
    now: NOW,
  });
  const osaka = rankAddressQlOfficialPlaceNameCandidates({
    catalog: fixture.catalog,
    countryCode: 'JP',
    query: '日本橋',
    targetLanguage: 'en',
    purpose: 'international-shipping',
    hierarchyLevel: 'locality',
    parentPlaceIds: ['jp-osaka', 'jp-osaka-chuo'],
    now: NOW,
  });
  const ambiguous = rankAddressQlOfficialPlaceNameCandidates({
    catalog: fixture.catalog,
    countryCode: 'JP',
    query: '日本橋',
    targetLanguage: 'en',
    purpose: 'international-shipping',
    now: NOW,
  });

  assert.equal(tokyo.status, 'ranked');
  assert.equal(tokyo.candidates[0].displayName, 'Nihonbashi');
  assert.equal(osaka.status, 'ranked');
  assert.equal(osaka.candidates[0].displayName, 'Nipponbashi');
  assert.equal(ambiguous.status, 'ambiguous');
  assert.equal(ambiguous.automaticUseAllowed, false);
});

test('official Chinese regional aliases outrank generated readings', () => {
  const hongKong = rankAddressQlOfficialPlaceNameCandidates({
    catalog: fixture.catalog,
    countryCode: 'HK',
    query: '香港',
    targetLanguage: 'en',
    purpose: 'international-shipping',
    now: NOW,
  });

  assert.equal(hongKong.status, 'ranked');
  assert.equal(hongKong.candidates[0].displayName, 'Hong Kong');
  assert.equal(hongKong.candidates[0].displayNameKind, 'official-alias');
  assert.equal(hongKong.candidates[0].officialAliasPreferred, true);
  assert.equal(hongKong.candidates[0].generatedTransliterationUsed, false);
  assert.equal(hongKong.translationUsed, false);
});

test('country and hierarchy holdout emits aggregate metrics only', () => {
  const report = evaluateAddressQlPlaceNameHoldout({
    catalog: fixture.catalog,
    pack: fixture.holdout,
    now: NOW,
  });

  assert.equal(report.total, 8);
  assert.equal(report.correct, 8);
  assert.equal(report.top1Accuracy, 1);
  assert.equal(report.safeDeferralRate, 1);
  assert.equal(report.officialAliasPriorityPassed, 3);
  assert.equal(report.sameScriptDifferentReadingPassed, 4);
  assert.deepEqual(
    report.byCountry.map(item => item.key),
    ['CN', 'DE', 'GT', 'HK', 'JP'],
  );
  assert.equal(report.privacy.containsVectorText, false);
  assert.doesNotMatch(JSON.stringify(report), /日本橋|香港|München/);
});

test('top-one accuracy excludes expected safe deferrals from its denominator', () => {
  const pack: AddressQlPlaceNameHoldoutPack = structuredClone(fixture.holdout);
  pack.vectors = [pack.vectors[0], pack.vectors[2]];
  if (pack.vectors[0].expected.status !== 'ranked') {
    throw new Error('fixture ranked vector is missing');
  }
  pack.vectors[0].expected.displayName = 'Incorrect synthetic expectation';

  const report = evaluateAddressQlPlaceNameHoldout({
    catalog: fixture.catalog,
    pack,
    now: NOW,
  });

  assert.equal(report.correct, 1);
  assert.equal(report.top1Accuracy, 0);
  assert.equal(report.safeDeferralRate, 1);
});

test('catalog version changes identify sources and changed aliases', () => {
  const previous = buildAddressQlPlaceNameCatalogReceipt(fixture.catalog);
  const changed: AddressQlOfficialPlaceNameCatalog = structuredClone(
    fixture.catalog,
  );
  changed.catalogVersion = '2026.07.2';
  changed.sources[0].sourceVersion = '2026.07.2';
  changed.sources[0].datasetDigest = `sha256:${'f'.repeat(64)}`;
  changed.places[0].names[1].value = 'Nihon-bashi';
  const report = compareAddressQlPlaceNameCatalogReceipts(
    previous,
    buildAddressQlPlaceNameCatalogReceipt(changed),
  );

  assert.equal(report.requiresReview, true);
  assert.deepEqual(report.sourceVersionChanges, ['jp-place-source']);
  assert.deepEqual(report.changedPlaceNameIds, ['jp-tokyo-nihonbashi']);
});

test('expired evidence and address-like fields fail closed', () => {
  const expired: AddressQlOfficialPlaceNameCatalog = structuredClone(
    fixture.catalog,
  );
  expired.sources[0].validUntil = '2026-07-26T23:59:59Z';
  const result = rankAddressQlOfficialPlaceNameCandidates({
    catalog: expired,
    countryCode: 'JP',
    query: '日本橋',
    targetLanguage: 'en',
    purpose: 'international-shipping',
    hierarchyLevel: 'locality',
    parentPlaceIds: ['jp-tokyo', 'jp-tokyo-chuo'],
    now: NOW,
  });
  assert.equal(result.status, 'unmatched');

  const unsafe = {
    ...fixture.catalog,
    rawAddress: 'not accepted',
  } as AddressQlOfficialPlaceNameCatalog;
  assert.ok(
    validateAddressQlOfficialPlaceNameCatalog(unsafe, NOW)
      .includes('forbidden-sensitive-field'),
  );

  const invalidReuse: AddressQlOfficialPlaceNameCatalog = structuredClone(
    fixture.catalog,
  );
  invalidReuse.sources[0].reuseStatus = 'unverified-reuse' as
    AddressQlOfficialPlaceNameCatalog['sources'][number]['reuseStatus'];
  invalidReuse.sources[0].attestationVerified = true;
  invalidReuse.sources[0].holdoutVerified = true;
  assert.ok(
    validateAddressQlOfficialPlaceNameCatalog(invalidReuse, NOW)
      .includes('source:jp-place-source:reuse-status-invalid'),
  );
  assert.equal(
    rankAddressQlOfficialPlaceNameCandidates({
      catalog: invalidReuse,
      countryCode: 'JP',
      query: '日本橋',
      targetLanguage: 'en',
      purpose: 'international-shipping',
      now: NOW,
    }).status,
    'rejected-evidence',
  );
});
