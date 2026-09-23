import assert from 'node:assert/strict';
import {
  generateKeyPairSync,
  sign,
  type KeyObject,
} from 'node:crypto';
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  ADDRESSQL_PRACTICAL_API_LIMITS,
  ADDRESSQL_PRACTICAL_API_VERSION,
  createAddressQlPracticalApi,
} from './addressQlPracticalApi';
import type { AddressQlOfficialPlaceNameCatalog } from './addressQlOfficialPlaceNames';
import type { AddressQlRuntimeAdapter } from './addressQlRuntimeAdapter';
import {
  ADDRESSQL_CARRIER_TRUST_STORE_VERSION,
  ADDRESSQL_L5_CARRIER_ASSERTION_VERSION,
  ADDRESSQL_L5_DELIVERY_POINT_REQUEST_VERSION,
  buildAddressQlL5CarrierAssertionPayload,
  loadAddressQlDeliveryPointVerifier,
  type AddressQlL5CarrierAssertion,
} from './addressQlDeliveryPointDecision';

const api = createAddressQlPracticalApi(process.cwd(), {
  now: '2026-07-26T00:00:00Z',
});
const placeNameCatalog = (
  JSON.parse(readFileSync(
    'docs/specs/fixtures/addressql-official-place-name-conformance-v1.json',
    'utf8',
  )) as { catalog: AddressQlOfficialPlaceNameCatalog }
).catalog;
const placeNameApi = createAddressQlPracticalApi(process.cwd(), {
  now: '2026-07-27T00:00:00Z',
  placeNameCatalog,
});

const runtimeDigest = (character: string) => `sha256:${character.repeat(64)}`;

function runtimeAdapter(
  mode: AddressQlRuntimeAdapter['mode'],
): AddressQlRuntimeAdapter {
  return {
    id: 'jp-postal-runtime-fixture',
    version: 'v1',
    mode,
    countryCodes: ['JP'],
    purposes: ['existence'],
    evidence: {
      sourceId: 'jp-postal-runtime-source',
      sourceVersion: 'fixture-v1',
      reuseRights: 'Synthetic conformance fixture',
      coverageStatement: 'Synthetic postal existence adapter for API tests.',
      correctionUrl: 'https://example.invalid/addressql-corrections',
      retrievedAt: '2026-07-01T00:00:00Z',
      validUntil: '2027-07-01T00:00:00Z',
      datasetDigest: runtimeDigest('b'),
      holdoutDigest: runtimeDigest('c'),
      reportDigest: runtimeDigest('d'),
      attestationKeyId: 'fixture-reviewer',
      attestationSignature: 'synthetic-signature',
    },
    evaluate: input => ({
      status: input.postalCode === '100-0001' ? 'pass' : 'fail',
      confidence: 0.99,
      reasonCode: 'postal_source_exact_match',
    }),
  };
}

