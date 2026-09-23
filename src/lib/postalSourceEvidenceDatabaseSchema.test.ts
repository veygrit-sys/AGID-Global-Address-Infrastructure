import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';

import { getDatabaseAdapterCompatibility } from './databaseAdapterCompatibility';

const sqliteSql = readFileSync(join(process.cwd(), 'db', 'postal-source-evidence-registry.sqlite.sql'), 'utf8');
const postgresSql = readFileSync(join(process.cwd(), 'db', 'postal-source-evidence-registry.postgres.sql'), 'utf8');

const TABLES = [
  'postal_source_scope',
  'postal_source_candidate',
  'postal_source_record',
  'postal_source_correction_evidence',
  'postal_source_review_event',
  'postal_source_quality_evidence',
  'postal_source_quality_attestation',
  'postal_validation_runtime_contract',
  'postal_validation_language_policy',
] as const;

function tableBody(sql: string, table: string) {
  const match = sql.match(new RegExp(`CREATE TABLE IF NOT EXISTS ${table} \\(([\\s\\S]*?)\\n\\);`));
  assert.ok(match, `${table} table exists`);
  return match[1]!;
}

test('keeps SQLite and Postgres source-evidence registries structurally aligned', () => {
  for (const table of TABLES) {
    const sqliteBody = tableBody(sqliteSql, table);
    const postgresBody = tableBody(postgresSql, table);

    assert.match(sqliteBody, /raw_private_material_stored INTEGER NOT NULL DEFAULT 0 CHECK \(raw_private_material_stored = 0\)/);
    assert.match(postgresBody, /raw_private_material_stored BOOLEAN NOT NULL DEFAULT FALSE CHECK \(raw_private_material_stored = FALSE\)/);
  }

  const sqliteSource = tableBody(sqliteSql, 'postal_source_record');
  const postgresSource = tableBody(postgresSql, 'postal_source_record');
  for (const body of [sqliteSource, postgresSource]) {
    assert.match(body, /correction_path_status/);
    assert.match(body, /coverage_status TEXT NOT NULL CHECK \(coverage_status IN \('not-recorded', 'partial-or-unknown', 'national-coverage-evidenced'\)\)/);
    assert.match(body, /reuse_status/);
    assert.match(body, /allowed_use/);
    assert.match(body, /approval_status/);
    assert.match(body, /source_digest TEXT NOT NULL CHECK/);
    assert.match(body, /terms_digest TEXT NOT NULL CHECK/);
    assert.match(body, /UNIQUE \(scope_id, source_id, source_version\)/);
  }
  assert.match(sqliteSource, /REFERENCES postal_source_scope\(scope_id\) ON DELETE CASCADE/);
  assert.match(postgresSource, /REFERENCES postal_source_scope\(scope_id\) ON DELETE CASCADE/);
  assert.match(postgresSource, /retrieved_at TIMESTAMPTZ NOT NULL/);
  assert.match(postgresSource, /review_by TIMESTAMPTZ NOT NULL/);

  const sqliteCandidate = tableBody(sqliteSql, 'postal_source_candidate');
  const postgresCandidate = tableBody(postgresSql, 'postal_source_candidate');
  for (const body of [sqliteCandidate, postgresCandidate]) {
    assert.match(body, /catalog_version TEXT NOT NULL/);
    assert.match(body, /source_version_status TEXT NOT NULL CHECK \(source_version_status IN \('not-recorded', 'observed-unverified', 'verified-current'\)\)/);
    assert.match(body, /terms_status TEXT NOT NULL CHECK \(terms_status IN \('not-recorded', 'terms-observed', 'reuse-evidenced', 'restricted-or-unclear'\)\)/);
    assert.match(body, /coverage_status TEXT NOT NULL CHECK \(coverage_status IN \('not-recorded', 'partial-or-unknown', 'national-coverage-evidenced'\)\)/);
    assert.match(body, /candidate_status TEXT NOT NULL CHECK \(candidate_status IN \('metadata-only', 'promotion-review-ready', 'blocked', 'superseded'\)\)/);
    assert.match(body, /next_gate TEXT NOT NULL CHECK/);
    assert.match(body, /UNIQUE \(scope_id, source_id\)/);
  }
  assert.match(sqliteCandidate, /discovered_at TEXT NOT NULL/);
  assert.match(postgresCandidate, /discovered_at TIMESTAMPTZ NOT NULL/);

  const sqliteQuality = tableBody(sqliteSql, 'postal_source_quality_evidence');
  const postgresQuality = tableBody(postgresSql, 'postal_source_quality_evidence');
  for (const body of [sqliteQuality, postgresQuality]) {
    assert.match(body, /evaluation_kind TEXT NOT NULL CHECK \(evaluation_kind IN \('synthetic', 'aggregate-only'\)\)/);
    assert.match(body, /case_count INTEGER NOT NULL CHECK \(case_count > 0\)/);
    assert.match(body, /format_pass_count INTEGER NOT NULL CHECK \(format_pass_count >= 0 AND format_pass_count <= case_count\)/);
    assert.match(body, /false_accept_count INTEGER NOT NULL CHECK \(false_accept_count >= 0 AND false_accept_count <= case_count\)/);
    assert.match(body, /false_reject_count INTEGER NOT NULL CHECK \(false_reject_count >= 0 AND false_reject_count <= case_count\)/);
    assert.match(body, /quality_review_by .* NOT NULL/);
  }

  const sqliteAttestation = tableBody(sqliteSql, 'postal_source_quality_attestation');
  const postgresAttestation = tableBody(postgresSql, 'postal_source_quality_attestation');
  for (const body of [sqliteAttestation, postgresAttestation]) {
    assert.match(body, /attestation_kind TEXT NOT NULL CHECK \(attestation_kind = 'independent-detached-signature'\)/);
    assert.match(body, /independence_status TEXT NOT NULL CHECK \(independence_status IN \('independent', 'self-attested', 'unknown'\)\)/);
    assert.match(body, /attestation_status TEXT NOT NULL CHECK \(attestation_status IN \('verified', 'blocked', 'superseded'\)\)/);
    assert.match(body, /signer_key_fingerprint TEXT NOT NULL CHECK/);
    assert.match(body, /signature_digest TEXT NOT NULL CHECK/);
  }

  const sqliteRuntimeContract = tableBody(sqliteSql, 'postal_validation_runtime_contract');
  const postgresRuntimeContract = tableBody(postgresSql, 'postal_validation_runtime_contract');
  for (const body of [sqliteRuntimeContract, postgresRuntimeContract]) {
    assert.match(body, /raw_input_persistence TEXT NOT NULL CHECK \(raw_input_persistence = 'none'\)/);
    assert.match(body, /telemetry_mode TEXT NOT NULL CHECK \(telemetry_mode IN \('none', 'aggregate-only'\)\)/);
    assert.match(body, /target_p95_latency_ms INTEGER NOT NULL CHECK \(target_p95_latency_ms > 0\)/);
    assert.match(body, /target_availability_basis_points INTEGER NOT NULL CHECK/);
    assert.match(body, /measurement_kind TEXT NOT NULL CHECK \(measurement_kind IN \('synthetic', 'aggregate-only', 'not-measured'\)\)/);
    assert.match(body, /runtime_review_by .* NOT NULL/);
  }

  const sqliteLanguagePolicy = tableBody(sqliteSql, 'postal_validation_language_policy');
  const postgresLanguagePolicy = tableBody(postgresSql, 'postal_validation_language_policy');
  for (const body of [sqliteLanguagePolicy, postgresLanguagePolicy]) {
    assert.match(body, /standardization_status TEXT NOT NULL CHECK/);
    assert.match(body, /typo_correction_status TEXT NOT NULL CHECK/);
    assert.match(body, /policy_status TEXT NOT NULL CHECK/);
    assert.match(body, /policy_digest TEXT NOT NULL CHECK/);
    assert.match(body, /language_review_by .* NOT NULL/);
  }

  for (const sql of [sqliteSql, postgresSql]) {
    const reviewEvent = tableBody(sql, 'postal_source_review_event');
    assert.match(reviewEvent, /reviewer_commitment_digest TEXT/);
    assert.doesNotMatch(reviewEvent, /reviewer_commitment TEXT/);
  }
});

