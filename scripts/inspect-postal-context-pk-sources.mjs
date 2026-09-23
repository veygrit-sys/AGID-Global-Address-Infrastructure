import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {fetchBoundedOfficialResponse,sourceDigest} from './lib/postal-context-source-probe.mjs';
import {createPostalCurlFetcher} from './lib/postal-context-curl-fetch.mjs';

const config=JSON.parse(readFileSync(new URL('../data/postal_country_packs/pk/postal-context/m2-source-review.json',import.meta.url),'utf8'));
const hosts=new Set(config.live_allowed_hosts);
const fail=message=>{throw Error(message);};
const mime=value=>(value??'').split(';')[0].trim().toLowerCase();

// Reuse human PDF/image review ONLY for identical bytes; no automatic new edition approval.
export function profilePakistanReference(bytes, ref, contentType, directoryProfile) {
  if (!Buffer.isBuffer(bytes)||!bytes.length||bytes.length>config.limits.max_response_bytes) fail('reference-byte-limit');
  if (!ref.accepted_mime.includes(mime(contentType))) fail('unexpected-mime');
  if (sourceDigest(bytes)!==ref.reviewed_digest||bytes.length!==ref.reviewed_bytes) fail('source-changed-review-required');
  if (ref.kind==='pdf'&&bytes.subarray(0,5).toString('ascii')!=='%PDF-') fail('invalid-pdf');
  if (ref.kind==='jpeg'&&(!bytes.subarray(0,3).equals(Buffer.from([255,216,255])))) fail('invalid-jpeg');
  if (['html','directory-html'].includes(ref.kind)) {
    const text=bytes.toString('utf8').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ');
    const markers={directory:['POST CODE','DELIVERY POST OFFICES','NON DELIVERY POST OFFICES'],home:['Allotment of Post Code'],privacy:['Privacy Policy','Personal Data'],
      'mapping-guidance':['Registration Cell','geospatial','Registration Fees']}[ref.id];
    if (!markers||markers.some(m=>!text.includes(m))) fail('html-content');
  } else if (!['pdf','jpeg'].includes(ref.kind)) fail('reference-kind');
  if (ref.kind==='directory-html'&&directoryProfile) {
    try {assert.deepEqual(directoryProfile,ref.reviewed_profile);}catch{fail('directory-profile-mismatch');}
  }
  return {contentVerified:true,transportBytesVerified:true,status:'reviewed-snapshot-not-m2-data',
    profile:structuredClone(ref.reviewed_profile),structureRecomputed:ref.kind==='directory-html'&&Boolean(directoryProfile),
    humanReviewReusedByExactDigest:ref.kind!=='directory-html'||!directoryProfile,
    currentPostalAssignmentsValidated:0,productionGeometryRecords:0,countryM2Achieved:false};
}

function empty(mode) {
  return {schemaVersion:'postal-context-pk-source-review/v1',countryCode:'PK',generatedAt:new Date().toISOString(),mode,
    criterionId:config.m2_criterion.id,criterionDefinition:config.m2_criterion.definition,references:[],
    countryM2Achieved:false,currentPostalAssignmentsValidated:0,licensedCurrentNationalAssignmentArtifacts:0,
    productionGeometryRecords:0,civicBuildingRelations:0,publishedImmutableDataArtifacts:0,realAgidRuntimeVerified:false,
    quality:{nationalCompleteness:null,currentValidity:null,postalAssignmentAccuracy:null,positionalAccuracyMetres:null},
    rawSourceRowsInGit:0,rawSourceDocumentsInGit:0,paidOperations:0,authenticatedSourceRequests:0,
    contractAcceptancePerformed:false,sourceFormsSubmitted:false,personnelOrCustomerRecordsPublished:0};
}

