import { createHash } from 'node:crypto';
import {
  mkdirSync,
  writeFileSync,
} from 'node:fs';
import { basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import AdmZip from 'adm-zip';

import {
  buildAddressQlPublicPostalArtifacts,
  type AddressQlPublicPostalSource,
} from '../src/lib/addressQlPublicPostalData';
import { loadAddressQlRuntimeConfig } from '../src/lib/addressQlRuntimeConfig';

const MAX_ARCHIVE_BYTES = 16 * 1024 * 1024;
const DEFAULT_OUTPUT = '.agid-runtime/addressql/jp';

type Arguments = {
  outputDirectory: string;
  retrievedAt: string;
  validUntil: string;
};

const JAPAN_POST_SOURCE: AddressQlPublicPostalSource = {
  id: 'japan-post-utf-csv',
  role: 'official-primary',
  authority: 'Japan Post Co., Ltd.',
  sourceVersion: '2026-06-30',
  archiveUrl:
    'https://www.post.japanpost.jp/service/search/zipcode/download/utf/zip/utf_ken_all.zip',
  releaseUrl:
    'https://www.post.japanpost.jp/service/search/zipcode/download/utf-zip.html',
  termsUrl:
    'https://www.post.japanpost.jp/service/search/zipcode/download/readme.html',
  correctionUrl: 'https://www.post.japanpost.jp/question/faq/',
  reuseRights:
    'Japan Post states that it asserts no copyright in postal-code data and permits free redistribution.',
  coverageStatement:
    'Nationwide ordinary-address postal-code CSV; excludes delivery-point proof and is not the business-specific postcode file.',
  attribution: 'Japan Post Co., Ltd.',
};

const GEONAMES_SOURCE: AddressQlPublicPostalSource = {
  id: 'geonames-postal-jp',
  role: 'oss-cross-check',
  authority: 'GeoNames',
  sourceVersion: '2026-07-26',
  archiveUrl: 'https://download.geonames.org/export/zip/JP.zip',
  releaseUrl: 'https://download.geonames.org/export/zip/',
  termsUrl: 'https://download.geonames.org/export/zip/readme.txt',
  correctionUrl: 'https://forum.geonames.org/gforum/forums/show/7.page',
  reuseRights:
    'Creative Commons Attribution 4.0; GeoNames attribution is required.',
  coverageStatement:
    'Community postal/locality reference used only as a partial independent cross-check.',
  attribution: 'GeoNames (https://www.geonames.org/)',
};

function formatTimestamp(date: Date) {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function parseArguments(values: readonly string[]): Arguments {
  const now = new Date();
  const validUntil = new Date(now);
  validUntil.setUTCMonth(validUntil.getUTCMonth() + 6);
  const output: Arguments = {
    outputDirectory: DEFAULT_OUTPUT,
    retrievedAt: formatTimestamp(now),
    validUntil: formatTimestamp(validUntil),
  };
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!['--output', '--retrieved-at', '--valid-until'].includes(value)) {
      throw new Error(`unsupported argument: ${value}`);
    }
    const next = values[index + 1];
    if (!next) throw new Error(`${value} requires a value`);
    if (value === '--output') output.outputDirectory = next;
    if (value === '--retrieved-at') output.retrievedAt = next;
    if (value === '--valid-until') output.validUntil = next;
    index += 1;
  }
  return output;
}

async function downloadBounded(url: string) {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'AddressQL-public-postal-sync/1.0',
    },
    redirect: 'follow',
  });
  if (!response.ok) throw new Error(`download failed (${response.status}): ${url}`);
  const declaredLength = Number(response.headers.get('content-length') || 0);
  if (declaredLength > MAX_ARCHIVE_BYTES) {
    throw new Error(`archive exceeds ${MAX_ARCHIVE_BYTES} bytes: ${url}`);
  }
  const value = Buffer.from(await response.arrayBuffer());
  if (!value.length || value.length > MAX_ARCHIVE_BYTES) {
    throw new Error(`archive is empty or exceeds size limit: ${url}`);
  }
  const lastModified = response.headers.get('last-modified');
  if (!lastModified || Number.isNaN(new Date(lastModified).getTime())) {
    throw new Error(`archive has no valid Last-Modified version: ${url}`);
  }
  return {
    data: value,
    sourceVersion: new Date(lastModified).toISOString().slice(0, 10),
  };
}

