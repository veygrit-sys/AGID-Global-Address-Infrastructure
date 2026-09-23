import type { TopographicSourceLedger } from './topographicLocalGeoTiffWorkflow';
import {
  TOPOGRAPHIC_SOURCE_LEDGER_SCHEMA,
} from './topographicLocalGeoTiffWorkflow';
import {
  promoteRegionalTopographicSnapshot,
} from './regionalTopographicOpenSourceStack';

export const NYC_3DEP_CASE_STUDY_VERSION =
  'agid-nyc-3dep-case-study-v0.1';

export const NYC_BOROUGH_SCOPE_EVIDENCE = {
  sourceId: 'nyc-dcp-borough-boundary-26b',
  publisher: 'New York City Department of City Planning',
  product: 'New York City Borough Boundary',
  version: '26B',
  publishedAt: '2026-05-19T00:00:00.000Z',
  sourceUrl:
    'https://s-media.nyc.gov/agencies/dcp/assets/files/pdf/data-tools/bytes/nybb_metadata.pdf',
  termsUrl:
    'https://s-media.nyc.gov/agencies/dcp/assets/files/pdf/data-tools/bytes/nybb_metadata.pdf',
  correctionUrl: 'https://www.nyc.gov/site/planning/about/contact-us.page',
  scope: 'Administrative scope context only; no boundary geometry is embedded in a terrain ledger.',
  limitations: [
    'The DCP metadata says that the dataset is informational and disclaims warranties.',
    'The official borough boundary includes areas under water; choose the water-inclusive product only when that scope is intended.',
  ],
} as const;

export const USGS_3DEP_NYC_SOURCE_EVIDENCE = {
  sourceId: 'usgs-3dep',
  product: 'USGS 3DEP 1/3 arc-second bare-earth DEM',
  sourceUrl:
    'https://www.usgs.gov/3d-elevation-program/about-3dep-products-services',
  termsUrl:
    'https://www.usgs.gov/information-policies-and-instructions/copyrights-and-credits',
  metadataUrl:
    'https://www.usgs.gov/ngp-standards-and-specifications/3dep-product-metadata',
  correctionUrl: 'https://www.usgs.gov/3d-elevation-program/contact-us',
  licenseId: 'US-public-domain',
  verticalDatum: 'NAVD88',
  sourceCrs: 'EPSG:4269',
  limitations: [
    'The particular product tile must declare its resolution, horizontal CRS, vertical datum, version, and metadata before promotion.',
    'NAD83-to-WGS84 normalization in the browser is not a survey-grade horizontal datum accuracy claim.',
    'Bare-earth terrain is not a building, entrance, address, recipient, or delivery-point claim.',
  ],
} as const;

export const USGS_3DEP_NYC_PRODUCT_PROFILES = {
  '1-3-arc-second': {
    product: 'USGS 3DEP 1/3 arc-second bare-earth DEM',
    horizontalCrs: 'EPSG:4269',
    notes: 'Geographic NAD83 profile for the 1/3 arc-second 3DEP DEM.',
  },
  '1-meter': {
    product: 'USGS 3DEP 1 meter bare-earth DEM',
    horizontalCrs: 'EPSG:26918',
    notes: 'NYC is in NAD83 / UTM zone 18N; the exact asset header remains authoritative.',
  },
} as const;

export type Nyc3depProductProfile = keyof typeof USGS_3DEP_NYC_PRODUCT_PROFILES;
export type Nyc3depSourceHorizontalCrs =
  (typeof USGS_3DEP_NYC_PRODUCT_PROFILES)[Nyc3depProductProfile]['horizontalCrs'];

const sha256Pattern = /^sha256:[a-f0-9]{64}$/i;
const reservedVersionIds = new Set(['3dep-products', 'usgs-3dep', 'current']);
const usgsAssetHosts = new Set([
  'elevation.nationalmap.gov',
  'prd-tnm.s3.amazonaws.com',
  'rockyweb.usgs.gov',
]);
const usgsMetadataHosts = new Set([
  'www.usgs.gov',
  'data.usgs.gov',
  'apps.nationalmap.gov',
  'www.sciencebase.gov',
  'thor-f5.er.usgs.gov',
]);
const prohibitedQueryParameter = /(?:token|key|signature|credential|password|secret)/i;

export type Nyc3depSnapshotReceipt = {
  sourceAssetUrl: string;
  metadataUrl: string;
  versionId: string;
  publishedAt: string;
  retrievedAt: string;
  verifiedAt: string;
  contentSha256: `sha256:${string}`;
  recordOrCellCount: number;
  horizontalCrs: Nyc3depSourceHorizontalCrs;
  verticalDatum: 'NAVD88';
  productProfile?: Nyc3depProductProfile;
};

function requireTimestamp(field: string, value: string) {
  if (!Number.isFinite(Date.parse(value))) {
    throw new Error(`${field} must be an ISO timestamp.`);
  }
}

