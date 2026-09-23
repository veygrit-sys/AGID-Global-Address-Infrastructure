export const ADDRESSQL_RESEARCH_VERSION = 'addressql-research-v0.1';

export type AddressQlFunctionCategory =
  | 'structure'
  | 'country_metadata'
  | 'matching_quality'
  | 'postal_geo'
  | 'congestion_mobility'
  | 'delivery'
  | 'privacy_proof'
  | 'international_io'
  | 'communication';

export type AddressQlDeterminism = 'immutable' | 'stable_by_source_version' | 'volatile';

export type AddressQlPhase = 'mvp' | 'v0_2' | 'v0_3' | 'discouraged';

export type AddressQlCompatibilityLayer =
  | 'AGID'
  | 'AMT'
  | 'ZK_ADDRESS_PREDICATES'
  | 'ADDRESS_LOGIN'
  | 'POSTAL_THEORY'
  | 'ADDRESS_COMMUNICATION_OBJECT'
  | 'NONE';

export type AddressQlPrivacyRisk = 'low' | 'medium' | 'high' | 'unsafe_by_default';

export type AddressQlFunctionSpec = {
  name: string;
  category: AddressQlFunctionCategory;
  phase: AddressQlPhase;
  determinism: AddressQlDeterminism;
  inputs: string[];
  outputKind: string;
  privacyRisk: AddressQlPrivacyRisk;
  compatibleWith: AddressQlCompatibilityLayer[];
  nonClaims: string[];
};

export type AddressQlPaperPlan = {
  id: string;
  title: string;
  scope: string;
  mustNotMixWithAmtPaper: boolean;
  executableArtifacts: string[];
};

export type AddressQlOpenSourcePlan = {
  repositoryName: 'addressql';
  owner: 'dawnportinfo-design';
  licenseRecommendation: 'Apache-2.0 for code, CC-BY-4.0 for papers/specs';
  separateFromAmtPaper: boolean;
  initialPackages: string[];
  releaseGates: string[];
};