test('forbids individual-address and credential columns in source-evidence tables', () => {
  const forbiddenColumns = /\b(address|recipient|postcode|postal_code|latitude|longitude|email|phone|credential|secret)\b/i;
  for (const sql of [sqliteSql, postgresSql]) {
    for (const table of TABLES) {
      assert.doesNotMatch(tableBody(sql, table), forbiddenColumns, `${table} stays metadata-only`);
    }
  }
});

test('exposes a fail-closed validation-readiness view', () => {
  for (const sql of [sqliteSql, postgresSql]) {
    assert.match(sql, /CREATE VIEW IF NOT EXISTS postal_source_validation_readiness AS/);
    assert.match(sql, /official_reference_validation_eligible/);
    assert.match(sql, /delivery_claims_enabled/);
    assert.match(sql, /source\.approval_status = 'metadata-only-approved'/);
    assert.match(sql, /source\.correction_path_status = 'source-specific-confirmed'/);
    assert.match(sql, /source\.coverage_status = 'national-coverage-evidenced'/);
    assert.match(sql, /FROM postal_source_quality_evidence AS quality_evidence/);
    assert.match(sql, /quality_evidence\.case_count > 0/);
    assert.match(sql, /FROM postal_source_quality_attestation AS attestation/);
    assert.match(sql, /attestation\.independence_status = 'independent'/);
    assert.match(sql, /\), 'blocked'\) = 'verified'/);
    assert.match(sql, /\), 'blocked'\) = 'approved'/);
    assert.match(sql, /ORDER BY review_event\.reviewed_at DESC, review_event\.review_event_id DESC/);
    assert.match(sql, /\), 'blocked'\) = 'approved'/);
  }

  assert.match(sqliteSql, /julianday\(source\.review_by\) >= julianday\('now'\)/);
  assert.match(postgresSql, /source\.review_by >= CURRENT_TIMESTAMP/);
  assert.match(sqliteSql, /julianday\(quality_evidence\.quality_review_by\) >= julianday\('now'\)/);
  assert.match(postgresSql, /quality_evidence\.quality_review_by >= CURRENT_TIMESTAMP/);
  assert.match(sqliteSql, /THEN 1\n    ELSE 0\n  END AS official_reference_validation_eligible/);
  assert.match(sqliteSql, /0 AS delivery_claims_enabled/);
  assert.match(postgresSql, /THEN TRUE\n    ELSE FALSE\n  END AS official_reference_validation_eligible/);
  assert.match(postgresSql, /FALSE AS delivery_claims_enabled/);
});

