import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {fetchBoundedOfficialResponse,sourceDigest} from './lib/postal-context-source-probe.mjs';
import {createPostalCurlFetcher} from './lib/postal-context-curl-fetch.mjs';
import {profileKoreaPoboxArchive} from './lib/postal-context-kr-pobox.mjs';
export const config=JSON.parse(readFileSync(new URL('../data/postal_country_packs/kr/postal-context/m2-source-review.json',import.meta.url)));
const hosts=new Set(config.allowed_hosts);
const visible=s=>s.replace(/<!--[\s\S]*?-->/g,' ').replace(/<(script|style|head|nav|header|footer)\b[^>]*>[\s\S]*?<\/\1>/gi,' ');
const plain=s=>s.replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&#034;|&quot;/g,'"').replace(/&amp;/g,'&').replace(/\s+/gu,' ').trim();
export function safeKoreaSourceUrl(value) {
  const url=new URL(value);url.pathname=url.pathname.replace(/;jsessionid=[^;/]+/gi,';jsessionid=REDACTED');
  for(const key of [...url.searchParams.keys()])if(!['pSiteIdx','recommendDataYn','publicDataPk'].includes(key))url.searchParams.set(key,'REDACTED');
  url.hash='';return url.href;
}
export function koreaFailure(e) {
  if(/^(kr-[a-z-]+|curl-[a-z-]+|unapproved-reference-host|reference-byte-limit|reference-redirect-limit|redirect-without-location|empty-reference)$/.test(e?.message??''))return e.message;
  return ['TimeoutError','AbortError'].includes(e?.name)?'request-timeout':'network-or-parser-error';
}
export function profileKoreaReference(bytes,ref,mime) {
  if((mime??'').split(';')[0].toLowerCase()!=='text/html')throw Error('kr-reference-mime');
  const html=visible(new TextDecoder('utf8',{fatal:true}).decode(bytes)),text=plain(html);
  const base={contentVerified:false,sourceDataRecords:0};
  if(ref.kind==='system'||ref.kind==='juso-guidance') {
    const ok=ref.markers.every(m=>text.includes(m));return {...base,contentVerified:ok,status:ok?'reference-verified-not-data':'unconfirmed-reference-body'};
  }
  if(ref.kind==='download-index') {
    const asOf=text.match(/(\d{4}\.\d{2}\.\d{2})기준/),rows=[...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)],pobox=rows.filter(r=>r[1].includes('/search/areacd/areacd_pobox_DB.zip'));
    const date=pobox.length===1?plain(pobox[0][1]).match(/\d{4}\.\d{2}\.\d{2}/)?.[0]:null;
    if(!asOf||!date||!text.includes('사서함주소 DB'))throw Error('kr-index-binding');
    const profile={asOf:asOf[1].replaceAll('.','-'),publicationDate:date.replaceAll('.','-'),poboxLinkVerified:true};
    const editionMatches=profile.asOf===config.pobox.as_of&&profile.publicationDate===config.pobox.publication_date;
    return {...base,contentVerified:true,status:'reference-verified-not-data',profile:{...profile,editionMatches,mutableDownloadUrl:true}};
  }
  const idMatch=new RegExp('<input[^>]*id="publicDataPk"[^>]*value="'+ref.catalog_id+'"').test(html);
  const fields=new Map([...html.matchAll(/<strong class="key">([^<]*)<\/strong>\s*<div class="value[^\"]*">([\s\S]*?)<\/div>/g)].map(m=>[plain(m[1]),plain(m[2])]));
  const name=fields.get('파일데이터명')??fields.get('OpenAPI 명');
  if(!idMatch||!name?.includes(ref.title_marker)||!/^\d{4}-\d{2}-\d{2}$/.test(fields.get('수정일')??''))throw Error('kr-catalog-binding');
  const description=fields.get('설명')??'';
  const licence=text.includes('(제 4유형)')?'KOGL-Type-4':text.includes('(제 1유형)')?'KOGL-Type-1':text.includes('이용허락범위 제한 없음')?'no-use-scope-restriction-in-catalog':'not-confirmed';
  return {...base,contentVerified:true,status:'reference-verified-not-data',profile:{catalogId:ref.catalog_id,title:name,modifiedDate:fields.get('수정일'),registeredDate:fields.get('등록일')??null,
    listedFormat:fields.get('확장자')??fields.get('데이터 포맷')??null,catalogRowCount:/^\d+$/.test(fields.get('전체 행')??'')?Number(fields.get('전체 행')):null,
    temporalCoverage:fields.get('시간범위')??null,licence,applicationAndPurposeReview:description.includes('이용목적 심사'),identityConfirmation:description.includes('본인확인')||description.includes('본인 인증'),
    currentDataEditionVerified:false,geometryArtifactDownloaded:false,catalogCountsAreNotFeatureCounts:true}};
}
export async function inspectKoreaSources(fetcher=fetch,transport='node-verified-tls') {
  const report={schemaVersion:'postal-context-kr-source-review/v1',countryCode:'KR',observedAt:new Date().toISOString(),transport,references:[],poboxDownloads:[],sourceRowsPersisted:0,
    currentAssignmentRowsValidated:0,productionGeometryRecords:0,civicBuildingRelations:0,publishedDataArtifacts:0,realAgidRuntimeVerified:false,
    assignmentQuality:{missingCodeRate:null,duplicateAssignmentRate:null,reason:'source-observations-not-complete-validated-national-assignments'},
    rightsReview:config.rights_review,paidOperations:0,authenticatedRequests:0,privateQueries:0,contractAcceptancePerformed:false,countryM2Achieved:false};
  const get=async url=>{
    const r=await fetchBoundedOfficialResponse(url,{allowedHosts:hosts,fetcher,maxBytes:config.limits.max_response_bytes}),m=r.metadata;
    return {...r,receipt:{...m,requestedUrl:safeKoreaSourceUrl(m.requestedUrl),finalUrl:safeKoreaSourceUrl(m.finalUrl),redirects:m.redirects.map(safeKoreaSourceUrl),observedAt:new Date().toISOString(),byteLength:r.bytes?.length??null,responseDigest:r.bytes?sourceDigest(r.bytes):null}};
  };
  const reference=async ref=>{
    let receipt;try{const r=await get(ref.url);receipt=r.receipt;const p=r.bytes?profileKoreaReference(r.bytes,ref,r.metadata.contentType):{status:'http-error',contentVerified:false,sourceDataRecords:0};return {id:ref.id,...r.receipt,...p,sourceDocumentDigest:p.contentVerified?r.receipt.responseDigest:null};}
    catch(e){return {id:ref.id,requestedUrl:ref.url,observedAt:new Date().toISOString(),...receipt,status:'review-failed',failureKind:koreaFailure(e),contentVerified:false,sourceDocumentDigest:null};}
  };
  for(let i=0;i<config.references.length;i+=2)report.references.push(...await Promise.all(config.references.slice(i,i+2).map(reference)));
  const index=report.references.find(r=>r.id==='epost-download-index');
  for(const repeat of [false,true]){
    if(!index?.profile?.editionMatches){report.poboxDownloads.push({repeat,status:'index-edition-unverified-download-skipped',profile:null});continue;}
    try{const r=await get(config.pobox.url);if(!r.bytes){report.poboxDownloads.push({repeat,...r.receipt,status:'http-error',profile:null});continue;}
      if(sourceDigest(r.bytes)!==config.pobox.expected_zip_digest)throw Error('kr-archive-digest-drift');
      if((r.metadata.contentType??'').split(';')[0]!=='application/zip')throw Error('kr-zip-mime');
      report.poboxDownloads.push({repeat,...r.receipt,status:'captured-pobox-observations-profiled-not-validated-national-data',profile:profileKoreaPoboxArchive(r.bytes)});
    }catch(e){report.poboxDownloads.push({repeat,requestedUrl:config.pobox.url,observedAt:new Date().toISOString(),status:'review-failed',failureKind:koreaFailure(e),profile:null});}
  }
  const repeatedIndex=await reference(config.references.find(r=>r.id==='epost-download-index'));
  report.references.push({...repeatedIndex,repeat:true});
  report.repeatComparison={archiveBytesMatch:report.poboxDownloads.every(r=>r.profile!==null)&&report.poboxDownloads[0].responseDigest===report.poboxDownloads[1].responseDigest,
    indexEditionMatches:Boolean(index?.profile?.editionMatches&&repeatedIndex.profile?.editionMatches),notAnAtomicNationalSnapshot:true};
  report.completedAt=new Date().toISOString();return report;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2);if(![2,4].includes(args.length)||args[0]!=='--report'||args.length===4&&args[2]!=='--curl')throw Error('usage: --report NEW_REPORT.json [--curl EXECUTABLE]');
  const path=resolve(args[1]);if(existsSync(path))throw Error('report-already-exists');
  const report=await inspectKoreaSources(args[3]?createPostalCurlFetcher(args[3],hosts):fetch,args[3]?'curl-verified-tls':'node-verified-tls');
  mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({report:path,references:report.references.map(r=>({id:r.id,status:r.status,failure:r.failureKind})),pobox:report.poboxDownloads.map(r=>({status:r.status,rows:r.profile?.text.rows,failure:r.failureKind})),repeat:report.repeatComparison,m2:false}));
}
