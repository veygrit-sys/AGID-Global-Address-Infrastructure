-- Metadata-only postal source evidence registry for local AGID deployments.
-- This schema intentionally excludes address, recipient, postcode, coordinate,
-- credential, and query-log columns.

CREATE TABLE IF NOT EXISTS postal_source_scope (
  scope_id TEXT PRIMARY KEY,
  country_code TEXT NOT NULL CHECK (length(country_code) = 2 AND country_code = upper(country_code)),
  scope_kind TEXT NOT NULL CHECK (scope_kind IN ('national', 'regional', 'format-variant', 'neutral-operational')),
  scope_status TEXT NOT NULL CHECK (scope_status IN ('candidate', 'metadata-only-approved', 'renewal-due', 'blocked')),
  non_claim TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  raw_private_material_stored INTEGER NOT NULL DEFAULT 0 CHECK (raw_private_material_stored = 0)
);

-- Candidate rows preserve what is known about a public source without inventing
-- terms, version, coverage, or correction evidence. They never enable validation.
CREATE TABLE IF NOT EXISTS postal_source_candidate (
  candidate_id TEXT PRIMARY KEY,
  scope_id TEXT NOT NULL REFERENCES postal_source_scope(scope_id) ON DELETE CASCADE,
  source_id TEXT NOT NULL,
  source_url TEXT NOT NULL,
  catalog_version TEXT NOT NULL,
  source_version TEXT,
  source_version_status TEXT NOT NULL CHECK (source_version_status IN ('not-recorded', 'observed-unverified', 'verified-current')),
  terms_url TEXT,
  terms_status TEXT NOT NULL CHECK (terms_status IN ('not-recorded', 'terms-observed', 'reuse-evidenced', 'restricted-or-unclear')),
  coverage_status TEXT NOT NULL CHECK (coverage_status IN ('not-recorded', 'partial-or-unknown', 'national-coverage-evidenced')),
  correction_url TEXT,
  correction_path_status TEXT NOT NULL CHECK (correction_path_status IN ('not-recorded', 'general-contact-only', 'source-specific-confirmed')),
  candidate_status TEXT NOT NULL CHECK (candidate_status IN ('metadata-only', 'promotion-review-ready', 'blocked', 'superseded')),
  next_gate TEXT NOT NULL CHECK (next_gate IN ('record-source-version', 'record-reuse-terms', 'record-coverage', 'record-correction-path', 'record-independent-quality-plan', 'blocked-or-superseded')),
  discovered_at TEXT NOT NULL,
  review_by TEXT NOT NULL,
  catalog_metadata_digest TEXT NOT NULL CHECK (length(catalog_metadata_digest) > 0),
  raw_private_material_stored INTEGER NOT NULL DEFAULT 0 CHECK (raw_private_material_stored = 0),
  CHECK (
    (source_version_status = 'not-recorded' AND source_version IS NULL)
    OR (source_version_status IN ('observed-unverified', 'verified-current') AND source_version IS NOT NULL AND length(source_version) > 0)
  ),
  CHECK (
    (terms_status = 'not-recorded' AND terms_url IS NULL)
    OR (terms_status IN ('terms-observed', 'reuse-evidenced', 'restricted-or-unclear') AND terms_url IS NOT NULL)
  ),
  CHECK (
    (correction_path_status = 'not-recorded' AND correction_url IS NULL)
    OR (correction_path_status IN ('general-contact-only', 'source-specific-confirmed') AND correction_url IS NOT NULL)
  ),
  UNIQUE (scope_id, source_id)
);

