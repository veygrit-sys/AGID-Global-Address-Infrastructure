import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {profileTurkiyeReference,sourceDigest,validateTurkiyeAuditReport} from './inspect-postal-context-tr-sources.mjs';

const report=JSON.parse(readFileSync(new URL('../reports/postal-context-m2/tr-source-review-2026-08-29.json',import.meta.url),'utf8'));

test('Türkiye review binds every primary-source receipt',()=>{
 assert.deepEqual(validateTurkiyeAuditReport(report),{references:9,sampleRows:3269,countryM2Achieved:false});
 assert.equal(report.references.filter(item=>item.contentVerified).length,9);
});

test('bounded PTT assignments remain typed non-area context',()=>{
 assert.equal(report.pttLookupProfile.sampleRows,3269);
 assert.equal(report.pttLookupProfile.uniqueFiveDigitPostcodes,8);
 assert.equal(report.pttLookupProfile.validFiveDigitRows,3269);
 assert.equal(report.pttLookupProfile.invalidPostcodeRows,0);
 assert.equal(report.pttLookupProfile.polygonCoordinateOrBoundaryFields,0);
 assert.equal(report.currentAssignmentCompletenessValidated,false);
 assert.equal(report.boundedAssignmentSampleClassifiedAsDeliveryAreas,false);
 assert.equal(report.officialPostalGeometryRecords,0);
});

test('UPU and TUCBS evidence preserve format without inventing postal areas',()=>{
 assert.equal(report.postalPolicy.postalCodePattern,'^[0-9]{5}$');
 assert.deepEqual(report.upuAddressingSheet.exceptionModes,['home-delivery','sub-locality-suffix','po-box','poste-restante']);
 assert.equal(report.tucbsReview.postcodeGeometryProperties,0);
 assert.equal(report.tucbsReview.outerDoorGeometry,'point');
 assert.equal(report.tucbsReview.currentPublicPostcodeAreaLayerVerified,false);
 assert.equal(report.publishedImmutableDataArtifacts,0);
 assert.equal(report.countryM2Achieved,false);
});

test('Türkiye app path records shared capability but no country proof',()=>{
 assert.equal(report.appPath.sharedSearchLookupImplemented,true);
 assert.equal(report.appPath.sharedTranslucentFillOutlineAndFitImplemented,true);
 assert.equal(report.appPath.turkiyeRuntimeAvailable,false);
 assert.equal(report.appPath.turkiyeRealAreaResultAvailable,false);
 assert.equal(report.appPath.turkiyeCountryEndToEndVerified,false);
 assert.match(report.appPath.remainingUiContractGap,/authority class/);
});

test('audit records no authenticated, paid, contractual, publication or raw-data operation',()=>{
 assert.equal(report.authenticatedRequests,0);
 assert.equal(report.paidOperations,0);
 assert.equal(report.contractAcceptances,0);
 assert.equal(report.newAccountsRepositoriesOrDestinations,0);
 assert.equal(report.rawSourceBodiesInGit,0);
});

test('assignment profiler verifies counts and fails closed on drift, MIME and geometry',()=>{
 const rows=[
  {İl_Adi:'ANKARA',İlce_Adi:'ALTINDAĞ',posta_Kodu:'06050',mahalleAdi:'HACI BAYRAM MAH.',sokakAdi:'POSTA'},
  {İl_Adi:'ANKARA',İlce_Adi:'ALTINDAĞ',posta_Kodu:'06080',mahalleAdi:'ATIFBEY MAH.',sokakAdi:'100'}
 ];
 const bytes=Buffer.from(JSON.stringify(rows));
 const reference={kind:'assignment-sample-json',mime:'application/json',reviewed_bytes:bytes.length,expected_digest:sourceDigest(bytes),manual_data_review:{rows:2,unique_five_digit_postcodes:2,invalid_postcodes:0,unique_neighbourhoods:2,unique_streets:2,empty_neighbourhoods:0,empty_streets:0,fields:['İl_Adi','İlce_Adi','posta_Kodu','mahalleAdi','sokakAdi'],polygon_or_coordinate_fields:0}};
 const profile=profileTurkiyeReference(bytes,reference,'application/json; charset=utf-8');
 assert.equal(profile.rows,2);
 assert.equal(profile.geometry_fields,0);
 assert.equal(profile.complete_national_assignment,false);
 assert.throws(()=>profileTurkiyeReference(Buffer.concat([bytes,Buffer.from('x')]),reference,'application/json'),/drift/);
 assert.throws(()=>profileTurkiyeReference(bytes,reference,'text/html'),/mime/);
 const bad=Buffer.from(JSON.stringify([{...rows[0],polygon:[]} ,rows[1]]));
 assert.throws(()=>profileTurkiyeReference(bad,{...reference,reviewed_bytes:bad.length,expected_digest:sourceDigest(bad)},'application/json'),/profile/);
});

test('sourceDigest is stable and uses the required prefix',()=>{
 assert.equal(sourceDigest(Buffer.from('AGID Türkiye M2')),'sha256:817f776a5f16adc196c393d3d76adba689cfcefd9c5204f575342afbcce35308');
});