function sha256(value: Buffer) {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`;
}

function textEntry(archive: Buffer, expectedName: string) {
  const entries = new AdmZip(archive)
    .getEntries()
    .filter(
      entry =>
        !entry.isDirectory
        && basename(entry.entryName).toLowerCase() === expectedName.toLowerCase(),
    );
  if (entries.length !== 1) {
    throw new Error(`archive must contain exactly one ${expectedName} file`);
  }
  const data = entries[0].getData();
  if (!data.length || data.length > 128 * 1024 * 1024) {
    throw new Error(`expanded ${expectedName} data is empty or too large`);
  }
  return data.toString('utf8').replace(/^\uFEFF/, '');
}

function writeJson(path: string, value: unknown) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export async function syncAddressQlPublicPostalData(
  args: Arguments,
  root = process.cwd(),
) {
  const outputDirectory = resolve(root, args.outputDirectory);
  const [japanPostDownload, geoNamesDownload] = await Promise.all([
    downloadBounded(JAPAN_POST_SOURCE.archiveUrl),
    downloadBounded(GEONAMES_SOURCE.archiveUrl),
  ]);
  const japanPostSource = {
    ...JAPAN_POST_SOURCE,
    sourceVersion: japanPostDownload.sourceVersion,
  };
  const geoNamesSource = {
    ...GEONAMES_SOURCE,
    sourceVersion: geoNamesDownload.sourceVersion,
  };
  const artifacts = buildAddressQlPublicPostalArtifacts({
    retrievedAt: args.retrievedAt,
    validUntil: args.validUntil,
    japanPostSource,
    japanPostArchiveDigest: sha256(japanPostDownload.data),
    japanPostCsv: textEntry(japanPostDownload.data, 'utf_ken_all.csv'),
    geoNamesSource,
    geoNamesArchiveDigest: sha256(geoNamesDownload.data),
    geoNamesTsv: textEntry(geoNamesDownload.data, 'JP.txt'),
  });

  mkdirSync(outputDirectory, { recursive: true });
  writeFileSync(
    resolve(outputDirectory, 'japan-post.postcodes.txt'),
    `${artifacts.japanPostPostalCodes.join('\n')}\n`,
    'utf8',
  );
  writeFileSync(
    resolve(outputDirectory, 'geonames-jp.postcodes.txt'),
    `${artifacts.geoNamesPostalCodes.join('\n')}\n`,
    'utf8',
  );
  writeJson(resolve(outputDirectory, 'holdout-policy.json'), artifacts.holdoutPolicy);
  writeJson(resolve(outputDirectory, 'quality-report.json'), artifacts.qualityReport);
  writeJson(resolve(outputDirectory, 'source-ledger.json'), artifacts.sourceLedger);
  writeJson(resolve(outputDirectory, 'runtime-config.json'), artifacts.runtimeConfig);
  writeJson(resolve(outputDirectory, 'trust-store.json'), artifacts.trustStore);

  const loaded = loadAddressQlRuntimeConfig({
    configPath: resolve(outputDirectory, 'runtime-config.json'),
    trustStorePath: resolve(outputDirectory, 'trust-store.json'),
    allowConformanceAdapters: true,
    now: args.retrievedAt,
  });
  return {
    status: 'ok' as const,
    version: 'addressql-public-postal-sync-v1',
    outputDirectory,
    files: [
      'geonames-jp.postcodes.txt',
      'holdout-policy.json',
      'japan-post.postcodes.txt',
      'quality-report.json',
      'runtime-config.json',
      'source-ledger.json',
      'trust-store.json',
    ],
    sources: [
      {
        id: JAPAN_POST_SOURCE.id,
        archive: basename(JAPAN_POST_SOURCE.archiveUrl),
        rowCount: artifacts.japanPostPostalCodes.length,
        datasetDigest:
          artifacts.runtimeConfig.adapters[0].evidence.datasetDigest,
      },
      {
        id: GEONAMES_SOURCE.id,
        archive: basename(GEONAMES_SOURCE.archiveUrl),
        rowCount: artifacts.geoNamesPostalCodes.length,
        datasetDigest:
          artifacts.runtimeConfig.adapters[1].evidence.datasetDigest,
      },
    ],
    runtime: loaded.diagnostics,
    trust: {
      trustedPublicKeyCount: 0,
      approvedActivation: 'blocked',
      conformanceActivation: 'ready-with-explicit-opt-in',
    },
    privacy: {
      rawArchivesPersisted: false,
      containsRawAddress: false,
      containsRecipientData: false,
      containsCoordinates: false,
      printsPostalCodes: false,
    },
  };
}

async function run() {
  const args = parseArguments(process.argv.slice(2));
  console.log(JSON.stringify(
    await syncAddressQlPublicPostalData(args),
    null,
    2,
  ));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  await run();
}
