import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {fetchBoundedOfficialResponse,sourceDigest} from './lib/postal-context-source-probe.mjs';
import {createPostalCurlFetcher} from './lib/postal-context-curl-fetch.mjs';

export const config=JSON.parse(readFileSync(new URL('../data/postal_country_packs/mm/postal-context/m2-source-review.json',import.meta.url)));
const hosts=new Set(config.live_allowed_hosts);
export const myanmarPlain=s=>s.replace(/<!--[\s\S]*?-->/g,' ').replace(/<(script|style|head)\b[^>]*>[\s\S]*?<\/\1>/gi,' ').replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/\s+/gu,' ').trim();
const digestMatches=(bytes,digest)=>{if(!digest||sourceDigest(bytes)!==digest)throw Error('mm-content-drift-requires-review');};
const failure=e=>/^(mm-[a-z-]+|curl-[a-z-]+|reference-[a-z-]+|unapproved-reference-host|empty-reference|redirect-without-location)$/.test(e?.message??'')?e.message:['AbortError','TimeoutError'].includes(e?.name)?'request-timeout':'network-or-parser-error';
const gated=ref=>ref.network_policy==='permission-required'||/(^|\.)themimu\.info$/i.test(new URL(ref.url).hostname);

export function myanmarSection(html,ref){
  const parts=myanmarPlain(html).split(ref.section_start);
  if(parts.length!==2)throw Error('mm-section-binding');
  const ends=parts[1].split(ref.section_end);if(ends.length!==2)throw Error('mm-section-binding');
  return (ref.section_start+ends[0]).trim();
}

// Publisher's dated aggregate statement only. Never treat it as validated rows,
// postal coverage, or a join between administrative PCodes and postal codes.
export function profileMyanmarPcodeListing(html){
  const text=myanmarPlain(html);
  const matches=[...text.matchAll(/As of Jan 2026,[\s\S]*?database to ([\d,]+)\. Of these, ([\d.]+)% \(([\d,]+) villages\) have recorded coordinates/g)];
  if(matches.length!==1)throw Error('mm-dated-statistic-binding');
  const [,totalText,percentText,locatedText]=matches[0];
  const villages=Number(totalText.replaceAll(',','')),withCoordinates=Number(locatedText.replaceAll(',','')),reportedPercent=Number(percentText);
  if(!Number.isSafeInteger(villages)||!Number.isSafeInteger(withCoordinates)||villages<=0||withCoordinates<0||withCoordinates>villages||!Number.isFinite(reportedPercent)||Math.round(1000*withCoordinates/villages)/10!==reportedPercent)throw Error('mm-statistic-denominator');
  if(villages!==config.mimu_listing_review.dated_villages||withCoordinates!==config.mimu_listing_review.dated_villages_with_coordinates||reportedPercent!==config.mimu_listing_review.dated_reported_coordinate_percent)throw Error('mm-statistic-drift');
  if(!html.includes('Myanmar_PCodes_Release_9.7_Jan2026_StRgn_Dist_Tsp_Town_Ward_VT.xlsm'))throw Error('mm-edition-listing');
  return {grain:'publisher-dated-village-coordinate-summary-not-postal-assignments',edition:'Jan 2026',listedVersion:'9.7',villages,withCoordinates,withoutCoordinates:villages-withCoordinates,reportedPercent,legacyUndatedPercentNotUsed:79,dataRowsInspected:0,workbooksDownloaded:0,macroExecution:false,nationalPostalCoverageVerified:false};
}

export function profileMyanmarReference(bytes,ref,mime,{preflight=false}={}){
  if(bytes.length>config.limits.max_response_bytes)throw Error('reference-byte-limit');
  const type=(mime??'').split(';')[0].trim().toLowerCase();
  if(preflight)digestMatches(bytes,ref.reviewed_preflight_digest);
  const base={contentVerified:false,sourceDataRecords:0};
  if(ref.kind==='manual-reference')return {...base,status:'manual-review-required-not-data'};
  if(ref.kind!=='reviewed-section')digestMatches(bytes,ref.reviewed_preflight_digest);
  if(ref.kind==='reviewed-pdf'){
    if(type!=='application/pdf'||bytes.subarray(0,5).toString('ascii')!=='%PDF-')throw Error('mm-pdf-mime-or-signature');
    return {...base,contentVerified:true,status:'dated-document-verified-not-current-data',profile:{edition:ref.edition,pages:ref.pages,reviewBasis:'exact bytes match separately rendered and visually reviewed two-page UPU reference',postalDigits:7,digitGroupLengths:[2,2,3],examplesAreNotAssignments:true,currentAssignmentsVerified:false}};
  }
  if(type!=='text/html')throw Error('mm-html-mime');
  const html=new TextDecoder('utf8',{fatal:true}).decode(bytes);
  const titles=[...html.replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi,' ').matchAll(/<title[^>]*>([\s\S]*?)<\/title>/gi)];
  if(titles.length!==1||myanmarPlain(titles[0][1])!==ref.title)throw Error('mm-title-binding');
  let sectionProfile={};
  if(ref.kind==='reviewed-section'){
    const section=myanmarSection(html,ref);digestMatches(section,ref.expected_section_digest);
    sectionProfile={sectionDigest:sourceDigest(section),sectionBytes:Buffer.byteLength(section),fullResponseSeparatelyHashed:true};
    if(ref.profile?.postalLookupLink){
      const links=[...html.matchAll(/<a\b[^>]*\bhref\s*=\s*(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi)].filter(a=>myanmarPlain(a[3])==='Post Code (Myanmar/English)');
      if(links.length!==1||links[0][2]!==ref.profile.postalLookupLink)throw Error('mm-postal-link-binding');
    }
  }else if(ref.kind!=='reviewed-html')throw Error('mm-reference-kind');
  return {...base,contentVerified:true,status:'reference-verified-not-data',profile:{...ref.profile,...sectionProfile,...(ref.id==='mimu-place-codes-v9-6-2025'?profileMyanmarPcodeListing(html):{}),sourceDataEdition:null,rightsToDataVerified:false}};
}