CREATE TABLE IF NOT EXISTS postal_source_record (
  source_record_id TEXT PRIMARY KEY,
  scope_id TEXT NOT NULL REFERENCES postal_source_scope(scope_id) ON DELETE CASCADE,
  source_id TEXT NOT NULL,
  source_version TEXT NOT NULL,
  source_url TEXT NOT NULL,
  terms_url TEXT NOT NULL,
  correction_url TEXT NOT NULL,
  correction_path_status TEXT NOT NULL CHECK (correction_path_status IN ('source-specific-confirmed', 'general-contact-only', 'not-recorded')),
  coverage_status TEXT NOT NULL CHECK (coverage_status IN ('not-recorded', 'partial-or-unknown', 'national-coverage-evidenced')),
  reuse_status TEXT NOT NULL CHECK (reuse_status IN ('conditional-open-reuse', 'licensed-restricted', 'terms-review-required', 'no-neutral-operator-dataset')),
  allowed_use TEXT NOT NULL CHECK (allowed_use IN ('non-delivery-postal-metadata-only', 'none-without-separate-license-or-permission')),
  approval_status TEXT NOT NULL CHECK (approval_status IN ('candidate', 'metadata-only-approved', 'metadata-only-renewal-due', 'not-approved')),
  retrieved_at TEXT NOT NULL,
  review_by TEXT NOT NULL,
  source_digest TEXT NOT NULL CHECK (length(source_digest) > 0),
  terms_digest TEXT NOT NULL CHECK (length(terms_digest) > 0),
  recorded_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  raw_private_material_stored INTEGER NOT NULL DEFAULT 0 CHECK (raw_private_material_stored = 0),
  UNIQUE (scope_id, source_id, source_version)
);

CREATE TABLE IF NOT EXISTS postal_source_correction_evidence (
  correction_evidence_id TEXT PRIMARY KEY,
  source_record_id TEXT NOT NULL REFERENCES postal_source_record(source_record_id) ON DELETE CASCADE,
  evidence_kind TEXT NOT NULL CHECK (evidence_kind IN ('dataset-page', 'dataset-changelog', 'official-ticket-policy', 'official-support-instruction')),
  evidence_url TEXT NOT NULL,
  evidence_digest TEXT NOT NULL,
  verified_at TEXT NOT NULL,
  raw_private_material_stored INTEGER NOT NULL DEFAULT 0 CHECK (raw_private_material_stored = 0),
  UNIQUE (source_record_id, evidence_url)
);

CREATE TABLE IF NOT EXISTS postal_source_review_event (
  review_event_id TEXT PRIMARY KEY,
  source_record_id TEXT NOT NULL REFERENCES postal_source_record(source_record_id) ON DELETE CASCADE,
  review_status TEXT NOT NULL CHECK (review_status IN ('approved', 'renewal-due', 'blocked', 'superseded')),
  reviewer_commitment_digest TEXT,
  findings_digest TEXT NOT NULL,
  reviewed_at TEXT NOT NULL,
  raw_private_material_stored INTEGER NOT NULL DEFAULT 0 CHECK (raw_private_material_stored = 0)
);

CREATE TABLE IF NOT EXISTS postal_source_quality_evidence (
  quality_evidence_id TEXT PRIMARY KEY,
  source_record_id TEXT NOT NULL REFERENCES postal_source_record(source_record_id) ON DELETE CASCADE,
  evaluation_kind TEXT NOT NULL CHECK (evaluation_kind IN ('synthetic', 'aggregate-only')),
  evaluation_version TEXT NOT NULL,
  quality_status TEXT NOT NULL CHECK (quality_status IN ('approved', 'blocked', 'superseded')),
  case_count INTEGER NOT NULL CHECK (case_count > 0),
  format_pass_count INTEGER NOT NULL CHECK (format_pass_count >= 0 AND format_pass_count <= case_count),
  false_accept_count INTEGER NOT NULL CHECK (false_accept_count >= 0 AND false_accept_count <= case_count),
  false_reject_count INTEGER NOT NULL CHECK (false_reject_count >= 0 AND false_reject_count <= case_count),
  report_digest TEXT NOT NULL,
  evaluated_at TEXT NOT NULL,
  reviewed_at TEXT NOT NULL,
  quality_review_by TEXT NOT NULL,
  raw_private_material_stored INTEGER NOT NULL DEFAULT 0 CHECK (raw_private_material_stored = 0),
  UNIQUE (source_record_id, evaluation_kind, evaluation_version)
);

