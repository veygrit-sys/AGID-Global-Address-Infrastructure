import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchBoundedOfficialResponse, sourceDigest } from './lib/postal-context-source-probe.mjs';
import { readCambodiaTable, profileCambodiaTable, reconcileCambodiaTables } from './lib/postal-context-kh-tables.mjs';

export const config = JSON.parse(readFileSync(new URL('../data/postal_country_packs/kh/postal-context/m2-source-review.json', import.meta.url)));
const hosts = new Set(config.allowed_hosts);
export const resourceUrl = r => `https://data.opendevelopmentcambodia.net/en/dataset/${config.dataset.id}/resource/${r.id}/download/${r.file}`;
const nullable = v => typeof v === 'string' && v.length <= 1024 ? v : null;
export function cambodiaFailure(error) {
  if (/^kh-[a-z-]+$/.test(error?.message ?? '')) return error.message;
  if (['unapproved-reference-host','reference-byte-limit','empty-reference','reference-redirect-limit','redirect-without-location'].includes(error?.message)) return error.message;
  if (['TimeoutError','AbortError'].includes(error?.name)) return 'request-timeout';
  return 'network-or-parser-error';
}
export function profileCambodiaPackage(body, kind = 'dataset') {
  const expected = config[kind], p = body?.result;
  if (!['dataset','law'].includes(kind) || body?.success !== true || p?.id !== expected.id || p.name !== expected.name || p.private !== false || p.organization?.name !== 'cambodia-organization' || p.state !== 'active' || !Array.isArray(p.resources)) throw Error('kh-package-binding');
  if (kind === 'dataset' && (p.resources.length !== config.resources.length || new Set(p.resources.map(r=>r.id)).size !== config.resources.length)) throw Error('kh-resource-count');
  if (kind === 'law' && (p.resources.length !== 1 || p.resources[0].id !== '336ef721-e57a-48da-806e-668493b89f57' || p.resources[0].format !== 'PDF')) throw Error('kh-law-resource-binding');
  const resources = p.resources.map(r=>{
    if (kind === 'dataset') {
      const allow = config.resources.find(x=>x.id===r.id);
      if (!allow || r.url !== resourceUrl(allow) || r.format !== 'CSV') throw Error('kh-resource-binding');
    }
    return {id:r.id,url:nullable(r.url),format:r.format,metadataSize:Number.isSafeInteger(r.size)&&r.size>=0?r.size:null,metadataModified:nullable(r.last_modified),publisherHash:nullable(r.hash),publisherHashUsedForIntegrity:false};
  });
  return {id:p.id,name:p.name,version:nullable(p.version),metadataModified:nullable(p.metadata_modified),citationDate:nullable(p.CI_Citation_date),effectiveDate:nullable(p.odm_effective_date),licenceId:nullable(p.license_id),licenceUrl:nullable(p.license_url),copyrightFlag:nullable(p.odm_copyright),
    sourcePdfLinked:kind==='dataset'?JSON.stringify(p.LI_Lineage??'').includes(config.references[0].url):null,
    transformationDescribed:kind==='dataset'?Boolean(p.LI_ProcessStep?.en):null,executableTransformationVerified:false,resources,currentAssignmentVerified:false,exactUpstreamReuseRightsVerified:false};
}
export function profileCambodiaReference(bytes, ref, mime) {
  const digest=sourceDigest(bytes),base={byteLength:bytes.length,responseDigest:digest,sourceDocumentDigest:null,contentVerified:false,currentAssignmentVerified:false};
  if((mime??'').split(';')[0].trim().toLowerCase()!==ref.mime)return {...base,status:'unexpected-mime'};
  if(ref.mime==='application/pdf') {
    const ok=bytes.subarray(0,5).toString()==='%PDF-'&&digest===ref.expected_digest&&ref.visually_reviewed_pages?.length>0;
    return {...base,status:ok?'selected-pages-reviewed-not-full-data':'pdf-re-review-required',contentVerified:ok,sourceDocumentDigest:ok?digest:null,edition:ok?ref.edition:null,pages:ok?ref.pages:null,pagesWithExtractableText:ok?ref.pages_with_extractable_text:null,visuallyReviewedPages:ok?ref.visually_reviewed_pages:[],fullRowReconciliation:false};
  }
  const plain=new TextDecoder('utf8',{fatal:true}).decode(bytes).replace(/<!--[\s\S]*?-->/g,' ').replace(/<(script|style|head)\b[^>]*>[\s\S]*?<\/\1>/gi,' ').replace(/<[^>]*>/g,' ').replace(/\s+/gu,' ').toLowerCase();
  const markers=ref.markers.map(value=>({value,present:plain.includes(value.toLowerCase())})),ok=markers.length>0&&markers.every(m=>m.present);
  return {...base,status:ok?'public-reference-not-validated-assignment':'unconfirmed-reference-body',contentVerified:ok,sourceDocumentDigest:ok?digest:null,markers};
}
export async function inspectCambodiaSources(fetcher = fetch) {
  const report={schemaVersion:'postal-context-kh-source-review/v1',countryCode:'KH',observedAt:new Date().toISOString(),transport:'node-verified-tls',metadataDownloads:[],references:[],tableDownloads:[],sourceRowsPersisted:0,currentAssignmentRowsValidated:0,publishedDataArtifacts:0,productionGeometryRecords:0,civicBuildingRelations:0,realAgidRuntimeVerified:false,paidOperations:0,authenticatedRequests:0,privateQueries:0,explicitClickthroughOrContractAcceptancePerformed:false,countryM2Achieved:false};
  const get=async(url,maxBytes=config.limits.max_reference_bytes)=>{
    const r=await fetchBoundedOfficialResponse(url,{allowedHosts:hosts,fetcher,maxBytes});
    return {...r,receipt:{...r.metadata,observedAt:new Date().toISOString(),byteLength:r.bytes?.length??null,responseDigest:r.bytes?sourceDigest(r.bytes):null}};
  };
  const metadata=async(kind,repeat=false)=>{
    try{const r=await get(config[kind].url);if(r.bytes&&!(r.metadata.contentType??'').startsWith('application/json'))throw Error('kh-metadata-mime');return {kind,repeat,...r.receipt,status:r.bytes?'public-metadata-reviewed':'http-error',profile:r.bytes?profileCambodiaPackage(JSON.parse(new TextDecoder('utf8',{fatal:true}).decode(r.bytes)),kind):null};}
    catch(e){return {kind,repeat,url:config[kind].url,observedAt:new Date().toISOString(),status:'review-failed',failureKind:cambodiaFailure(e),profile:null};}
  };
  report.metadataDownloads.push(...await Promise.all([metadata('dataset'),metadata('law')]));
  for(let i=0;i<config.references.length;i+=2) report.references.push(...await Promise.all(config.references.slice(i,i+2).map(async ref=>{
    try{const r=await get(ref.url);return {id:ref.id,role:ref.role,...r.receipt,...(r.bytes?profileCambodiaReference(r.bytes,ref,r.metadata.contentType):{status:'http-error',contentVerified:false,sourceDocumentDigest:null})};}
    catch(e){return {id:ref.id,url:ref.url,observedAt:new Date().toISOString(),status:'review-failed',failureKind:cambodiaFailure(e),contentVerified:false,sourceDocumentDigest:null};}
  })));
  const dataset=report.metadataDownloads[0].profile,parsed=new Map();
  const table=async(resource,repeat=false)=>{
    const base={id:resource.id,level:resource.level,labelledLanguage:resource.labelled_language,repeat};
    if(!dataset)return {...base,status:'package-unverified-download-skipped',quality:null};
    try{
      const r=await get(resourceUrl(resource),config.limits.max_csv_bytes);
      if(!r.bytes)return {...base,...r.receipt,status:'http-error',quality:null};
      const data=readCambodiaTable(r.bytes,resource.level,r.metadata.contentType),publisher=dataset.resources.find(x=>x.id===resource.id);
      if(!repeat)parsed.set(resource.id,data);
      return {...base,...r.receipt,status:'full-captured-table-profiled-not-validated-assignment',metadataSizeMatches:publisher.metadataSize===r.bytes.length,quality:profileCambodiaTable(data)};
    }catch(e){return {...base,url:resourceUrl(resource),observedAt:new Date().toISOString(),status:'review-failed',failureKind:cambodiaFailure(e),quality:null};}
  };
  for(let i=0;i<config.resources.length;i+=2)report.tableDownloads.push(...await Promise.all(config.resources.slice(i,i+2).map(r=>table(r))));
  report.aliasGroups=['province','district','commune'].map(level=>{
    const rows=report.tableDownloads.filter(d=>d.level===level),ok=rows.length===2&&rows.every(d=>d.quality)&&rows[0].responseDigest===rows[1].responseDigest;
    return {level,resourceIds:rows.map(d=>d.id),bothProfiled:rows.every(d=>d.quality!==null),byteIdentical:ok,countedOnce:ok,rowsInUniqueTable:ok?rows[0].quality.rows:null};
  });
  const allAliases=report.aliasGroups.every(g=>g.byteIdentical);
  report.uniqueCapturedTables=allAliases?3:null;
  report.uniqueCapturedRows=allAliases?report.aliasGroups.reduce((n,g)=>n+g.rowsInUniqueTable,0):null;
  report.crossTableChecks=allAliases?reconcileCambodiaTables(...['province','district','commune'].map(level=>parsed.get(config.resources.find(r=>r.level===level&&r.labelled_language==='km').id))):null;
  const exception=config.manual_source_exception,prakas=report.references.find(r=>r.id==='prakas'),district=report.tableDownloads.find(r=>r.level==='district'&&!r.repeat);
  report.primaryComparison={manualExceptionBoundToCapturedDigests:prakas?.contentVerified===true&&prakas.responseDigest===exception.prakas_digest&&district?.responseDigest===exception.district_csv_digest,
    expectedException:exception,fullRowReconciliation:false,automaticCorrections:0};
  report.tableDownloads.push(await table(config.resources.find(r=>r.level==='district'&&r.labelled_language==='km'),true));
  report.metadataDownloads.push(await metadata('dataset',true));
  const repeated=report.tableDownloads.at(-1),initialMeta=report.metadataDownloads[0],lastMeta=report.metadataDownloads.at(-1);
  report.repeatComparison={districtDigestMatches:Boolean(district?.quality&&repeated.quality)&&district.responseDigest===repeated.responseDigest,metadataDocumentDigestMatches:Boolean(initialMeta.profile&&lastMeta.profile)&&initialMeta.responseDigest===lastMeta.responseDigest,metadataProfileMatches:Boolean(initialMeta.profile&&lastMeta.profile)&&JSON.stringify(initialMeta.profile)===JSON.stringify(lastMeta.profile),notAnAtomicNationalSnapshot:true};
  report.assignmentQuality={missingCodeRate:null,duplicateAssignmentRate:null,reason:'captured-source-observations-not-validated-current-assignments'};
  report.rightsReview=config.rights_review;
  report.completedAt=new Date().toISOString();return report;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const args=process.argv.slice(2);if(args.length!==2||args[0]!=='--report')throw Error('usage: node scripts/inspect-postal-context-kh-sources.mjs --report new.json');
  const path=resolve(args[1]);if(existsSync(path))throw Error('report-already-exists');
  const report=await inspectCambodiaSources();mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({report:path,uniqueTables:report.uniqueCapturedTables,uniqueRows:report.uniqueCapturedRows,references:report.references.map(r=>({id:r.id,status:r.status})),repeat:report.repeatComparison,primaryExceptionBound:report.primaryComparison.manualExceptionBoundToCapturedDigests,m2:report.countryM2Achieved}));
}
