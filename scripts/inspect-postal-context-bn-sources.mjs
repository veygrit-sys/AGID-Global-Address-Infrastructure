import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {fetchBoundedOfficialResponse, probeOfficialReference, sourceDigest} from './lib/postal-context-source-probe.mjs';
import {createPostalCurlFetcher} from './lib/postal-context-curl-fetch.mjs';
const PROFILE=JSON.parse(readFileSync(new URL('../data/postal_country_packs/bn/postal-context/m2-source-review.json',import.meta.url)));
const HOSTS=new Set([...PROFILE.reference_probes,...PROFILE.alternate_postal_probes,PROFILE.booklet_probe].map(r=>new URL(r.url).hostname));
const errorCode=e=>e.cause?.code??e.code??e.message;

export async function probeBnReference(ref,fetcher=fetch) {
  if(!ref.requiredLinks)return probeOfficialReference(ref,HOSTS,fetcher);
  const {metadata,bytes}=await fetchBoundedOfficialResponse(ref.url,{allowedHosts:HOSTS,fetcher});
  if(!bytes)return {id:ref.id,...metadata,status:'http-error',contentVerified:false};
  const html=bytes.toString('utf8'), plain=html.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ');
  const links=[...html.matchAll(/href\s*=\s*["']([^"']+)["']/gi)].map(m=>m[1]);
  const missingMarkers=ref.markers.filter(m=>!plain.toLowerCase().includes(m.toLowerCase()));
  const missingLinks=ref.requiredLinks.filter(u=>!links.includes(u));
  const contentVerified=(metadata.contentType??'').split(';')[0]===ref.mime&&!missingMarkers.length&&!missingLinks.length;
  const digest=sourceDigest(bytes);
  return {id:ref.id,...metadata,observedAt:new Date().toISOString(),status:contentVerified?'reference-verified-not-data':'unexpected-content',contentVerified,missingMarkers,missingLinks,responseDigest:digest,sourceDocumentDigest:contentVerified?digest:null,byteLength:bytes.length,edition:ref.edition,sourceDataRecords:0};
}

export function assertBookletBytes(bytes,contentType) {
  if (!Buffer.isBuffer(bytes)||bytes.length>PROFILE.limits.max_response_bytes||bytes.subarray(0,5).toString()!=='%PDF-'||(contentType??'').split(';')[0]!=='application/pdf') throw new Error('bn-booklet-format');
  if(sourceDigest(bytes)!==PROFILE.booklet_probe.expected_digest) throw new Error('bn-unreviewed-booklet-digest');
}

export function summarizeBookletQuality(validation) {
  const locality=validation.groups?.locality;
  if(!locality||!validation.groups['government-organization']||!validation.groups['postal-branch']) throw new Error('bn-missing-table-kind');
  const comparisons=Object.entries(PROFILE.booklet_probe.expected_header_locality_counts).map(([prefix,count])=>({districtPrefix:prefix,bookletHeadingCount:count,observedLocalityTableRows:locality.districtPrefixCounts[prefix]??0,difference:(locality.districtPrefixCounts[prefix]??0)-count}));
  return {rowsObserved:Object.values(validation.groups).reduce((n,g)=>n+g.rows,0),headingComparisons:comparisons,headingCountsReconciled:comparisons.every(c=>c.difference===0),postalBranchSerialMismatches:validation.groups['postal-branch'].serialSequenceMismatches,
    interpretation:'Locality tables include named areas as well as villages. Heading differences and the branch serial gap are unresolved source-quality exceptions, not missing rows to invent. Repeated organization codes and repeated locality names are not stable identifiers.',
    currentNationalCoverageEstablished:false,rightsForPublicM2ArtifactCleared:false,sourceRowsExported:0};
}

