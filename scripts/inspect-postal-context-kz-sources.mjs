import {existsSync,mkdirSync,readFileSync,statSync,writeFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {fetchBoundedOfficialResponse,sourceDigest} from './lib/postal-context-source-probe.mjs';
import {createPostalCurlFetcher} from './lib/postal-context-curl-fetch.mjs';
export const config=JSON.parse(readFileSync(new URL('../data/postal_country_packs/kz/postal-context/m2-source-review.json',import.meta.url)));
const hosts=new Set(config.allowed_hosts);
const visible=s=>s.replace(/<!--[\s\S]*?-->/g,' ').replace(/<(script|style|head|nav|header|footer)\b[^>]*>[\s\S]*?<\/\1>/gi,' ');
export const kazakhstanPlain=s=>s.replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&quot;/g,'"').replace(/&amp;/g,'&').replace(/\s+/gu,' ').trim();
const keys=(o,k)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).sort().join('|')===[...k].sort().join('|');
export function kazakhstanFailure(e){return /^(kz-[a-z-]+|curl-[a-z-]+|reference-[a-z-]+|unapproved-reference-host|empty-reference|redirect-without-location)$/.test(e?.message??'')?e.message:['TimeoutError','AbortError'].includes(e?.name)?'request-timeout':'network-or-parser-error';}
export function safeKazakhstanUrl(value){const u=new URL(value);u.username='';u.password='';u.hash='';for(const k of [...u.searchParams.keys()])if(!(k==='lang'&&u.searchParams.get(k)==='en'))u.searchParams.set(k,'REDACTED');return u.href;}

