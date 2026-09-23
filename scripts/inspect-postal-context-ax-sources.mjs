import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import booleanValid from '@turf/boolean-valid';

const root=new URL('../',import.meta.url);
const review=JSON.parse(readFileSync(new URL('data/postal_country_packs/ax/postal-context/m2-source-review.json',root),'utf8'));
export const sourceDigest=bytes=>'sha256:'+createHash('sha256').update(bytes).digest('hex');

export function profileReference(bytes,reference){
  assert.equal(bytes.length,reference.reviewed_bytes,`content-length:${reference.id}`);
  assert.equal(sourceDigest(bytes),reference.expected_digest,`content-drift:${reference.id}`);
  if(reference.kind==='reviewed-pdf') assert.equal(bytes.subarray(0,5).toString(),'%PDF-',`pdf-signature:${reference.id}`);
  if(reference.markers){const text=bytes.toString('utf8');for(const marker of reference.markers) assert.ok(text.includes(marker),`content-marker:${reference.id}:${marker}`);}
  return {id:reference.id,contentVerified:true};
}

export function profilePcf(bytes){
  const lines=bytes.toString('latin1').split(/\r?\n/).filter(Boolean);
  const all=lines.map(line=>({
    recordId:line.slice(0,5),runningDate:line.slice(5,13),code:line.slice(13,18),nameFi:line.slice(18,48).trim(),nameSv:line.slice(48,78).trim(),effectiveDate:line.slice(102,110),type:line.slice(110,111),region:line.slice(111,116),municipality:line.slice(176,179),recordLength:line.length,
  }));
  const rows=all.filter(row=>row.region==='FI200'&&/^22\d{3}$/.test(row.code));
  const types=Object.fromEntries([...new Set(rows.map(row=>row.type))].sort().map(type=>[type,rows.filter(row=>row.type===type).length]));
  return {rows,profile:{records:rows.length,distinctCodes:new Set(rows.map(row=>row.code)).size,runningDates:[...new Set(rows.map(row=>row.runningDate))],effectiveDates:[...new Set(rows.map(row=>row.effectiveDate))].sort(),recordLengths:[...new Set(rows.map(row=>row.recordLength))],typeCounts:types,normalCodes:rows.filter(row=>row.type==='1').map(row=>row.code).sort(),poBoxCodes:rows.filter(row=>row.type==='2').map(row=>row.code).sort()}};
}

const samePoint=(a,b)=>a[0]===b[0]&&a[1]===b[1];
export function profilePaavo(featureCollection){
  assert.equal(featureCollection.type,'FeatureCollection');
  let polygons=0,multiPolygons=0,valid=0,vertices=0,rings=0,openRings=0,outOfRange=0;
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  const visit=coordinates=>{if(typeof coordinates[0]==='number'){vertices++;const [x,y]=coordinates;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);if(x< -180||x>180||y< -90||y>90) outOfRange++;return;}for(const child of coordinates)visit(child);};
  for(const feature of featureCollection.features){
    assert.ok(['Polygon','MultiPolygon'].includes(feature.geometry?.type),`unsupported-geometry:${feature.geometry?.type}`);
    feature.geometry.type==='Polygon'?polygons++:multiPolygons++;
    if(booleanValid(feature)) valid++;
    visit(feature.geometry.coordinates);
    const parts=feature.geometry.type==='Polygon'?[feature.geometry.coordinates]:feature.geometry.coordinates;
    for(const part of parts)for(const ring of part){rings++;if(!samePoint(ring[0],ring.at(-1)))openRings++;}
  }
  const codes=featureCollection.features.map(feature=>String(feature.properties.posti_alue)).sort();
  return {features:featureCollection.features.length,distinctCodes:new Set(codes).size,codes,polygonFeatures:polygons,multiPolygonFeatures:multiPolygons,booleanValidFeatures:valid,vertices,rings,openRings,outOfRangeCoordinates:outOfRange,bbox:[minX,minY,maxX,maxY],years:[...new Set(featureCollection.features.map(feature=>feature.properties.vuosi))],municipalities:new Set(featureCollection.features.map(feature=>feature.properties.kuntanro)).size,totalAreaSquareMetres:featureCollection.features.reduce((sum,feature)=>sum+Number(feature.properties.pinta_ala),0)};
}

