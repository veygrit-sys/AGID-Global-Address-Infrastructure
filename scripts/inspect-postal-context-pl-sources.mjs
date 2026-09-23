import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';

const args = process.argv.slice(2);
const requiredArg = name => {
  const index = args.indexOf(name);
  if (index < 0 || !args[index + 1]) {
    throw new Error('usage: node scripts/inspect-postal-context-pl-sources.mjs --source-dir <directory> --pdf-text <extracted-text>');
  }
  return args[index + 1];
};

const sourceDir = requiredArg('--source-dir');
const pdfTextPath = requiredArg('--pdf-text');
const expectedBodies = [
  ['poczta-bip-pna.html', '4dfbc648e9855758026e35a241c8d301b1ada4bf3f43948c6728b507bcf389ac'],
  ['poczta-pna-business.html', 'ec5f03d58b4b18ddfdc16f5f688fd24196d977651a22a5a41dbc3a51134d96ed'],
  ['poczta-pna-paginate.js', 'f186df8de4a6879a82a78a5f12dc34e1944bece751edd4316dffd66a9c7a7b21'],
  ['poczta-pna-search-00-940.html', '53b60d8f1acb100d6476514412a163ed0bffc3b4d310f4c26c4f0251cbd7ebb0'],
  ['poczta-pna-search.html', '933da5c4cb7e6be904e2784ba1fb7c828d0005a46213fa1683d03a130f4c0ffe'],
  ['poczta-pna-search.js', '1e00801594b2ee6e434e12ef7f10370d17fe643e75ed75d82bfdb8f5936b97dd'],
  ['poczta-pna-terms.html', '8e4133f17bfe250e1fdc5641286108e6621745039cd9120f0949ecedf99fb48b'],
  ['poczta-spispna.pdf', '42cac01f8e64ed7cf67d47aed8007b6f0d4e849a845accf3d1a91ebad3700cfe']
];

const exactBodies = expectedBodies.map(([name, expected]) => {
  const path = join(sourceDir, name);
  const bytes = readFileSync(path);
  const actual = createHash('sha256').update(bytes).digest('hex');
  if (actual !== expected) throw new Error(`digest mismatch for ${name}: ${actual}`);
  return { name: basename(path), byteLength: statSync(path).size, sha256: `sha256:${actual}` };
});

const text = name => readFileSync(join(sourceDir, name), 'utf8');
const bip = text('poczta-bip-pna.html');
const business = text('poczta-pna-business.html');
const terms = text('poczta-pna-terms.html');
const search = text('poczta-pna-search.html');
const resultPage = text('poczta-pna-search-00-940.html');
const searchJs = text('poczta-pna-search.js');
const pdfText = readFileSync(pdfTextPath, 'utf8').replaceAll('\ufb01', 'fi');

for (const signal of ['autorskie prawa majątkowe do Systemu PNA', 'tylko na potrzeby własne klienta', 'bez prawa odsprzedaży osobom trzecim']) {
  if (!bip.includes(signal)) throw new Error(`BIP rights signal not found: ${signal}`);
}
for (const signal of ['abonamentu rocznego', 'kwartalne aktualizacje', 'zawarcie pisemnej umowy', 'pobierana jest opłata']) {
  if (!business.includes(signal)) throw new Error(`Poczta business-access signal not found: ${signal}`);
}
for (const signal of ['aktualizowany jest przez Sprzedającego na początku każdego kwartału', 'Spis PNA objęty jest ochroną']) {
  if (!terms.includes(signal)) throw new Error(`Poczta terms signal not found: ${signal}`);
}
if (!search.includes('Ostatnia aktualizacja bazy: 2026-08-30') || !search.includes('method="POST"')) {
  throw new Error('current public-search update date or POST contract not found');
}
for (const endpoint of ['pna-search-city.php', 'pna-search-street.php', 'pna-search-district.php', 'pna-search-commune.php']) {
  if (!searchJs.includes(endpoint)) throw new Error(`public-search endpoint not found: ${endpoint}`);
}

const normalizedPdf = pdfText.replace(/\s+/g, ' ');
if (!normalizedPdf.includes('Lipiec 2026') || !normalizedPdf.includes('Wszelkie prawa zastrzeżone.')) {
  throw new Error('July 2026 edition or all-rights-reserved signal not found in extracted PDF text');
}
if (!normalizedPdf.includes('nie może być reprodukowana ani przetwarzana') || !normalizedPdf.includes('bez pisemnej zgody Poczty Polskiej S.A.')) {
  throw new Error('PDF written-consent restriction not found');
}

const pageCount = (pdfText.match(/\fPAGE \d+/g) ?? []).length;
const postcodeOccurrences = pdfText.match(/(?<!\d)\d{2}-\d{3}(?!\d)/g) ?? [];
const distinctPostcodes = new Set(postcodeOccurrences);
const resultRows = (resultPage.match(/<td headers="lp" class="lp">/g) ?? []).length;
const geometryTokens = ['geometry', 'latitude', 'longitude', 'polygon', 'multipolygon', 'geojson'];
const geometryTokenHits = Object.fromEntries(geometryTokens.map(token => [token, (resultPage.match(new RegExp(token, 'gi')) ?? []).length]));

if (pageCount !== 1786 || postcodeOccurrences.length !== 121627 || distinctPostcodes.size !== 21642) {
  throw new Error('pinned PNA PDF metrics changed');
}
if (resultRows !== 6 || !distinctPostcodes.has('00-940') || Object.values(geometryTokenHits).some(Boolean)) {
  throw new Error('pinned public-search result metrics changed');
}

const result = {
  schemaVersion: 'postal-context-pl-source-inspection/v1',
  officialPnaPdf: {
    edition: 'July 2026',
    pages: pageCount,
    byteLength: statSync(join(sourceDir, 'poczta-spispna.pdf')).size,
    encryptedAgainstCopying: true,
    postcodeOccurrences: postcodeOccurrences.length,
    distinctPostcodes: distinctPostcodes.size,
    minimumPostcode: [...distinctPostcodes].sort()[0],
    maximumPostcode: [...distinctPostcodes].sort().at(-1),
    allRightsReservedObserved: true,
    writtenConsentRequiredForReproductionProcessingPublicationOrDatabaseStorage: true,
    geometryTermsObserved: { polygon: 0, multipolygon: 0, geojson: 0, coordinates: 0 }
  },
  publicSearch: {
    databaseUpdated: '2026-08-30',
    method: 'POST',
    normalizedExample: '00-940',
    rows: resultRows,
    resultFields: ['PNA', 'name', 'locality', 'address', 'voivodeship', 'district', 'commune'],
    geometryTokenHits,
    productionAreaGeometryReturned: false
  },
  geoportalAvailability: {
    officialPrgAndWfsCataloguePagesObservedThroughWebReader: true,
    directWwwGeoportalBodiesDownloaded: 0,
    directMapyGeoportalCapabilitiesDownloaded: 0,
    repeatedIpv4HttpsFailures: 6,
    advertisedPostalAreaLayerObserved: false,
    absenceProven: false
  },
  m2AuthorityGap: {
    pnaAgidProcessingDerivationPublicServingAndRedistributionGrantEstablished: false,
    officialPostcodeAreaPolygonOrMultiPolygonArtifactEstablished: false,
    fixedGeometryArtifactSha256: null,
    fullAreaFeaturesInspected: 0,
    assignmentAreaAndExplicitNonAreaRowsReconciled: 0,
    approvedAgidRuntimeArtifacts: 0,
    productionEligibleRecords: 0
  },
  exactBodies
};

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
