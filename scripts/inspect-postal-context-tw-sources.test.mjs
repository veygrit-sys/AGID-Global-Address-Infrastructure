import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {profileTaiwanLinkCatalog,profileTaiwanReference,sourceDigest,validateTaiwanAuditReport} from './inspect-postal-context-tw-sources.mjs';

const report=JSON.parse(readFileSync(new URL('../reports/postal-context-m2/tw-source-review-2026-08-29.json',import.meta.url),'utf8'));

test('Taiwan review binds every exact primary-source receipt',()=>{
 assert.deepEqual(validateTaiwanAuditReport(report),{references:10,catalogRows:4,postalGeometryRecords:0,countryM2Achieved:false});
 assert.equal(report.references.filter(item=>item.contentVerified).length,10);
});

test('government CSV is a four-row link catalog, not postal data',()=>{
 assert.equal(report.dataGovResourceProfile.resourceEncoding,'Big5');
 assert.deepEqual(report.dataGovResourceProfile.fields,['file name','format','download URL']);
 assert.equal(report.dataGovResourceProfile.assignmentRows,0);
 assert.equal(report.dataGovResourceProfile.postcodeFields,0);
 assert.equal(report.dataGovResourceProfile.polygonCoordinateOrBoundaryFields,0);
 assert.equal(report.dataGovResourceProfile.currentPublicStandaloneAddressTextFile,false);
});

test('current operator rules keep address text behind approval',()=>{
 assert.equal(report.controlledTextFileAccess.publicWebsiteAndDataPortalDistributionStopped,true);
 assert.equal(report.controlledTextFileAccess.externalAccountRequired,true);
 assert.equal(report.controlledTextFileAccess.companySealApplicationRequired,true);
 assert.equal(report.controlledTextFileAccess.operatorApprovalRequired,true);
 assert.equal(report.controlledTextFileAccess.quarterlyUpdateRequired,true);
 assert.equal(report.controlledTextFileAccess.authenticatedRequestsPerformed,0);
 assert.equal(report.controlledTextFileAccess.applicationsSubmitted,0);
 assert.equal(report.controlledTextFileAccess.contractOrTermsAccepted,0);
});

test('operator API and NLSC layers do not expose postal areas',()=>{
 assert.deepEqual(report.apiSpecProfile.methods,['GetZipCode','GetCityArea','GetZipAddress']);
 assert.equal(report.apiSpecProfile.polygonCoordinateOrBoundaryFields,0);
 assert.equal(report.nlscReview.doorplateLayerGeometry,'point');
 assert.match(report.nlscReview.buildingLayerGeometry,/separate non-postal/);
 assert.equal(report.nlscReview.publicPostcodeAreaLayerVerified,false);
 assert.equal(report.nlscReview.vectorServicePublicRedistributionVerified,false);
 assert.equal(report.officialPostalGeometryRecords,0);
});

test('shared map capability does not promote Taiwan completion',()=>{
 assert.equal(report.appPath.sharedSearchLookupImplemented,true);
 assert.equal(report.appPath.sharedAreaOnlyGeometryFilteringImplemented,true);
 assert.equal(report.appPath.sharedTranslucentFillOutlineAndFitImplemented,true);
 assert.equal(report.appPath.taiwanRuntimeAvailable,false);
 assert.equal(report.appPath.taiwanRealAreaResultAvailable,false);
 assert.equal(report.appPath.taiwanCountryEndToEndVerified,false);
 assert.match(report.appPath.remainingUiContractGap,/authority class/);
});

test('link profiler proves row and field grain and fails closed on drift',()=>{
 const text='檔案名稱,格式,下載網址\nA,odt,https://example.test/a\nB,pdf,https://example.test/b\nC,url,https://example.test/c\nD,csv,https://example.test/d';
 const bytes=Buffer.from(text,'utf8');
 const reference={reviewed_bytes:bytes.length,expected_digest:sourceDigest(bytes)};
 assert.throws(()=>profileTaiwanLinkCatalog(bytes,reference),/link-catalog-shape/);
 const pdf=Buffer.from('%PDF-review');
 assert.deepEqual(profileTaiwanReference(pdf,{kind:'reviewed-pdf',reviewed_bytes:pdf.length,expected_digest:sourceDigest(pdf),manual_review:{pages:1}}),{pages:1,visual_review_bound_by_exact_bytes:true});
 assert.throws(()=>profileTaiwanReference(Buffer.concat([pdf,Buffer.from('x')]),{kind:'reviewed-pdf',reviewed_bytes:pdf.length,expected_digest:sourceDigest(pdf),manual_review:{pages:1}}),/content-drift/);
});

test('sourceDigest is stable and prefixed',()=>{
 assert.equal(sourceDigest(Buffer.from('AGID Taiwan M2')),'sha256:667a3a4db76fd8b76191430221c6bef940d0625f9fc1f1a3f213bbfcd06903ca');
});