function l5Fixture() {
  const directory = mkdtempSync(join(tmpdir(), 'addressql-api-l5-'));
  const carrierA = generateKeyPairSync('ed25519');
  const carrierB = generateKeyPairSync('ed25519');
  const trustStorePath = join(directory, 'carrier-trust.json');
  const publicPem = (key: KeyObject) =>
    key.export({ type: 'spki', format: 'pem' }).toString();
  writeFileSync(trustStorePath, `${JSON.stringify({
    version: ADDRESSQL_CARRIER_TRUST_STORE_VERSION,
    keys: {
      'carrier-a-key': {
        carrierId: 'carrier-a',
        countryCodes: ['JP'],
        publicKey: publicPem(carrierA.publicKey),
        status: 'active',
        validFrom: '2026-07-01T00:00:00Z',
        validUntil: '2027-07-01T00:00:00Z',
      },
      'carrier-b-key': {
        carrierId: 'carrier-b',
        countryCodes: ['JP'],
        publicKey: publicPem(carrierB.publicKey),
        status: 'active',
        validFrom: '2026-07-01T00:00:00Z',
        validUntil: '2027-07-01T00:00:00Z',
      },
    },
  }, null, 2)}\n`);
  const commitment = runtimeDigest('e');
  const signed = (
    carrierId: string,
    keyId: string,
    privateKey: KeyObject,
    decision: AddressQlL5CarrierAssertion['decision'],
  ): AddressQlL5CarrierAssertion => {
    const unsigned: Omit<AddressQlL5CarrierAssertion, 'signature'> = {
      version: ADDRESSQL_L5_CARRIER_ASSERTION_VERSION,
      assertionId: `${carrierId}-api-assertion`,
      carrierId,
      keyId,
      countryCode: 'JP',
      deliveryPointCommitment: commitment,
      serviceLevel: 'standard',
      decision,
      sourceVersion: 'synthetic-api-v1',
      evidenceDigest: runtimeDigest(carrierId === 'carrier-a' ? 'f' : '9'),
      assessedAt: '2026-07-26T23:55:00Z',
      expiresAt: '2026-07-27T01:00:00Z',
    };
    return {
      ...unsigned,
      signature: sign(
        null,
        Buffer.from(buildAddressQlL5CarrierAssertionPayload(unsigned), 'utf8'),
        privateKey,
      ).toString('base64'),
    };
  };
  return {
    api: createAddressQlPracticalApi(process.cwd(), {
      now: '2026-07-27T00:00:00Z',
      deliveryPointVerifier: loadAddressQlDeliveryPointVerifier(
        trustStorePath,
        { now: '2026-07-27T00:00:00Z' },
      ),
    }),
    commitment,
    carrierA,
    carrierB,
    signed,
    cleanup: () => rmSync(directory, { recursive: true, force: true }),
  };
}

test('P1 practical API starts with complete country coverage and no L2/L5 overclaim', () => {
  const health = api.handle({ method: 'GET', path: '/v1/health' });
  const countries = api.handle({ method: 'GET', path: '/v1/countries' });

  assert.equal(api.version, ADDRESSQL_PRACTICAL_API_VERSION);
  assert.equal(api.profileCount, 276);
  assert.equal(health.statusCode, 200);
  assert.equal(health.body.profileCount, 276);
  assert.equal(health.body.postalExistenceEnabledProfiles, 0);
  assert.equal(health.body.deliveryPointEnabledProfiles, 0);
  assert.equal(health.body.dataPromotionReviewCandidateProfiles, 4);
  assert.equal(health.body.dataPromotionEnabledProfiles, 0);
  assert.equal(health.body.multilingualNativeFormatEnabledProfiles, 271);
  assert.equal(health.body.multilingualInternationalEnglishFormatEnabledProfiles, 271);
  assert.equal(health.body.automaticPlaceNameTranslationEnabledProfiles, 0);
  assert.equal(countries.statusCode, 200);
  assert.equal(countries.body.count, 276);
});

test('P1 format validation normalizes bounded input without reflecting the postal code', () => {
  const output = api.handle({
    method: 'POST',
    path: '/v1/postal/validate',
    headers: { 'X-Request-Id': 'test.jp-format-1' },
    body: {
      countryCode: 'jp',
      postalCode: '１０００００１',
      purpose: 'format',
      requestId: 'test.jp-format-1',
    },
  });
  const serialized = JSON.stringify(output.body);
  const validation = output.body.validation as Record<string, unknown>;
  const capability = output.body.capability as Record<string, unknown>;

  assert.equal(output.statusCode, 200);
  assert.equal(output.body.countryCode, 'JP');
  assert.equal(output.body.requestId, 'test.jp-format-1');
  assert.equal(output.body.highestEnabledLevel, 'L1');
  assert.equal(validation.status, 'pass');
  assert.equal(validation.purpose, 'format');
  assert.equal(capability.requestedLevel, 'L1');
  assert.equal(capability.state, 'enabled');
  assert.doesNotMatch(serialized, /100-0001|1000001|１０００００１/);
  assert.doesNotMatch(serialized, /"postalCode"|"rawAddress"|"street"|"premise"/i);
});