// Public documentation, NOT a live operator response or an ingestion API.
// Never emit example addresses/codes/RKA, coordinates, query URLs or raw text.
export function profileKazakhstanApiDocument(bytes) {
  if(!bytes.length||bytes.length>config.limits.max_doc_capture_bytes)throw Error('kz-doc-byte-limit');
  let d;try{d=JSON.parse(new TextDecoder('utf8',{fatal:true}).decode(bytes));}catch{throw Error('kz-doc-json');}
  const a=config.api_documentation;
  if(!keys(d,['url','observedAt','title','text'])||d.url!==a.url||d.title!==a.title||typeof d.text!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(d.observedAt)||!Number.isFinite(Date.parse(d.observedAt)))throw Error('kz-doc-binding');
  if(!d.text.includes(a.bearer_notice)||!d.text.includes(a.endpoint_template)||!d.text.includes('РКА'))throw Error('kz-doc-authority-drift');
  const first=d.text.split(a.example_heading),second=first[1]?.split(a.structure_heading);
  if(first.length!==2||second?.length!==2)throw Error('kz-doc-section-drift');
  let sample;try{sample=JSON.parse(second[0]);}catch{throw Error('kz-doc-example-json');}
  if(!Array.isArray(sample?.data)||!sample.data.length||sample.data.length>config.limits.max_documented_example_rows||sample.data.some(r=>!keys(r,['postcode','addressKaz','addressRus','addressLat','coordinateX','coordinateY','_links'])||!/^[A-Z]\d{2}[A-Z]\d[A-Z]\d$/.test(r.postcode)||['addressKaz','addressRus','addressLat'].some(k=>typeof r[k]!=='string')||!['coordinateX','coordinateY'].every(k=>r[k]===null||typeof r[k]==='string'||typeof r[k]==='number')))throw Error('kz-doc-example-shape');
  let structureParseableJson=true;try{JSON.parse(second[1]);}catch{structureParseableJson=false;}
  const nullPairs=sample.data.filter(r=>r.coordinateX===null&&r.coordinateY===null).length;
  const coordinateTypes=['coordinateX','coordinateY'].map(k=>({field:k,declaredString:new RegExp('"'+k+'"\\s*:\\s*"string"').test(second[1])}));
  return {contentVerified:true,status:'public-documentation-profiled-not-live-data',sourceUrl:d.url,observedAt:d.observedAt,captureDigest:sourceDigest(bytes),captureBytes:bytes.length,
    bearerRequired:true,liveRequestsMade:0,rawHttpDataBytesVerified:false,immutableDataArtifact:false,documentationExamples:sample.data.length,
    documentedNullCoordinatePairs:nullPairs,nullCoordinatePairRate:nullPairs/sample.data.length,declaredStructureParseableJson:structureParseableJson,
    documentedCoordinateTypes:coordinateTypes,exampleCoordinatesConvertedToZero:0,exampleCodesImported:0,exampleAddressesImported:0,
    coordinateReferenceSystemVerified:false,currentAssignmentRowsValidated:0,productionGeometryRecords:0,countryM2Achieved:false};
}
export function profileKazakhstanReference(bytes,ref,mime) {
  const base={contentVerified:false,sourceDataRecords:0},type=(mime??'').split(';')[0].trim().toLowerCase();
  if(ref.kind==='reviewed-pdf') {
    if(type!=='application/pdf'||bytes.subarray(0,5).toString()!=='%PDF-')throw Error('kz-pdf-format');
    if(sourceDigest(bytes)!==ref.expected_digest)throw Error('kz-pdf-drift-requires-visual-review');
    return {...base,contentVerified:true,status:'reference-verified-not-data',profile:{printedEdition:ref.printed_edition,physicalPages:ref.physical_pages,visuallyReviewedPages:ref.visually_reviewed_pages,currentFormat:'LNNLNLN',legacyFormat:'NNNNNN',transitionIsDatedGuidance:true,examplesImported:0,currentAssignmentsVerified:false}};
  }
  if(ref.kind==='manual-review')return {...base,status:'manual-review-required-not-data'};
  if(type!=='text/html')throw Error('kz-reference-mime');
  const source=new TextDecoder('utf8',{fatal:true}).decode(bytes),html=visible(source),text=kazakhstanPlain(html);
  if(ref.kind==='app-shell'){
    const root=new RegExp('<div\\b[^>]*id="'+ref.root_id+'"[^>]*>\\s*</div>').test(html),title=kazakhstanPlain(source.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]??'');
    if(!root||ref.title&&title!==ref.title)throw Error('kz-shell-binding');
    return {...base,status:'application-shell-not-data',profile:{shellVerified:true,emptyHtmlDoesNotMeanDataAbsent:true,liveDataEndpointCalled:false}};
  }
  if(ref.kind==='reviewed-legal') {
    const title=kazakhstanPlain(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]??''),articles=[...html.matchAll(/<article\b[^>]*>([\s\S]*?)<\/article>/gi)];
    if(title!==ref.title||articles.length!==1||!html.includes('href="/rus/docs/'+ref.document_id+'"'))throw Error('kz-legal-binding');
    const article=kazakhstanPlain(articles[0][1]),digest=sourceDigest(article);
    if(digest!==ref.expected_article_digest)throw Error('kz-legal-article-drift-requires-review');
    return {...base,contentVerified:true,status:'reference-verified-not-data',profile:{documentId:ref.document_id,articleDigest:digest,articleBytes:Buffer.byteLength(article),effectiveDates:ref.effective_dates,httpLastModifiedIsNotLegalEdition:true,semantics:ref.semantics}};
  }
  const ok=ref.markers.every(m=>text.includes(m));
  return {...base,contentVerified:ok,status:ok?'reference-verified-not-data':'unconfirmed-reference-body',profile:ok?{referenceOnly:true,exactDataArtifactObtained:false}:null};
}
export async function inspectKazakhstanSources(fetcher=fetch,transport='node-verified-tls',docBytes=null) {
  const report={schemaVersion:'postal-context-kz-source-review/v1',countryCode:'KZ',observedAt:new Date().toISOString(),transport,references:[],apiDocumentation:docBytes?profileKazakhstanApiDocument(docBytes):null,
    sourceRowsPersisted:0,currentAssignmentRowsValidated:0,productionGeometryRecords:0,civicBuildingRelations:0,publishedDataArtifacts:0,realAgidRuntimeVerified:false,
    assignmentQuality:{missingCodeRate:null,duplicateAssignmentRate:null,reason:'no-current-licensed-assignment-dataset-obtained; documentation examples are not source rows'},
    rightsReview:config.rights_review,paidOperations:0,authenticatedRequests:0,privateQueries:0,contractAcceptancePerformed:false,countryM2Achieved:false};
  const probe=async ref=>{let receipt;try{
    const {bytes,metadata:m}=await fetchBoundedOfficialResponse(ref.url,{allowedHosts:hosts,fetcher,maxBytes:config.limits.max_response_bytes});
    receipt={...m,requestedUrl:safeKazakhstanUrl(m.requestedUrl),finalUrl:safeKazakhstanUrl(m.finalUrl),redirects:m.redirects.map(safeKazakhstanUrl),observedAt:new Date().toISOString(),byteLength:bytes?.length??null,responseDigest:bytes?sourceDigest(bytes):null};
    const p=bytes?profileKazakhstanReference(bytes,ref,m.contentType):{status:'http-error',contentVerified:false,sourceDataRecords:0};return {id:ref.id,...receipt,...p,sourceDocumentDigest:p.contentVerified?receipt.responseDigest:null};
  }catch(e){return {id:ref.id,requestedUrl:ref.url,observedAt:new Date().toISOString(),...receipt,status:'review-failed',failureKind:kazakhstanFailure(e),contentVerified:false,sourceDocumentDigest:null};}};
  for(let i=0;i<config.references.length;i+=2)report.references.push(...await Promise.all(config.references.slice(i,i+2).map(probe)));
  report.completedAt=new Date().toISOString();return report;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const args=process.argv.slice(2),options={};if(args.length%2)throw Error('usage: --report NEW.json [--api-doc-capture PRIVATE.json] [--curl EXECUTABLE]');
  for(let i=0;i<args.length;i+=2){if(!['--report','--api-doc-capture','--curl'].includes(args[i])||Object.hasOwn(options,args[i]))throw Error('kz-cli-arguments');options[args[i]]=args[i+1];}
  if(!options['--report'])throw Error('kz-report-required');const path=resolve(options['--report']);if(existsSync(path))throw Error('report-already-exists');
  let doc=null;if(options['--api-doc-capture']){if(statSync(options['--api-doc-capture']).size>config.limits.max_doc_capture_bytes)throw Error('kz-doc-byte-limit');doc=readFileSync(options['--api-doc-capture']);}
  const curl=options['--curl'],report=await inspectKazakhstanSources(curl?createPostalCurlFetcher(curl,hosts):fetch,curl?'curl-verified-tls':'node-verified-tls',doc);
  mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({report:path,references:report.references.map(r=>({id:r.id,status:r.status,failure:r.failureKind})),documentationExamples:report.apiDocumentation?.documentationExamples??0,m2:false}));
}
