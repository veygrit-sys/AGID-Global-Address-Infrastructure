import assert from 'node:assert/strict';
import {test} from 'node:test';
import {config,normalizeReferenceText,profileMaldivesUpu,profileMaldivesIslandService,profileMaldivesIslandLayer,profileMaldivesIslandItem,profileMaldivesCensusLinks,profileMaldivesReference,inspectMaldivesObservations,inspectMaldivesSources} from './inspect-postal-context-mv-sources.mjs';
import {sourceDigest} from './lib/postal-context-source-probe.mjs';
const fields={OBJECTID:'esriFieldTypeOID',FCODE:'esriFieldTypeString',atoll:'esriFieldTypeString',islandName:'esriFieldTypeString',capital:'esriFieldTypeString',islandNa_1:'esriFieldTypeString',longitude:'esriFieldTypeString',latitude:'esriFieldTypeString',Area_ha:'esriFieldTypeDouble',category:'esriFieldTypeString',Sector:'esriFieldTypeString',Usage:'esriFieldTypeString',PrimAgency:'esriFieldTypeString',Shape__Area:'esriFieldTypeDouble',Shape__Length:'esriFieldTypeDouble'};
const layer=()=>({id:0,name:'Island',geometryType:'esriGeometryPolygon',objectIdField:'OBJECTID',globalIdField:'',capabilities:'Query',extent:{spatialReference:{wkid:102100,latestWkid:3857}},relationships:[],fields:Object.entries(fields).map(([name,type])=>({name,type,nullable:name!=='OBJECTID',...(name==='FCODE'?{length:15}:{})})),indexes:[{fields:'OBJECTID',isUnique:true}],editingInfo:{dataLastEditDate:1786937951915,schemaLastEditDate:1786937951915}});
const service=()=>({serviceItemId:config.island_identity.item_id,serviceDescription:'Islands',capabilities:'Query',units:'esriMeters',spatialReference:{wkid:102100,latestWkid:3857},layers:[{id:0,name:'Island',geometryType:'esriGeometryPolygon'}],tables:[],maxRecordCount:1000,hasStaticData:false});
const item=()=>({id:config.island_identity.item_id,url:config.island_identity.service_url,name:'island_20240509',title:'island',type:'Feature Service',owner:'LAMP_MLSA',access:'public',spatialReference:'102100',licenseInfo:'',created:1715235387000,modified:1777523997000});
const upu=()=>`5 digits to the right of the locality name. Postcodes for Malé postal region: Malé 20XXX Hulhule 22000 Villingili 21XXX Hulhumale 23000 Postcodes for atolls: ${Array.from({length:20},(_,i)=>String(i+1).padStart(2,'0')+'XXX').join(' ')} Contact 09/2004`;
test('MV dated UPU groups preserve prefix ambiguity and leading zeroes, not assignments',()=>{
 const p=profileMaldivesUpu(upu());assert.equal(p.atollPrefixEntries,20);assert.equal(p.leadingZeroAtollPrefixes,9);assert.deepEqual(p.sharedPatternsAcrossGroups,['20XXX']);assert.equal(p.prefixIsUniqueCountryKey,false);assert.equal(p.currentAllocationVerified,false);assert.equal(p.fullAssignmentsIngested,0);
 for(const changed of [upu().replace('09/2004','09/2026'),upu().replace('01XXX','1XXX'),upu().replace('02XXX','01XXX'),upu()+upu()])assert.throws(()=>profileMaldivesUpu(changed),/mv-upu/);
});
test('MV island service identity and Web Mercator are not postcodes or national row counts',()=>{
 const p=profileMaldivesIslandService(service());assert.equal(p.spatialReference.latestWkid,3857);assert.equal(p.maxRecordCount,1000);assert.equal(p.maxRecordCountIsTotal,false);assert.equal(p.postalAssignmentAuthority,false);
 for(const changed of [{...service(),serviceItemId:'other'},{...service(),units:'degrees'},{...service(),spatialReference:{wkid:4326,latestWkid:4326}},{...service(),capabilities:'Query,Create'},{...service(),error:{code:403}}])assert.throws(()=>profileMaldivesIslandService(changed),/identity/);
});
test('MV island field profile retains nullable FCODE and string coordinate uncertainty',()=>{
 const p=profileMaldivesIslandLayer(layer());assert.equal(p.fieldCount,15);assert.equal(p.fcode.nullable,true);assert.equal(p.fcode.uniqueIndex,false);assert.equal(p.fcode.isPostalCode,false);assert.equal(p.globalIdPresent,false);assert.equal(p.geometryIsLongitudeLatitude,false);assert.equal(p.rowCount,null);assert.equal(p.fcodeDuplicateRate,null);assert.equal(p.coordinateMissingness,null);assert.equal(p.explicitBuildingRelations,0);assert.equal(p.topologyValidated,false);assert.equal(p.editTimeIsDatasetEdition,false);
});
test('MV schema drift, inferred keys and relations fail closed before any feature query',()=>{
 for(const change of [l=>l.fields.push({...l.fields[1]}),l=>l.fields[1].type='esriFieldTypeInteger',l=>l.fields[1].nullable=false,l=>l.fields.find(f=>f.name==='latitude').type='esriFieldTypeDouble',l=>l.relationships.push({name:'building'}),l=>l.globalIdField='GlobalID',l=>l.indexes.push({fields:'FCODE',isUnique:true}),l=>l.editingInfo.dataLastEditDate=Date.now()+86400000]){const l=layer();change(l);assert.throws(()=>profileMaldivesIslandLayer(l),/mv-layer/);}
});
test('MV public item with empty licenseInfo proves access only, not reusable data',()=>{
 const p=profileMaldivesIslandItem(item());assert.equal(p.licenseInfoEmpty,true);assert.equal(p.reusePermissionVerified,false);assert.equal(p.publicAccessIsReusePermission,false);assert.equal(p.itemExtentIsGeometryCrs,false);assert.equal(p.itemMetadataTimeIsFeatureValidity,false);
 for(const changed of [{...item(),url:'https://example.com/private'},{...item(),id:'different'},{...item(),licenseInfo:'new terms need review'},{...item(),access:'private'}])assert.throws(()=>profileMaldivesIslandItem(changed),/binding/);
});
test('MV census links preserve theme and grain; listing dates do not date workbook records',()=>{
 const body='Island &amp; Atoll Level Indicator Sheets October 10, 2024 '+Array.from({length:6},(_,i)=>`<a href="https://statisticsmaldives.gov.mv/mbs/wp-content/uploads/2023/09/synthetic-${i}.xlsx">XLS</a>`).join(' ');const p=profileMaldivesCensusLinks(body);assert.equal(p.workbookLinkCount,6);assert.equal(p.listingDateIsWorkbookEdition,false);assert.equal(p.workbooksDownloaded,0);assert.equal(p.rowsValidated,0);
 assert.throws(()=>profileMaldivesCensusLinks(body.replace('synthetic-0','synthetic-1')),/links/);assert.throws(()=>profileMaldivesCensusLinks(body.replace('https://statisticsmaldives.gov.mv','https://example.com')),/links/);
});
test('MV exact reference digest, PDF text and MIME bindings cannot promote drifting bytes',()=>{
 const b=Buffer.from('%PDF-1.5 synthetic'),text=upu(),ref={kind:'reviewed-pdf',reviewed_digest:sourceDigest(b),reviewed_bytes:b.length,accepted_mime:['application/pdf'],reviewed_text_digest:sourceDigest(normalizeReferenceText(text)),reviewed_profile:profileMaldivesUpu(text)};
 assert.equal(profileMaldivesReference(b,ref,'application/pdf',{pdfText:text}).contentVerified,true);
 assert.throws(()=>profileMaldivesReference(Buffer.concat([b,Buffer.from('x')]),ref,'application/pdf'),/drift/);assert.throws(()=>profileMaldivesReference(b,ref,'text/html'),/mime/);assert.throws(()=>profileMaldivesReference(b,ref,'application/pdf',{pdfText:text+'changed'}),/text-binding/);
});
test('MV HTML application shell is not geometry, data, terms or permission',()=>{
 const b=Buffer.from('<head><title>ArcGIS Web Application</title></head><body>loading</body>'),ref={kind:'unresolved-html-shell',title:'ArcGIS Web Application',reviewed_digest:sourceDigest(b),reviewed_bytes:b.length,accepted_mime:['text/html']};const p=profileMaldivesReference(b,ref,'text/html');assert.equal(p.transportBytesVerified,true);assert.equal(p.contentVerified,false);assert.equal(p.profile.rightsVerified,false);assert.equal(p.sourceDataRecords,0);
});
test('MV observation IDs, timestamps and forged HTTP receipts fail closed',()=>{
 assert.throws(()=>inspectMaldivesObservations([]),/set/);const observations=config.references.map(r=>({id:r.id,requestedUrl:r.url,finalUrl:r.url,redirects:[],observedAt:r.reviewed_observed_at,httpStatus:403,bytes:null,byteLength:0,responseDigest:null}));assert.throws(()=>inspectMaldivesObservations(observations),/receipt/);observations[0].observedAt='2026-08-28T00:00:00.000Z';assert.throws(()=>inspectMaldivesObservations(observations),/binding/);
});
test('MV live inspector skips known denials and performs only exact unauthenticated reference GETs',async()=>{
 const calls=[];const r=await inspectMaldivesSources(async(url,o)=>{calls.push(url);assert.ok(config.references.some(x=>x.url===url&&x.kind!=='http-blocked'));assert.equal(o.body,undefined);assert.equal(o.headers,undefined);assert.equal(o.method,undefined);assert.equal(o.redirect,'manual');assert.ok(!url.includes('/query'));return new Response('Unavailable',{status:503});});assert.equal(calls.length,7);assert.equal(r.references.filter(x=>x.status==='known-access-failure-not-retried').length,5);assert.equal(r.featureQueries,0);assert.equal(r.countryM2Achieved,false);assert.equal(r.quality.assignmentCoverage,null);
});
test('MV redirects, malformed JSON, unknown content and upstream secrets never become evidence',async()=>{
 const r=await inspectMaldivesSources(async()=>new Response(null,{status:302,headers:{location:'http://example.com/'}}));assert.ok(r.references.filter(x=>x.status==='review-failed').every(x=>x.failureKind==='unapproved-reference-host'));
 const e=await inspectMaldivesSources(async()=>{throw Error('token=secret-not-for-report');});assert.ok(!JSON.stringify(e).includes('secret-not-for-report'));
 const b=Buffer.from('not-json');assert.throws(()=>profileMaldivesReference(b,{kind:'reviewed-json',reviewed_digest:sourceDigest(b),reviewed_bytes:b.length,accepted_mime:['application/json']},'application/json'),/mv-json/);
 assert.throws(()=>profileMaldivesReference(Buffer.alloc(4194305),{},'application/json'),/byte-limit/);
});
