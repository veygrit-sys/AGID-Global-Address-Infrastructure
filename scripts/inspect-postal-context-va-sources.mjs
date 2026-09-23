import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const sourceIndex = args.indexOf('--source-dir');
assert.notEqual(sourceIndex, -1, 'pass --source-dir');
const sourceDir = args[sourceIndex + 1];

const expected = {
  'delivery-zones-2025.pdf': ['aec36c06ca23e7d3607e9de6ab2682fdf16833733b77a5eea2dac008c2dca938', 335109],
  'delivery-zones.html': ['ed399fc49a6fa3cc7b5ae4cff36cc73a4527f9c6d577fa772f8f4da000d71806', 98362],
  'post-office-boxes.html': ['cc9e0d1fa82bd3a02df95381f60b1db5ca3cee23b67c8d8a76d7aca3c3bb3f76', 100066],
  'postal-home.html': ['9d7087a311917cf59dbcc704b9cf0f183400df8bbb92f541c9d654bffe9711c6', 210086],
  'service-quality.html': ['232636ebca336ca8d794aa85bf0ffccd16444d89e7b68652afb94a4e5f42a252', 105731],
  'site-announcement.html': ['b9940e58aafb12fa35f609091d405c323b4a9b108b62858744c756b6a6676cf4', 79631],
  'upu-current.pdf': ['ec92fcc050958bafff17e984555b66618a263c50ffa2286d41a8d47c92d8a94d', 631050],
  'upu-vat-2005.pdf': ['a46164abe5f29d01b1ec5f2367f3a4c70da3c23b974f67c7902f29dae4f64531', 107915]
};

const bodies = Object.entries(expected).map(([file, [sha256, bytes]]) => {
  const body = readFileSync(join(sourceDir, file));
  assert.equal(body.length, bytes, `${file} byte length`);
  assert.equal(createHash('sha256').update(body).digest('hex'), sha256, `${file} sha256`);
  return { file, bytes, sha256 };
});

const home = readFileSync(join(sourceDir, 'postal-home.html'), 'utf8');
assert.match(home, /Via della Posta/i);
assert.match(home, /00120/);
assert.match(home, /Copyright by Direzione delle Telecomunicazioni e dei Sistemi Informatici/i);

const zones = readFileSync(join(sourceDir, 'delivery-zones.html'), 'utf8');
assert.match(zones, /zone-recapito-2025\.pdf/i);
assert.match(zones, /quattro zone di recapito/i);
assert.match(zones, /prime tre.*mura vaticane/is);
assert.match(zones, /quarta.*extra-territoriali/is);

const boxes = readFileSync(join(sourceDir, 'post-office-boxes.html'), 'utf8');
assert.match(boxes, /caselle postali/i);
assert.match(boxes, /autorizzat/i);

const quality = readFileSync(join(sourceDir, 'service-quality.html'), 'utf8');
assert.match(quality, /Operatore postale designato/i);
assert.match(quality, /intero territorio nazionale/i);

const announcement = readFileSync(join(sourceDir, 'site-announcement.html'), 'utf8');
assert.match(announcement, /www\.postevaticane\.va/i);
assert.match(announcement, /datetime="2025-05-20T12:00:01\+02:00"/i);

const result = {
  schemaVersion: 'postal-context-va-source-inspection/v1',
  exactBodies: bodies,
  exactBodiesByteAndSha256Bound: bodies.length,
  exactOfficialBodiesBytes: bodies.reduce((sum, body) => sum + body.bytes, 0),
  operatorEvidence: {
    canonicalPostcode: '00120',
    deliveryZones: 4,
    zonesOneToThreeInsideWalls: true,
    zoneFourIncludesExtraterritorialDestinations: true,
    designatedPostalOperatorEstablished: true,
    publicSiteCopyrightNoticeObserved: true,
    explicitAgidProcessingStorageDerivationRedistributionAndPublicServingPermissionEstablished: false
  },
  pdfInspectionReceipt: {
    toolchain: 'Poppler pdfinfo 26.05.0; pdfplumber 0.11.9; pdftoppm 26.05.0 at 150 dpi',
    pages: 3,
    pageOneRasterImages: 1,
    pageOneTextCharacters: 1,
    pageOneVectorRectsCurvesAndLines: 0,
    zoneFourAddressRowsWith00120: 32,
    zoneFourRecipientCategories: 24,
    includesPostOfficeBoxes: true,
    geospatialCrsCoordinatesOrTopologyPresent: false
  },
  promotion: {
    fixedAuthorizedPostcodeGeometryArtifacts: 0,
    assignmentsReconciledToAreaOrExplicitNonArea: 0,
    productionEligibleRecords: 0,
    approvedAgidRuntimeArtifacts: 0,
    sovereignPropertyAddressRecipientOrRasterProxiesPromoted: 0,
    pointBuffers: 0,
    convexOrConcaveHulls: 0,
    voronoiOrRasterCells: 0,
    syntheticFixturesPromoted: false
  }
};

console.log(JSON.stringify(result, null, 2));