function requireTrustedUrl(
  field: string,
  value: string,
  allowedHosts: ReadonlySet<string>,
) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${field} must be an absolute HTTPS URL.`);
  }
  if (
    url.protocol !== 'https:'
    || url.username
    || url.password
    || !allowedHosts.has(url.hostname.toLowerCase())
  ) {
    throw new Error(`${field} must use an approved official USGS or National Map host.`);
  }
  for (const parameter of url.searchParams.keys()) {
    if (prohibitedQueryParameter.test(parameter)) {
      throw new Error(`${field} must not contain credentials or signed-access parameters.`);
    }
  }
  return url.toString();
}

function resolveProductProfile(receipt: Nyc3depSnapshotReceipt) {
  const inferred = receipt.horizontalCrs === 'EPSG:26918'
    ? '1-meter'
    : '1-3-arc-second';
  const profileId = receipt.productProfile ?? inferred;
  const profile = USGS_3DEP_NYC_PRODUCT_PROFILES[profileId];
  if (!profile) {
    throw new Error('NYC 3DEP receipt must select a supported product profile.');
  }
  if (receipt.horizontalCrs !== profile.horizontalCrs) {
    throw new Error(
      `NYC 3DEP ${profileId} profile must declare ${profile.horizontalCrs}.`,
    );
  }
  return { profileId, profile };
}

function validateReceipt(receipt: Nyc3depSnapshotReceipt) {
  const sourceAssetUrl = requireTrustedUrl(
    'sourceAssetUrl',
    receipt.sourceAssetUrl,
    usgsAssetHosts,
  );
  const metadataUrl = requireTrustedUrl(
    'metadataUrl',
    receipt.metadataUrl,
    usgsMetadataHosts,
  );
  const versionId = receipt.versionId.trim();
  if (
    !versionId
    || versionId.length > 160
    || reservedVersionIds.has(versionId.toLowerCase())
  ) {
    throw new Error('versionId must be an immutable, resolved 3DEP product version.');
  }
  if (!sha256Pattern.test(receipt.contentSha256)) {
    throw new Error('contentSha256 must be a SHA-256 digest.');
  }
  if (
    !Number.isSafeInteger(receipt.recordOrCellCount)
    || receipt.recordOrCellCount <= 0
  ) {
    throw new Error('recordOrCellCount must be a positive integer.');
  }
  const productProfile = resolveProductProfile(receipt);
  if (receipt.verticalDatum !== USGS_3DEP_NYC_SOURCE_EVIDENCE.verticalDatum) {
    throw new Error('NYC 3DEP case-study input must declare NAVD88 vertical datum.');
  }
  requireTimestamp('publishedAt', receipt.publishedAt);
  requireTimestamp('retrievedAt', receipt.retrievedAt);
  requireTimestamp('verifiedAt', receipt.verifiedAt);
  if (
    Date.parse(receipt.publishedAt) > Date.parse(receipt.retrievedAt)
    || Date.parse(receipt.retrievedAt) > Date.parse(receipt.verifiedAt)
  ) {
    throw new Error('NYC 3DEP receipt timestamps must be publishedAt <= retrievedAt <= verifiedAt.');
  }
  return { sourceAssetUrl, metadataUrl, versionId, ...productProfile };
}

/**
 * Produces an importable Studio ledger only after the operator has hashed an
 * exact public 3DEP asset and retained the matching official metadata URL.
 * It never downloads raster data, stores geometry, or accepts credentials.
 */
export function createNyc3depSourceLedger(
  receipt: Nyc3depSnapshotReceipt,
): TopographicSourceLedger {
  const validated = validateReceipt(receipt);
  const record = promoteRegionalTopographicSnapshot({
    sourceId: 'usgs-3dep',
    versionId: validated.versionId,
    publishedAt: receipt.publishedAt,
    retrievedAt: receipt.retrievedAt,
    verifiedAt: receipt.verifiedAt,
    sha256: receipt.contentSha256,
    adapterVersion: NYC_3DEP_CASE_STUDY_VERSION,
    recordOrCellCount: receipt.recordOrCellCount,
    coverage: {
      scope: 'country',
      countryCodes: ['US'],
      description: 'USGS 3DEP product scope; the decoded asset bounds remain the authoritative terrain extent.',
    },
    licenseEvidenceUrl: USGS_3DEP_NYC_SOURCE_EVIDENCE.termsUrl,
    rightsDecision: 'approved',
    horizontalCrs: receipt.horizontalCrs,
    verticalDatum: receipt.verticalDatum,
  });

  return {
    schemaVersion: TOPOGRAPHIC_SOURCE_LEDGER_SCHEMA,
    generatedAt: receipt.verifiedAt,
    records: [{
      ...record,
      product: validated.profile.product,
      notes: [
        ...(record.notes ?? []),
        `Case study: ${NYC_3DEP_CASE_STUDY_VERSION}.`,
        `Exact public asset: ${validated.sourceAssetUrl}.`,
        `Product metadata: ${validated.metadataUrl}.`,
        `3DEP product profile: ${validated.profileId} (${validated.profile.horizontalCrs}).`,
        validated.profile.notes,
        `Administrative scope reference: ${NYC_BOROUGH_SCOPE_EVIDENCE.sourceUrl}.`,
        'No NYC boundary geometry, address, recipient, AOID, or access material is included in this ledger.',
      ],
    }],
  };
}