test('keeps source candidates separate from official-reference validation', () => {
  for (const sql of [sqliteSql, postgresSql]) {
    assert.match(sql, /CREATE VIEW IF NOT EXISTS postal_source_candidate_promotion_readiness AS/);
    assert.match(sql, /candidate\.candidate_status = 'promotion-review-ready'/);
    assert.match(sql, /candidate\.source_version_status = 'verified-current'/);
    assert.match(sql, /candidate\.terms_status = 'reuse-evidenced'/);
    assert.match(sql, /candidate\.coverage_status = 'national-coverage-evidenced'/);
    assert.match(sql, /candidate\.correction_path_status = 'source-specific-confirmed'/);
    assert.match(sql, /AS source_record_promotion_review_eligible/);
  }

  const sqliteCandidateView = sqliteSql.slice(
    sqliteSql.indexOf('CREATE VIEW IF NOT EXISTS postal_source_candidate_promotion_readiness AS'),
    sqliteSql.indexOf('-- This contract is evidence of a privacy-preserving runtime policy'),
  );
  const postgresCandidateView = postgresSql.slice(
    postgresSql.indexOf('CREATE VIEW IF NOT EXISTS postal_source_candidate_promotion_readiness AS'),
    postgresSql.indexOf('-- This contract is evidence of a privacy-preserving runtime policy'),
  );
  assert.doesNotMatch(sqliteCandidateView, /official_reference_validation_eligible/);
  assert.doesNotMatch(postgresCandidateView, /official_reference_validation_eligible/);
  assert.match(sqliteCandidateView, /0 AS delivery_claims_enabled/);
  assert.match(postgresCandidateView, /FALSE AS delivery_claims_enabled/);
});

