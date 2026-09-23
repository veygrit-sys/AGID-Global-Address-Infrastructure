import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export const config=JSON.parse(readFileSync(new URL('../data/postal_country_packs/sa/postal-context/m2-source-review.json',import.meta.url),'utf8'));
const fail=message=>{throw new Error(`sa-${message}`)};
export const sourceDigest=bytes=>'sha256:'+createHash('sha256').update(bytes).digest('hex');

export function parseCsv(bytes){
 let text=bytes.toString('utf8');if(text.charCodeAt(0)===0xfeff)text=text.slice(1);
 if(!text.includes('"')){
   const unquoted=text.split(/\r\n|\r|\n/).map(line=>line.split(','));
   if(unquoted.at(-1)?.length===1&&unquoted.at(-1)[0]==='')unquoted.pop();
   if(unquoted.length<2)fail('csv-empty');
   return unquoted;
 }
 const rows=[];let row=[],field='',quoted=false;
 for(let i=0;i<text.length;i++){
   const ch=text[i];
   if(quoted){
     if(ch==='"'&&text[i+1]==='"'){field+='"';i++;}
     else if(ch==='"')quoted=false;
     else field+=ch;
   }else if(ch==='"'&&field==='')quoted=true;
   else if(ch===','){row.push(field);field='';}
   else if(ch==='\r'||ch==='\n'){
     if(ch==='\r'&&text[i+1]==='\n')i++;
     row.push(field);rows.push(row);row=[];field='';
   }else field+=ch;
 }
 if(quoted)fail('csv-unclosed-quote');
 if(field!==''||row.length){row.push(field);rows.push(row);}
 if(rows.at(-1)?.length===1&&rows.at(-1)[0]==='')rows.pop();
 if(rows.length<2)fail('csv-empty');
 return rows;
}

const clean=value=>value.trim().replace(/\s+/g,' ');
const fieldSummary=(header,rows)=>header.map((name,index)=>{
 const values=rows.map(row=>row[index].trim()),nonempty=values.filter(Boolean),normalized=name.toLowerCase().replace(/[^a-z0-9]+/g,'');
 return {name,nonNull:nonempty.length,missing:values.length-nonempty.length,distinctNonNull:new Set(nonempty).size,
   candidatePostal:['الرمز البريدي'].includes(name)||['postal','postcode','zipcode','zip'].some(token=>normalized.includes(token)),
   candidateCoordinate:['X_Google','Y_Google'].includes(name)||['latitude','longitude','xcoord','ycoord'].some(token=>normalized.includes(token)),
   candidateBuilding:name==='رقم المبنى'||normalized.includes('building')};
});

export function profileCsv(bytes){
 const parsed=parseCsv(bytes),header=parsed[0].map(clean),physical=parsed.slice(1),blankRows=physical.filter(row=>row.every(value=>!value.trim())).length;
 const rows=physical.filter(row=>row.some(value=>value.trim()));
 if(header.length<2||rows.some(row=>row.length!==header.length))fail('csv-width');
 const signatures=rows.map(row=>JSON.stringify(row.map(value=>value.trim())));
 return {encoding:'utf-8-bom',delimiter:',',columns:header.length,header,physicalRows:physical.length,blankRows,rows:rows.length,
   exactDuplicateRows:rows.length-new Set(signatures).size,fields:fieldSummary(header,rows)};
}

