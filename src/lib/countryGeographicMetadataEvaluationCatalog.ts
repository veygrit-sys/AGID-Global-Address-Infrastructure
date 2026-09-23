import {
  buildCountryGeographicMetadataEvaluationIndex,
  type CountryGeographicMetadataEvaluationIndex,
  type CountryGeographicMetadataSourceCandidate,
  type SyntheticAdministrativeKeyCandidate,
} from './countryGeographicMetadataEvaluationIndex';

export const COUNTRY_GEOGRAPHIC_METADATA_EVALUATION_CATALOG_VERSION =
  'country-geographic-metadata-evaluation-catalog-v4';

export type CountryGeographicMetadataCatalogEvidence = {
  retrievedAt: string;
  authorityEvidenceUrl: string;
  reuseEvidenceUrl: string;
  scopeAndVersionEvidenceUrl: string;
  correctionPathEvidenceUrl: string;
};

export type CountryGeographicMetadataCatalogEntry = {
  source: CountryGeographicMetadataSourceCandidate;
  syntheticAdministrativeKeys: SyntheticAdministrativeKeyCandidate[];
  evidence: CountryGeographicMetadataCatalogEvidence;
  nonClaim: string;
};

// This catalog intentionally contains only country records whose evidence was
// reviewed. It stores no source snapshot, real administrative-key value, geometry,
// coordinate, address, or recipient information.
const AUSTRALIA_ABS_ASGS_EDITION_4_MAIN_2026: CountryGeographicMetadataCatalogEntry = {
  source: {
    countryCode: 'AU',
    sourceId: 'abs-au-asgs-edition-4-main-2026',
    sourceOrigin: 'official-publication',
    componentSourceIds: [],
    sourceUrl: 'https://www.abs.gov.au/statistics/standards/australian-statistical-geography-standard-asgs/edition-4-july-2026-june-2031',
    authorityEvidenceUrl: 'https://www.abs.gov.au/about',
    authorityStatus: 'official-country-or-territory',
    sourceVersion: 'asgs-edition-4-main-structure-released-2026-07-22',
    versionStatus: 'verified-current',
    reuseLicense: 'Creative Commons Attribution 4.0 International',
    reuseTermsUrl: 'https://www.abs.gov.au/website-privacy-copyright-and-disclaimer',
    reuseStatus: 'reuse-approved',
    declaredScope: 'country',
    coverageStatus: 'country-or-territory-coverage-evidenced',
    correctionUrl: 'https://www.abs.gov.au/about/contact-us',
    correctionPathStatus: 'source-record-publisher-contact-confirmed',
    approvalStatus: 'approved-for-synthetic-administrative-evaluation',
    approvedAdministrativeKeyKinds: ['first-order-subdivision'],
    reviewedAt: '2026-07-25T00:00:00Z',
    reviewBy: '2026-08-25T00:00:00Z',
    rawPrivateMaterialStored: false,
  },
  syntheticAdministrativeKeys: [
    {
      keyId: 'synthetic-admin-key:au:abs-au-asgs-edition-4-main-2026:state-territory-holdout-v1',
      countryCode: 'AU',
      sourceId: 'abs-au-asgs-edition-4-main-2026',
      keyKind: 'first-order-subdivision',
      syntheticKeyToken: 'synthetic:AU:state-territory-holdout-v1',
      synthetic: true,
      approvalStatus: 'approved',
    },
  ],
  evidence: {
    retrievedAt: '2026-07-25T00:00:00Z',
    authorityEvidenceUrl: 'https://www.abs.gov.au/about',
    reuseEvidenceUrl: 'https://www.abs.gov.au/website-privacy-copyright-and-disclaimer',
    scopeAndVersionEvidenceUrl: 'https://www.abs.gov.au/statistics/standards/australian-statistical-geography-standard-asgs/edition-4-july-2026-june-2031',
    correctionPathEvidenceUrl: 'https://www.abs.gov.au/about/contact-us',
  },
  nonClaim: 'The ABS ASGS Edition 4 Main Structure is approved only for synthetic state-and-territory key evaluation. It is a statistical geography and is not used to infer legal boundaries, postcode coverage, an address match, routing, or delivery. The catalog stores no source data, boundary, postcode, address, coordinate, or recipient record.',
};

