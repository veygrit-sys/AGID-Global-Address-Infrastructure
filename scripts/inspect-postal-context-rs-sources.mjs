import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';

// Exact-body audit only; raw official pages and PDFs remain outside Git.

const args = process.argv.slice(2);
const sourceDirIndex = args.indexOf('--source-dir');
if (sourceDirIndex < 0 || !args[sourceDirIndex + 1]) {
  throw new Error('usage: node scripts/inspect-postal-context-rs-sources.mjs --source-dir <directory>');
}

const sourceDir = args[sourceDirIndex + 1];
const expectedBodies = [
  ['posta-address-alignment.html', '09c309a079f4d4b9796d767ba4bb125e372ba42d3b61e897a734a8ad48bdb72b'],
  ['posta-faq-postcode-download.html', '164b26bc55cc1e5b160f2517f42b19c2a0130c6bab733ab5784ed55e0471bf5e'],
  ['posta-gis-portal.html', '8bf4eeac7e0b25e741c5a82b455e6f54b3ba37cab5bb5d7c0528917bc6e7761c'],
  ['posta-gis-prices.html', '72b582a236a4d90c6264d1b0feccd0ac6ff6ea1d21dc39ba4cf614eaf8892c4c'],
  ['posta-gis-prices.pdf', '9d2f13871ad957e3f4f713f62de9c0ab52dc1183631244384004667e28dce5a7'],
  ['posta-gis-service.html', '34809dc25e905edc043c301c5af593d1a49355445188f08a86ad857325a9aa9d'],
  ['posta-pak-definition.html', '52e75a6a325655abcd73f85c7976476acabde90604ad081f8838155283be495b'],
  ['posta-pak-lookup.html', '2465789656b2433d990a148ea20599f2c6b6ab88ab324b9200d85401a80fab9f'],
  ['posta-post-office-list.bin', 'de34c5f2ba96c4dad61a0109b260856797986c79fa1e55867de8ccc125d7f84a'],
  ['posta-postal-dictionary.html', '407742bebc9a7133efe3c27b8b83dc8c339d403a5442c6cb8aea67b9181e1d4c'],
  ['posta-wsp-address-verification.html', '8335e26147612488b2e8a49efb9e0911524f03e48881b876786c241d8c92c7ba'],
  ['posta-wsp-intro.html', '44c1a5228c0321b6260f019b44186ab9c8a4e788a02ff5a4073be0ba01f2f68d'],
  ['posta-wsp-registration.html', 'd60e5d110f5171d6a7167b04beda0b915aa95745b4e13155063c3e8824028749'],
  ['rgz-address-register.html', '61effdbe9b55b9140bcc2c14b3bc41aa67c0930723a99298b01532afcd94ed9e'],
  ['serbian-open-data-license.html', 'c29ba65d6278de45b135f2f1cbaea480fc6b62bc543153dd8f8b6f63752930f7']
];

const exactBodies = expectedBodies.map(([name, expected]) => {
  const path = join(sourceDir, name);
  const bytes = readFileSync(path);
  const actual = createHash('sha256').update(bytes).digest('hex');
  if (actual !== expected) throw new Error(`digest mismatch for ${name}: ${actual}`);
  if ((name.endsWith('.pdf') || name.endsWith('.bin')) && !bytes.subarray(0, 5).equals(Buffer.from('%PDF-'))) {
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

requireSignals('posta-postal-dictionary.html', [
  'Poštanski broj je sastavljen od pet brojki',
  'Isti poštanski broj ne mogu imati dve ili više pošta'
]);
requireSignals('posta-pak-definition.html', [
  'šestocifreni broj',
  'deo ulice'
]);
requireSignals('posta-pak-lookup.html', ['PAK po adresi', 'adresu po PAK-u']);
requireSignals('posta-faq-postcode-download.html', [
  'Gde se na sajtu Pošte nalazi spisak poštanskih brojeva i da li se može preuzeti?',
  'Ne postoji mogućnost preuzimanja baze podataka u elektronskoj formi.'
]);
requireSignals('posta-gis-service.html', [
  'Poligon PAK-a obuhvata skup zgrada koje pripadaju delu jedne ulice.',
  'preko 113.000 PAK-ova'
]);
requireSignals('posta-gis-portal.html', ['poligona PAK-ova', 'svih prostornih podataka']);
requireSignals('posta-gis-prices.html', ['IdDokument=1000044', 'Cene usluga Geografskog informacionog sistema']);
requireSignals('posta-wsp-registration.html', ['Pristup WSP WebAPI servisu omogućen je samo registrovanim korisnicima.']);
requireSignals('posta-wsp-address-verification.html', ['PostanskiBroj', 'Pak', 'Polje vraća vrednost PAK-a']);
requireSignals('rgz-address-register.html', ['Геометрија улица АР', 'Геометрија кућних бројева АР', 'CSV', 'GPKG', 'недељном нивоу']);

const result = {
  schemaVersion: 'postal-context-rs-source-inspection/v1',
  officialPostalDefinition: {
    postcodeFormat: 'NNNNN',
    pakFormat: 'NNNNNN',
    distinctIdentities: true,
    electronicPostcodeDatabaseDownloadAdvertised: false
  },
  officialPakGeometry: {
    nationallyGeoreferencedClaimObserved: true,
    advertisedPakCountLowerBound: 113000,
    geometryKind: 'Polygon',
    semanticUnit: 'buildings belonging to part of one street',
    publicViewerObserved: true,
    fixedArtifactAcquired: false,
    compatibleAgidPublicServingGrantEstablished: false,
    priceRsdPerDataUnit: 90,
    vatExcluded: true
  },
  assignmentAvailability: {
    completeFiveDigitDownloadAvailable: false,
    publicLookupOnly: true,
    wspRegisteredUsersOnly: true,
    enpSalesPointPdfIsCompleteNationalAssignmentDenominator: false,
    enpPdfFiveDigitOccurrences: 689,
    enpPdfDistinctFiveDigitTokens: 686,
    enpPdfDistinctDuplicatedTokens: 3
  },
  rgzOpenAddress: {
    officialOpenAddressRegister: true,
    advertisedUpdateFrequency: 'weekly',
    resourcePageLastModified: '2024-04-15',
    advertisedFormats: ['CSV', 'GPKG'],
    advertisedPostcodeField: false,
    advertisedPakField: false,
    serbianOpenDataLicenseReuseObserved: true,
    directDownloadHeadAttemptsFailed: 1,
    absenceProven: false
  },
  m2AuthorityGap: {
    currentCompleteFiveDigitAssignmentAndExceptionArtifactEstablished: false,
    fixedPakPolygonArtifactEstablished: false,
    compatibleProcessingDerivationStorageRedistributionAndPublicServingGrantEstablished: false,
    fullAreaFeaturesInspected: 0,
    fiveDigitAssignmentsReconciledToAreaOrExplicitNonArea: 0,
    approvedAgidRuntimeArtifacts: 0,
    productionEligibleRecords: 0
  },
  exactBodies
};

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
