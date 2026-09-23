export const COUNTRY_GEOGRAPHIC_METADATA_SOURCE_REVIEW_LEDGER_VERSION =
  'country-geographic-metadata-source-review-ledger-v1';

export type CountryGeographicMetadataSourceReview = {
  countryCode: string;
  sourceId: string;
  sourceUrl: string;
  authorityEvidenceUrl: string;
  observedVersion: string;
  observedScope:
    | 'administrative-boundaries-without-reuse-or-version'
    | 'administrative-hierarchy-without-reuse-or-version'
    | 'historical-geographic-codes'
    | 'sensitive-establishment-directory'
    | 'postal-reference-with-neighborhood-level'
    | 'postal-institutional-service-information';
  reuseTermsStatus: 'not-recorded';
  correctionPathStatus: 'publisher-contact-only' | 'not-accepted';
  reviewStatus: 'blocked';
  nextGate: 'obtain-explicit-reuse-terms-and-current-official-administrative-key-release'
    | 'exclude-sensitive-or-precise-location-source'
    | 'route-to-postal-source-evidence-registry'
    | 'obtain-current-official-postal-code-or-administrative-key-publication'
    | 'obtain-explicit-reuse-terms-version-and-source-correction-path';
  reviewedAt: string;
  reviewBy: string;
  rawPrivateMaterialStored: false;
  nonClaim: string;
};

// These are review findings only. None may be passed into the approved synthetic
// administrative-key index until its named gate has independently been satisfied.
const HONDURAS_INE_GEOGRAPHIC_CODES: CountryGeographicMetadataSourceReview = {
  countryCode: 'HN',
  sourceId: 'ine-hn-geographic-codes-1974',
  sourceUrl: 'https://repositorio.ine.gob.hn/items/a20df79e-23ee-4681-925f-7cf1e6910301',
  authorityEvidenceUrl: 'https://repositorio.ine.gob.hn/items/a20df79e-23ee-4681-925f-7cf1e6910301/full',
  observedVersion: 'issued-1974-01; repository-accessioned-2025-01-20',
  observedScope: 'historical-geographic-codes',
  reuseTermsStatus: 'not-recorded',
  correctionPathStatus: 'publisher-contact-only',
  reviewStatus: 'blocked',
  nextGate: 'obtain-explicit-reuse-terms-and-current-official-administrative-key-release',
  reviewedAt: '2026-07-25T00:00:00Z',
  reviewBy: '2026-08-01T00:00:00Z',
  rawPrivateMaterialStored: false,
  nonClaim: 'The INE repository page establishes official publication and a general contact route, but does not establish reusable terms, a current administrative-key release, source-specific correction handling, postal lookup, or delivery use.',
};

const HONDURAS_INE_DEE_2024: CountryGeographicMetadataSourceReview = {
  countryCode: 'HN',
  sourceId: 'ine-hn-dee-2024',
  sourceUrl: 'https://ine.gob.hn/dee/',
  authorityEvidenceUrl: 'https://ine.gob.hn/2026/01/12/directorio-de-establecimientos-economicos-2024/',
  observedVersion: 'directory-2024; published-2026-01-12',
  observedScope: 'sensitive-establishment-directory',
  reuseTermsStatus: 'not-recorded',
  correctionPathStatus: 'not-accepted',
  reviewStatus: 'blocked',
  nextGate: 'exclude-sensitive-or-precise-location-source',
  reviewedAt: '2026-07-25T00:00:00Z',
  reviewBy: '2026-08-01T00:00:00Z',
  rawPrivateMaterialStored: false,
  nonClaim: 'The DEE describes establishment-level geographic location. It is excluded from this metadata-only evaluation program and is not a source of administrative keys, postal lookup, address validation, or delivery evidence.',
};

const NICARAGUA_CORREOS_POSTAL_SYSTEM: CountryGeographicMetadataSourceReview = {
  countryCode: 'NI',
  sourceId: 'correos-ni-postal-code-system',
  sourceUrl: 'https://www.correos.gob.ni/codigo-postal/',
  authorityEvidenceUrl: 'https://www.correos.gob.ni/wp-content/themes/correos/Uploads/LEY%20GENERAL%20DE%20CORREOS%20Y%20SERVICIOS%20POSTALES%20DE%20NICARAGUA.pdf',
  observedVersion: 'undated-public-system-observed-2026-07-25',
  observedScope: 'postal-reference-with-neighborhood-level',
  reuseTermsStatus: 'not-recorded',
  correctionPathStatus: 'publisher-contact-only',
  reviewStatus: 'blocked',
  nextGate: 'route-to-postal-source-evidence-registry',
  reviewedAt: '2026-07-25T00:00:00Z',
  reviewBy: '2026-08-01T00:00:00Z',
  rawPrivateMaterialStored: false,
  nonClaim: 'Correos de Nicaragua is the statutory postal-code authority, but the public system does not state reusable terms or a version. Its postal hierarchy can reach neighborhood-level results, so it is excluded from the administrative-key index and must clear the separate postal-source evidence registry before any non-delivery postal use.',
};

