import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import AdmZip from 'adm-zip';

export const config=JSON.parse(readFileSync(new URL('../data/postal_country_packs/at/postal-context/m2-source-review.json',import.meta.url),'utf8'));
const fail=message=>{throw new Error(`at-${message}`)};
export const sourceDigest=bytes=>'sha256:'+createHash('sha256').update(bytes).digest('hex');
const decodeXml=value=>value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&#(\d+);/g,(_,code)=>String.fromCodePoint(Number(code)));
const cellColumn=reference=>reference.match(/^[A-Z]+/)?.[0];

function workbookRows(bytes){
 if(bytes.subarray(0,2).toString()!=='PK')fail('xlsx-signature');
 const zip=new AdmZip(bytes);
 const entry=name=>{const found=zip.getEntry(name);if(!found)fail(`xlsx-entry-${name}`);return found.getData().toString('utf8')};
 const shared=[...entry('xl/sharedStrings.xml').matchAll(/<si>([\s\S]*?)<\/si>/g)].map(match=>[...match[1].matchAll(/<t(?: [^>]*)?>([\s\S]*?)<\/t>/g)].map(item=>decodeXml(item[1])).join(''));
 const sheet=entry('xl/worksheets/sheet1.xml');
 const rows=[...sheet.matchAll(/<row[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)].map(match=>{
   const values={};
   for(const cell of match[2].matchAll(/<c([^>]*)>([\s\S]*?)<\/c>/g)){
     const reference=cell[1].match(/\br="([A-Z]+\d+)"/)?.[1];
     const type=cell[1].match(/\bt="([^"]+)"/)?.[1];
     const raw=cell[2].match(/<v>([\s\S]*?)<\/v>/)?.[1]??'';
     if(reference)values[cellColumn(reference)]=type==='s'?shared[Number(raw)]:decodeXml(raw);
   }
   return values;
 });
 return {rows,formula_cells:(sheet.match(/<f(?: [^>]*)?>/g)??[]).length};
}

export function profilePostcodeWorkbook(bytes){
 const {rows,formula_cells}=workbookRows(bytes);const header=rows[0]??{};
 if(header.A!=='PLZ'||header.B!=='Ort'||header.C!=='Bundesland'||header.F!=='NamePLZTyp'||header.H!=='adressierbar')fail('postcode-xlsx-schema');
 const data=rows.slice(1);const types=value=>data.filter(row=>row.F===value).length;
 return {data_rows:data.length,distinct_postcodes:new Set(data.map(row=>row.A)).size,current_rows:data.filter(row=>row.E==='NULL').length,addressable_rows:data.filter(row=>row.H==='Ja').length,historical_rows:types('PLZ-Historisch'),po_box_type_rows:types('PLZ-Postfach'),organization_type_rows:types('InteressentenPLZ'),field_post_type_rows:types('FeldPLZ'),unclassified_type_rows:data.filter(row=>!row.F).length,internal_rows:data.filter(row=>row.G==='intern').length,geometry_columns:0,coordinate_columns:0,formula_cells};
}

export function profileDestinationWorkbook(bytes){
 const {rows,formula_cells}=workbookRows(bytes);const header=rows[0]??{};
 if(header.A!=='PLZ'||header.B!=='OrtschaftBeanschriftung'||header.C!=='OKZ'||header.E!=='GEMNR'||header.F!=='GEMNAM')fail('destination-xlsx-schema');
 const data=rows.slice(1);
 return {data_rows:data.length,distinct_postcodes:new Set(data.map(row=>row.A)).size,distinct_locality_codes:new Set(data.map(row=>row.C)).size,distinct_municipality_codes:new Set(data.map(row=>row.E)).size,geometry_columns:0,coordinate_columns:0,formula_cells};
}

export function profileRtrJson(bytes){
 const payload=JSON.parse(bytes.toString('utf8'));const data=payload.data??[];const groups=new Map();
 for(const row of data){const code=String(row.plz);const list=groups.get(code)??[];list.push(row);groups.set(code,list)}
 return {rows:data.length,version_rows:payload.version?.total_rows,version_id:payload.version?.id,published:payload.version?.published,timestamp:payload.timestamp,distinct_postcodes:groups.size,duplicate_postcode_groups:[...groups.values()].filter(rows=>rows.length>1).length,addressable_rows:data.filter(row=>row.adressierbar==='Ja').length,geometry_records:0};
}

export function profileWfsCapabilities(bytes){
 const xml=bytes.toString('utf8');const names=[...xml.matchAll(/<FeatureType>[\s\S]*?<Name>([^<]+)<\/Name>/g)].map(match=>decodeXml(match[1]));
 return {feature_type_names:names.length,postal_feature_type_names:names.filter(name=>/PLZ|POSTLEIT|POSTCODE|\bZIP\b/i.test(name)).length};
}

export function profileStatatlasAllMaps(bytes){
 const features=JSON.parse(bytes.toString('utf8')).features??[];
 return {features:features.length,postcode_text_matches:features.filter(feature=>/Postleit|Postcode/i.test(JSON.stringify(feature.properties??{}))).length};
}

export function profileStatatlasMap(bytes){
 const features=JSON.parse(bytes.toString('utf8')).features??[];const properties=features.map(feature=>feature.properties??{});
 const postalEntry=property=>/Postleit|Postcode|\bPLZ\b/i.test([property.layer_name,property.legend_title,property.geom_level,property.wms_layername,property.wfs_layername,property.layer_special_txt].join(' '));
 return {features:features.length,distinct_layers:new Set(properties.map(property=>property.layer_id)).size,postal_layer_entries:properties.filter(postalEntry).length,map_info_mentions_postcode_regions:/Postleitzahlengebiete/.test(properties[0]?.map_info_txt??''),map_online_from:properties[0]?.is_online_von??null};
}

