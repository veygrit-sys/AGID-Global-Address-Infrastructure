import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {fetchBoundedOfficialResponse,sourceDigest} from './lib/postal-context-source-probe.mjs';
import {createPostalCurlFetcher} from './lib/postal-context-curl-fetch.mjs';

export const config=JSON.parse(readFileSync(new URL('../data/postal_country_packs/mv/postal-context/m2-source-review.json',import.meta.url)));
const hosts=new Set(config.live_allowed_hosts);
export const normalizeReferenceText=s=>s.normalize('NFC').replace(/\s+/gu,' ').trim();
const plain=s=>normalizeReferenceText(s.replace(/<!--[\s\S]*?-->/g,' ').replace(/<(script|style|head)\b[^>]*>[\s\S]*?<\/\1>/gi,' ').replace(/<[^>]*>/g,' ').replace(/&amp;|&#038;/g,'&'));
const mimeBase=m=>(m??'').split(';')[0].trim().toLowerCase();
const fail=code=>{throw Error('mv-'+code);};
const safeFailure=e=>/^(mv-[a-z-]+|curl-[a-z-]+|reference-[a-z-]+|unapproved-reference-host|empty-reference|redirect-without-location)$/.test(e?.message??'')?e.message:['AbortError','TimeoutError'].includes(e?.name)?'request-timeout':'network-or-parser-error';
const finiteDate=n=>Number.isSafeInteger(n)&&n>0&&n<=Date.now();

export function profileMaldivesUpu(text){
  const p=normalizeReferenceText(text),starts=p.split('Postcodes for Malé postal region:');
  if(starts.length!==2||!p.includes('5 digits to the right of the locality name.')||!p.includes('09/2004'))fail('upu-structure');
  const groups=starts[1].split('Postcodes for atolls:');if(groups.length!==2)fail('upu-structure');
  const region=[...groups[0].matchAll(/\b(?:\d{2}XXX|\d{5})\b/g)].map(m=>m[0]);
  const atollSection=groups[1].split('Contact');if(atollSection.length!==2)fail('upu-structure');
  const atolls=[...atollSection[0].matchAll(/\b\d{2}XXX\b/g)].map(m=>m[0]);
  if(region.length!==4||atolls.length!==20||new Set(atolls).size!==20||region.join(',')!=='20XXX,22000,21XXX,23000')fail('upu-prefix-table');
  const sorted=atolls.toSorted();if(sorted.some((v,i)=>v!==String(i+1).padStart(2,'0')+'XXX'))fail('upu-prefix-table');
  return {printedEdition:'09/2004',postalCodeWidth:5,regionEntries:4,atollPrefixEntries:20,leadingZeroAtollPrefixes:atolls.filter(x=>x[0]==='0').length,sharedPatternsAcrossGroups:[...new Set(region.filter(x=>atolls.includes(x)))],prefixIsUniqueCountryKey:false,fullAssignmentsIngested:0,exampleAddressesIngested:0,currentAllocationVerified:false};
}

export function profileMaldivesIslandService(s){
  if(s.error||s.serviceItemId!==config.island_identity.item_id||s.serviceDescription!=='Islands'||s.capabilities!=='Query'||s.units!=='esriMeters'||s.spatialReference?.wkid!==102100||s.spatialReference.latestWkid!==3857||s.layers?.length!==1||s.layers[0].id!==0||s.layers[0].name!=='Island'||s.layers[0].geometryType!=='esriGeometryPolygon'||s.tables?.length!==0)fail('service-identity');
  return {itemId:s.serviceItemId,layerId:0,geometryType:'esriGeometryPolygon',spatialReference:{wkid:102100,latestWkid:3857},units:'esriMeters',maxRecordCount:s.maxRecordCount,maxRecordCountIsTotal:false,hasStaticData:s.hasStaticData,capabilities:s.capabilities,copyrightText:s.copyrightText,postalAssignmentAuthority:false,featureQueries:0};
}

export function profileMaldivesIslandLayer(l){
  if(l.error||l.id!==0||l.name!=='Island'||l.geometryType!=='esriGeometryPolygon'||l.objectIdField!=='OBJECTID'||l.globalIdField!==''||l.capabilities!=='Query'||l.extent?.spatialReference?.latestWkid!==3857||l.extent?.spatialReference?.wkid!==102100||l.relationships?.length!==0)fail('layer-identity');
  if(!Array.isArray(l.fields)||l.fields.length!==15||new Set(l.fields.map(f=>f.name)).size!==l.fields.length)fail('layer-field-set');
  const expected={OBJECTID:'esriFieldTypeOID',FCODE:'esriFieldTypeString',atoll:'esriFieldTypeString',islandName:'esriFieldTypeString',capital:'esriFieldTypeString',islandNa_1:'esriFieldTypeString',longitude:'esriFieldTypeString',latitude:'esriFieldTypeString',Area_ha:'esriFieldTypeDouble',category:'esriFieldTypeString',Sector:'esriFieldTypeString',Usage:'esriFieldTypeString',PrimAgency:'esriFieldTypeString',Shape__Area:'esriFieldTypeDouble',Shape__Length:'esriFieldTypeDouble'};
  for(const f of l.fields)if(expected[f.name]!==f.type||typeof f.nullable!=='boolean')fail('layer-field-type');
  const byName=Object.fromEntries(l.fields.map(f=>[f.name,f]));
  if(byName.OBJECTID.nullable||!byName.FCODE.nullable||byName.FCODE.length!==15||!byName.latitude.nullable||!byName.longitude.nullable)fail('layer-field-semantics');
  if(!Array.isArray(l.indexes)||l.indexes.filter(x=>x.isUnique===true).length!==1||!l.indexes.some(x=>x.fields==='OBJECTID'&&x.isUnique===true))fail('layer-key');
  if(!finiteDate(l.editingInfo?.dataLastEditDate)||!finiteDate(l.editingInfo?.schemaLastEditDate))fail('layer-date');
  return {layerId:0,fieldCount:15,fieldSchema:l.fields.map(f=>({name:f.name,type:f.type,nullable:f.nullable,...(f.length?{length:f.length}:{})})),snapshotKey:'OBJECTID',globalIdPresent:false,fcode:{type:'string',nullable:true,length:15,uniqueIndex:false,isPostalCode:false},coordinateAttributes:{latitude:'nullable-string-unvalidated',longitude:'nullable-string-unvalidated'},alternateNameSemantics:'islandNa_1-not-assumed-to-be-a-language-or-identifier',geometryCrs:'EPSG:3857',geometryIsLongitudeLatitude:false,postalCodeFieldPresent:false,explicitBuildingRelations:0,dataLastEdit:new Date(l.editingInfo.dataLastEditDate).toISOString(),schemaLastEdit:new Date(l.editingInfo.schemaLastEditDate).toISOString(),editTimeIsDatasetEdition:false,rowCount:null,fcodeDuplicateRate:null,coordinateMissingness:null,topologyValidated:false};
}

export function profileMaldivesIslandItem(item){
  if(item.error||item.id!==config.island_identity.item_id||item.url!==config.island_identity.service_url||item.name!=='island_20240509'||item.title!=='island'||item.type!=='Feature Service'||item.owner!=='LAMP_MLSA'||item.access!=='public'||item.spatialReference!=='102100'||item.licenseInfo!==''||!finiteDate(item.created)||!finiteDate(item.modified))fail('item-binding');
  return {id:item.id,owner:item.owner,name:item.name,type:item.type,access:item.access,serviceUrl:item.url,itemCreated:new Date(item.created).toISOString(),itemModified:new Date(item.modified).toISOString(),accessInformation:item.accessInformation,licenseInfoEmpty:true,reusePermissionVerified:false,publicAccessIsReusePermission:false,itemExtentIsGeometryCrs:false,itemMetadataTimeIsFeatureValidity:false,volatileFieldsExcluded:['numViews','lastViewed','size','scoreCompleteness'],featureQueries:0};
}

export function profileMaldivesCensusLinks(html){
  const p=plain(html);if(!p.includes('Island & Atoll Level Indicator Sheets')||!p.includes('October 10, 2024'))fail('census-page');
  const links=[...html.matchAll(/href=["']([^"']+\.xlsx)["']/gi)].map(m=>new URL(m[1]));
  if(links.length!==6||new Set(links.map(x=>x.href)).size!==6||links.some(x=>x.protocol!=='https:'||x.hostname!=='statisticsmaldives.gov.mv'||!x.pathname.startsWith('/mbs/wp-content/uploads/2023/')))fail('census-links');
  return {listingDate:'2024-10-10',censusReferenceYear:2022,workbookLinkCount:6,themes:['population','employment'],grains:['definition','atoll','island'],listingDateIsWorkbookEdition:false,workbooksDownloaded:0,rowsValidated:0,postcodeAssignments:0,householdDataRequested:false};
}

export function profileMaldivesReference(bytes,ref,mime,extra={}){
  if(!Buffer.isBuffer(bytes)||bytes.length>config.limits.max_response_bytes)fail('byte-limit');
  if(!ref.reviewed_digest||bytes.length!==ref.reviewed_bytes||sourceDigest(bytes)!==ref.reviewed_digest)fail('content-drift');
  if(!ref.accepted_mime.includes(mimeBase(mime)))fail('mime');
  let profile;
  if(ref.kind==='reviewed-pdf'){
    if(bytes.subarray(0,5).toString()!=='%PDF-')fail('pdf-header');
    if(extra.pdfText!==undefined){if(sourceDigest(normalizeReferenceText(extra.pdfText))!==ref.reviewed_text_digest)fail('pdf-text-binding');profile=profileMaldivesUpu(extra.pdfText);try{assert.deepEqual(profile,ref.reviewed_profile);}catch{fail('pdf-profile-binding');}}
    else profile={...ref.reviewed_profile,priorVisualReviewReusedByExactBytes:true};
  }else if(ref.kind==='reviewed-json'){
    let parsed;try{parsed=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{fail('json');}
    if(ref.id==='maldives-onemap-island-api-2024')profile=profileMaldivesIslandService(parsed);
    else if(ref.id==='maldives-onemap-island-layer')profile=profileMaldivesIslandLayer(parsed);
    else if(ref.id==='maldives-onemap-island-item')profile=profileMaldivesIslandItem(parsed);
    else fail('unknown-reference');
  }else{
    let html;try{html=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{fail('encoding');}
    const head=html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1],titles=[...(head??'').matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)];
    if(titles.length!==1||normalizeReferenceText(titles[0][1])!==ref.title)fail('title');
    if(ref.kind==='unresolved-html-shell')return {status:'html-shell-not-data-or-terms',contentVerified:false,transportBytesVerified:true,profile:{recordsVerified:false,rightsVerified:false},sourceDataRecords:0};
    if(ref.id==='maldives-census-island-atoll-2022')profile=profileMaldivesCensusLinks(html);
    else if(ref.id==='maldives-bureau-statistics-gis-maps'){
      if(!plain(html).includes('GIS Maps Published on April 15, 2025'))fail('gis-page');
      profile={listingDate:'2025-04-15',landingMetadataOnly:true,embeddedMapRecordsVerified:false,disclaimerBodyVerified:false};
    }else fail('unknown-reference');
  }
  return {status:'reference-verified-not-data',contentVerified:true,transportBytesVerified:true,profile,sourceDataRecords:0};
}

function empty(mode){return {schemaVersion:'postal-context-mv-source-review/v1',countryCode:'MV',generatedAt:new Date().toISOString(),mode,criterionId:config.m2_criterion.id,references:[],currentAssignmentRowsValidated:0,productionGeometryRecords:0,civicBuildingRelations:0,publishedDataArtifacts:0,realAgidRuntimeVerified:false,quality:{assignmentCoverage:null,fcodeUniqueness:null,coordinateMissingness:null,geometryTopology:null,reason:'Schema and reference evidence only; no current rights-cleared real dataset validated.'},rawBodiesPersistedInGit:0,paidOperations:0,authenticatedRequests:0,featureQueries:0,formSubmissions:0,contractAcceptancePerformed:false,countryM2Achieved:false};}

export function inspectMaldivesObservations(observations){
  if(observations.length!==config.references.length||new Set(observations.map(x=>x.id)).size!==observations.length)fail('observation-set');
  const report=empty('offline-verification-of-initial-reference-acquisition');
  for(const ref of config.references){const o=observations.find(x=>x.id===ref.id);
    if(!o||o.requestedUrl!==ref.url||o.observedAt!==ref.reviewed_observed_at||!Number.isFinite(Date.parse(o.observedAt))||Date.parse(o.observedAt)>Date.now()||o.finalUrl!==ref.url||o.redirects?.length)fail('observation-binding');
    const row={id:ref.id,requestedUrl:ref.url,observedAt:o.observedAt,httpStatus:o.httpStatus,networkRequestsDuringVerification:0,sourceDataRecords:0};
    if(ref.kind==='http-blocked'){if(o.httpStatus!==ref.reviewed_http_status||o.bytes||o.byteLength!==0||o.responseDigest!==null)fail('http-receipt');report.references.push({...row,status:'http-access-failed',contentVerified:false,sourceDocumentDigest:null});continue;}
    if(o.httpStatus!==200||!Buffer.isBuffer(o.bytes)||o.byteLength!==o.bytes.length||o.responseDigest!==sourceDigest(o.bytes))fail('receipt-binding');
    const p=profileMaldivesReference(o.bytes,ref,o.contentType,{pdfText:o.pdfText});report.references.push({...row,finalUrl:ref.url,contentType:o.contentType,lastModified:o.lastModified??null,byteLength:o.byteLength,responseDigest:o.responseDigest,...p,sourceDocumentDigest:p.contentVerified?o.responseDigest:null});
  }report.completedAt=new Date().toISOString();return report;
}

export async function inspectMaldivesSources(fetcher=fetch){
  const report=empty('bounded-public-reference-check');
  for(const ref of config.references){
    if(ref.kind==='http-blocked'){report.references.push({id:ref.id,requestedUrl:ref.url,status:'known-access-failure-not-retried',contentVerified:false,sourceDocumentDigest:null,sourceDataRecords:0});continue;}
    let row={id:ref.id,requestedUrl:ref.url};try{
      const {metadata:m,bytes}=await fetchBoundedOfficialResponse(ref.url,{allowedHosts:hosts,fetcher,maxBytes:config.limits.max_response_bytes});
      if(m.finalUrl!==ref.url||m.redirects.length)fail('unreviewed-redirect');
      row={...row,observedAt:new Date().toISOString(),httpStatus:m.httpStatus,contentType:m.contentType,lastModified:m.lastModified,byteLength:bytes?.length??0,responseDigest:bytes?sourceDigest(bytes):null};
      const p=bytes?profileMaldivesReference(bytes,ref,m.contentType):{status:'http-access-failed',contentVerified:false,sourceDataRecords:0};report.references.push({...row,...p,sourceDocumentDigest:p.contentVerified?row.responseDigest:null});
    }catch(e){report.references.push({...row,observedAt:row.observedAt??new Date().toISOString(),status:'review-failed',failureKind:safeFailure(e),contentVerified:false,sourceDocumentDigest:null,sourceDataRecords:0});}
  }report.completedAt=new Date().toISOString();return report;
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2),o={};if(args.length%2)fail('cli-arguments');
  for(let i=0;i<args.length;i+=2){if(!['--report','--curl'].includes(args[i])||Object.hasOwn(o,args[i]))fail('cli-arguments');o[args[i]]=args[i+1];}
  if(!o['--report'])fail('report-required');const path=resolve(o['--report']);if(existsSync(path))fail('report-exists');
  const report=await inspectMaldivesSources(o['--curl']?createPostalCurlFetcher(o['--curl'],hosts):fetch);mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({report:path,results:report.references.map(r=>({id:r.id,status:r.status,failure:r.failureKind})),m2:false}));
}