const GUATEMALA_SEGEPLAN_MUNICIPAL_2018: CountryGeographicMetadataCatalogEntry = {
  source: {
    countryCode: 'GT',
    sourceId: 'segeplan-gt-nbi-municipal-2018',
    sourceOrigin: 'official-publication',
    componentSourceIds: [],
    sourceUrl: 'https://datos.segeplan.gob.gt/dataset/nbi-2018-nacional-por-municipio/resource/3c22eaaf-fc36-4c98-adff-a3fc0d2ec3c2',
    authorityEvidenceUrl: 'https://datos.segeplan.gob.gt/dataset/nbi-2018-nacional-por-municipio',
    authorityStatus: 'official-country-or-territory',
    sourceVersion: 'dataset-last-updated-2024-09-08',
    versionStatus: 'verified-current',
    reuseLicense: 'SEGEPLAN portal: Otra (Abierta); official portal guidance states open data may be used and shared without a reuse license.',
    reuseTermsUrl: 'https://portal.segeplan.gob.gt/segeplan/?p=11267',
    reuseStatus: 'reuse-approved',
    declaredScope: 'country',
    coverageStatus: 'country-or-territory-coverage-evidenced',
    correctionUrl: 'https://datos.segeplan.gob.gt/dataset/nbi-2018-nacional-por-municipio',
    correctionPathStatus: 'source-record-publisher-contact-confirmed',
    approvalStatus: 'approved-for-synthetic-administrative-evaluation',
    approvedAdministrativeKeyKinds: ['first-order-subdivision', 'municipality'],
    reviewedAt: '2026-07-25T00:00:00Z',
    reviewBy: '2026-08-25T00:00:00Z',
    rawPrivateMaterialStored: false,
  },
  syntheticAdministrativeKeys: [
    {
      keyId: 'synthetic-admin-key:gt:segeplan-gt-nbi-municipal-2018:first-order-subdivision-holdout-v1',
      countryCode: 'GT',
      sourceId: 'segeplan-gt-nbi-municipal-2018',
      keyKind: 'first-order-subdivision',
      syntheticKeyToken: 'synthetic:GT:first-order-subdivision-holdout-v1',
      synthetic: true,
      approvalStatus: 'approved',
    },
    {
      keyId: 'synthetic-admin-key:gt:segeplan-gt-nbi-municipal-2018:municipality-holdout-v1',
      countryCode: 'GT',
      sourceId: 'segeplan-gt-nbi-municipal-2018',
      keyKind: 'municipality',
      syntheticKeyToken: 'synthetic:GT:municipality-holdout-v1',
      synthetic: true,
      approvalStatus: 'approved',
    },
  ],
  evidence: {
    retrievedAt: '2026-07-25T00:00:00Z',
    authorityEvidenceUrl: 'https://datos.segeplan.gob.gt/dataset/nbi-2018-nacional-por-municipio',
    reuseEvidenceUrl: 'https://portal.segeplan.gob.gt/segeplan/?p=11267',
    scopeAndVersionEvidenceUrl: 'https://datos.segeplan.gob.gt/dataset/nbi-2018-nacional-por-municipio/resource/3c22eaaf-fc36-4c98-adff-a3fc0d2ec3c2',
    correctionPathEvidenceUrl: 'https://datos.segeplan.gob.gt/dataset/nbi-2018-nacional-por-municipio',
  },
  nonClaim: 'The official source record supplies a publisher contact route, not a dedicated correction ticket. This approval is limited to synthetic administrative-key evaluation and does not authorize copying the dataset, postal lookup, address validation, or delivery claims.',
};

