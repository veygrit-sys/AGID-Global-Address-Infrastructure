\echo Use "CREATE EXTENSION addressql" to load this file. \quit

CREATE SCHEMA IF NOT EXISTS addressql;

CREATE TABLE IF NOT EXISTS addressql.country_profiles (
  country_code text PRIMARY KEY,
  country_name text NOT NULL,
  native_name text,
  aliases text[] NOT NULL DEFAULT ARRAY[]::text[],
  languages text[] NOT NULL DEFAULT ARRAY[]::text[],
  address_format_coverage text NOT NULL DEFAULT 'seed_profile_required'
    CHECK (address_format_coverage IN ('native_and_english_preloaded', 'native_only_preloaded', 'english_only_preloaded', 'seed_profile_required')),
  validation_readiness text NOT NULL DEFAULT 'manual_review_required'
    CHECK (validation_readiness IN ('format_only', 'metadata_gated', 'postal_equivalent_required', 'delivery_source_required', 'manual_review_required')),
  postal_status text NOT NULL CHECK (postal_status IN ('official', 'weak', 'none', 'carrier_specific', 'unknown')),
  postal_required_default boolean NOT NULL DEFAULT false,
  postal_pattern text,
  postal_example text,
  postal_equivalent_strategy text NOT NULL DEFAULT 'none',
  native_input_available boolean NOT NULL DEFAULT false,
  english_input_available boolean NOT NULL DEFAULT true,
  required_components text[] NOT NULL DEFAULT ARRAY[]::text[],
  source_version text NOT NULL
);

CREATE TABLE IF NOT EXISTS addressql.postal_areas (
  country_code text NOT NULL,
  postal_code text NOT NULL,
  region_ref text NOT NULL,
  region_name text NOT NULL,
  boundary_wkt text,
  centroid_lat double precision,
  centroid_lon double precision,
  source_version text NOT NULL,
  PRIMARY KEY (country_code, postal_code, source_version)
);

CREATE TABLE IF NOT EXISTS addressql.delivery_regions (
  region_ref text PRIMARY KEY,
  country_code text NOT NULL,
  carrier text NOT NULL DEFAULT 'synthetic_carrier',
  service_level text NOT NULL DEFAULT 'standard',
  boundary_wkt text,
  source_version text NOT NULL
);

CREATE TABLE IF NOT EXISTS addressql.synthetic_addresses (
  fixture_id text PRIMARY KEY,
  country_code text NOT NULL,
  input_text text NOT NULL,
  normalized jsonb NOT NULL,
  postal_code text,
  region_ref text,
  point_wkt text,
  expected_valid boolean NOT NULL DEFAULT true,
  source_version text NOT NULL
);