const EL_SALVADOR_CORREOS_SERVICE_INFORMATION: CountryGeographicMetadataSourceReview = {
  countryCode: 'SV',
  sourceId: 'correos-sv-service-rights',
  sourceUrl: 'https://www.correos.gob.sv/carta-de-derechos/',
  authorityEvidenceUrl: 'https://www.correos.gob.sv/marco-institucional/',
  observedVersion: 'undated-public-service-rights-page-observed-2026-07-25',
  observedScope: 'postal-institutional-service-information',
  reuseTermsStatus: 'not-recorded',
  correctionPathStatus: 'publisher-contact-only',
  reviewStatus: 'blocked',
  nextGate: 'obtain-current-official-postal-code-or-administrative-key-publication',
  reviewedAt: '2026-07-25T00:00:00Z',
  reviewBy: '2026-08-01T00:00:00Z',
  rawPrivateMaterialStored: false,
  nonClaim: 'The Correos service-rights page confirms a complaints and contact route, but it does not publish reusable postal-code or administrative-key data, a version, or reuse terms. It is not an address-validation, postal-lookup, or delivery evidence source.',
};

const LESOTHO_DRWS_BOUNDARIES: CountryGeographicMetadataSourceReview = {
  countryCode: 'LS',
  sourceId: 'drws-ls-boundaries-map-service',
  sourceUrl: 'https://drws.gov.ls/server/rest/services/LesothoBoundaries/MapServer',
  authorityEvidenceUrl: 'https://www.bos.gov.ls/New%20Folder/Environment%20and%20Energy/2022_Environment_Report.pdf',
  observedVersion: 'undated-map-service-observed-2026-07-25',
  observedScope: 'administrative-boundaries-without-reuse-or-version',
  reuseTermsStatus: 'not-recorded',
  correctionPathStatus: 'not-accepted',
  reviewStatus: 'blocked',
  nextGate: 'obtain-explicit-reuse-terms-version-and-source-correction-path',
  reviewedAt: '2026-07-25T00:00:00Z',
  reviewBy: '2026-08-01T00:00:00Z',
  rawPrivateMaterialStored: false,
  nonClaim: 'The Department of Rural Water Supply map service exposes district and community-council boundary layers, but its source record has no reuse terms, copyright text, version, or source-specific correction path. It is blocked from the synthetic administrative-key index and does not support copying, postal lookup, address validation, or delivery claims.',
};

const ESWATINI_REGIONAL_ADMINISTRATION: CountryGeographicMetadataSourceReview = {
  countryCode: 'SZ',
  sourceId: 'gov-sz-regional-administration',
  sourceUrl: 'https://www.gov.sz/index.php/departments-sp-1832997396/regional-administration',
  authorityEvidenceUrl: 'https://www.gov.sz/index.php/departments-sp-1832997396/regional-administration',
  observedVersion: 'undated-government-administration-page-observed-2026-07-25',
  observedScope: 'administrative-hierarchy-without-reuse-or-version',
  reuseTermsStatus: 'not-recorded',
  correctionPathStatus: 'not-accepted',
  reviewStatus: 'blocked',
  nextGate: 'obtain-explicit-reuse-terms-version-and-source-correction-path',
  reviewedAt: '2026-07-25T00:00:00Z',
  reviewBy: '2026-08-01T00:00:00Z',
  rawPrivateMaterialStored: false,
  nonClaim: 'The Government regional-administration page identifies the national regional hierarchy, but it does not publish reusable key data, reuse terms, a version, or a source-specific correction path. It is not approved for synthetic administrative evaluation, postal lookup, address validation, or delivery claims unless a separately governed source or open-source composite clears every gate.',
};

export const COUNTRY_GEOGRAPHIC_METADATA_SOURCE_REVIEW_LEDGER: readonly CountryGeographicMetadataSourceReview[] = [
  HONDURAS_INE_GEOGRAPHIC_CODES,
  HONDURAS_INE_DEE_2024,
  NICARAGUA_CORREOS_POSTAL_SYSTEM,
  EL_SALVADOR_CORREOS_SERVICE_INFORMATION,
  LESOTHO_DRWS_BOUNDARIES,
  ESWATINI_REGIONAL_ADMINISTRATION,
];

export function listCountryGeographicMetadataSourceReviews(countryCode?: string) {
  const normalized = countryCode?.trim().toUpperCase();
  if (normalized && !/^[A-Z]{2}$/.test(normalized)) {
    throw new Error('country geographic metadata review requires an ISO 3166-1 alpha-2 country code');
  }
  return COUNTRY_GEOGRAPHIC_METADATA_SOURCE_REVIEW_LEDGER
    .filter(entry => !normalized || entry.countryCode === normalized)
    .map(entry => ({ ...entry }))
    .sort((left, right) => left.countryCode.localeCompare(right.countryCode) || left.sourceId.localeCompare(right.sourceId));
}