test('P1 existence and delivery requests fail closed with machine-readable evidence gaps', () => {
  const existence = api.handle({
    method: 'POST',
    path: '/v1/postal/validate',
    body: { countryCode: 'JP', postalCode: '100-0001', purpose: 'existence' },
  });
  const delivery = api.handle({
    method: 'POST',
    path: '/v1/postal/validate',
    body: { countryCode: 'JP', postalCode: '100-0001', purpose: 'delivery' },
  });
  const existenceValidation = existence.body.validation as Record<string, unknown>;
  const existenceCapability = existence.body.capability as Record<string, unknown>;
  const deliveryValidation = delivery.body.validation as Record<string, unknown>;
  const deliveryCapability = delivery.body.capability as Record<string, unknown>;

  assert.equal(existence.statusCode, 200);
  assert.equal(existenceValidation.status, 'unknown');
  assert.equal(existenceCapability.requestedLevel, 'L2');
  assert.equal(existenceCapability.state, 'blocked');
  assert.deepEqual(existenceCapability.missingEvidence, [
    'correction-path',
    'coverage-statement',
    'freshness-window',
    'independent-signature',
    'reuse-rights',
    'runtime-adapter',
    'source-identity',
    'source-version',
    'synthetic-holdout',
  ]);

  assert.equal(deliveryValidation.status, 'unknown');
  assert.equal(deliveryCapability.requestedLevel, 'L4');
  assert.equal(deliveryCapability.state, 'blocked');
  assert.ok((deliveryCapability.missingEvidence as string[]).includes('delivery-area-source'));
});

test('P1 keeps L4 area checks separate from signed L5 point decisions', () => {
  const files = l5Fixture();
  try {
    const l4 = files.api.handle({
      method: 'POST',
      path: '/v1/postal/validate',
      body: { countryCode: 'JP', postalCode: '100-0001', purpose: 'delivery' },
    });
    const l5 = files.api.handle({
      method: 'POST',
      path: '/v1/delivery-points/assess',
      body: {
        version: ADDRESSQL_L5_DELIVERY_POINT_REQUEST_VERSION,
        countryCode: 'JP',
        deliveryPointCommitment: files.commitment,
        serviceLevel: 'standard',
        assertions: [
          files.signed(
            'carrier-a',
            'carrier-a-key',
            files.carrierA.privateKey,
            'reachable',
          ),
        ],
      },
    });
    const l5Capability = l5.body.capability as Record<string, unknown>;
    const l5Decision = l5.body.decision as Record<string, unknown>;

    assert.equal(
      (l4.body.capability as Record<string, unknown>).requestedLevel,
      'L4',
    );
    assert.equal(l5.statusCode, 200);
    assert.equal(l5Capability.requestedLevel, 'L5');
    assert.equal(l5Capability.scope, 'delivery-point');
    assert.equal(l5Capability.l4DeliveryAreaEvaluated, false);
    assert.equal(l5Decision.status, 'pass');
    assert.equal(l5Decision.signatureVerified, true);
    assert.doesNotMatch(JSON.stringify(l5.body), new RegExp(files.commitment));
  } finally {
    files.cleanup();
  }
});

test('P1 stops signed L5 processing on carrier disagreement', () => {
  const files = l5Fixture();
  try {
    const output = files.api.handle({
      method: 'POST',
      path: '/v1/delivery-points/assess',
      body: {
        version: ADDRESSQL_L5_DELIVERY_POINT_REQUEST_VERSION,
        countryCode: 'JP',
        deliveryPointCommitment: files.commitment,
        serviceLevel: 'standard',
        assertions: [
          files.signed(
            'carrier-a',
            'carrier-a-key',
            files.carrierA.privateKey,
            'reachable',
          ),
          files.signed(
            'carrier-b',
            'carrier-b-key',
            files.carrierB.privateKey,
            'unreachable',
          ),
        ],
      },
    });
    const decision = output.body.decision as Record<string, unknown>;

    assert.equal(output.statusCode, 200);
    assert.equal(decision.status, 'conflict');
    assert.equal(decision.processingDirective, 'stop_conflict');
    assert.equal(decision.stopProcessing, true);
  } finally {
    files.cleanup();
  }
});

