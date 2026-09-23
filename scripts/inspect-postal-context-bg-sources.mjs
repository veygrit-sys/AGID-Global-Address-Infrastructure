import {createHash} from 'node:crypto';
import {createReadStream,readFileSync,statSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export const config=JSON.parse(readFileSync(new URL('../data/postal_country_packs/bg/postal-context/m2-source-review.json',import.meta.url),'utf8'));
const fail=message=>{throw new Error(`bg-${message}`)};
export const sourceDigest=bytes=>'sha256:'+createHash('sha256').update(bytes).digest('hex');

export async function digestFile(path){
 const hash=createHash('sha256');
 await new Promise((ok,bad)=>createReadStream(path).on('data',chunk=>hash.update(chunk)).on('end',ok).on('error',bad));
 return 'sha256:'+hash.digest('hex');
}

export function profileBulgariaFeatureCollection(collection){
 if(collection?.type!=='FeatureCollection'||!Array.isArray(collection.features))fail('feature-collection');
 const features=collection.features.filter(feature=>feature?.properties?.CNTR_ID==='BG');
 const types={};const codes=new Set();let invalidCode=0;
 for(const feature of features){const type=feature?.geometry?.type??'missing';types[type]=(types[type]??0)+1;const code=String(feature?.properties?.POSTCODE??'');codes.add(code);if(!/^\d{4}$/.test(code))invalidCode++;}
 return {features:features.length,distinctPostcodes:codes.size,geometryTypes:types,invalidFourDigitCodes:invalidCode};
}

export function validateBulgariaAuditReport(report){
 if(report.countryCode!=='BG'||report.criterionId!==config.m2_criterion.id)fail('report-identity');
 if(report.references.length!==config.references.length||new Set(report.references.map(item=>item.id)).size!==report.references.length)fail('reference-set');
 for(const reference of config.references){const receipt=report.references.find(item=>item.id===reference.id);if(!receipt||receipt.requestedUrl!==reference.url||receipt.httpStatus!==200||receipt.byteLength!==reference.reviewed_bytes||receipt.responseDigest!==reference.expected_digest||receipt.contentVerified!==true)fail('receipt-binding');}
 if(report.gisco2025.bulgariaFeatures!==4880||report.gisco2025.distinctPostcodes!==4880||report.gisco2025.pointFeatures!==4880||report.gisco2025.polygonFeatures!==0||report.gisco2025.invalidFourDigitCodes!==0)fail('gisco-profile');
 if(JSON.stringify(report.gisco2025.sourceComposition)!==JSON.stringify({memberStatePostalDataset:0,memberStateAddressData:101,geonames:0,gisco2020:4359,manualOrGeocoded:420}))fail('source-composition');
 if(report.bulgarianPostsOpenData.datasetVersion!=='2.4'||report.bulgarianPostsOpenData.datasetDate!=='2020-10-27'||report.bulgarianPostsOpenData.license!=='CC0'||report.bulgarianPostsOpenData.exactResourceBytesVerified||report.currentCompleteAssignmentVerified)fail('assignment-overclaim');
 if(report.productionPostalAreaGeometryRecords!==0||report.publishedImmutableDataArtifacts!==0||report.realAgidRuntimeVerified||report.realAgidAppAreaVisualizationVerified||report.countryM2Achieved)fail('m2-overclaim');
 if(report.authenticatedRequests!==0||report.paidOperations!==0||report.contractAcceptances!==0||report.newAccountsRepositoriesOrDestinations!==0||report.rawSourceBodiesInGit!==0)fail('operation-overclaim');
 return {references:5,points:4880,polygons:0,currentCompleteAssignmentVerified:false,productionPostalAreaGeometryRecords:0,countryM2Achieved:false};
}

export async function auditBulgariaSourceDirectory(sourceDirectory,report){
 const receipts=[];
 for(const reference of config.references){const path=join(sourceDirectory,reference.audit_file);const bytes=statSync(path).size;const digest=await digestFile(path);if(bytes!==reference.reviewed_bytes||digest!==reference.expected_digest)fail(`content-drift-${reference.id}`);receipts.push({id:reference.id,bytes,digest});}
 validateBulgariaAuditReport(report);return receipts;
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const sourceDirectory=process.argv[2];const reportPath=process.argv[3]??fileURLToPath(new URL('../reports/postal-context-m2/bg-source-review-2026-08-29.json',import.meta.url));if(!sourceDirectory)fail('usage');const report=JSON.parse(readFileSync(reportPath,'utf8'));console.log(JSON.stringify({report:validateBulgariaAuditReport(report),references:await auditBulgariaSourceDirectory(sourceDirectory,report)}));
}
