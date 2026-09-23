import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {config,profileTajikReference,sourceDigest,validateTajikAuditReport} from './inspect-postal-context-tj-sources.mjs';

const report=JSON.parse(readFileSync(new URL('../reports/postal-context-m2/tj-source-review-2026-08-29.json',import.meta.url),'utf8'));

test('Tajikistan review binds every official receipt',()=>{
 assert.deepEqual(validateTajikAuditReport(report),{references:3,countryM2Achieved:false});
 assert.equal(report.references.filter(item=>item.contentVerified).length,3);
});

test('assignment and office references are not promoted to polygon data',()=>{
 assert.equal(report.officialIndexPageDistinctCodes,188);
 assert.equal(report.officialIndexPageRepeatedCodes,37);
 assert.equal(report.officialOfficeRows,88);
 assert.equal(report.officialOfficeRepeatedCodes,8);
 assert.equal(report.currentAssignmentCompletenessValidated,false);
 assert.equal(report.officialPostalGeometryRecords,0);
 assert.equal(report.explicitPostcodeAreaRelations,0);
 assert.equal(report.publishedImmutableDataArtifacts,0);
 assert.equal(report.countryM2Achieved,false);
});

test('Tajikistan app path records shared capability but no country proof',()=>{
 assert.equal(report.appPath.sharedSearchLookupImplemented,true);
 assert.equal(report.appPath.sharedTranslucentFillOutlineAndFitImplemented,true);
 assert.equal(report.appPath.tajikRuntimeAvailable,false);
 assert.equal(report.appPath.tajikRealAreaResultAvailable,false);
 assert.equal(report.appPath.tajikCountryEndToEndVerified,false);
 assert.match(report.appPath.remainingUiContractGap,/authority class/);
});

test('audit records no authenticated, paid, contractual, publication or raw-data operation',()=>{
 assert.equal(report.authenticatedRequests,0);
 assert.equal(report.paidOperations,0);
 assert.equal(report.contractAcceptances,0);
 assert.equal(report.newAccountsRepositoriesOrDestinations,0);
 assert.equal(report.rawSourceBodiesInGit,0);
});

test('reference profiler fails closed on drift, MIME and markers',()=>{
 const html=Buffer.from('<main><article>Перечень почтовых индексов Таджикистана 734000 734000 753456 Все права защищены</article></main>');
 const reference={kind:'index-html',mime:'text/html',markers:['Таджикистана','753456'],reviewed_bytes:html.length,expected_digest:sourceDigest(html)};
 const profile=profileTajikReference(html,reference,'text/html; charset=utf-8');
 assert.equal(profile.distinct_six_digit_codes,2);
 assert.equal(profile.repeated_code_count,1);
 assert.throws(()=>profileTajikReference(Buffer.concat([html,Buffer.from('x')]),reference,'text/html'),/drift/);
 assert.throws(()=>profileTajikReference(html,reference,'application/pdf'),/mime/);
 assert.throws(()=>profileTajikReference(html,{...reference,markers:['missing']},'text/html'),/marker/);
});

test('sourceDigest is stable and uses the required prefix',()=>{
 assert.equal(sourceDigest(Buffer.from('AGID Tajikistan M2')),'sha256:d7d10cb443fce955a6be9020377f52a2596f6e3b1e78b45800cef61cfa25f37b');
});
