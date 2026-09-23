import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

export const config=JSON.parse(readFileSync(new URL('../data/postal_country_packs/tw/postal-context/m2-source-review.json',import.meta.url),'utf8'));
const fail=message=>{throw new Error(`tw-${message}`)};
export const sourceDigest=bytes=>'sha256:'+createHash('sha256').update(bytes).digest('hex');
const geometryKey=key=>/geometry|coordinates|polygon|multipolygon|boundary|bbox|(^|_)(lat|latitude|lon|lng|longitude|geom|wkt|geojson)($|_)/i.test(key);

export function profileTaiwanLinkCatalog(bytes,reference){
 if(!Buffer.isBuffer(bytes)||bytes.length!==reference.reviewed_bytes||sourceDigest(bytes)!==reference.expected_digest)fail('content-drift');
 const text=new TextDecoder('big5').decode(bytes).replace(/^\uFEFF/,'').trim();
 const rows=text.split(/\r?\n/).map(line=>line.split(','));
 if(JSON.stringify(rows[0])!==JSON.stringify(['檔案名稱','格式','下載網址'])||rows.length!==5)fail('link-catalog-shape');
 const fields=rows[0];
 const areaFields=fields.filter(geometryKey);
 const postcodeFields=fields.filter(key=>/郵遞區號|postcode|zip/i.test(key));
 if(areaFields.length||postcodeFields.length)fail('link-catalog-field-drift');
 return {catalogRows:rows.length-1,fields,assignmentRows:0,postcodeFields:0,geometryFields:0};
}

export function profileTaiwanReference(bytes,reference){
 if(reference.kind==='big5-link-catalog')return profileTaiwanLinkCatalog(bytes,reference);
 if(!Buffer.isBuffer(bytes)||bytes.length!==reference.reviewed_bytes||sourceDigest(bytes)!==reference.expected_digest)fail('content-drift');
 if(reference.kind==='reviewed-pdf'){
  if(bytes.subarray(0,5).toString()!=='%PDF-')fail('pdf-signature');
  return {...reference.manual_review,visual_review_bound_by_exact_bytes:true};
 }
 if(reference.kind==='reviewed-odt'){
  if(bytes[0]!==0x50||bytes[1]!==0x4b)fail('odt-signature');
  return {manual_review_bound_by_exact_bytes:true,geometryRecords:0};
 }
 const text=bytes.toString('utf8');
 if(!/<html|<!doctype/i.test(text))fail('html-signature');
 return {manual_review_bound_by_exact_bytes:true,geometryRecords:0};
}

export function validateTaiwanAuditReport(report){
 if(report.countryCode!=='TW'||report.criterionId!==config.m2_criterion.id)fail('report-identity');
 if(report.references.length!==config.references.length||new Set(report.references.map(item=>item.id)).size!==report.references.length)fail('reference-set');
 for(const reference of config.references){
  const receipt=report.references.find(item=>item.id===reference.id);
  if(!receipt||receipt.requestedUrl!==reference.url||!Number.isFinite(Date.parse(receipt.observedAt)))fail('receipt-binding');
  if(receipt.httpStatus!==200||receipt.byteLength!==reference.reviewed_bytes||receipt.responseDigest!==reference.expected_digest||receipt.contentVerified!==true)fail('content-binding');
 }
 if(report.dataGovResourceProfile.catalogRows!==4||report.dataGovResourceProfile.assignmentRows!==0
   ||report.dataGovResourceProfile.postcodeFields!==0||report.dataGovResourceProfile.polygonCoordinateOrBoundaryFields!==0)fail('catalog-profile');
 if(!report.controlledTextFileAccess.publicWebsiteAndDataPortalDistributionStopped
   ||!report.controlledTextFileAccess.externalAccountRequired||!report.controlledTextFileAccess.companySealApplicationRequired
   ||!report.controlledTextFileAccess.operatorApprovalRequired||report.controlledTextFileAccess.authenticatedRequestsPerformed!==0)fail('controlled-access');
 if(report.apiSpecProfile.polygonCoordinateOrBoundaryFields!==0||report.nlscReview.doorplateLayerGeometry!=='point'
   ||report.nlscReview.publicPostcodeAreaLayerVerified||report.nlscReview.vectorServicePublicRedistributionVerified)fail('geometry-authority');
 if(report.officialPostalGeometryRecords!==0||report.derivedPostalGeometryRecords!==0||report.publishedImmutableDataArtifacts!==0
   ||report.realTaiwanPostalApiVerified||report.realTaiwanAppAreaVisualizationVerified||report.countryM2Achieved)fail('m2-overclaim');
 if(report.controlledTextFileAccess.applicationsSubmitted!==0||report.controlledTextFileAccess.contractOrTermsAccepted!==0
   ||report.paidOperations!==0||report.newAccountsRepositoriesOrDestinations!==0||report.rawSourceBodiesInGit!==0)fail('operation-overclaim');
 return {references:report.references.length,catalogRows:4,postalGeometryRecords:0,countryM2Achieved:false};
}

if(process.argv[1]&&new URL(`file:///${process.argv[1].replaceAll('\\','/')}`).pathname.endsWith('/inspect-postal-context-tw-sources.mjs')){
 const report=JSON.parse(readFileSync(process.argv[2]??new URL('../reports/postal-context-m2/tw-source-review-2026-08-29.json',import.meta.url),'utf8'));
 console.log(JSON.stringify(validateTaiwanAuditReport(report)));
}
