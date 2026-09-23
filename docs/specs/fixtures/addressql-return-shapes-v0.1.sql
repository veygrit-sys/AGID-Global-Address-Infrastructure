-- AddressQL synthetic return-shape fixture v0.1.
-- This file documents expected JSON result shapes for SQL adapters.
-- It contains synthetic tokens only and no raw private address, recipient,
-- witness, private key, proof secret, production credential, or carrier traffic.

/* addressql-json:ADDRESS_CANONICAL */
SELECT
  'ADDRESS_CANONICAL' AS function_name,
  'CanonicalAddressObject' AS output_kind,
  '{
    "version": "address-object-v0.1",
    "object_kind": "delivery_point",
    "expression": {
      "display_text_redacted": "SYNTHETIC_FIXTURE_ADDRESS_TOKEN",
      "language": "en",
      "script": "Latn",
      "raw_text_present": false
    },
    "country": {
      "iso3166_1_alpha2": "ZZ",
      "confidence": 0.92
    },
    "components": {
      "admin_area_token": "SYNTH_ADMIN",
      "locality_token": "SYNTH_LOCALITY",
      "postal_code_token": "SYNTH_POSTAL",
      "thoroughfare_token": "SYNTH_ROUTE",
      "premise_token": "SYNTH_PREMISE"
    },
    "referent": {
      "referent_type": "delivery_point",
      "id_token": "REF_SYNTHETIC_DELIVERY_POINT"
    },
    "identifiers": [
      {
        "scheme": "AGID",
        "value_token": "AGID_SYNTHETIC_TOKEN",
        "source_ref": "fixture:addressql-return-shapes-v0.1"
      }
    ],
    "quality_state": {
      "status": "format_checked",
      "purpose": "delivery",
      "source_version": "synthetic-v0.1"
    },
    "evidence": [
      {
        "source_ref": "fixture:addressql-return-shapes-v0.1",
        "source_kind": "synthetic_fixture",
        "checked_at": "2026-07-04T00:00:00Z"
      }
    ],
    "privacy": {
      "contains_raw_address": false,
      "disclosure_level": "tokenized",
      "retention_policy": "fixture_only"
    },
    "validation_links": [
      "fixture:address-validation-result-v0.1"
    ]
  }' AS result_json;
/* end-addressql-json */

/* addressql-json:POSTAL_VALIDATE */
SELECT
  'POSTAL_VALIDATE' AS function_name,
  'PostalValidationResult' AS output_kind,
  '{
    "version": "address-validation-result-v0.1",
    "purpose": "format",
    "status": "pass",
    "confidence": 0.95,
    "checked_at": "2026-07-04T00:00:00Z",
    "expires_at": "2026-10-04T00:00:00Z",
    "source_refs": [
      "fixture:addressql-return-shapes-v0.1"
    ],
    "evidence_level": "synthetic",
    "field_results": [
      {
        "field": "country",
        "status": "pass",
        "reason_code": "synthetic_country_token_present"
      },
      {
        "field": "postal_code",
        "status": "pass",
        "reason_code": "synthetic_postal_token_present"
      },
      {
        "field": "recipient_authorization",
        "status": "not_applicable",
        "reason_code": "format_check_does_not_evaluate_identity"
      }
    ],
    "result_boundaries": {
      "format_pass_does_not_imply_existence": true,
      "existence_pass_does_not_imply_delivery": true,
      "delivery_pass_does_not_imply_identity": true,
      "identity_pass_does_not_disclose_full_address": true
    },
    "privacy": {
      "contains_raw_address": false,
      "log_safe": true,
      "disclosure_scope": "field_status"
    },
    "non_claims": [
      "A passing format check does not claim that the address exists.",
      "Postal validation does not guarantee latency, availability, or a runtime service-level objective.",
      "This fixture contains no raw address, recipient, witness, private key, proof secret, or production credential material."
    ]
  }' AS result_json;
/* end-addressql-json */
