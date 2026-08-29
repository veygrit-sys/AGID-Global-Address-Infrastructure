import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {profileAndorraReference,sourceDigest,validateAndorraAuditReport} from './inspect-postal-context-ad-sources.mjs';

const report=JSON.parse(readFileSync(new URL('../reports/postal-context-m2/ad-source-review-2026-08-29.json',import.meta.url),'utf8'));
const fixtureReference=(bytes,kind='html',markers=[])=>({kind,mime:'text/html',markers,reviewed_bytes:bytes.length,expected_digest:sourceDigest(bytes)});

test('Andorra review binds ten exact official references and remains blocked',()=>{
 assert.deepEqual(validateAndorraAuditReport(report),{references:10,currentPostalCodeRows:0,officialPostalGeometryRecords:0,countryM2Achieved:false});
 assert.equal(report.references.filter(item=>item.contentVerified).length,10);
});

test('UPU implementation history preserves road assignment and conflicting same-parish examples',()=>{
 assert.equal(report.postalPolicy.canonicalFormat,'ADNNN');
 assert.equal(report.postalPolicy.geographicZones,7);
 assert.equal(report.postalPolicy.assignmentGrain,'road/thoroughfare');
 assert.deepEqual(report.postalPolicy.sameParishObservedExamples,['AD500','AD501']);
 assert.equal(report.postalPolicy.parishBoundaryIsFullPostcodeGeometry,false);
});

test('paid Correos products do not authorize AGID or prove Andorra overlay scope',()=>{
 assert.equal(report.rights.correosPaidContractRequired,true);
 assert.equal(report.rights.correosPublicSearchForUnrelatedUsersAllowed,false);
 assert.equal(report.postalPolicy.correosBasicDatabaseAndorraCoverageStated,true);
 assert.equal(report.postalPolicy.correosOverlayAndorraScopeVerified,false);
 assert.equal(report.paidOperations,0);assert.equal(report.contractAcceptances,0);
});

test('public address and topographic tools remain non-postal geometry',()=>{
 assert.equal(report.postalPolicy.openLsAddressExamplesVerified,true);
 assert.equal(report.postalPolicy.addressPointIsPostalArea,false);
 assert.equal(report.postalPolicy.topographicBuildingIsPostalArea,false);
 assert.equal(report.officialPostalGeometryRecords,0);assert.equal(report.derivedPostalGeometryRecords,0);
});

test('HTML and PDF profilers fail closed on drift, MIME and markers',()=>{
 const html=Buffer.from('Spain and Andorra paid contract no public search');
 const reference=fixtureReference(html,'html',['Spain and Andorra','paid contract','public search']);
 assert.equal(profileAndorraReference(html,reference,'text/html; charset=utf-8').markers_verified,3);
 assert.throws(()=>profileAndorraReference(Buffer.concat([html,Buffer.from('x')]),reference,'text/html'),/content-drift/);
 assert.throws(()=>profileAndorraReference(html,reference,'application/pdf'),/mime/);
 assert.throws(()=>profileAndorraReference(html,{...reference,markers:['missing']},'text/html'),/content-marker/);
 const pdf=Buffer.from('%PDF-exact');const pdfRef={...fixtureReference(pdf,'reviewed-pdf'),mime:'application/pdf',manual_pdf_review:{pdf_pages:1}};
 assert.equal(profileAndorraReference(pdf,pdfRef,'application/pdf').visual_review_bound_by_exact_bytes,true);
});

test('sourceDigest is stable and names SHA-256',()=>{
 const value=sourceDigest(Buffer.from('AGID Andorra M2'));assert.match(value,/^sha256:[0-9a-f]{64}$/);assert.equal(value,sourceDigest(Buffer.from('AGID Andorra M2')));
});
