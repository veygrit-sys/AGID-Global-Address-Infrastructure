import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';

// Exact-body audit only; official pages and PDFs remain outside Git.

const args = process.argv.slice(2);
const sourceDirIndex = args.indexOf('--source-dir');
if (sourceDirIndex < 0 || !args[sourceDirIndex + 1]) {
  throw new Error('usage: node scripts/inspect-postal-context-se-sources.mjs --source-dir <directory>');
}

const sourceDir = args[sourceDirIndex + 1];
const expectedBodies = [
  ['lm-address-product.html', 'e0aa4031e42a1fd708b8ccc0e4a3ce7f4fea2bbfb5b0d4cb7b72ce5e8caf0903'],
  ['lm-address-spec.pdf', '4bf25fe4a37923555d62796dd23ce4eeb943b9720d42b535b400ae6f7996952f'],
  ['lm-address-technical.pdf', 'c2a363411e23286b34c92e815d882632e4a68a7f764df6200665dc1ef80f4f32'],
  ['lm-address-terms.pdf', '44fe3e9048448b8af88ff5dbd2a16a75727083b71f70fa05c435340556026321'],
  ['pns-about.html', '68a3f7027590bdf96f86fa2e9e05086ccd006f2b5b3c74bda3c696bbeee8a7c5'],
  ['pns-data.html', 'ac095d84a36c4f5329bae04713cda8d82c54a27c4371e1cb7447afb0d16435ae'],
  ['pns-postnummer.html', 'b849d56ce63d7083e6023d5ac7e273d49b1edd0b3e51e7421b2e3f3b2689d5ce'],
  ['pns-terms.html', '71a75517cce98ae7c09bffebfd23d298af684409f1374fa1a0fcabdcaf71938f'],
  ['pts-postnummer.html', '83cbe04fc359898b9790edaad90b2b52172e5fd403fedee71921403f4920825d']
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

requireSignals('pts-postnummer.html', [
  'Postnummer &#xE4;r enbart till f&#xF6;r att effektivisera postutdelningen',
  'Indelningen beh&#xF6;ver inte heller f&#xF6;lja stadsdelar, kommuner och l&#xE4;n',
  'Vi har utsett Postnord att ansvara f&ouml;r postnummersystemet'
]);
requireSignals('pns-about.html', [
  'Vår data uppdateras varje vecka',
  'Nationella postoperatörer',
  'Lantmäterier',
  'Officiella myndigheter'
]);
requireSignals('pns-data.html', ['Postnummerservice – Adress- och postnummerdata för Norden']);
requireSignals('pns-postnummer.html', ['~17 000', '1 743', '10 500', 'leveransbara postnummer']);
requireSignals('pns-terms.html', [
  'licens att använda datan inom din organisation',
  'Vidareförsäljning av data är inte tillåten',
  'Underlicensiering till tredje part är inte tillåten'
]);
requireSignals('lm-address-product.html', [
  'fördefinierade dataset för belägenhetsadresser per kommun',
  'postnummer/postort',
  'SWEREF 99 TM (EPSG:3006) och ETRS89 (EPSG: 4258)',
  'Informationen uppdateras halvårsvis',
  'särskilda användningsvillkor'
]);

const result = {
  schemaVersion: 'postal-context-se-source-inspection/v1',
  officialPostalGovernance: {
    postcodeFormat: 'NNNNN',
    displayFormat: 'NNN NN',
    statedPurpose: 'mail-routing-only',
    followsMunicipalityOrCounty: false,
    administratorAppointedByPts: 'PostNord'
  },
  postnummerservice: {
    advertisedApproximatePostcodes: 17000,
    advertisedPostTowns: 1743,
    advertisedDeliverablePostcodes: 10500,
    advertisedUpdateFrequency: 'weekly',
    nationalPostalOperatorAndOfficialAuthorityPartnershipsAdvertised: true,
    currentPurchaseTerms: {
      useWithinOrganization: true,
      resaleAllowed: false,
      sublicensingAllowed: false
    },
    fiveDigitSurfaceProductAdvertisedByIndexed2026PriceDocument: true,
    exactSurfaceDeliveryAcquired: false
  },
  accessReceipts: {
    postNordLookupAndPdfStandardGetStatusObserved: 403,
    accessBypassAttempted: false,
    postnummerservice2026PriceAssetStatusObserved: 301,
    postnummerservice2026PriceAssetRedirectTarget: 'https://postnummerservice.se/sv/information/postnummer',
    exact2026PricePdfAcquired: false
  },
  lantmaterietAddress: {
    municipalityPartitioned: true,
    postcodeAndPostTownAttributesAdvertised: true,
    updateFrequency: 'half-yearly',
    deliveryFormat: 'GML',
    advertisedCrs: ['EPSG:3006', 'EPSG:4258'],
    reviewedExampleGeometry: 'Point',
    reviewedPointSpecification: 'entrance',
    loginAfterOrderRequired: true,
    purposeReviewAndSpecialTermsRequired: true,
    exactAuthorizedDeliveryAcquired: false,
    addressAuthorityIsPostalPerimeterAuthority: false
  },
  postalGeometry: {
    officialPostcodePolygonReleaseDiscovered: false,
    commercialFiveDigitSurfaceProductAdvertised: true,
    fixedAuthorizedGeometryArtifactsInspected: 0,
    polygonOrMultiPolygonFeaturesValidated: 0,
    addressPointsPromoted: 0,
    municipalOrAdministrativeProxiesPromoted: 0,
    pointBuffers: 0,
    hulls: 0,
    voronoiOrRasterCells: 0
  },
  m2AuthorityGap: {
    completeCurrentAssignmentAndEndpointExceptionDenominatorEstablished: false,
    compatiblePostalAreaProcessingStorageDerivationRedistributionAndPublicServingGrantEstablished: false,
    completeAssignmentsReconciledToAreaOrExplicitNonArea: 0,
    approvedAgidRuntimeArtifacts: 0,
    productionEligibleRecords: 0,
    realSeApiAndAppAreaPathVerified: false
  },
  exactBodies
};

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