test('keeps incomplete candidate metadata blocked and promotion review separate from validation', () => {
  const database = new DatabaseSync(':memory:');
  try {
    database.exec(sqliteSql);
    database.exec(`
      INSERT INTO postal_source_scope (
        scope_id, country_code, scope_kind, scope_status, non_claim, created_at, updated_at
      ) VALUES (
        'gt-national', 'GT', 'national', 'metadata-only-approved',
        'synthetic metadata only', '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z'
      );
      INSERT INTO postal_source_candidate (
        candidate_id, scope_id, source_id, source_url, catalog_version,
        source_version, source_version_status, terms_url, terms_status, coverage_status,
        correction_url, correction_path_status, candidate_status, next_gate,
        discovered_at, review_by, catalog_metadata_digest
      ) VALUES (
        'gt-candidate', 'gt-national', 'synthetic-catalog-source', 'https://example.invalid/source', 'catalog-v1',
        NULL, 'not-recorded', NULL, 'not-recorded', 'not-recorded',
        NULL, 'not-recorded', 'metadata-only', 'record-source-version',
        '2026-01-01T00:00:00Z', '2099-01-01T00:00:00Z', 'synthetic-metadata-digest'
      );
    `);

    const candidateReadiness = database.prepare(`
      SELECT source_record_promotion_review_eligible, delivery_claims_enabled
      FROM postal_source_candidate_promotion_readiness
      WHERE candidate_id = 'gt-candidate'
    `).get() as { source_record_promotion_review_eligible: number; delivery_claims_enabled: number };
    assert.equal(candidateReadiness.source_record_promotion_review_eligible, 0);
    assert.equal(candidateReadiness.delivery_claims_enabled, 0);

    database.exec(`
      UPDATE postal_source_candidate
      SET source_version = 'synthetic-v1',
          source_version_status = 'verified-current',
          terms_url = 'https://example.invalid/terms',
          terms_status = 'reuse-evidenced',
          coverage_status = 'national-coverage-evidenced',
          correction_url = 'https://example.invalid/corrections',
          correction_path_status = 'source-specific-confirmed',
          candidate_status = 'promotion-review-ready',
          next_gate = 'record-independent-quality-plan'
      WHERE candidate_id = 'gt-candidate';
    `);

    const promotionReadiness = database.prepare(`
      SELECT source_record_promotion_review_eligible, delivery_claims_enabled
      FROM postal_source_candidate_promotion_readiness
      WHERE candidate_id = 'gt-candidate'
    `).get() as { source_record_promotion_review_eligible: number; delivery_claims_enabled: number };
    assert.equal(promotionReadiness.source_record_promotion_review_eligible, 1);
    assert.equal(promotionReadiness.delivery_claims_enabled, 0);
    assert.equal(
      database.prepare('SELECT COUNT(*) AS count FROM postal_source_validation_readiness').get().count,
      0,
    );

    assert.throws(() => database.exec(`
      INSERT INTO postal_source_candidate (
        candidate_id, scope_id, source_id, source_url, catalog_version,
        source_version, source_version_status, terms_url, terms_status, coverage_status,
        correction_url, correction_path_status, candidate_status, next_gate,
        discovered_at, review_by, catalog_metadata_digest
      ) VALUES (
        'invalid-candidate', 'gt-national', 'synthetic-invalid-source', 'https://example.invalid/source', 'catalog-v1',
        NULL, 'not-recorded', 'https://example.invalid/terms', 'not-recorded', 'not-recorded',
        NULL, 'not-recorded', 'metadata-only', 'record-source-version',
        '2026-01-01T00:00:00Z', '2099-01-01T00:00:00Z', 'synthetic-metadata-digest'
      );
    `), /CHECK constraint failed/);
  } finally {
    database.close();
  }
});