CREATE TABLE IF NOT EXISTS postal_source_quality_attestation (
  quality_attestation_id TEXT PRIMARY KEY,
  quality_evidence_id TEXT NOT NULL REFERENCES postal_source_quality_evidence(quality_evidence_id) ON DELETE CASCADE,
  attestation_kind TEXT NOT NULL CHECK (attestation_kind = 'independent-detached-signature'),
  independence_status TEXT NOT NULL CHECK (independence_status IN ('independent', 'self-attested', 'unknown')),
  attestation_status TEXT NOT NULL CHECK (attestation_status IN ('verified', 'blocked', 'superseded')),
  signer_key_fingerprint TEXT NOT NULL CHECK (length(signer_key_fingerprint) > 0),
  signature_digest TEXT NOT NULL CHECK (length(signature_digest) > 0),
  verified_at TEXT NOT NULL,
  raw_private_material_stored INTEGER NOT NULL DEFAULT 0 CHECK (raw_private_material_stored = 0),
  UNIQUE (quality_evidence_id, signer_key_fingerprint)
);

CREATE TABLE IF NOT EXISTS postal_validation_runtime_contract (
  runtime_contract_id TEXT PRIMARY KEY,
  scope_id TEXT NOT NULL REFERENCES postal_source_scope(scope_id) ON DELETE CASCADE,
  contract_version TEXT NOT NULL,
  contract_status TEXT NOT NULL CHECK (contract_status IN ('approved', 'blocked', 'superseded')),
  processing_mode TEXT NOT NULL CHECK (processing_mode IN ('client-controlled-ephemeral', 'offline-local-metadata-only')),
  raw_input_persistence TEXT NOT NULL CHECK (raw_input_persistence = 'none'),
  telemetry_mode TEXT NOT NULL CHECK (telemetry_mode IN ('none', 'aggregate-only')),
  target_p95_latency_ms INTEGER NOT NULL CHECK (target_p95_latency_ms > 0),
  target_availability_basis_points INTEGER NOT NULL CHECK (target_availability_basis_points > 0 AND target_availability_basis_points <= 10000),
  measurement_kind TEXT NOT NULL CHECK (measurement_kind IN ('synthetic', 'aggregate-only', 'not-measured')),
  contract_digest TEXT NOT NULL CHECK (length(contract_digest) > 0),
  reviewed_at TEXT NOT NULL,
  runtime_review_by TEXT NOT NULL,
  raw_private_material_stored INTEGER NOT NULL DEFAULT 0 CHECK (raw_private_material_stored = 0),
  UNIQUE (scope_id, contract_version)
);

CREATE TABLE IF NOT EXISTS postal_validation_language_policy (
  language_policy_id TEXT PRIMARY KEY,
  scope_id TEXT NOT NULL REFERENCES postal_source_scope(scope_id) ON DELETE CASCADE,
  language_tag TEXT NOT NULL CHECK (length(language_tag) >= 2),
  script_code TEXT NOT NULL CHECK (length(script_code) = 4),
  standardization_status TEXT NOT NULL CHECK (standardization_status IN ('disabled', 'format-only', 'official-reference-evidenced', 'not-evidenced')),
  typo_correction_status TEXT NOT NULL CHECK (typo_correction_status IN ('disabled', 'synthetic-evidenced', 'aggregate-evidenced')),
  policy_status TEXT NOT NULL CHECK (policy_status IN ('approved', 'blocked', 'superseded')),
  policy_digest TEXT NOT NULL CHECK (length(policy_digest) > 0),
  reviewed_at TEXT NOT NULL,
  language_review_by TEXT NOT NULL,
  raw_private_material_stored INTEGER NOT NULL DEFAULT 0 CHECK (raw_private_material_stored = 0),
  UNIQUE (scope_id, language_tag, script_code)
);

