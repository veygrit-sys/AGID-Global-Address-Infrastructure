import {createHash} from 'node:crypto';
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export const config=JSON.parse(readFileSync(new URL('../data/postal_country_packs/sy/postal-context/m2-source-review.json',import.meta.url),'utf8'));
const fail=message=>{throw new Error(`sy-${message}`)};
export const sourceDigest=bytes=>'sha256:'+createHash('sha256').update(bytes).digest('hex');
const normalizedMime=value=>(value??'').split(';')[0].trim().toLowerCase();

export function profileSyriaReference(bytes,reference,contentType){
 if(!Buffer.isBuffer(bytes)||bytes.length!==reference.reviewed_bytes||sourceDigest(bytes)!==reference.expected_digest)fail('content-drift');
 if(normalizedMime(contentType)!==reference.mime)fail('mime');
 if(reference.kind==='reviewed-pdf'){
   if(bytes.subarray(0,5).toString()!=='%PDF-')fail('pdf-signature');
   return {...reference.manual_pdf_review,visual_review_bound_by_exact_bytes:true};
 }
 const text=bytes.toString('utf8');
 const missing=(reference.markers??[]).filter(marker=>!text.toLowerCase().includes(marker.toLowerCase()));
 if(missing.length)fail('content-marker');
 return {markers_verified:reference.markers.length,source_data_rows_reviewed:0};
}

export function inspectSyriaObservations(observations){
 if(observations.length!==config.references.length||new Set(observations.map(item=>item.id)).size!==observations.length)fail('observation-set');
 const references=[];
 for(const reference of config.references){
   const observation=observations.find(item=>item.id===reference.id);
   if(!observation||observation.requestedUrl!==reference.url||!Number.isFinite(Date.parse(observation.observedAt))||Date.parse(observation.observedAt)>Date.now())fail('observation-binding');
   const base={id:reference.id,requestedUrl:reference.url,observedAt:observation.observedAt,sourceDataRows:0};
   if(reference.kind==='expected-network-failure'){
     if(observation.bytes||observation.httpStatus||observation.failureKind!==reference.reviewed_failure)fail('failure-binding');
     references.push({...base,httpStatus:null,status:'acquisition-failed',failureKind:observation.failureKind,contentVerified:false});
     continue;
   }
   if(observation.httpStatus!==200||observation.finalUrl!==reference.url||!Buffer.isBuffer(observation.bytes)||observation.byteLength!==observation.bytes.length||observation.responseDigest!==sourceDigest(observation.bytes))fail('receipt-binding');
   if((observation.lastModified??null)!==(reference.reviewed_last_modified??null))fail('metadata-binding');
   const profile=profileSyriaReference(observation.bytes,reference,observation.contentType);
   references.push({...base,finalUrl:observation.finalUrl,httpStatus:200,contentType:observation.contentType,lastModified:observation.lastModified??null,byteLength:observation.bytes.length,responseDigest:sourceDigest(observation.bytes),status:reference.id==='upu-copyright'?'reviewed-rights-reference-not-data':'reviewed-reference-not-data',contentVerified:true,profile});
 }
 return {schemaVersion:'postal-context-sy-source-review/v1',countryCode:'SY',generatedAt:new Date(Math.max(...observations.map(item=>Date.parse(item.observedAt)))).toISOString(),criterionId:config.m2_criterion.id,mode:'offline-byte-bound-reference-review',references,
   postalPolicy:config.policy,rights:config.rights_gate,currentPostalAssignmentRowsValidated:0,currentAddressRowsValidated:0,officialPostalGeometryRecords:0,derivedPostalGeometryRecords:0,productionAdministrativeGeometryRecords:0,explicitAddressBuildingRelations:0,publishedImmutableDataArtifacts:0,realAgidRuntimeVerified:false,countryM2Achieved:false,authenticatedRequests:0,paidOperations:0,contractAcceptances:0,newAccountsRepositoriesOrDestinations:0,rawSourceBodiesInGit:0,
   quality:{grain:'policy-and-operator-reference-only',postalCodeMissingness:'not-applicable-no-postcode-required-system',addressMissingnessRate:null,duplicateAddressRate:null,declaredCoverage:null,currentValidity:null,reason:'No licensed current real data rows were validated; reference documents cannot establish data quality or coverage.'},
   blockerSummary:'SY remains M1. A current rights-cleared real dataset, explicit scope and validity, reproducible transform, approved immutable artifact and actual SY AGID verification are absent; no postcode or postal polygon may be generated from offices, P.O. boxes, administrative boundaries or synthetic cells.'};
}

async function acquire(directory){
 if(existsSync(directory))fail('acquisition-directory-exists');mkdirSync(directory,{recursive:true});
 for(const reference of config.references){
   const receipt={id:reference.id,requestedUrl:reference.url,observedAt:new Date().toISOString()};
   try{
     const url=new URL(reference.url);if(!config.live_allowed_hosts.includes(url.hostname))fail('host');
     const response=await fetch(url,{redirect:'follow',signal:AbortSignal.timeout(60000),headers:{'user-agent':'AGID-Postal-Context-M2-Audit/1.0'}});
     const bytes=Buffer.from(await response.arrayBuffer());
     Object.assign(receipt,{finalUrl:response.url,httpStatus:response.status,contentType:response.headers.get('content-type'),lastModified:response.headers.get('last-modified'),byteLength:bytes.length});
     if(reference.kind==='expected-network-failure')fail('source-became-reachable-review-required');
     if(!response.ok||bytes.length>config.limits.max_response_bytes)fail('http-or-size');
     receipt.responseDigest=sourceDigest(bytes);writeFileSync(resolve(directory,reference.id+'.body'),bytes,{flag:'wx'});
   }catch(error){receipt.failureKind=['TimeoutError','AbortError'].includes(error?.name)?'connect-timeout':String(error?.message??'request-failed').startsWith('sy-')?error.message:'request-failed';}
   writeFileSync(resolve(directory,reference.id+'.receipt.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
 }
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2),options={};if(args.length%2)fail('cli-arguments');
 for(let index=0;index<args.length;index+=2){if(!['--input-dir','--acquire','--report'].includes(args[index])||options[args[index]])fail('cli-arguments');options[args[index]]=args[index+1];}
 if(!options['--report']||Boolean(options['--input-dir'])===Boolean(options['--acquire']))fail('usage');
 const directory=resolve(options['--input-dir']??options['--acquire']);if(options['--acquire'])await acquire(directory);
 const observations=config.references.map(reference=>{const receipt=JSON.parse(readFileSync(resolve(directory,reference.id+'.receipt.json'))),body=resolve(directory,reference.id+'.body');return {...receipt,bytes:existsSync(body)?readFileSync(body):null};});
 const report=inspectSyriaObservations(observations);mkdirSync(dirname(resolve(options['--report'])),{recursive:true});writeFileSync(options['--report'],JSON.stringify(report,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({report:options['--report'],references:report.references.length,countryM2Achieved:false}));
}
