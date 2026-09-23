import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {fetchBoundedOfficialResponse,sourceDigest} from './lib/postal-context-source-probe.mjs';
import {createPostalCurlFetcher} from './lib/postal-context-curl-fetch.mjs';

export const config=JSON.parse(readFileSync(new URL('../data/postal_country_packs/mn/postal-context/m2-source-review.json',import.meta.url)));
const hosts=new Set(config.live_allowed_hosts);
export const mongoliaPlain=s=>s.replace(/<!--[\s\S]*?-->/g,' ').replace(/<(script|style|head)\b[^>]*>[\s\S]*?<\/\1>/gi,' ').replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/\s+/gu,' ').trim();
const fail=e=>/^(mn-[a-z-]+|curl-[a-z-]+|reference-[a-z-]+|unapproved-reference-host|empty-reference|redirect-without-location)$/.test(e?.message??'')?e.message:['TimeoutError','AbortError'].includes(e?.name)?'request-timeout':'network-or-parser-error';

// Publisher counts, not downloaded/validated assignments. Both live CRC pages
// claim 2025; the dated article and 2024 book cannot silently overrule the other.
export function profileMongoliaCrcCounts(html,{datedArticle=false}={}){
  const p=mongoliaPlain(html);
  const matches=[...p.matchAll(/2025 оны байдлаар (\d+) шуудангийн нэгдсэн код байгаагаас 21 аймагт (\d+), Улаанбаатар хотын 9 дүүрэгт (\d+)/g)];
  if(matches.length!==1)throw Error('mn-count-binding');
  const [total,aimags,capital]=matches[0].slice(1).map(Number);
  if(![total,aimags,capital].every(x=>Number.isSafeInteger(x)&&x>0)||aimags+capital!==total)throw Error('mn-count-denominator');
  const expected=datedArticle?[2721,1993,728]:[2720,1992,728];
  if(JSON.stringify([total,aimags,capital])!==JSON.stringify(expected))throw Error('mn-count-drift');
  const standard=datedArticle?'MNS 6775:2024':'MNS 6775:2019';
  if(!p.includes(standard)||!p.includes('5 оронтой')||(datedArticle&&!p.includes('2025-05-23'))||(!datedArticle&&!p.includes('9 оронтой')))throw Error('mn-edition-binding');
  return {grain:'publisher-statement-not-assignment-rows',statedYear:2025,articleDate:datedArticle?'2025-05-23':null,statedStandard:standard,total,aimags,capital,otherLiveCrcCountConflict:true,acceptedNationalCoverageDenominator:null,extendedCodeRepealVerified:false,currentAssignmentsValidated:0};
}

// Metadata selectors only: Indicator x Region x Year is the potential table
// grain. Region labels are not keys and incompatible indicators cannot be summed.
export function profileMongoliaNsoSelectors(html){
  const selectors=[...html.matchAll(/<select\b([^>]*)>([\s\S]*?)<\/select>/gi)].filter(m=>/ValuesListBox/.test(m[1]));
  if(selectors.length!==3)throw Error('mn-selector-count');
  const sets=selectors.map((m,i)=>{
    if(!m[1].includes(`ctl0${i+1}`))throw Error('mn-selector-order');
    const options=[...m[2].matchAll(/<option\b[^>]*value="([^"]+)"[^>]*>([\s\S]*?)<\/option>/gi)].map(o=>({key:o[1],label:mongoliaPlain(o[2])}));
    if(!options.length||options.some(o=>!/^\d+$/.test(o.key)||!o.label)||new Set(options.map(o=>o.key)).size!==options.length)throw Error('mn-selector-keys');
    return options;
  });
  const [indicators,regions,years]=sets;
  const expectedIndicators=['Soum and district','Bag and khoroo','Territory (in thousand square kilometers)','Population density (persons per square kilometers)'];
  if(indicators.length!==4||indicators.some((o,i)=>o.key!==String(i+1)||o.label!==expectedIndicators[i])||regions.length!==31||years.length!==11||years.some((o,i)=>o.key!==String(i)||o.label!==String(2024-i)))throw Error('mn-selector-edition-drift');
  const labels=new Map();for(const o of regions)labels.set(o.label,[...(labels.get(o.label)??[]),o.key]);
  const collisions=[...labels].filter(([,keys])=>keys.length>1).map(([label,keys])=>({label,keys}));
  if(collisions.length!==1||collisions[0].label!=='Ulaanbaatar'||JSON.stringify(collisions[0].keys)!=='["7","711"]')throw Error('mn-selector-label-drift');
  return {grain:'Indicator key + Region key + Year key within exact table edition',indicatorOptions:4,regionOptions:31,yearOptions:11,latestAvailableYear:2024,earliestAvailableYear:2014,duplicateRegionLabels:collisions,keysRemainDistinct:true,mixedAggregateLevels:true,indicatorUnits:['count','count','thousand square kilometres','persons per square kilometre'],aggregationAcrossIndicatorsPermitted:false,formSubmissions:0,resultRowsDownloaded:0,missingValuesRate:null,postalCoverage:null};
}