export function validateAxAuditReport(report){
  assert.equal(report.countryCode,'AX');assert.equal(report.references.length,12);assert.equal(report.references.filter(item=>item.contentVerified).length,12);
  assert.equal(report.assignment.currentRecords,37);assert.equal(report.assignment.normalRecords,33);assert.equal(report.assignment.poBoxRecords,4);
  assert.equal(report.geometry.officialStatisticalGeometryRecords,32);assert.equal(report.geometry.booleanValidFeatures,32);assert.equal(report.geometry.openRings,0);assert.equal(report.geometry.outOfRangeCoordinates,0);
  assert.equal(report.join.geometryCodesMissingFromPcf,0);assert.equal(report.join.geometryCodesNotNormalPcf,0);assert.deepEqual(report.join.explicitNonAreaCodes,['22101','22110','22111','22151','22411']);
  assert.equal(report.publishedImmutableDataArtifacts,0);assert.equal(report.realAgidRuntimeVerified,false);assert.equal(report.realAgidAppAreaVisualizationVerified,false);assert.equal(report.countryM2Achieved,false);
  return {references:12,currentCodes:37,statisticalAreas:32,explicitNonAreaCodes:5,countryM2Achieved:false};
}

export function inspectAxSources(sourceDirectory){
  const references=review.references.map(reference=>{
    const bytes=readFileSync(resolve(sourceDirectory,reference.audit_file));profileReference(bytes,reference);
    return {id:reference.id,requestedUrl:reference.url,observedAt:'2026-08-29T09:57:47.357Z',httpStatus:200,contentType:reference.kind,byteLength:bytes.length,responseDigest:sourceDigest(bytes),status:'reviewed',contentVerified:true};
  });
  const pcfRef=review.references.find(item=>item.id==='posti-pcf-20260829');
  const pcfBytes=readFileSync(resolve(sourceDirectory,pcfRef.payload_file));
  assert.equal(pcfBytes.length,pcfRef.payload_bytes,'pcf-payload-length');assert.equal(sourceDigest(pcfBytes),pcfRef.payload_digest,'pcf-payload-drift');
  const pcf=profilePcf(pcfBytes);
  const paavo=profilePaavo(JSON.parse(readFileSync(resolve(sourceDirectory,'paavo-ax-2026.geojson'),'utf8')));
  const pcfCodes=new Set(pcf.rows.map(row=>row.code));const normalCodes=new Set(pcf.profile.normalCodes);const geometryCodes=new Set(paavo.codes);
  const explicitNonAreaCodes=[...pcfCodes].filter(code=>!geometryCodes.has(code)).sort();
  const report={
    schemaVersion:'postal-context-ax-source-review/v1',countryCode:'AX',generatedAt:'2026-08-29T09:57:47.357Z',criterionId:review.m2_criterion.id,mode:'offline-byte-bound-current-assignment-and-official-statistical-geometry-review',references,
    assignment:{currentRecords:pcf.profile.records,distinctCodes:pcf.profile.distinctCodes,releaseDate:pcf.profile.runningDates[0],normalRecords:pcf.profile.typeCounts['1'],poBoxRecords:pcf.profile.typeCounts['2'],normalCodes:pcf.profile.normalCodes,poBoxCodes:pcf.profile.poBoxCodes,effectiveDateRange:[pcf.profile.effectiveDates[0],pcf.profile.effectiveDates.at(-1)],recordLength:pcf.profile.recordLengths[0]},
    geometry:{officialOperatorGeometryRecords:0,officialStatisticalGeometryRecords:paavo.features,derivedGeometryRecords:0,release:'pno_2026',basisYear:paavo.years[0],geometryAuthority:'official_derived_statistical_postal_code_area',polygonFeatures:paavo.polygonFeatures,multiPolygonFeatures:paavo.multiPolygonFeatures,booleanValidFeatures:paavo.booleanValidFeatures,rings:paavo.rings,vertices:paavo.vertices,openRings:paavo.openRings,outOfRangeCoordinates:paavo.outOfRangeCoordinates,bbox:paavo.bbox,municipalities:paavo.municipalities,totalAreaSquareMetres:paavo.totalAreaSquareMetres},
    join:{geometryCodesMissingFromPcf:paavo.codes.filter(code=>!pcfCodes.has(code)).length,geometryCodesNotNormalPcf:paavo.codes.filter(code=>!normalCodes.has(code)).length,normalCodesWithoutGeometry:pcf.profile.normalCodes.filter(code=>!geometryCodes.has(code)),poBoxCodesWithoutGeometry:pcf.profile.poBoxCodes.filter(code=>!geometryCodes.has(code)),explicitNonAreaCodes,statisticalAreaCoverageCodes:paavo.features,currentAssignmentCodes:pcf.profile.records},
    postalPolicy:{pcfAssignmentIsAreaProof:false,paavoIsPostalOperatorPerimeter:false,paavoIsOfficialDerivedStatisticalArea:true,nonAreaCodesReceiveInventedArea:false,addressOrBuildingInferredFromContainment:false,axIdentityPreserved:true},
    rights:{posti:'PCF terms permit third-party disclosure when the terms and download date accompany the data.',statisticsFinland:'Paavo geometry is reusable under CC BY 4.0 with attribution.',alandPost:'Public postcode pages are corroborating references; no separate bulk geometry right is inferred.',legalConclusionClaimed:false},
    quality:{assignmentCoverage:'37 current AX records from PCF 20260829.',statisticalGeometryCoverage:'32 exact current-code joins; all 32 geometries pass Turf booleanValid, ring closure and coordinate-range checks.',nonAreaOutcome:'Five current codes have no Paavo area: four P.O. boxes and postal terminal 22110.',confidence:'high for current PCF assignment and official-derived statistical geometry; no claim of operator perimeter or app readiness.'},
    publishedImmutableDataArtifacts:0,realAgidRuntimeVerified:false,realAgidAppAreaVisualizationVerified:false,countryM2Achieved:false,authenticatedRequests:0,paidOperations:0,contractAcceptances:0,newAccountsRepositoriesOrDestinations:0,rawSourceBodiesInGit:0,
    blockerSummary:'Current assignments and 32 valid official-derived statistical areas are byte-bound and exactly joined, with five explicit non-area outcomes. No approved immutable transformed artifact, AX production loader/API, or real application search-to-translucent-area verification exists, so AX remains M1 and M2 blocked.',
    unblockConditions:['Approve and publish an immutable transformed AX artifact carrying PCF and Paavo attribution, exact bytes and SHA-256 at an authorized destination.','Implement the actual AX pack loader and API while preserving official-derived statistical authority and five explicit non-area outcomes.','Pass real-data search, fit, translucent fill, outline, provenance, failure, clear and re-search verification in the application.'],retryNotBefore:'2026-09-29'
  };
  validateAxAuditReport(report);return report;
}

if(process.argv[1]&&resolve(process.argv[1])===resolve(new URL(import.meta.url).pathname.replace(/^\/(?:([A-Za-z]:))/, '$1'))){
  const sourceDirectory=resolve(process.argv[2]??'.m2-sources-ax');const output=process.argv[3]?resolve(process.argv[3]):null;const report=inspectAxSources(sourceDirectory);if(output)writeFileSync(output,JSON.stringify(report,null,2)+'\n');else console.log(JSON.stringify(report,null,2));
}
