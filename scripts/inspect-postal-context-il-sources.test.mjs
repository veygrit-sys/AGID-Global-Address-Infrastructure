import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {inspectIlSources,profileIlStreetMetadata,profileIlStreetPage} from './inspect-postal-context-il-sources.mjs';
const P=JSON.parse(readFileSync(new URL('../data/postal_country_packs/il/postal-context/m2-source-review.json',import.meta.url))),S=P.street_probe;
const body=result=>Buffer.from(JSON.stringify({success:true,result}));
const resource=()=>({id:S.resource_id,format:'CSV',datastore_active:true,last_modified:'2026-08-16T00:30:50.123456',hash:'',
  url:`https://aws-e.data.gov.il/dataset/${S.dataset_id}/resource/${S.resource_id}/download/synthetic.csv`});
const metadata=()=>({id:S.dataset_id,name:S.dataset_name,organization:{name:S.organization_name},license_id:'',license_title:'',metadata_modified:'2026-08-16T00:31:01.123456',num_resources:1,resources:[resource()],maintainer_email:'SYNTHETIC@example.invalid'});
const row=(id=1,locality=123,street=9000)=>({_id:id,'סמל_ישוב':locality,'שם_ישוב':'SYNTHETIC LOCALITY','סמל_רחוב':street,'שם_רחוב':'SYNTHETIC STREET'});
const page=(rows=[row()],offset=0,total=rows.length+offset)=>({resource_id:S.resource_id,limit:50,records_format:'objects',include_total:true,total_was_estimated:false,total,fields:S.fields,records:rows});
const sampleRows=offset=>Array.from({length:50},(_,i)=>row(offset+i+1,123,offset+i+1));
const response=result=>new Response(body(result),{headers:{'content-type':'application/json;charset=utf-8'}});