const PANAMA_INEC_POLITICAL_DIVISION_2020: CountryGeographicMetadataCatalogEntry = {
  source: {
    countryCode: 'PA',
    sourceId: 'inec-pa-political-division-2020',
    sourceOrigin: 'official-publication',
    componentSourceIds: [],
    sourceUrl: 'https://www.inec.gob.pa/mapa/Default2.aspx?ID_IDIOMA=1&ID_PROVINCIA=8&ID_TIPO=5',
    authorityEvidenceUrl: 'https://www.inec.gob.pa/mapa/Default2.aspx?ID_IDIOMA=1&ID_PROVINCIA=8&ID_TIPO=5',
    authorityStatus: 'official-country-or-territory',
    sourceVersion: 'political-division-2020-published-2024-05-30',
    versionStatus: 'verified-current',
    reuseLicense: 'Creative Commons Attribution 4.0 International',
    reuseTermsUrl: 'https://www.inec.gob.pa/mapa/Default2.aspx?ID_IDIOMA=1&ID_PROVINCIA=8&ID_TIPO=5',
    reuseStatus: 'reuse-approved',
    declaredScope: 'country',
    coverageStatus: 'country-or-territory-coverage-evidenced',
    correctionUrl: 'https://www.inec.gob.pa/mapa/Default2.aspx?ID_IDIOMA=1&ID_PROVINCIA=8&ID_TIPO=5',
    correctionPathStatus: 'source-record-publisher-contact-confirmed',
    approvalStatus: 'approved-for-synthetic-administrative-evaluation',
    approvedAdministrativeKeyKinds: ['first-order-subdivision', 'second-order-subdivision'],
    reviewedAt: '2026-07-25T00:00:00Z',
    reviewBy: '2026-08-25T00:00:00Z',
    rawPrivateMaterialStored: false,
  },
  syntheticAdministrativeKeys: [
    {
      keyId: 'synthetic-admin-key:pa:inec-pa-political-division-2020:first-order-subdivision-holdout-v1',
      countryCode: 'PA',
      sourceId: 'inec-pa-political-division-2020',
      keyKind: 'first-order-subdivision',
      syntheticKeyToken: 'synthetic:PA:first-order-subdivision-holdout-v1',
      synthetic: true,
      approvalStatus: 'approved',
    },
    {
      keyId: 'synthetic-admin-key:pa:inec-pa-political-division-2020:district-holdout-v1',
      countryCode: 'PA',
      sourceId: 'inec-pa-political-division-2020',
      keyKind: 'second-order-subdivision',
      syntheticKeyToken: 'synthetic:PA:district-holdout-v1',
      synthetic: true,
      approvalStatus: 'approved',
    },
  ],
  evidence: {
    retrievedAt: '2026-07-25T00:00:00Z',
    authorityEvidenceUrl: 'https://www.inec.gob.pa/mapa/Default2.aspx?ID_IDIOMA=1&ID_PROVINCIA=8&ID_TIPO=5',
    reuseEvidenceUrl: 'https://www.inec.gob.pa/mapa/Default2.aspx?ID_IDIOMA=1&ID_PROVINCIA=8&ID_TIPO=5',
    scopeAndVersionEvidenceUrl: 'https://www.inec.gob.pa/mapa/Default2.aspx?ID_IDIOMA=1&ID_PROVINCIA=8&ID_TIPO=5',
    correctionPathEvidenceUrl: 'https://www.inec.gob.pa/mapa/Default2.aspx?ID_IDIOMA=1&ID_PROVINCIA=8&ID_TIPO=5',
  },
  nonClaim: 'The INEC publication is approved only for synthetic province-and-district key evaluation. The source record provides a publisher contact route, not a dedicated correction ticket; it does not authorize copying the source, postal lookup, address validation, or delivery claims.',
};