export function profileMongoliaReference(bytes,ref,mime){
  if(!Buffer.isBuffer(bytes)||bytes.length>(ref.max_bytes??config.limits.max_response_bytes))throw Error('reference-byte-limit');
  if(ref.kind==='manual-reference')return {status:'manual-review-required-not-data',contentVerified:false,sourceDataRecords:0};
  if(sourceDigest(bytes)!==ref.reviewed_digest||bytes.length!==ref.reviewed_bytes)throw Error('mn-content-drift-requires-review');
  const type=(mime??'').split(';')[0].trim().toLowerCase();
  if(ref.kind==='reviewed-pdf'){
    if(type!=='application/pdf'||bytes.subarray(0,5).toString('ascii')!=='%PDF-')throw Error('mn-pdf-mime-or-signature');
    return {status:'dated-document-verified-not-data',contentVerified:true,sourceDataRecords:0,profile:{...ref.profile,reviewBasis:'exact bytes of separately rendered and visually reviewed pages',rightsToDataVerified:false,currentAssignmentsValidated:0}};
  }
  if(ref.kind!=='reviewed-html'||type!=='text/html')throw Error('mn-html-mime-or-kind');
  const html=new TextDecoder('utf8',{fatal:true}).decode(bytes),heads=[...html.matchAll(/<head\b[^>]*>([\s\S]*?)<\/head>/gi)];
  if(heads.length!==1)throw Error('mn-head-binding');
  const titles=[...heads[0][1].matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)];
  if(titles.length!==1||mongoliaPlain(titles[0][1])!==ref.title)throw Error('mn-title-binding');
  let extra={};
  if(ref.id==='nso-mongolia-administrative-units')extra=profileMongoliaNsoSelectors(html);
  if(ref.id==='crc-mongolia-postcode-2025'||ref.id==='crc-mongolia-postcode-legacy-current-site')extra=profileMongoliaCrcCounts(html,{datedArticle:ref.id.endsWith('2025')});
  if(ref.id==='zipcode-mn-book-viewer'&&[...html.matchAll(/class="PDFFlip"[^>]*source="1\.pdf"/g)].length!==1)throw Error('mn-book-link-binding');
  return {status:'reference-verified-not-data',contentVerified:true,sourceDataRecords:0,profile:{...ref.profile,...extra,rightsToDataVerified:false}};
}

function empty(mode){return {schemaVersion:'postal-context-mn-source-review/v1',countryCode:'MN',generatedAt:new Date().toISOString(),mode,criterionId:config.m2_criterion.id,references:[],editionPolicy:config.edition_policy,rightsReview:config.rights_review,sourceRowsPersisted:0,currentAssignmentRowsValidated:0,productionGeometryRecords:0,civicBuildingRelations:0,publishedDataArtifacts:0,realAgidRuntimeVerified:false,assignmentQuality:{missingCodeRate:null,duplicateAssignmentRate:null,nationalCoverage:null,reason:'No rights-cleared current assignment dataset; publisher counts conflict and NSO selectors are not data rows.'},paidOperations:0,authenticatedRequests:0,privateQueries:0,featureQueries:0,formSubmissions:0,contractAcceptancePerformed:false,countryM2Achieved:false};}