test('IL street metadata records missing item licence without granting rights or following bulk URLs',()=>{
  const p=profileIlStreetMetadata(body(metadata()));assert.equal(p.declaredLicenseId,'');assert.equal(p.declaredLicenseTitle,'');
  assert.equal(p.productionRedistributionCleared,false);assert.equal(p.currentTermsPinned,false);assert.equal(p.downloadFetched,false);assert.equal(p.postalAssignmentAuthority,false);
  assert.equal(p.metadataTimezone,'not-stated');assert.equal(p.assignmentValidity,null);assert.ok(!JSON.stringify(p).includes('SYNTHETIC@example.invalid'));
});
test('IL metadata pins the exact publisher/resource and rejects off-site download lineage',()=>{
  for(const d of [{...metadata(),name:'other'},{...metadata(),organization:{name:'other'}},{...metadata(),resources:[]},{...metadata(),resources:[resource(),resource()],num_resources:2},
    {...metadata(),resources:[{...resource(),url:'https://unapproved.invalid/private.csv'}]}, {...metadata(),resources:[{...resource(),datastore_active:false}]}])assert.throws(()=>profileIlStreetMetadata(body(d)),/il-/);
});
test('IL compares locality plus street code, not street code alone, without generating postal or civic relations',()=>{
  const rows=[row(),row(2,124),row(3,123,101),{...row(4,124,101),'שם_רחוב':'SYNTHETIC LOCALITY'}];
  const p=profileIlStreetPage(body(page(rows)),0);
  assert.equal(p.observedRows,4);assert.equal(p.distinctLocalityCodes,2);assert.equal(p.distinctStreetCodes,2);assert.equal(p.streetCodesSharedAcrossLocalities,2);
  assert.equal(p.excessDuplicateCompositeKeys,0);assert.equal(p.code9000Rows,2);assert.equal(p.sameLocalityAndStreetLabelRows,1);assert.equal(p.numericTransportCodeFields,8);
  for(const k of ['postalAssignments','civicAddressRelations','exactBuildingRelations','coordinates','agidRelations','sourceRowsPersisted'])assert.equal(p[k],0);
  assert.equal(p.geometryType,'none');assert.equal(p.fullSnapshotVerified,false);assert.equal(p.stableCivicIdentityVerified,false);assert.ok(!JSON.stringify(p).includes('SYNTHETIC STREET'));
});
test('IL preserves string code identity without padding and measures duplicate composite keys',()=>{
  const p=profileIlStreetPage(body(page([row(1,'00123','00101'),row(2,'00123','00101'),row(3,123,101)])),0);
  assert.equal(p.stringTransportCodeFields,4);assert.equal(p.numericTransportCodeFields,2);assert.equal(p.distinctLocalityCodes,2);assert.equal(p.excessDuplicateCompositeKeys,1);assert.equal(p.duplicateCompositeKeyRate,1/3);
});
test('IL detects missing/invalid fields, inconsistent labels and non-increasing row IDs without repair',()=>{
  const rows=[row(),{...row(2),'שם_רחוב':null}, {...row(3,0,3.2),'שם_ישוב':''}, {...row(4),'שם_ישוב':'OTHER SYNTHETIC'},row(4)];
  const p=profileIlStreetPage(body(page(rows)),0);assert.equal(p.invalidCodeRows,1);assert.equal(p.invalidNameRows,1);assert.equal(p.missingNameRows,2);
  assert.equal(p.excessDuplicateRowIds,1);assert.equal(p.localityCodesWithMultipleLabels,1);assert.equal(p.observedShapeValid,false);assert.equal(p.strictlyIncreasingRowIds,false);
});
test('IL tuple digest ignores row order but keeps multiplicity and different locality keys',()=>{
  const a=row(),b=row(2,124,101),digest=rows=>profileIlStreetPage(body(page(rows)),0).normalizedTupleMultisetDigest;
  assert.equal(digest([a,b]),digest([b,a]));assert.notEqual(digest([a,b]),digest([a,b,row(3)]));
});
test('IL refuses unknown or sensitive columns and schema/resource drift rather than hiding them',()=>{
  for(const d of [{...page(),resource_id:'other'},{...page(),fields:[...S.fields,{id:'postcode',type:'text'}]},page([{...row(),owner:'SYNTHETIC PRIVATE'}]),
    {...page(),limit:100},{...page(),total_was_estimated:true},{...page(),records:[]},{...page(),total:51}])assert.throws(()=>profileIlStreetPage(body(d),0),/il-/);
  assert.throws(()=>profileIlStreetPage(body(page()),100),/il-offset/);
});
test('IL limits bytes, text, integers and encoding; malformed JSON never becomes an empty-success report',()=>{
  for(const b of [Buffer.from('not json'),Buffer.from([0xff]),Buffer.alloc(P.limits.max_response_bytes+1),Buffer.from('{"success":false,"result":{}}')])assert.throws(()=>profileIlStreetPage(b,0),/il-/);
  assert.throws(()=>profileIlStreetPage(body(page([row(Number.MAX_SAFE_INTEGER+1)])),0),/il-row-shape/);
  const p=profileIlStreetPage(body(page([{...row(),'שם_רחוב':'x'.repeat(257)}])),0);assert.equal(p.invalidNameRows,1);assert.equal(p.observedShapeValid,false);
});
test('IL inspection uses three fixed sorted pages, no postal queries, and separates sample stability from M2',async()=>{
  const calls=[];
  const report=await inspectIlSources(async url=>{
    calls.push(url);const u=new URL(url);
    if(url===S.metadata_url)return response(metadata());
    if(u.pathname==='/api/3/action/datastore_search'){assert.equal(u.searchParams.get('limit'),'50');assert.equal(u.searchParams.get('sort'),'_id asc');return response(page(sampleRows(Number(u.searchParams.get('offset'))),Number(u.searchParams.get('offset')),120));}
    return new Response(null,{status:404});
  });
  assert.equal(calls.length,10);assert.equal(report.streetPages.length,3);assert.equal(report.sampleConsistency.initialRowObservations,100);
  assert.equal(report.sampleConsistency.byteIdenticalRepeat,true);assert.equal(report.sampleConsistency.tupleMultisetIdenticalRepeat,true);assert.equal(report.sampleConsistency.pageRowIdRangesDisjoint,true);
  assert.equal(report.sampleConsistency.metadataProjectionStable,true);assert.equal(report.sampleConsistency.atomicSnapshotVerified,false);
  assert.equal(report.postalLookupRequests,0);assert.equal(report.bulkDownloadRequests,0);assert.equal(report.countryM2Achieved,false);
  assert.ok(!calls.some(u=>u.startsWith('https://aws-e.')));assert.ok(!JSON.stringify(report).includes('SYNTHETIC@example.invalid'));
});
test('IL stops on metadata failure, blocks unapproved redirects and sanitizes network errors',async()=>{
  const calls=[];
  const report=await inspectIlSources(async url=>{calls.push(url);if(url===S.metadata_url)throw new Error('SYNTHETIC-SECRET');return new Response(null,{status:302,headers:{location:'https://unapproved.invalid/'}});});
  assert.equal(report.streetPages.length,0);assert.equal(report.inspectionError,'network-or-parser-error');assert.equal(calls.length,6);assert.ok(!JSON.stringify(report).includes('SYNTHETIC-SECRET'));
});
test('IL preserves failed-page receipt and stops, instead of accepting an HTML error as JSON data',async()=>{
  let pageCalls=0;
  const report=await inspectIlSources(async url=>{if(url===S.metadata_url)return response(metadata());if(new URL(url).pathname==='/api/3/action/datastore_search'){pageCalls++;return new Response('error',{headers:{'content-type':'text/html'}});}return new Response(null,{status:404});});
  assert.equal(pageCalls,1);assert.equal(report.streetPages[0].status,'unexpected-mime');assert.match(report.streetPages[0].responseDigest,/^sha256:/);assert.equal(report.sampleConsistency.initialRowObservations,0);
});
