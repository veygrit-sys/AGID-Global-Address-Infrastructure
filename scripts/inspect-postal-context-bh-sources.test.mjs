import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { inspectBhSources, profileBhCatalog, profileBhLandmarkRows, profileBhMetadata, profileBhTermsHtml } from './inspect-postal-context-bh-sources.mjs';
const profile=JSON.parse(readFileSync(new URL('../data/postal_country_packs/bh/postal-context/m2-source-review.json',import.meta.url)));
const row=()=>({n:1,name:'PRIVATE synthetic landmark',l_sm:'PRIVATE synthetic Arabic label',type:'synthetic',ltsnyf:'synthetic',subtype:'synthetic',ltsnyf_lfr_y:'synthetic',block:100,governorate:'Synthetic',lmhfzt:'Synthetic Arabic',x_longitude:1,y_latitude:2,location:{lon:1,lat:2}});
const records=rows=>({total_count:rows.length,results:rows});
const meta=()=>({dataset_id:profile.dataset_probe.dataset_id,fields:Object.entries(profile.dataset_probe.fields).map(([name,type])=>({name,type})),metas:{default:{publisher:profile.dataset_probe.publisher,records_count:1,geometry_types:['Point'],bbox:{geometry:{type:'Polygon'}},data_processed:'2026-01-01T00:00:00Z',metadata_processed:'2026-01-01T00:00:00Z',license:null,license_url:null}}});
const json=value=>new Response(JSON.stringify(value),{headers:{'content-type':'application/json'}});
const terms=()=>{
 const html='<p>'+profile.terms_probe.required_markers.join('</p><p>')+'</p><p>'+profile.terms_probe.page_updated_marker+'</p>';
 const encoded=html.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
 return Buffer.from('<a href="'+profile.terms_probe.linked_license_url+'">license</a><script>$scope.blocks = {"html":'+JSON.stringify(encoded)+',"css":""};</script>');
};
test('BH numeric blocks remain labels and landmark points never become postcode or building evidence',()=>{
 const v=profileBhLandmarkRows(records([row(),{...row(),n:2,name:'second'}]));
 assert.equal(v.observedLandmarkRows,2);assert.equal(v.distinctBlocks,1);assert.equal(v.repeatedBlockGroups,1);assert.equal(v.rowsInRepeatedBlockGroups,2);
 assert.equal(v.numericBlockRows,2);assert.equal(v.validBlockSyntaxRows,2);assert.equal(v.duplicateCoordinateGroups,1);
 for(const key of ['postcodesInferredFromBlock','postalGeometryRecords','civicAddressesVerified','buildingLinksVerified','poBoxSubscribersRetrieved','coordinatesRepaired','rowsDeduplicated'])assert.equal(v[key],0);
 for(const key of ['currentAssignmentVerified','completeNationalCoverageVerified','stableRecordIdentityVerified','providerCrsAndPositionAccuracyVerified'])assert.equal(v[key],false);
 assert.ok(!JSON.stringify(v).includes('PRIVATE'));
});
test('BH invalid, fractional, string, zero and missing block values are not coerced into assignments',()=>{
 const values=[0,99,1300,100.5,'100',null];const v=profileBhLandmarkRows(records(values.map(block=>({...row(),block}))));
 assert.equal(v.invalidBlockRows,5);assert.equal(v.missingBlockRows,1);assert.equal(v.validBlockSyntaxRows,0);assert.equal(v.postcodesInferredFromBlock,0);
});
test('BH conflicting or missing coordinate fields require review, never choosing one silently',()=>{
 const v=profileBhLandmarkRows(records([{...row(),location:{lon:2,lat:1}},{...row(),x_longitude:null},{...row(),y_latitude:91},{...row(),x_longitude:'1'}]));
 assert.equal(v.coordinateFieldsMismatchRows,1);assert.equal(v.missingCoordinateRows,1);assert.equal(v.invalidCoordinateRows,2);assert.equal(v.coordinatesRepaired,0);
});
test('BH counter uniqueness, duplicate rows and bilingual labels are not proof of persistent identity',()=>{
 const v=profileBhLandmarkRows(records([row(),row(),{...row(),n:3,lmhfzt:'another label'}]));
 assert.equal(v.duplicateCounterGroups,1);assert.equal(v.exactDuplicateRowGroups,1);assert.equal(v.ambiguousBilingualGovernorateLabelGroups,1);
 assert.equal(v.countersAreContiguousOneToN,false);assert.equal(v.stableRecordIdentityVerified,false);
 const missing=profileBhLandmarkRows(records([{...row(),name:null,governorate:null,n:0}]));
 assert.equal(missing.missingNameRows,1);assert.equal(missing.missingGovernorateRows,1);assert.equal(missing.invalidCounterRows,1);
});
test('BH source field expansion, private data, polygons, oversized text and wrong envelopes fail closed',()=>{
 for(const bad of [{...row(),owner:'PRIVATE'}, {...row(),location:{type:'Polygon',coordinates:[]}}, {...row(),name:'x'.repeat(1001)}])assert.throws(()=>profileBhLandmarkRows(records([bad])),/bh-row-schema/);
 assert.throws(()=>profileBhLandmarkRows({results:[],total_count:'1'}),/bh-records-envelope/);
 assert.throws(()=>profileBhLandmarkRows(records(Array(101).fill(row()))),/bh-records-envelope/);
});
test('BH metadata keeps the envelope distinct from Point records and null licence fields distinct from no rights',()=>{
 const v=profileBhMetadata(meta());assert.equal(v.metadataBboxGeometryType,'Polygon');assert.equal(v.bboxIsPostalGeometry,false);assert.deepEqual(v.geometryTypes,['Point']);
 assert.equal(v.datasetLicense,null);assert.equal(v.emptyLicenseFieldsDoNotNegatePortalLicense,true);assert.equal(v.postcodeFieldPresent,false);assert.equal(v.completePostcodeBlockAssignment,false);
 for(const mutate of [m=>m.fields.push({name:'owner',type:'text'}),m=>m.metas.default.geometry_types=['Polygon'],m=>m.dataset_id='other',m=>m.metas.default.records_count=101]){const m=meta();mutate(m);assert.throws(()=>profileBhMetadata(m),/bh-metadata-schema/);}
});
test('BH terms are parsed as an encoded JSON string, not executed or mistaken for only the page shell',()=>{
 const v=profileBhTermsHtml(terms());assert.equal(v.status,'terms-observed-not-release-authorization');assert.equal(v.pageContentDate,'2025-10-07');assert.equal(v.linkedLicenseObserved,true);
 assert.match(v.embeddedTermsHtmlDigest,/^sha256:[a-f0-9]{64}$/);assert.equal(v.m2ArtifactRightsCleared,false);assert.equal(v.contractAcceptancePerformed,false);
 assert.throws(()=>profileBhTermsHtml(Buffer.from('<html>terms shell</html>')),/bh-terms-template-shape/);
 assert.throws(()=>profileBhTermsHtml(Buffer.concat([terms(),terms()])),/bh-terms-template-shape/);
 assert.throws(()=>profileBhTermsHtml(Buffer.from('$scope.blocks = {"html": execute(),"css":""};')),/bh-terms-template-shape/);
 assert.throws(()=>profileBhTermsHtml(Buffer.from([255])),/bh-invalid-utf8/);
 assert.equal(profileBhTermsHtml(Buffer.from(terms().toString().replace('October 7th, 2025','unreviewed date'))).status,'terms-require-review');
});
test('BH catalogue searches inspect only metadata and never prove national absence or open subscriber records',()=>{
 const v=profileBhCatalog({total_count:1,results:[{dataset_id:'synthetic-postal-statistics',fields:[{name:'year'},{name:'number'}],metas:{default:{records_count:12}}}]});
 assert.equal(v.returnedDatasetMetadata[0].possiblePostcodeBlockSchema,false);assert.equal(v.underlyingDatasetRecordsRetrieved,0);assert.equal(v.searchIsProofOfNationalAbsence,false);
});
test('BH real-like complete point responses remain separate from M2 and metadata-only gates run before data fetch',async()=>{
 const visited=[];
 const fetcher=async url=>{
  visited.push(url);
  if(url===profile.dataset_probe.metadata_url)return json(meta());
  if(url===profile.dataset_probe.records_url)return json(records([row()]));
  if(url===profile.terms_probe.url)return new Response(terms(),{headers:{'content-type':'text/html'}});
  if(profile.catalog_probes.some(p=>p.url===url))return json({total_count:0,results:[]});
  return new Response('reference shell',{headers:{'content-type':'text/html'}});
 };
 const result=await inspectBhSources(fetcher);
 assert.equal(result.landmarkObservation.validation.completeObservedDatasetResponse,true);
 for(const key of ['countryM2Achieved','realAgidRuntimeVerified','completePostcodeBlockAssignmentVerified','rightsForPublicM2ArtifactCleared'])assert.equal(result[key],false);
 assert.equal(result.sourceDataSnapshotsPersisted,0);assert.equal(result.publishedDataArtifacts,0);assert.ok(!JSON.stringify(result).includes('PRIVATE'));
 assert.ok(visited.every(url=>[...profile.reference_probes,...profile.catalog_probes,profile.terms_probe].some(p=>p.url===url)||[profile.dataset_probe.metadata_url,profile.dataset_probe.records_url].includes(url)));
 const rejected=[];const m=meta();m.fields.push({name:'CPR',type:'text'});
 const bad=await inspectBhSources(async url=>{rejected.push(url);if(url===profile.dataset_probe.metadata_url)return json(m);throw Error('PRIVATE');});
 assert.equal(bad.landmarkObservation.error,'bh-metadata-schema');assert.ok(!rejected.includes(profile.dataset_probe.records_url));assert.ok(!JSON.stringify(bad).includes('PRIVATE'));
});
test('BH changed metadata or truncated responses are not a complete observed dataset',async()=>{
 let calls=0;
 const r=await inspectBhSources(async url=>{
  if(url===profile.dataset_probe.metadata_url){const m=meta();if(calls++)m.metas.default.data_processed='2026-02-01T00:00:00Z';return json(m);}
  if(url===profile.dataset_probe.records_url)return json({total_count:2,results:[row()]});
  throw Error('PRIVATE');
 });
 assert.equal(r.landmarkObservation.validation.metadataUnchangedDuringProbe,false);assert.equal(r.landmarkObservation.validation.completeObservedDatasetResponse,false);assert.equal(r.countryM2Achieved,false);
});
