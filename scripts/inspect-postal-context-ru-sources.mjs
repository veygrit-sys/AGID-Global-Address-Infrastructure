import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';

// Exact-body audit only; official pages and PDFs remain outside Git.

const args = process.argv.slice(2);
const sourceDirIndex = args.indexOf('--source-dir');
if (sourceDirIndex < 0 || !args[sourceDirIndex + 1]) {
  throw new Error('usage: node scripts/inspect-postal-context-ru-sources.mjs --source-dir <directory>');
}

const sourceDir = args[sourceDirIndex + 1];
const expectedBodies = [
  ['ops.html', 'd76f8261aef71c0218a9d83738b6a0f39c8878dbb13abd9aab3c3124e4d3f9b3'],
  ['how-index.html', '8a26cff75ca74de452dd23f7ec5d6e251de2c36cc988abeb298792413b68f64a'],
  ['write-address.html', 'bbdc8d7fbbc609f485d140e178e79eefdae9f093a18b79ad46f319106382adb4'],
  ['tariff-api.pdf', '78719b084bc47cff09d3300737a437e3c17384bf777ea0c22e09efb14cca2922'],
  ['fias-law.html', '2a2848cd2c4529e7c0e7096ffcdad6c62bfea5c8f4666817f06ffbfd8157ab04'],
  ['fias-service.html', '431f21b9f28111436a367a3c47541a62863277033cb1c50860da37bdca1976fb'],
  ['fias-integration.html', '6fa5716ee2f0b78eb71202423a9765070594a3b12a7c5e16f8363fc88415d850']
];

const exactBodies = expectedBodies.map(([name, expected]) => {
  const path = join(sourceDir, name);
  const bytes = readFileSync(path);
  const actual = createHash('sha256').update(bytes).digest('hex');
  if (actual !== expected) throw new Error(`digest mismatch for ${name}: ${actual}`);
  if (name.endsWith('.pdf') && !bytes.subarray(0, 5).equals(Buffer.from('%PDF-'))) {
    throw new Error(`PDF signature missing for ${name}`);
  }
  return { name: basename(path), byteLength: statSync(path).size, sha256: `sha256:${actual}` };
});

const read = name => readFileSync(join(sourceDir, name), 'utf8');
const requireSignals = (name, signals) => {
  const body = read(name);
  for (const signal of signals) {
    if (!body.includes(signal)) throw new Error(`${name} signal not found: ${signal}`);
  }
};

requireSignals('ops.html', [
  'официальной информацией об индексах объектов почтовой связи',
  '61358 записей',
  'сформирован 25.08.2026',
  'не реже одного раза в месяц'
]);
requireSignals('how-index.html', [
  'Индекс — это уникальный номер почтового отделения',
  'за которым закреплен тот или иной адрес',
  'Введите нужный адрес',
  'карте отделений'
]);
requireSignals('write-address.html', ['Почтовый индекс по образцу:']);
requireSignals('fias-law.html', [
  'общедоступной информацией, размещаемой в том числе в форме открытых данных',
  'обязательны для использования',
  'при оказании услуг почтовой связи'
]);
requireSignals('fias-service.html', [
  'единого, открытого федерального ресурса',
  'общедоступные сведения об адресах'
]);
requireSignals('fias-integration.html', [
  'через еженедельные выгрузки на портал',
  'публикация дважды в неделю'
]);

const result = {
  schemaVersion: 'postal-context-ru-source-inspection/v1',
  officialPostalDefinition: {
    postcodeFormat: 'NNNNNN',
    semanticUnit: 'unique post-office number assigned to an address',
    currentReferenceDate: '2026-08-25',
    advertisedCurrentOfficeRecords: 61358,
    updateFrequency: 'at-least-monthly'
  },
  archiveAvailability: {
    currentArchiveUrl: 'https://www.pochta.ru/assets/P_Indx_4cffced010.zip',
    currentArchiveHttpStatusObserved: 417,
    numberedArchiveUrl: 'https://info.pochta.ru/assets/P_Indx15_4b6f27ab6d.zip',
    numberedArchiveHttpStatusObserved: 404,
    exactDbfArchiveAcquired: false,
    absenceProven: false
  },
  postalGeometry: {
    officialPostcodePolygonReleaseDiscovered: false,
    fixedAuthoritativeGeometryArtifactsInspected: 0,
    polygonOrMultiPolygonFeaturesValidated: 0,
    officePointsPromoted: 0,
    addressOrMapPointsPromoted: 0,
    administrativeCadastralBuildingOrParcelProxiesPromoted: 0,
    pointBuffers: 0,
    hulls: 0,
    voronoiOrRasterCells: 0
  },
  fiasAddressAuthority: {
    officialOpenAddressRegister: true,
    postcodeAttributeObserved: true,
    advertisedSnapshotFrequency: 'twice-weekly',
    exactCurrentNationalSnapshotInspected: false,
    completeCurrentAddressAssignmentAndExceptionDenominatorEstablished: false,
    addressAuthorityIsPostalPerimeterAuthority: false
  },
  m2AuthorityGap: {
    compatiblePostalAreaProcessingStorageDerivationRedistributionAndPublicServingGrantEstablished: false,
    completeAssignmentsReconciledToAreaOrExplicitNonArea: 0,
    approvedAgidRuntimeArtifacts: 0,
    productionEligibleRecords: 0,
    realRuApiAndAppAreaPathVerified: false
  },
  exactBodies
};

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