CREATE OR REPLACE FUNCTION addressql._source_version(input_version text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(NULLIF(input_version, ''), 'synthetic-addressql-v0.1')
$$;

CREATE OR REPLACE FUNCTION addressql._country(input_country text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT upper(trim(COALESCE(input_country, '')))
$$;

CREATE OR REPLACE FUNCTION addressql._clean_text(input_text text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT regexp_replace(trim(COALESCE(input_text, '')), '\s+', ' ', 'g')
$$;

CREATE OR REPLACE FUNCTION addressql.postgis_available()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis')
$$;

CREATE OR REPLACE FUNCTION addressql.country_resolve(
  country_input text,
  standard text DEFAULT 'ISO3166-1-alpha2',
  source_version text DEFAULT 'synthetic-addressql-v0.1'
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_input text := addressql._clean_text(country_input);
  v_source text := addressql._source_version(source_version);
  v_profile addressql.country_profiles%ROWTYPE;
BEGIN
  SELECT *
    INTO v_profile
    FROM addressql.country_profiles cp
   WHERE cp.source_version = v_source
     AND (
       upper(cp.country_code) = upper(v_input)
       OR lower(cp.country_name) = lower(v_input)
       OR lower(cp.native_name) = lower(v_input)
       OR lower(v_input) = ANY (SELECT lower(alias) FROM unnest(cp.aliases) AS aliases(alias))
     )
   LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'input', v_input,
      'country_code', v_profile.country_code,
      'standard', standard,
      'confidence', 1.0,
      'source_version', v_source,
      'warnings', jsonb_build_array(),
      'non_claims', jsonb_build_array('Country resolution is not sovereignty adjudication.')
    );
  END IF;

  RETURN jsonb_build_object(
    'input', v_input,
    'country_code', addressql._country(v_input),
    'standard', standard,
    'confidence', 0.2,
    'source_version', v_source,
    'warnings', jsonb_build_array('country_not_found_in_source_version'),
    'non_claims', jsonb_build_array('Country resolution is not sovereignty adjudication.')
  );
END;
$$;

CREATE OR REPLACE FUNCTION addressql.country_address_profile(
  country_code text,
  source_version text DEFAULT 'synthetic-addressql-v0.1'
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_country text := addressql._country(country_code);
  v_source text := addressql._source_version(source_version);
  v_profile addressql.country_profiles%ROWTYPE;
BEGIN
  SELECT * INTO v_profile
    FROM addressql.country_profiles cp
   WHERE cp.country_code = v_country
     AND cp.source_version = v_source;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'country', v_country,
      'source_version', v_source,
      'warnings', jsonb_build_array('country_profile_missing'),
      'non_claims', jsonb_build_array('A country profile is not full address data coverage.')
    );
  END IF;

  RETURN jsonb_build_object(
    'country', v_profile.country_code,
    'country_name', v_profile.country_name,
    'native_name', v_profile.native_name,
    'locales', to_jsonb(v_profile.languages),
    'address_format_coverage', v_profile.address_format_coverage,
    'validation_readiness', v_profile.validation_readiness,
    'native_input_available', v_profile.native_input_available,
    'english_input_available', v_profile.english_input_available,
    'required_components', to_jsonb(v_profile.required_components),
    'postal_status', v_profile.postal_status,
    'postal_required_default', v_profile.postal_required_default,
    'postal_equivalent_strategy', v_profile.postal_equivalent_strategy,
    'source_version', v_source,
    'non_claims', jsonb_build_array(
      'A country profile is not full address data coverage.',
      'A preloaded country profile is not proof of global address completeness.'
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION addressql.country_postal_status(
  country_code text,
  source_version text DEFAULT 'synthetic-addressql-v0.1'
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN addressql.postal_status(country_code, source_version);
END;
$$;

CREATE OR REPLACE FUNCTION addressql.address_parse(
  address_text text,
  country_code text DEFAULT NULL,
  source_version text DEFAULT 'synthetic-addressql-v0.1'
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_text text := addressql._clean_text(address_text);
  v_country text := NULLIF(addressql._country(country_code), '');
  v_source text := addressql._source_version(source_version);
BEGIN
  RETURN jsonb_build_object(
    'country', v_country,
    'components', jsonb_build_object(
      'line1', v_text,
      'country', v_country
    ),
    'source_version', v_source,
    'confidence', CASE WHEN v_text = '' THEN 0 ELSE 0.5 END,
    'warnings', CASE WHEN v_text = '' THEN jsonb_build_array('empty_address_text') ELSE jsonb_build_array() END,
    'non_claims', jsonb_build_array('Parsing is not address identity.')
  );
END;
$$;

CREATE OR REPLACE FUNCTION addressql.address_normalize(
  address_text text,
  country_code text,
  source_version text DEFAULT 'synthetic-addressql-v0.1'
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_text text := addressql._clean_text(address_text);
  v_country text := addressql._country(country_code);
  v_source text := addressql._source_version(source_version);
BEGIN
  RETURN jsonb_build_object(
    'normalized_text', v_text,
    'country', v_country,
    'locale', 'und',
    'components', jsonb_build_object('country', v_country, 'line1', v_text),
    'source_version', v_source,
    'warnings', jsonb_build_array(),
    'non_claims', jsonb_build_array('Normalization is not referent resolution.')
  );
END;
$$;

CREATE OR REPLACE FUNCTION addressql.address_match(
  address_a jsonb,
  address_b jsonb,
  purpose text DEFAULT 'delivery',
  source_version text DEFAULT 'synthetic-addressql-v0.1'
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_a text := lower(addressql._clean_text(COALESCE(address_a->>'normalized_text', address_a->>'line1', '')));
  v_b text := lower(addressql._clean_text(COALESCE(address_b->>'normalized_text', address_b->>'line1', '')));
  v_country_a text := addressql._country(COALESCE(address_a->>'country', ''));
  v_country_b text := addressql._country(COALESCE(address_b->>'country', ''));
  v_match boolean := false;
BEGIN
  v_match := v_a <> '' AND v_a = v_b AND (v_country_a = '' OR v_country_b = '' OR v_country_a = v_country_b);

  RETURN jsonb_build_object(
    'match', v_match,
    'confidence', CASE WHEN v_match THEN 0.95 ELSE 0.25 END,
    'purpose', purpose,
    'source_version', addressql._source_version(source_version),
    'non_claims', jsonb_build_array('A match decision is purpose-relative and not proof of residence.')
  );
END;
$$;

CREATE OR REPLACE FUNCTION addressql.postal_status(
  country_code text,
  source_version text DEFAULT 'synthetic-addressql-v0.1'
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_country text := addressql._country(country_code);
  v_source text := addressql._source_version(source_version);
  v_profile addressql.country_profiles%ROWTYPE;
BEGIN
  SELECT * INTO v_profile
    FROM addressql.country_profiles cp
   WHERE cp.country_code = v_country
     AND cp.source_version = v_source;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'country', v_country,
      'status', 'unknown',
      'requiredness', 'unknown',
      'coverage', 'unknown',
      'source_version', v_source,
      'warnings', jsonb_build_array('country_profile_missing'),
      'non_claims', jsonb_build_array('Postal status is not carrier availability or address identity.')
    );
  END IF;

  RETURN jsonb_build_object(
    'country', v_country,
    'status', v_profile.postal_status,
    'validation_readiness', v_profile.validation_readiness,
    'requiredness', CASE WHEN v_profile.postal_required_default THEN 'required_by_default' ELSE 'not_required_by_default' END,
    'format_available', v_profile.postal_pattern IS NOT NULL,
    'coverage', CASE v_profile.postal_status WHEN 'official' THEN 'source_declared' WHEN 'none' THEN 'no_postal_code' ELSE 'partial_or_policy_dependent' END,
    'postal_equivalent_strategy', v_profile.postal_equivalent_strategy,
    'source_version', v_source,
    'non_claims', jsonb_build_array(
      'Postal status is not carrier availability or address identity.',
      CASE
        WHEN v_profile.postal_status = 'none'
        THEN 'Postal-equivalent regions are operational fallbacks, not official postal codes.'
        ELSE 'Postal validation is not proof of residence, identity, or carrier SLA.'
      END
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION addressql.postal_format(
  country_code text,
  source_version text DEFAULT 'synthetic-addressql-v0.1'
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_country text := addressql._country(country_code);
  v_source text := addressql._source_version(source_version);
  v_profile addressql.country_profiles%ROWTYPE;
BEGIN
  SELECT * INTO v_profile
    FROM addressql.country_profiles cp
   WHERE cp.country_code = v_country
     AND cp.source_version = v_source;

  RETURN jsonb_build_object(
    'country', v_country,
    'pattern', v_profile.postal_pattern,
    'examples', CASE WHEN v_profile.postal_example IS NULL THEN jsonb_build_array() ELSE jsonb_build_array(v_profile.postal_example) END,
    'normalization_rules', jsonb_build_array('trim', 'uppercase', 'collapse_spaces'),
    'source_version', v_source,
    'non_claims', jsonb_build_array('A valid format does not prove that the postal code exists or matches the address.')
  );
END;
$$;

CREATE OR REPLACE FUNCTION addressql.postal_format_validate(
  postal_code text,
  country_code text,
  source_version text DEFAULT 'synthetic-addressql-v0.1'
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_country text := addressql._country(country_code);
  v_source text := addressql._source_version(source_version);
  v_normalized text := addressql.postal_normalize(postal_code, v_country, v_source)->>'normalized';
  v_profile addressql.country_profiles%ROWTYPE;
  v_format_valid boolean := false;
BEGIN
  SELECT * INTO v_profile
    FROM addressql.country_profiles cp
   WHERE cp.country_code = v_country
     AND cp.source_version = v_source;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'format_valid', false,
      'postal_code', v_normalized,
      'country', v_country,
      'source_version', v_source,
      'warnings', jsonb_build_array('country_profile_missing'),
      'non_claims', jsonb_build_array('Format validation is not postcode existence validation.')
    );
  END IF;

  IF v_profile.postal_status = 'none' THEN
    v_format_valid := COALESCE(v_normalized, '') = '';
  ELSIF COALESCE(v_normalized, '') = '' THEN
    v_format_valid := NOT v_profile.postal_required_default;
  ELSIF v_profile.postal_pattern IS NOT NULL THEN
    v_format_valid := v_normalized ~ v_profile.postal_pattern;
  ELSE
    v_format_valid := NOT v_profile.postal_required_default;
  END IF;

  RETURN jsonb_build_object(
    'format_valid', v_format_valid,
    'postal_code', v_normalized,
    'country', v_country,
    'source_version', v_source,
    'warnings', CASE
      WHEN v_profile.postal_status = 'none' AND COALESCE(v_normalized, '') <> ''
      THEN jsonb_build_array('country_has_no_postal_code_system', 'postal_equivalent_required')
      ELSE jsonb_build_array()
    END,
    'non_claims', jsonb_build_array('Format validation is not postcode existence validation.')
  );
END;
$$;

CREATE OR REPLACE FUNCTION addressql.postal_normalize(
  postal_code text,
  country_code text,
  source_version text DEFAULT 'synthetic-addressql-v0.1'
)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_country text := addressql._country(country_code);
  v_postal text := upper(addressql._clean_text(postal_code));
BEGIN
  IF v_country = 'JP' THEN
    v_postal := regexp_replace(v_postal, '^([0-9]{3})([0-9]{4})$', '\1-\2');
  END IF;

  RETURN jsonb_build_object(
    'input', postal_code,
    'normalized', v_postal,
    'country', v_country,
    'source_version', addressql._source_version(source_version),
    'warnings', jsonb_build_array(),
    'non_claims', jsonb_build_array('Postal normalization is not postal validation.')
  );
END;
$$;

CREATE OR REPLACE FUNCTION addressql.postal_exists(
  postal_code text,
  country_code text,
  source_version text DEFAULT 'synthetic-addressql-v0.1'
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_country text := addressql._country(country_code);
  v_source text := addressql._source_version(source_version);
  v_normalized text := addressql.postal_normalize(postal_code, v_country, v_source)->>'normalized';
  v_profile addressql.country_profiles%ROWTYPE;
  v_exists boolean;
BEGIN
  SELECT * INTO v_profile
    FROM addressql.country_profiles cp
   WHERE cp.country_code = v_country
     AND cp.source_version = v_source;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'exists', NULL,
      'postal_code', v_normalized,
      'country', v_country,
      'source_version', v_source,
      'warnings', jsonb_build_array('country_profile_missing'),
      'non_claims', jsonb_build_array('Existence validation is limited to the loaded source-version fixture.')
    );
  END IF;

  IF v_profile.postal_status = 'none' OR COALESCE(v_normalized, '') = '' THEN
    RETURN jsonb_build_object(
      'exists', NULL,
      'postal_code', v_normalized,
      'country', v_country,
      'source_version', v_source,
      'warnings', CASE
        WHEN v_profile.postal_status = 'none'
        THEN jsonb_build_array('postal_equivalent_required')
        ELSE jsonb_build_array('postal_code_empty')
      END,
      'non_claims', jsonb_build_array('Existence validation is limited to the loaded source-version fixture.')
    );
  END IF;

  SELECT EXISTS (
    SELECT 1
      FROM addressql.postal_areas pa
     WHERE pa.country_code = v_country
       AND pa.postal_code = v_normalized
       AND pa.source_version = v_source
  ) INTO v_exists;

  RETURN jsonb_build_object(
    'exists', v_exists,
    'postal_code', v_normalized,
    'country', v_country,
    'source_version', v_source,
    'warnings', CASE WHEN v_exists THEN jsonb_build_array() ELSE jsonb_build_array('postal_code_not_found_in_fixture') END,
    'non_claims', jsonb_build_array('Existence validation is limited to the loaded source-version fixture.')
  );
END;
$$;

CREATE OR REPLACE FUNCTION addressql.postal_required(
  address_or_components jsonb,
  country_code text,
  purpose text DEFAULT 'delivery',
  source_version text DEFAULT 'synthetic-addressql-v0.1'
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_country text := addressql._country(country_code);
  v_source text := addressql._source_version(source_version);
  v_required boolean := false;
BEGIN
  SELECT COALESCE(cp.postal_required_default, false)
    INTO v_required
    FROM addressql.country_profiles cp
   WHERE cp.country_code = v_country
     AND cp.source_version = v_source;

  RETURN jsonb_build_object(
    'required', COALESCE(v_required, false),
    'purpose', purpose,
    'country', v_country,
    'source_version', v_source,
    'reasons', jsonb_build_array('country_profile_default'),
    'non_claims', jsonb_build_array('Postal requiredness is purpose-relative and not a universal legal statement.')
  );
END;
$$;

CREATE OR REPLACE FUNCTION addressql.postal_validate(
  address_or_components jsonb,
  postal_code text,
  country_code text,
  source_version text DEFAULT 'synthetic-addressql-v0.1'
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_country text := addressql._country(country_code);
  v_source text := addressql._source_version(source_version);
  v_normalized text := addressql.postal_normalize(postal_code, v_country, v_source)->>'normalized';
  v_profile addressql.country_profiles%ROWTYPE;
  v_profile_found boolean := false;
  v_format_valid boolean := false;
  v_exists boolean;
  v_valid boolean := false;
  v_region_ref text;
  v_scope text := 'country_profile_missing';
BEGIN
  SELECT * INTO v_profile
    FROM addressql.country_profiles cp
   WHERE cp.country_code = v_country
     AND cp.source_version = v_source;
  v_profile_found := FOUND;

  v_format_valid := COALESCE((addressql.postal_format_validate(v_normalized, v_country, v_source)->>'format_valid')::boolean, false);
  v_exists := (addressql.postal_exists(v_normalized, v_country, v_source)->>'exists')::boolean;

  IF v_profile_found AND v_profile.postal_status = 'none' AND COALESCE(v_normalized, '') = '' THEN
    RETURN jsonb_build_object(
      'version', 'address-validation-result-v0.1',
      'purpose', 'delivery',
      'status', 'pass',
      'confidence', 0.90,
      'source_refs', jsonb_build_array('postgres-extension:' || v_source),
      'valid', true,
      'format_valid', true,
      'exists', NULL,
      'validation_scope', 'postal_equivalent_required',
      'postal_code', v_normalized,
      'country', v_country,
      'region_hint', NULL,
      'source_version', v_source,
      'field_results', jsonb_build_array(
        jsonb_build_object('field', 'country', 'status', 'pass', 'reason_code', 'country_profile_found'),
        jsonb_build_object('field', 'postal_code', 'status', 'not_applicable', 'reason_code', 'country_has_no_postal_code_system'),
        jsonb_build_object('field', 'recipient_authorization', 'status', 'not_applicable', 'reason_code', 'postal_validation_does_not_evaluate_identity')
      ),
      'result_boundaries', jsonb_build_object(
        'format_pass_does_not_imply_existence', true,
        'existence_pass_does_not_imply_delivery', true,
        'delivery_pass_does_not_imply_identity', true,
        'identity_pass_does_not_disclose_full_address', true
      ),
      'privacy', jsonb_build_object(
        'contains_raw_address', false,
        'log_safe', true,
        'disclosure_scope', 'field_status'
      ),
      'warnings', jsonb_build_array(),
      'non_claims', jsonb_build_array(
        'No official postal code is required; use postal-equivalent regions for operational checks.',
        'Postal validation does not guarantee latency, availability, or a runtime service-level objective.'
      )
    );
  END IF;

  IF v_profile_found AND v_profile.postal_status = 'none' THEN
    RETURN jsonb_build_object(
      'version', 'address-validation-result-v0.1',
      'purpose', 'format',
      'status', 'fail',
      'confidence', 0.90,
      'source_refs', jsonb_build_array('postgres-extension:' || v_source),
      'valid', false,
      'format_valid', false,
      'exists', NULL,
      'validation_scope', 'postal_equivalent_required',
      'postal_code', v_normalized,
      'country', v_country,
      'region_hint', NULL,
      'source_version', v_source,
      'field_results', jsonb_build_array(
        jsonb_build_object('field', 'country', 'status', 'pass', 'reason_code', 'country_profile_found'),
        jsonb_build_object('field', 'postal_code', 'status', 'not_applicable', 'reason_code', 'country_has_no_postal_code_system'),
        jsonb_build_object('field', 'recipient_authorization', 'status', 'not_applicable', 'reason_code', 'postal_validation_does_not_evaluate_identity')
      ),
      'result_boundaries', jsonb_build_object(
        'format_pass_does_not_imply_existence', true,
        'existence_pass_does_not_imply_delivery', true,
        'delivery_pass_does_not_imply_identity', true,
        'identity_pass_does_not_disclose_full_address', true
      ),
      'privacy', jsonb_build_object(
        'contains_raw_address', false,
        'log_safe', true,
        'disclosure_scope', 'field_status'
      ),
      'warnings', jsonb_build_array('country_has_no_postal_code_system', 'postal_equivalent_required'),
      'non_claims', jsonb_build_array(
        'Do not invent an official postal code for a no-postal-code country.',
        'Postal validation does not guarantee latency, availability, or a runtime service-level objective.'
      )
    );
  END IF;

  v_scope := CASE
    WHEN NOT v_profile_found THEN 'country_profile_missing'
    WHEN v_exists IS NOT NULL THEN 'format_and_existence'
    WHEN v_profile.postal_pattern IS NOT NULL THEN 'format_only'
    ELSE 'policy_only'
  END;
  v_valid := v_profile_found AND v_format_valid AND COALESCE(v_exists, true);

  SELECT pa.region_ref INTO v_region_ref
    FROM addressql.postal_areas pa
   WHERE pa.country_code = v_country
     AND pa.postal_code = v_normalized
     AND pa.source_version = v_source
   LIMIT 1;

  RETURN jsonb_build_object(
    'version', 'address-validation-result-v0.1',
    'purpose', CASE WHEN v_scope = 'format_and_existence' THEN 'existence' ELSE 'format' END,
    'status', CASE WHEN COALESCE(v_valid, false) THEN 'pass' ELSE 'fail' END,
    'confidence', CASE WHEN v_profile_found AND v_exists IS NOT NULL THEN 0.95 WHEN v_profile_found THEN 0.75 ELSE 0.25 END,
    'source_refs', jsonb_build_array('postgres-extension:' || v_source),
    'valid', COALESCE(v_valid, false),
    'format_valid', COALESCE(v_format_valid, false),
    'exists', v_exists,
    'validation_scope', v_scope,
    'postal_code', v_normalized,
    'country', v_country,
    'region_hint', v_region_ref,
    'source_version', v_source,
    'field_results', jsonb_build_array(
      jsonb_build_object(
        'field', 'country',
        'status', CASE WHEN v_profile_found THEN 'pass' ELSE 'unknown' END,
        'reason_code', CASE WHEN v_profile_found THEN 'country_profile_found' ELSE 'country_profile_missing' END
      ),
      jsonb_build_object(
        'field', 'postal_code',
        'status', CASE WHEN COALESCE(v_valid, false) THEN 'pass' WHEN v_exists IS FALSE THEN 'fail' ELSE 'unknown' END,
        'reason_code', CASE
          WHEN COALESCE(v_valid, false) THEN 'format_and_existence_pass'
          WHEN v_exists IS FALSE THEN 'postal_code_not_found_in_fixture'
          WHEN NOT v_format_valid THEN 'postal_format_failed'
          ELSE 'postal_result_unknown'
        END
      ),
      jsonb_build_object('field', 'recipient_authorization', 'status', 'not_applicable', 'reason_code', 'postal_validation_does_not_evaluate_identity')
    ),
    'result_boundaries', jsonb_build_object(
      'format_pass_does_not_imply_existence', true,
      'existence_pass_does_not_imply_delivery', true,
      'delivery_pass_does_not_imply_identity', true,
      'identity_pass_does_not_disclose_full_address', true
    ),
    'privacy', jsonb_build_object(
      'contains_raw_address', false,
      'log_safe', true,
      'disclosure_scope', 'field_status'
    ),
    'warnings', CASE
      WHEN NOT v_profile_found THEN jsonb_build_array('country_profile_missing')
      WHEN v_exists IS FALSE THEN jsonb_build_array('postal_code_not_found_in_fixture')
      WHEN NOT FOUND THEN jsonb_build_array('postal_area_not_found_or_not_required')
      ELSE jsonb_build_array()
    END,
    'non_claims', jsonb_build_array(
      'Postal validity is not full address identity.',
      'A passing format or existence check does not prove delivery availability, residence, or recipient authorization.',
      'Postal validation does not guarantee latency, availability, or a runtime service-level objective.'
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION addressql.postal_lookup(
  postal_code text,
  country_code text,
  source_version text DEFAULT 'synthetic-addressql-v0.1'
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_country text := addressql._country(country_code);
  v_source text := addressql._source_version(source_version);
  v_postal text := addressql.postal_normalize(postal_code, v_country, v_source)->>'normalized';
BEGIN
  RETURN jsonb_build_object(
    'postal_code', v_postal,
    'country', v_country,
    'candidate_regions', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('region_ref', pa.region_ref, 'region_name', pa.region_name))
        FROM addressql.postal_areas pa
       WHERE pa.country_code = v_country
         AND pa.postal_code = v_postal
         AND pa.source_version = v_source
    ), jsonb_build_array()),
    'source_version', v_source,
    'non_claims', jsonb_build_array('Postal lookup returns candidates, not a household address.')
  );
END;
$$;

CREATE OR REPLACE FUNCTION addressql.postal_equivalent(
  address_or_region jsonb,
  country_code text,
  policy jsonb DEFAULT '{}'::jsonb,
  source_version text DEFAULT 'synthetic-addressql-v0.1'
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_country text := addressql._country(country_code);
  v_source text := addressql._source_version(source_version);
  v_region text := COALESCE(address_or_region->>'region_ref', 'agid-country-' || lower(v_country) || '-postal-equivalent');
BEGIN
  RETURN jsonb_build_object(
    'region_ref', v_region,
    'country', v_country,
    'policy', policy,
    'confidence', 0.6,
    'source_version', v_source,
    'non_claims', jsonb_build_array('Postal-equivalent regions are fallback operational regions, not official postal codes.')
  );
END;
$$;

CREATE OR REPLACE FUNCTION addressql.address_within(
  address_or_envelope jsonb,
  region_ref text,
  source_version text DEFAULT 'synthetic-addressql-v0.1'
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_source text := addressql._source_version(source_version);
  v_point_wkt text := address_or_envelope->>'point_wkt';
  v_boundary_wkt text;
  v_within boolean;
BEGIN
  SELECT boundary_wkt INTO v_boundary_wkt
    FROM addressql.postal_areas pa
   WHERE pa.region_ref = region_ref
     AND pa.source_version = v_source
     AND pa.boundary_wkt IS NOT NULL
   LIMIT 1;

  IF v_boundary_wkt IS NULL THEN
    SELECT boundary_wkt INTO v_boundary_wkt
      FROM addressql.delivery_regions dr
     WHERE dr.region_ref = region_ref
       AND dr.source_version = v_source
       AND dr.boundary_wkt IS NOT NULL
     LIMIT 1;
  END IF;

  IF v_point_wkt IS NULL OR v_boundary_wkt IS NULL THEN
    RETURN jsonb_build_object(
      'within', NULL,
      'region_ref', region_ref,
      'confidence', 0,
      'source_version', v_source,
      'warnings', jsonb_build_array('missing_point_or_boundary'),
      'non_claims', jsonb_build_array('Region membership does not disclose exact address.')
    );
  END IF;

  IF NOT addressql.postgis_available() THEN
    RETURN jsonb_build_object(
      'within', NULL,
      'region_ref', region_ref,
      'confidence', 0,
      'source_version', v_source,
      'warnings', jsonb_build_array('postgis_not_available'),
      'non_claims', jsonb_build_array('Region membership requires a spatial engine for strict verification.')
    );
  END IF;

  EXECUTE 'SELECT ST_Contains(ST_GeomFromText($1, 4326), ST_GeomFromText($2, 4326))'
    INTO v_within
    USING v_boundary_wkt, v_point_wkt;

  RETURN jsonb_build_object(
    'within', v_within,
    'region_ref', region_ref,
    'confidence', CASE WHEN v_within THEN 0.95 ELSE 0.8 END,
    'source_version', v_source,
    'warnings', jsonb_build_array(),
    'non_claims', jsonb_build_array('Region membership does not disclose exact address.')
  );
EXCEPTION WHEN undefined_function THEN
  RETURN jsonb_build_object(
    'within', NULL,
    'region_ref', region_ref,
    'confidence', 0,
    'source_version', v_source,
    'warnings', jsonb_build_array('postgis_function_unavailable'),
    'non_claims', jsonb_build_array('Region membership requires a spatial engine for strict verification.')
  );
END;
$$;

CREATE OR REPLACE FUNCTION addressql.address_distance(
  address_a_or_region jsonb,
  address_b_or_region jsonb,
  metric text DEFAULT 'geodesic',
  source_version text DEFAULT 'synthetic-addressql-v0.1'
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_source text := addressql._source_version(source_version);
  v_lat_a double precision := NULLIF(address_a_or_region->>'lat', '')::double precision;
  v_lon_a double precision := NULLIF(address_a_or_region->>'lon', '')::double precision;
  v_lat_b double precision := NULLIF(address_b_or_region->>'lat', '')::double precision;
  v_lon_b double precision := NULLIF(address_b_or_region->>'lon', '')::double precision;
  v_km double precision;
  v_metric text := metric;
BEGIN
  IF v_lat_a IS NULL OR v_lon_a IS NULL OR v_lat_b IS NULL OR v_lon_b IS NULL THEN
    RETURN jsonb_build_object(
      'distance', NULL,
      'unit', 'km',
      'metric', metric,
      'confidence', 0,
      'source_version', v_source,
      'warnings', jsonb_build_array('missing_coordinates'),
      'non_claims', jsonb_build_array('Distance is metric-dependent and not route availability.')
    );
  END IF;

  IF addressql.postgis_available() THEN
    EXECUTE 'SELECT ST_DistanceSphere(ST_MakePoint($1, $2), ST_MakePoint($3, $4)) / 1000.0'
      INTO v_km
      USING v_lon_a, v_lat_a, v_lon_b, v_lat_b;
    v_metric := metric || '_postgis';
  ELSE
    v_km := 6371.0 * acos(least(1.0, greatest(-1.0,
      sin(radians(v_lat_a)) * sin(radians(v_lat_b)) +
      cos(radians(v_lat_a)) * cos(radians(v_lat_b)) * cos(radians(v_lon_b - v_lon_a))
    )));
    v_metric := metric || '_haversine_fallback';
  END IF;

  RETURN jsonb_build_object(
    'distance', v_km,
    'unit', 'km',
    'metric', v_metric,
    'confidence', 0.75,
    'source_version', v_source,
    'non_claims', jsonb_build_array('Distance is metric-dependent and not route availability.')
  );
END;
$$;

CREATE OR REPLACE FUNCTION addressql.delivery_available(
  address_or_envelope jsonb,
  carrier text DEFAULT 'synthetic_carrier',
  service_level text DEFAULT 'standard',
  source_version text DEFAULT 'synthetic-addressql-v0.1'
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_source text := addressql._source_version(source_version);
  v_country text := addressql._country(COALESCE(address_or_envelope->>'country', address_or_envelope->>'country_code'));
  v_postal text := address_or_envelope->>'postal_code';
  v_required boolean := COALESCE((addressql.postal_required(address_or_envelope, v_country, 'delivery', v_source)->>'required')::boolean, false);
  v_postal_valid boolean := true;
  v_available boolean := true;
  v_reasons jsonb := jsonb_build_array();
BEGIN
  IF v_required THEN
    v_postal_valid := COALESCE((addressql.postal_validate(address_or_envelope, v_postal, v_country, v_source)->>'valid')::boolean, false);
    IF NOT v_postal_valid THEN
      v_available := false;
      v_reasons := v_reasons || jsonb_build_array('postal_required_but_invalid_or_missing');
    END IF;
  END IF;

  IF v_country = '' THEN
    v_available := false;
    v_reasons := v_reasons || jsonb_build_array('country_missing');
  END IF;

  RETURN jsonb_build_object(
    'available', v_available,
    'carrier', carrier,
    'service_level', service_level,
    'reasons', v_reasons,
    'source_version', v_source,
    'non_claims', jsonb_build_array('Deliverability is not proof of residence or identity.')
  );
END;
$$;