export const ADDRESSQL_FUNCTION_SPECS: AddressQlFunctionSpec[] = [
  {
    name: 'ADDRESS_PARSE',
    category: 'structure',
    phase: 'mvp',
    determinism: 'stable_by_source_version',
    inputs: ['address_text', 'country?', 'source_version?'],
    outputKind: 'AddressComponents',
    privacyRisk: 'medium',
    compatibleWith: ['ADDRESS_LOGIN'],
    nonClaims: ['Parsing is not address identity.'],
  },
  {
    name: 'ADDRESS_NORMALIZE',
    category: 'structure',
    phase: 'mvp',
    determinism: 'stable_by_source_version',
    inputs: ['address_text', 'country', 'source_version?'],
    outputKind: 'NormalizedAddressExpression',
    privacyRisk: 'medium',
    compatibleWith: ['AMT', 'ADDRESS_LOGIN'],
    nonClaims: ['Normalization is not referent resolution.'],
  },
  {
    name: 'ADDRESS_COMPONENT',
    category: 'structure',
    phase: 'mvp',
    determinism: 'stable_by_source_version',
    inputs: ['address_or_components', 'component_name'],
    outputKind: 'ComponentValue',
    privacyRisk: 'medium',
    compatibleWith: ['ADDRESS_LOGIN'],
    nonClaims: ['Component extraction may expose private unit details if policy is missing.'],
  },
  {
    name: 'ADDRESS_SCHEMA',
    category: 'structure',
    phase: 'mvp',
    determinism: 'stable_by_source_version',
    inputs: ['country', 'schema_version?'],
    outputKind: 'CountryAddressSchema',
    privacyRisk: 'low',
    compatibleWith: ['ADDRESS_LOGIN'],
    nonClaims: ['A country schema is not full country data coverage.'],
  },
  {
    name: 'COUNTRY_RESOLVE',
    category: 'country_metadata',
    phase: 'mvp',
    determinism: 'stable_by_source_version',
    inputs: ['country_input', 'standard?', 'source_version?'],
    outputKind: 'CountryResolution',
    privacyRisk: 'low',
    compatibleWith: ['ADDRESS_LOGIN', 'AGID'],
    nonClaims: ['Country resolution is not sovereignty adjudication.'],
  },
  {
    name: 'COUNTRY_ADDRESS_PROFILE',
    category: 'country_metadata',
    phase: 'mvp',
    determinism: 'stable_by_source_version',
    inputs: ['country', 'source_version?'],
    outputKind: 'CountryAddressProfile',
    privacyRisk: 'low',
    compatibleWith: ['ADDRESS_LOGIN', 'AMT'],
    nonClaims: ['A country profile is not full address data coverage.'],
  },
  {
    name: 'COUNTRY_SUBDIVISIONS',
    category: 'country_metadata',
    phase: 'v0_2',
    determinism: 'stable_by_source_version',
    inputs: ['country', 'level?', 'source_version?'],
    outputKind: 'CountrySubdivisionSet',
    privacyRisk: 'low',
    compatibleWith: ['AGID', 'ADDRESS_LOGIN'],
    nonClaims: ['Subdivision lists may omit disputed, historic, or local-use names unless declared by source policy.'],
  },
  {
    name: 'COUNTRY_LANGUAGES',
    category: 'country_metadata',
    phase: 'v0_2',
    determinism: 'stable_by_source_version',
    inputs: ['country', 'purpose?', 'source_version?'],
    outputKind: 'CountryLanguagePolicy',
    privacyRisk: 'low',
    compatibleWith: ['ADDRESS_LOGIN'],
    nonClaims: ['Language policy is not a claim about every resident or local usage.'],
  },
  {
    name: 'COUNTRY_POSTAL_STATUS',
    category: 'country_metadata',
    phase: 'mvp',
    determinism: 'stable_by_source_version',
    inputs: ['country', 'source_version?'],
    outputKind: 'CountryPostalStatus',
    privacyRisk: 'low',
    compatibleWith: ['POSTAL_THEORY', 'ADDRESS_LOGIN'],
    nonClaims: ['Postal status does not guarantee availability of complete postal datasets.'],
  },
  {
    name: 'COUNTRY_SOURCE_POLICY',
    category: 'country_metadata',
    phase: 'mvp',
    determinism: 'stable_by_source_version',
    inputs: ['country', 'purpose?', 'source_version?'],
    outputKind: 'CountrySourcePolicy',
    privacyRisk: 'low',
    compatibleWith: ['AMT', 'AGID', 'POSTAL_THEORY'],
    nonClaims: ['Source policy ranks usable evidence; it is not a political recognition decision.'],
  },
  {
    name: 'ADDRESS_CANONICAL',
    category: 'international_io',
    phase: 'v0_2',
    determinism: 'stable_by_source_version',
    inputs: ['address_or_components', 'source_version?'],
    outputKind: 'CanonicalAddressObject',
    privacyRisk: 'medium',
    compatibleWith: ['AMT', 'ADDRESS_LOGIN'],
    nonClaims: ['Canonical form is not public-safe by default.'],
  },
  {
    name: 'ADDRESS_FORMAT',
    category: 'international_io',
    phase: 'v0_2',
    determinism: 'stable_by_source_version',
    inputs: ['address_or_components', 'country', 'locale'],
    outputKind: 'FormattedAddressText',
    privacyRisk: 'medium',
    compatibleWith: ['ADDRESS_LOGIN'],
    nonClaims: ['Formatting does not validate deliverability.'],
  },
  {
    name: 'ADDRESS_TRANSLATE',
    category: 'international_io',
    phase: 'v0_2',
    determinism: 'stable_by_source_version',
    inputs: ['address_or_components', 'to_locale', 'source_version?'],
    outputKind: 'LocalizedAddressExpression',
    privacyRisk: 'medium',
    compatibleWith: ['AMT', 'ADDRESS_LOGIN'],
    nonClaims: ['Translation improves communication and recall; it does not prove identity.'],
  },
  {
    name: 'ADDRESS_MATCH',
    category: 'matching_quality',
    phase: 'mvp',
    determinism: 'stable_by_source_version',
    inputs: ['address_a', 'address_b', 'purpose?', 'source_version?'],
    outputKind: 'BooleanMatchDecision',
    privacyRisk: 'high',
    compatibleWith: ['AMT'],
    nonClaims: ['A match decision is purpose-relative and not proof of residence.'],
  },
  {
    name: 'ADDRESS_EXPLAIN_MATCH',
    category: 'matching_quality',
    phase: 'mvp',
    determinism: 'stable_by_source_version',
    inputs: ['address_a', 'address_b', 'purpose?', 'source_version?'],
    outputKind: 'MatchExplanation',
    privacyRisk: 'high',
    compatibleWith: ['AMT'],
    nonClaims: ['Explanation must not expose raw private evidence.'],
  },
  {
    name: 'ADDRESS_SIMILARITY',
    category: 'matching_quality',
    phase: 'mvp',
    determinism: 'stable_by_source_version',
    inputs: ['address_a', 'address_b', 'purpose?', 'source_version?'],
    outputKind: 'SimilarityScore',
    privacyRisk: 'high',
    compatibleWith: ['AMT'],
    nonClaims: ['High similarity is not sufficient for PID issuance.'],
  },
  {
    name: 'ADDRESS_SCORE',
    category: 'matching_quality',
    phase: 'mvp',
    determinism: 'stable_by_source_version',
    inputs: ['address_or_envelope', 'purpose?', 'source_version?'],
    outputKind: 'QualityScore',
    privacyRisk: 'medium',
    compatibleWith: ['AMT'],
    nonClaims: ['A quality score is not legal address verification.'],
  },
  {
    name: 'ADDRESS_ISSUES',
    category: 'matching_quality',
    phase: 'mvp',
    determinism: 'stable_by_source_version',
    inputs: ['address_or_envelope', 'purpose?', 'source_version?'],
    outputKind: 'AddressIssueList',
    privacyRisk: 'medium',
    compatibleWith: ['AMT', 'ADDRESS_LOGIN'],
    nonClaims: ['Issues are decision support, not a refusal by themselves.'],
  },
  {
    name: 'POSTAL_VALIDATE',
    category: 'postal_geo',
    phase: 'mvp',
    determinism: 'stable_by_source_version',
    inputs: ['address_or_components', 'postal_code', 'country', 'source_version?'],
    outputKind: 'PostalValidationResult',
    privacyRisk: 'medium',
    compatibleWith: ['POSTAL_THEORY'],
    nonClaims: ['Postal validity is not universal address identity.'],
  },
  {
    name: 'POSTAL_STATUS',
    category: 'postal_geo',
    phase: 'mvp',
    determinism: 'stable_by_source_version',
    inputs: ['country', 'source_version?'],
    outputKind: 'PostalSystemStatus',
    privacyRisk: 'low',
    compatibleWith: ['POSTAL_THEORY', 'ADDRESS_LOGIN'],
    nonClaims: ['Postal status is source-versioned and may differ by carrier or use case.'],
  },
  {
    name: 'POSTAL_FORMAT',
    category: 'postal_geo',
    phase: 'mvp',
    determinism: 'stable_by_source_version',
    inputs: ['country', 'source_version?'],
    outputKind: 'PostalCodeFormat',
    privacyRisk: 'low',
    compatibleWith: ['POSTAL_THEORY', 'ADDRESS_LOGIN'],
    nonClaims: ['A valid format does not prove that the postal code exists or matches the address.'],
  },
  {
    name: 'POSTAL_NORMALIZE',
    category: 'postal_geo',
    phase: 'mvp',
    determinism: 'stable_by_source_version',
    inputs: ['postal_code', 'country', 'source_version?'],
    outputKind: 'NormalizedPostalCode',
    privacyRisk: 'low',
    compatibleWith: ['POSTAL_THEORY', 'ADDRESS_LOGIN'],
    nonClaims: ['Postal normalization is not postal validation.'],
  },
  {
    name: 'POSTAL_PARSE',
    category: 'postal_geo',
    phase: 'v0_2',
    determinism: 'stable_by_source_version',
    inputs: ['postal_text', 'country?', 'source_version?'],
    outputKind: 'PostalCodeComponents',
    privacyRisk: 'low',
    compatibleWith: ['POSTAL_THEORY'],
    nonClaims: ['Postal parsing does not prove that the parsed code is assigned.'],
  },
  {
    name: 'POSTAL_REQUIRED',
    category: 'postal_geo',
    phase: 'mvp',
    determinism: 'stable_by_source_version',
    inputs: ['address_or_components', 'country', 'purpose?', 'source_version?'],
    outputKind: 'PostalRequirementDecision',
    privacyRisk: 'low',
    compatibleWith: ['POSTAL_THEORY', 'ADDRESS_LOGIN'],
    nonClaims: ['Postal requiredness is purpose-relative and not a universal legal statement.'],
  },
  {
    name: 'POSTAL_LOOKUP',
    category: 'postal_geo',
    phase: 'v0_2',
    determinism: 'stable_by_source_version',
    inputs: ['postal_code', 'country', 'source_version?'],
    outputKind: 'PostalCandidateSet',
    privacyRisk: 'low',
    compatibleWith: ['POSTAL_THEORY'],
    nonClaims: ['Postal lookup returns candidates, not a household address.'],
  },
  {
    name: 'POSTAL_AREA',
    category: 'postal_geo',
    phase: 'v0_2',
    determinism: 'stable_by_source_version',
    inputs: ['postal_code', 'country', 'source_version?'],
    outputKind: 'PostalAreaRef',
    privacyRisk: 'low',
    compatibleWith: ['AGID', 'POSTAL_THEORY'],
    nonClaims: ['A postal area may be approximate, non-contiguous, carrier-specific, or unavailable.'],
  },
  {
    name: 'POSTAL_EQUIVALENT',
    category: 'postal_geo',
    phase: 'mvp',
    determinism: 'stable_by_source_version',
    inputs: ['address_or_region', 'country', 'policy?', 'source_version?'],
    outputKind: 'PostalEquivalentRegion',
    privacyRisk: 'medium',
    compatibleWith: ['AGID', 'POSTAL_THEORY'],
    nonClaims: ['Postal-equivalent regions are fallback operational regions, not official postal codes.'],
  },
  {
    name: 'POSTAL_SUGGEST',
    category: 'postal_geo',
    phase: 'v0_2',
    determinism: 'stable_by_source_version',
    inputs: ['address_or_components', 'country', 'source_version?'],
    outputKind: 'PostalSuggestionSet',
    privacyRisk: 'medium',
    compatibleWith: ['POSTAL_THEORY', 'ADDRESS_LOGIN'],
    nonClaims: ['Postal suggestions are candidates and must not be silently written over user intent.'],
  },
  {
    name: 'ADDRESS_WITHIN',
    category: 'postal_geo',
    phase: 'mvp',
    determinism: 'stable_by_source_version',
    inputs: ['address_or_envelope', 'region_ref', 'source_version?'],
    outputKind: 'RegionMembershipDecision',
    privacyRisk: 'medium',
    compatibleWith: ['AGID', 'AMT'],
    nonClaims: ['Region membership does not disclose exact address.'],
  },
  {
    name: 'GEOCODE',
    category: 'postal_geo',
    phase: 'v0_3',
    determinism: 'stable_by_source_version',
    inputs: ['address_or_envelope', 'source_version?'],
    outputKind: 'GeoCandidateSet',
    privacyRisk: 'high',
    compatibleWith: ['AGID'],
    nonClaims: ['Coordinates are not sufficient for vertical or social referent identity.'],
  },
  {
    name: 'REVERSE_GEOCODE',
    category: 'postal_geo',
    phase: 'v0_3',
    determinism: 'stable_by_source_version',
    inputs: ['lat', 'lon', 'source_version?'],
    outputKind: 'ReverseGeoCandidateSet',
    privacyRisk: 'high',
    compatibleWith: ['AGID'],
    nonClaims: ['Reverse geocoding returns candidates, not a verified recipient address.'],
  },
  {
    name: 'ADDRESS_DISTANCE',
    category: 'postal_geo',
    phase: 'v0_2',
    determinism: 'stable_by_source_version',
    inputs: ['address_a_or_region', 'address_b_or_region', 'metric?', 'source_version?'],
    outputKind: 'DistanceEstimate',
    privacyRisk: 'medium',
    compatibleWith: ['AGID', 'AMT'],
    nonClaims: ['Distance is metric-dependent and not route availability.'],
  },
  {
    name: 'ADDRESS_TRAVEL_TIME',
    category: 'congestion_mobility',
    phase: 'v0_2',
    determinism: 'volatile',
    inputs: ['address_a_or_region', 'address_b_or_region', 'time?', 'mode?', 'source_version?'],
    outputKind: 'TravelTimeEstimate',
    privacyRisk: 'medium',
    compatibleWith: ['AGID', 'ADDRESS_COMMUNICATION_OBJECT'],
    nonClaims: ['Travel time is an estimate, not a route, SLA, or delivery guarantee.'],
  },
  {
    name: 'ADDRESS_CONGESTION_SCORE',
    category: 'congestion_mobility',
    phase: 'v0_2',
    determinism: 'volatile',
    inputs: ['address_or_region', 'time?', 'mode?', 'source_version?'],
    outputKind: 'CongestionScore',
    privacyRisk: 'medium',
    compatibleWith: ['AGID'],
    nonClaims: ['Congestion score is not a safety, residence, surveillance, or legal access claim.'],
  },
  {
    name: 'ADDRESS_DELIVERY_DIFFICULTY',
    category: 'congestion_mobility',
    phase: 'v0_2',
    determinism: 'volatile',
    inputs: ['address_or_region', 'carrier?', 'service_level?', 'time?', 'source_version?'],
    outputKind: 'DeliveryDifficultyScore',
    privacyRisk: 'medium',
    compatibleWith: ['AGID', 'ADDRESS_COMMUNICATION_OBJECT'],
    nonClaims: ['Delivery difficulty is operational decision support, not a blacklist or refusal by itself.'],
  },
  {
    name: 'ADDRESS_REACHABLE_WITHIN',
    category: 'congestion_mobility',
    phase: 'v0_2',
    determinism: 'volatile',
    inputs: ['origin_or_region', 'target_or_region', 'minutes', 'time?', 'mode?', 'source_version?'],
    outputKind: 'ReachabilityDecision',
    privacyRisk: 'medium',
    compatibleWith: ['AGID'],
    nonClaims: ['Reachability is time-, mode-, source-, and policy-dependent, not universal physical access.'],
  },
  {
    name: 'ADDRESS_BOTTLENECKS',
    category: 'congestion_mobility',
    phase: 'v0_2',
    determinism: 'stable_by_source_version',
    inputs: ['address_or_region', 'radius?', 'mode?', 'source_version?'],
    outputKind: 'BottleneckSet',
    privacyRisk: 'medium',
    compatibleWith: ['AGID'],
    nonClaims: ['Bottleneck candidates require source verification and may be incomplete or time-dependent.'],
  },
  {
    name: 'DELIVERY_AVAILABLE',
    category: 'delivery',
    phase: 'mvp',
    determinism: 'stable_by_source_version',
    inputs: ['address_or_envelope', 'carrier?', 'service_level?', 'source_version?'],
    outputKind: 'DeliveryAvailabilityDecision',
    privacyRisk: 'medium',
    compatibleWith: ['AMT', 'ADDRESS_COMMUNICATION_OBJECT'],
    nonClaims: ['Deliverability is not proof of residence or identity.'],
  },
  {
    name: 'DELIVERY_AREA',
    category: 'delivery',
    phase: 'v0_2',
    determinism: 'stable_by_source_version',
    inputs: ['address_or_envelope', 'carrier?', 'source_version?'],
    outputKind: 'DeliveryAreaRef',
    privacyRisk: 'medium',
    compatibleWith: ['AGID', 'AMT'],
    nonClaims: ['Delivery area is not necessarily a postal area.'],
  },
  {
    name: 'DELIVERY_ESTIMATE',
    category: 'delivery',
    phase: 'v0_3',
    determinism: 'volatile',
    inputs: ['address_or_envelope', 'carrier', 'service_level?', 'time?'],
    outputKind: 'DeliveryEstimate',
    privacyRisk: 'medium',
    compatibleWith: ['ADDRESS_COMMUNICATION_OBJECT'],
    nonClaims: ['Estimate is not a delivery guarantee.'],
  },
  {
    name: 'DELIVERY_RISK_SCORE',
    category: 'delivery',
    phase: 'v0_2',
    determinism: 'stable_by_source_version',
    inputs: ['address_or_envelope', 'purpose?', 'source_version?'],
    outputKind: 'DeliveryRiskScore',
    privacyRisk: 'medium',
    compatibleWith: ['AMT'],
    nonClaims: ['Risk score is not a blacklist.'],
  },
  {
    name: 'DELIVERY_TOKEN_CREATE',
    category: 'delivery',
    phase: 'v0_2',
    determinism: 'volatile',
    inputs: ['envelope', 'purpose', 'audience', 'expires_at', 'policy'],
    outputKind: 'AddressCommunicationToken',
    privacyRisk: 'high',
    compatibleWith: ['ADDRESS_COMMUNICATION_OBJECT', 'ZK_ADDRESS_PREDICATES'],
    nonClaims: ['A delivery token is not merchant access to a raw address.'],
  },
  {
    name: 'DELIVERY_TOKEN_VERIFY',
    category: 'delivery',
    phase: 'v0_2',
    determinism: 'volatile',
    inputs: ['token', 'policy', 'now?'],
    outputKind: 'TokenVerificationDecision',
    privacyRisk: 'medium',
    compatibleWith: ['ADDRESS_COMMUNICATION_OBJECT'],
    nonClaims: ['Token validity does not repair bad AMT resolution.'],
  },
  {
    name: 'ADDRESS_MASK',
    category: 'privacy_proof',
    phase: 'mvp',
    determinism: 'immutable',
    inputs: ['address_or_components', 'level'],
    outputKind: 'MaskedAddress',
    privacyRisk: 'medium',
    compatibleWith: ['NONE'],
    nonClaims: ['Masking is not anonymization.'],
  },
  {
    name: 'ADDRESS_HASH',
    category: 'privacy_proof',
    phase: 'discouraged',
    determinism: 'stable_by_source_version',
    inputs: ['normalized_address'],
    outputKind: 'UnsafeAddressHash',
    privacyRisk: 'unsafe_by_default',
    compatibleWith: ['NONE'],
    nonClaims: ['Plain address hashes are not privacy protection and are dictionary-attackable.'],
  },
  {
    name: 'ADDRESS_COMMIT',
    category: 'privacy_proof',
    phase: 'mvp',
    determinism: 'immutable',
    inputs: ['normalized_address', 'salt', 'domain'],
    outputKind: 'AddressCommitment',
    privacyRisk: 'medium',
    compatibleWith: ['ZK_ADDRESS_PREDICATES'],
    nonClaims: ['Commitment security depends on salt, domain separation, and storage policy.'],
  },
  {
    name: 'ADDRESS_ENVELOPE_CREATE',
    category: 'privacy_proof',
    phase: 'mvp',
    determinism: 'stable_by_source_version',
    inputs: ['address_resolution_certificate', 'policy', 'source_version'],
    outputKind: 'AMTCompatibleEnvelope',
    privacyRisk: 'medium',
    compatibleWith: ['AMT', 'ZK_ADDRESS_PREDICATES', 'ADDRESS_COMMUNICATION_OBJECT'],
    nonClaims: ['An envelope is not the raw address and not a PID by itself.'],
  },
  {
    name: 'ADDRESS_PROVE',
    category: 'privacy_proof',
    phase: 'mvp',
    determinism: 'volatile',
    inputs: ['envelope', 'claim', 'proof_policy'],
    outputKind: 'AddressProofBundle',
    privacyRisk: 'high',
    compatibleWith: ['ZK_ADDRESS_PREDICATES', 'AMT'],
    nonClaims: ['Proof validity does not prove that address resolution was correct.'],
  },
  {
    name: 'ADDRESS_VERIFY_PROOF',
    category: 'privacy_proof',
    phase: 'mvp',
    determinism: 'volatile',
    inputs: ['proof_bundle', 'claim', 'verifier_policy', 'roots?'],
    outputKind: 'ProofVerificationDecision',
    privacyRisk: 'medium',
    compatibleWith: ['ZK_ADDRESS_PREDICATES'],
    nonClaims: ['Verification checks the proof statement, not the full truth of the world.'],
  },
  {
    name: 'ADDRESS_DISCLOSE',
    category: 'privacy_proof',
    phase: 'v0_2',
    determinism: 'stable_by_source_version',
    inputs: ['envelope_or_components', 'level', 'policy'],
    outputKind: 'SelectiveDisclosureResult',
    privacyRisk: 'high',
    compatibleWith: ['ADDRESS_COMMUNICATION_OBJECT'],
    nonClaims: ['Selective disclosure must not exceed policy or receiver capability.'],
  },
  {
    name: 'ADDRESS_POLICY_CHECK',
    category: 'communication',
    phase: 'mvp',
    determinism: 'stable_by_source_version',
    inputs: ['envelope_or_message', 'policy', 'receiver_capability?'],
    outputKind: 'PolicyDecision',
    privacyRisk: 'medium',
    compatibleWith: ['ADDRESS_COMMUNICATION_OBJECT'],
    nonClaims: ['Policy approval is not raw address disclosure.'],
  },
  {
    name: 'ADDRESS_ACK',
    category: 'communication',
    phase: 'mvp',
    determinism: 'stable_by_source_version',
    inputs: ['address_communication_object', 'receiver_capability', 'policy'],
    outputKind: 'SemanticAck',
    privacyRisk: 'low',
    compatibleWith: ['ADDRESS_COMMUNICATION_OBJECT'],
    nonClaims: ['ACK deliverable is not proof of residence, ownership, or sovereignty.'],
  },
];