const NEW_ZEALAND_STATS_NZ_GEOGRAPHIC_BOUNDARIES_2026: CountryGeographicMetadataCatalogEntry = {
  source: {
    countryCode: 'NZ',
    sourceId: 'stats-nz-geographic-boundaries-2026',
    sourceOrigin: 'official-publication',
    componentSourceIds: [],
    sourceUrl: 'https://www.stats.govt.nz/information-releases/geographic-boundaries-annual-release-as-at-1-january-2026/',
    authorityEvidenceUrl: 'https://www.stats.govt.nz/assets/Methods/Statistical-standard-for-geographic-areas-2023/statistical-standard-for-geographic-areas-2023-updated-december-2023.pdf',
    authorityStatus: 'official-country-or-territory',
    sourceVersion: 'geographic-boundaries-as-at-2026-01-01-published-2025-12-10',
    versionStatus: 'verified-current',
    reuseLicense: 'Creative Commons Attribution 4.0 International',
    reuseTermsUrl: 'https://www.stats.govt.nz/',
    reuseStatus: 'reuse-approved',
    declaredScope: 'country',
    coverageStatus: 'country-or-territory-coverage-evidenced',
    correctionUrl: 'https://portal.apis.stats.govt.nz/contact-us',
    correctionPathStatus: 'source-record-publisher-contact-confirmed',
    approvalStatus: 'approved-for-synthetic-administrative-evaluation',
    approvedAdministrativeKeyKinds: ['first-order-subdivision', 'second-order-subdivision'],
    reviewedAt: '2026-07-25T00:00:00Z',
    reviewBy: '2026-08-25T00:00:00Z',
    rawPrivateMaterialStored: false,
  },
  syntheticAdministrativeKeys: [
    {
      keyId: 'synthetic-admin-key:nz:stats-nz-geographic-boundaries-2026:regional-council-holdout-v1',
      countryCode: 'NZ',
      sourceId: 'stats-nz-geographic-boundaries-2026',
      keyKind: 'first-order-subdivision',
      syntheticKeyToken: 'synthetic:NZ:regional-council-holdout-v1',
      synthetic: true,
      approvalStatus: 'approved',
    },
    {
      keyId: 'synthetic-admin-key:nz:stats-nz-geographic-boundaries-2026:territorial-authority-holdout-v1',
      countryCode: 'NZ',
      sourceId: 'stats-nz-geographic-boundaries-2026',
      keyKind: 'second-order-subdivision',
      syntheticKeyToken: 'synthetic:NZ:territorial-authority-holdout-v1',
      synthetic: true,
      approvalStatus: 'approved',
    },
  ],
  evidence: {
    retrievedAt: '2026-07-25T00:00:00Z',
    authorityEvidenceUrl: 'https://www.stats.govt.nz/assets/Methods/Statistical-standard-for-geographic-areas-2023/statistical-standard-for-geographic-areas-2023-updated-december-2023.pdf',
    reuseEvidenceUrl: 'https://www.stats.govt.nz/',
    scopeAndVersionEvidenceUrl: 'https://www.stats.govt.nz/information-releases/geographic-boundaries-annual-release-as-at-1-january-2026/',
    correctionPathEvidenceUrl: 'https://portal.apis.stats.govt.nz/contact-us',
  },
  nonClaim: 'The Stats NZ annual release and geographic standard are approved only for synthetic regional-council and territorial-authority key evaluation. The catalog stores no boundary, classification value, coordinate, postal, or address record; it does not authorize postal lookup, address validation, routing, or delivery claims.',
};

export const COUNTRY_GEOGRAPHIC_METADATA_EVALUATION_CATALOG: readonly CountryGeographicMetadataCatalogEntry[] = [
  AUSTRALIA_ABS_ASGS_EDITION_4_MAIN_2026,
  GUATEMALA_SEGEPLAN_MUNICIPAL_2018,
  NEW_ZEALAND_STATS_NZ_GEOGRAPHIC_BOUNDARIES_2026,
  PANAMA_INEC_POLITICAL_DIVISION_2020,
];

export function listCountryGeographicMetadataCatalogEntries() {
  return [...COUNTRY_GEOGRAPHIC_METADATA_EVALUATION_CATALOG]
    .sort((left, right) => (
      left.source.countryCode.localeCompare(right.source.countryCode)
      || left.source.sourceId.localeCompare(right.source.sourceId)
    ));
}

export function buildApprovedCountryGeographicMetadataEvaluationIndex(input: {
  now?: string | number | Date;
} = {}): CountryGeographicMetadataEvaluationIndex {
  const entries = listCountryGeographicMetadataCatalogEntries();
  return buildCountryGeographicMetadataEvaluationIndex({
    sources: entries.map(entry => entry.source),
    syntheticAdministrativeKeys: entries.flatMap(entry => entry.syntheticAdministrativeKeys),
    now: input.now,
  });
}
