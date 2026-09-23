import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {config,profileThailandReference,sourceDigest,validateThailandAuditReport} from './inspect-postal-context-th-sources.mjs';

const report=JSON.parse(readFileSync(new URL('../reports/postal-context-m2/th-source-review-2026-08-29.json',import.meta.url),'utf8'));

test('Thailand review binds every configured official receipt',()=>{
 assert.deepEqual(validateThailandAuditReport(report),{references:6,countryM2Achieved:false});
 assert.equal(report.references.filter(item=>item.contentVerified).length,5);
 assert.equal(report.references.filter(item=>item.status==='acquisition-failed').length,1);
});

test('Thailand assignment poster is not promoted to current polygon data',()=>{
 assert.equal(report.distinctHistoricalReferenceCodes,979);
 assert.equal(report.assignmentExceptionTokens,219);
 assert.equal(report.currentPostalAssignmentRowsValidated,0);
 assert.equal(report.officialPostalGeometryRecords,0);
 assert.equal(report.explicitExceptionGeometryRelations,0);
 assert.equal(report.publishedImmutableDataArtifacts,0);
 assert.equal(report.countryM2Achieved,false);
});

test('Thailand app path records shared capability but no country end-to-end proof',()=>{
 assert.equal(report.appPath.sharedSearchLookupImplemented,true);
 assert.equal(report.appPath.sharedTranslucentFillOutlineAndFitImplemented,true);
 assert.equal(report.appPath.thaiRuntimeAvailable,false);
 assert.equal(report.appPath.thaiRealAreaResultAvailable,false);
 assert.equal(report.appPath.thaiCountryEndToEndVerified,false);
 assert.match(report.appPath.remainingUiContractGap,/authority class/);
});

test('Thailand audit records no authenticated, paid, contractual, publication or raw-data operation',()=>{
 assert.equal(report.authenticatedRequests,0);
 assert.equal(report.paidOperations,0);
 assert.equal(report.contractAcceptances,0);
 assert.equal(report.newAccountsRepositoriesOrDestinations,0);
 assert.equal(report.rawSourceBodiesInGit,0);
});

test('reference profiler fails closed on drift, MIME, markers and JSON syntax',()=>{
 const html=Buffer.from('รหัสไปรษณีย์ search_zipcode');
 const reference={kind:'html',mime:'text/html',markers:['รหัสไปรษณีย์','search_zipcode'],reviewed_bytes:html.length,expected_digest:sourceDigest(html)};
 assert.equal(profileThailandReference(html,reference,'text/html; charset=utf-8').markers_verified,2);
 assert.throws(()=>profileThailandReference(Buffer.concat([html,Buffer.from('x')]),reference,'text/html'),/drift/);
 assert.throws(()=>profileThailandReference(html,reference,'application/pdf'),/mime/);
 assert.throws(()=>profileThailandReference(html,{...reference,markers:['missing']},'text/html'),/marker/);
 const json=Buffer.from('{"title":"ข้อมูลรหัสไปรษณีย์ (Zipcode)"}');
 const jsonRef={kind:'json',mime:'application/json',markers:['Zipcode'],reviewed_bytes:json.length,expected_digest:sourceDigest(json)};
 assert.equal(profileThailandReference(json,jsonRef,'application/json').json_verified,true);
});

test('sourceDigest is stable and uses the required prefix',()=>{
 assert.equal(sourceDigest(Buffer.from('AGID Thailand M2')),'sha256:7651835e0edcebb8884b357b07d762e8ce65dbcbcaf84ef191376fd2553922a6');
});
