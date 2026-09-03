import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const inputDir = process.argv[2] ?? '.tmp-ea';
const outputPath = process.argv[3] ?? 'reports/postal-context-m2/ea-source-review-2026-09-03.json';
const observedAt = '2026-09-03T04:20:37.745Z';
const expected = {
  'candidates-51001.json': [371, 'd88c58e64e497bca7a59d5f17aefd8de8fc3ae2989b009cd7e032000399770d6'],
  'cartociudad-codes.html': [82973, 'a24eff6d135100a026a5d7cb912c45dabf3dc3470bec7b1ccd9d5390d2776eee'],
  'cartociudad-visualization.html': [86899, '989827a7d71b886c99b4d70c38d166a6903e7d9ca69aea7118e3e01ee9211d74'],
  'correos-data.html': [95677, 'fea0155f9752733da30bbed2fb31d7713c4c8102296bb72031c6e14c34b69922'],
  'datos-gob-postcode.html': [86084, '76a74ac53642172228f54dc075fc1bfafa769aa674aa5b403d9fd7686616a049'],
  'ec-ceuta-melilla.html': [137770, 'cccb3be3994224fd67cfcce68dfd1035c03ee02404f39e67cdf665b46d27fd33'],
  'featureinfo-51001.json': [5374, '0bf55c8520aea1f579791e965b56a5d89e50852c9e00ac70974b21b5f76c2bdf'],
  'find-51001.geojson': [518, '1d8db36d044cfe836d6665b01f2992801710fa6cddb23d8f4f396ffa914e5cd0'],
  'wms-capabilities.xml': [18759, '4048cbb2fdd1661a9e804832500eb6f29f11fb3d0b020a341f9b28634854bb2b'],
};

const receipt = file => {
  const bytes = readFileSync(join(inputDir, file));
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  const [expectedBytes, expectedSha256] = expected[file];
  if (bytes.length !== expectedBytes || sha256 !== expectedSha256) throw new Error(`receipt-mismatch:${file}`);
  return { file, bytes: bytes.length, sha256 };
};
const text = file => readFileSync(join(inputDir, file), 'utf8');
const receipts = Object.keys(expected).map(receipt);
const featureCollection = JSON.parse(text('featureinfo-51001.json'));
const feature = featureCollection.features?.[0];
const ring = feature?.geometry?.coordinates?.[0] ?? [];
const closed = ring.length >= 4 && ring[0][0] === ring.at(-1)[0] && ring[0][1] === ring.at(-1)[1];
const xs = ring.map(position => position[0]);
const ys = ring.map(position => position[1]);
const bbox = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
const candidate = JSON.parse(text('candidates-51001.json'))[0];
const point = JSON.parse(text('find-51001.geojson'));
const visualization = text('cartociudad-visualization.html');
const datosGob = text('datos-gob-postcode.html');
const correos = text('correos-data.html');
const ec = text('ec-ceuta-melilla.html');

const report = {
  schemaVersion: 'postal-context-ea-source-review/v1',
  countryCode: 'EA',
  countryName: 'Ceuta and Melilla',
  observedAt,
  result: 'blocked',
  rawBodiesBundledInGit: false,
  receiptCount: receipts.length,
  receiptBytes: receipts.reduce((sum, item) => sum + item.bytes, 0),
  receipts,
  currentPostalSystem: {
    confirmed: true,
    normalization: '51NNN for Ceuta; 52NNN for Melilla',
    distinctMembersPreserved: ['Ceuta', 'Melilla'],
    completeCurrentAssignmentDenominatorAvailable: false,
  },
  officialViewSample: {
    featureId: feature?.id,
    postalCode: feature?.properties?.cod_postal,
    municipalityCode: feature?.properties?.ine_mun,
    databaseTimestamp: feature?.properties?.alta_db,
    sourceDate: String(feature?.properties?.fecha_alta),
    geometryType: feature?.geometry?.type,
    ringCount: feature?.geometry?.coordinates?.length ?? 0,
    positionCount: ring.length,
    closed,
    bbox,
    epsg: 4326,
    officialViewEvidence: true,
    productionEligible: false,
  },
  pointAndAreaSeparation: {
    candidateGeometry: candidate?.geom ?? null,
    findGeometryType: point?.features?.[0]?.geometry?.type ?? null,
    pointPromotedToArea: false,
  },
  rights: {
    cartociudadExplicitViewOnly: /no est.n disponibles para su descarga/i.test(visualization),
    cnigSoleDistributorAndConsultationOnly: /pueden distribuir/i.test(datosGob) && /solamente para consulta/i.test(datosGob),
    correosTransferOrSublicenseRestricted: /sublicen/i.test(correos) && /ceder|transfer/i.test(correos),
    correosInternetFinderRestricted: /internet/i.test(correos) && /buscador/i.test(correos),
    agidCompatibleBulkRedistributionEstablished: false,
  },
  identity: {
    europeanCommissionCeutaAndMelillaReference: /CEUTA AND MELILLA/i.test(ec),
    sourceIdentityMergedWithSpainOrOtherTerritory: false,
  },
  qualityDecision: {
    deterministicTopologyGateImplemented: true,
    officialViewPolygonSamplesValidated: 1,
    currentCompleteAssignmentsValidated: 0,
    productionEligibleRecords: 0,
    huggingFaceOrModelProductionIngested: false,
    permittedModelRoles: ['multilingual parsing evaluation', 'candidate ranking', 'topology anomaly review', 'drift detection'],
    prohibitedModelRoles: ['invent assignment', 'invent official boundary', 'create rights', 'infer building identity'],
  },
  countryM2Achieved: false,
  retryAfter: '2026-12-03T04:20:37.745Z',
};

for (const [key, value] of Object.entries(report.rights)) {
  if (key !== 'agidCompatibleBulkRedistributionEstablished' && value !== true) throw new Error(`missing-rights-finding:${key}`);
}
if (!closed || ring.length !== 184 || report.officialViewSample.postalCode !== '51001') throw new Error('unexpected-51001-polygon');
writeFileSync(outputPath, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ countryCode: 'EA', result: report.result, receiptCount: receipts.length, polygonPositions: ring.length }, null, 2));
