import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';

const sourceDirIndex = process.argv.indexOf('--source-dir');
assert.ok(sourceDirIndex >= 0 && process.argv[sourceDirIndex + 1], 'usage: --source-dir <directory>');
const sourceDir = process.argv[sourceDirIndex + 1];
const expected = new Map([
  ['govuk-find-bfpo.html', [157882, '0ae0c8f9c50946bbfb1cfc1d66be86d0f2612618bef8cb1e006023fa5a4c7556']],
  ['govuk-address-bfpo.html', [72800, '8cb95473d7fa8eef9c15855aa038bf160a073e13c5797e2fca379a04124815b4']],
  ['cypruspost-postcodes-page.html', [34649, '066254797c30aa7403caf8f82147592f09c2badab1332d583f4edf3012cf1a99']],
  ['cypruspost-postal-codes.xlsx', [3701490, '3dffd2a75c6def2007bcb21c905e938720e7b676856af3b7690de0701999f02b']],
  ['sba-dhekelia-area-office.pdf', [80877, '161f1928ad73af656f067cbc2ea27c71ac40a72423ad7a92377f9c0f1302072a']],
  ['govuk-defence-network.html', [79596, '06663c3cbc40633ec2c3dfffe9390dc2c65921f0d6aaf75a0dc0cf472c0fa16c']],
  ['govuk-terms.html', [80557, 'e5deaa29f3b0eb5a16e064ea707d932d7dc1d91641ad7876e30a040db9e96fb6']]
]);
const bodies = {};
for (const [name, [bytes, sha256]] of expected) {
  const body = readFileSync(path.join(sourceDir, name));
  assert.equal(body.length, bytes, `${name} byte mismatch`);
  assert.equal(createHash('sha256').update(body).digest('hex'), sha256, `${name} digest mismatch`);
  bodies[name] = body;
}
const find = bodies['govuk-find-bfpo.html'].toString('utf8');
const addressing = bodies['govuk-address-bfpo.html'].toString('utf8');
const terms = bodies['govuk-terms.html'].toString('utf8');
const cyprusPage = bodies['cypruspost-postcodes-page.html'].toString('utf8');
assert.match(find, /Dhekelia[\s\S]{0,1000}(?:\\u003e|>)58(?:\\u003c|<)[\s\S]{0,1000}BF1\s*2AU/i);
assert.match(addressing, /BFPO number/i);
assert.match(addressing, /not.*(?:town|location)|rather than.*(?:town|country)/i);
assert.match(terms, /Open Government Licence|OGL/i);
assert.match(cyprusPage, /postal_codes\.xlsx/i);
assert.match(cyprusPage, /Copyright\s*2026/i);

const zip = await JSZip.loadAsync(bodies['cypruspost-postal-codes.xlsx']);
const worksheetNames = Object.keys(zip.files).filter(name => /^xl\/worksheets\/sheet\d+\.xml$/.test(name));
assert.equal(worksheetNames.length, 6);
const sheet1 = await zip.file('xl/worksheets/sheet1.xml').async('string');
const sheet2 = await zip.file('xl/worksheets/sheet2.xml').async('string');
const core = await zip.file('docProps/core.xml').async('string');
const rows = xml => [...xml.matchAll(/<row\b[\s\S]*?<\/row>/g)].map(match => match[0]);
const streetRows = rows(sheet1);
const communityRows = rows(sheet2);
const exactDekeleia7502 = streetRows.filter(row => /<t>Dekeleia<\/t>/.test(row) && /<c r="E\d+"[^>]*><v>7502<\/v>/.test(row));
const military6370 = streetRows.filter(row => /<t>Anglikos Stratos Dekeleias<\/t>/.test(row) && /<c r="E\d+"[^>]*><v>6370<\/v>/.test(row));
const communityMatches = communityRows.filter(row => /<t>(?:Dekeleia|Anglikos Stratos Dekeleias)<\/t>/.test(row));
assert.equal(exactDekeleia7502.length, 39);
assert.equal(military6370.length, 1);
assert.equal(communityMatches.length, 2);
assert.ok(streetRows.some(row => /<t>Dekeleias<\/t>/.test(row) && /<v>3045<\/v>/.test(row)), 'expected excluded false positive');
assert.match(core, /2026-08-31T00:05:01\+03:00/);
const allSheetXml = await Promise.all(worksheetNames.map(async name => zip.file(name).async('string')));
assert.equal(allSheetXml.some(xml => /(?:latitude|longitude|\bcrs\b|\bwkt\b|geojson|polygon|multipolygon)/i.test(xml)), false);
assert.equal(Object.keys(zip.files).filter(name => /^xl\/(?:media|charts)\//.test(name)).length, 0);
assert.equal(Object.keys(zip.files).filter(name => /^xl\/drawings\/vmlDrawing\d+\.vml$/.test(name)).length, 6);
console.log(JSON.stringify({ result: 'pass', exactBodies: expected.size,
  exactBytes: [...expected.values()].reduce((sum, [bytes]) => sum + bytes, 0),
  bfpoNumber: '58', shadowPostcode: 'BF1 2AU', cyprusPostcodes: ['6370', '7502'], workbookSheets: worksheetNames.length,
  exactDekeleiaStreetRows7502: exactDekeleia7502.length, militaryLabelRows6370: military6370.length,
  communityRows: communityMatches.length, geometryArtifacts: 0, vmlSupportDrawings: 6 }));
