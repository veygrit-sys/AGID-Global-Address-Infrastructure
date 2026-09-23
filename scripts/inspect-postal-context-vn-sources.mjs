import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';

export const config=JSON.parse(readFileSync(new URL('../data/postal_country_packs/vn/postal-context/m2-source-review.json',import.meta.url),'utf8'));
const fail=message=>{throw new Error(`vn-${message}`)};
export const sourceDigest=bytes=>'sha256:'+createHash('sha256').update(bytes).digest('hex');
const bind=(bytes,reference)=>{if(!Buffer.isBuffer(bytes)||bytes.length!==reference.reviewed_bytes||sourceDigest(bytes)!==reference.expected_digest)fail(`${reference.id}-content-drift`);};
const text=bytes=>bytes.toString('utf8');

export function profileVietnamPortal(bytes,reference){
 bind(bytes,reference); const value=text(bytes);
 const profile={ministryOwner:/BỘ KHOA HỌC VÀ CÔNG NGHỆ \(MST\)/i.test(value),downloadDirectory:/danhbamabuuchinhquocgia\.pdf/i.test(value),cleartextSearchApi:/http:\/\/mabuuchinh\.vn\/API\/serviceApi\/v1\/MBC/i.test(value),postcodeAutocomplete:/autocomplete\(/i.test(value)&&/textsearch/i.test(value),polygonOrGeojsonClient:/Polygon|MultiPolygon|GeoJSON|WKT|setBounds|fitBounds/i.test(value),mapClient:/google\.maps|leaflet|mapbox|openlayers|ymaps/i.test(value)};
 if(!profile.ministryOwner||!profile.downloadDirectory||!profile.cleartextSearchApi||!profile.postcodeAutocomplete||profile.polygonOrGeojsonClient||profile.mapClient)fail('portal-profile'); return profile;
}

export function profileVietnamLegalDocuments(bytes,reference){
 bind(bytes,reference); const value=text(bytes);
 const profile={decision2475From2017:/2475\/QĐ-BTTTT[^]*29\/12\/2017/i.test(value),decision2334Listed:/2334\/QĐ-BKHCN/i.test(value),attachmentLink:/href=[^>]+\.(?:pdf|docx?)/i.test(value)};
 if(!profile.decision2475From2017||profile.decision2334Listed||profile.attachmentLink)fail('legal-documents-profile'); return profile;
}

export function profileVietnamDirectoryHeaders(bytes,reference){
 bind(bytes,reference); const value=text(bytes); const size=Number(value.match(/Content-Range:\s*bytes 0-0\/(\d+)/i)?.[1]);
 const profile={partialContent:/HTTP\/1\.1 206 Partial Content/i.test(value),lastModified:value.match(/Last-Modified:\s*([^\r\n]+)/i)?.[1]??null,etag:value.match(/ETag:\s*([^\r\n]+)/i)?.[1]??null,totalBytes:size,acceptRanges:/Accept-Ranges:\s*bytes/i.test(value)};
 if(!profile.partialContent||profile.lastModified!=='Tue, 19 Jun 2018 04:52:44 GMT'||profile.etag!=='"0f63c5c897d41:0"'||profile.totalBytes!==386841053||!profile.acceptRanges)fail('directory-headers-profile'); return profile;
}

export function profileVietnamMinistryArticle(bytes,reference){
 bind(bytes,reference); const value=text(bytes);
 const profile={articlePublished:/25\/11\/2025/i.test(value),decisionDateInBody:/18\/11\/2024/i.test(value),fiveCharacters:/5 k[^<]{0,50}(?:tự|t&#7921;)/i.test(value),onePerAdministrativeUnit:/mỗi đơn vị hành chính[^<]{0,80}mã bưu chính/i.test(value)||(/duy nh(?:&#7845;|ấ)t/i.test(value)&&/m(?:&atilde;|ã) b(?:&#432;|ư)u ch(?:&iacute;|í)nh/i.test(value)),articleAttribution:/Ghi r[^<]{0,30}(?:nguồn|ngu&#7891;n)[^<]{0,100}cspl\.mst\.gov\.vn/i.test(value),annexAttachment:/href=[^>]+(?:2334|Quyet.?dinh)[^>]+\.(?:pdf|docx?)/i.test(value)};
 if(!profile.articlePublished||!profile.decisionDateInBody||!profile.fiveCharacters||!profile.onePerAdministrativeUnit||!profile.articleAttribution||profile.annexAttachment)fail('ministry-profile'); return profile;
}

export function profileVietnamPostNotice(bytes,reference){
 bind(bytes,reference); const value=text(bytes);
 const profile={decisionDate:/24\/8\/2025/i.test(value),decision2334:/2334\/QĐ-BKHCN/i.test(value),portalGuidance:/mabuuchinh\.vn/i.test(value),websiteAttribution:/Ghi rõ nguồn[^<]{0,40}vietnampost\.vn/i.test(value),polygonOrBoundaryRelease:/Polygon|MultiPolygon|GeoJSON|WKT|ranh giới mã bưu chính/i.test(value)};
 if(!profile.decisionDate||!profile.decision2334||!profile.portalGuidance||!profile.websiteAttribution||profile.polygonOrBoundaryRelease)fail('vnpost-profile'); return profile;
}

export function profileVietnamReference(bytes,reference){
 if(reference.kind==='portal-html')return profileVietnamPortal(bytes,reference);
 if(reference.kind==='legal-documents-html')return profileVietnamLegalDocuments(bytes,reference);
 if(reference.kind==='directory-headers')return profileVietnamDirectoryHeaders(bytes,reference);
 if(reference.kind==='ministry-html')return profileVietnamMinistryArticle(bytes,reference);
 if(reference.kind==='operator-html')return profileVietnamPostNotice(bytes,reference);
 bind(bytes,reference); if(reference.kind==='pdf'&&bytes.subarray(0,5).toString()!=='%PDF-')fail(`${reference.id}-pdf-signature`); return {contentVerified:true};
}

export function validateVietnamAuditReport(report){
 if(report.countryCode!=='VN'||report.criterionId!==config.m2_criterion.id)fail('report-identity');
 if(report.references.length!==config.references.length||new Set(report.references.map(item=>item.id)).size!==report.references.length)fail('reference-set');
 for(const reference of config.references){const receipt=report.references.find(item=>item.id===reference.id); if(!receipt||receipt.requestedUrl!==reference.url||receipt.httpStatus!==200||receipt.byteLength!==reference.reviewed_bytes||receipt.responseDigest!==reference.expected_digest||receipt.contentVerified!==true)fail('receipt-binding');}
 if(report.currentAllocation.exactCurrentDecisionAnnexRetrieved||report.currentAllocation.currentAssignmentRowsValidated!==0||!report.currentAllocation.officialDateConflictUnresolved)fail('allocation-overclaim');
 if(report.portalProfile.operatorSearchToAreaVisualizationVerified||report.portalProfile.postalPolygonResponseVerified||report.portalProfile.httpsSearchApiVerified)fail('portal-overclaim');
 if(report.rights.bulkReuseGrantVerified||report.rights.derivativePolygonGrantVerified||report.rights.redistributionGrantVerified||report.rights.persistentPublicApiServingGrantVerified||report.rights.accountsRegistrationsOrContractAcceptances!==0)fail('rights-overclaim');
 if(report.officialPostalGeometryRecordsValidatedForProduction!==0||report.derivedPostalGeometryRecords!==0||report.publishedImmutableDataArtifacts!==0||report.realVietnamAgidPostalApiVerified||report.realVietnamAgidAppAreaVisualizationVerified||report.countryM2Achieved)fail('m2-overclaim');
 if(report.rawSourceBodiesInGit!==0||report.paidOperations!==0||report.newAccountsRepositoriesOrDestinations!==0)fail('operation-overclaim');
 return {references:report.references.length,currentAssignmentRows:0,productionGeometryRecords:0,countryM2Achieved:false};
}

export function auditVietnamSourceDirectory(sourceDirectory,report){const profiles={}; for(const reference of config.references)profiles[reference.id]=profileVietnamReference(readFileSync(join(sourceDirectory,reference.audit_file)),reference); validateVietnamAuditReport(report); return profiles;}
if(process.argv[1]&&new URL(`file:///${process.argv[1].replaceAll('\\','/')}`).pathname.endsWith('/inspect-postal-context-vn-sources.mjs')){const report=JSON.parse(readFileSync(process.argv[3]??new URL('../reports/postal-context-m2/vn-source-review-2026-08-29.json',import.meta.url),'utf8')); const profiles=process.argv[2]?auditVietnamSourceDirectory(process.argv[2],report):null; console.log(JSON.stringify({report:validateVietnamAuditReport(report),sourceProfiles:profiles}));}
