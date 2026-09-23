import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {profileAustriaReference,profileWfsCapabilities,sourceDigest,validateAustriaAuditReport} from './inspect-postal-context-at-sources.mjs';

const report=JSON.parse(readFileSync(new URL('../reports/postal-context-m2/at-source-review-2026-08-29.json',import.meta.url),'utf8'));
const fixtureReference=(bytes,kind='html',markers=[])=>({kind,mime:'text/html',markers,reviewed_bytes:bytes.length,expected_digest:sourceDigest(bytes)});

test('Austria review binds fifteen exact references and remains blocked',()=>{
 assert.deepEqual(validateAustriaAuditReport(report),{references:15,assignmentCodes:2234,officialPostalGeometryRecords:0,countryM2Achieved:false});
 assert.equal(report.references.filter(item=>item.contentVerified).length,15);
});

test('three current assignment sources agree on 2234 addressable codes',()=>{
 assert.equal(report.assignment.postDirectoryAddressableCodes,2234);assert.equal(report.assignment.destinationDirectoryCodes,2234);assert.equal(report.assignment.rtrDistinctCodes,2234);
 assert.equal(report.assignment.threeWayCodeSetMatch,true);assert.equal(report.quality.assignmentCodeSetDifferences,0);
});

test('non-area and destination records never become postal polygons',()=>{
 assert.equal(report.assignment.poBoxTypeRows,248);assert.equal(report.assignment.organizationTypeRows,14);assert.equal(report.assignment.fieldPostTypeRows,4);
 assert.equal(report.postalPolicy.destinationIsPostcodeArea,false);assert.equal(report.postalPolicy.districtOrMunicipalityIsPostcodeArea,false);assert.equal(report.postalPolicy.addressOrBuildingIsPostcodeArea,false);
 assert.equal(report.postalPolicy.nonAreaCodesReceiveInventedArea,false);
});

test('public statistical catalogs expose no current postcode geometry',()=>{
 assert.equal(report.geometry.publicWfsFeatureTypes,146);assert.equal(report.geometry.publicWfsPostalFeatureTypes,0);
 assert.equal(report.geometry.statatlasCurrentLayers,13);assert.equal(report.geometry.statatlasCurrentPostalLayers,0);
 assert.equal(report.geometry.officialStatisticalGeometryRecords,0);assert.equal(report.geometry.derivedGeometryRecords,0);
});

test('WFS profiler counts feature types and postal candidates',()=>{
 const xml=Buffer.from('<FeatureType><Name>A:BOUNDARY</Name></FeatureType><FeatureType><Name>A:PLZ_AREA</Name></FeatureType>');
 assert.deepEqual(profileWfsCapabilities(xml),{feature_type_names:2,postal_feature_type_names:1});
});

test('reference profiler fails closed on drift, markers and PDF signature',()=>{
 const html=Buffer.from('Regionale Datenpakete Geodatenangebot');const reference=fixtureReference(html,'html',['Regionale Datenpakete','Geodatenangebot']);
 assert.equal(profileAustriaReference(html,reference).markers_verified,2);
 assert.throws(()=>profileAustriaReference(Buffer.concat([html,Buffer.from('x')]),reference),/content-drift/);
 assert.throws(()=>profileAustriaReference(html,{...reference,markers:['missing']}),/content-marker/);
 const pdf=Buffer.from('%PDF-exact');const pdfReference={...fixtureReference(pdf,'reviewed-pdf'),mime:'application/pdf',manual_pdf_review:{pdf_pages:1}};
 assert.equal(profileAustriaReference(pdf,pdfReference).visual_review_bound_by_exact_bytes,true);
 assert.throws(()=>profileAustriaReference(Buffer.from('not-pdf'),{...pdfReference,reviewed_bytes:7,expected_digest:sourceDigest(Buffer.from('not-pdf'))}),/pdf-signature/);
});

test('sourceDigest is stable and names SHA-256',()=>{
 const value=sourceDigest(Buffer.from('AGID Austria M2'));assert.match(value,/^sha256:[0-9a-f]{64}$/);assert.equal(value,sourceDigest(Buffer.from('AGID Austria M2')));
});