test('requires fresh synthetic quality evidence, national coverage, runtime contracts, and language policies before enabling readiness', () => {
  const database = new DatabaseSync(':memory:');
  try {
    database.exec(sqliteSql);
    database.exec(`
      INSERT INTO postal_source_scope (
        scope_id, country_code, scope_kind, scope_status, non_claim, created_at, updated_at
      ) VALUES (
        'quality-scope', 'ZZ', 'national', 'metadata-only-approved',
        'synthetic quality metadata only', '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z'
      );
      INSERT INTO postal_source_record (
        source_record_id, scope_id, source_id, source_version, source_url, terms_url,
        correction_url, correction_path_status, coverage_status, reuse_status, allowed_use, approval_status,
        retrieved_at, review_by, source_digest, terms_digest, recorded_at, updated_at
      ) VALUES (
        'quality-source', 'quality-scope', 'synthetic-quality-source', 'synthetic-v1',
        'https://example.invalid/source', 'https://example.invalid/terms',
        'https://example.invalid/corrections', 'source-specific-confirmed',
        'national-coverage-evidenced',
        'conditional-open-reuse', 'non-delivery-postal-metadata-only', 'metadata-only-approved',
        '2026-01-01T00:00:00Z', '2099-01-01T00:00:00Z',
        'synthetic-source-digest', 'synthetic-terms-digest',
        '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z'
      );
      INSERT INTO postal_source_correction_evidence (
        correction_evidence_id, source_record_id, evidence_kind, evidence_url, evidence_digest, verified_at
      ) VALUES (
        'quality-correction', 'quality-source', 'dataset-page',
        'https://example.invalid/corrections', 'synthetic-correction-digest', '2026-01-01T00:00:00Z'
      );
      INSERT INTO postal_source_quality_evidence (
        quality_evidence_id, source_record_id, evaluation_kind, evaluation_version, quality_status,
        case_count, format_pass_count, false_accept_count, false_reject_count, report_digest,
        evaluated_at, reviewed_at, quality_review_by
      ) VALUES (
        'quality-evidence', 'quality-source', 'synthetic', 'synthetic-v1', 'approved',
        10, 10, 0, 0, 'synthetic-quality-digest',
        '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z', '2000-01-01T00:00:00Z'
      );
      INSERT INTO postal_source_quality_attestation (
        quality_attestation_id, quality_evidence_id, attestation_kind, independence_status,
        attestation_status, signer_key_fingerprint, signature_digest, verified_at
      ) VALUES (
        'quality-attestation', 'quality-evidence', 'independent-detached-signature', 'independent',
        'verified', 'synthetic-key-fingerprint', 'synthetic-signature-digest', '2026-01-01T00:00:00Z'
      );
      INSERT INTO postal_source_review_event (
        review_event_id, source_record_id, review_status, reviewer_commitment_digest, findings_digest, reviewed_at
      ) VALUES (
        'quality-review', 'quality-source', 'approved', 'synthetic-reviewer-digest',
        'synthetic-findings-digest', '2026-01-01T00:00:00Z'
      );
    `);

    let readiness = database.prepare(`
      SELECT official_reference_validation_eligible, delivery_claims_enabled
      FROM postal_source_validation_readiness
      WHERE source_record_id = 'quality-source'
    `).get() as { official_reference_validation_eligible: number; delivery_claims_enabled: number };
    assert.equal(readiness.official_reference_validation_eligible, 0);
    assert.equal(readiness.delivery_claims_enabled, 0);

    database.exec(`
      UPDATE postal_source_quality_evidence
      SET quality_review_by = '2099-01-01T00:00:00Z'
      WHERE quality_evidence_id = 'quality-evidence';
    `);

    readiness = database.prepare(`
      SELECT official_reference_validation_eligible, delivery_claims_enabled
      FROM postal_source_validation_readiness
      WHERE source_record_id = 'quality-source'
    `).get() as { official_reference_validation_eligible: number; delivery_claims_enabled: number };
    assert.equal(readiness.official_reference_validation_eligible, 1);
    assert.equal(readiness.delivery_claims_enabled, 0);

    database.exec(`
      UPDATE postal_source_record
      SET coverage_status = 'partial-or-unknown'
      WHERE source_record_id = 'quality-source';
    `);

    readiness = database.prepare(`
      SELECT official_reference_validation_eligible, delivery_claims_enabled
      FROM postal_source_validation_readiness
      WHERE source_record_id = 'quality-source'
    `).get() as { official_reference_validation_eligible: number; delivery_claims_enabled: number };
    assert.equal(readiness.official_reference_validation_eligible, 0);
    assert.equal(readiness.delivery_claims_enabled, 0);

    database.exec(`
      UPDATE postal_source_record
      SET coverage_status = 'national-coverage-evidenced'
      WHERE source_record_id = 'quality-source';
    `);

    readiness = database.prepare(`
      SELECT official_reference_validation_eligible, delivery_claims_enabled
      FROM postal_source_validation_readiness
      WHERE source_record_id = 'quality-source'
    `).get() as { official_reference_validation_eligible: number; delivery_claims_enabled: number };
    assert.equal(readiness.official_reference_validation_eligible, 1);
    assert.equal(readiness.delivery_claims_enabled, 0);

    database.exec(`
      INSERT INTO postal_validation_runtime_contract (
        runtime_contract_id, scope_id, contract_version, contract_status, processing_mode,
        raw_input_persistence, telemetry_mode, target_p95_latency_ms,
        target_availability_basis_points, measurement_kind, contract_digest, reviewed_at, runtime_review_by
      ) VALUES (
        'quality-runtime-contract', 'quality-scope', 'synthetic-v1', 'approved', 'client-controlled-ephemeral',
        'none', 'none', 100, 9990, 'synthetic', 'synthetic-runtime-digest',
        '2026-01-01T00:00:00Z', '2000-01-01T00:00:00Z'
      );
    `);

    let runtimeReadiness = database.prepare(`
      SELECT privacy_preserving_runtime_contract_enabled, delivery_claims_enabled
      FROM postal_validation_runtime_readiness
      WHERE source_record_id = 'quality-source'
    `).get() as { privacy_preserving_runtime_contract_enabled: number; delivery_claims_enabled: number };
    assert.equal(runtimeReadiness.privacy_preserving_runtime_contract_enabled, 0);
    assert.equal(runtimeReadiness.delivery_claims_enabled, 0);

    database.exec(`
      UPDATE postal_validation_runtime_contract
      SET runtime_review_by = '2099-01-01T00:00:00Z'
      WHERE runtime_contract_id = 'quality-runtime-contract';
    `);

    runtimeReadiness = database.prepare(`
      SELECT privacy_preserving_runtime_contract_enabled, delivery_claims_enabled
      FROM postal_validation_runtime_readiness
      WHERE source_record_id = 'quality-source'
    `).get() as { privacy_preserving_runtime_contract_enabled: number; delivery_claims_enabled: number };
    assert.equal(runtimeReadiness.privacy_preserving_runtime_contract_enabled, 1);
    assert.equal(runtimeReadiness.delivery_claims_enabled, 0);

    database.exec(`
      INSERT INTO postal_validation_language_policy (
        language_policy_id, scope_id, language_tag, script_code,
        standardization_status, typo_correction_status, policy_status,
        policy_digest, reviewed_at, language_review_by
      ) VALUES (
        'quality-language-policy', 'quality-scope', 'es', 'Latn',
        'official-reference-evidenced', 'synthetic-evidenced', 'approved',
        'synthetic-language-policy-digest',
        '2026-01-01T00:00:00Z', '2000-01-01T00:00:00Z'
      );
    `);

    let languageReadiness = database.prepare(`
      SELECT standardization_enabled, typo_correction_enabled, delivery_claims_enabled
      FROM postal_validation_language_readiness
      WHERE source_record_id = 'quality-source'
    `).get() as {
      standardization_enabled: number;
      typo_correction_enabled: number;
      delivery_claims_enabled: number;
    };
    assert.equal(languageReadiness.standardization_enabled, 0);
    assert.equal(languageReadiness.typo_correction_enabled, 0);
    assert.equal(languageReadiness.delivery_claims_enabled, 0);

    database.exec(`
      UPDATE postal_validation_language_policy
      SET language_review_by = '2099-01-01T00:00:00Z'
      WHERE language_policy_id = 'quality-language-policy';
    `);

    languageReadiness = database.prepare(`
      SELECT standardization_enabled, typo_correction_enabled, delivery_claims_enabled
      FROM postal_validation_language_readiness
      WHERE source_record_id = 'quality-source'
    `).get() as {
      standardization_enabled: number;
      typo_correction_enabled: number;
      delivery_claims_enabled: number;
    };
    assert.equal(languageReadiness.standardization_enabled, 1);
    assert.equal(languageReadiness.typo_correction_enabled, 1);
    assert.equal(languageReadiness.delivery_claims_enabled, 0);
  } finally {
    database.close();
  }
});

