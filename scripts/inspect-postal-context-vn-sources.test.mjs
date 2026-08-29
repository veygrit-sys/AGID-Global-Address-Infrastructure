import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {profileVietnamDirectoryHeaders,profileVietnamLegalDocuments,profileVietnamMinistryArticle,profileVietnamPortal,profileVietnamPostNotice,sourceDigest,validateVietnamAuditReport} from './inspect-postal-context-vn-sources.mjs';

const report=JSON.parse(readFileSync(new URL('../reports/postal-context-m2/vn-source-review-2026-08-29.json',import.meta.url),'utf8'));
const ref=bytes=>({id:'fixture',reviewed_bytes:bytes.length,expected_digest:sourceDigest(bytes)});

test('Vietnam review binds exact official receipts and remains blocked',()=>{
 assert.deepEqual(validateVietnamAuditReport(report),{references:7,currentAssignmentRows:0,productionGeometryRecords:0,countryM2Achieved:false});
 assert.equal(report.references.filter(item=>item.contentVerified).length,7);
});

test('current official allocation cannot be pinned from the reviewed portal',()=>{
 assert.equal(report.currentAllocation.exactCurrentDecisionAnnexRetrieved,false);
 assert.equal(report.currentAllocation.currentAssignmentRowsValidated,0);
 assert.equal(report.currentAllocation.vnPostDecisionDate,'2025-08-24');
 assert.equal(report.currentAllocation.ministryArticleDecisionDate,'2024-11-18');
 assert.equal(report.currentAllocation.officialDateConflictUnresolved,true);
 assert.equal(report.portalProfile.linkedDirectoryLastModified,'2018-06-19T04:52:44Z');
 assert.equal(report.portalProfile.linkedDirectoryPdf.pages,552);
 assert.equal(report.portalProfile.linkedDirectoryPdf.textLayerObserved,false);
 assert.deepEqual(report.portalProfile.linkedDirectoryPdf.sampledVisualPages,[1,6,10,15,552]);
});

test('text lookup and stale directory metadata are not a postal-area app',()=>{
 assert.equal(report.portalProfile.postcodeAutocompleteClientObserved,true);
 assert.equal(report.portalProfile.cleartextSearchApiInClient,true);
 assert.equal(report.portalProfile.httpsSearchApiVerified,false);
 assert.equal(report.portalProfile.postalPolygonResponseVerified,false);
 assert.equal(report.portalProfile.operatorSearchToAreaVisualizationVerified,false);
});

test('attribution text is not promoted to AGID reuse rights',()=>{
 assert.equal(report.rights.webpageSourceAttributionObserved,true);
 assert.equal(report.rights.bulkReuseGrantVerified,false);
 assert.equal(report.rights.derivativePolygonGrantVerified,false);
 assert.equal(report.rights.redistributionGrantVerified,false);
 assert.equal(report.rights.persistentPublicApiServingGrantVerified,false);
 assert.equal(report.rights.accountsRegistrationsOrContractAcceptances,0);
});

test('profilers fail closed and preserve official inconsistencies',()=>{
 const portal=Buffer.from('BỘ KHOA HỌC VÀ CÔNG NGHỆ (MST) danhbamabuuchinhquocgia.pdf http://mabuuchinh.vn/API/serviceApi/v1/MBC autocomplete( textsearch');
 assert.equal(profileVietnamPortal(portal,ref(portal)).polygonOrGeojsonClient,false);
 const legal=Buffer.from('2475/QĐ-BTTTT x 29/12/2017'); assert.equal(profileVietnamLegalDocuments(legal,ref(legal)).decision2334Listed,false);
 const headers=Buffer.from('HTTP/1.1 206 Partial Content\r\nLast-Modified: Tue, 19 Jun 2018 04:52:44 GMT\r\nAccept-Ranges: bytes\r\nETag: "0f63c5c897d41:0"\r\nContent-Range: bytes 0-0/386841053\r\n'); assert.equal(profileVietnamDirectoryHeaders(headers,ref(headers)).totalBytes,386841053);
 const ministry=Buffer.from('25/11/2025 18/11/2024 5 ký tự mỗi đơn vị hành chính có một mã bưu chính Ghi rõ nguồn cspl.mst.gov.vn'); assert.equal(profileVietnamMinistryArticle(ministry,ref(ministry)).annexAttachment,false);
 const notice=Buffer.from('2334/QĐ-BKHCN ngày 24/8/2025 mabuuchinh.vn Ghi rõ nguồn vietnampost.vn'); assert.equal(profileVietnamPostNotice(notice,ref(notice)).polygonOrBoundaryRelease,false);
 assert.throws(()=>profileVietnamPortal(Buffer.concat([portal,Buffer.from('x')]),ref(portal)),/content-drift/);
});

test('digest is deterministic and names its algorithm',()=>{
 const value=sourceDigest(Buffer.from('AGID Vietnam M2')); assert.match(value,/^sha256:[0-9a-f]{64}$/); assert.equal(value,sourceDigest(Buffer.from('AGID Vietnam M2')));
});
