import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';

// Exact-body audit only; raw official pages remain outside Git.

const args = process.argv.slice(2);
const sourceDirIndex = args.indexOf('--source-dir');
if (sourceDirIndex < 0 || !args[sourceDirIndex + 1]) {
  throw new Error('usage: node scripts/inspect-postal-context-pt-sources.mjs --source-dir <directory>');
}

const sourceDir = args[sourceDirIndex + 1];
const expectedBodies = [
  ['ctt-address-supply.html', '72b242dc93952670cbf21a85ef2dc400eaed8584004e113f037bc796f317959a'],
  ['ctt-address-treatment.html', '2a6c479fd8fd783263ec02e70000c7ed575015678c3d897a98698ccaf32ec846'],
  ['ctt-postcode-search.html', '9fc4d64b1a823c44a7edcfe3584b6daea57ab0490d175a437f5132b2d2d4e7fa'],
  ['ctt-postcodes-search-help.html', 'e1904b891fda953637894984d883181572057a3b3a3e8513bf8a4d930cbf0a76'],
  ['ctt-postcodes-what.html', 'a5be7f7d828483adfa520c938a5cca21bf7eb4341351abcd256d80c74641314e'],
  ['ctt-terms-index.html', '92a3c1a05cf343c332e1391fa22b5e49e399d112410c9d865406759b5c6f6bd6']
];

const exactBodies = expectedBodies.map(([name, expected]) => {
  const path = join(sourceDir, name);
  const bytes = readFileSync(path);
  const actual = createHash('sha256').update(bytes).digest('hex');
  if (actual !== expected) throw new Error(`digest mismatch for ${name}: ${actual}`);
  return { name: basename(path), byteLength: statSync(path).size, sha256: `sha256:${actual}` };
});

const text = name => readFileSync(join(sourceDir, name), 'utf8');
const definition = text('ctt-postcodes-what.html');
const searchHelp = text('ctt-postcodes-search-help.html');
const search = text('ctt-postcode-search.html');
const supply = text('ctt-address-supply.html');
const treatment = text('ctt-address-treatment.html');
const terms = text('ctt-terms-index.html');

for (const signal of ['identificar inequivocamente uma &aacute;rea geogr&aacute;fica', 'Tem 7 algarismos', '4 primeiros s&atilde;o sempre separados dos &uacute;ltimos 3 por um h&iacute;fen']) {
  if (!definition.includes(signal)) throw new Error(`CTT postcode-definition signal not found: ${signal}`);
}
for (const signal of ['Selecionar um distrito, um concelho', 'nome da localidade e o nome do arruamento', 'n&uacute;mero da porta']) {
  if (!searchHelp.includes(signal)) throw new Error(`CTT public-search-help signal not found: ${signal}`);
}
for (const signal of ['Encontrar o código postal', 'Encontrar o endereço a partir do cód. postal', 'Encontrar o código postal do apartado', 'method="post"']) {
  if (!search.includes(signal)) throw new Error(`CTT public-search contract signal not found: ${signal}`);
}
for (const signal of ['Base Nacional de Endereços', 'Sistema de Informação Geográfica Postal', 'Licenciamento de bases de dados', 'Cedemos partes da nossa base de dados', 'pelo menos 3 anos', 'Webservices geográficos']) {
  if (!supply.includes(signal)) throw new Error(`CTT controlled-geographic-service signal not found: ${signal}`);
}
for (const signal of ['coordenadas geogr&aacute;ficas da respetiva porta', 'WGS84 (EPSG: 4326)']) {
  if (!treatment.includes(signal)) throw new Error(`CTT door-point signal not found: ${signal}`);
}
if (!terms.includes('Grupo CTT | Termos e Condições') || !terms.includes('Consulte os termos e condições gerais de utilização dos CTT.')) {
  throw new Error('CTT terms-index identity signal not found');
}

const combined = [definition, searchHelp, search, supply, treatment, terms].join('\n').toLowerCase();
const geometryTokenHits = Object.fromEntries(
  ['polygon', 'multipolygon', 'geojson'].map(token => [token, (combined.match(new RegExp(token, 'g')) ?? []).length])
);
if (Object.values(geometryTokenHits).some(Boolean)) {
  throw new Error(`unexpected areal geometry token observed: ${JSON.stringify(geometryTokenHits)}`);
}

const result = {
  schemaVersion: 'postal-context-pt-source-inspection/v1',
  officialPostcodeDefinition: {
    canonicalFormat: 'NNNN-NNN',
    numericDigits: 7,
    areaSemanticsStated: true,
    postalDesignationSeparate: true
  },
  publicSearch: {
    method: 'POST',
    addressDriven: true,
    reversePostcodeSearchPresent: true,
    poBoxSearchPresent: true,
    currentCompleteAssignmentDenominatorEstablished: false,
    productionAreaGeometryReturned: false
  },
  controlledGeographicServices: {
    nationalAddressDatabaseNamed: true,
    postalGisNamed: true,
    databaseLicensingNamed: true,
    suppliedDatabasePortionsNamed: true,
    minimumRequestedUseYears: 3,
    geographicWebservicesNamed: true,
    optionalGeoreferencingNamed: true,
    doorCoordinatesCrs: 'EPSG:4326',
    doorCoordinatesGeometry: 'Point'
  },
  dgtOfficialWebReaderObservations: {
    cttAssignsPostcodes: true,
    dgtPostcodeCreationOrIntervention: false,
    openCatalogueCollectionsObserved: ['CAOP', 'CRUS continental', 'cadastre', 'COS', 'OrtoSat'],
    advertisedNationalPostcodeAreaCollectionObserved: false,
    directOfficialBodyDownloadsSucceeded: 0,
    directOfficialBodyDownloadAttemptsFailed: 2,
    absenceProven: false
  },
  m2AuthorityGap: {
    cttAgidProcessingDerivationStorageRedistributionAndPublicServingGrantEstablished: false,
    currentCompleteAssignmentAndExceptionArtifactEstablished: false,
    officialPostcodeAreaPolygonOrMultiPolygonArtifactEstablished: false,
    fixedGeometryArtifactSha256: null,
    fullAreaFeaturesInspected: 0,
    assignmentAreaAndExplicitNonAreaRowsReconciled: 0,
    approvedAgidRuntimeArtifacts: 0,
    productionEligibleRecords: 0
  },
  geometryTokenHits,
  exactBodies
};

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