test('P1 signed L5 endpoint rejects raw address fields and fails closed without trust', () => {
  const unconfigured = api.handle({
    method: 'POST',
    path: '/v1/delivery-points/assess',
    body: {},
  });
  const files = l5Fixture();
  try {
    const unsafe = files.api.handle({
      method: 'POST',
      path: '/v1/delivery-points/assess',
      body: {
        version: ADDRESSQL_L5_DELIVERY_POINT_REQUEST_VERSION,
        countryCode: 'JP',
        deliveryPointCommitment: files.commitment,
        serviceLevel: 'standard',
        assertions: [],
        rawAddress: 'not accepted',
      },
    });

    assert.equal(unconfigured.statusCode, 503);
    assert.equal(
      (unconfigured.body.error as Record<string, unknown>).code,
      'l5_verifier_not_configured',
    );
    assert.equal(unsafe.statusCode, 400);
    assert.equal(
      (unsafe.body.error as Record<string, unknown>).code,
      'invalid_l5_contract',
    );
  } finally {
    files.cleanup();
  }
});

test('P1 executes independently attested runtime adapters without reflecting inputs', () => {
  const runtimeApi = createAddressQlPracticalApi(process.cwd(), {
    now: '2026-07-26T00:00:00Z',
    runtimeAdapters: [runtimeAdapter('approved')],
    verifyIndependentAttestation: evidence =>
      evidence.attestationKeyId === 'fixture-reviewer',
  });
  const output = runtimeApi.handle({
    method: 'POST',
    path: '/v1/postal/validate',
    body: {
      countryCode: 'JP',
      postalCode: '100-0001',
      purpose: 'existence',
    },
  });
  const validation = output.body.validation as Record<string, unknown>;
  const capability = output.body.capability as Record<string, unknown>;
  const countryCapabilities = runtimeApi.handle({
    method: 'GET',
    path: '/v1/countries/JP/capabilities',
  });
  const countryPromotions = runtimeApi.handle({
    method: 'GET',
    path: '/v1/countries/JP/promotions',
  });
  const promotionSummary = runtimeApi.handle({
    method: 'GET',
    path: '/v1/promotions',
  });
  const health = runtimeApi.handle({ method: 'GET', path: '/v1/health' });
  const l2Capability = (
    countryCapabilities.body.capabilities as Array<Record<string, unknown>>
  ).find(item => item.level === 'L2')!;
  const l2Promotion = (
    countryPromotions.body.targets as Array<Record<string, unknown>>
  ).find(item => item.level === 'L2')!;
  const serialized = JSON.stringify(output.body);

  assert.equal(validation.status, 'pass');
  assert.equal(validation.evidence_level, 'independently_attested');
  assert.equal(capability.state, 'enabled');
  assert.equal(capability.liveRuntimeEvidence, true);
  assert.deepEqual(capability.missingEvidence, []);
  assert.deepEqual(capability.adapterIds, ['jp-postal-runtime-fixture']);
  assert.equal(
    (countryCapabilities.body.country as Record<string, unknown>)
      .highestEnabledLevel,
    'L2',
  );
  assert.equal(l2Capability.state, 'enabled');
  assert.equal(l2Capability.evidenceLevel, 'independently_attested');
  assert.equal(countryPromotions.body.highestEnabledLevel, 'L2');
  assert.equal(l2Promotion.state, 'enabled');
  assert.equal(l2Promotion.independentAttestationVerified, true);
  assert.deepEqual(promotionSummary.body.enabledCountryCodes, ['JP']);
  assert.equal(
    (promotionSummary.body.enabledByLevel as Record<string, unknown>).L2,
    1,
  );
  assert.equal(health.body.postalExistenceEnabledProfiles, 1);
  assert.equal(health.body.dataPromotionEnabledProfiles, 1);
  assert.doesNotMatch(serialized, /100-0001/);
});

