import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildPostalSourceReadinessQuery,
  loadPostalSourceValidationReadiness,
  projectPostalSourceValidationReadiness,
} from './postalSourceReadinessAdapter';

test('builds country-scoped parameterized readiness queries with a metadata-only projection', () => {
  const sqlite = buildPostalSourceReadinessQuery('gt', 'sqlite');
  const postgres = buildPostalSourceReadinessQuery('FR', 'postgres');

  assert.deepEqual(sqlite.parameters, ['GT']);
  assert.match(sqlite.statement, /SELECT source_id, official_reference_validation_eligible, delivery_claims_enabled/);
  assert.match(sqlite.statement, /WHERE country_code = \?/);
  assert.match(postgres.statement, /WHERE country_code = \$1/);
  assert.doesNotMatch(sqlite.statement, /address|recipient|postcode|latitude|longitude|credential|secret/i);
  assert.throws(
    () => buildPostalSourceReadinessQuery('Guatemala', 'sqlite'),
    /ISO 3166-1 alpha-2/,
  );
});

test('projects database rows fail-closed and preserves no delivery claim', () => {
  const projected = projectPostalSourceValidationReadiness([
    {
      source_id: 'synthetic-approved',
      official_reference_validation_eligible: 1,
      delivery_claims_enabled: 0,
    },
    {
      source_id: 'synthetic-unreviewed',
      official_reference_validation_eligible: false,
      delivery_claims_enabled: false,
    },
    {
      source_id: 'synthetic-delivery-flag',
      official_reference_validation_eligible: true,
      delivery_claims_enabled: true,
    },
    {
      source_id: 'synthetic-duplicate',
      official_reference_validation_eligible: true,
      delivery_claims_enabled: false,
    },
    {
      source_id: 'synthetic-duplicate',
      official_reference_validation_eligible: 0,
      delivery_claims_enabled: 0,
    },
  ]);

  assert.deepEqual(projected, [
    {
      sourceId: 'synthetic-approved',
      officialReferenceValidationEligible: true,
      deliveryClaimsEnabled: false,
    },
    {
      sourceId: 'synthetic-delivery-flag',
      officialReferenceValidationEligible: false,
      deliveryClaimsEnabled: false,
    },
    {
      sourceId: 'synthetic-duplicate',
      officialReferenceValidationEligible: false,
      deliveryClaimsEnabled: false,
    },
    {
      sourceId: 'synthetic-unreviewed',
      officialReferenceValidationEligible: false,
      deliveryClaimsEnabled: false,
    },
  ]);
  assert.doesNotMatch(JSON.stringify(projected), /address|recipient|postcode|latitude|longitude|credential|secret/i);
});

test('loads the projection through a query executor without injecting country input', () => {
  const calls: Array<{ statement: string; parameters: readonly string[] }> = [];
  const readiness = loadPostalSourceValidationReadiness({
    all(statement, parameters) {
      calls.push({ statement, parameters });
      return [{
        source_id: 'synthetic-source',
        official_reference_validation_eligible: true,
        delivery_claims_enabled: false,
      }];
    },
  }, 'zz', 'postgres');

  assert.deepEqual(readiness, [{
    sourceId: 'synthetic-source',
    officialReferenceValidationEligible: true,
    deliveryClaimsEnabled: false,
  }]);
  assert.deepEqual(calls[0]?.parameters, ['ZZ']);
  assert.match(calls[0]?.statement || '', /WHERE country_code = \$1/);
});