const htmlText=bytes=>bytes.toString('utf8').replace(/&nbsp;|&#xA0;/gi,' ').replace(/&amp;/gi,'&');
const has=(text,needle)=>text.toLowerCase().includes(needle.toLowerCase());
export function profileReference(bytes,ref){
 if(ref.expected_digest!==sourceDigest(bytes)||ref.reviewed_bytes!==bytes.length)fail('content-drift');
 if(ref.kind==='open-csv')return profileCsv(bytes);
 if(ref.kind==='reviewed-pdf'){
   if(bytes.subarray(0,5).toString()!=='%PDF-')fail('pdf-signature');
   return {...ref.manual_pdf_review,visual_review_bound_by_exact_bytes:true,source_data_rows:0};
 }
 const text=htmlText(bytes);
 if(ref.kind==='national-address-page'){
   for(const marker of ['postal code network covers 100% of Saudi Arabia','Building #','Secondary #','Postal Code'])if(!has(text,marker))fail('national-address-marker');
   return {fiveDigitComponent:true,claimedPostalNetworkCoveragePercent:100,claimDoesNotProvideAssignmentRows:true,assignmentRows:0,polygonRows:0};
 }
 if(ref.kind==='open-data-page'){
   const links=[...text.matchAll(/href=["']([^"']+\.csv)["']/gi)].map(match=>match[1]);
   for(const marker of ['legitimate and educational purposes','entrepreneurs','businesses'])if(!has(text,marker))fail('open-data-marker');
   return {listedCsvDownloads:new Set(links).size,listedCsvIds:config.references.filter(r=>r.kind==='open-csv').map(r=>r.id),
     librarySnapshotOnly:true,exhaustiveNationalDatasetAbsenceClaim:false,exactAgidRedistributionRightsEstablished:false};
 }
 if(ref.kind==='api-terms'){
   for(const marker of ['non-sublicenseable','Remove from your application within 24 hours','Display large number','generic address validation service','Developer Account','Access Credentials'])if(!has(text,marker))fail('api-terms-marker');
   return {limitedLicence:true,nonSublicensable:true,developerAccountRequired:true,credentialsRequired:true,removalWithinHours:24,
     largeDisplayRestricted:true,genericAddressValidationProhibited:true,exactOutputRedistributionRightsEstablished:false,
     observedLinkedInLanguage:true,qualityIssue:'The captured Saudi Post page contains LinkedIn wording; applicability cannot be silently repaired by AGID.'};
 }
 if(ref.kind==='address-geocode-docs'){
   for(const marker of ['access token','subscription key','Four digit numerial Post code','12643'])if(!has(text,marker))fail('geocode-marker');
   return {authenticated:true,liveQueriesMade:0,documentationSaysDigits:4,samplePostcodeDigits:5,officialComponentDigits:5,
     documentationDigitInconsistency:true,sampleIsAssignmentCorpus:false,geometryRows:0};
 }
 if(ref.kind==='api-documentation'){
   for(const marker of ['Free Text','Bulk Search','Address Geocode'])if(!has(text,marker))fail('api-doc-marker');
   return {serviceInventoryOnly:true,assignmentRows:0,geometryRows:0};
 }
 if(ref.kind==='api-products'){
   if(!has(text,'APIs gallery - National Address API - Developer Portal'))fail('api-product-marker');
   return {transportShellOnly:true,subscriptionProductsValidated:false,accountCreated:false,approvalAccepted:false,paidOperations:0};
 }
 if(ref.kind==='privacy-notice'){
   for(const marker of ['personal data','address','location','retention'])if(!has(text,marker))fail('privacy-marker');
   return {addressesAndLocationArePrivacyScoped:true,personalRowsRetained:0,rawRowsPublished:0};
 }
 fail('reference-kind');
}

const indexBy=(header,name)=>{const i=header.indexOf(name);if(i<0)fail('csv-required-field');return i};
const qualityFromCsv=(profiles,bodies)=>{
 const officeProfile=profiles.get('spl-open-csv-03'),officeRows=parseCsv(bodies.get('spl-open-csv-03')).slice(1).filter(r=>r.some(v=>v.trim()));
 const serviceProfile=profiles.get('spl-open-csv-04'),serviceRows=parseCsv(bodies.get('spl-open-csv-04')).slice(1).filter(r=>r.some(v=>v.trim()));
 const oh=officeProfile.header,sh=serviceProfile.header;
 const postalIndex=indexBy(oh,'الرمز البريدي'),xIndex=indexBy(oh,'X_Google'),yIndex=indexBy(oh,'Y_Google');
 const districtIndex=indexBy(oh,'الحي'),streetIndex=indexBy(oh,'اسم الشارع'),englishIndex=indexBy(oh,'اسم الفرع انجليزي');
 const officeKeyIndexes=['رقم المنطقة','رمز المدينة','رقم الفرع'].map(name=>indexBy(oh,name));
 const serviceKeyIndexes=['رقم المنطقة','رمز المدينة','رقم الفرع'].map(name=>indexBy(sh,name));
 const key=(row,indexes)=>indexes.map(index=>row[index].trim()).join('\u001f');
 const postcodes=officeRows.map(row=>row[postalIndex].trim()),coordinates=officeRows.map(row=>[row[xIndex].trim(),row[yIndex].trim()].join('\u001f'));
 const officeKeys=new Set(officeRows.map(row=>key(row,officeKeyIndexes))),serviceKeys=serviceRows.map(row=>key(row,serviceKeyIndexes));
 return {officeQuality:{grain:'postal-office-facility',rows:officeRows.length,postalCodesValidFiveDigits:postcodes.filter(value=>/^\d{5}$/.test(value)).length,
   postalCodesMissing:postcodes.filter(value=>!value).length,postalCodesOtherFormat:postcodes.filter(value=>value&&!/^\d{5}$/.test(value)).length,
   postalCodesDistinct:new Set(postcodes.filter(Boolean)).size,coordinatePairsMissing:officeRows.filter(row=>!row[xIndex].trim()||!row[yIndex].trim()).length,
   coordinatePairsDistinct:new Set(coordinates).size,sharedCoordinateRows:coordinates.length-new Set(coordinates).size,
   districtMissing:officeRows.filter(row=>!row[districtIndex].trim()).length,streetMissing:officeRows.filter(row=>!row[streetIndex].trim()).length,
   englishNameMissing:officeRows.filter(row=>!row[englishIndex].trim()).length,nationalAssignmentCoverageValidated:false},
   serviceJoinQuality:{grain:'office-service',rows:serviceRows.length,exactDuplicateRows:serviceProfile.exactDuplicateRows,distinctOfficeKeys:new Set(serviceKeys).size,
     orphanRowsAgainstOfficeFile:serviceKeys.filter(value=>!officeKeys.has(value)).length,distinctOrphanKeys:new Set(serviceKeys.filter(value=>!officeKeys.has(value))).size,
     officeKeysWithoutService:[...officeKeys].filter(value=>!new Set(serviceKeys).has(value)).length}};
};

export function inspectSaudiArabiaObservations(observations){
 if(observations.length!==config.references.length||new Set(observations.map(o=>o.id)).size!==observations.length)fail('observation-set');
 const bodies=new Map(),profiles=new Map();
 const references=config.references.map(ref=>{
   const o=observations.find(item=>item.id===ref.id);
   if(!o||o.requestedUrl!==ref.url||!Number.isFinite(Date.parse(o.observedAt))||Date.parse(o.observedAt)>Date.now())fail('observation-binding');
   const base={id:ref.id,requestedUrl:ref.url,observedAt:o.observedAt,sourceDataRecords:0};
   if(ref.kind==='failed-acquisition'){
     if(o.failureKind!==ref.reviewed_failure||o.bytes||o.responseDigest)fail('failure-binding');
     return {...base,status:'acquisition-failed',failureKind:o.failureKind,contentVerified:false,sourceDocumentDigest:null};
   }
   const expectedFinal=ref.reviewed_final_url??ref.url,expectedType=ref.reviewed_content_type??'application/octet-stream';
   if(o.httpStatus!==200||o.finalUrl!==expectedFinal||o.contentType!==expectedType||!o.bytes||o.byteLength!==o.bytes.length||o.responseDigest!==sourceDigest(o.bytes))fail('receipt-binding');
   if((ref.reviewed_last_modified??null)!==(o.lastModified??null))fail('last-modified-binding');
   const profile=profileReference(o.bytes,ref);bodies.set(ref.id,o.bytes);profiles.set(ref.id,profile);
   return {...base,title:ref.title??null,finalUrl:o.finalUrl,httpStatus:200,contentType:o.contentType,lastModified:o.lastModified??null,
     byteLength:o.bytes.length,responseDigest:sourceDigest(o.bytes),sourceDocumentDigest:sourceDigest(o.bytes),contentVerified:true,
     status:ref.kind==='open-csv'?'reviewed-public-data-not-m2':'reviewed-reference-not-m2',profile};
 });
 const csv=[...profiles.entries()].filter(([id])=>id.startsWith('spl-open-csv-')).map(([,profile])=>profile),quality=qualityFromCsv(profiles,bodies);
 const rowsReviewed=csv.reduce((sum,p)=>sum+p.rows,0);
 if(profiles.get('spl-open-data').listedCsvDownloads!==csv.length)fail('open-data-library-drift');
 const generatedAt=new Date(Math.max(...observations.map(item=>Date.parse(item.observedAt)))).toISOString();
 return {schemaVersion:'postal-context-sa-source-review/v1',countryCode:'SA',generatedAt,criterionId:config.m2_criterion.id,
   mode:'offline-byte-bound-review',references,openDataSnapshot:{datasets:csv.length,physicalRows:csv.reduce((s,p)=>s+p.physicalRows,0),blankRows:csv.reduce((s,p)=>s+p.blankRows,0),
     rowsReviewed,exactDuplicateRows:csv.reduce((s,p)=>s+p.exactDuplicateRows,0),datasetEdition:null,librarySnapshotOnly:true,exhaustiveNationalDatasetAbsenceClaim:false},
   ...quality,rights:config.rights_gate,postalPolicy:config.policy,currentAssignmentRowsValidated:0,officialPostalGeometryRecords:0,derivedPostalGeometryRecords:0,
   productionGeometryRecords:0,explicitAddressBuildingRelations:0,publishedImmutableDataArtifacts:0,realAgidRuntimeVerified:false,countryM2Achieved:false,
   sourceRowDownloads:rowsReviewed,geocodeQueries:0,paidOperations:0,explicitContractAcceptances:0,newAccountsOrRepositories:0,rawSourceBodiesInGit:0,
   blockerSummary:'No current nationwide rights-cleared SPL assignment membership artifact or postal surface with edition, coverage, CRS, topology, uncertainty, redistribution terms and immutable publication was obtained.'};
}

async function acquire(directory){
 if(existsSync(directory))fail('acquisition-directory-exists');mkdirSync(directory,{recursive:true});
 for(const ref of config.references){
   const receipt={id:ref.id,title:ref.title??null,requestedUrl:ref.url,observedAt:new Date().toISOString()};
   try{
     const url=new URL(ref.url);if(!config.live_allowed_hosts.includes(url.hostname))fail('host');
     const response=await fetch(url,{redirect:'follow',headers:{'user-agent':'AGID-Postal-Context-M2-Audit/1.0'}});
     const bytes=Buffer.from(await response.arrayBuffer());
     if(!response.ok||bytes.length>config.limits.default_max_bytes)fail('http-or-size');
     if(ref.kind==='failed-acquisition'&&bytes.subarray(0,5).toString()!=='%PDF-')throw new Error('large-pdf-invalid-200');
     Object.assign(receipt,{finalUrl:response.url,httpStatus:response.status,contentType:response.headers.get('content-type'),lastModified:response.headers.get('last-modified'),byteLength:bytes.length,responseDigest:sourceDigest(bytes)});
     writeFileSync(resolve(directory,ref.id+'.body'),bytes,{flag:'wx'});
   }catch(error){receipt.failureKind=error.message==='large-pdf-invalid-200'?error.message:'acquisition-failed';}
   writeFileSync(resolve(directory,ref.id+'.receipt.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
 }
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2),options={};if(args.length%2)fail('cli-arguments');
 for(let i=0;i<args.length;i+=2){if(!['--input-dir','--acquire','--report'].includes(args[i])||options[args[i]])fail('cli-arguments');options[args[i]]=args[i+1];}
 if(!options['--report']||Boolean(options['--input-dir'])===Boolean(options['--acquire']))fail('usage');
 if(existsSync(options['--report']))fail('report-already-exists');
 const directory=resolve(options['--input-dir']??options['--acquire']);if(options['--acquire'])await acquire(directory);
 const observations=config.references.map(ref=>{const receipt=JSON.parse(readFileSync(resolve(directory,ref.id+'.receipt.json'))),body=resolve(directory,ref.id+'.body');return {...receipt,bytes:existsSync(body)?readFileSync(body):null};});
 const report=inspectSaudiArabiaObservations(observations);mkdirSync(dirname(resolve(options['--report'])),{recursive:true});writeFileSync(options['--report'],JSON.stringify(report,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({report:options['--report'],references:report.references.length,rowsReviewed:report.openDataSnapshot.rowsReviewed,countryM2Achieved:false}));
}
