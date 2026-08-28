import {existsSync,mkdirSync,readFileSync,statSync,writeFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {fetchBoundedOfficialResponse,sourceDigest} from './lib/postal-context-source-probe.mjs';
import {createPostalCurlFetcher} from './lib/postal-context-curl-fetch.mjs';
import {config,profileKuwaitObservations} from './lib/postal-context-kw-observations.mjs';
export {config,profileKuwaitObservations};
const hosts=new Set(config.allowed_hosts);
const strip=s=>s.replace(/<!--[\s\S]*?-->/g,' ').replace(/<(script|style|head|nav|header|footer)\b[^>]*>[\s\S]*?<\/\1>/gi,' ');
export function kuwaitPlain(s) {
  return s.replace(/<[^>]*>/g,' ').replace(/&#(x[0-9a-f]+|[0-9]+);/gi,(_,n)=>{
    const cp=n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):parseInt(n,10);
    return Number.isInteger(cp)&&cp>0&&cp<=0x10ffff&&!(cp>=0xd800&&cp<=0xdfff)?String.fromCodePoint(cp):'\ufffd';
  }).replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/\s+/gu,' ').trim();
}
export function safeKuwaitSourceUrl(value) {
  const u=new URL(value);u.username='';u.password='';u.hash='';
  for(const key of [...u.searchParams.keys()])if(!((key==='tab'&&u.searchParams.get(key)==='2')||(key==='language'&&u.searchParams.get(key)==='en')))u.searchParams.set(key,'REDACTED');
  return u.href;
}
export function kuwaitFailure(e) {
  if(/^(kw-[a-z-]+|curl-[a-z-]+|unapproved-reference-host|reference-byte-limit|reference-redirect-limit|redirect-without-location|empty-reference)$/.test(e?.message??''))return e.message;
  return ['TimeoutError','AbortError'].includes(e?.name)?'request-timeout':'network-or-parser-error';
}
export function profileKuwaitReference(bytes,ref,mime) {
  const base={contentVerified:false,sourceDataRecords:0},type=(mime??'').split(';')[0].trim().toLowerCase();
  if(ref.kind==='reviewed-pdf') {
    if(type!=='application/pdf'||bytes.subarray(0,5).toString()!=='%PDF-')throw Error('kw-pdf-format');
    if(sourceDigest(bytes)!==ref.expected_digest)throw Error('kw-pdf-digest-drift-requires-visual-review');
    return {...base,contentVerified:true,status:'reference-verified-not-data',profile:{printedEdition:ref.printed_edition,physicalPages:ref.physical_pages,visuallyReviewedPages:ref.visually_reviewed_pages,currentAssignmentEditionVerified:false,examplesImported:0}};
  }
  if(ref.kind==='manual-metadata-review')return {...base,status:'manual-review-required-not-data'};
  if(type!=='text/html')throw Error('kw-reference-mime');
  const source=new TextDecoder('utf8',{fatal:true}).decode(bytes),html=strip(source),text=kuwaitPlain(html);
  if(ref.kind==='postal-tables') {
    const tables=[...html.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/gi)].map(m=>m[1]);
    const profiles=config.tables.map(spec=>{
      const matched=tables.filter(t=>JSON.stringify([...t.matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/gi)].map(m=>kuwaitPlain(m[1])))===JSON.stringify([spec.heading,...spec.header]));
      if(!text.includes(spec.heading)||matched.length!==1)throw Error('kw-table-header-binding');
      const rows=[...matched[0].matchAll(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi)].map(m=>[...m[0].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(c=>kuwaitPlain(c[1]))).filter(c=>c.length);
      return {assignmentClass:spec.assignment_class,initialHtmlDataRows:rows.filter(c=>c.length===spec.header.length&&c.some(Boolean)).length,initialHtmlPlaceholderRows:rows.filter(c=>!c.some(Boolean)).length};
    });
    const footers=[...source.matchAll(/<footer\b[^>]*>([\s\S]*?)<\/footer>/gi)].map(m=>m[1]).join(' ');
    return {...base,contentVerified:true,status:'reference-verified-not-data',profile:{tables:profiles,
      emptyInitialHtmlDoesNotMeanEmptyDataset:true,datasetEditionVerified:false,
      rightsReservedFooter:kuwaitPlain(footers).includes('All rights reserved.'),
      privacyPolicyPlaceholderLink:/<a\b[^>]*href="\/en\/under-development"[^>]*>[\s\S]*?Privacy\s*(?:&amp;|&)\s*Policy[\s\S]*?<\/a>/i.test(footers)}};
  }
  const verified=ref.markers.every(m=>text.toLowerCase().includes(m.toLowerCase()));
  return {...base,contentVerified:verified,status:verified?'reference-verified-not-data':'unconfirmed-reference-body',
    profile:verified?{referenceOnly:true,...(ref.kind==='policy-placeholder'?{policyContentAvailable:false}:{}),...(ref.id==='kuwait-csb-census-gis'?{statisticalReferenceYear:2011,termsAccepted:false}:{})}:null};
}
export async function inspectKuwaitSources(fetcher=fetch,transport='node-verified-tls',domBytes=null) {
  const report={schemaVersion:'postal-context-kw-source-review/v1',countryCode:'KW',observedAt:new Date().toISOString(),transport,references:[],
    uiObservations:domBytes?profileKuwaitObservations(domBytes):null,
    sourceRowsPersisted:0,currentAssignmentRowsValidated:0,productionGeometryRecords:0,civicBuildingRelations:0,publishedDataArtifacts:0,realAgidRuntimeVerified:false,
    assignmentQuality:{missingCodeRate:null,duplicateAssignmentRate:null,invalidCodeRate:null,reason:'partial-public-UI-sample-not-complete-validated-national-assignments'},
    rightsReview:config.rights_review,paidOperations:0,authenticatedRequests:0,privateQueries:0,contractAcceptancePerformed:false,countryM2Achieved:false};
  const probe=async ref=>{
    let receipt;try{
      const {bytes,metadata:m}=await fetchBoundedOfficialResponse(ref.url,{allowedHosts:hosts,fetcher,maxBytes:config.limits.max_response_bytes});
      receipt={...m,requestedUrl:safeKuwaitSourceUrl(m.requestedUrl),finalUrl:safeKuwaitSourceUrl(m.finalUrl),redirects:m.redirects.map(safeKuwaitSourceUrl),observedAt:new Date().toISOString(),byteLength:bytes?.length??null,responseDigest:bytes?sourceDigest(bytes):null};
      const p=bytes?profileKuwaitReference(bytes,ref,m.contentType):{status:'http-error',contentVerified:false,sourceDataRecords:0};
      return {id:ref.id,...receipt,...p,sourceDocumentDigest:p.contentVerified?receipt.responseDigest:null};
    }catch(e){return {id:ref.id,requestedUrl:ref.url,observedAt:new Date().toISOString(),...receipt,status:'review-failed',failureKind:kuwaitFailure(e),contentVerified:false,sourceDocumentDigest:null};}
  };
  for(let i=0;i<config.references.length;i+=2)report.references.push(...await Promise.all(config.references.slice(i,i+2).map(probe)));
  report.completedAt=new Date().toISOString();return report;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const args=process.argv.slice(2),options={};
  if(args.length%2)throw Error('usage: --report NEW.json [--dom-captures PRIVATE.json] [--curl EXECUTABLE]');
  for(let i=0;i<args.length;i+=2){if(!['--report','--dom-captures','--curl'].includes(args[i])||Object.hasOwn(options,args[i]))throw Error('kw-cli-arguments');options[args[i]]=args[i+1];}
  if(!options['--report'])throw Error('kw-report-required');
  const path=resolve(options['--report']);if(existsSync(path))throw Error('report-already-exists');
  let dom=null;if(options['--dom-captures']){if(statSync(options['--dom-captures']).size>config.limits.max_dom_capture_bytes)throw Error('kw-dom-byte-limit');dom=readFileSync(options['--dom-captures']);}
  const curl=options['--curl'],report=await inspectKuwaitSources(curl?createPostalCurlFetcher(curl,hosts):fetch,curl?'curl-verified-tls':'node-verified-tls',dom);
  mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({report:path,references:report.references.map(r=>({id:r.id,status:r.status,failure:r.failureKind})),sampleRows:report.uiObservations?.totalSampleRows??0,m2:false}));
}
