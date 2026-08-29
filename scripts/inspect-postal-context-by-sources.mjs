import {createHash} from 'node:crypto';
import {createReadStream,readFileSync,statSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export const config=JSON.parse(readFileSync(new URL('../data/postal_country_packs/by/postal-context/m2-source-review.json',import.meta.url),'utf8'));
const fail=message=>{throw new Error(`by-${message}`)};
export const sourceDigest=bytes=>'sha256:'+createHash('sha256').update(bytes).digest('hex');

export async function digestFile(path){const hash=createHash('sha256');await new Promise((ok,bad)=>createReadStream(path).on('data',chunk=>hash.update(chunk)).on('end',ok).on('error',bad));return 'sha256:'+hash.digest('hex');}

const walk=(value,visit)=>{if(Array.isArray(value)){for(const item of value)walk(item,visit);return;}if(value&&typeof value==='object'){visit(value);for(const child of Object.values(value))walk(child,visit);}};
export function profileBelpostObservation(autocomplete,search){
 if(!Array.isArray(autocomplete)||!search||typeof search!=='object')fail('observation-shape');
 const searchRows=Array.isArray(search?.data?.postcodes)?search.data.postcodes:[];const operations=Array.isArray(search?.data?.ops)?search.data.ops:[];const rows=[...autocomplete,...searchRows];const codes=new Set();let invalid=0;let rowsWithGeometry=0;
 for(const row of rows){const code=String(row?.postcode??row?.postCode??row?.index??'');if(code)codes.add(code);if(code&&!/^\d{6}$/.test(code))invalid++;walk(row,object=>{if(Object.hasOwn(object,'geometry')||Object.hasOwn(object,'coordinates')||Object.hasOwn(object,'polygon'))rowsWithGeometry++;});}
 return {autocompleteRows:autocomplete.length,searchTotal:Number(search?.data?.total??search?.total??0),searchPageRows:searchRows.length,operations:operations.length,uniquePostcodes:codes.size,invalidSixDigitRows:invalid,rowsWithGeometry};
}

export function validateBelarusAuditReport(report){
 if(report.countryCode!=='BY'||report.criterionId!==config.m2_criterion.id)fail('report-identity');
 if(report.references.length!==config.references.length||new Set(report.references.map(item=>item.id)).size!==report.references.length)fail('reference-set');
 for(const reference of config.references){const receipt=report.references.find(item=>item.id===reference.id);if(!receipt||receipt.requestedUrl!==reference.url||receipt.httpStatus!==200||receipt.byteLength!==reference.reviewed_bytes||receipt.responseDigest!==reference.expected_digest||receipt.contentVerified!==true)fail('receipt-binding');}
 const live=report.belpostLiveObservation;if(live.postcode!=='220030'||live.autocompleteRows!==21||live.searchTotal!==89||live.searchPageRows!==21||live.operations!==1||live.uniquePostcodes!==1||live.allSixDigit!==true||live.rowsWithGeometry!==0)fail('live-profile');
 const nca=report.ncaPostalZones;if(nca.productionStart!==2020||nca.updateCadence!=='six-months'||nca.nationwideCoverageClaim!==true||nca.actualVectorArtifactRetrieved||nca.currentEditionVerified||nca.publicRedistributionRightsVerified||nca.derivativeRightsVerified||nca.apiRightsVerified)fail('nca-overclaim');
 if(report.mapApi.anonymousProbeCount!==5||report.mapApi.http404!==5||report.mapApi.actualZoneLayerRetrieved)fail('map-api-profile');
 if(report.productionPostalAreaGeometryRecords!==0||report.publishedImmutableDataArtifacts!==0||report.realAgidRuntimeVerified||report.realAgidAppAreaVisualizationVerified||report.countryM2Achieved)fail('m2-overclaim');
 if(report.authenticatedRequests!==0||report.paidOperations!==0||report.contractAcceptances!==0||report.newAccountsRepositoriesOrDestinations!==0||report.rawSourceBodiesInGit!==0)fail('operation-overclaim');
 return {references:8,postcode:'220030',autocompleteRows:21,searchTotal:89,postalAreaGeometries:0,countryM2Achieved:false};
}

export async function auditBelarusSourceDirectory(sourceDirectory,report){
 const receipts=[];for(const reference of config.references){const path=join(sourceDirectory,reference.audit_file);const bytes=statSync(path).size;const digest=await digestFile(path);if(bytes!==reference.reviewed_bytes||digest!==reference.expected_digest)fail(`content-drift-${reference.id}`);receipts.push({id:reference.id,bytes,digest});}
 const zones=readFileSync(join(sourceDirectory,'nca-postal-zones.html'),'utf8');if(!/2020/.test(zones)||!/полгода|шесть месяцев|каждые полгода/i.test(zones)||!/Белпочт/i.test(zones)||!/зон.{0,40}почтов/i.test(zones))fail('nca-methodology-content');
 const rules=readFileSync(join(sourceDirectory,'nca-site-rules.html'),'utf8');if(!/Все права|все права/i.test(rules)||!/материал/i.test(rules)||!/ссылк/i.test(rules))fail('nca-rules-content');
 const mapClient=readFileSync(join(sourceDirectory,'nca-map-app.9ad00b1f.js'),'utf8');if(!mapClient.includes('/api')||!mapClient.includes('/layers/list')||!mapClient.includes('/legal-info'))fail('nca-map-client-content');
 const belpostClient=readFileSync(join(sourceDirectory,'belpost-main.b2d71934a68d497a.js'),'utf8');if(!belpostClient.includes('https://api.belpost.by/api')||!belpostClient.includes('/postcodes')||!belpostClient.includes('/autocomplete'))fail('belpost-client-content');
 const autocomplete=JSON.parse(readFileSync(join(sourceDirectory,'belpost-postcodes-autocomplete-220030.json'),'utf8'));const search=JSON.parse(readFileSync(join(sourceDirectory,'belpost-postcodes-search-220030.json'),'utf8'));const profile=profileBelpostObservation(autocomplete,search);const live=report.belpostLiveObservation;
 if(profile.autocompleteRows!==live.autocompleteRows||profile.searchTotal!==live.searchTotal||profile.searchPageRows!==live.searchPageRows||profile.operations!==live.operations||profile.uniquePostcodes!==live.uniquePostcodes||profile.invalidSixDigitRows!==0||profile.rowsWithGeometry!==0)fail('live-content-drift');
 validateBelarusAuditReport(report);return receipts;
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){const sourceDirectory=process.argv[2];const reportPath=process.argv[3]??fileURLToPath(new URL('../reports/postal-context-m2/by-source-review-2026-08-29.json',import.meta.url));if(!sourceDirectory)fail('usage');const report=JSON.parse(readFileSync(reportPath,'utf8'));console.log(JSON.stringify({report:validateBelarusAuditReport(report),references:await auditBelarusSourceDirectory(sourceDirectory,report)}));}
