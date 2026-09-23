import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {fetchBoundedOfficialResponse,sourceDigest} from './lib/postal-context-source-probe.mjs';
import {createPostalCurlFetcher} from './lib/postal-context-curl-fetch.mjs';

export const config=JSON.parse(readFileSync(new URL('../data/postal_country_packs/mo/postal-context/m2-source-review.json',import.meta.url)));
const hosts=new Set(config.live_allowed_hosts);
export const macaoPlain=s=>s.replace(/<!--[\s\S]*?-->/g,' ').replace(/<(head|script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,' ').replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&(amp|eacute|oacute|aacute|atilde|ldquo|rdquo);/g,(_,name)=>({amp:'&',eacute:'é',oacute:'ó',aacute:'á',atilde:'ã',ldquo:'“',rdquo:'”'})[name]).replace(/\s+/gu,' ').trim();
const failure=e=>/^(mo-[a-z-]+|curl-[a-z-]+|reference-[a-z-]+|unapproved-reference-host|empty-reference|redirect-without-location)$/.test(e?.message??'')?e.message:['AbortError','TimeoutError'].includes(e?.name)?'request-timeout':'network-or-parser-error';

export function decodeMacaoHtml(bytes,encoding,mime=""){
  if(!['utf-8','big5'].includes(encoding))throw Error('mo-unsupported-encoding');
  const html=new TextDecoder(encoding,{fatal:true}).decode(bytes);
  const head=html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1];
  const declarations=[mime.match(/charset\s*=\s*["']?([a-z0-9-]+)/i)?.[1],head?.match(/charset\s*=\s*["']?([a-z0-9-]+)/i)?.[1]].filter(Boolean).map(x=>x.toLowerCase());
  if(!head||!declarations.length||declarations.some(x=>x!==encoding))throw Error('mo-encoding-binding');
  return html;
}

// Exact FAQ 17, not arbitrary occurrence of a postcode elsewhere on the page.
// The form workaround is not an assignment and must not create a postal region.
export function profileMacaoNoPostcode(html,language){
  const sections=[...html.matchAll(/<ol\b[^>]*start="17"[^>]*>([\s\S]*?)<\/ol>/gi)];
  if(sections.length!==1)throw Error('mo-faq-section-binding');
  const text=macaoPlain(sections[0][1]);
  const markers={en:['postcode of Macao','not adopted in Macao','format requirements'],zh:['澳門的郵政編碼','澳門未使用郵政編碼系統','格式要求'],pt:['código postal de Macau','não utiliza um sistema de código postal','requisitos de formato']};
  if(!markers[language]||!markers[language].every(m=>text.includes(m))||!text.includes('000000'))throw Error('mo-no-postcode-policy-binding');
  return {policySection:17,language,sectionDigest:sourceDigest(text),postalSystem:'not_used',postalCode:null,officialPostalGeometry:'none',formPlaceholder:'000000',placeholderIsAssignment:false,sourceRecords:0};
}

export function profileMacaoAuthority(html){
  const p=macaoPlain(html);
  if(!p.includes('第16/2026號行政法規')||!p.includes('第二十五條')||!p.includes('第二十八條')||!p.includes('地圖繪製暨地籍局')||!p.includes('門牌號碼編訂')||!p.includes('第三十條')||!p.includes('二零二六年六月一日起生效'))throw Error('mo-authority-binding');
  return {instrument:'Administrative Regulation 16/2026',effectiveDate:'2026-06-01',reviewedArticles:[25,28,30],currentAuthority:'DSSCU',legacyAuthority:'DSCC',legacySourceIdsPreserved:true,authorityTransitionIsDataLicence:false};
}

export function profileMacaoReproduction(html){
  const parts=macaoPlain(html).split('第102/2026號行政長官批示');if(parts.length!==2)throw Error('mo-instrument-binding');
  const clause=parts[1].split('五、');if(clause.length!==2)throw Error('mo-clause-binding');
  const text=clause[1].split('六、')[0];
  if(!text.includes('刊登或發佈產品複製權')||!text.includes('土地工務局批准')||!text.includes('訂定收費')||!parts[1].includes('二零二六年六月一日起生效'))throw Error('mo-reproduction-binding');
  return {instrument:'Chief Executive Order 102/2026',paragraph:5,effectiveDate:'2026-06-01',clauseDigest:sourceDigest(text.trim()),mappingReproductionPermissionRequired:true,possibleFees:true,permissionObtained:false,contractAccepted:false,dataLicenceVerified:false};
}

export function profileMacaoReference(bytes,ref,mime){
  if(!Buffer.isBuffer(bytes)||bytes.length>config.limits.max_response_bytes)throw Error('reference-byte-limit');
  if(ref.kind==='manual-reference')return {status:'manual-review-required-not-data',contentVerified:false,sourceDataRecords:0};
  if(bytes.length!==ref.reviewed_bytes||sourceDigest(bytes)!==ref.reviewed_digest)throw Error('mo-content-drift-requires-review');
  if((mime??'').split(';')[0].trim().toLowerCase()!=='text/html')throw Error('mo-html-mime');
  const html=decodeMacaoHtml(bytes,ref.encoding,mime),head=html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)[1],titles=[...head.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)];
  if(titles.length!==1||macaoPlain(titles[0][1])!==ref.title)throw Error('mo-title-binding');
  if(ref.kind==='unresolved-html-shell')return {status:'html-shell-not-reviewed-content',contentVerified:false,transportBytesVerified:true,sourceDataRecords:0,profile:{rightsBodyVerified:false,recordsVerified:false,sourceEdition:null,reason:'HTTP success and matching shell bytes do not verify the intended page content.'}};
  let profile={};
  if(ref.id.startsWith('ctt-macao-no-postcode-'))profile=profileMacaoNoPostcode(html,ref.id.split('-').at(-1));
  else if(ref.id==='macao-dsscu-regulation-2026')profile=profileMacaoAuthority(html);
  else if(ref.id==='macao-mapping-reproduction-2026')profile=profileMacaoReproduction(html);
  else if(ref.id==='dscc-macao-migration-notice'){
    const links=[...html.matchAll(/<a\b[^>]*href="([^"]+)"/gi)].map(m=>m[1]);
    if(!links.length||links.some(x=>x!=='https://www.dsscu.gov.mo/')||!macaoPlain(html).includes('新域名'))throw Error('mo-migration-binding');
    profile={pointsTo:'https://www.dsscu.gov.mo/',migrationNoticeOnly:true,currentDataOrTermsVerified:false};
  }else throw Error('mo-unreviewed-reference');
  return {status:'reference-verified-not-data',contentVerified:true,transportBytesVerified:true,sourceDataRecords:0,profile};
}