test('P1 can test conformance adapters without promoting live capability', () => {
  const conformanceApi = createAddressQlPracticalApi(process.cwd(), {
    now: '2026-07-26T00:00:00Z',
    runtimeAdapters: [runtimeAdapter('conformance')],
    allowConformanceAdapters: true,
  });
  const output = conformanceApi.handle({
    method: 'POST',
    path: '/v1/postal/validate',
    body: {
      countryCode: 'JP',
      postalCode: '100-0001',
      purpose: 'existence',
    },
  });
  const validation = output.body.validation as Record<string, unknown>;
  const capability = output.body.capability as Record<string, unknown>;

  assert.equal(validation.status, 'unknown');
  assert.equal(validation.evidence_level, 'synthetic_conformance');
  assert.equal(
    (validation.field_results as Array<Record<string, unknown>>)[1].reason_code,
    'existence_conformance_adapter_not_live',
  );
  assert.equal(capability.state, 'blocked');
  assert.equal(capability.liveRuntimeEvidence, false);
});

test('P1 no-postal policy and capability endpoint remain explicit', () => {
  const empty = api.handle({
    method: 'POST',
    path: '/v1/postal/validate',
    body: { countryCode: 'HK', postalCode: '', purpose: 'format' },
  });
  const invented = api.handle({
    method: 'POST',
    path: '/v1/postal/validate',
    body: { countryCode: 'HK', postalCode: '00000', purpose: 'format' },
  });
  const capability = api.handle({
    method: 'GET',
    path: '/v1/countries/HK/capabilities',
  });

  assert.equal((empty.body.validation as Record<string, unknown>).status, 'not_applicable');
  assert.equal((invented.body.validation as Record<string, unknown>).status, 'fail');
  assert.equal(capability.statusCode, 200);
  assert.equal((capability.body.country as Record<string, unknown>).postalStatus, 'no_postal_code');
  assert.equal((capability.body.country as Record<string, unknown>).highestEnabledLevel, 'L1');
});

test('P1 rejects unsafe fields, identifiers, unknown countries, and oversized batches', () => {
  const rawAddress = api.handle({
    method: 'POST',
    path: '/v1/postal/validate',
    body: { countryCode: 'JP', postalCode: '100-0001', address: 'not accepted' },
  });
  const confusableId = api.handle({
    method: 'POST',
    path: '/v1/postal/validate',
    body: { countryCode: 'JP', postalCode: '100-0001', requestId: 'rev\u0456ewer' },
  });
  const unknown = api.handle({
    method: 'POST',
    path: '/v1/postal/validate',
    body: { countryCode: 'ZZ', postalCode: '00000' },
  });
  const malformedPath = api.handle({
    method: 'GET',
    path: '/v1/countries/%/capabilities',
  });
  const oversized = api.handle({
    method: 'POST',
    path: '/v1/postal/validate/batch',
    body: {
      requests: Array.from(
        { length: ADDRESSQL_PRACTICAL_API_LIMITS.maxBatchSize + 1 },
        () => ({ countryCode: 'JP', postalCode: '100-0001' }),
      ),
    },
  });

  assert.equal(rawAddress.statusCode, 400);
  assert.equal((rawAddress.body.error as Record<string, unknown>).code, 'unknown_field');
  assert.equal(confusableId.statusCode, 400);
  assert.equal((confusableId.body.error as Record<string, unknown>).code, 'invalid_request_id');
  assert.equal(unknown.statusCode, 404);
  assert.equal(malformedPath.statusCode, 400);
  assert.equal(oversized.statusCode, 413);
});

