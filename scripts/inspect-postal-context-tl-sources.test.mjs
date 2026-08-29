import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {config,profileTimorLesteReference,sourceDigest,validateTimorLesteAuditReport} from './inspect-postal-context-tl-sources.mjs';

const report=JSON.parse(readFileSync(new URL('../reports/postal-context-m2/tl-source-review-2026-08-29.json',import.meta.url),'utf8'));

test('Timor-Leste review binds every primary-source receipt',()=>{
 assert.deepEqual(validateTimorLesteAuditReport(report),{references:5,countryM2Achieved:false});
 assert.equal(report.references.filter(item=>item.contentVerified).length,5);
});

test('UPU format evidence is not promoted to assignment or polygon data',()=>{
 assert.equal(report.postalPolicy.postalCodePattern,'^TL[0-9]{5}$');
 assert.deepEqual(report.upuAddressingSheet.exampleCodes,['TL11212','TL10901','TL42000','TL11200','TL10001']);
 assert.equal(report.currentAssignmentCompletenessValidated,false);
 assert.equal(report.officialPostalGeometryRecords,0);
 assert.equal(report.explicitPostcodeAreaRelations,0);
 assert.equal(report.publishedImmutableDataArtifacts,0);
 assert.equal(report.countryM2Achieved,false);
});

test('official contact number is retained as unclassified',()=>{
 assert.equal(report.officialContactNumberObserved,'535022');
 assert.equal(report.officialContactNumberClassifiedAsPostcode,false);
 assert.match(report.quality.reason,/six-digit/);
});

test('Timor-Leste app path records shared capability but no country proof',()=>{
 assert.equal(report.appPath.sharedSearchLookupImplemented,true);
 assert.equal(report.appPath.sharedTranslucentFillOutlineAndFitImplemented,true);
 assert.equal(report.appPath.timorLesteRuntimeAvailable,false);
 assert.equal(report.appPath.timorLesteRealAreaResultAvailable,false);
 assert.equal(report.appPath.timorLesteCountryEndToEndVerified,false);
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
 const html=Buffer.from('<main>Correios de Timor-Leste All Rights Reserved</main>');
 const reference={kind:'operator-html',mime:'text/html',markers:['Correios de Timor-Leste','All Rights Reserved'],reviewed_bytes:html.length,expected_digest:sourceDigest(html)};
 const profile=profileTimorLesteReference(html,reference,'text/html; charset=utf-8');
 assert.equal(profile.geometry_records,0);
 assert.equal(profile.assignment_rows,0);
 assert.throws(()=>profileTimorLesteReference(Buffer.concat([html,Buffer.from('x')]),reference,'text/html'),/drift/);
 assert.throws(()=>profileTimorLesteReference(html,reference,'application/pdf'),/mime/);
 assert.throws(()=>profileTimorLesteReference(html,{...reference,markers:['missing']},'text/html'),/marker/);
});

test('sourceDigest is stable and uses the required prefix',()=>{
 assert.equal(sourceDigest(Buffer.from('AGID Timor-Leste M2')),'sha256:0d67f6939ac1a7d427c249c58ae801f210726d8fdfc0408da96d43e0c1d3085d');
});