function empty(mode){return {schemaVersion:'postal-context-mo-source-review/v1',countryCode:'MO',generatedAt:new Date().toISOString(),mode,criterionId:config.m2_criterion.id,references:[],postalPolicy:config.postal_policy,rightsGate:config.rights_gate,currentAddressRowsValidated:0,productionGeometryRecords:0,civicBuildingRelations:0,publishedDataArtifacts:0,realAgidRuntimeVerified:false,quality:{postalCodeMissingness:'not-applicable-no-postcode-system',addressMissingnessRate:null,duplicateAddressRate:null,nationalCoverage:null,reason:'Policy and legal references only; no licensed current address dataset validated.'},rawBodiesPersistedInGit:0,paidOperations:0,authenticatedRequests:0,featureQueries:0,formSubmissions:0,contractAcceptancePerformed:false,countryM2Achieved:false};}

export function inspectMacaoObservations(observations){
  if(observations.length!==config.references.length||new Set(observations.map(o=>o.id)).size!==observations.length)throw Error('mo-observation-set');
  const report=empty('offline-verification-of-initial-reference-acquisition');
  for(const ref of config.references){
    const o=observations.find(x=>x.id===ref.id);
    if(!o||o.requestedUrl!==ref.url||!/^\d{4}-\d{2}-\d{2}T/.test(o.observedAt)||!Number.isFinite(Date.parse(o.observedAt))||Date.parse(o.observedAt)>Date.now())throw Error('mo-observation-binding');
    const base={id:ref.id,requestedUrl:ref.url,observedAt:o.observedAt,networkRequestsDuringVerification:0,sourceDataRecords:0};
    if(o.failure){if(o.bytes||o.failure!==ref.reviewed_failure)throw Error('mo-failure-receipt');report.references.push({...base,status:'acquisition-failed',failureKind:o.failure,contentVerified:false,sourceDocumentDigest:null});continue;}
    if(o.observedAt!==ref.reviewed_observed_at||o.httpStatus!==200||o.finalUrl!==ref.url||o.redirects?.length||!Buffer.isBuffer(o.bytes)||o.byteLength!==o.bytes.length||o.responseDigest!==sourceDigest(o.bytes))throw Error('mo-receipt-binding');
    const p=profileMacaoReference(o.bytes,ref,o.contentType);report.references.push({...base,finalUrl:ref.url,httpStatus:200,encoding:ref.encoding,contentType:o.contentType,lastModified:o.lastModified??null,byteLength:o.bytes.length,responseDigest:sourceDigest(o.bytes),...p,sourceDocumentDigest:p.contentVerified?sourceDigest(o.bytes):null});
  }
  report.completedAt=new Date().toISOString();return report;
}

export async function inspectMacaoSources(fetcher=fetch){
  const report=empty('bounded-public-reference-check');
  for(const ref of config.references){let receipt={id:ref.id,requestedUrl:ref.url};try{
    const {bytes,metadata:m}=await fetchBoundedOfficialResponse(ref.url,{allowedHosts:hosts,fetcher,maxBytes:config.limits.max_response_bytes});
    if(m.finalUrl!==ref.url||m.redirects.length)throw Error('mo-unreviewed-redirect');
    receipt={...receipt,observedAt:new Date().toISOString(),httpStatus:m.httpStatus,contentType:m.contentType,lastModified:m.lastModified,byteLength:bytes?.length??null,responseDigest:bytes?sourceDigest(bytes):null};
    const p=bytes?profileMacaoReference(bytes,ref,m.contentType):{status:'http-error',contentVerified:false,sourceDataRecords:0};report.references.push({...receipt,...p,sourceDocumentDigest:p.contentVerified?receipt.responseDigest:null});
  }catch(e){report.references.push({...receipt,observedAt:receipt.observedAt??new Date().toISOString(),status:'review-failed',failureKind:failure(e),contentVerified:false,sourceDataRecords:0,sourceDocumentDigest:null});}}
  report.completedAt=new Date().toISOString();return report;
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2),o={};if(args.length%2)throw Error('usage: --report NEW.json [--curl EXECUTABLE]');for(let i=0;i<args.length;i+=2){if(!['--report','--curl'].includes(args[i])||Object.hasOwn(o,args[i]))throw Error('mo-cli-arguments');o[args[i]]=args[i+1];}
  if(!o['--report'])throw Error('mo-report-required');const path=resolve(o['--report']);if(existsSync(path))throw Error('report-already-exists');const report=await inspectMacaoSources(o['--curl']?createPostalCurlFetcher(o['--curl'],hosts):fetch);mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({report:path,references:report.references.map(r=>({id:r.id,status:r.status,failure:r.failureKind})),m2:false}));
}