const profileMatches=(actual,expected,prefix)=>{for(const [key,value] of Object.entries(expected??{}))if(actual[key]!==value)fail(`${prefix}-${key}`)};
export function profileAustriaReference(bytes,reference){
 if(!Buffer.isBuffer(bytes)||bytes.length!==reference.reviewed_bytes||sourceDigest(bytes)!==reference.expected_digest)fail('content-drift');
 if(reference.kind==='postcode-xlsx'){const profile=profilePostcodeWorkbook(bytes);profileMatches(profile,reference.expected_profile,'postcode');return profile}
 if(reference.kind==='destination-xlsx'){const profile=profileDestinationWorkbook(bytes);profileMatches(profile,reference.expected_profile,'destination');return profile}
 if(reference.kind==='rtr-json'){const profile=profileRtrJson(bytes);profileMatches(profile,reference.expected_profile,'rtr');return profile}
 if(reference.kind==='wfs-capabilities'){const profile=profileWfsCapabilities(bytes);profileMatches(profile,reference.expected_profile,'wfs');return profile}
 if(reference.kind==='statatlas-all-maps'){const profile=profileStatatlasAllMaps(bytes);profileMatches(profile,reference.expected_profile,'all-maps');return profile}
 if(reference.kind==='statatlas-map'){const profile=profileStatatlasMap(bytes);profileMatches(profile,reference.expected_profile,'map');return profile}
 if(reference.kind==='reviewed-pdf'){
   if(bytes.subarray(0,5).toString()!=='%PDF-')fail('pdf-signature');
   return {...reference.manual_pdf_review,visual_review_bound_by_exact_bytes:true};
 }
 const text=bytes.toString('utf8');const missing=(reference.markers??[]).filter(marker=>!text.toLowerCase().includes(marker.toLowerCase()));
 if(missing.length)fail(`content-marker-${reference.id}`);
 return {markers_verified:reference.markers?.length??0};
}

export function validateAustriaAuditReport(report){
 if(report.countryCode!=='AT'||report.criterionId!==config.m2_criterion.id)fail('report-identity');
 if(report.references.length!==config.references.length||new Set(report.references.map(item=>item.id)).size!==report.references.length)fail('reference-set');
 for(const reference of config.references){
   const receipt=report.references.find(item=>item.id===reference.id);
   if(!receipt||receipt.requestedUrl!==reference.url||receipt.httpStatus!==200||receipt.byteLength!==reference.reviewed_bytes||receipt.responseDigest!==reference.expected_digest||receipt.contentVerified!==true)fail('receipt-binding');
 }
 if(report.assignment.postDirectoryAddressableCodes!==2234||report.assignment.destinationDirectoryCodes!==2234||report.assignment.rtrDistinctCodes!==2234||!report.assignment.threeWayCodeSetMatch)fail('assignment-profile');
 if(report.geometry.officialOperatorGeometryRecords!==0||report.geometry.officialStatisticalGeometryRecords!==0||report.geometry.derivedGeometryRecords!==0)fail('geometry-overclaim');
 if(report.publishedImmutableDataArtifacts!==0||report.realAgidRuntimeVerified||report.realAgidAppAreaVisualizationVerified||report.countryM2Achieved)fail('m2-overclaim');
 if(report.authenticatedRequests!==0||report.paidOperations!==0||report.contractAcceptances!==0||report.newAccountsRepositoriesOrDestinations!==0||report.rawSourceBodiesInGit!==0)fail('operation-overclaim');
 if(report.postalPolicy.destinationIsPostcodeArea||report.postalPolicy.districtOrMunicipalityIsPostcodeArea||report.postalPolicy.addressOrBuildingIsPostcodeArea)fail('authority-overclaim');
 return {references:report.references.length,assignmentCodes:2234,officialPostalGeometryRecords:0,countryM2Achieved:false};
}

export function auditAustriaSourceDirectory(sourceDirectory,report){
 const profiles={};
 for(const reference of config.references)profiles[reference.id]=profileAustriaReference(readFileSync(join(sourceDirectory,reference.audit_file)),reference);
 validateAustriaAuditReport(report);
 const postCodes=new Set(workbookRows(readFileSync(join(sourceDirectory,'post-plz-sep26.xlsx'))).rows.slice(1).filter(row=>row.H==='Ja').map(row=>row.A));
 const destinationCodes=new Set(workbookRows(readFileSync(join(sourceDirectory,'post-plz-destination-sep26.xlsx'))).rows.slice(1).map(row=>row.A));
 const rtrCodes=new Set(JSON.parse(readFileSync(join(sourceDirectory,'rtr-postcodes.json'),'utf8')).data.map(row=>String(row.plz)));
 const difference=(left,right)=>[...left].filter(value=>!right.has(value));
 if(difference(postCodes,destinationCodes).length||difference(destinationCodes,postCodes).length||difference(postCodes,rtrCodes).length||difference(rtrCodes,postCodes).length)fail('three-way-code-set-drift');
 return profiles;
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const sourceDirectory=process.argv[2];
 const reportPath=process.argv[3]??fileURLToPath(new URL('../reports/postal-context-m2/at-source-review-2026-08-29.json',import.meta.url));
 if(!sourceDirectory)fail('usage');
 const report=JSON.parse(readFileSync(reportPath,'utf8'));const profiles=auditAustriaSourceDirectory(sourceDirectory,report);
 console.log(JSON.stringify({report:validateAustriaAuditReport(report),profiles}));
}
