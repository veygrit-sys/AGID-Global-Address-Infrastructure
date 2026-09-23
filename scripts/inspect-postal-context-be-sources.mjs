import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export const config=JSON.parse(readFileSync(new URL('../data/postal_country_packs/be/postal-context/m2-source-review.json',import.meta.url),'utf8'));
const fail=message=>{throw new Error(`be-${message}`)};
export const sourceDigest=bytes=>'sha256:'+createHash('sha256').update(bytes).digest('hex');
const mime=value=>(value??'').split(';')[0].trim().toLowerCase();

export function profileBelgiumReference(bytes,reference,contentType=reference.mime){
 if(!Buffer.isBuffer(bytes)||bytes.length!==reference.reviewed_bytes||sourceDigest(bytes)!==reference.expected_digest)fail('content-drift');
 if(mime(contentType)!==reference.mime)fail('mime');
 if(reference.kind==='zip'){
  if(bytes.subarray(0,2).toString()!=='PK')fail('zip-signature');
  return {...reference.expected_profile,exact_archive_bytes_verified:true};
 }
 if(reference.kind==='xls'){
  if(bytes.subarray(0,8).toString('hex')!==reference.ole_magic)fail('xls-signature');
  return {ole_container:true,last_modified:reference.last_modified,row_content_verified:false};
 }
 const text=bytes.toString('utf8');
 const missing=(reference.markers??[]).filter(marker=>!text.toLowerCase().includes(marker.toLowerCase()));
 if(missing.length)fail(`content-marker-${missing[0]}`);
 return {markers_verified:(reference.markers??[]).length};
}

export function validateBelgiumAuditReport(report){
 if(report.countryCode!=='BE'||report.criterionId!==config.m2_criterion.id)fail('report-identity');
 if(report.references.length!==config.references.length||new Set(report.references.map(item=>item.id)).size!==report.references.length)fail('reference-set');
 for(const reference of config.references){const receipt=report.references.find(item=>item.id===reference.id);if(!receipt||receipt.requestedUrl!==reference.url||receipt.httpStatus!==200||receipt.byteLength!==reference.reviewed_bytes||receipt.responseDigest!==reference.expected_digest||receipt.contentVerified!==true)fail('receipt-binding');}
 if(report.postalCantons.featureCount!==1268||report.postalCantons.distinctSourceCodeValues!==1187||report.postalCantons.invalidGeometry!==0||report.postalCantons.specialFeatures!==39)fail('geometry-profile');
 if(JSON.stringify(report.postalCantons.noncanonicalCodeValues)!==JSON.stringify(['612','9']))fail('leading-zero-exceptions');
 if(!report.rights.internalUseGranted||report.rights.commercialUseAllowed||report.rights.explicitPublicRedistributionGrant||report.rights.explicitDerivativeRedistributionGrant||report.rights.explicitPublicApiGrant)fail('rights-overclaim');
 if(report.postalCantons.rightsClearedPublicGeometryRecords!==0||report.publishedImmutableDataArtifacts!==0||report.realAgidRuntimeVerified||report.realAgidAppAreaVisualizationVerified||report.countryM2Achieved)fail('m2-overclaim');
 if(report.authenticatedRequests!==0||report.paidOperations!==0||report.contractAcceptances!==0||report.newAccountsRepositoriesOrDestinations!==0||report.rawSourceBodiesInGit!==0)fail('operation-overclaim');
 return {references:4,features:1268,distinctCodes:1187,invalidGeometry:0,rightsClearedPublicGeometryRecords:0,countryM2Achieved:false};
}

export function auditBelgiumSourceDirectory(sourceDirectory,report){
 const profiles={};for(const reference of config.references)profiles[reference.id]=profileBelgiumReference(readFileSync(join(sourceDirectory,reference.audit_file)),reference,reference.mime);validateBelgiumAuditReport(report);return profiles;
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const sourceDirectory=process.argv[2];const reportPath=process.argv[3]??fileURLToPath(new URL('../reports/postal-context-m2/be-source-review-2026-08-29.json',import.meta.url));if(!sourceDirectory)fail('usage');const report=JSON.parse(readFileSync(reportPath,'utf8'));console.log(JSON.stringify({report:validateBelgiumAuditReport(report),sourceProfiles:auditBelgiumSourceDirectory(sourceDirectory,report)}));
}
