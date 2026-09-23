import { createHash } from 'node:crypto';
import {
  mkdirSync,
  writeFileSync,
} from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import AdmZip from 'adm-zip';

import {
  buildAddressQlOfficialPostalArtifacts,
  extractDenmarkOfficialPostalCodes,
  extractFinlandPostiPostalCodes,
  extractLaPosteOfficialPostalScopes,
  extractOnsOfficialPostalScopes,
  extractSwissOfficialPostalScopes,
  type AddressQlOfficialPostalCountryInput,
  type AddressQlOfficialPostalSource,
} from '../src/lib/addressQlOfficialPostalData';
import { loadAddressQlRuntimeConfig } from '../src/lib/addressQlRuntimeConfig';

const DEFAULT_OUTPUT = '.agid-runtime/addressql/official-postal';
const MAX_DOWNLOAD_BYTES = 32 * 1024 * 1024;
const MAX_EXPANDED_BYTES = 16 * 1024 * 1024;
const MAX_JSON_ROWS = 100_000;
const SOURCE_IDS = [
  'laposte',
  'swisstopo',
  'posti',
  'dataforsyningen',
  'ons',
] as const;
const ONS_MAX_ROWS = 2_000_000;
const ONS_PAGE_SIZE = 32_000;

type SourceId = typeof SOURCE_IDS[number];

type Arguments = {
  outputDirectory: string;
  retrievedAt: string;
  validUntil: string;
  sources: Set<SourceId>;
};

type SourceSyncResult = {
  sourceId: SourceId;
  countries: AddressQlOfficialPostalCountryInput[];
};

function formatTimestamp(date: Date) {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function parseArguments(values: readonly string[]): Arguments {
  const now = new Date();
  const validUntil = new Date(now);
  validUntil.setUTCDate(validUntil.getUTCDate() + 90);
  const output: Arguments = {
    outputDirectory: DEFAULT_OUTPUT,
    retrievedAt: formatTimestamp(now),
    validUntil: formatTimestamp(validUntil),
    sources: new Set(SOURCE_IDS),
  };
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!['--output', '--retrieved-at', '--valid-until', '--sources'].includes(value)) {
      throw new Error(`unsupported argument: ${value}`);
    }
    const next = values[index + 1];
    if (!next) throw new Error(`${value} requires a value`);
    if (value === '--output') output.outputDirectory = next;
    if (value === '--retrieved-at') output.retrievedAt = next;
    if (value === '--valid-until') output.validUntil = next;
    if (value === '--sources') {
      const sources = next
        .split(',')
        .map(item => item.trim().toLowerCase())
        .filter(Boolean);
      if (!sources.length || sources.some(item => !SOURCE_IDS.includes(item as SourceId))) {
        throw new Error(`--sources must contain only ${SOURCE_IDS.join(',')}`);
      }
      output.sources = new Set(sources as SourceId[]);
    }
    index += 1;
  }
  return output;
}