test('P1 batch validation isolates item errors and OpenAPI publishes the same routes', () => {
  const batch = api.handle({
    method: 'POST',
    path: '/v1/postal/validate/batch',
    body: {
      requests: [
        { countryCode: 'JP', postalCode: '100-0001' },
        { countryCode: 'ZZ', postalCode: '00000' },
      ],
    },
  });
  const openApi = JSON.parse(
    readFileSync('docs/specs/openapi/addressql-practical-api-v1.openapi.json', 'utf8'),
  ) as { paths: Record<string, unknown>; components: { schemas: Record<string, unknown> } };

  assert.equal(batch.statusCode, 200);
  assert.equal(batch.body.count, 2);
  assert.deepEqual(
    (batch.body.results as Array<Record<string, unknown>>).map(result => result.statusCode),
    [200, 404],
  );
  for (const path of [
    '/v1/health',
    '/v1/countries',
    '/v1/countries/{countryCode}/capabilities',
    '/v1/countries/{countryCode}/promotions',
    '/v1/countries/{countryCode}/languages',
    '/v1/promotions',
    '/v1/multilingual',
    '/v1/multilingual/assess',
    '/v1/place-names/rank',
    '/v1/delivery-points/assess',
    '/v1/postal/validate',
    '/v1/postal/validate/batch',
  ]) {
    assert.ok(openApi.paths[path], `${path} missing from OpenAPI`);
  }
  const placeNameResponse = openApi.components.schemas.PlaceNameRankingResponse as {
    properties?: Record<string, unknown>;
  };
  assert.ok(placeNameResponse.properties?.addressMorphism);
  assert.doesNotMatch(JSON.stringify(openApi.components.schemas), /rawAddress|recipient|street|premise/);
});

test('P2 promotion endpoints expose exact country blockers without enabling validation', () => {
  const summary = api.handle({ method: 'GET', path: '/v1/promotions' });
  const gt = api.handle({
    method: 'GET',
    path: '/v1/countries/gt/promotions',
  });
  const targets = gt.body.targets as Array<Record<string, unknown>>;
  const l3 = targets.find(target => target.level === 'L3')!;

  assert.equal(summary.statusCode, 200);
  assert.deepEqual(summary.body.reviewCandidateCountryCodes, ['AU', 'GT', 'NZ', 'PA']);
  assert.deepEqual(summary.body.enabledCountryCodes, []);
  assert.equal(gt.statusCode, 200);
  assert.equal(gt.body.countryCode, 'GT');
  assert.equal(gt.body.highestReviewCandidateLevel, 'L3');
  assert.equal(gt.body.highestEnabledLevel, null);
  assert.equal(l3.state, 'review_candidate');
  assert.deepEqual(l3.missingEvidence, [
    'approved-administrative-keys',
    'independent-signature',
    'runtime-adapter',
  ]);
  assert.equal((gt.body.privacy as Record<string, unknown>).containsRawAddress, false);
});

test('P3 multilingual endpoints separate formatting from verified translation', () => {
  const summary = api.handle({ method: 'GET', path: '/v1/multilingual' });
  const jp = api.handle({
    method: 'GET',
    path: '/v1/countries/JP/languages',
  });
  const route = api.handle({
    method: 'POST',
    path: '/v1/multilingual/assess',
    headers: { 'x-request-id': 'test.jp-language-1' },
    body: {
      countryCode: 'JP',
      sourceLanguage: 'ja',
      targetLanguage: 'en',
      purpose: 'international-shipping',
      requestId: 'test.jp-language-1',
    },
  });
  const assessment = route.body.assessment as Record<string, unknown>;

  assert.equal(summary.statusCode, 200);
  assert.equal(summary.body.countryCount, 276);
  assert.equal(summary.body.nativeFormatEnabledProfiles, 271);
  assert.equal(summary.body.automaticPlaceNameTranslationEnabledProfiles, 0);
  assert.equal(jp.statusCode, 200);
  assert.equal(jp.body.highestEnabledLevel, 'M2');
  assert.equal(jp.body.highestReviewCandidateLevel, 'M4');
  assert.equal(jp.body.automaticPlaceNameTranslationEnabled, false);
  assert.equal(route.statusCode, 200);
  assert.equal(route.body.requestId, 'test.jp-language-1');
  assert.equal(assessment.status, 'review_required');
  assert.equal(assessment.formatReady, true);
  assert.equal(assessment.translationVerified, false);
});

