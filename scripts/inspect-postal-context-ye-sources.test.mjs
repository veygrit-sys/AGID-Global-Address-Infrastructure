import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {profileYemenReference,sourceDigest,validateYemenAuditReport} from './inspect-postal-context-ye-sources.mjs';

const report=JSON.parse(readFileSync(new URL('../reports/postal-context-m2/ye-source-review-2026-08-29.json',import.meta.url),'utf8'));
const fixtureReference=(bytes,kind='html',markers=[])=>({kind,mime:'text/html',markers,reviewed_bytes:bytes.length,expected_digest:sourceDigest(bytes)});

test('Yemen review binds seven exact official references and remains blocked',()=>{
 assert.deepEqual(validateYemenAuditReport(report),{references:7,currentPostalCodeRows:0,officialPostalGeometryRecords:0,countryM2Achieved:false});
 assert.equal(report.references.filter(item=>item.contentVerified).length,7);
});

test('UPU no-required-postcode policy and Yemen Post P.O. box code statement stay distinct',()=>{
 assert.equal(report.postalPolicy.postcodeRequired,false);
 assert.equal(report.postalPolicy.postalCode,'nullable; exact current values and syntax unverified');
 assert.equal(report.postalPolicy.operatorPoBoxOfficeAreaCodeMentioned,true);
 assert.equal(report.postalPolicy.poBoxNumberIsPostcode,false);
 assert.equal(report.currentPostalCodeRowsValidated,0);
});

test('office page placeholder and service description do not become polygons',()=>{
 const office=report.references.find(item=>item.id==='yemen-post-office-map-page').profile;
 const poBox=report.references.find(item=>item.id==='yemen-post-po-box-service').profile;
 assert.equal(office.mapLink,'#');assert.equal(office.officeRows,0);assert.equal(office.postalPolygons,0);assert.equal(office.fitBoundsObserved,false);
 assert.equal(poBox.poBoxNumberSeparate,true);assert.equal(poBox.postalCodeTiedToOfficeByAreaMentioned,true);assert.equal(poBox.exactCodeValues,0);assert.equal(poBox.postalPolygons,0);
 assert.equal(report.officialPostalGeometryRecords,0);assert.equal(report.derivedPostalGeometryRecords,0);
});

test('website copyright text is not promoted to AGID data rights',()=>{
 assert.match(report.rights.upu,/written permission/i);assert.match(report.rights.yemenPost,/no data-specific/i);
 assert.equal(report.publishedImmutableDataArtifacts,0);assert.equal(report.rawSourceBodiesInGit,0);
 assert.equal(report.authenticatedRequests,0);assert.equal(report.paidOperations,0);assert.equal(report.contractAcceptances,0);
});

test('HTML profiler preserves office-map and P.O. box semantics',()=>{
 const office=Buffer.from('360 الخارطة الرقمية target="_blank" href="#" جميع الحقوق محفوظة');
 const officeProfile=profileYemenReference(office,fixtureReference(office,'office-map-html',['360','الخارطة الرقمية','href="#"','الحقوق محفوظة']),'text/html; charset=utf-8');
 assert.equal(officeProfile.map_link,'#');assert.equal(officeProfile.postal_geometry_client,false);
 const poBox=Buffer.from('خدمة الصناديق البريدية رقم صندوق خاص رمز بريدي يتبع لمكتب البريد حسب المنطقة جميع الحقوق محفوظة');
 const poBoxProfile=profileYemenReference(poBox,fixtureReference(poBox,'po-box-html',['خدمة الصناديق البريدية','رقم صندوق خاص','رمز بريدي يتبع لمكتب البريد حسب المنطقة']),'text/html');
 assert.equal(poBoxProfile.po_box_number_separate,true);assert.equal(poBoxProfile.postal_code_tied_to_office_by_area,true);assert.equal(poBoxProfile.postal_geometry,false);
});

test('reference profiler fails closed on drift, MIME and missing markers',()=>{
 const html=Buffer.from('<h3>Yemen</h3> ISO Code 3166/Alpha-2 >YE< 01.01.1930 >Yemen Post<');
 const reference=fixtureReference(html,'html',['<h3>Yemen</h3>','>YE<','Yemen Post']);
 assert.equal(profileYemenReference(html,reference,'text/html; charset=utf-8').markers_verified,3);
 assert.throws(()=>profileYemenReference(Buffer.concat([html,Buffer.from('x')]),reference,'text/html'),/content-drift/);
 assert.throws(()=>profileYemenReference(html,reference,'application/pdf'),/mime/);
 assert.throws(()=>profileYemenReference(html,{...reference,markers:['missing']},'text/html'),/content-marker/);
});

test('sourceDigest is stable and names SHA-256',()=>{
 const value=sourceDigest(Buffer.from('AGID Yemen M2'));assert.match(value,/^sha256:[0-9a-f]{64}$/);assert.equal(value,sourceDigest(Buffer.from('AGID Yemen M2')));
});
