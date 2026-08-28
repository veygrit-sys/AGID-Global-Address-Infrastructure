import {readFileSync,existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {fetchBoundedOfficialResponse,sourceDigest} from './lib/postal-context-source-probe.mjs';
import {createPostalCurlFetcher} from './lib/postal-context-curl-fetch.mjs';
import {readNepalFederalTable,inspectNepalFederalRows} from './lib/postal-context-np-table.mjs';

export const config = JSON.parse(readFileSync(new URL('../data/postal_country_packs/np/postal-context/m2-source-review.json',import.meta.url)));
const fail = code => {throw Error(`np-${code}`);};

export function inspectNepalReference(bytes,ref,mime) {
  if (!Buffer.isBuffer(bytes) || bytes.length!==ref.reviewed_bytes || sourceDigest(bytes)!==ref.reviewed_digest) fail('reference-drift');
  if (mime?.split(';')[0].trim().toLowerCase()!==ref.reviewed_mime) fail('reference-mime');
  if (ref.kind==='federal-table') {
    const table=readNepalFederalTable(bytes,mime),quality=inspectNepalFederalRows(table);
    return {status:quality.issues.length?'table-quality-failed':'real-table-structure-verified-not-release',contentVerified:quality.issues.length===0,tableDigest:table.tableDigest,quality};
  }
  if (ref.kind==='pdf' && bytes.subarray(0,5).toString('ascii')!=='%PDF-') fail('pdf-magic');
  if (ref.kind==='html' || ref.kind==='shell') {
    const text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
    if (!ref.markers.every(marker=>text.includes(marker))) fail('reference-markers');
  }
  if (!['pdf','html','shell'].includes(ref.kind)) fail('reference-kind');
  return {status:ref.kind==='shell'?'viewer-shell-not-data':'reference-verified-not-data',contentVerified:ref.kind!=='shell',profile:{...ref.reviewed_profile,priorReviewBoundToExactBytes:true}};
}

export function inspectNepalObservations(observations) {
  if (!Array.isArray(observations) || observations.length!==config.references.length || new Set(observations.map(o=>o.id)).size!==observations.length) fail('observation-set');
  const results=[];
  for (const ref of config.references) {
    const o=observations.find(x=>x.id===ref.id);
    if (!o || o.requestedUrl!==ref.url || o.observedAt!==ref.reviewed_observed_at) fail('observation-binding');
    const common={id:ref.id,sourceId:ref.source_id,url:ref.url,observedAt:o.observedAt,completedAt:o.completedAt};
    if (ref.kind==='failure') {
      if (o.bytes || o.failureKind!==ref.reviewed_failure || o.responseDigest!==null) fail('failure-binding');
      results.push({...common,status:'acquisition-failed',failureKind:o.failureKind,contentVerified:false,responseDigest:null});continue;
    }
    if (o.httpStatus!==200 || o.finalUrl!==ref.url || o.redirects?.length!==0 || o.byteLength!==o.bytes?.length || o.responseDigest!==sourceDigest(o.bytes)) fail('receipt-binding');
    const result=inspectNepalReference(o.bytes,ref,o.contentType);
    results.push({...common,httpStatus:200,finalUrl:o.finalUrl,redirects:[],contentType:o.contentType,lastModified:o.lastModified,byteLength:o.byteLength,responseDigest:o.responseDigest,...result});
  }
  const table=results.find(r=>r.id==='gpo-federal-table');
  return {
    schemaVersion:'postal-context-np-source-review/v1',countryCode:'NP',generatedAt:new Date().toISOString(),
    mode:'offline-exact-byte-review',criterionId:config.m2_criterion.id,references:results,
    assignmentQuality:table.quality,edition:config.edition_review,rights:config.rights_review,
    countryM2Achieved:false,sourceRowValuesPersistedInGit:0,licensedProductionAssignments:0,
    productionGeometryRecords:0,civicBuildingRelations:0,publishedImmutableArtifacts:0,
    realAgidRuntimeVerified:false,authenticatedRequests:0,featureQueries:0,paidOperations:0,
    contractAcceptancePerformed:false,productionDeploymentPerformed:false,
  };
}

export async function inspectNepalSources(fetcher=fetch) {
  const hosts=new Set(config.references.map(r=>new URL(r.url).hostname)),references=[];
  for (const ref of config.references) {
    if (ref.kind==='failure') {references.push({id:ref.id,status:'known-failure-skipped-until-review',contentVerified:false});continue;}
    const observedAt=new Date().toISOString();
    try {
      const {metadata:m,bytes}=await fetchBoundedOfficialResponse(ref.url,{allowedHosts:hosts,fetcher});
      if (m.finalUrl!==ref.url || m.redirects.length) fail('unreviewed-redirect');
      references.push({id:ref.id,observedAt,...m,responseDigest:bytes?sourceDigest(bytes):null,...(bytes?inspectNepalReference(bytes,ref,m.contentType):{status:'http-error',contentVerified:false})});
    } catch(e) {references.push({id:ref.id,observedAt,status:'review-failed',contentVerified:false,failureKind:/^(np-|curl-|reference-)[a-z-]+$/.test(e.message)?e.message:'network-or-parser-error'});}
  }
  return {countryCode:'NP',mode:'bounded-live-reference-recheck',references,countryM2Achieved:false,rawBodiesPersisted:false,publishedImmutableArtifacts:0};
}

if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const args=process.argv.slice(2),opts={};
  if (args.length%2) fail('cli-arguments');
  for(let i=0;i<args.length;i+=2){if(!['--report','--observations','--curl'].includes(args[i]) || Object.hasOwn(opts,args[i]))fail('cli-arguments');opts[args[i]]=args[i+1];}
  if (!opts['--report'] || (opts['--observations'] && opts['--curl'])) fail('cli-arguments');
  const output=resolve(opts['--report']);if(existsSync(output))fail('report-exists');
  let report;
  if (opts['--observations']) {
    const directory=resolve(opts['--observations']);
    const observations=config.references.map(ref=>({...JSON.parse(readFileSync(resolve(directory,ref.id+'.json'))),bytes:ref.kind==='failure'?null:readFileSync(resolve(directory,ref.id+'.body'))}));
    report=inspectNepalObservations(observations);
  } else {
    const hosts=new Set(config.references.map(r=>new URL(r.url).hostname));
    report=await inspectNepalSources(opts['--curl']?createPostalCurlFetcher(opts['--curl'],hosts):fetch);
  }
  mkdirSync(dirname(output),{recursive:true});writeFileSync(output,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({report:output,m2:false,referenceCount:report.references.length}));
}
