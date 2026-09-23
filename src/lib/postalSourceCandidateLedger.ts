import { createHash } from 'node:crypto';

import {
  getOfficialPostalSourcesForCountry,
  isPostalReferenceDataSource,
  OFFICIAL_POSTAL_SOURCE_CATALOG_VERSION,
  type OfficialPostalSourceProfile,
} from './officialPostalSourceCatalog';

export const POSTAL_SOURCE_CANDIDATE_LEDGER_VERSION = 'postal-source-candidate-ledger-v0.2';

export type PostalSourceCandidateLedgerEntry = {
  candidateId: string;
  scopeId: string;
  countryCode: string;
  scopeKind: 'national';
  scopeStatus: 'candidate';
  nonClaim: string;
  sourceId: string;
  sourceUrl: string;
  catalogVersion: typeof OFFICIAL_POSTAL_SOURCE_CATALOG_VERSION;
  sourceVersion: null;
  sourceVersionStatus: 'not-recorded';
  termsUrl: null;
  termsStatus: 'not-recorded';
  coverageStatus: 'not-recorded';
  correctionUrl: null;
  correctionPathStatus: 'not-recorded';
  candidateStatus: 'metadata-only';
  nextGate: 'record-source-version';
  discoveredAt: string;
  reviewBy: string;
  catalogMetadataDigest: string;
  rawPrivateMaterialStored: false;
};

export type PostalSourceFrameworkLedgerEntry = {
  frameworkId: string;
  countryCode: string;
  sourceRole: 'legal-framework-only';
  nonClaim: string;
  sourceId: string;
  sourceUrl: string;
  catalogVersion: typeof OFFICIAL_POSTAL_SOURCE_CATALOG_VERSION;
  validationReadiness: 'metadata-only';
  nextGate: 'find-current-postal-reference-dataset';
  discoveredAt: string;
  reviewBy: string;
  catalogMetadataDigest: string;
  rawPrivateMaterialStored: false;
};

function normalizeCountryCode(countryCode: string) {
  return countryCode.trim().toUpperCase().replace(/[^A-Z]/g, '');
}

function validateLedgerTimes(discoveredAt: string, reviewBy: string) {
  const discoveredAtMs = Date.parse(discoveredAt);
  const reviewByMs = Date.parse(reviewBy);
  if (!Number.isFinite(discoveredAtMs)) throw new Error('Postal source candidate discoveredAt must be a valid timestamp');
  if (!Number.isFinite(reviewByMs)) throw new Error('Postal source candidate reviewBy must be a valid timestamp');
  if (reviewByMs <= discoveredAtMs) throw new Error('Postal source candidate reviewBy must be later than discoveredAt');
}

function catalogMetadataDigest(countryCode: string, source: OfficialPostalSourceProfile) {
  const material = JSON.stringify({
    catalogVersion: OFFICIAL_POSTAL_SOURCE_CATALOG_VERSION,
    countryCode,
    sourceId: source.id,
    sourceUrl: source.url,
    authority: source.authority,
    trustTier: source.trustTier,
    availability: source.availability,
    depth: source.depth,
    sourceRole: source.sourceRole ?? 'postal-reference-data',
    validationReadiness: source.validationReadiness,
  });
  return createHash('sha256').update(material).digest('hex');
}

export function buildPostalSourceCandidateLedger(input: {
  countryCode: string;
  discoveredAt: string;
  reviewBy: string;
}): PostalSourceCandidateLedgerEntry[] {
  const countryCode = normalizeCountryCode(input.countryCode);
  if (countryCode.length !== 2) throw new Error('Postal source candidate countryCode must be ISO alpha-2');
  validateLedgerTimes(input.discoveredAt, input.reviewBy);

  return getOfficialPostalSourcesForCountry(countryCode)
    .filter(source => source.validationReadiness === 'metadata-only' && isPostalReferenceDataSource(source))
    .map(source => ({
      candidateId: `postal-source-candidate:${countryCode.toLowerCase()}:${source.id}`,
      scopeId: `postal-source-scope:${countryCode.toLowerCase()}:national`,
      countryCode,
      scopeKind: 'national',
      scopeStatus: 'candidate',
      nonClaim: 'Metadata-only source discovery is not evidence of reusable postal data, official-reference validation, or delivery availability.',
      sourceId: source.id,
      sourceUrl: source.url,
      catalogVersion: OFFICIAL_POSTAL_SOURCE_CATALOG_VERSION,
      sourceVersion: null,
      sourceVersionStatus: 'not-recorded',
      termsUrl: null,
      termsStatus: 'not-recorded',
      coverageStatus: 'not-recorded',
      correctionUrl: null,
      correctionPathStatus: 'not-recorded',
      candidateStatus: 'metadata-only',
      nextGate: 'record-source-version',
      discoveredAt: input.discoveredAt,
      reviewBy: input.reviewBy,
      catalogMetadataDigest: catalogMetadataDigest(countryCode, source),
      rawPrivateMaterialStored: false,
    }));
}

export function buildPostalSourceFrameworkLedger(input: {
  countryCode: string;
  discoveredAt: string;
  reviewBy: string;
}): PostalSourceFrameworkLedgerEntry[] {
  const countryCode = normalizeCountryCode(input.countryCode);
  if (countryCode.length !== 2) throw new Error('Postal source framework countryCode must be ISO alpha-2');
  validateLedgerTimes(input.discoveredAt, input.reviewBy);

  return getOfficialPostalSourcesForCountry(countryCode)
    .filter(source => source.sourceRole === 'legal-framework-only')
    .filter(source => source.validationReadiness === 'metadata-only')
    .map(source => ({
      frameworkId: `postal-source-framework:${countryCode.toLowerCase()}:${source.id}`,
      countryCode,
      sourceRole: 'legal-framework-only',
      nonClaim: 'An official legal framework is not evidence of a current postal-reference dataset, reusable postal data, postal lookup, or delivery availability.',
      sourceId: source.id,
      sourceUrl: source.url,
      catalogVersion: OFFICIAL_POSTAL_SOURCE_CATALOG_VERSION,
      validationReadiness: 'metadata-only',
      nextGate: 'find-current-postal-reference-dataset',
      discoveredAt: input.discoveredAt,
      reviewBy: input.reviewBy,
      catalogMetadataDigest: catalogMetadataDigest(countryCode, source),
      rawPrivateMaterialStored: false,
    }));
}
