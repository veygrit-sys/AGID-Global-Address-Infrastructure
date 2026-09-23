import { createHash } from 'node:crypto';
import {
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { fromArrayBuffer } from 'geotiff';

import {
  createNyc3depSourceLedger,
  type Nyc3depSourceHorizontalCrs,
  type Nyc3depSnapshotReceipt,
} from '../src/lib/topographicNyc3depCaseStudy';
import {
  parseTopographicCogValidationReceipt,
  requirePassedTopographicCogValidation,
} from '../src/lib/topographicCogValidation';
import { MAX_GEOTIFF_BYTE_LENGTH } from '../src/lib/topographicGeoTiffAdapter';
import type { TopographicSourceLedger } from '../src/lib/topographicLocalGeoTiffWorkflow';

export const NYC_3DEP_LOCAL_LEDGER_CLI_VERSION =
  'agid-nyc-3dep-local-ledger-cli-v0.3';
export const MAX_TNM_ACCESS_CATALOG_BYTES = 1024 * 1024;
export const MAX_SCIENCEBASE_METADATA_BYTES = 1024 * 1024;
export const MAX_USGS_PRODUCT_METADATA_BYTES = 1024 * 1024;
export const MAX_COG_VALIDATION_RECEIPT_BYTES = 1024 * 1024;
export const MAX_COG_VALIDATION_REPORT_BYTES = 1024 * 1024;

const approvedProductMetadataHosts = new Set([
  'www.usgs.gov',
  'www.sciencebase.gov',
  'apps.nationalmap.gov',
  'prd-tnm.s3.amazonaws.com',
  'thor-f5.er.usgs.gov',
]);
const prohibitedQueryParameter = /(?:token|key|signature|credential|password|secret)/i;

export type Nyc3depLocalGeoTiffInspection = {
  contentSha256: `sha256:${string}`;
  byteLength: number;
  recordOrCellCount: number;
  sourceHorizontalCrs: Nyc3depSourceHorizontalCrs;
};

export type CreateNyc3depLocalLedgerInput = Omit<
  Nyc3depSnapshotReceipt,
  'contentSha256' | 'recordOrCellCount' | 'horizontalCrs' | 'verticalDatum'
> & {
  assetPath: string;
  tnmAccessCatalogPath?: string;
  tnmAccessProductId?: string;
  scienceBaseMetadataPath?: string;
  productMetadataXmlPath?: string;
  cogValidationReceiptPath?: string;
  cogValidationRawReportPath?: string;
};

export type TnmAccessCatalogEvidence = {
  productId: string;
  catalogResponseSha256: `sha256:${string}`;
};

export type ScienceBaseProductEvidence = {
  itemResponseSha256: `sha256:${string}`;
  productMetadataUrl: string;
  productMetadataResponseSha256: `sha256:${string}`;
};

export type Nyc3depCogValidationEvidence = {
  receiptSha256: `sha256:${string}`;
  rawReportSha256: `sha256:${string}`;
  gdalVersion: string;
  validatedAt: string;
};

export type Nyc3depLocalLedgerResult = {
  inspection: Nyc3depLocalGeoTiffInspection;
  ledger: TopographicSourceLedger;
  tnmAccessCatalogEvidence: TnmAccessCatalogEvidence | null;
  scienceBaseProductEvidence: ScienceBaseProductEvidence | null;
  cogValidationEvidence: Nyc3depCogValidationEvidence | null;
};

function asArrayBuffer(bytes: Uint8Array) {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}

function sha256(bytes: Uint8Array) {
  return `sha256:${createHash('sha256').update(bytes).digest('hex')}` as const;
}

function normalizedUrl(value: string, field: string) {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${field} must be an absolute URL.`);
  }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password) {
    throw new Error(`${field} must be a credential-free HTTPS URL.`);
  }
  for (const parameter of parsed.searchParams.keys()) {
    if (prohibitedQueryParameter.test(parameter)) {
      throw new Error(`${field} must not contain credentialed or signed parameters.`);
    }
  }
  parsed.hash = '';
  return parsed.toString();
}

function requireOfficialProductMetadataUrl(value: string) {
  const normalized = normalizedUrl(value, 'ScienceBase product metadata URL');
  if (!approvedProductMetadataHosts.has(new URL(normalized).hostname.toLowerCase())) {
    throw new Error('ScienceBase product metadata URL must use an approved official host.');
  }
  return normalized;
}

function stringProperty(
  record: Record<string, unknown>,
  names: readonly string[],
  field: string,
) {
  for (const name of names) {
    const value = record[name];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  throw new Error(`TNMAccess product is missing ${field}.`);
}

function readTnmAccessCatalogItems(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('TNMAccess catalog snapshot must be a JSON object.');
  }
  const items = (value as { items?: unknown }).items;
  if (!Array.isArray(items)) {
    throw new Error('TNMAccess catalog snapshot must contain an items array.');
  }
  return items.filter(
    (item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item),
  );
}

function readJsonSnapshot(
  path: string,
  field: string,
  maximumBytes: number,
) {
  const resolvedPath = resolve(path);
  if (extname(resolvedPath).toLowerCase() !== '.json') {
    throw new Error(`${field} must point to a JSON response snapshot.`);
  }
  const stat = statSync(resolvedPath);
  if (!stat.isFile() || stat.size <= 0 || stat.size > maximumBytes) {
    throw new Error(
      `${field} must be a non-empty JSON file no larger than ${maximumBytes} bytes.`,
    );
  }
  const bytes = Uint8Array.from(readFileSync(resolvedPath));
  try {
    return { bytes, parsed: JSON.parse(new TextDecoder().decode(bytes)) as unknown };
  } catch {
    throw new Error(`${field} must contain valid JSON.`);
  }
}

/**
 * Links a separately retained strict GDAL COG validation receipt to the exact
 * local GeoTIFF digest. The raw validator output stays outside the ledger, but
 * its retained bytes are re-hashed before the receipt is promoted.
 */
export function verifyNyc3depCogValidationReceipt(input: {
  receiptPath: string;
  rawReportPath: string;
  expectedContentSha256: `sha256:${string}`;
  expectedByteLength: number;
}): Nyc3depCogValidationEvidence {
  const { bytes, parsed } = readJsonSnapshot(
    input.receiptPath,
    'cogValidationReceiptPath',
    MAX_COG_VALIDATION_RECEIPT_BYTES,
  );
  const receipt = requirePassedTopographicCogValidation(
    parseTopographicCogValidationReceipt(JSON.stringify(parsed)),
    input.expectedContentSha256,
  );
  if (receipt.input.byteLength !== input.expectedByteLength) {
    throw new Error('COG validation receipt is not bound to the expected GeoTIFF byte length.');
  }
  const rawReportPath = resolve(input.rawReportPath);
  const rawReportStat = statSync(rawReportPath);
  if (
    !rawReportStat.isFile()
    || rawReportStat.size <= 0
    || rawReportStat.size > MAX_COG_VALIDATION_REPORT_BYTES
  ) {
    throw new Error(
      `cogValidationRawReportPath must be a non-empty file no larger than ${MAX_COG_VALIDATION_REPORT_BYTES} bytes.`,
    );
  }
  if (basename(rawReportPath) !== receipt.rawReport.fileName) {
    throw new Error('COG validation raw report file name must match the receipt.');
  }
  const rawReportBytes = Uint8Array.from(readFileSync(rawReportPath));
  if (
    rawReportBytes.byteLength !== receipt.rawReport.byteLength
    || sha256(rawReportBytes) !== receipt.rawReport.sha256
  ) {
    throw new Error('COG validation raw report does not match the receipt digest or byte length.');
  }
  return {
    receiptSha256: sha256(bytes),
    rawReportSha256: receipt.rawReport.sha256,
    gdalVersion: receipt.validator.gdalVersion,
    validatedAt: receipt.validatedAt,
  };
}

/**
 * Binds a locally retained TNMAccess response to one explicit public product.
 * It intentionally keeps only the response digest and selected product ID, not
 * catalog geometry, query parameters, or the response payload.
 */
export function verifyTnmAccessCatalogSnapshot(input: {
  catalogPath: string;
  productId: string;
  sourceAssetUrl: string;
  metadataUrl: string;
}): TnmAccessCatalogEvidence {
  const { bytes, parsed } = readJsonSnapshot(
    input.catalogPath,
    'tnmAccessCatalogPath',
    MAX_TNM_ACCESS_CATALOG_BYTES,
  );
  const productId = input.productId.trim();
  if (!productId || productId.length > 160) {
    throw new Error('tnmAccessProductId must be a non-empty resolved product identifier.');
  }
  const matches = readTnmAccessCatalogItems(parsed).filter(item => {
    const candidate = item.sourceId ?? item.id ?? item.productId;
    return typeof candidate === 'string' && candidate === productId;
  });
  if (matches.length !== 1) {
    throw new Error('TNMAccess catalog snapshot must contain exactly one selected product.');
  }

  const selected = matches[0];
  const catalogAssetUrl = stringProperty(
    selected,
    ['downloadURL', 'downloadUrl', 'url'],
    'a public download URL',
  );
  if (
    normalizedUrl(catalogAssetUrl, 'TNMAccess download URL')
      !== normalizedUrl(input.sourceAssetUrl, 'sourceAssetUrl')
  ) {
    throw new Error('TNMAccess product download URL must match sourceAssetUrl exactly.');
  }
  const catalogMetadataReference = selected.metadataUrl
    ?? selected.metadataURL
    ?? selected.moreInfo;
  if (
    typeof catalogMetadataReference === 'string'
    && catalogMetadataReference.trim().startsWith('https://')
    && normalizedUrl(catalogMetadataReference, 'TNMAccess metadata URL')
      !== normalizedUrl(input.metadataUrl, 'metadataUrl')
  ) {
    throw new Error('TNMAccess product metadata URL must match metadataUrl exactly.');
  }
  return {
    productId,
    catalogResponseSha256: sha256(bytes),
  };
}

function readScienceBaseWebLinks(value: unknown) {
  if (!Array.isArray(value)) {
    throw new Error('ScienceBase item must contain webLinks.');
  }
  return value.filter(
    (item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item),
  );
}

function readXmlTagText(xml: string, tag: string) {
  const matches = [...xml.matchAll(new RegExp(
    `<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`,
    'gi',
  ))];
  if (matches.length !== 1) {
    throw new Error(`USGS product metadata must contain exactly one ${tag} element.`);
  }
  return matches[0][1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function hasXmlElement(xml: string, tag: string) {
  return new RegExp(`<${tag}(?:\\s[^>]*)?>`, 'i').test(xml);
}

function verifyNyc3depMetadataProjection(
  productMetadataText: string,
  horizontalCrs: Nyc3depSourceHorizontalCrs,
) {
  if (horizontalCrs === 'EPSG:4269') {
    if (!hasXmlElement(productMetadataText, 'geograph')) {
      throw new Error('USGS geographic 3DEP metadata must declare a geographic coordinate system.');
    }
    return;
  }
  try {
    if (
      readXmlTagText(productMetadataText, 'gridsysn')
        === 'Universal Transverse Mercator'
      && Number(readXmlTagText(productMetadataText, 'utmzone')) === 18
    ) {
      return;
    }
  } catch {
    // Missing or ambiguous FGDC projection fields are not promotable evidence.
  }
  {
    throw new Error('USGS NYC 1-meter metadata must declare Universal Transverse Mercator zone 18.');
  }
}

/**
 * Validates a separately retained ScienceBase item and FGDC product-metadata
 * response. The ledger keeps hashes and URLs only, never these raw snapshots.
 */
export function verifyScienceBaseProductEvidence(input: {
  scienceBaseMetadataPath: string;
  productMetadataXmlPath: string;
  productId: string;
  sourceAssetUrl: string;
  metadataUrl: string;
  horizontalCrs: Nyc3depSourceHorizontalCrs;
}): ScienceBaseProductEvidence {
  const { bytes: scienceBaseBytes, parsed } = readJsonSnapshot(
    input.scienceBaseMetadataPath,
    'scienceBaseMetadataPath',
    MAX_SCIENCEBASE_METADATA_BYTES,
  );
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('ScienceBase metadata snapshot must be a JSON object.');
  }
  const item = parsed as Record<string, unknown>;
  if (item.id !== input.productId) {
    throw new Error('ScienceBase item ID must match tnmAccessProductId.');
  }
  const selfUrl = item.link && typeof item.link === 'object'
    ? (item.link as Record<string, unknown>).url
    : undefined;
  if (
    typeof selfUrl !== 'string'
    || normalizedUrl(selfUrl, 'ScienceBase item URL')
      !== normalizedUrl(input.metadataUrl, 'metadataUrl')
  ) {
    throw new Error('ScienceBase item self URL must match metadataUrl exactly.');
  }
  const webLinks = readScienceBaseWebLinks(item.webLinks);
  const downloadLinks = webLinks.filter(link => link.type === 'download' && typeof link.uri === 'string');
  if (
    downloadLinks.length !== 1
    || normalizedUrl(downloadLinks[0].uri as string, 'ScienceBase download URL')
      !== normalizedUrl(input.sourceAssetUrl, 'sourceAssetUrl')
  ) {
    throw new Error('ScienceBase download URL must match sourceAssetUrl exactly.');
  }
  const productMetadataLinks = webLinks.filter(link =>
    link.type === 'originalMetadata'
    && typeof link.uri === 'string'
    && (link.title === 'Product Metadata' || String(link.uri).toLowerCase().endsWith('.xml')),
  );
  if (productMetadataLinks.length !== 1) {
    throw new Error('ScienceBase item must contain exactly one product metadata XML link.');
  }
  const productMetadataUrl = requireOfficialProductMetadataUrl(
    productMetadataLinks[0].uri as string,
  );

  const productMetadataPath = resolve(input.productMetadataXmlPath);
  if (extname(productMetadataPath).toLowerCase() !== '.xml') {
    throw new Error('productMetadataXmlPath must point to an XML response snapshot.');
  }
  const stat = statSync(productMetadataPath);
  if (!stat.isFile() || stat.size <= 0 || stat.size > MAX_USGS_PRODUCT_METADATA_BYTES) {
    throw new Error(
      `productMetadataXmlPath must be a non-empty XML file no larger than ${MAX_USGS_PRODUCT_METADATA_BYTES} bytes.`,
    );
  }
  const productMetadataBytes = Uint8Array.from(readFileSync(productMetadataPath));
  const productMetadataText = new TextDecoder().decode(productMetadataBytes);
  if (
    readXmlTagText(productMetadataText, 'horizdn') !== 'North American Datum of 1983'
    || readXmlTagText(productMetadataText, 'altdatum') !== 'North American Vertical Datum of 1988'
  ) {
    throw new Error('USGS product metadata must explicitly declare NAD83 and NAVD88.');
  }
  verifyNyc3depMetadataProjection(productMetadataText, input.horizontalCrs);
  return {
    itemResponseSha256: sha256(scienceBaseBytes),
    productMetadataUrl,
    productMetadataResponseSha256: sha256(productMetadataBytes),
  };
}

function readNad83GeoKey(
  geoKeys: Record<string, unknown>,
): Nyc3depSourceHorizontalCrs {
  const modelType = Number(geoKeys.GTModelTypeGeoKey);
  const geographicCode = Number(
    geoKeys.GeodeticCRSGeoKey ?? geoKeys.GeographicTypeGeoKey,
  );
  if (modelType === 2 && geographicCode === 4269) {
    return 'EPSG:4269';
  }
  const projectedCode = Number(
    geoKeys.ProjectedCRSGeoKey ?? geoKeys.ProjectedCSTypeGeoKey,
  );
  if (modelType === 1 && projectedCode === 26918) {
    return 'EPSG:26918';
  }
  throw new Error(
    'The NYC 3DEP intake accepts only EPSG:4269 (NAD83 geographic) or EPSG:26918 (NAD83 / UTM zone 18N).',
  );
}

/**
 * Inspects a locally retained bare-earth DEM without uploading or copying it.
 * Only the derived digest, cell count, and CRS declaration leave this function.
 */
export async function inspectNyc3depLocalGeoTiff(
  assetPath: string,
): Promise<Nyc3depLocalGeoTiffInspection> {
  const resolvedAssetPath = resolve(assetPath);
  const extension = extname(resolvedAssetPath).toLowerCase();
  if (extension !== '.tif' && extension !== '.tiff') {
    throw new Error('assetPath must point to a .tif or .tiff GeoTIFF file.');
  }

  const stat = statSync(resolvedAssetPath);
  if (!stat.isFile()) {
    throw new Error('assetPath must point to a regular local file.');
  }
  if (stat.size <= 0 || stat.size > MAX_GEOTIFF_BYTE_LENGTH) {
    throw new Error(
      `assetPath must contain a non-empty GeoTIFF no larger than ${MAX_GEOTIFF_BYTE_LENGTH} bytes.`,
    );
  }

  const bytes = Uint8Array.from(readFileSync(resolvedAssetPath));
  const geoTiff = await fromArrayBuffer(asArrayBuffer(bytes));
  const image = await geoTiff.getImage();
  const sourceHorizontalCrs = readNad83GeoKey(
    image.getGeoKeys() as Record<string, unknown>,
  );

  const width = image.getWidth();
  const height = image.getHeight();
  const recordOrCellCount = width * height;
  if (
    !Number.isSafeInteger(recordOrCellCount)
    || width < 2
    || height < 2
    || recordOrCellCount <= 0
  ) {
    throw new Error('The source GeoTIFF must contain a safe, non-trivial raster grid.');
  }

  return {
    contentSha256: sha256(bytes),
    byteLength: stat.size,
    recordOrCellCount,
    sourceHorizontalCrs,
  };
}

export async function createNyc3depLocalGeoTiffLedger(
  input: CreateNyc3depLocalLedgerInput,
): Promise<Nyc3depLocalLedgerResult> {
  const inspection = await inspectNyc3depLocalGeoTiff(input.assetPath);
  const hasCatalogPath = Boolean(input.tnmAccessCatalogPath);
  const hasProductId = Boolean(input.tnmAccessProductId);
  if (hasCatalogPath !== hasProductId) {
    throw new Error(
      'tnmAccessCatalogPath and tnmAccessProductId must be supplied together.',
    );
  }
  const tnmAccessCatalogEvidence = hasCatalogPath && hasProductId
    ? verifyTnmAccessCatalogSnapshot({
      catalogPath: input.tnmAccessCatalogPath!,
      productId: input.tnmAccessProductId!,
      sourceAssetUrl: input.sourceAssetUrl,
      metadataUrl: input.metadataUrl,
    })
    : null;
  const hasScienceBaseMetadata = Boolean(input.scienceBaseMetadataPath);
  const hasProductMetadataXml = Boolean(input.productMetadataXmlPath);
  if (hasScienceBaseMetadata !== hasProductMetadataXml) {
    throw new Error(
      'scienceBaseMetadataPath and productMetadataXmlPath must be supplied together.',
    );
  }
  if ((hasScienceBaseMetadata || hasProductMetadataXml) && !hasProductId) {
    throw new Error('ScienceBase evidence requires tnmAccessProductId.');
  }
  const scienceBaseProductEvidence = hasScienceBaseMetadata && hasProductMetadataXml
    ? verifyScienceBaseProductEvidence({
      scienceBaseMetadataPath: input.scienceBaseMetadataPath!,
      productMetadataXmlPath: input.productMetadataXmlPath!,
      productId: input.tnmAccessProductId!,
      sourceAssetUrl: input.sourceAssetUrl,
      metadataUrl: input.metadataUrl,
      horizontalCrs: inspection.sourceHorizontalCrs,
    })
    : null;
  const hasCogValidationReceipt = Boolean(input.cogValidationReceiptPath);
  const hasCogValidationRawReport = Boolean(input.cogValidationRawReportPath);
  if (hasCogValidationReceipt !== hasCogValidationRawReport) {
    throw new Error(
      'cogValidationReceiptPath and cogValidationRawReportPath must be supplied together.',
    );
  }
  const cogValidationEvidence = hasCogValidationReceipt
    ? verifyNyc3depCogValidationReceipt({
      receiptPath: input.cogValidationReceiptPath,
      rawReportPath: input.cogValidationRawReportPath!,
      expectedContentSha256: inspection.contentSha256,
      expectedByteLength: inspection.byteLength,
    })
    : null;
  const ledger = createNyc3depSourceLedger({
    sourceAssetUrl: input.sourceAssetUrl,
    metadataUrl: input.metadataUrl,
    versionId: input.versionId,
    publishedAt: input.publishedAt,
    retrievedAt: input.retrievedAt,
    verifiedAt: input.verifiedAt,
    contentSha256: inspection.contentSha256,
    recordOrCellCount: inspection.recordOrCellCount,
    horizontalCrs: inspection.sourceHorizontalCrs,
    verticalDatum: 'NAVD88',
    productProfile: input.productProfile,
  });
  return {
    inspection,
    ledger: tnmAccessCatalogEvidence || scienceBaseProductEvidence || cogValidationEvidence
      ? {
        ...ledger,
        records: ledger.records.map(record => ({
          ...record,
          ...(cogValidationEvidence ? {
            snapshotEvidence: {
              ...record.snapshotEvidence!,
              relatedArtifactSha256: [...new Set([
                ...(record.snapshotEvidence?.relatedArtifactSha256 ?? []),
                cogValidationEvidence.receiptSha256,
              ])],
            },
          } : {}),
          notes: [
            ...(record.notes ?? []),
            ...(tnmAccessCatalogEvidence ? [
              `TNMAccess product: ${tnmAccessCatalogEvidence.productId}.`,
              `TNMAccess response SHA-256: ${tnmAccessCatalogEvidence.catalogResponseSha256}.`,
              'The catalog response is retained separately and is not embedded in this ledger.',
            ] : []),
            ...(scienceBaseProductEvidence ? [
              `ScienceBase response SHA-256: ${scienceBaseProductEvidence.itemResponseSha256}.`,
              `USGS product metadata: ${scienceBaseProductEvidence.productMetadataUrl}.`,
              `USGS product metadata SHA-256: ${scienceBaseProductEvidence.productMetadataResponseSha256}.`,
              'The ScienceBase and product-metadata responses are retained separately and are not embedded in this ledger.',
            ] : []),
            ...(cogValidationEvidence ? [
              `GDAL COG validation receipt SHA-256: ${cogValidationEvidence.receiptSha256}.`,
              `GDAL COG validator ${cogValidationEvidence.gdalVersion} full-check report SHA-256: ${cogValidationEvidence.rawReportSha256}.`,
              `GDAL COG validation time: ${cogValidationEvidence.validatedAt}.`,
              'The raw GDAL report is retained separately and is not embedded in this ledger.',
            ] : []),
          ],
        })),
      }
      : ledger,
    tnmAccessCatalogEvidence,
    scienceBaseProductEvidence,
    cogValidationEvidence,
  };
}

export function writeNyc3depLocalGeoTiffLedger(
  outputPath: string,
  result: Nyc3depLocalLedgerResult,
) {
  const resolvedOutputPath = resolve(outputPath);
  mkdirSync(dirname(resolvedOutputPath), { recursive: true });
  writeFileSync(
    resolvedOutputPath,
    `${JSON.stringify(result.ledger, null, 2)}\n`,
  );
  return resolvedOutputPath;
}

function requiredArgument(name: string) {
  const inline = process.argv.find(value => value.startsWith(`${name}=`));
  if (inline) return inline.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  if (!value || value.startsWith('--')) {
    throw new Error(`${name} is required.`);
  }
  return value;
}

function optionalArgument(name: string) {
  const inline = process.argv.find(value => value.startsWith(`${name}=`));
  if (inline) return inline.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  return value && !value.startsWith('--') ? value : undefined;
}

async function main() {
  const assetPath = resolve(requiredArgument('--asset'));
  const outputPath = resolve(requiredArgument('--output'));
  if (assetPath === outputPath) {
    throw new Error('--output must not overwrite the retained source asset.');
  }
  const result = await createNyc3depLocalGeoTiffLedger({
    assetPath,
    sourceAssetUrl: requiredArgument('--asset-url'),
    metadataUrl: requiredArgument('--metadata-url'),
    versionId: requiredArgument('--version-id'),
    publishedAt: requiredArgument('--published-at'),
    retrievedAt: requiredArgument('--retrieved-at'),
    verifiedAt: requiredArgument('--verified-at'),
    productProfile: optionalArgument('--product-profile') as Nyc3depSnapshotReceipt['productProfile'],
    tnmAccessCatalogPath: optionalArgument('--tnm-catalog'),
    tnmAccessProductId: optionalArgument('--tnm-product-id'),
    scienceBaseMetadataPath: optionalArgument('--sciencebase-metadata'),
    productMetadataXmlPath: optionalArgument('--product-metadata-xml'),
    cogValidationReceiptPath: optionalArgument('--cog-validation-receipt'),
    cogValidationRawReportPath: optionalArgument('--cog-validation-report'),
  });
  const writtenOutputPath = writeNyc3depLocalGeoTiffLedger(outputPath, result);
  console.log(JSON.stringify({
    cliVersion: NYC_3DEP_LOCAL_LEDGER_CLI_VERSION,
    outputPath: writtenOutputPath,
    contentSha256: result.inspection.contentSha256,
    byteLength: result.inspection.byteLength,
    recordOrCellCount: result.inspection.recordOrCellCount,
    sourceHorizontalCrs: result.inspection.sourceHorizontalCrs,
    verticalDatum: 'NAVD88',
    tnmAccessCatalogEvidence: result.tnmAccessCatalogEvidence,
    scienceBaseProductEvidence: result.scienceBaseProductEvidence,
    cogValidationEvidence: result.cogValidationEvidence,
    note: 'The raw GeoTIFF remains local and is not copied, uploaded, or included in the ledger.',
  }, null, 2));
}

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  void main().catch(error => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
