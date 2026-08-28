import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';import {fileURLToPath} from 'node:url';
import {sourceDigest,fetchBoundedOfficialResponse} from './lib/postal-context-source-probe.mjs';
import {createPostalCurlFetcher} from './lib/postal-context-curl-fetch.mjs';
import {readMalaysiaPostcodes,profileMalaysiaPostcodes,profileMalaysiaCatalog,reconcileMalaysiaCatalog} from './lib/postal-context-my-postcodes.mjs';
export const config=JSON.parse(readFileSync(new URL('../data/postal_country_packs/my/postal-context/m2-source-review.json',import.meta.url)));
const fail=c=>{throw Error('my-'+c);};
export function profileMalaysiaReference(bytes,ref,mime){
  if(!Buffer.isBuffer(bytes)||sourceDigest(bytes)!==ref.reviewed_digest||bytes.length!==ref.reviewed_bytes)fail('reference-drift');
  if(mime?.split(';')[0].trim().toLowerCase()!==ref.reviewed_mime)fail('reference-mime');
  if(ref.kind==='csv'){const rows=readMalaysiaPostcodes(bytes,mime);return {status:'real-dictionary-validated-not-live-assignment',contentVerified:true,quality:profileMalaysiaPostcodes(rows)};}
  if(ref.kind==='catalog'){const {preview,...profile}=profileMalaysiaCatalog(bytes);return {status:'reference-verified-not-assignment',contentVerified:true,profile:{...profile,previewRows:preview.length}};}
  if(ref.kind==='parquet-bytes'){if(bytes.subarray(0,4).toString()!=='PAR1'||bytes.subarray(-4).toString()!=='PAR1')fail('parquet-magic');return {status:'parquet-bytes-only-not-row-validated',contentVerified:false,profile:{decoderAvailable:false,parquetCsvRowParityVerified:false}};}
  if(ref.kind==='soft-404'){if(!bytes.toString('utf8').includes('This Page Could Not Be Found'))fail('soft-404-body');return {status:'http-200-soft-404',contentVerified:false,profile:{currentLookupAvailable:false}};}
  if(ref.kind==='reviewed-pdf'&&bytes.subarray(0,5).toString()!=='%PDF-')fail('pdf-magic');
  if(!['reviewed-html','reviewed-pdf'].includes(ref.kind))fail('reference-kind');
  return {status:'reference-verified-not-assignment',contentVerified:true,profile:{...ref.reviewed_profile,priorHumanReviewBoundToExactBytes:true}};
}
export function inspectMalaysiaObservations(observations){
  if(observations.length!==config.references.length||new Set(observations.map(x=>x.id)).size!==observations.length)fail('observation-set');
  const report={schemaVersion:'postal-context-my-source-review/v1',countryCode:'MY',generatedAt:new Date().toISOString(),mode:'offline-exact-byte-review',criterionId:config.m2_criterion.id,references:[],countryM2Achieved:false,rawBodiesPersistedInGit:0,paidOperations:0,authenticatedRequests:0,contractAcceptancePerformed:false,productionGeometryRecords:0,civicBuildingRelations:0,publishedImmutableArtifacts:0};
  let rows,catalog;
  for(const ref of config.references){const o=observations.find(x=>x.id===ref.id);if(!o||o.requestedUrl!==ref.url||o.observedAt!==ref.reviewed_observed_at)fail('observation-binding');
    const common={id:ref.id,requestedUrl:ref.url,observedAt:o.observedAt};
    if(ref.kind==='acquisition-failed'){if(o.failureKind!==ref.reviewed_failure||o.bytes)fail('failure-binding');report.references.push({...common,status:'acquisition-failed',failureKind:o.failureKind,contentVerified:false,responseDigest:null});continue;}
    if(o.httpStatus!==200||o.finalUrl!==ref.url||o.redirects?.length||o.byteLength!==o.bytes?.length||o.responseDigest!==sourceDigest(o.bytes))fail('receipt-binding');
    const p=profileMalaysiaReference(o.bytes,ref,o.contentType);report.references.push({...common,httpStatus:200,contentType:o.contentType,lastModified:o.lastModified,byteLength:o.byteLength,responseDigest:o.responseDigest,...p});
    if(ref.kind==='csv')rows=readMalaysiaPostcodes(o.bytes,o.contentType);if(ref.kind==='catalog')catalog=profileMalaysiaCatalog(o.bytes);
  }
  report.dataQuality=profileMalaysiaPostcodes(rows);report.catalogReconciliation=reconcileMalaysiaCatalog(rows,catalog);
  report.edition={sourceEdition:catalog.edition,catalogLastUpdatedLocal:catalog.lastUpdatedLocal,catalogTimestampTimezone:null,objectLastModifiedIsSourceEdition:false,rowValidityDates:null};
  report.rights={datasetLicense:config.dataset_license,catalogDigest:config.references.find(r=>r.kind==='catalog').reviewed_digest,legalCodeDigest:config.references.find(r=>r.id==='cc-by-4-legal').reviewed_digest,scope:'MCMC dictionary only, not MyGeo/Pos/UPU websites or geometry',attributionRequired:true,changeNoticeRequired:true,noEndorsement:true,noWarranty:true};
  report.completedAt=new Date().toISOString();return report;
}
export async function inspectMalaysiaSources(fetcher=fetch){
  const hosts=new Set(config.references.map(r=>new URL(r.url).hostname)),results=[];
  for(const ref of config.references){if(['acquisition-failed','soft-404'].includes(ref.kind)){results.push({id:ref.id,status:'known-failure-skipped-pending-review',contentVerified:false});continue;}
    try{const {metadata:m,bytes}=await fetchBoundedOfficialResponse(ref.url,{allowedHosts:hosts,fetcher});if(m.finalUrl!==ref.url||m.redirects.length)fail('unreviewed-redirect');results.push({id:ref.id,observedAt:new Date().toISOString(),httpStatus:m.httpStatus,responseDigest:bytes?sourceDigest(bytes):null,...(bytes?profileMalaysiaReference(bytes,ref,m.contentType):{status:'http-access-failed',contentVerified:false})});}
    catch(e){results.push({id:ref.id,status:'review-failed',contentVerified:false,failureKind:/^(my-|curl-|reference-)[a-z-]+$/.test(e.message)?e.message:'network-or-parser-error'});}
  }return {countryCode:'MY',mode:'bounded-live-reference-check',references:results,countryM2Achieved:false,liveAssignmentValidityVerified:false,publishedImmutableArtifacts:0};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2),opts={};if(args.length%2)fail('cli-arguments');for(let i=0;i<args.length;i+=2){if(!['--report','--curl'].includes(args[i])||Object.hasOwn(opts,args[i]))fail('cli-arguments');opts[args[i]]=args[i+1];}
  if(!opts['--report'])fail('report-required');const path=resolve(opts['--report']);if(existsSync(path))fail('report-exists');
  const hosts=new Set(config.references.map(r=>new URL(r.url).hostname)),result=await inspectMalaysiaSources(opts['--curl']?createPostalCurlFetcher(opts['--curl'],hosts):fetch);
  mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({report:path,m2:false}));
}
