import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import AdmZip from 'adm-zip';

export const config=JSON.parse(readFileSync(new URL('../data/postal_country_packs/cy/postal-context/m2-source-review.json',import.meta.url),'utf8'));
const fail=message=>{throw new Error(`cy-${message}`)};
export const sourceDigest=bytes=>'sha256:'+createHash('sha256').update(bytes).digest('hex');
const decodeXml=value=>value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&#(\d+);/g,(_,code)=>String.fromCodePoint(Number(code)));
const textNodes=value=>[...value.matchAll(/<t(?: [^>]*)?>([\s\S]*?)<\/t>/g)].map(item=>decodeXml(item[1])).join('');
const cellColumn=reference=>reference.match(/^[A-Z]+/)?.[0];
const normalizeCode=value=>{const text=String(value??'').trim().replace(/\.0+$/,'');return /^\d{1,4}$/.test(text)?text.padStart(4,'0'):null};

function workbookSheets(bytes){
 if(bytes.subarray(0,2).toString()!=='PK')fail('xlsx-signature');
 const zip=new AdmZip(bytes);
 const entry=name=>{const found=zip.getEntry(name);if(!found)fail(`xlsx-entry-${name}`);return found.getData().toString('utf8')};
 const sharedEntry=zip.getEntry('xl/sharedStrings.xml');
 const shared=sharedEntry?[...sharedEntry.getData().toString('utf8').matchAll(/<si>([\s\S]*?)<\/si>/g)].map(match=>textNodes(match[1])):[];
 const workbook=entry('xl/workbook.xml');
 const relations=entry('xl/_rels/workbook.xml.rels');
 const targets=new Map([...relations.matchAll(/<Relationship\b([^>]*)\/>/g)].map(match=>{
   const id=match[1].match(/\bId="([^"]+)"/)?.[1];
   const target=match[1].match(/\bTarget="([^"]+)"/)?.[1];
   return [id,target];
 }));
 const sheets=new Map();let formulaCells=0;
 for(const match of workbook.matchAll(/<sheet\b([^>]*)\/>/g)){
   const name=decodeXml(match[1].match(/\bname="([^"]+)"/)?.[1]??'');
   const relationId=match[1].match(/(?:r:)?id="([^"]+)"/)?.[1];
   const target=targets.get(relationId);
   if(!target)continue;
   const path=target.startsWith('/')?target.slice(1):`xl/${target.replace(/^\.\//,'')}`;
   const xml=entry(path.replace(/\\/g,'/'));
   formulaCells+=(xml.match(/<f(?: [^>]*)?>/g)??[]).length;
   const rows=[...xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)].map(row=>{
     const values={};
     for(const cell of row[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)){
       const reference=cell[1].match(/\br="([A-Z]+\d+)"/)?.[1];
       if(!reference)continue;
       const type=cell[1].match(/\bt="([^"]+)"/)?.[1];
       const raw=cell[2].match(/<v>([\s\S]*?)<\/v>/)?.[1]??'';
       const value=type==='s'?shared[Number(raw)]:(type==='inlineStr'?textNodes(cell[2]):decodeXml(raw));
       values[cellColumn(reference)]=value;
     }
     return values;
   });
   sheets.set(name,{rows,xml});
 }
 return {sheets,formulaCells};
}

export function profilePostDirectory(bytes){
 const {sheets,formulaCells}=workbookSheets(bytes);
 const ordered=[...sheets.values()];
 const streets=ordered[0]?.rows;if(!streets)fail('xlsx-streets-sheet');
 const communities=ordered[1]?.rows;if(!communities)fail('xlsx-communities-sheet');
 const streetCodes=streets.slice(1).map(row=>normalizeCode(row.E)).filter(Boolean);
 const communityCodes=communities.slice(1).map(row=>normalizeCode(row.D)).filter(Boolean);
 const current=new Set([...streetCodes,...communityCodes]);
 return {
   street_data_rows:streets.length-1,
   street_distinct_postcodes:new Set(streetCodes).size,
   community_data_rows:communities.length-1,
   community_distinct_postcodes:new Set(communityCodes).size,
   current_addressable_postcodes:current.size,
   geometry_columns:0,
   coordinate_columns:0,
   formula_cells:formulaCells,
   codes:current
 };
}

const firstTag=(xml,tag)=>xml.match(new RegExp(`<${tag}(?: [^>]*)?>([^<]*)<\\/${tag}>`))?.[1]??null;
export function profileCystatGml(bytes){
 const xml=bytes.toString('utf8');
 if(!xml.startsWith('<?xml')||!xml.includes('<gml:FeatureCollection'))fail('gml-signature');
 const spatialIds=[...xml.matchAll(/xlink:href="SU\.ASU\.PO_([^"]+)"/g)].map(match=>match[1]);
 const uniqueIds=new Set(spatialIds);const codes=new Set([...uniqueIds].filter(value=>/^\d{4}$/.test(value)));
 const periods=[...xml.matchAll(/<pd:periodOf(?:Measurement|Reference|Validity)>[\s\S]*?<gml:TimePeriod[\s\S]*?<\/gml:TimePeriod>[\s\S]*?<\/pd:periodOf(?:Measurement|Reference|Validity)>/g)].map(match=>match[0]);
 const measurement=periods.find(value=>value.startsWith('<pd:periodOfMeasurement>'))??'';
 const reference=periods.find(value=>value.startsWith('<pd:periodOfReference>'))??'';
 const validity=periods.find(value=>value.startsWith('<pd:periodOfValidity>'))??'';
 return {
   statistical_distribution_features:(xml.match(/<pd:StatisticalDistribution\b/g)??[]).length,
   unique_spatial_sector_ids:uniqueIds.size,
   four_digit_geometry_codes:codes.size,
   polygon_patches:(xml.match(/<gml:PolygonPatch>/g)??[]).length,
   interior_rings:(xml.match(/<gml:interior>/g)??[]).length,
   srs_name:xml.match(/<gml:Envelope srsName="([^"]+)"/)?.[1]??null,
   measurement_begin:firstTag(measurement,'gml:beginPosition'),
   measurement_end_literal:firstTag(measurement,'gml:endPosition'),
   reference_date:firstTag(reference,'gml:beginPosition'),
   validity_begin:firstTag(validity,'gml:beginPosition'),
   codes
 };
}

