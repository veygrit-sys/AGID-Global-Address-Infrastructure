import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {fetchBoundedOfficialResponse,sourceDigest} from './lib/postal-context-source-probe.mjs';
const P=JSON.parse(readFileSync(new URL('../data/postal_country_packs/ir/postal-context/m2-source-review.json',import.meta.url)));
const HOSTS=new Set(P.allowed_hosts);
const SAFE_BOUNDARY_ERRORS=new Set(['unapproved-reference-host','redirect-without-location','reference-byte-limit','empty-reference','reference-redirect-limit']);

export function irFailureKind(error){
 const chain=[];let e=error;for(let i=0;e&&i<5;i++,e=e.cause)chain.push(e);
 if(chain.some(e=>e.name==='TimeoutError'||e.name==='AbortError'))return 'request-timeout';
 const codes=chain.flatMap(e=>[e.code,...(Array.isArray(e.errors)?e.errors.map(x=>x?.code):[])]);
 if(codes.some(c=>['UND_ERR_CONNECT_TIMEOUT','ETIMEDOUT'].includes(c)))return 'connect-timeout';
 if(codes.some(c=>['ENOTFOUND','EAI_AGAIN'].includes(c)))return 'dns-unresolved';
 if(codes.some(c=>['UNABLE_TO_VERIFY_LEAF_SIGNATURE','CERT_HAS_EXPIRED','DEPTH_ZERO_SELF_SIGNED_CERT'].includes(c)))return 'tls-verification-failed';
 if(SAFE_BOUNDARY_ERRORS.has(error?.message))return error.message;
 return 'network-or-parser-error';
}
export function profileIrReference(bytes,reference,contentType){
 if(!P.reference_probes.some(r=>r.id===reference.id&&r.url===reference.url))throw Error('ir-reference-not-approved');
 if(!bytes.length||bytes.length>P.limits.max_response_bytes)throw Error('reference-byte-limit');
 const mime=(contentType??'').split(';')[0].trim().toLowerCase();
 const base={byteLength:bytes.length,responseDigest:sourceDigest(bytes),sourceDocumentDigest:null,sourceVersion:null,sourceValidity:null,assignmentRowsValidated:0,sourceRowsPersisted:0};
 if(mime!==reference.mime)return {...base,status:'unexpected-mime',contentVerified:false};
 if(mime==='application/pdf')return {...base,status:bytes.subarray(0,5).toString('ascii')==='%PDF-'?'pdf-manual-review-required':'unexpected-pdf-signature',contentVerified:false,pdfVisuallyReviewed:false};
 let html;try{html=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{return {...base,status:'invalid-utf8',contentVerified:false};}
 const body=html.replace(/<!--[\s\S]*?-->/g,' ').replace(/<(script|style|head|template)\b[^>]*>[\s\S]*?<\/\1>/gi,' ');
 const text=body.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
 const markerChecks=reference.body_markers.map(marker=>({marker,present:text.includes(marker)}));
 const verified=markerChecks.length>0&&markerChecks.every(m=>m.present);
 return {...base,status:verified?'public-reference-not-data':'unexpected-body',contentVerified:verified,markerChecks,
  currentAssignmentVerified:false,exactRightsReviewed:false,officialGeometryVerified:false};
}
export async function inspectIrSources(fetcher=fetch){
 if(P.reference_probes.length!==P.limits.max_reference_resources||P.limits.concurrent_resources!==2)throw Error('ir-probe-budget');
 const report={schemaVersion:'postal-context-ir-source-review/v1',countryCode:'IR',observedAt:new Date().toISOString(),transport:'node-default-tls-unauthenticated-https',references:[],
  cacheCanReplaceCurrentBytes:false,assignmentRowsValidated:0,assignmentQuality:{missingCodeRate:null,invalidCodeRate:null,duplicateAssignmentRate:null,reason:'no-current-assignment-rows-acquired'},
  sourceDataSnapshotsRetained:0,sourceRowsPersisted:0,postalLookupRequests:0,coordinateQueries:0,certificateRequests:0,authenticatedRequests:0,bulkDataDownloads:0,
  publishedDataArtifacts:0,paidOperations:0,contractAcceptancePerformed:false,tlsVerificationDisabled:false,realAgidRuntimeVerified:false,countryM2Achieved:false};
 const inspect=async reference=>{
  const base={id:reference.id,requestedUrl:reference.url,role:reference.role,startedAt:new Date().toISOString()};
  try{const r=await fetchBoundedOfficialResponse(reference.url,{allowedHosts:HOSTS,fetcher,maxBytes:P.limits.max_response_bytes});
   const receipt={...base,...r.metadata,observedAt:new Date().toISOString()};
   if(!r.bytes)return {...receipt,status:'http-error',contentVerified:false,byteLength:null,responseDigest:null,sourceDocumentDigest:null,sourceVersion:null,assignmentRowsValidated:0};
   return {...receipt,...profileIrReference(r.bytes,reference,r.metadata.contentType)};
  }catch(e){return {...base,observedAt:new Date().toISOString(),status:'fetch-error',failureKind:irFailureKind(e),httpStatus:null,contentVerified:false,byteLength:null,responseDigest:null,sourceDocumentDigest:null,sourceVersion:null,assignmentRowsValidated:0};}
 };
 for(let i=0;i<P.reference_probes.length;i+=P.limits.concurrent_resources)report.references.push(...await Promise.all(P.reference_probes.slice(i,i+P.limits.concurrent_resources).map(inspect)));
 report.completedAt=new Date().toISOString();return report;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2);if(args.length!==2||args[0]!=='--report')throw Error('usage: node scripts/inspect-postal-context-ir-sources.mjs --report new.json');
 const path=resolve(args[1]);if(existsSync(path))throw Error('report-already-exists');const r=await inspectIrSources();
 mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(r,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({country:'IR',references:r.references.map(x=>({id:x.id,status:x.status,http:x.httpStatus,failureKind:x.failureKind,redirects:x.redirects})),countryM2Achieved:false}));
}
