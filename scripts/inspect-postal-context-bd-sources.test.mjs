import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { inspectBdSources, probeBdReference, profileBdOfficeHtml, summarizeBdOfficeRows } from './inspect-postal-context-bd-sources.mjs';
const profile=JSON.parse(readFileSync(new URL('../data/postal_country_packs/bd/postal-context/m2-source-review.json',import.meta.url)));
const probe=profile.table_probes[0];
const row=(serial='1',name='PRIVATE OFFICE SO',code='9999')=>[serial,'Synthetic upazila',name,'সিন্থেটিক',code];
const html=rows=>Buffer.from('<p>কনটেন্টটি শেষ হাল-নাগাদ করা হয়েছে: '+probe.page_updated_marker+'</p><table>'+[probe.headers,...rows].map(r=>'<tr>'+r.map(c=>'<td>'+c+'</td>').join('')+'</tr>').join('')+'</table>');
const response=body=>new Response(body,{headers:{'content-type':'text/html'}});
test('BD blank-code offices remain unassigned and preserve distinct explicit office classes',()=>{
 const result=summarizeBdOfficeRows([row(),row('2','PRIVATE SECOND EDBO',''),row('3','PRIVATE THIRD HO','৯৯৯৯')],'district-bilingual');
 assert.equal(result.observedOfficeRows,3);assert.equal(result.validCodeRows,2);assert.equal(result.blankCodeRows,1);assert.equal(result.distinctPostcodes,1);
 assert.equal(result.duplicatePostcodeGroups,1);assert.equal(result.bengaliDigitCodeRows,1);assert.equal(result.officeClasses.EDBO,1);assert.equal(result.blankCodeOfficeClasses.EDBO,1);
 assert.equal(result.blankCodesFilled,0);assert.equal(result.missingContextFilled,0);assert.equal(result.stableOfficeIdentityVerified,false);
 assert.ok(!JSON.stringify(result).includes('PRIVATE'));assert.equal(result.currentAssignmentVerified,false);assert.equal(result.completeNationalCoverageVerified,false);
 for(const key of ['postalGeometryRecords','civicAddressesVerified','buildingLinksVerified'])assert.equal(result[key],0);
});
test('BD regional Bengali type cells are mapped explicitly and unknown types are not guessed',()=>{
 const rows=[['Synthetic district','Synthetic upazila','PRIVATE','','','৯৯৯৯','ইডিবিও'],['Synthetic district','Synthetic upazila','PRIVATE','','','','অনির্ধারিত']];
 const result=summarizeBdOfficeRows(rows,'regional-bengali');
 assert.equal(result.officeClasses.EDBO,1);assert.equal(result.officeClasses.unknown,1);assert.equal(result.missingAccountingOfficeRows,2);assert.equal(result.missingHeadOfficeRows,2);
 assert.equal(result.blankCodeRows,1);assert.equal(result.serialSequenceMatchesRowOrder,null);
});
test('BD wrong lengths, prefixes, zero-leading codes and numeric cells never become assignments',()=>{
 const result=summarizeBdOfficeRows([row('1','X SO','0000'),row('2','X SO','BD9999'),row('3','X SO','999'),row('4','X SO','99999'),row('5','X SO',String.fromCharCode(96))],'district-bilingual');
 assert.equal(result.invalidCodeRows,5);assert.equal(result.blankCodeRows,0);assert.equal(result.validCodeRows,0);assert.equal(result.codeAndRequiredNameChecksPassed,false);
 assert.throws(()=>summarizeBdOfficeRows([row('1','X SO',9999)],'district-bilingual'),/bd-row-schema/);
});
test('BD missing admin context is not forward filled and office-context conflicts are not merged',()=>{
 const rows=[row(),row('2','PRIVATE OFFICE SO','9998'),['3','','THIRD EDBO','','']];
 const result=summarizeBdOfficeRows(rows,'district-bilingual');
 assert.equal(result.officeContextsWithMultipleNonblankCodes,1);assert.equal(result.missingUpazilaRows,1);assert.equal(result.missingBilingualNameRows,1);assert.equal(result.missingContextFilled,0);
 assert.equal(result.codeAndRequiredNameChecksPassed,false);
 const repeated=summarizeBdOfficeRows([row(),row('2')],'district-bilingual');
 assert.equal(repeated.duplicateAssignmentRowGroups,1);assert.equal(repeated.rowsInDuplicateAssignmentGroups,2);
});
test('BD exact table parsing pins both content date and table bytes without copying source rows',()=>{
 const result=profileBdOfficeHtml(html([row()]),probe);
 assert.equal(result.observedOfficeRows,1);assert.equal(result.pageContentDate,'2022-09-18');assert.equal(result.pageContentDateVerified,true);
 assert.match(result.responseDigest,/^sha256:[a-f0-9]{64}$/);assert.match(result.tableDigest,/^sha256:[a-f0-9]{64}$/);
 assert.equal(result.sourceAssignmentEdition,null);assert.equal(result.siteFooterDateUsedAsAssignmentValidity,false);
 assert.equal(result.responseIsRetainedSourceSnapshot,false);assert.ok(!JSON.stringify(result).includes('PRIVATE'));
 const changed=html([row()]).toString().replace(probe.page_updated_marker,'unreviewed date');
 assert.equal(profileBdOfficeHtml(Buffer.from(changed),probe).pageContentDate,null);
});
test('BD changed table headers, ambiguous tables, HTML spans and oversized cells require review',()=>{
 assert.throws(()=>profileBdOfficeHtml(Buffer.from('<html>login</html>'),probe),/bd-table-header-count/);
 assert.throws(()=>profileBdOfficeHtml(Buffer.concat([html([row()]),html([row()])]),probe),/bd-table-header-count/);
 assert.throws(()=>profileBdOfficeHtml(Buffer.from(html([row()]).toString().replace('<td>1','<td rowspan="2">1')),probe),/bd-spanned-cell-requires-review/);
 assert.throws(()=>summarizeBdOfficeRows([row('1','x'.repeat(1001))],'district-bilingual'),/bd-row-schema/);
 assert.throws(()=>summarizeBdOfficeRows(Array(10001).fill(row()),'district-bilingual'),/bd-row-limit/);
 assert.throws(()=>profileBdOfficeHtml(Buffer.alloc(4194305),probe),/reference-byte-limit/);
 assert.throws(()=>profileBdOfficeHtml(Buffer.from([255]),probe),/bd-invalid-utf8/);
});
test('BD entities are decoded once and do not execute or create inherited codes',()=>{
 const result=profileBdOfficeHtml(html([row('1','Synthetic &amp; label SO','&nbsp;')]),probe);
 assert.equal(result.blankCodeRows,1);assert.equal(result.officeClasses.SO,1);
 assert.throws(()=>profileBdOfficeHtml(html([row('1','X SO','&#x110000;')]),probe),/bd-invalid-entity/);
});
test('BD reference probes reject changed pinned PDFs and do not grant data rights',async()=>{
 const p=profile.reference_probes.find(p=>p.id==='upu-bangladesh-addressing');
 const result=await probeBdReference(p,async()=>new Response('%PDF-changed',{headers:{'content-type':'application/pdf'}}));
 assert.equal(result.contentVerified,false);assert.equal(result.sourceDataRecords,0);
});
test('BD review is fixed-scope, does not persist data and fails closed on transport errors',async()=>{
 const visited=[];const result=await inspectBdSources(async url=>{visited.push(url);throw new Error('PRIVATE error');});
 assert.deepEqual(visited.sort(),[...profile.reference_probes,...profile.table_probes].map(p=>p.url).sort());
 assert.equal(result.sourceDataSnapshotsPersisted,0);assert.equal(result.publishedDataArtifacts,0);assert.equal(result.countryM2Achieved,false);
 assert.equal(result.realAgidRuntimeVerified,false);assert.equal(result.completeNationalCoverageVerified,false);assert.equal(result.tlsVerificationDisabled,false);
 assert.ok(!JSON.stringify(result).includes('PRIVATE'));
});
test('BD even three valid tables are not complete current national M2 evidence',async()=>{
 const result=await inspectBdSources(async url=>{
  const p=profile.table_probes.find(p=>p.url===url);if(!p)return response('reference shell');
  if(p.layout==='regional-bengali')return response('<table>'+[p.headers,['Synthetic','Synthetic','Office','','','৯৯৯৯','এসও']].map(r=>'<tr>'+r.map(c=>'<td>'+c+'</td>').join('')+'</tr>').join('')+'</table>');
  return response(html([row()]));
 });
 assert.ok(result.tableObservations.every(p=>p.status==='office-table-observed-not-m2'));
 assert.equal(result.countryM2Achieved,false);assert.equal(result.rightsForPublicTransformedArtifactsCleared,false);
});
