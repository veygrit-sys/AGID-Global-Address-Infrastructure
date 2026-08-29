import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fetchBoundedOfficialResponse,sourceDigest} from './lib/postal-context-source-probe.mjs';
import {createPostalCurlFetcher} from './lib/postal-context-curl-fetch.mjs';

export const config=JSON.parse(readFileSync(new URL('../data/postal_country_packs/qa/postal-context/m2-source-review.json',import.meta.url)));
const hosts=new Set(config.live_allowed_hosts);
const fail=message=>{throw Error(message);};
export const plain=html=>html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,' ').replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();

// Read the page's explicit data block, never execute its JavaScript or persist
// unrelated browser configuration, cookies, API keys, addresses or form values.
export function odsPage(html){
 const matches=[...html.matchAll(/\$scope\.blocks\s*=\s*(\{[\s\S]*?\});/g)];
 if(matches.length!==1)fail('qa-page-block');
 const block=JSON.parse(matches[0][1]);if(typeof block.html!=='string')fail('qa-page-html');
 return block.html.replace(/&quot;/g,'"').replace(/&#x27;/g,"'").replace(/&gt;/g,'>').replace(/&lt;/g,'<').replace(/&amp;/g,'&');
}

export function profileStreetStatistics(data){
 if(data.error||data.exceededTransferLimit||data.features?.length!==1||data.features[0].geometry)fail('qa-statistics-shape');
 const a=data.features[0].attributes,keys=['FEATURE_COUNT','ZONE_NONNULL','STREET_NONNULL','DATE_NONNULL','MIN_UPDATE','MAX_UPDATE'];
 if(!a||Object.keys(a).sort().join()!==keys.sort().join())fail('qa-statistics-fields');
 const n=a.FEATURE_COUNT;if(!Number.isSafeInteger(n)||n<=0)fail('qa-statistics-count');
 for(const k of ['ZONE_NONNULL','STREET_NONNULL','DATE_NONNULL'])if(!Number.isSafeInteger(a[k])||a[k]<0||a[k]>n)fail('qa-statistics-count');
 if(a.DATE_NONNULL===0?(a.MIN_UPDATE!==null||a.MAX_UPDATE!==null):(!Number.isSafeInteger(a.MIN_UPDATE)||!Number.isSafeInteger(a.MAX_UPDATE)||a.MIN_UPDATE>a.MAX_UPDATE))fail('qa-statistics-date');
 const missing=(k)=>({missing:n-a[k],total:n,rate:(n-a[k])/n});
 return {grain:'road polyline features, not unique addresses, streets or postal regions',featureCount:n,zoneMissingness:missing('ZONE_NONNULL'),streetMissingness:missing('STREET_NONNULL'),dateMissingness:missing('DATE_NONNULL'),nonNullUpdateDateRange:a.DATE_NONNULL?[new Date(a.MIN_UPDATE).toISOString(),new Date(a.MAX_UPDATE).toISOString()]:null,dateRangeDoesNotEstablishWholeDatasetFreshness:true,duplicatesOrTopologyValidated:false,individualRecordsRetrieved:0};
}

export function profileCatalog(data){
 if(data.error||!Number.isSafeInteger(data.total_count)||data.total_count<0||!Array.isArray(data.results)||data.results.length>20)fail('qa-catalog-shape');
 const ids=data.results.map(d=>d.dataset_id);if(ids.some(id=>typeof id!=='string')||new Set(ids).size!==ids.length)fail('qa-catalog-ids');
 return {totalMatches:data.total_count,returned:data.results.length,searchIsExhaustiveNationalInventory:false,datasets:data.results.map(d=>{
   const m=d.metas?.default;if(!m||!Array.isArray(d.fields))fail('qa-catalog-schema');
   return {id:d.dataset_id,title:m.title,declaredRows:m.records_count,publisher:m.publisher,license:m.license,licenseUrl:m.license_url??null,catalogId:d.metas?.custom?.['dataset-id']??null,modified:m.modified,geometryTypes:m.geometry_types??null,fields:d.fields.map(f=>f.name),dataRowsRetrieved:0};
 }),catalogTimestampsAreNotAddressValidity:true};
}

export function profileLocator(data){
 if(data.error||!Array.isArray(data.addressFields)||!Array.isArray(data.candidateFields)||typeof data.capabilities!=='string')fail('qa-locator-schema');
 const fields=data.candidateFields.map(f=>f.name);
 return {serviceVersion:data.currentVersion,locatorVersion:data.locatorProperties?.LocatorVersion??null,capabilities:data.capabilities,spatialReference:data.spatialReference,sourceDescription:data.serviceDescription??null,copyrightText:data.copyrightText??null,addressInputFields:data.addressFields.map(f=>f.name),hasGenericPostalField:fields.includes('Postal'),explicitCandidateIdentifierFields:['ZONE_NO','STREET_NO','BUILDING_NO'].filter(f=>fields.includes(f)),candidateFieldIsAssignment:false,matchScoreIsCalibratedAccuracy:false,currentDataEdition:null,artifactRightsVerified:false,addressQueriesMade:0};
}

export function profileReference(bytes,ref){
 if(!Buffer.isBuffer(bytes)||bytes.length!==ref.reviewed_bytes||sourceDigest(bytes)!==ref.expected_digest)fail('qa-content-drift-requires-review');
 const text=bytes.toString('utf8'),p=plain(text);
 if(ref.kind==='reviewed-pdf'){
   if(bytes.subarray(0,5).toString()!=='%PDF-'||!ref.manual_pdf_review)fail('qa-pdf-binding');
   return {...ref.manual_pdf_review,visualReviewBoundByExactBytes:true,manualReviewReusedNotReperformed:true};
 }
 if(ref.kind==='postal-html'){
   if(!['Postal Addressing Standard','Anwani','Zone Number','Street Number','Building Number','Within Qatar to PO Box'].every(m=>p.includes(m)))fail('qa-postal-markers');
   return {system:'Inwani / Anwani blue-plate address',identifierParts:['zone','street','building'],poBoxIsSeparateDeliveryMode:true,postalAssignmentsProvided:false,sourceRowsRetrieved:0};
 }
 if(ref.kind==='shipping-terms-html'){
   if(!p.includes('SHIPPING DOCUMENTATION')||!p.includes('PERSONAL DATA AND PRIVACY'))fail('qa-terms-markers');
   return {shippingServiceTerms:true,bulkAddressDataLicence:false,personalShipmentDataExcluded:true};
 }
 if(ref.kind==='ods-license'||ref.kind==='ods-terms'){
   const html=odsPage(text),body=plain(html),result={pageBodyDigest:sourceDigest(html),pageBodyBytes:Buffer.byteLength(html),embeddedPageContentParsed:true};
   if(ref.kind==='ods-license'){
     if(!body.includes('CC BY 4.0')||!body.includes('commercial and non-commercial')||!html.includes('En_OpenDataLicensingPolicy.pdf'))fail('qa-license-body');
     return {...result,approvedLicense:'CC-BY-4.0',commercialReuseWithAttribution:true,fullPolicyUrl:'https://www.npc.qa/en/media/Documents/OpenData/En_OpenDataLicensingPolicy.pdf',appliesToEveryGisService:false};
   }
   if(!body.includes('Except as otherwise provided')||!body.includes('prior written permission')||!body.includes('Terms of Use Statement'))fail('qa-portal-terms-body');
   return {...result,generalWebsiteRedistributionRestricted:true,explicitOtherPermissionException:true,doesNotOverrideDatasetSpecificCcByGrant:true,privacySectionObserved:true};
 }
 if(ref.kind==='redirect-shell'){
   if(!text.includes('3;url=https://geoportal.gisqatar.org.qa/qmap/index.html'))fail('qa-redirect-shell');
   return {target:'https://geoportal.gisqatar.org.qa/qmap/index.html',referenceOnly:true,dataOrRuntimeVerified:false};
 }
 if(['app-shell','app-bundle'].includes(ref.kind))return {transportOnly:true,dataOrRightsContentVerified:false,browserExecutionPerformed:false};
 const data=JSON.parse(text);if(data.error)fail('qa-source-error');
 if(ref.kind==='catalog')return profileCatalog(data);
 if(ref.kind==='arcgis-statistics')return profileStreetStatistics(data);
 if(ref.kind==='arcgis-count'){
   if(!Number.isSafeInteger(data.count)||data.count<0)fail('qa-count-schema');
   return {count:data.count,grain:'road polyline features',countIsNotAddressCoverage:true};
 }
 if(ref.kind==='arcgis-locator')return profileLocator(data);
 if(ref.kind==='arcgis-directory'){
   if(!Array.isArray(data.services))fail('qa-directory-schema');
   return {services:data.services.map(s=>({name:s.name,type:s.type})),directoryIsNotExhaustive:true,reason:'The directly accessed ZonesStreets service is not listed by this directory response.'};
 }
 if(ref.kind==='arcgis-service'){
   if(!Array.isArray(data.layers))fail('qa-service-schema');
   return {serviceVersion:data.currentVersion,spatialReference:data.spatialReference,copyrightText:data.copyrightText??null,maxRecordCount:data.maxRecordCount,layers:data.layers.map(l=>({id:l.id,name:l.name,geometryType:l.geometryType})),relationshipCount:data.relationships?.length??null,edition:null,apiVersionIsNotDataEdition:true};
 }
 if(ref.kind==='arcgis-layer'){
   if(data.geometryType!=='esriGeometryPolyline'||!Array.isArray(data.fields))fail('qa-road-schema');
   return {geometryType:data.geometryType,spatialReference:data.extent?.spatialReference,fields:data.fields.map(f=>({name:f.name,type:f.type,nullable:f.nullable})),relationshipCount:data.relationships?.length??null,copyrightText:data.copyrightText??null,sourceEdition:null,postalGeometry:false,buildingRelationVerified:false,schemaNullabilityIsNotMeasuredMissingness:true};
 }
 fail('qa-unreviewed-kind');
}

export function inspectQatarObservations(observations){
 if(observations.length!==config.references.length||new Set(observations.map(o=>o.id)).size!==observations.length)fail('qa-observation-set');
 const references=config.references.map(ref=>{
   const o=observations.find(o=>o.id===ref.id);
   if(!o||o.requestedUrl!==ref.url||!Number.isFinite(Date.parse(o.observedAt))||Date.parse(o.observedAt)>Date.now())fail('qa-observation-binding');
   const base={id:ref.id,requestedUrl:ref.url,observedAt:o.observedAt,sourceDataRecords:0};
   if(o.failureKind){if(o.bytes||o.responseDigest||o.failureKind!==ref.reviewed_failure)fail('qa-failure-binding');return {...base,status:'acquisition-failed',failureKind:o.failureKind,contentVerified:false,sourceDocumentDigest:null};}
   if(o.httpStatus!==200||o.finalUrl!==ref.reviewed_final_url||JSON.stringify(o.redirects)!==JSON.stringify(ref.reviewed_redirects)||o.contentType!==ref.reviewed_content_type||!o.bytes||o.byteLength!==o.bytes.length||o.responseDigest!==sourceDigest(o.bytes))fail('qa-receipt-binding');
   const profile=profileReference(o.bytes,ref),transportOnly=['app-shell','app-bundle'].includes(ref.kind);
   return {...base,finalUrl:o.finalUrl,redirects:o.redirects,httpStatus:200,contentType:o.contentType,lastModified:o.lastModified??null,byteLength:o.bytes.length,responseDigest:sourceDigest(o.bytes),transportBytesVerified:true,contentVerified:!transportOnly,sourceDocumentDigest:transportOnly?null:sourceDigest(o.bytes),status:transportOnly?'transport-only-not-data':'reviewed-reference-or-aggregate-not-m2',profile};
 });
 const by=id=>references.find(r=>r.id===id)?.profile;
 const streets=by('street-statistics');if(streets.featureCount!==by('street-count').count)fail('qa-count-snapshot-mismatch');
 const pages=[by('catalog-building'),by('catalog-building-page2')];
 if(pages[0].totalMatches!==pages[1].totalMatches||pages.reduce((n,p)=>n+p.returned,0)!==pages[0].totalMatches||new Set(pages.flatMap(p=>p.datasets.map(d=>d.id))).size!==pages[0].totalMatches)fail('qa-catalog-pagination-drift');
 return {schemaVersion:'postal-context-qa-source-review/v1',countryCode:'QA',generatedAt:new Date().toISOString(),criterionId:config.m2_criterion.id,mode:'offline-byte-bound-review',references,streetQuality:streets,catalogSearchCoverage:{address:by('catalog-address').totalMatches,zone:by('catalog-zone').totalMatches,building:pages[0].totalMatches,buildingPaginationComplete:true,exhaustiveNationalDatasetAbsenceClaim:false},rights:config.rights_gate,postalPolicy:config.policy,currentAddressRowsValidated:0,postalAssignmentRowsValidated:0,productionGeometryRecords:0,explicitAddressBuildingRelations:0,publishedImmutableDataArtifacts:0,realAgidRuntimeVerified:false,countryM2Achieved:false,addressDataQuality:{missingnessRate:null,duplicateRate:null,nationalCoverage:null,reason:'No complete current rights-cleared Inwani address artifact was obtained; road statistics and census metadata have different grains.'},sourceRowDownloads:0,geocodeQueries:0,publicAggregateQueries:2,paidOperations:0,explicitContractAcceptances:0,newAccountsOrRepositories:0,rawSourceBodiesInGit:0};
}

// Optional reproducible bounded acquisition. Default mode only reads receipts.
// The sole >4 MiB exception is the exact reviewed NPC policy PDF, never a dump.
async function acquire(directory,curl){
 if(existsSync(directory))fail('qa-acquisition-directory-exists');mkdirSync(directory,{recursive:true});
 const fetcher=curl?createPostalCurlFetcher(curl,hosts):fetch;
 for(const ref of config.references){
   const receipt={id:ref.id,requestedUrl:ref.url,observedAt:new Date().toISOString()};
   try{
     let response;
     if(curl&&ref.id==='data-license-pdf-large'){
       const max=config.limits.large_pdf_max_bytes;
       const {stdout}=await promisify(execFile)(curl,['--disable','--silent','--show-error','--include','--suppress-connect-headers','--proto','=https','--max-time','25','--max-filesize',String(max),'--url',ref.url],{encoding:'buffer',maxBuffer:max+65536,timeout:25000,windowsHide:true});
       const end=stdout.indexOf('\r\n\r\n');if(end<0||end>65536)fail('qa-pdf-headers');
       const h=stdout.subarray(0,end).toString('latin1'),bytes=stdout.subarray(end+4),httpStatus=Number(h.match(/^HTTP\/\S+ (\d+)/)?.[1]);
       if(httpStatus!==200||bytes.length>max||bytes.subarray(0,5).toString()!=='%PDF-')fail('qa-pdf-response');
       response={bytes,metadata:{requestedUrl:ref.url,finalUrl:ref.url,redirects:[],httpStatus,contentType:h.match(/content-type:\s*([^\r\n]+)/i)?.[1],lastModified:h.match(/last-modified:\s*([^\r\n]+)/i)?.[1]??null}};
     }else response=await fetchBoundedOfficialResponse(ref.url,{allowedHosts:hosts,fetcher,maxBytes:ref.id==='data-license-pdf-large'?config.limits.large_pdf_max_bytes:config.limits.default_max_bytes});
     const {bytes,metadata}=response;Object.assign(receipt,metadata,{byteLength:bytes?.length??0,responseDigest:bytes?sourceDigest(bytes):null});
     if(bytes)writeFileSync(resolve(directory,ref.id+'.body'),bytes,{flag:'wx'});
   }catch(e){receipt.failureKind=/^(curl-|reference-)/.test(e.message)?e.message:'acquisition-failed';}
   writeFileSync(resolve(directory,ref.id+'.receipt.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
 }
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2),o={};if(args.length%2)fail('qa-cli-arguments');
 for(let i=0;i<args.length;i+=2){if(!['--input-dir','--acquire','--report','--curl'].includes(args[i])||o[args[i]])fail('qa-cli-arguments');o[args[i]]=args[i+1];}
 if(!o['--report']||Boolean(o['--input-dir'])===Boolean(o['--acquire'])||(o['--curl']&&!o['--acquire']))fail('usage: --input-dir DIR --report NEW.json OR --acquire NEWDIR --report NEW.json [--curl EXECUTABLE]');
 if(existsSync(o['--report']))fail('report-already-exists');
 const directory=resolve(o['--input-dir']??o['--acquire']);if(o['--acquire'])await acquire(directory,o['--curl']);
 const observations=config.references.map(ref=>{const r=JSON.parse(readFileSync(resolve(directory,ref.id+'.receipt.json'))),body=resolve(directory,ref.id+'.body');return {...r,bytes:existsSync(body)?readFileSync(body):null};});
 const report=inspectQatarObservations(observations);mkdirSync(dirname(resolve(o['--report'])),{recursive:true});writeFileSync(o['--report'],JSON.stringify(report,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({report:o['--report'],references:report.references.length,contentVerified:report.references.filter(r=>r.contentVerified).length,streetCount:report.streetQuality.featureCount,countryM2Achieved:false}));
}