const profileMatches=(actual,expected,prefix)=>{for(const [key,value] of Object.entries(expected??{}))if(actual[key]!==value)fail(`${prefix}-${key}`)};
export function profileCyprusReference(bytes,reference){
 if(!Buffer.isBuffer(bytes)||bytes.length!==reference.reviewed_bytes||sourceDigest(bytes)!==reference.expected_digest)fail('content-drift');
 const profile=reference.kind==='post-directory-xlsx'?profilePostDirectory(bytes):reference.kind==='cystat-gml'?profileCystatGml(bytes):fail('reference-kind');
 profileMatches(profile,reference.expected_profile,reference.id);
 return profile;
}

export function compareCurrentAssignmentWithHistoricalGeometry(postProfile,gmlProfile){
 const matched=[...postProfile.codes].filter(code=>gmlProfile.codes.has(code));
 const missingCurrent=[...postProfile.codes].filter(code=>!gmlProfile.codes.has(code)).sort();
 const absentCurrent=[...gmlProfile.codes].filter(code=>!postProfile.codes.has(code)).sort();
 return {matched_current_codes:matched.length,current_codes_without_2011_geometry:missingCurrent.length,geometry_2011_codes_absent_from_current_assignment:absentCurrent.length,matched_current_coverage_rate:Number((matched.length/postProfile.codes.size).toFixed(10)),missing_current_sample:missingCurrent.slice(0,20),geometry_codes_absent_from_current_assignment:absentCurrent};
}

export function validateCyprusAuditReport(report){
 if(report.countryCode!=='CY'||report.criterionId!==config.m2_criterion.id)fail('report-identity');
 if(report.references.length!==config.references.length||new Set(report.references.map(item=>item.id)).size!==report.references.length)fail('reference-set');
 for(const reference of config.references){
   const receipt=report.references.find(item=>item.id===reference.id);
   if(!receipt||receipt.requestedUrl!==reference.url||receipt.httpStatus!==200||receipt.byteLength!==reference.reviewed_bytes||receipt.responseDigest!==reference.expected_digest||receipt.contentVerified!==true)fail('receipt-binding');
 }
 if(report.assignment.currentAddressableCodes!==1131||report.geometry.historicalFourDigitCodes!==845||report.comparison.matchedCurrentCodes!==832||report.comparison.currentCodesWithoutHistoricalGeometry!==299||report.comparison.historicalCodesAbsentFromCurrentAssignment!==13)fail('coverage-profile');
 if(report.geometry.geometryAuthority!=='official-statistical-historical'||report.geometry.currentOperatorPerimeterRecords!==0)fail('geometry-authority');
 if(report.publishedImmutableDataArtifacts!==0||report.realAgidRuntimeVerified||report.realAgidAppAreaVisualizationVerified||report.countryM2Achieved)fail('m2-overclaim');
 if(report.authenticatedRequests!==0||report.paidOperations!==0||report.contractAcceptances!==0||report.newAccountsRepositoriesOrDestinations!==0||report.rawSourceBodiesInGit!==0)fail('operation-overclaim');
 if(report.postalPolicy.historicalStatisticalSectorIsCurrentOperatorArea||report.postalPolicy.communityOrStreetIsPostcodeArea||report.postalPolicy.addressOrBuildingIsPostcodeArea)fail('authority-overclaim');
 return {references:2,currentAddressableCodes:1131,matchedHistoricalCodes:832,currentGeometryCoverageEstablished:false,countryM2Achieved:false};
}

export function auditCyprusSourceDirectory(sourceDirectory,report){
 const profiles={};
 for(const reference of config.references)profiles[reference.id]=profileCyprusReference(readFileSync(join(sourceDirectory,reference.audit_file)),reference);
 const comparison=compareCurrentAssignmentWithHistoricalGeometry(profiles['cyprus-post-directory-2024'],profiles['cystat-postal-sector-gml-2011']);
 const expected=config.expected_comparison;
 if(comparison.matched_current_codes!==expected.matched_current_codes||comparison.current_codes_without_2011_geometry!==expected.current_codes_without_2011_geometry||comparison.geometry_2011_codes_absent_from_current_assignment!==expected['2011_geometry_codes_absent_from_current_assignment']||comparison.matched_current_coverage_rate!==expected.matched_current_coverage_rate||JSON.stringify(comparison.geometry_codes_absent_from_current_assignment)!==JSON.stringify(expected.geometry_codes_absent_from_current_assignment))fail('comparison-drift');
 validateCyprusAuditReport(report);
 return {profiles:{postDirectory:{...profiles['cyprus-post-directory-2024'],codes:undefined},cystatGml:{...profiles['cystat-postal-sector-gml-2011'],codes:undefined}},comparison};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const sourceDirectory=process.argv[2];
 const reportPath=process.argv[3]??fileURLToPath(new URL('../reports/postal-context-m2/cy-source-review-2026-08-29.json',import.meta.url));
 if(!sourceDirectory)fail('usage');
 const report=JSON.parse(readFileSync(reportPath,'utf8'));const result=auditCyprusSourceDirectory(sourceDirectory,report);
 console.log(JSON.stringify({report:validateCyprusAuditReport(report),...result}));
}
