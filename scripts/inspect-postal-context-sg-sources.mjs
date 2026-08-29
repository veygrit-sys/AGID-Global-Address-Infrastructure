import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export const config=JSON.parse(readFileSync(new URL('../data/postal_country_packs/sg/postal-context/m2-source-review.json',import.meta.url),'utf8'));
const fail=message=>{throw new Error(`sg-${message}`)};
export const sourceDigest=bytes=>'sha256:'+createHash('sha256').update(bytes).digest('hex');
const has=(text,marker)=>text.toLowerCase().includes(marker.toLowerCase());

const stringValues=(text,name)=>[...text.matchAll(new RegExp('\\\\"'+name+'\\\\":\\\\"([^\\\\"]*)\\\\"','g'))].map(match=>match[1]);
const numberValues=(text,name)=>[...text.matchAll(new RegExp('\\\\"'+name+'\\\\":(-?[0-9.]+)','g'))].map(match=>match[1]);

export function profileDwellingPreview(bytes){
 const text=bytes.toString('utf8');
 const featureRows=(text.match(/\\\"type\\\":\\\"Feature\\\"/g)||[]).length;
 const postal=stringValues(text,'POSTAL_CODE'),objectIds=numberValues(text,'OBJECTID');
 const houses=stringValues(text,'HOUSE_BLK_NO'),streets=stringValues(text,'STREET_NAME');
 const dwellingTypes=stringValues(text,'D_TYPE'),units=numberValues(text,'NO_OF_UNITS');
 const updateDates=stringValues(text,'FMEL_UPD_D');
 const coordinates=[...text.matchAll(/\\\"coordinates\\\":\[(-?[0-9.]+),(-?[0-9.]+)\]/g)].map(match=>match[1]+','+match[2]);
 if(featureRows!==1420||objectIds.length!==featureRows||coordinates.length!==featureRows)fail('dwelling-preview-shape');
 return {
   grain:'state-private-residential-property-point-preview',featureRows,
   objectIds:{rows:objectIds.length,distinct:new Set(objectIds).size,duplicateRows:objectIds.length-new Set(objectIds).size},
   postalCodes:{rows:postal.length,missing:featureRows-postal.length,validSixDigits:postal.filter(value=>/^[0-9]{6}$/.test(value)).length,distinct:new Set(postal).size},
   houseBlockNumbers:{rows:houses.length,missing:featureRows-houses.length,distinct:new Set(houses).size},
   streetNames:{rows:streets.length,missing:featureRows-streets.length,distinct:new Set(streets).size},
   dwellingTypes:{rows:dwellingTypes.length,missing:featureRows-dwellingTypes.length,distinct:new Set(dwellingTypes).size},
   units:{rows:units.length,missing:featureRows-units.length,distinct:new Set(units).size},
   coordinates:{rows:coordinates.length,missing:featureRows-coordinates.length,distinct:new Set(coordinates).size,sharedRows:coordinates.length-new Set(coordinates).size},
   updateDates:{rows:updateDates.length,missing:featureRows-updateDates.length,distinct:new Set(updateDates).size,min:[...updateDates].sort()[0]??null,max:[...updateDates].sort().at(-1)??null},
   previewCompletenessVerified:false,nationalPostalCoverageVerified:false,sourceRowsExported:0
 };
}

export function profileReference(bytes,ref){
 if(sourceDigest(bytes)!==ref.expected_digest||bytes.length!==ref.reviewed_bytes)fail('content-drift');
 if(ref.kind==='reviewed-pdf'){
   if(bytes.subarray(0,5).toString()!=='%PDF-')fail('pdf-signature');
   return {...ref.manual_pdf_review,visual_review_bound_by_exact_bytes:true};
 }
 const text=bytes.toString('utf8');
 const missingMarkers=(ref.markers??[]).filter(marker=>!has(text,marker));
 if(missingMarkers.length)fail('content-marker');
 if(ref.kind==='dataset-page')return {...profileDwellingPreview(bytes),datasetId:ref.dataset_id,declaredScope:ref.declared_scope,declaredDataPeriod:ref.declared_data_period,pageLastUpdated:ref.page_last_updated,previewMayBeTruncated:ref.preview_may_be_truncated};
 return {markersVerified:ref.markers.length,sourceDataRows:0};
}

export function inspectSingaporeObservations(observations){
 if(observations.length!==config.references.length||new Set(observations.map(item=>item.id)).size!==observations.length)fail('observation-set');
 const references=[];let dwellingPreview=null;
 for(const ref of config.references){
   const observation=observations.find(item=>item.id===ref.id);
   if(!observation||observation.requestedUrl!==ref.url||!Number.isFinite(Date.parse(observation.observedAt))||Date.parse(observation.observedAt)>Date.now())fail('observation-binding');
   const base={id:ref.id,requestedUrl:ref.url,observedAt:observation.observedAt,sourceDataRecords:0};
   if(ref.kind==='expected-http-failure'){
     if(observation.httpStatus!==ref.expected_http_status||observation.bytes||observation.responseDigest)fail('failure-binding');
     references.push({...base,finalUrl:observation.finalUrl,httpStatus:observation.httpStatus,contentType:observation.contentType??null,status:'expected-acquisition-failure',failureKind:ref.reviewed_failure,contentVerified:false});
     continue;
   }
   if(observation.httpStatus!==200||observation.finalUrl!==ref.url||!observation.bytes||observation.byteLength!==observation.bytes.length||observation.responseDigest!==sourceDigest(observation.bytes))fail('receipt-binding');
   if((observation.contentType??'').split(';')[0]!==ref.mime||(observation.lastModified??null)!==(ref.reviewed_last_modified??null))fail('metadata-binding');
   const profile=profileReference(observation.bytes,ref);if(ref.kind==='dataset-page')dwellingPreview=profile;
   references.push({...base,finalUrl:observation.finalUrl,httpStatus:200,contentType:observation.contentType,lastModified:observation.lastModified??null,byteLength:observation.bytes.length,responseDigest:sourceDigest(observation.bytes),sourceDocumentDigest:sourceDigest(observation.bytes),status:ref.kind==='dataset-page'?'reviewed-public-preview-not-m2':'reviewed-reference-not-m2',contentVerified:true,profile});
 }
 if(!dwellingPreview)fail('missing-dwelling-preview');
 const generatedAt=new Date(Math.max(...observations.map(item=>Date.parse(item.observedAt)))).toISOString();
 return {schemaVersion:'postal-context-sg-source-review/v1',countryCode:'SG',generatedAt,criterionId:config.m2_definition.id,mode:'offline-byte-bound-review',references,dwellingPreview,
   rights:config.rights_gate,postalPolicy:config.policy,currentAssignmentRowsValidated:0,officialPostalGeometryRecords:0,derivedPostalGeometryRecords:0,productionGeometryRecords:0,
   explicitAddressBuildingRelations:0,publishedImmutableDataArtifacts:0,realAgidRuntimeVerified:false,countryM2Achieved:false,
   sourcePreviewRecordsInspected:dwellingPreview.featureRows,datasetApiCalls:0,oneMapApiCalls:0,authenticatedRequests:0,paidOperations:0,explicitContractAcceptances:0,newAccountsOrRepositories:0,rawSourceBodiesInGit:0,
   blockerSummary:'No approved immutable real Singapore point artifact was published or verified in AGID. The exact public dwelling preview is narrow and not completeness-guaranteed; SingPost national data is subscription-restricted, and OneMap/data.gov.sg API use was not authorized or invoked.'};
}

async function acquire(directory){
 if(existsSync(directory))fail('acquisition-directory-exists');mkdirSync(directory,{recursive:true});
 for(const ref of config.references){
   const receipt={id:ref.id,requestedUrl:ref.url,observedAt:new Date().toISOString()};
   try{
     const url=new URL(ref.url);if(!config.live_allowed_hosts.includes(url.hostname))fail('host');
     const response=await fetch(url,{redirect:'follow',headers:{'user-agent':'AGID-Postal-Context-M2-Audit/1.0'}});
     const bytes=Buffer.from(await response.arrayBuffer());
     Object.assign(receipt,{finalUrl:response.url,httpStatus:response.status,contentType:response.headers.get('content-type'),lastModified:response.headers.get('last-modified'),byteLength:bytes.length});
     if(ref.kind==='expected-http-failure'){
       if(response.status!==ref.expected_http_status)fail('unexpected-http-status');
     }else{
       if(!response.ok||bytes.length>config.limits.max_response_bytes)fail('http-or-size');
       receipt.responseDigest=sourceDigest(bytes);writeFileSync(resolve(directory,ref.id+'.body'),bytes,{flag:'wx'});
     }
   }catch(error){receipt.failureKind=error.message??'acquisition-failed';}
   writeFileSync(resolve(directory,ref.id+'.receipt.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
 }
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2),options={};if(args.length%2)fail('cli-arguments');
 for(let index=0;index<args.length;index+=2){if(!['--input-dir','--acquire','--report'].includes(args[index])||options[args[index]])fail('cli-arguments');options[args[index]]=args[index+1];}
 if(!options['--report']||Boolean(options['--input-dir'])===Boolean(options['--acquire']))fail('usage');
 const directory=resolve(options['--input-dir']??options['--acquire']);if(options['--acquire'])await acquire(directory);
 const observations=config.references.map(ref=>{const receipt=JSON.parse(readFileSync(resolve(directory,ref.id+'.receipt.json'))),body=resolve(directory,ref.id+'.body');return {...receipt,bytes:existsSync(body)?readFileSync(body):null};});
 const report=inspectSingaporeObservations(observations);mkdirSync(dirname(resolve(options['--report'])),{recursive:true});writeFileSync(options['--report'],JSON.stringify(report,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({report:options['--report'],references:report.references.length,previewRows:report.dwellingPreview.featureRows,countryM2Achieved:false}));
}