export const ADDRESSQL_PAPER_PLAN: AddressQlPaperPlan[] = [
  {
    id: 'addressql-core-semantics',
    title: 'AddressQL: Query Semantics for Structured Address Data',
    scope: 'Defines address data types, determinism, function classes, and conformance rules.',
    mustNotMixWithAmtPaper: true,
    executableArtifacts: ['function registry', 'SQL examples', 'adapter conformance tests'],
  },
  {
    id: 'addressql-matching-quality',
    title: 'Address Matching and Quality Functions in AddressQL',
    scope: 'Defines match, similarity, quality, explainability, issue taxonomy, and source-version stability.',
    mustNotMixWithAmtPaper: true,
    executableArtifacts: ['synthetic match fixtures', 'explain-match JSON schema'],
  },
  {
    id: 'addressql-privacy-proof',
    title: 'Privacy-Preserving Address Queries',
    scope: 'Defines commitments, envelope creation, proof hooks, verification, and unsafe hash boundaries.',
    mustNotMixWithAmtPaper: true,
    executableArtifacts: ['proof input schemas', 'unsafe-hash tests', 'non-claim test vectors'],
  },
  {
    id: 'addressql-delivery-communication',
    title: 'AddressQL for Delivery Eligibility and Address Communication',
    scope: 'Defines delivery availability, token verification, semantic ACK, and Address Communication Object compatibility.',
    mustNotMixWithAmtPaper: true,
    executableArtifacts: ['ACO fixtures', 'delivery policy examples'],
  },
  {
    id: 'addressql-congestion-mobility',
    title: 'Congestion-Aware Address Queries and Reachability Operators',
    scope: 'Defines travel-time, congestion, bottleneck, reachability, and delivery-difficulty operators.',
    mustNotMixWithAmtPaper: true,
    executableArtifacts: ['synthetic congestion fixtures', 'bottleneck non-claim tests', 'reachability examples'],
  },
  {
    id: 'addressql-adapter-conformance',
    title: 'AddressQL Adapter Conformance for SQL and NoSQL Systems',
    scope: 'Defines PostgreSQL, SQLite, MySQL, MongoDB, Firestore, and DynamoDB compatibility levels.',
    mustNotMixWithAmtPaper: true,
    executableArtifacts: ['adapter matrix', 'golden fixtures', 'determinism tests'],
  },
];