-- This view is deliberately fail-closed. It enables an official-reference
-- validation claim only after every recorded evidence gate is present.
-- Delivery claims remain disabled because this registry has no delivery-point data.
CREATE VIEW IF NOT EXISTS postal_source_validation_readiness AS
SELECT
  scope.scope_id,
  scope.country_code,
  source.source_record_id,
  source.source_id,
  source.source_version,
  CASE
    WHEN scope.scope_status = 'metadata-only-approved'
      AND scope.raw_private_material_stored = 0
      AND source.approval_status = 'metadata-only-approved'
      AND source.reuse_status = 'conditional-open-reuse'
      AND source.allowed_use = 'non-delivery-postal-metadata-only'
      AND source.correction_path_status = 'source-specific-confirmed'
      AND source.coverage_status = 'national-coverage-evidenced'
      AND julianday(source.review_by) >= julianday('now')
      AND source.raw_private_material_stored = 0
      AND EXISTS (
        SELECT 1
        FROM postal_source_correction_evidence AS correction
        WHERE correction.source_record_id = source.source_record_id
          AND correction.raw_private_material_stored = 0
      )
      AND COALESCE((
        SELECT quality_evidence.quality_status
        FROM postal_source_quality_evidence AS quality_evidence
        WHERE quality_evidence.source_record_id = source.source_record_id
          AND quality_evidence.evaluation_kind IN ('synthetic', 'aggregate-only')
          AND quality_evidence.case_count > 0
          AND julianday(quality_evidence.quality_review_by) >= julianday('now')
          AND quality_evidence.raw_private_material_stored = 0
          AND COALESCE((
            SELECT attestation.attestation_status
            FROM postal_source_quality_attestation AS attestation
            WHERE attestation.quality_evidence_id = quality_evidence.quality_evidence_id
              AND attestation.attestation_kind = 'independent-detached-signature'
              AND attestation.independence_status = 'independent'
              AND attestation.raw_private_material_stored = 0
            ORDER BY attestation.verified_at DESC, attestation.quality_attestation_id DESC
            LIMIT 1
          ), 'blocked') = 'verified'
        ORDER BY quality_evidence.reviewed_at DESC, quality_evidence.quality_evidence_id DESC
        LIMIT 1
      ), 'blocked') = 'approved'
      AND COALESCE((
        SELECT review_event.review_status
        FROM postal_source_review_event AS review_event
        WHERE review_event.source_record_id = source.source_record_id
          AND review_event.raw_private_material_stored = 0
        ORDER BY review_event.reviewed_at DESC, review_event.review_event_id DESC
        LIMIT 1
      ), 'blocked') = 'approved'
    THEN 1
    ELSE 0
  END AS official_reference_validation_eligible,
  0 AS delivery_claims_enabled
FROM postal_source_scope AS scope
JOIN postal_source_record AS source ON source.scope_id = scope.scope_id;

-- Candidate evidence may become ready for a human review to create a strict
-- source record, but it never grants an official-reference validation claim.
CREATE VIEW IF NOT EXISTS postal_source_candidate_promotion_readiness AS
SELECT
  scope.scope_id,
  scope.country_code,
  candidate.candidate_id,
  candidate.source_id,
  candidate.source_url,
  candidate.catalog_version,
  candidate.source_version_status,
  candidate.terms_status,
  candidate.coverage_status,
  candidate.correction_path_status,
  candidate.next_gate,
  CASE
    WHEN scope.scope_status = 'metadata-only-approved'
      AND scope.raw_private_material_stored = 0
      AND candidate.candidate_status = 'promotion-review-ready'
      AND candidate.source_version_status = 'verified-current'
      AND candidate.terms_status = 'reuse-evidenced'
      AND candidate.coverage_status = 'national-coverage-evidenced'
      AND candidate.correction_path_status = 'source-specific-confirmed'
      AND julianday(candidate.review_by) >= julianday('now')
      AND candidate.raw_private_material_stored = 0
    THEN 1
    ELSE 0
  END AS source_record_promotion_review_eligible,
  0 AS delivery_claims_enabled
FROM postal_source_scope AS scope
JOIN postal_source_candidate AS candidate ON candidate.scope_id = scope.scope_id;