export async function inspectBn({python='python',curl=null,fetcher=fetch}={}) {
  const report={schemaVersion:'postal-context-bn-source-review/v1',countryCode:'BN',observedAt:new Date().toISOString(),criterionId:PROFILE.m2_definition.id,
    countryM2Achieved:false,synthetic:false,scope:'Historical SKN-hosted booklet quality preflight plus current operator/reference/rights review; not a production assignment pack.',
    countryStage:'M1_metadata',sourceSnapshotsRetainedForPublication:0,publishedDataArtifacts:0,realAgidRuntimeVerified:false,rightsForPublicM2ArtifactCleared:false,
    tlsVerificationDisabled:false,authenticationPerformed:false,privateQueriesPerformed:false,contractClickThroughPerformed:false,references:[]};
  for (const ref of PROFILE.reference_probes) {
    const observedAt=new Date().toISOString();
    try{report.references.push({...await probeBnReference(ref,fetcher),observedAt});}
    catch(e){report.references.push({id:ref.id,requestedUrl:ref.url,observedAt,status:'fetch-error',contentVerified:false,error:errorCode(e)});}
  }
  const observedAt=new Date().toISOString();
  try {
    const {metadata,bytes}=await fetchBoundedOfficialResponse(PROFILE.booklet_probe.url,{allowedHosts:HOSTS,fetcher});
    if(!bytes)report.bookletObservation={...metadata,observedAt,status:'http-error'};
    else {
      assertBookletBytes(bytes,metadata.contentType);
      const parser=fileURLToPath(new URL('./profile-postal-context-bn-booklet.py',import.meta.url));
      const child=spawnSync(python,[parser,'--stdin'],{input:bytes,encoding:'utf8',timeout:30000,maxBuffer:1024*1024,windowsHide:true});
      if(child.error||child.status!==0)throw new Error('bn-pdf-profiler-failed');
      const validation=JSON.parse(child.stdout);
      if(validation.sourceDigest!==sourceDigest(bytes)||validation.pdfPages!==PROFILE.booklet_probe.expected_pdf_pages)throw new Error('bn-profiler-lineage');
      report.bookletObservation={...metadata,observedAt,status:'historical-booklet-profiled-not-current-assignment',responseDigest:sourceDigest(bytes),byteLength:bytes.length,validation,quality:summarizeBookletQuality(validation)};
    }
  }catch(e){report.bookletObservation={requestedUrl:PROFILE.booklet_probe.url,observedAt,status:'fetch-or-validation-error',error:errorCode(e)};}
  report.alternatePostalChecks=[];
  if(curl){const native=createPostalCurlFetcher(curl,HOSTS);for(const ref of PROFILE.alternate_postal_probes){const observedAt=new Date().toISOString();try{report.alternatePostalChecks.push({...await probeOfficialReference(ref,HOSTS,native),observedAt,transport:'native-tls'});}catch(e){report.alternatePostalChecks.push({id:ref.id,requestedUrl:ref.url,observedAt,status:'fetch-error',error:errorCode(e),transport:'native-tls'});}}}
  report.interpretation={operatorTransition:'MTIC, AITI and PosBru corroborate operations effective 2026-01-01. The unavailable legacy host is not treated as absence of postal services.',
    historicalMirror:'SKN public guide explicitly links the booklet. Its 2018 PDF metadata and a 2026 HTTP Last-Modified are different facts. Equality with the unreachable original, current validity and exact redistribution rights are unverified.',
    rights:PROFILE.rights_review,authorityBoundaries:PROFILE.authority_boundaries,
    visualReview:'UPU pages were text-extracted and locally rendered; view_image failed with host os error 206. Web screenshots were unavailable/not inspectable. No complete visual audit is claimed for the 52-page booklet.',
    exceptions:'No serial gap, heading count, repeated code/name or current operator change was automatically repaired or converted into an address, building or geometry.',
    unvisited:'No VPO login/registration/tracking, SKN welfare account/application, Geoportal acceptance/query, title/identity request, paid product, new public destination or deployment.'};
  report.completedAt=new Date().toISOString();
  return report;
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const args=process.argv.slice(2), options={};
  if(args.length%2)throw new Error('usage: --report <new-path> [--python <executable>] [--curl <executable>]');
  for(let i=0;i<args.length;i+=2){if(!['--report','--python','--curl'].includes(args[i])||options[args[i].slice(2)]||!args[i+1])throw new Error('invalid-option');options[args[i].slice(2)]=args[i+1];}
  if(!options.report||existsSync(options.report))throw new Error('new-report-path-required');
  const report=await inspectBn(options);mkdirSync(dirname(options.report),{recursive:true});writeFileSync(options.report,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({report:options.report,verifiedReferences:report.references.filter(r=>r.contentVerified).length,bookletStatus:report.bookletObservation.status,rowsObserved:report.bookletObservation.quality?.rowsObserved??0,countryM2Achieved:false}));
}