export function inspectPakistanObservations(observations) {
  if (!Array.isArray(observations)||observations.length!==config.references.length||new Set(observations.map(o=>o.id)).size!==observations.length) fail('observation-set');
  const report=empty('offline-verification-of-captured-public-sources');
  for (const ref of config.references) {
    const o=observations.find(o=>o.id===ref.id);
    if (!o||o.requestedUrl!==ref.url||o.finalUrl!==ref.url||o.redirects?.length!==0||o.httpStatus!==200
      ||o.observedAt!==ref.reviewed_observed_at||!Number.isFinite(Date.parse(o.observedAt))||Date.parse(o.observedAt)>Date.now()
      ||!Buffer.isBuffer(o.bytes)||o.byteLength!==o.bytes.length||o.responseDigest!==sourceDigest(o.bytes)) fail('receipt-binding');
    if (ref.kind==='directory-html'&&!o.directoryProfile) fail('fresh-directory-profile-required');
    report.references.push({id:ref.id,sourceId:ref.source_id,requestedUrl:o.requestedUrl,finalUrl:o.finalUrl,
      observedAt:o.observedAt,httpStatus:o.httpStatus,contentType:o.contentType,lastModified:o.lastModified??null,
      byteLength:o.byteLength,responseDigest:o.responseDigest,sourceDocumentDigest:o.responseDigest,edition:ref.edition,
      networkRequestsDuringVerification:0,...profilePakistanReference(o.bytes,ref,o.contentType,o.directoryProfile)});
  }
  report.completedAt=new Date().toISOString();
  return report;
}

export async function inspectPakistanSources(fetcher=fetch) {
  const report=empty('bounded-public-source-recheck');
  for (const ref of config.references) {
    const row={id:ref.id,sourceId:ref.source_id,requestedUrl:ref.url,observedAt:new Date().toISOString()};
    try {
      const {metadata,bytes}=await fetchBoundedOfficialResponse(ref.url,{allowedHosts:hosts,fetcher});
      Object.assign(row,metadata);
      if (!bytes) {report.references.push({...row,status:'http-error',contentVerified:false,sourceDocumentDigest:null});continue;}
      Object.assign(row,{byteLength:bytes.length,responseDigest:sourceDigest(bytes)});
      const result=profilePakistanReference(bytes,ref,metadata.contentType);
      report.references.push({...row,sourceDocumentDigest:row.responseDigest,...result});
    }catch(error){
      const safe=['source-changed-review-required','unexpected-mime','invalid-pdf','invalid-jpeg','html-content',
        'reference-byte-limit','unapproved-reference-host','reference-redirect-limit','curl-timeout','curl-network-error','curl-tls-verification-failed'];
      report.references.push({...row,status:'unverified-requires-review',contentVerified:false,sourceDocumentDigest:null,
        failureKind:safe.includes(error.message)?error.message:'transport-or-content-error'});
    }
  }
  report.completedAt=new Date().toISOString();return report;
}

if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])) {
  const args={};
  for(let i=2;i<process.argv.length;i+=2){const [key,value]=process.argv.slice(i,i+2);
    if(!['--observations','--python','--curl','--report'].includes(key)||!value||args[key])fail('cli-arguments');args[key]=value;}
  if(!args['--report']||(args['--observations']&&(!args['--python']||args['--curl']))||(args['--python']&&!args['--observations']))fail('cli-arguments');
  let report;
  if(args['--observations']){
    const observations=JSON.parse(readFileSync(resolve(args['--observations']),'utf8')).map(o=>{
      const row={...o,bytes:readFileSync(resolve(o.bodyPath))};
      if(o.id==='directory')row.directoryProfile=JSON.parse(execFileSync(args['--python'],['-B','-X','utf8',
        fileURLToPath(new URL('./inspect-postal-context-pk-directory.py',import.meta.url)),resolve(o.bodyPath),
        '--expected-digest',config.references.find(r=>r.id==='directory').reviewed_digest],
        {encoding:'utf8',timeout:10000,maxBuffer:65536,windowsHide:true}));return row;});
    report=inspectPakistanObservations(observations);
  }else report=await inspectPakistanSources(args['--curl']?createPostalCurlFetcher(args['--curl'],hosts):fetch);
  const output=resolve(args['--report']);mkdirSync(dirname(output),{recursive:true});
  writeFileSync(output,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({report:output,results:report.references.map(r=>({id:r.id,status:r.status})),countryM2Achieved:false}));
}
