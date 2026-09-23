import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {config,profileTurkmenistanReference,sourceDigest,validateTurkmenistanAuditReport} from './inspect-postal-context-tm-sources.mjs';

const report=JSON.parse(readFileSync(new URL('../reports/postal-context-m2/tm-source-review-2026-08-29.json',import.meta.url),'utf8'));

test('Turkmenistan review binds every primary-source receipt',()=>{
 assert.deepEqual(validateTurkmenistanAuditReport(report),{references:7,officeRows:153,countryM2Achieved:false});
 assert.equal(report.references.filter(item=>item.contentVerified).length,7);
});

test('current public office directory is profiled without inventing postal areas',()=>{
 assert.equal(report.officeDirectory.rows,153);
 assert.equal(report.officeDirectory.uniqueSixDigitIndices,153);
 assert.equal(report.officeDirectory.duplicateIndexGroups,0);
 assert.equal(report.officeDirectory.validSixDigitIndices,153);
 assert.equal(report.officeDirectory.rowsWithPoint,137);
 assert.equal(report.officeDirectory.rowsWithoutPoint,16);
 assert.equal(report.officeDirectory.polygonOrBoundaryFields,0);
 assert.equal(report.officeIndexDirectoryClassifiedAsDeliveryAreas,false);
 assert.equal(report.officialPostalGeometryRecords,0);
});

test('UPU evidence preserves six-digit and non-area delivery exceptions',()=>{
 assert.equal(report.postalPolicy.postalCodePattern,'^[0-9]{6}$');
 assert.deepEqual(report.upuAddressingSheet.exampleCodes,['744027','745100','746150','744000','744005']);
 assert.deepEqual(report.upuAddressingSheet.exceptionModes,['home-delivery','po-box','poste-restante']);
 assert.equal(report.currentAssignmentCompletenessValidated,false);
 assert.equal(report.publishedImmutableDataArtifacts,0);
 assert.equal(report.countryM2Achieved,false);
});

test('Turkmenistan app path records shared capability but no country proof',()=>{
 assert.equal(report.appPath.sharedSearchLookupImplemented,true);
 assert.equal(report.appPath.sharedTranslucentFillOutlineAndFitImplemented,true);
 assert.equal(report.appPath.turkmenistanRuntimeAvailable,false);
 assert.equal(report.appPath.turkmenistanRealAreaResultAvailable,false);
 assert.equal(report.appPath.turkmenistanCountryEndToEndVerified,false);
 assert.match(report.appPath.remainingUiContractGap,/authority class/);
});

test('audit records no authenticated, paid, contractual, publication or raw-data operation',()=>{
 assert.equal(report.authenticatedRequests,0);
 assert.equal(report.paidOperations,0);
 assert.equal(report.contractAcceptances,0);
 assert.equal(report.newAccountsRepositoriesOrDestinations,0);
 assert.equal(report.rawSourceBodiesInGit,0);
});

test('directory profiler verifies counts and fails closed on drift, MIME and shape',()=>{
 const bytes=Buffer.from(JSON.stringify({regions:[{id:1}],departments:[{index:'744000',location:{lat:37.9,lng:58.3}}]}));
 const reference={kind:'office-directory-json',mime:'application/json',reviewed_bytes:bytes.length,expected_digest:sourceDigest(bytes),manual_data_review:{regions:1,office_rows:1,unique_six_digit_indices:1,rows_with_point:1,polygon_or_boundary_fields:0}};
 const profile=profileTurkmenistanReference(bytes,reference,'application/json; charset=utf-8');
 assert.equal(profile.office_rows,1);
 assert.equal(profile.geometry_records,0);
 assert.equal(profile.complete_delivery_assignment,false);
 assert.throws(()=>profileTurkmenistanReference(Buffer.concat([bytes,Buffer.from('x')]),reference,'application/json'),/drift/);
 assert.throws(()=>profileTurkmenistanReference(bytes,reference,'text/html'),/mime/);
 const bad=Buffer.from(JSON.stringify({regions:[{id:1}],departments:[{index:'744000',polygon:[]}]}));
 assert.throws(()=>profileTurkmenistanReference(bad,{...reference,reviewed_bytes:bad.length,expected_digest:sourceDigest(bad)},'application/json'),/profile/);
});

test('sourceDigest is stable and uses the required prefix',()=>{
 assert.equal(sourceDigest(Buffer.from('AGID Turkmenistan M2')),'sha256:8857c299756984bb77b9079e5f186ba5f026a8013bcebeebb188d4e96273dd1e');
});