export function inspectMongoliaObservations(observations){
  if(observations.length!==config.references.length||new Set(observations.map(o=>o.id)).size!==observations.length)throw Error('mn-observation-set');
  const report=empty('offline-verification-of-initial-reference-acquisition');
  for(const ref of config.references){
    const o=observations.find(x=>x.id===ref.id);
    if(!o||o.requestedUrl!==ref.url||!/^\d{4}-\d{2}-\d{2}T/.test(o.observedAt)||!Number.isFinite(Date.parse(o.observedAt))||Date.parse(o.observedAt)>Date.now())throw Error('mn-observation-binding');
    const base={id:ref.id,requestedUrl:ref.url,observedAt:o.observedAt,networkRequestsDuringVerification:0,sourceDataRecords:0};
    if(o.failure){if(o.bytes||o.failure!==ref.reviewed_failure)throw Error('mn-failure-receipt');report.references.push({...base,status:'acquisition-failed',failureKind:o.failure,contentVerified:false,sourceDocumentDigest:null});continue;}
    if(o.observedAt!==ref.reviewed_observed_at||o.httpStatus!==200||o.finalUrl!==ref.url||o.redirects?.length||!Buffer.isBuffer(o.bytes)||o.byteLength!==o.bytes.length||o.responseDigest!==sourceDigest(o.bytes))throw Error('mn-receipt-binding');
    const p=profileMongoliaReference(o.bytes,ref,o.contentType);
    report.references.push({...base,finalUrl:ref.url,httpStatus:200,contentType:o.contentType,lastModified:o.lastModified??null,byteLength:o.bytes.length,responseDigest:sourceDigest(o.bytes),...p,sourceDocumentDigest:p.contentVerified?sourceDigest(o.bytes):null});
  }
  report.completedAt=new Date().toISOString();return report;
}

export async function inspectMongoliaSources(fetcher=fetch){
  const report=empty('bounded-public-reference-check');
  for(const ref of config.references){
    // Larger public directory is a separate, explicitly bounded manual review;
    // never raise the shared curl limit or silently download it every heartbeat.
    if(ref.network_policy==='manual-bounded-document-review'){report.references.push({id:ref.id,requestedUrl:ref.url,status:'manual-document-review-required-no-request',contentVerified:false,sourceDocumentDigest:null,networkRequestsMade:0,sourceDataRecords:0});continue;}
    let receipt={id:ref.id,requestedUrl:ref.url};
    try{
      const {bytes,metadata:m}=await fetchBoundedOfficialResponse(ref.url,{allowedHosts:hosts,fetcher,maxBytes:config.limits.max_response_bytes});
      if(m.finalUrl!==ref.url||m.redirects.length)throw Error('mn-unreviewed-redirect');
      receipt={...receipt,observedAt:new Date().toISOString(),httpStatus:m.httpStatus,contentType:m.contentType,lastModified:m.lastModified,byteLength:bytes?.length??null,responseDigest:bytes?sourceDigest(bytes):null};
      const p=bytes?profileMongoliaReference(bytes,ref,m.contentType):{status:'http-error',contentVerified:false,sourceDataRecords:0};
      report.references.push({...receipt,...p,sourceDocumentDigest:p.contentVerified?receipt.responseDigest:null});
    }catch(e){report.references.push({...receipt,observedAt:receipt.observedAt??new Date().toISOString(),status:'review-failed',failureKind:fail(e),contentVerified:false,sourceDataRecords:0,sourceDocumentDigest:null});}
  }
  report.completedAt=new Date().toISOString();return report;
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2),options={};if(args.length%2)throw Error('usage: --report NEW.json [--curl EXECUTABLE]');
  for(let i=0;i<args.length;i+=2){if(!['--report','--curl'].includes(args[i])||Object.hasOwn(options,args[i]))throw Error('mn-cli-arguments');options[args[i]]=args[i+1];}
  if(!options['--report'])throw Error('mn-report-required');const path=resolve(options['--report']);if(existsSync(path))throw Error('report-already-exists');
  const report=await inspectMongoliaSources(options['--curl']?createPostalCurlFetcher(options['--curl'],hosts):fetch);
  mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({report:path,references:report.references.map(r=>({id:r.id,status:r.status,failure:r.failureKind})),m2:false}));
}