export const ADDRESSQL_OPEN_SOURCE_PLAN: AddressQlOpenSourcePlan = {
  repositoryName: 'addressql',
  owner: 'dawnportinfo-design',
  licenseRecommendation: 'Apache-2.0 for code, CC-BY-4.0 for papers/specs',
  separateFromAmtPaper: true,
  initialPackages: [
    'addressql-spec',
    'addressql-core-js',
    'addressql-core',
    'addressql-postgres',
    'addressql-duckdb',
    'addressql-sqlite',
    'addressql-js-ts',
    'addressql-py',
    'addressql-rs',
    'addressql-conformance',
    'addressql-fixtures',
  ],
  releaseGates: [
    'No raw address fixtures in public tests',
    'ADDRESS_HASH remains discouraged and unsafe-by-default',
    'Proof functions accept envelope or proof policy, not raw address as the primary public interface',
    'Every function declares determinism: immutable, stable_by_source_version, or volatile',
    'AMT compatibility is an adapter boundary, not an AMT paper chapter',
  ],
};

export function getAddressQlMvpFunctions(): AddressQlFunctionSpec[] {
  return ADDRESSQL_FUNCTION_SPECS.filter(spec => spec.phase === 'mvp');
}

export function validateAddressQlResearchPlan(): string[] {
  const errors: string[] = [];
  const names = new Set<string>();
  const categories = new Set<AddressQlFunctionCategory>();

  for (const spec of ADDRESSQL_FUNCTION_SPECS) {
    if (!/^ADDRESS_|^COUNTRY_|^POSTAL_|^DELIVERY_|^GEOCODE$|^REVERSE_GEOCODE$/.test(spec.name)) {
      errors.push(`${spec.name}: function name must use AddressQL naming`);
    }
    if (names.has(spec.name)) errors.push(`duplicate function: ${spec.name}`);
    names.add(spec.name);
    categories.add(spec.category);
    if (spec.nonClaims.length === 0) errors.push(`${spec.name}: missing non-claim`);
    if (spec.compatibleWith.length === 0) errors.push(`${spec.name}: missing compatibility layer`);
    if (spec.privacyRisk === 'unsafe_by_default' && spec.phase !== 'discouraged') {
      errors.push(`${spec.name}: unsafe-by-default functions must be discouraged`);
    }
  }

  for (const category of [
    'structure',
    'country_metadata',
    'matching_quality',
    'postal_geo',
    'congestion_mobility',
    'delivery',
    'privacy_proof',
    'international_io',
    'communication',
  ] as const) {
    if (!categories.has(category)) errors.push(`missing category: ${category}`);
  }

  const prove = ADDRESSQL_FUNCTION_SPECS.find(spec => spec.name === 'ADDRESS_PROVE');
  if (!prove?.inputs.includes('envelope')) errors.push('ADDRESS_PROVE must use envelope input');

  const hash = ADDRESSQL_FUNCTION_SPECS.find(spec => spec.name === 'ADDRESS_HASH');
  if (hash?.phase !== 'discouraged' || hash.privacyRisk !== 'unsafe_by_default') {
    errors.push('ADDRESS_HASH must stay discouraged and unsafe-by-default');
  }

  if (!ADDRESSQL_OPEN_SOURCE_PLAN.separateFromAmtPaper) {
    errors.push('AddressQL must remain separate from the AMT paper');
  }
  if (ADDRESSQL_OPEN_SOURCE_PLAN.owner !== 'dawnportinfo-design') {
    errors.push('AddressQL OSS owner must be dawnportinfo-design');
  }
  if (ADDRESSQL_PAPER_PLAN.some(paper => !paper.mustNotMixWithAmtPaper)) {
    errors.push('AddressQL paper plans must not mix with AMT paper');
  }

  return errors;
}