function sha256(value: string | Buffer) {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`;
}

async function downloadBounded(url: string, maxBytes = MAX_DOWNLOAD_BYTES) {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'AddressQL-official-postal-sync/1.0',
    },
    redirect: 'follow',
  });
  if (!response.ok) throw new Error(`download failed (${response.status}): ${url}`);
  const declaredLength = Number(response.headers.get('content-length') || 0);
  if (declaredLength > maxBytes) {
    throw new Error(`download exceeds ${maxBytes} bytes: ${url}`);
  }
  const data = Buffer.from(await response.arrayBuffer());
  if (!data.length || data.length > maxBytes) {
    throw new Error(`download is empty or exceeds ${maxBytes} bytes: ${url}`);
  }
  return {
    data,
    finalUrl: response.url,
    headers: response.headers,
  };
}

function exactJson(value: Buffer, label: string) {
  try {
    return JSON.parse(value.toString('utf8')) as unknown;
  } catch (error) {
    throw new Error(`${label} is invalid JSON: ${(error as Error).message}`);
  }
}

function object(value: unknown, label: string) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function source(
  retrievedAt: string,
  value: Omit<AddressQlOfficialPostalSource, 'reuseVerifiedAt'>,
): AddressQlOfficialPostalSource {
  return {
    ...value,
    reuseVerifiedAt: retrievedAt,
  };
}

const FRENCH_SCOPE_LABELS: Record<string, string> = {
  FR: 'France parent postal scope',
  GP: 'Guadeloupe shipping scope',
  MQ: 'Martinique shipping scope',
  GF: 'French Guiana shipping scope',
  RE: 'Reunion shipping scope',
  PM: 'Saint Pierre and Miquelon shipping scope',
  YT: 'Mayotte shipping scope',
  BL: 'Saint Barthelemy shipping scope',
  MF: 'Saint Martin (French part) shipping scope',
  WF: 'Wallis and Futuna shipping scope',
  PF: 'French Polynesia shipping scope',
  NC: 'New Caledonia shipping scope',
  MC: 'Monaco sovereign postal scope',
};

function frenchScopePolicy(countryCode: string) {
  if (countryCode === 'FR') {
    return (
      'FR is an inclusive parent scope for all non-Monaco rows in the official La Poste base; '
      + 'explicit ISO territory adapters are also emitted for shipping-system compatibility.'
    );
  }
  if (countryCode === 'MC') {
    return 'Monaco is separated from FR using La Poste commune code 99138.';
  }
  return (
    `${countryCode} is an explicit neutral shipping scope derived from its official INSEE `
    + 'territory prefix; the same codes remain in the inclusive FR parent scope.'
  );
}

async function syncLaPoste(args: Arguments): Promise<SourceSyncResult> {
  const datasetUrl =
    'https://data.laposte.fr/data-fair/api/v1/datasets/laposte-hexasmal';
  const metadataDownload = await downloadBounded(datasetUrl, 2 * 1024 * 1024);
  const metadata = object(exactJson(metadataDownload.data, 'La Poste metadata'), 'La Poste metadata');
  const count = metadata.count;
  if (!Number.isInteger(count) || Number(count) <= 0 || Number(count) > MAX_JSON_ROWS) {
    throw new Error('La Poste metadata has an invalid row count');
  }
  const rawVersion = metadata.dataUpdatedAt ?? metadata.updatedAt;
  if (typeof rawVersion !== 'string' || Number.isNaN(new Date(rawVersion).getTime())) {
    throw new Error('La Poste metadata has no usable data version');
  }
  const sourceVersion = new Date(rawVersion).toISOString();
  const rows: unknown[] = [];
  let next: string | null =
    `${datasetUrl}/lines?size=10000&select=code_postal,code_commune_insee`;
  let pageCount = 0;
  while (next) {
    if (pageCount >= 20) throw new Error('La Poste pagination exceeds page limit');
    const url = new URL(next);
    if (url.protocol !== 'https:' || url.hostname !== 'data.laposte.fr') {
      throw new Error('La Poste pagination left the official HTTPS origin');
    }
    const pageDownload = await downloadBounded(url.href, 8 * 1024 * 1024);
    const page = object(exactJson(pageDownload.data, 'La Poste page'), 'La Poste page');
    if (!Array.isArray(page.results)) throw new Error('La Poste page has no results array');
    rows.push(...page.results);
    if (rows.length > MAX_JSON_ROWS) throw new Error('La Poste rows exceed limit');
    next = page.next === undefined || page.next === null
      ? null
      : typeof page.next === 'string'
        ? page.next
        : (() => {
          throw new Error('La Poste page next link is invalid');
        })();
    pageCount += 1;
  }
  if (rows.length !== Number(count)) {
    throw new Error(`La Poste row count mismatch: expected ${count}, received ${rows.length}`);
  }

  const scopes = extractLaPosteOfficialPostalScopes(rows);
  const officialSource = source(args.retrievedAt, {
    id: 'la-poste-hexasmal',
    authority: 'La Poste',
    sourceVersion,
    snapshotUrl:
      `${datasetUrl}/lines?size=10000&select=code_postal,code_commune_insee`,
    releaseUrl: datasetUrl,
    termsUrl: 'https://www.etalab.gouv.fr/licence-ouverte-open-licence',
    correctionUrl: 'https://data.laposte.fr/pages/contact/',
    reuseRights:
      'Licence Ouverte / Open Licence; reuse and redistribution are permitted with source attribution.',
    coverageStatement:
      'Official commune-to-postcode base for metropolitan France, overseas departments and collectivities, and Monaco; CEDEX and delivery-point proof are outside this adapter.',
    attribution: 'La Poste - Base officielle des codes postaux',
    updatePolicy: 'Dataset metadata and selected fields are retrieved on each sync.',
    coverage: 'partial',
  });
  const snapshotDigest = sha256(JSON.stringify(rows));
  return {
    sourceId: 'laposte',
    countries: Object.entries(scopes).map(([countryCode, postalCodes]) => ({
      countryCode,
      scopeLabel: FRENCH_SCOPE_LABELS[countryCode] ?? `${countryCode} shipping scope`,
      scopePolicy: frenchScopePolicy(countryCode),
      source: officialSource,
      sourceSnapshotDigest: snapshotDigest,
      postalCodes,
    })),
  };
}

async function syncSwisstopo(args: Arguments): Promise<SourceSyncResult> {
  const stacUrl =
    'https://data.geo.admin.ch/api/stac/v0.9/collections/ch.swisstopo-vd.ortschaftenverzeichnis_plz/items?limit=10';
  const stacDownload = await downloadBounded(stacUrl, 2 * 1024 * 1024);
  const stac = object(exactJson(stacDownload.data, 'swisstopo STAC'), 'swisstopo STAC');
  if (!Array.isArray(stac.features) || stac.features.length !== 1) {
    throw new Error('swisstopo STAC must contain exactly one current item');
  }
  const feature = object(stac.features[0], 'swisstopo STAC item');
  const properties = object(feature.properties, 'swisstopo STAC properties');
  const assets = object(feature.assets, 'swisstopo STAC assets');
  const csvAsset = object(
    assets['ortschaftenverzeichnis_plz_4326.csv.zip'],
    'swisstopo WGS84 CSV asset',
  );
  if (
    typeof properties.datetime !== 'string'
    || Number.isNaN(new Date(properties.datetime).getTime())
    || typeof csvAsset.href !== 'string'
  ) {
    throw new Error('swisstopo STAC item has invalid version or asset metadata');
  }
  const archive = await downloadBounded(csvAsset.href);
  const entries = new AdmZip(archive.data)
    .getEntries()
    .filter(entry => !entry.isDirectory && entry.entryName.toLowerCase().endsWith('.csv'));
  if (entries.length !== 1) throw new Error('swisstopo archive must contain one CSV file');
  const csvData = entries[0].getData();
  if (!csvData.length || csvData.length > MAX_EXPANDED_BYTES) {
    throw new Error('swisstopo expanded CSV is empty or too large');
  }
  const scopes = extractSwissOfficialPostalScopes(csvData.toString('utf8'));
  const officialSource = source(args.retrievedAt, {
    id: 'swisstopo-ortschaftenverzeichnis',
    authority: 'Federal Office of Topography swisstopo',
    sourceVersion: new Date(properties.datetime).toISOString(),
    snapshotUrl: csvAsset.href,
    releaseUrl:
      'https://www.swisstopo.admin.ch/en/official-directory-of-towns-and-cities',
    termsUrl:
      'https://www.swisstopo.admin.ch/en/terms-of-use-free-geodata-and-geoservices',
    correctionUrl:
      'https://www.swisstopo.admin.ch/en/official-directory-of-towns-and-cities',
    reuseRights:
      'Free swisstopo OGD may be used, distributed, processed, made accessible, and used commercially with source attribution.',
    coverageStatement:
      'Official domicile-address locality postcodes for Switzerland and Liechtenstein; company, professional, internal, and other administrative postcode types are excluded.',
    attribution: 'Federal Office of Topography swisstopo',
    updatePolicy: 'A new official directory is published on the first day of each month.',
    coverage: 'partial',
  });
  const snapshotDigest = sha256(archive.data);
  return {
    sourceId: 'swisstopo',
    countries: [
      {
        countryCode: 'CH',
        scopeLabel: 'Switzerland domicile-address postal scope',
        scopePolicy:
          'CH contains rows with a Swiss canton code and excludes Liechtenstein municipality codes.',
        source: officialSource,
        sourceSnapshotDigest: snapshotDigest,
        postalCodes: scopes.CH,
      },
      {
        countryCode: 'LI',
        scopeLabel: 'Liechtenstein domicile-address postal scope',
        scopePolicy:
          'LI contains rows with an empty canton and an official Liechtenstein 70xx municipality code.',
        source: officialSource,
        sourceSnapshotDigest: snapshotDigest,
        postalCodes: scopes.LI,
      },
    ],
  };
}

async function syncPosti(args: Arguments): Promise<SourceSyncResult> {
  const releaseUrl = 'https://www.posti.fi/webpcode/';
  const indexDownload = await downloadBounded(releaseUrl, 4 * 1024 * 1024);
  const fileNames = [
    ...new Set(
      [...indexDownload.data.toString('utf8').matchAll(/PCF_\d{8}\.zip/g)]
        .map(match => match[0]),
    ),
  ].sort().reverse();
  if (!fileNames.length) throw new Error('Posti index contains no PCF archive');
  const archiveUrl = new URL(fileNames[0], releaseUrl).href;
  const archive = await downloadBounded(archiveUrl);
  const entries = new AdmZip(archive.data)
    .getEntries()
    .filter(entry => !entry.isDirectory && /^PCF_\d{8}\.dat$/i.test(entry.entryName));
  if (entries.length !== 1) throw new Error('Posti archive must contain one PCF data file');
  const fixedWidthData = entries[0].getData();
  if (!fixedWidthData.length || fixedWidthData.length > MAX_EXPANDED_BYTES) {
    throw new Error('Posti expanded PCF data is empty or too large');
  }
  const postalCodes = extractFinlandPostiPostalCodes(
    new TextDecoder('windows-1252').decode(fixedWidthData),
  );
  const alandPostalCodes = postalCodes.filter(postcode => /^22\d{3}$/.test(postcode));
  if (!alandPostalCodes.length) throw new Error('Posti PCF contains no Aland postcode scope');
  const date = fileNames[0].match(/\d{8}/)?.[0];
  if (!date) throw new Error('Posti PCF filename has no source version');
  const sourceVersion = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
  const officialSource = source(args.retrievedAt, {
    id: 'posti-pcf',
    authority: 'Posti Group Oyj',
    sourceVersion,
    snapshotUrl: archiveUrl,
    releaseUrl,
    termsUrl:
      'https://www.posti.fi/mzj3zpe8qb7p/1eKbwM2WAEY5AuGi5TrSZ7/c76a865cf5feb2c527a114b8615e9580/posti-postal-code-services-service-description-and-terms-of-use-20150101.pdf',
    correctionUrl:
      'https://www.posti.fi/en/for-businesses/customer-support/postal-code-services',
    reuseRights:
      'The files are freely downloadable and may be disclosed to third parties when the current terms and download date accompany the material.',
    coverageStatement:
      'Current public Finnish postal codes from the official PCF; Aland is included at postcode level.',
    attribution: 'Posti Group Oyj - Postal Code Services',
    updatePolicy: 'The Postal Code Data File is updated daily except Sundays.',
    coverage: 'complete',
  });
  const snapshotDigest = sha256(archive.data);
  return {
    sourceId: 'posti',
    countries: [
      {
        countryCode: 'FI',
        scopeLabel: 'Finland inclusive public-postcode scope',
        scopePolicy:
          'FI includes all current PCF public postcodes, including Aland at postcode level.',
        source: officialSource,
        sourceSnapshotDigest: snapshotDigest,
        postalCodes,
      },
      {
        countryCode: 'AX',
        scopeLabel: 'Aland explicit shipping scope',
        scopePolicy:
          'AX is the explicit ISO shipping alias for PCF postcodes in the documented 22xxx Aland range; the same codes remain in FI.',
        source: officialSource,
        sourceSnapshotDigest: snapshotDigest,
        postalCodes: alandPostalCodes,
      },
    ],
  };
}

async function syncDataforsyningen(args: Arguments): Promise<SourceSyncResult> {
  const snapshotUrl =
    'https://api.dataforsyningen.dk/postnumre?struktur=flad';
  const download = await downloadBounded(snapshotUrl, 4 * 1024 * 1024);
  const postalCodes = extractDenmarkOfficialPostalCodes(download.data.toString('utf8'));
  const snapshotDigest = sha256(download.data);
  const officialSource = source(args.retrievedAt, {
    id: 'dataforsyningen-postnumre',
    authority: 'Danish Agency for Climate Data',
    sourceVersion:
      `snapshot-${args.retrievedAt.slice(0, 10)}-${snapshotDigest.slice(7, 19)}`,
    snapshotUrl,
    releaseUrl: 'https://docs.dataforsyningen.dk/',
    termsUrl:
      'https://dataforsyningen.dk/asset/PDF/rettigheder_vilkaar/Vilk%C3%A5r%20for%20brug%20af%20frie%20geografiske%20data.pdf',
    correctionUrl: 'https://dataforsyningen.dk/kontakt',
    reuseRights:
      'Public geographic data are reusable under Dataforsyningen free geographic data terms with required source acknowledgement.',
    coverageStatement:
      'Postcodes registered in Denmark Administrative Geographic Divisions; special large-recipient and non-geographic codes are outside the negative-claim boundary.',
    attribution: 'Dataforsyningen / Danish Agency for Climate Data',
    updatePolicy: 'The public API is snapshotted and content-addressed on each sync.',
    coverage: 'partial',
  });
  return {
    sourceId: 'dataforsyningen',
    countries: [
      {
        countryCode: 'DK',
        scopeLabel: 'Denmark registered postal-geography scope',
        scopePolicy:
          'DK contains only four-digit postcodes returned by the official postnumre API.',
        source: officialSource,
        sourceSnapshotDigest: snapshotDigest,
        postalCodes,
      },
    ],
  };
}

function onsLayerVersion(metadata: Record<string, unknown>) {
  const editingInfo = object(metadata.editingInfo, 'ONS layer editingInfo');
  const dataLastEditDate = editingInfo.dataLastEditDate;
  if (
    typeof dataLastEditDate !== 'number'
    || !Number.isFinite(dataLastEditDate)
    || dataLastEditDate <= 0
  ) {
    throw new Error('ONS layer has no usable data version');
  }
  return new Date(dataLastEditDate).toISOString();
}

async function syncOns(args: Arguments): Promise<SourceSyncResult> {
  const layerUrl =
    'https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/'
    + 'ONSPD_Online_latest_Postcode_Centroids/FeatureServer/0';
  const metadataDownload = await downloadBounded(
    `${layerUrl}?f=json`,
    2 * 1024 * 1024,
  );
  const metadata = object(
    exactJson(metadataDownload.data, 'ONS layer metadata'),
    'ONS layer metadata',
  );
  const sourceVersion = onsLayerVersion(metadata);
  if (
    metadata.objectIdField !== 'OBJECTID'
    || object(
      metadata.advancedQueryCapabilities,
      'ONS advanced query capabilities',
    ).supportsPagination !== true
  ) {
    throw new Error('ONS layer does not expose the required stable pagination contract');
  }

  const countParameters = new URLSearchParams({
    where: 'DOTERM IS NULL',
    returnCountOnly: 'true',
    f: 'json',
  });
  const countDownload = await downloadBounded(
    `${layerUrl}/query?${countParameters}`,
    1024 * 1024,
  );
  const countResponse = object(
    exactJson(countDownload.data, 'ONS live postcode count'),
    'ONS live postcode count',
  );
  const expectedCount = countResponse.count;
  if (
    !Number.isInteger(expectedCount)
    || Number(expectedCount) <= 0
    || Number(expectedCount) > ONS_MAX_ROWS
  ) {
    throw new Error(
      `ONS live postcode count is outside the bounded range: ${JSON.stringify(countResponse)}`,
    );
  }

  const scopes = {
    GB: new Set<string>(),
    IM: new Set<string>(),
    JE: new Set<string>(),
    GG: new Set<string>(),
  };
  let excludedNorthernIrelandCount = 0;
  let receivedCount = 0;
  let lastObjectId = 0;
  const snapshotHasher = createHash('sha256');
  while (receivedCount < Number(expectedCount)) {
    const pageParameters = new URLSearchParams({
      where:
        lastObjectId === 0
          ? 'DOTERM IS NULL'
          : `DOTERM IS NULL AND OBJECTID > ${lastObjectId}`,
      outFields: 'OBJECTID,PCDS,DOTERM',
      returnGeometry: 'false',
      orderByFields: 'OBJECTID',
      resultRecordCount: String(ONS_PAGE_SIZE),
      f: 'json',
    });
    const pageDownload = await downloadBounded(
      `${layerUrl}/query?${pageParameters}`,
      8 * 1024 * 1024,
    );
    const page = object(
      exactJson(pageDownload.data, `ONS postcode page after ${lastObjectId}`),
      `ONS postcode page after ${lastObjectId}`,
    );
    if (page.error !== undefined) {
      throw new Error(
        `ONS postcode query failed after ${lastObjectId}: ${JSON.stringify(page.error)}`,
      );
    }
    if (!Array.isArray(page.features) || !page.features.length) {
      throw new Error(`ONS postcode page after ${lastObjectId} has no features`);
    }
    const pageScopes = extractOnsOfficialPostalScopes(page.features);
    for (const countryCode of ['GB', 'IM', 'JE', 'GG'] as const) {
      for (const postcode of pageScopes[countryCode]) {
        scopes[countryCode].add(postcode);
      }
    }
    excludedNorthernIrelandCount += pageScopes.excludedNorthernIrelandCount;
    receivedCount += page.features.length;
    const finalFeature = object(
      page.features.at(-1),
      `ONS final feature after ${lastObjectId}`,
    );
    const finalAttributes = object(
      finalFeature.attributes,
      `ONS final feature attributes after ${lastObjectId}`,
    );
    const nextObjectId = finalAttributes.OBJECTID;
    if (
      !Number.isInteger(nextObjectId)
      || Number(nextObjectId) <= lastObjectId
    ) {
      throw new Error('ONS OBJECTID pagination did not advance monotonically');
    }
    lastObjectId = Number(nextObjectId);
    snapshotHasher.update(pageDownload.data);
    snapshotHasher.update('\n');
  }
  if (receivedCount !== Number(expectedCount)) {
    throw new Error(
      `ONS live postcode count mismatch: expected ${expectedCount}, received ${receivedCount}`,
    );
  }
  if (Object.values(scopes).some(values => values.size === 0)) {
    throw new Error('ONS live postcode response is missing an expected non-BT scope');
  }
  if (excludedNorthernIrelandCount === 0) {
    throw new Error('ONS licensing guard expected Northern Ireland rows to be excluded');
  }

  const finalMetadataDownload = await downloadBounded(
    `${layerUrl}?f=json`,
    2 * 1024 * 1024,
  );
  const finalMetadata = object(
    exactJson(finalMetadataDownload.data, 'ONS final layer metadata'),
    'ONS final layer metadata',
  );
  if (onsLayerVersion(finalMetadata) !== sourceVersion) {
    throw new Error('ONS latest layer changed during sync; retry against one stable version');
  }

  const year = args.retrievedAt.slice(0, 4);
  const officialSource = source(args.retrievedAt, {
    id: 'ons-ons-postcode-directory',
    authority: 'Office for National Statistics',
    sourceVersion,
    snapshotUrl:
      `${layerUrl}/query?where=DOTERM%20IS%20NULL&outFields=OBJECTID%2CPCDS%2CDOTERM`
      + '&returnGeometry=false&orderByFields=OBJECTID&f=json',
    releaseUrl:
      'https://www.ons.gov.uk/methodology/geography/geographicalproducts/postcodeproducts',
    termsUrl: 'https://www.ons.gov.uk/methodology/geography/licences',
    correctionUrl: 'https://www.ons.gov.uk/aboutus/contactus',
    reuseRights:
      'ONS postcode products excluding Northern Ireland are reusable under the Open '
      + 'Government Licence v3.0 with the required ONS, OS, and Royal Mail attributions.',
    coverageStatement:
      'Live ONSPD postcodes for Great Britain, Isle of Man, Jersey, and Guernsey. '
      + `Northern Ireland (${excludedNorthernIrelandCount} BT rows) is excluded because `
      + 'commercial reuse requires a separate Land and Property Services licence.',
    attribution:
      `Contains OS data \u00A9 Crown copyright and database right ${year}; `
      + `Contains Royal Mail data \u00A9 Royal Mail copyright and database right ${year}; `
      + 'Source: Office for National Statistics licensed under the Open Government Licence v3.0',
    updatePolicy:
      'ONS postcode products are released quarterly; the mutable latest API is accepted only '
      + 'when its data version remains unchanged for the entire field-limited sync.',
    coverage: 'partial',
  });
  const snapshotDigest = `sha256:${snapshotHasher.digest('hex')}`;
  const scopeLabels = {
    GB: 'Great Britain live postcode scope excluding Northern Ireland',
    IM: 'Isle of Man live postcode scope',
    JE: 'Jersey live postcode scope',
    GG: 'Guernsey live postcode scope',
  };
  const scopePolicies = {
    GB:
      'GB contains live non-BT, non-IM, non-JE, and non-GY ONSPD rows. '
      + 'BT Northern Ireland rows remain blocked by their separate commercial licence.',
    IM: 'IM contains live ONSPD rows whose outward code begins IM.',
    JE: 'JE contains live ONSPD rows whose outward code begins JE.',
    GG: 'GG contains live ONSPD rows whose outward code begins GY.',
  };
  return {
    sourceId: 'ons',
    countries: (['GB', 'IM', 'JE', 'GG'] as const).map(countryCode => ({
      countryCode,
      scopeLabel: scopeLabels[countryCode],
      scopePolicy: scopePolicies[countryCode],
      source: officialSource,
      sourceSnapshotDigest: snapshotDigest,
      postalCodes: [...scopes[countryCode]].sort(),
    })),
  };
}

const SOURCE_SYNCS: Record<SourceId, (args: Arguments) => Promise<SourceSyncResult>> = {
  laposte: syncLaPoste,
  swisstopo: syncSwisstopo,
  posti: syncPosti,
  dataforsyningen: syncDataforsyningen,
  ons: syncOns,
};

function writeJson(path: string, value: unknown) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export async function syncAddressQlOfficialPostalData(
  args: Arguments,
  root = process.cwd(),
) {
  const selectedSources = SOURCE_IDS.filter(sourceId => args.sources.has(sourceId));
  const settled = await Promise.allSettled(
    selectedSources.map(sourceId => SOURCE_SYNCS[sourceId](args)),
  );
  const failures: Array<{ sourceId: SourceId; error: string }> = [];
  const countries: AddressQlOfficialPostalCountryInput[] = [];
  for (const [index, result] of settled.entries()) {
    const sourceId = selectedSources[index];
    if (result.status === 'fulfilled') {
      countries.push(...result.value.countries);
    } else {
      failures.push({
        sourceId,
        error: result.reason instanceof Error ? result.reason.message : String(result.reason),
      });
    }
  }
  if (!countries.length) {
    throw new Error(`all official postal sources failed: ${JSON.stringify(failures)}`);
  }

  const artifacts = buildAddressQlOfficialPostalArtifacts({
    retrievedAt: args.retrievedAt,
    validUntil: args.validUntil,
    countries,
  });
  const outputDirectory = resolve(root, args.outputDirectory);
  for (const [countryCode, country] of Object.entries(artifacts.countries)) {
    const postcodePath = resolve(outputDirectory, country.postcodeFile);
    mkdirSync(dirname(postcodePath), { recursive: true });
    writeFileSync(postcodePath, `${country.postalCodes.join('\n')}\n`, 'utf8');
    const countryDirectory = dirname(postcodePath);
    writeJson(resolve(countryDirectory, 'holdout-policy.json'), country.holdoutPolicy);
    writeJson(resolve(countryDirectory, 'quality-report.json'), country.qualityReport);
  }
  writeJson(resolve(outputDirectory, 'source-ledger.json'), artifacts.sourceLedger);
  writeJson(resolve(outputDirectory, 'runtime-config.json'), artifacts.runtimeConfig);
  writeJson(resolve(outputDirectory, 'trust-store.json'), artifacts.trustStore);

  const loaded = loadAddressQlRuntimeConfig({
    configPath: resolve(outputDirectory, 'runtime-config.json'),
    trustStorePath: resolve(outputDirectory, 'trust-store.json'),
    allowConformanceAdapters: true,
    now: args.retrievedAt,
  });
  const countryCodes = Object.keys(artifacts.countries).sort();
  return {
    status: failures.length ? 'partial' as const : 'ok' as const,
    version: 'addressql-official-postal-sync-v1',
    outputDirectory,
    selectedSources,
    successfulSourceCount: selectedSources.length - failures.length,
    failedSourceCount: failures.length,
    failures,
    countryScopeCount: countryCodes.length,
    countryCodes,
    runtime: loaded.diagnostics,
    trust: {
      trustedPublicKeyCount: 0,
      approvedActivation: 'blocked',
      conformanceActivation: 'ready-with-explicit-opt-in',
      requiredIndependentReviewerCount: 2,
    },
    privacy: {
      rawSnapshotsPersisted: false,
      derivedDataContainsPostcodesOnly: true,
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
    await syncAddressQlOfficialPostalData(args),
    null,
    2,
  ));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  await run();
}
