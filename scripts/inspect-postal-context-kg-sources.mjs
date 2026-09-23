import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchBoundedOfficialResponse, sourceDigest } from './lib/postal-context-source-probe.mjs';
import { createPostalCurlFetcher } from './lib/postal-context-curl-fetch.mjs';
import { profileKyrgyzDirectory } from './lib/postal-context-kg-directory.mjs';
const config = JSON.parse(readFileSync(new URL('../data/postal_country_packs/kg/postal-context/m2-source-review.json', import.meta.url)));
const hosts = new Set(config.allowed_hosts);
export function kyrgyzFailure(error) {
  if (/^kg-[a-z-]+$/.test(error?.message ?? '')) return error.message;
  if (['unapproved-reference-host','reference-byte-limit','empty-reference','reference-redirect-limit','redirect-without-location','curl-tls-verification-failed','curl-timeout','curl-network-error'].includes(error?.message)) return error.message;
  const code = error?.cause?.code ?? error?.code;
  if (['UNABLE_TO_VERIFY_LEAF_SIGNATURE','CERT_HAS_EXPIRED','UNABLE_TO_GET_ISSUER_CERT_LOCALLY'].includes(code)) return 'tls-verification-failed';
  if (['ENOTFOUND','EAI_AGAIN'].includes(code)) return 'dns-unresolved';
  if (['ETIMEDOUT','UND_ERR_CONNECT_TIMEOUT'].includes(code) || ['TimeoutError','AbortError'].includes(error?.name)) return 'request-timeout';
  return 'network-or-parser-error';
}
export function profileKyrgyzReference(bytes, ref, mime) {
  const digest = sourceDigest(bytes), base = { byteLength: bytes.length, responseDigest: digest, sourceDocumentDigest: null, contentVerified: false };
  if ((mime ?? '').split(';')[0].trim().toLowerCase() !== ref.mime) return { ...base, status: 'unexpected-mime' };
  if (ref.mime === 'application/pdf') {
    const ok = bytes.subarray(0,5).toString() === '%PDF-' && digest === ref.expected_digest && ref.visually_reviewed_pages?.length > 0;
    return { ...base, status: ok ? 'reviewed-format-reference-not-data' : 'pdf-re-review-required', contentVerified: ok,
      sourceDocumentDigest: ok ? digest : null, edition: ok ? ref.edition : null, visuallyReviewedPages: ok ? ref.visually_reviewed_pages : [], currentAssignmentVerified: false };
  }
  const text = new TextDecoder('utf8', { fatal: true }).decode(bytes).replace(/<!--[\s\S]*?-->/g,' ').replace(/<(script|style|head)\b[^>]*>[\s\S]*?<\/\1>/gi,' ').replace(/<[^>]*>/g,' ').replace(/\s+/gu,' ');
  const markers = ref.markers.map(value => ({value, present:text.toLowerCase().includes(value.toLowerCase())}));
  const ok = markers.length > 0 && markers.every(m => m.present);
  return { ...base, status: ok ? 'public-reference-not-assignment' : 'unconfirmed-reference-body', contentVerified: ok,
    sourceDocumentDigest: ok ? digest : null, markers, currentAssignmentVerified: false, exactDirectoryLicenceVerified: false };
}
export function profileKyrgyzCatalog(body) {
  const r=body?.result;
  if (body?.success !== true || !Number.isInteger(r?.count) || r.count < 0 || !Array.isArray(r.results) || r.results.length > 20 || r.results.length > r.count) throw Error('kg-catalog-shape');
  const stringOrNull = v => typeof v === 'string' && v.length <= 1024 ? v : null;
  if (r.results.some(item => item.private !== false)) throw Error('kg-catalog-not-public');
  return { count: r.count, returned: r.results.length, completeForQuery: r.results.length === r.count, notNationalAbsenceProof: true,
    items: r.results.map(item => ({ id:stringOrNull(item.id), name:stringOrNull(item.name), title:stringOrNull(item.title),
      modified:stringOrNull(item.metadata_modified), licenceId:stringOrNull(item.license_id), licenceUrl:stringOrNull(item.license_url),
      resourceCount: Array.isArray(item.resources) ? item.resources.length : null, currentPostalAssignmentVerified:false })),
    resourceDownloads:0, exactDirectoryLicenceVerified:false };
}
export async function inspectKyrgyzSources(fetcher = fetch, transport = 'node-verified-tls') {
  const report = { schemaVersion:'postal-context-kg-source-review/v1', countryCode:'KG', observedAt:new Date().toISOString(), transport,
    references:[], directoryDownloads:[], catalogQueries:[], sourceRowsPersisted:0, currentAssignmentRowsValidated:0,
    assignmentQuality:{missingCodeRate:null,duplicateAssignmentRate:null,reason:'directory-observations-are-not-validated-current-assignments'},
    publishedDataArtifacts:0, productionGeometryRecords:0, civicBuildingRelations:0, realAgidRuntimeVerified:false,
    paidOperations:0, authenticatedRequests:0, privateQueries:0, explicitClickthroughOrContractAcceptancePerformed:false, countryM2Achieved:false };
  const get = async url => { const r=await fetchBoundedOfficialResponse(url,{allowedHosts:hosts,fetcher,maxBytes:config.limits.max_reference_bytes});return {...r,receipt:{...r.metadata,observedAt:new Date().toISOString(),byteLength:r.bytes?.length??null,responseDigest:r.bytes?sourceDigest(r.bytes):null}}; };
  const directory = async repeat => { try { const r=await get(config.directory_url);return {repeat,...r.receipt,status:r.bytes?'directory-profiled-not-current-assignment':'http-error',quality:r.bytes?profileKyrgyzDirectory(r.bytes,r.metadata.contentType):null}; } catch(e) { return {repeat,url:config.directory_url,observedAt:new Date().toISOString(),status:'review-failed',failureKind:kyrgyzFailure(e),quality:null}; } };
  report.directoryDownloads.push(await directory(false));
  const reference = async ref => { try { const r=await get(ref.url);return {id:ref.id,role:ref.role,...r.receipt,...(r.bytes?profileKyrgyzReference(r.bytes,ref,r.metadata.contentType):{status:'http-error',contentVerified:false,sourceDocumentDigest:null})}; } catch(e) { return {id:ref.id,url:ref.url,observedAt:new Date().toISOString(),status:'review-failed',failureKind:kyrgyzFailure(e),contentVerified:false,sourceDocumentDigest:null}; } };
  for(let i=0;i<config.references.length;i+=2) report.references.push(...await Promise.all(config.references.slice(i,i+2).map(reference)));
  for(const query of config.catalog_queries) {
    const url=`https://data.gov.kg/api/3/action/package_search?q=${encodeURIComponent(query)}&rows=20`;
    try { const r=await get(url);if(r.bytes && !(r.metadata.contentType??'').startsWith('application/json'))throw Error('kg-catalog-mime');report.catalogQueries.push({query,...r.receipt,status:r.bytes?'public-metadata-reviewed':'http-error',profile:r.bytes?profileKyrgyzCatalog(JSON.parse(new TextDecoder('utf8',{fatal:true}).decode(r.bytes))):null}); }
    catch(e) { report.catalogQueries.push({query,url,observedAt:new Date().toISOString(),status:'review-failed',failureKind:kyrgyzFailure(e),profile:null}); }
  }
  report.directoryDownloads.push(await directory(true));
  const [first,second]=report.directoryDownloads;
  report.repeatComparison={bothProfiled:Boolean(first.quality&&second.quality),literalDigestMatches:first.quality&&second.quality?first.quality.tableLiteralDigest===second.quality.tableLiteralDigest:null,
    documentDigestMatches:first.responseDigest&&second.responseDigest?first.responseDigest===second.responseDigest:null,
    publicationMetadataMatches:first.quality&&second.quality?JSON.stringify(first.quality.dates)===JSON.stringify(second.quality.dates):null,
    notAnAtomicNationalSnapshot:true};
  report.completedAt=new Date().toISOString(); return report;
}
if(process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args=process.argv.slice(2);if(args.length!==2||args[0]!=='--report')throw Error('usage: node scripts/inspect-postal-context-kg-sources.mjs --report new.json');
  const path=resolve(args[1]);if(existsSync(path))throw Error('report-already-exists');
  const curl = process.platform === 'win32' ? createPostalCurlFetcher('C:/Windows/System32/curl.exe',hosts) : null;
  const fetcher = curl ? (url,options)=>new URL(url).hostname.endsWith('post.kg')?curl(url,options):fetch(url,options) : fetch;
  const report=await inspectKyrgyzSources(fetcher,curl?'Windows verified TLS for post.kg; Node verified TLS for other allowlisted hosts':'node-verified-tls');
  mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({report:path,country:report.countryCode,rows:report.directoryDownloads[0].quality?.rows??0,referencesVerified:report.references.filter(r=>r.contentVerified).length,repeat:report.repeatComparison,catalog:report.catalogQueries.map(r=>({query:r.query,status:r.status,count:r.profile?.count??null})),m2:report.countryM2Achieved}));
}
