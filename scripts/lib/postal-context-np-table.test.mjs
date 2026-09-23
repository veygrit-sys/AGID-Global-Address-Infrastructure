import assert from 'node:assert/strict';
import {test} from 'node:test';
import {NEPAL_FEDERAL_HEADERS,normalizeNepalPostalCode,readNepalFederalTable,inspectNepalFederalRows} from './postal-context-np-table.mjs';

// All values below are synthetic, not national assignments.
const row = (serial='1', code='12345', range='1234501 देखि 03', count='३') => [serial,'Synthetic Province','Synthetic District','Synthetic Locality',count,'Synthetic Office',code,range];
const html = (rows=[row()],headers=NEPAL_FEDERAL_HEADERS) => Buffer.from('<table><tbody>'+[headers,...rows].map(c=>'<tr>'+c.map(v=>`<td><span>${v}</span></td>`).join('')+'</tr>').join('')+'</tbody></table>');
const profile = rows => inspectNepalFederalRows(readNepalFederalTable(html(rows)));

test('NP normalizes only explicit ASCII or Devanagari five/seven digit strings',()=>{
  for(const [input,expected] of [['१२३४५','12345'],['१२३४५०१','1234501'],[' 12345 ','12345'],['00123','00123'],['0012301','0012301']])assert.equal(normalizeNepalPostalCode(input),expected);
  for(const input of [12345,null,undefined,'123456','12345678','１２３４５','१२345','+977','12345-01','12345\u200b'])assert.throws(()=>normalizeNepalPostalCode(input),/np-/);
});
test('NP profiles real-shaped rows without materializing postal geometry or ward assignments',()=>{
  const p=profile([row()]);assert.equal(p.structurallyValidRows,1);assert.equal(p.arithmeticWardCandidatesFromValidRows,3);assert.equal(p.devanagariWardCountRows,1);assert.equal(p.materializedWardRecords,0);assert.equal(p.geometryAuthority,'none');assert.equal(p.redistributionRightsVerified,false);assert.equal(p.currentAssignmentValidityVerified,false);assert.equal(p.sourceEffectiveDates,null);
});
test('NP preserves raw script, formatting-only spans and ZWNJ instead of overwriting source identity',()=>{
  const b=html([row()]).toString().replace('Synthetic Locality','Synthetic&zwnj;Locality');const t=readNepalFederalTable(Buffer.from(b));assert.equal(t.rows[0].cells[4],'३');assert.equal(t.rows[0].cells[3],'Synthetic\u200cLocality');assert.equal(t.rows[0].sourceRow,2);
});
test('NP headings are not code rows and never supply missing assignment values',()=>{
  const heading=['','Synthetic Province','Synthetic District','','','Synthetic District Office','',''];
  const t=readNepalFederalTable(html([heading,row()]));assert.equal(t.headings.length,1);assert.equal(t.rows.length,1);assert.equal(t.rows[0].sourceRow,3);
  const missing=row();missing[2]='';assert.ok(profile([missing]).issues[0].issueCodes.includes('missing-context'));
  const wrong=[...heading];wrong[6]='12345';assert.throws(()=>readNepalFederalTable(html([wrong,row()])),/heading-shape/);
});
for(const [label,mutation,expected] of [
  ['duplicate',rows=>rows.push(row('2')),'duplicate-office-code'],
  ['serial',rows=>rows[0][0]='2','serial-order-or-duplicate'],
  ['prefix',rows=>rows[0][7]='5432101 देखि 03','ward-prefix-disagreement'],
  ['start',rows=>rows[0][7]='1234502 देखि 03','ward-start-not-one'],
  ['count',rows=>rows[0][4]='4','ward-count-disagreement'],
  ['reverse',rows=>rows[0][7]='1234501 देखि 00','ward-count-disagreement'],
  ['range',rows=>rows[0][7]='1234501-03','ward-range-syntax'],
  ['numeric',rows=>rows[0][6]='1234','office-code-syntax'],
  ['blank',rows=>rows[0][4]='','ward-count-syntax'],
  ['mixed-script',rows=>rows[0][6]='१२345','office-code-script'],
])test(`NP quarantines ${label} without repair or synthetic expansion`,()=>{const rows=[row()];mutation(rows);const p=profile(rows);assert.ok(p.issues.some(i=>i.issueCodes.includes(expected)));assert.equal(p.materializedWardRecords,0);});
test('NP rejects layout, encoding, schema, multi-table and unsafe/private field drift',()=>{
  const normal=html().toString();for(const b of [Buffer.from([255]),Buffer.alloc(4194305),Buffer.from(normal+normal),Buffer.from(normal.replace('<table>','<table><table>')),Buffer.from(normal.replace('<td>','<td colspan="2">')),Buffer.from(normal.replace('Synthetic Locality','<script>owner</script>')),Buffer.from(normal.replace('Synthetic Locality','&unknown;')),html([row()],['owner_name',...NEPAL_FEDERAL_HEADERS.slice(1)]),html([[...row(),'private-phone']]),Buffer.from(normal.replace('</tr>',''))])assert.throws(()=>readNepalFederalTable(b),/np-/);
  assert.throws(()=>readNepalFederalTable(html(),'application/json'),/html-mime/);
});
test('NP repeated names across province/district contexts never become join keys',()=>{
  const other=row('2','12346','1234601 देखि 03');other[2]='Other Synthetic District';const p=profile([row(),other]);assert.equal(p.repeatedLocalityLabelsAcrossContexts,1);assert.equal(p.provinceDistrictKeys,2);assert.equal(p.distinctOfficeCodes,2);assert.deepEqual(p.issues,[]);
});