test('gates multilingual standardization and typo correction by explicit policy', () => {
  for (const sql of [sqliteSql, postgresSql]) {
    assert.match(sql, /CREATE VIEW IF NOT EXISTS postal_validation_language_readiness AS/);
    assert.match(sql, /policy\.standardization_status = 'official-reference-evidenced'/);
    assert.match(sql, /policy\.typo_correction_status IN \('synthetic-evidenced', 'aggregate-evidenced'\)/);
    assert.match(sql, /policy\.language_review_by/);
    assert.match(sql, /AS standardization_enabled/);
    assert.match(sql, /AS typo_correction_enabled/);
  }

  assert.match(sqliteSql, /0 AS delivery_claims_enabled\nFROM postal_source_validation_readiness/);
  assert.match(postgresSql, /FALSE AS delivery_claims_enabled\nFROM postal_source_validation_readiness/);
  assert.match(sqliteSql, /julianday\(policy\.language_review_by\) >= julianday\('now'\)/);
  assert.match(postgresSql, /policy\.language_review_by >= CURRENT_TIMESTAMP/);
});

test('gates runtime contracts on privacy and measured non-production evidence', () => {
  for (const sql of [sqliteSql, postgresSql]) {
    assert.match(sql, /CREATE VIEW IF NOT EXISTS postal_validation_runtime_readiness AS/);
    assert.match(sql, /contract\.raw_input_persistence = 'none'/);
    assert.match(sql, /contract\.telemetry_mode IN \('none', 'aggregate-only'\)/);
    assert.match(sql, /contract\.measurement_kind IN \('synthetic', 'aggregate-only'\)/);
    assert.match(sql, /contract\.runtime_review_by/);
    assert.match(sql, /AS privacy_preserving_runtime_contract_enabled/);
  }

  assert.match(sqliteSql, /0 AS delivery_claims_enabled\nFROM postal_source_validation_readiness AS readiness\nJOIN postal_validation_runtime_contract/);
  assert.match(postgresSql, /FALSE AS delivery_claims_enabled\nFROM postal_source_validation_readiness AS readiness\nJOIN postal_validation_runtime_contract/);
  assert.match(sqliteSql, /julianday\(contract\.runtime_review_by\) >= julianday\('now'\)/);
  assert.match(postgresSql, /contract\.runtime_review_by >= CURRENT_TIMESTAMP/);
});

test('registers source-evidence schemas for durable SQLite and Postgres adapters', () => {
  assert.ok(getDatabaseAdapterCompatibility('sqlite')?.schemaRefs.includes(
    'db/postal-source-evidence-registry.sqlite.sql',
  ));
  for (const adapterId of ['postgres', 'neon-postgres', 'supabase'] as const) {
    assert.ok(getDatabaseAdapterCompatibility(adapterId)?.schemaRefs.includes(
      'db/postal-source-evidence-registry.postgres.sql',
    ));
  }
});
