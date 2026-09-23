import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ADDRESS_MORPHISM_V2_CHAPTER1_REGISTRATION_PROBLEM_VERSION,
  buildChapter1RegistrationProblemReport,
  chapter1CanReuseBetweenServices,
  chapter1RegistrationProblemIsOnlyFormUx,
  classifyChapter1AddressObject,
  evaluateChapter1ReferenceReuse,
  type Chapter1ServiceAddressRecord,
} from './addressMorphismV2Chapter1RegistrationProblem';

const safeRecord: Chapter1ServiceAddressRecord = {
  serviceId: 'wallet',
  hasSurfaceExpression: true,
  hasMapLocation: true,
  hasReferentBinding: true,
  hasPersistentIdentifier: true,
  purposeScoped: true,
  disclosureBoundaryDefined: true,
  safeReusePolicyDefined: true,
  storesRawAddressByDefault: false,
};

test('chapter 1 report models registration as reference reuse, not form UX alone', () => {
  const report = buildChapter1RegistrationProblemReport();

  assert.equal(report.version, ADDRESS_MORPHISM_V2_CHAPTER1_REGISTRATION_PROBLEM_VERSION);
  assert.ok(report.executableModelKinds.includes('repeated registration bottleneck'));
  assert.ok(report.executableModelKinds.includes('map/expression/identifier layer separation'));
  assert.ok(report.executableModelKinds.includes('raw address over-collection detector'));
  assert.match(report.thesis, /not merely an address-form UX problem/);
});

test('chapter 1 separates map locations, address expressions, and persistent identifiers', () => {
  assert.equal(classifyChapter1AddressObject({ hasCoordinates: true }), 'map_location');
  assert.equal(classifyChapter1AddressObject({ hasHumanExpression: true }), 'address_expression');
  assert.equal(
    classifyChapter1AddressObject({ stableAcrossSystems: true, exposesRawAddress: false }),
    'persistent_identifier',
  );
});

test('chapter 1 marks a complete purpose-scoped record as safe reuse ready', () => {
  const evaluation = evaluateChapter1ReferenceReuse(safeRecord);

  assert.equal(evaluation.state, 'safe_reuse_ready');
  assert.deepEqual(evaluation.reasons, []);
});

test('chapter 1 detects reference bottleneck when a service stores only expressions and coordinates', () => {
  const evaluation = evaluateChapter1ReferenceReuse({
    ...safeRecord,
    hasReferentBinding: false,
    hasPersistentIdentifier: false,
  });

  assert.equal(evaluation.state, 'reference_bottleneck');
  assert.ok(evaluation.reasons.includes('missing-referent-binding'));
  assert.ok(evaluation.reasons.includes('missing-persistent-identifier'));
});

test('chapter 1 detects disclosure bottleneck when raw address storage lacks a boundary', () => {
  const evaluation = evaluateChapter1ReferenceReuse({
    ...safeRecord,
    disclosureBoundaryDefined: false,
    storesRawAddressByDefault: true,
  });

  assert.equal(evaluation.state, 'disclosure_bottleneck');
  assert.ok(evaluation.reasons.includes('raw-address-over-collection'));
});

test('chapter 1 requires both services to be safe before reusing a reference', () => {
  assert.equal(chapter1CanReuseBetweenServices(safeRecord, { ...safeRecord, serviceId: 'merchant' }), true);
  assert.equal(
    chapter1CanReuseBetweenServices(safeRecord, {
      ...safeRecord,
      serviceId: 'merchant',
      safeReusePolicyDefined: false,
    }),
    false,
  );
});

test('chapter 1 preserves the non-claim that registration is not only a form UX problem', () => {
  assert.equal(chapter1RegistrationProblemIsOnlyFormUx(safeRecord), false);
});