test('P3 multilingual assessment rejects address text and invalid language tags', () => {
  const rawText = api.handle({
    method: 'POST',
    path: '/v1/multilingual/assess',
    body: {
      countryCode: 'JP',
      sourceLanguage: 'ja',
      targetLanguage: 'en',
      text: 'not accepted',
    },
  });
  const invalidLanguage = api.handle({
    method: 'POST',
    path: '/v1/multilingual/assess',
    body: {
      countryCode: 'JP',
      sourceLanguage: 'ja<script>',
      targetLanguage: 'en',
    },
  });

  assert.equal(rawText.statusCode, 400);
  assert.equal((rawText.body.error as Record<string, unknown>).code, 'unknown_field');
  assert.equal(invalidLanguage.statusCode, 400);
  assert.equal(
    (invalidLanguage.body.error as Record<string, unknown>).code,
    'invalid_language_tag',
  );
});

test('P3 place-name API ranks official aliases with administrative context', () => {
  const unavailable = api.handle({
    method: 'POST',
    path: '/v1/place-names/rank',
    body: {
      countryCode: 'JP',
      query: '日本橋',
      targetLanguage: 'en',
    },
  });
  const ranked = placeNameApi.handle({
    method: 'POST',
    path: '/v1/place-names/rank',
    headers: { 'x-request-id': 'place.jp.1' },
    body: {
      countryCode: 'JP',
      query: '日本橋',
      targetLanguage: 'en',
      purpose: 'international-shipping',
      hierarchyLevel: 'locality',
      parentPlaceIds: ['jp-tokyo', 'jp-tokyo-chuo'],
      maxCandidates: 3,
      requestId: 'place.jp.1',
    },
  });
    const ranking = ranked.body.ranking as Record<string, unknown>;
    const candidates = ranking.candidates as Array<Record<string, unknown>>;
    const addressMorphism = ranked.body.addressMorphism as Record<string, unknown>;
    const morphologyCandidates = addressMorphism.candidateSet as Record<string, unknown>;
    const morphologyResolution = addressMorphism.resolution as Record<string, unknown>;

  assert.equal(unavailable.statusCode, 503);
  assert.equal(
    (unavailable.body.error as Record<string, unknown>).code,
    'place_name_catalog_not_configured',
  );
  assert.equal(ranked.statusCode, 200);
  assert.equal(ranked.body.requestId, 'place.jp.1');
  assert.equal(ranking.status, 'ranked');
  assert.equal(ranking.translationUsed, false);
  assert.equal(ranking.automaticUseAllowed, false);
    assert.equal(candidates[0].displayName, 'Nihonbashi');
    assert.equal(candidates[0].displayNameKind, 'official-romanization');
    assert.equal(addressMorphism.version, 'addressql-address-morphism-compatibility-v0.1');
    assert.equal(morphologyCandidates.coverageState, 'not-established');
    assert.equal(morphologyCandidates.candidateCount, 1);
    assert.equal(morphologyResolution.translationPerformed, false);
    assert.equal(morphologyResolution.automaticUseAllowed, false);
    assert.doesNotMatch(JSON.stringify(addressMorphism), /日本橋|Nihonbashi/);
  assert.equal(
    (ranked.body.privacy as Record<string, unknown>).storesPlaceName,
    false,
  );
});

test('P3 place-name API rejects address fields and unsafe context', () => {
  const rawAddress = placeNameApi.handle({
    method: 'POST',
    path: '/v1/place-names/rank',
    body: {
      countryCode: 'JP',
      query: '日本橋',
      targetLanguage: 'en',
      address: 'not accepted',
    },
  });
  const badParents = placeNameApi.handle({
    method: 'POST',
    path: '/v1/place-names/rank',
    body: {
      countryCode: 'JP',
      query: '日本橋',
      targetLanguage: 'en',
      parentPlaceIds: ['valid-parent', 'rev\u0456ewer'],
    },
  });

  assert.equal(rawAddress.statusCode, 400);
  assert.equal(
    (rawAddress.body.error as Record<string, unknown>).code,
    'unknown_field',
  );
  assert.equal(badParents.statusCode, 400);
  assert.equal(
    (badParents.body.error as Record<string, unknown>).code,
    'invalid_parent_context',
  );
});
