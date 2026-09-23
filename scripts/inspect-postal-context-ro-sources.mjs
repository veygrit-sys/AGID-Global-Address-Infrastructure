import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';

// Exact-body audit only; raw official pages and PDFs remain outside Git.

const args = process.argv.slice(2);
const sourceDirIndex = args.indexOf('--source-dir');
if (sourceDirIndex < 0 || !args[sourceDirIndex + 1]) {
  throw new Error('usage: node scripts/inspect-postal-context-ro-sources.mjs --source-dir <directory>');
}

const sourceDir = args[sourceDirIndex + 1];
const expectedBodies = [
  ['ancom-decision-810-2024.pdf', 'ee32284748cd08fa7dbd22b2187cd1dc0341644585df9043e5a2acaea7b66a6d'],
  ['posta-digitalization-geography-status.pdf', '29f7a3ffcabe8ca0bb77350c11dc329a776552accf4d642fab55a181c9ff17b9'],
  ['posta-infocod-criteria.pdf', '37ec8156f01731e8a020d1dd0810445472ce8b856d2d5454aa9db8f7fc636927'],
  ['posta-organization-2025.pdf', '7c274354ffa01e1c4246a5d58e3a36c536b51dd7f18bfd3d7c13ff5454218a52'],
  ['posta-postcode-search-description.html', '11bbbee6d3f6a094e55bd2c8bb083a856e5d1bf587f048c5f1baba8a680f74dd'],
  ['posta-postcode-search.html', 'ba956d63d9e6e1dd6f1726320c82be3270d12429def294644ab853a91a7482d1'],
  ['posta-postcode-structure.pdf', 'c1478dc0c8191dbd30548a013a9177d1003bd92fd331cd75854b29d8e6cb6a0d']
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

const description = readFileSync(join(sourceDir, 'posta-postcode-search-description.html'), 'utf8');
const search = readFileSync(join(sourceDir, 'posta-postcode-search.html'), 'utf8');

for (const signal of [
  'cea mai completă bază de date',
  'actualizate periodic',
  'Caută adresă dupa cod',
  'Cautare dupa cod postal'
]) {
  if (!description.includes(signal)) throw new Error(`current postcode-search description signal not found: ${signal}`);
}
for (const signal of [
  'cautare_pentru_cod.php',
  'cautare_cod.php',
  'k_cod_postal',
  'Strada și numărul',
  'Subunitate poștală'
]) {
  if (!search.includes(signal)) throw new Error(`current postcode-search contract signal not found: ${signal}`);
}

const combined = expectedBodies
  .map(([name]) => readFileSync(join(sourceDir, name)).toString('latin1'))
  .join('\n')
  .toLowerCase();
const geometryTokenHits = Object.fromEntries(
  ['polygon', 'multipolygon', 'geojson', 'shapefile'].map(token => [token, (combined.match(new RegExp(token, 'g')) ?? []).length])
);
if (Object.values(geometryTokenHits).some(Boolean)) {
  throw new Error(`unexpected areal distribution token observed: ${JSON.stringify(geometryTokenHits)}`);
}

const result = {
  schemaVersion: 'postal-context-ro-source-inspection/v1',
  officialPostcodeDefinition: {
    canonicalFormat: 'NNNNNN',
    numericDigits: 6,
    leadingZeroesPreserved: true,
    source: 'posta-postcode-structure.pdf'
  },
  currentPublicSearch: {
    currentDescriptionPinned: true,
    periodicallyUpdatedClaimObserved: true,
    addressToPostcodeMode: true,
    postcodeToAddressMode: true,
    requestMethod: 'POST',
    resultFields: ['postcode', 'county', 'locality', 'street-and-number', 'postal-subunit'],
    currentCompleteAssignmentAndExceptionDenominatorEstablished: false,
    productionAreaGeometryReturned: false
  },
  controlledAssignmentEvidence: {
    infocodElectronicHandoffByPriorWrittenRequest: true,
    infocodMonthlyUpdates: true,
    infocodRedistributionAndPublicServingGrantEstablished: false,
    ancom2024CivilContractAccessRequiredForThirdPartyPostalProviders: true
  },
  operatorAuthorityAndGeographyEvidence: {
    postaMaintainsNationalPostalCodingNomenclatureIn2025: true,
    postaAssignsAndUpdatesPostcodes: true,
    datedDatabaseLackedGpsCoordinates: true,
    datedStreetLevelMunicipalities: 47,
    allOtherLocalitiesSingleCodeAtDatedObservation: true,
    datedObservationMayBeSupersededByNewerExactRelease: true
  },
  officialPortalAcquisition: {
    dataGovRoDirectAttemptsFailed: 1,
    ancpiDirectAttemptsFailed: 1,
    absenceProven: false,
    advertisedNationalPostcodeAreaArtifactObserved: false
  },
  m2AuthorityGap: {
    compatibleAgidProcessingDerivationStorageRedistributionAndPublicServingGrantEstablished: false,
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
