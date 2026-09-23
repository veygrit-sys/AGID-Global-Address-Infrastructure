import assert from 'node:assert/strict';
import test from 'node:test';
import AdmZip from 'adm-zip';
import { csvFromJapanPostArchive, fetchOfficialBounded, normalizeJapanPostAssignments, summarizeJapanPostAssignments, verifyJapanPostReference } from './intake-postal-context-jp-m2.mjs';

const row = (town = '架空検証町', flags = ['0','0','0','0','0','0']) => ['00001','000','0000001','カクウ','カクウ','カクウ','架空都','架空市',town,...flags].map(s => `"${s.replaceAll('"','""')}"`).join(',');

test('preserves zero-prefixed codes, source identity and no-geometry authority', () => {
  const [a] = normalizeJapanPostAssignments(`\uFEFF${row()}\r\n`);
  assert.equal(a.postalCode, '0000001'); assert.equal(a.localGovernmentCode, '00001');
  assert.equal(a.geometry, null); assert.equal(a.geometryAuthority, 'none');
  assert.equal(a.assignmentAuthority, 'official_postal_operator');
  assert.equal(a.classification, 'ordinary_locality_context_only');
});
test('classifies fallback, no-town, partial, multiple and qualified labels conservatively', () => {
  const rows = [row('以下に掲載がない場合'), row('架空村一円'), row('架空町の次に番地がくる場合'), row('架空町', ['1','0','0','0','0','0']), row('架空町', ['0','0','0','1','0','0']), row('架空町（架空区画）')];
  assert.deepEqual(normalizeJapanPostAssignments(rows.join('\n')).map(a => a.classification), ['fallback_not_a_town','no_town_designator','no_town_designator','partial_or_qualified_town','multi_town_code','partial_or_qualified_town']);
});
test('strict CSV accepts escaped punctuation but rejects malformed, retired and invalid rows', () => {
  assert.equal(normalizeJapanPostAssignments(row('架空,"検証"町'))[0].townLabel, '架空,"検証"町');
  for (const invalid of [row() + ',extra', row().slice(0,-1), row().replace('"0000001"','"000001"'), row('架空', ['2','0','0','0','0','0']), row('架空', ['0','0','0','0','2','6']), row() + '\n\n', row().replace('"00001"','"00001"x')]) assert.throws(() => normalizeJapanPostAssignments(invalid));
});
test('aggregate report is reproducible and contains no source locality rows', () => {
  const assignments = normalizeJapanPostAssignments([row(), row('以下に掲載がない場合')].join('\n'));
  const result = summarizeJapanPostAssignments(assignments);
  assert.deepEqual(result, summarizeJapanPostAssignments(assignments));
  assert.equal(result.classifiedRows, 2); assert.equal(result.distinctPostalCodes, 1);
  assert.equal(result.canonicalGeometryCount, 0); assert.equal(result.buildingLinks, 0);
  assert.ok(!JSON.stringify(result).includes('架空'));
});
test('ZIP must contain only the intended bounded UTF-8 file', () => {
  const zip = new AdmZip(); zip.addFile('utf_ken_all.csv', Buffer.from(row()));
  assert.equal(csvFromJapanPostArchive(zip.toBuffer()).csv, row());
  zip.addFile('unexpected.txt', Buffer.from('x'));
  assert.throws(() => csvFromJapanPostArchive(zip.toBuffer()), /unexpected-archive/);
});
test('source version and exact rights text must be reviewed when documentation changes', () => {
  const terms = '日本郵便株式会社は著作権を主張しません。自由に配布していただいて結構です。';
  assert.equal(verifyJapanPostReference('2026年7月31日更新', terms), '2026-07-31');
  assert.throws(() => verifyJapanPostReference('2026年7月31日更新', 'changed terms'), /terms-changed/);
  assert.throws(() => verifyJapanPostReference('unknown date', terms), /release-date/);
});
test('network intake rejects cross-host redirects and streams past its byte budget', async () => {
  await assert.rejects(fetchOfficialBounded('https://evil.invalid/x', 10), /unapproved-source-host/);
  await assert.rejects(fetchOfficialBounded('https://www.post.japanpost.jp/x', 10, async () => new Response(null, { status: 302, headers: { location: 'https://evil.invalid/' } })), /unapproved-source-host/);
  await assert.rejects(fetchOfficialBounded('https://www.post.japanpost.jp/x', 3, async () => new Response('12345')), /source-byte-limit/);
});