-- This contract is evidence of a privacy-preserving runtime policy, not an SLA.
CREATE VIEW IF NOT EXISTS postal_validation_runtime_readiness AS
SELECT
  readiness.scope_id,
  readiness.country_code,
  readiness.source_record_id,
  readiness.source_id,
  readiness.source_version,
  contract.contract_version,
  contract.processing_mode,
  contract.telemetry_mode,
  contract.target_p95_latency_ms,
  contract.target_availability_basis_points,
  contract.measurement_kind,
  CASE
    WHEN readiness.official_reference_validation_eligible = 1
      AND contract.contract_status = 'approved'
      AND contract.processing_mode IN ('client-controlled-ephemeral', 'offline-local-metadata-only')
      AND contract.raw_input_persistence = 'none'
      AND contract.telemetry_mode IN ('none', 'aggregate-only')
      AND contract.measurement_kind IN ('synthetic', 'aggregate-only')
      AND julianday(contract.runtime_review_by) >= julianday('now')
      AND contract.raw_private_material_stored = 0
    THEN 1
    ELSE 0
  END AS privacy_preserving_runtime_contract_enabled,
  0 AS delivery_claims_enabled
FROM postal_source_validation_readiness AS readiness
JOIN postal_validation_runtime_contract AS contract ON contract.scope_id = readiness.scope_id;

-- A language policy only enables capabilities explicitly supported by evidence.
CREATE VIEW IF NOT EXISTS postal_validation_language_readiness AS
SELECT
  readiness.scope_id,
  readiness.country_code,
  readiness.source_record_id,
  readiness.source_id,
  readiness.source_version,
  policy.language_tag,
  policy.script_code,
  CASE
    WHEN readiness.official_reference_validation_eligible = 1
      AND policy.policy_status = 'approved'
      AND policy.standardization_status = 'official-reference-evidenced'
      AND julianday(policy.language_review_by) >= julianday('now')
      AND policy.raw_private_material_stored = 0
    THEN 1
    ELSE 0
  END AS standardization_enabled,
  CASE
    WHEN readiness.official_reference_validation_eligible = 1
      AND policy.policy_status = 'approved'
      AND policy.typo_correction_status IN ('synthetic-evidenced', 'aggregate-evidenced')
      AND julianday(policy.language_review_by) >= julianday('now')
      AND policy.raw_private_material_stored = 0
    THEN 1
    ELSE 0
  END AS typo_correction_enabled,
  0 AS delivery_claims_enabled
FROM postal_source_validation_readiness AS readiness
JOIN postal_validation_language_policy AS policy ON policy.scope_id = readiness.scope_id;

CREATE INDEX IF NOT EXISTS postal_source_scope_country_status_idx
  ON postal_source_scope(country_code, scope_status);

CREATE INDEX IF NOT EXISTS postal_source_candidate_scope_status_idx
  ON postal_source_candidate(scope_id, candidate_status, review_by);

CREATE INDEX IF NOT EXISTS postal_source_record_scope_approval_idx
  ON postal_source_record(scope_id, approval_status, coverage_status, review_by);

CREATE INDEX IF NOT EXISTS postal_source_record_source_idx
  ON postal_source_record(source_id, source_version);

CREATE INDEX IF NOT EXISTS postal_source_correction_evidence_record_idx
  ON postal_source_correction_evidence(source_record_id, verified_at);

CREATE INDEX IF NOT EXISTS postal_source_quality_evidence_record_idx
  ON postal_source_quality_evidence(source_record_id, reviewed_at);

CREATE INDEX IF NOT EXISTS postal_source_quality_evidence_freshness_idx
  ON postal_source_quality_evidence(source_record_id, quality_review_by, reviewed_at);

CREATE INDEX IF NOT EXISTS postal_source_quality_attestation_evidence_idx
  ON postal_source_quality_attestation(quality_evidence_id, verified_at);

CREATE INDEX IF NOT EXISTS postal_validation_runtime_contract_scope_idx
  ON postal_validation_runtime_contract(scope_id, contract_status, runtime_review_by, reviewed_at);

CREATE INDEX IF NOT EXISTS postal_validation_language_policy_scope_idx
  ON postal_validation_language_policy(scope_id, policy_status, language_review_by, language_tag, script_code);

CREATE INDEX IF NOT EXISTS postal_source_review_event_record_idx
  ON postal_source_review_event(source_record_id, reviewed_at);
