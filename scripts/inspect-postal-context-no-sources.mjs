import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';

const args = process.argv.slice(2);
const sourceDirIndex = args.indexOf('--source-dir');
if (sourceDirIndex < 0 || !args[sourceDirIndex + 1]) {
  throw new Error('usage: node scripts/inspect-postal-context-no-sources.mjs --source-dir <directory>');
}
const sourceDir = args[sourceDirIndex + 1];

const expectedBodies = [
  ['bring-address-register-terms.pdf', '9dfe2ca43dbb4a645db0c68914c83e7405f5296f703cfbc678aef6ba0d8754d5'],
  ['bring-postcode-manual.html', '876cf7c762f81d76f64cbe7c97b2c65a35dc3da26a1686daa6ad85b14624ddc9'],
  ['bring-postcode-register.txt', '7a9f175cfcaa4d2229b0af904098b2cc8ac0825cbd6535949e0571ae887c3538'],
  ['bring-postcodes.html', '883e2a17385a45cadff574252f13778bd0995e87beac4dda2882e8f0aed02755'],
  ['cc-by-4.0-legalcode.html', '6d55b998ed5c54f43426d059a8c549ed58a3321e5463e6a6af1c6b56ab78c333'],
  ['data-norge-postcode-areas.html', '8d421592dbf7ce4c2d935dfc6a28a42bfc36fbfc4d334f2040f5621c59f0b597']
];

const exactBodies = expectedBodies.map(([name, expected]) => {
  const path = join(sourceDir, name);
  const bytes = readFileSync(path);
  const actual = createHash('sha256').update(bytes).digest('hex');
  if (actual !== expected) throw new Error(`digest mismatch for ${name}: ${actual}`);
  return { name: basename(path), byteLength: statSync(path).size, sha256: `sha256:${actual}` };
});

const registerBytes = readFileSync(join(sourceDir, 'bring-postcode-register.txt'));
const register = new TextDecoder('windows-1252').decode(registerBytes);
const rows = register.split(/\r?\n/).filter(Boolean).map((line, index) => {
  const cells = line.split('\t');
  if (cells.length !== 5) throw new Error(`row ${index + 1} does not have five fields`);
  const [postcode, postalPlace, municipalityCode, municipalityName, category] = cells;
  if (!/^\d{4}$/.test(postcode) || !/^\d{4}$/.test(municipalityCode) || !/^[GPBS]$/.test(category)) {
    throw new Error(`malformed row ${index + 1}: ${line}`);
  }
  return { postcode, postalPlace, municipalityCode, municipalityName, category };
});
const uniqueCodes = new Set(rows.map(row => row.postcode));
const categoryCounts = Object.fromEntries(['G', 'P', 'B', 'S'].map(category => [category, rows.filter(row => row.category === category).length]));
const territoryRows = prefix => rows.filter(row => row.municipalityCode.startsWith(prefix));

const postcodesPage = readFileSync(join(sourceDir, 'bring-postcodes.html'), 'utf8');
const manualPage = readFileSync(join(sourceDir, 'bring-postcode-manual.html'), 'utf8');
const geometryPage = readFileSync(join(sourceDir, 'data-norge-postcode-areas.html'), 'utf8');
if (!postcodesPage.includes('2025/10/01') || !/all postcodes/i.test(postcodesPage)) {
  throw new Error('current Bring postcode-page date or coverage statement not found');
}
for (const signal of ['G = Street addresses', 'P = P.O. Boxes', 'B = Both street addresses and P.O.Boxes', 'S = Postcode for special service']) {
  if (!manualPage.includes(signal)) throw new Error(`Bring category statement not found: ${signal}`);
}
for (const signal of ['Postnummerområder', 'Creative Commons Attribution 4.0 International', 'geojson', 'WFS', '2026-08-28']) {
  if (!geometryPage.includes(signal)) throw new Error(`data.norge geometry signal not found: ${signal}`);
}

const result = {
  schemaVersion: 'postal-context-no-source-inspection/v1',
  postenRegister: {
    effectiveFrom: '2025-10-01',
    encoding: 'Windows-1252',
    delimiter: 'TAB',
    rows: rows.length,
    distinctPostcodes: uniqueCodes.size,
    duplicatePostcodes: rows.length - uniqueCodes.size,
    malformedRows: 0,
    distinctMunicipalities: new Set(rows.map(row => row.municipalityCode)).size,
    minimumPostcode: [...uniqueCodes].sort()[0],
    maximumPostcode: [...uniqueCodes].sort().at(-1),
    categoryCounts,
    categoryMeanings: {
      G: 'street addresses',
      P: 'P.O. boxes',
      B: 'street addresses and P.O. boxes',
      S: 'special service, not used for addresses'
    }
  },
  territoryClassification: {
    countyLike21SvalbardRows: territoryRows('21').length,
    countyLike22JanMayenRows: territoryRows('22').length,
    rowsMayBeSilentlyMergedIntoIsoNo: false,
    operationalClassificationIsSovereigntyConclusion: false
  },
  kartverketAreaMetadata: {
    dataset: 'Postnummerområder',
    metadataObservedUpdated: '2026-08-28',
    officialPostcodeAreaClaimObserved: true,
    postOfficeBoxCodesAdditionalNoticeObserved: true,
    updateFrequency: 'monthly except July and December',
    advertisedFormats: ['GeoJSON', 'GML', 'GDB', 'SOSI'],
    advertisedServices: ['WFS', 'WMS', 'Geonorge download'],
    license: 'CC BY 4.0',
    fixedGeometryArtifactDownloaded: false,
    fixedGeometryArtifactSha256: null,
    fullFeaturesInspected: 0,
    polygonOrMultiPolygonFeaturesValidated: 0
  },
  m2AuthorityGap: {
    postenRegisterDatasetSpecificAgidProcessingAndPublicServingGrantEstablished: false,
    currentFixedKartverketGeometryArtifactAndDigestPinned: false,
    completeAssignmentToAreaAndExplicitNonAreaReconciliationProduced: false,
    approvedAgidRuntimeArtifacts: 0,
    productionEligibleRecords: 0
  },
  exactBodies
};

if (rows.length !== 5122 || uniqueCodes.size !== 5122 || categoryCounts.G !== 3318 || categoryCounts.P !== 1740 || categoryCounts.B !== 60 || categoryCounts.S !== 4) {
  throw new Error('pinned Posten register metrics changed');
}
if (territoryRows('21').length !== 7 || territoryRows('22').length !== 1) {
  throw new Error('pinned Posten territory-classification metrics changed');
}
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
