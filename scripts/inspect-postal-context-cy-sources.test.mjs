import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {profileCystatGml,profileCyprusReference,sourceDigest,validateCyprusAuditReport} from './inspect-postal-context-cy-sources.mjs';

const report=JSON.parse(readFileSync(new URL('../reports/postal-context-m2/cy-source-review-2026-08-29.json',import.meta.url),'utf8'));

test('Cyprus review binds two exact official data bodies and remains blocked',()=>{
 assert.deepEqual(validateCyprusAuditReport(report),{references:2,currentAddressableCodes:1131,matchedHistoricalCodes:832,currentGeometryCoverageEstablished:false,countryM2Achieved:false});
 assert.equal(report.references.filter(item=>item.contentVerified).length,2);
});

test('current directory and historical geometry do not form a complete current area release',()=>{
 assert.equal(report.assignment.currentAddressableCodes,1131);
 assert.equal(report.geometry.historicalFourDigitCodes,845);
 assert.equal(report.comparison.matchedCurrentCodes,832);
 assert.equal(report.comparison.currentCodesWithoutHistoricalGeometry,299);
 assert.equal(report.comparison.historicalCodesAbsentFromCurrentAssignment,13);
 assert.equal(report.quality.currentDrawableCoverageEstablished,0);
});

test('historical statistical geometry retains authority and is never promoted to operator perimeter',()=>{
 assert.equal(report.geometry.geometryAuthority,'official-statistical-historical');
 assert.equal(report.geometry.currentOperatorPerimeterRecords,0);
 assert.equal(report.postalPolicy.historicalStatisticalSectorIsCurrentOperatorArea,false);
 assert.equal(report.postalPolicy.communityOrStreetIsPostcodeArea,false);
 assert.equal(report.postalPolicy.addressOrBuildingIsPostcodeArea,false);
 assert.equal(report.postalPolicy.missingCodesReceiveInventedArea,false);
});

test('GML profiler identifies CRS, postal sectors and declared dates',()=>{
 const xml=Buffer.from('<?xml version="1.0"?><gml:FeatureCollection><gml:Envelope srsName="EPSG:3048"><gml:lowerCorner>0 0</gml:lowerCorner></gml:Envelope><pd:StatisticalDistribution><gml:PolygonPatch><gml:interior></gml:interior></gml:PolygonPatch><pd:periodOfMeasurement><gml:TimePeriod><gml:beginPosition>2011-10-01</gml:beginPosition><gml:endPosition>2011-11-31</gml:endPosition></gml:TimePeriod></pd:periodOfMeasurement><pd:periodOfReference><gml:TimePeriod><gml:beginPosition>2011-10-01</gml:beginPosition></gml:TimePeriod></pd:periodOfReference><pd:periodOfValidity><gml:TimePeriod><gml:beginPosition>2011-10-01</gml:beginPosition></gml:TimePeriod></pd:periodOfValidity><pd:spatial xlink:href="SU.ASU.PO_1000"/></pd:StatisticalDistribution></gml:FeatureCollection>');
 const profile=profileCystatGml(xml);
 assert.equal(profile.statistical_distribution_features,1);assert.equal(profile.four_digit_geometry_codes,1);assert.equal(profile.polygon_patches,1);assert.equal(profile.interior_rings,1);assert.equal(profile.srs_name,'EPSG:3048');assert.equal(profile.measurement_end_literal,'2011-11-31');
});

test('reference profiler fails closed on byte or digest drift',()=>{
 const bytes=Buffer.from('<?xml version="1.0"?><gml:FeatureCollection/>');
 const reference={kind:'cystat-gml',reviewed_bytes:bytes.length,expected_digest:sourceDigest(bytes),expected_profile:{}};
 assert.equal(profileCyprusReference(bytes,reference).four_digit_geometry_codes,0);
 assert.throws(()=>profileCyprusReference(Buffer.concat([bytes,Buffer.from('x')]),reference),/content-drift/);
});

test('sourceDigest is stable and names SHA-256',()=>{
 const value=sourceDigest(Buffer.from('AGID Cyprus M2'));assert.match(value,/^sha256:[0-9a-f]{64}$/);assert.equal(value,sourceDigest(Buffer.from('AGID Cyprus M2')));
});