function emptyReport(mode){return {schemaVersion:'postal-context-mm-source-review/v1',countryCode:'MM',generatedAt:new Date().toISOString(),mode,criterionId:config.m2_criterion.id,references:[],mimuPermissionGate:config.mimu_permission_gate,sourceRowsPersisted:0,currentAssignmentRowsValidated:0,productionGeometryRecords:0,civicBuildingRelations:0,publishedDataArtifacts:0,realAgidRuntimeVerified:false,assignmentQuality:{missingCodeRate:null,duplicateAssignmentRate:null,nationalCoverage:null,reason:'reference documents and aggregate metadata are not a current rights-cleared assignment dataset'},paidOperations:0,authenticatedRequests:0,privateQueries:0,featureQueries:0,formSubmissions:0,contractAcceptancePerformed:false,countryM2Achieved:false};}

// Offline validation of these exact, already-observed reference bytes only.
// Original acquisition timestamps stay unchanged; this is not another fetch.
export function inspectMyanmarObservations(observations){
  if(observations.length!==config.references.length||new Set(observations.map(o=>o.id)).size!==observations.length)throw Error('mm-observation-set');
  const report=emptyReport('offline-verification-of-initial-preflight');
  for(const ref of config.references){
    const o=observations.find(x=>x.id===ref.id);
    if(!o||o.requestedUrl!==ref.url||!/^\d{4}-\d{2}-\d{2}T/.test(o.observedAt)||!Number.isFinite(Date.parse(o.observedAt))||Date.parse(o.observedAt)>Date.now())throw Error('mm-observation-binding');
    const base={id:ref.id,requestedUrl:ref.url,observedAt:o.observedAt,networkRequestsDuringVerification:0,futureNetworkPolicy:gated(ref)?'permission-required':'bounded-public-reference-only',sourceDataRecords:0};
    if(o.failure){if(o.bytes||!['curl-network-error','curl-tls-verification-failed','curl-timeout'].includes(o.failure))throw Error('mm-failure-receipt');report.references.push({...base,status:'acquisition-failed',failureKind:o.failure,contentVerified:false,sourceDocumentDigest:null});continue;}
    if(!Buffer.isBuffer(o.bytes)||o.httpStatus!==200||o.finalUrl!==ref.url||o.redirects?.length||o.observedAt!==ref.reviewed_observed_at||o.byteLength!==o.bytes.length||o.responseDigest!==sourceDigest(o.bytes))throw Error('mm-preflight-receipt-binding');
    const p=profileMyanmarReference(o.bytes,ref,o.contentType,{preflight:true});
    report.references.push({...base,finalUrl:ref.url,httpStatus:200,contentType:o.contentType,lastModified:o.lastModified??null,byteLength:o.bytes.length,responseDigest:sourceDigest(o.bytes),...p,sourceDocumentDigest:p.contentVerified?sourceDigest(o.bytes):null});
  }
  report.completedAt=new Date().toISOString();return report;
}

export async function inspectMyanmarSources(fetcher=fetch){
  const report=emptyReport('bounded-public-reference-check-mimu-disabled');
  for(const ref of config.references){
    // Excluded at both request and redirect host layers. No bypass/consent flag.
    if(gated(ref)){report.references.push({id:ref.id,requestedUrl:ref.url,status:'permission-required-no-request',contentVerified:false,sourceDataRecords:0,networkRequestsMade:0,sourceDocumentDigest:null});continue;}
    let receipt={id:ref.id,requestedUrl:ref.url};
    try{
      const {bytes,metadata:m}=await fetchBoundedOfficialResponse(ref.url,{allowedHosts:hosts,fetcher,maxBytes:config.limits.max_response_bytes});
      // Do not emit redirect/query payloads from an unexpected upstream response.
      if(m.finalUrl!==ref.url||m.redirects.length)throw Error('mm-unreviewed-redirect');
      receipt={...receipt,observedAt:new Date().toISOString(),httpStatus:m.httpStatus,contentType:m.contentType,lastModified:m.lastModified,byteLength:bytes?.length??null,responseDigest:bytes?sourceDigest(bytes):null};
      const p=bytes?profileMyanmarReference(bytes,ref,m.contentType):{status:'http-error',contentVerified:false,sourceDataRecords:0};
      report.references.push({...receipt,...p,sourceDocumentDigest:p.contentVerified?receipt.responseDigest:null});
    }catch(e){report.references.push({...receipt,observedAt:receipt.observedAt??new Date().toISOString(),status:'review-failed',failureKind:failure(e),contentVerified:false,sourceDataRecords:0,sourceDocumentDigest:null});}
  }
  report.completedAt=new Date().toISOString();return report;
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2),options={};if(args.length%2)throw Error('usage: --report NEW.json [--curl EXECUTABLE]');
  for(let i=0;i<args.length;i+=2){if(!['--report','--curl'].includes(args[i])||Object.hasOwn(options,args[i]))throw Error('mm-cli-arguments');options[args[i]]=args[i+1];}
  if(!options['--report'])throw Error('mm-report-required');const path=resolve(options['--report']);if(existsSync(path))throw Error('report-already-exists');
  const report=await inspectMyanmarSources(options['--curl']?createPostalCurlFetcher(options['--curl'],hosts):fetch);
  mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({report:path,references:report.references.map(r=>({id:r.id,status:r.status,failure:r.failureKind})),m2:false}));
}
