import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {fetchBoundedOfficialResponse,sourceDigest} from './lib/postal-context-source-probe.mjs';
import {createPostalCurlFetcher} from './lib/postal-context-curl-fetch.mjs';
export const config=JSON.parse(readFileSync(new URL('../data/postal_country_packs/lb/postal-context/m2-source-review.json',import.meta.url)));
const hosts=new Set(config.allowed_hosts);
export const lebanonPlain=s=>s.replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/gu,' ').trim();
const visible=s=>s.replace(/<!--[\s\S]*?-->/g,' ').replace(/<(script|style|head)\b[^>]*>[\s\S]*?<\/\1>/gi,' ');
const title=s=>lebanonPlain(s.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]??'');
const digestMatches=(value,expected)=>{if(sourceDigest(value)!==expected)throw Error('lb-content-drift-requires-review');};
const crs=(d,r)=>{const s=d.spatialReference??d.extent?.spatialReference;if(s?.wkid!==r.wkid||s.latestWkid!==r.latest_wkid)throw Error('lb-crs-drift');return {wkid:s.wkid,latestWkid:s.latestWkid};};
export function lebanonFailure(e){return /^(lb-[a-z-]+|curl-[a-z-]+|reference-[a-z-]+|unapproved-reference-host|empty-reference|redirect-without-location)$/.test(e?.message??'')?e.message:['TimeoutError','AbortError'].includes(e?.name)?'request-timeout':'network-or-parser-error';}
export function safeLebanonUrl(s){const u=new URL(s);u.username='';u.password='';u.hash='';for(const [k,v] of [...u.searchParams])if(!((k==='f'&&['json','pjson'].includes(v))||(k==='lang'&&v==='2')||(k==='homeService'&&v==='1')||(k==='id'&&v==='569beba7-bad7-4951-a19d-468a035461cd')))u.searchParams.set(k,'REDACTED');return u.href;}

// Only initial public HTML schema is inspected. No values, viewstate, tokens,
// address cells or dropdown labels are emitted; no UI/form submission occurs.
export function profileLebanonForm(html,review=config.form_review){
  const controls=review.controls.map(expected=>{
    const tags=[...html.matchAll(/<input\b[^>]*>/gi)].map(m=>m[0]).filter(t=>new RegExp('\\bid="'+expected.id+'"').test(t));
    if(tags.length!==1)throw Error('lb-form-control-binding');const t=tags[0];
    const value=t.match(/\bvalue\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);if(value&&Boolean(value[1]||value[2]||value[3]))throw Error('lb-form-nonempty-value');
    const p={id:expected.id,type:t.match(/\btype="([^"]+)"/i)?.[1],maxlength:t.match(/\bmaxlength="(\d+)"/i)?.[1]??null,disabled:/\bdisabled(?:\s|=|>)/i.test(t)};if(p.maxlength!==null)p.maxlength=Number(p.maxlength);
    if(JSON.stringify(p)!==JSON.stringify(expected))throw Error('lb-form-control-drift');return p;
  });
  const dropdowns=review.dropdowns.map(expected=>{
    const pattern=new RegExp('<div id="ctl00_cpPopup_'+expected.id+'_DropDown"[^>]*>([\\s\\S]*?)</div></div></div>','g'),matches=[...html.matchAll(pattern)];
    if(matches.length!==1)throw Error('lb-form-dropdown-binding');const names=[...matches[0][1].matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].map(m=>lebanonPlain(m[1])).filter(Boolean);
    if(names.length>100||names.length!==expected.count)throw Error('lb-form-dropdown-count');const digest=sourceDigest(JSON.stringify(names));if(digest!==expected.digest)throw Error('lb-form-dropdown-drift');return {id:expected.id,nonemptyOptions:names.length,optionLabelsDigest:digest};
  });
  return {observationGrain:'initial-public-html-controls-not-records',controls,dropdowns,disabledAndEmptyDoNotProveAbsence:true,inputMaxlengthIsNotPostcodeLength:true,formSubmissions:0,browserRuntimeVerified:false,valuesPersisted:0,optionLabelsPersisted:0,clientStatePersisted:false,assignmentRows:0};
}

export function profileLebanonReference(bytes,ref,mime){
  const base={contentVerified:false,sourceDataRecords:0},type=(mime??'').split(';')[0].trim().toLowerCase();
  if(ref.kind==='manual-reference')return {...base,status:'manual-review-required-not-data'};
  if(ref.kind==='reviewed-pdf'){
    if(type!=='application/pdf'||bytes.subarray(0,5).toString('ascii')!=='%PDF-'||bytes.length!==ref.byte_length)throw Error('lb-pdf-mime-signature-or-size');digestMatches(bytes,ref.expected_digest);
    return {...base,contentVerified:true,status:'reviewed-pdf-bytes-matched-not-data',profile:{printedEdition:ref.printed_edition,physicalPages:ref.physical_pages,visuallyReviewedPhysicalPages:ref.visually_reviewed_physical_pages,visualReviewBoundByExactBytes:true,scope:ref.scope,numericDigitLengths:ref.numeric_digit_lengths??null,formattedCharacterLengths:ref.formatted_character_lengths??null,exampleRecordsPersisted:0}};
  }
  if(['arcgis-service','arcgis-layer','arcgis-item','hdx-package'].includes(ref.kind)){
    if(!['application/json','text/plain'].includes(type))throw Error('lb-json-mime');const d=JSON.parse(new TextDecoder('utf8',{fatal:true}).decode(bytes));if(d.error)throw Error('lb-json-error');let profile;
    if(ref.kind==='arcgis-service'){
      if(d.serviceItemId!==ref.service_item_id||!Array.isArray(d.layers)||JSON.stringify(d.layers.map(l=>l.id))!==JSON.stringify(ref.layer_ids)||d.layers.some(l=>l.geometryType!=='esriGeometryPolygon'))throw Error('lb-service-binding');
      profile={serviceItemId:d.serviceItemId,layerIds:ref.layer_ids,spatialReference:crs(d,ref),copyrightTextEmpty:d.copyrightText==='',metadataCapabilitiesAreNotPermission:true,featureRequestsMade:0,postalRelationVerified:false,rightsInServiceVerified:false};
    }else if(ref.kind==='arcgis-layer'){
      if(d.id!==ref.layer_id||d.name!==ref.layer_name||d.type!=='Feature Layer'||d.geometryType!=='esriGeometryPolygon'||!Array.isArray(d.fields)||d.fields.length>100)throw Error('lb-layer-binding');
      const fields=d.fields.map(f=>({name:f.name,type:f.type,nullable:f.nullable,length:f.length??null}));if(new Set(fields.map(f=>f.name)).size!==fields.length)throw Error('lb-layer-duplicate-field');
      const pcode=fields.find(f=>f.name==='PCODE'),id=fields.find(f=>f.name==='ID'),parent=fields.find(f=>f.name===ref.parent_field);
      if(pcode?.type!=='esriFieldTypeString'||pcode.nullable!==false||id?.type!=='esriFieldTypeGUID'||(ref.parent_field&&parent?.type!=='esriFieldTypeGUID'))throw Error('lb-layer-identifier-schema');
      profile={layerId:d.id,layerName:ref.layer_name,declaredGeometryType:d.geometryType,spatialReference:crs(d,ref),fieldCount:fields.length,fieldSchemaDigest:sourceDigest(JSON.stringify(fields)),pcodeType:pcode.type,parentField:ref.parent_field,pcodeIsNotPostcode:true,nonNullableSchemaIsNotMissingRate:true,referentialIntegrityVerified:false,copyrightTextEmpty:d.copyrightText==='',featureRequestsMade:0,postalRelationVerified:false};
    }else if(ref.kind==='arcgis-item'){
      if(d.id!==ref.item_id||d.title!==ref.title||d.owner!==ref.owner||d.url!==ref.service_url||!Number.isFinite(d.created)||!Number.isFinite(d.modified)||typeof d.licenseInfo!=='string'||typeof d.description!=='string')throw Error('lb-item-binding');
      const licence=lebanonPlain(d.licenseInfo),description=lebanonPlain(d.description);digestMatches(licence,ref.expected_license_digest);digestMatches(description,ref.expected_description_digest);
      profile={itemId:d.id,created:new Date(d.created).toISOString(),modified:new Date(d.modified).toISOString(),licenseDigest:sourceDigest(licence),descriptionDigest:sourceDigest(description),attributedInformationalSharingAdaptationTermsObserved:true,legalCadastralAuthoritativeBoundaryUseDisclaimed:true,olderPcodeStandardsCaveat:true,advertisedAdminCounts:[8,26,1627],countsAreMetadataNotQueriedFeatures:true,upstreamPackageId:'569beba7-bad7-4951-a19d-468a035461cd',featureRequestsMade:0,postalRelationVerified:false};
    }else{
      const p=d.result;if(d.success!==true||p?.id!==ref.package_id||p.name!==ref.name||p.title!==ref.title||p.license_id!==ref.license_id||p.license_url!==ref.license_url||typeof p.notes!=='string'||!Array.isArray(p.resources)||p.resources.length!==4)throw Error('lb-hdx-binding');
      const resources=p.resources.map(r=>({id:r.id,name:r.name,format:r.format,url:r.url,last_modified:r.last_modified,hash:r.hash,size:r.size}));digestMatches(p.notes,ref.expected_notes_digest);digestMatches(JSON.stringify(resources),ref.expected_resources_digest);
      profile={packageId:p.id,metadataModified:p.metadata_modified,versionField:p.version??null,documentedDatasetVersion:'02',documentedSourceBoundaryDate:'2014-05-02',documentedHumanitarianValidDate:'2024-11-13',documentedReviewDate:'2025-10-30',metadataModificationIsNotBoundaryDate:true,notesDigest:sourceDigest(p.notes),resourcesDigest:sourceDigest(JSON.stringify(resources)),advertisedAdminCounts:[8,26,1627],countsAreMetadataNotQueriedFeatures:true,licenseId:ref.license_id,licenseReference:ref.license_url,resourceCount:4,resourceFormats:resources.map(r=>r.format),advertisedHashLengths:resources.map(r=>r.hash.length),advertisedHashIsNotVerifiedSha256:true,resourceDownloads:0,featureRequestsMade:0,postalRelationVerified:false};
    }
    return {...base,contentVerified:true,status:'metadata-verified-not-features',profile};
  }
  if(type!=='text/html')throw Error('lb-html-mime');const html=new TextDecoder('utf8',{fatal:true}).decode(bytes);if(title(html)!==ref.title)throw Error('lb-html-title-binding');
  if(ref.kind==='address-form')return {...base,contentVerified:true,status:'initial-form-schema-verified-not-data',profile:profileLebanonForm(html)};
  if(ref.kind==='privacy-section'){
    const text=lebanonPlain(html),parts=text.split(ref.section_start);if(parts.length!==2)throw Error('lb-privacy-section');const end=parts[1].indexOf(ref.section_end);if(end<0)throw Error('lb-privacy-section');const section=(ref.section_start+parts[1].slice(0,end)).trim();digestMatches(section,ref.expected_section_digest);
    return {...base,contentVerified:true,status:'privacy-reference-verified-not-permission',profile:{sectionDigest:sourceDigest(section),sectionBytes:Buffer.byteLength(section),documentVersion:null,processingOrPortabilityIsNotRedistributionPermission:true,currentLegalStatusVerified:false}};
  }
  if(ref.kind==='reviewed-license'){digestMatches(bytes,ref.expected_digest);return {...base,contentVerified:true,status:'license-reference-verified-not-dataset',profile:{license:'CC BY 3.0 IGO',conditions:['attribution-and-notices','identify-adaptations','no-additional-restrictions-or-implied-endorsement','no-warranty'],doesNotSupplyPostalAssignmentOrPrivacyPermission:true,contractAcceptancePerformed:false}};}
  if(!['operator-page','unavailable-listing'].includes(ref.kind))throw Error('lb-reference-kind');const text=lebanonPlain(visible(html));if(!ref.markers.every(s=>text.includes(s)))throw Error('lb-html-markers');
  return {...base,contentVerified:true,status:ref.kind==='unavailable-listing'?'unavailable-listing-not-national-service-absence':'operator-reference-not-assignment',profile:{unavailableListingDoesNotProveServiceAbsence:ref.kind==='unavailable-listing',assignmentRows:0,bulkReusePermissionVerified:false}};
}

export async function inspectLebanonSources(fetcher=fetch,transport='node-verified-tls'){
  const report={schemaVersion:'postal-context-lb-source-review/v1',countryCode:'LB',observedAt:new Date().toISOString(),transport,references:[],rightsReview:config.rights_review,sourceRowsPersisted:0,currentAssignmentRowsValidated:0,productionGeometryRecords:0,civicBuildingRelations:0,publishedDataArtifacts:0,realAgidRuntimeVerified:false,assignmentQuality:{missingCodeRate:null,duplicateAssignmentRate:null,reason:'reference forms, illustrative examples and administrative metadata are not a current licensed assignment dataset'},paidOperations:0,authenticatedRequests:0,privateQueries:0,formSubmissions:0,contractAcceptancePerformed:false,countryM2Achieved:false};
  const probe=async ref=>{let receipt;try{
    const {bytes,metadata:m}=await fetchBoundedOfficialResponse(ref.url,{allowedHosts:hosts,fetcher,maxBytes:config.limits.max_response_bytes});receipt={...m,requestedUrl:safeLebanonUrl(m.requestedUrl),finalUrl:safeLebanonUrl(m.finalUrl),redirects:m.redirects.map(safeLebanonUrl),observedAt:new Date().toISOString(),byteLength:bytes?.length??null,responseDigest:bytes?sourceDigest(bytes):null};
    const p=bytes?profileLebanonReference(bytes,ref,m.contentType):{status:'http-error',contentVerified:false,sourceDataRecords:0};return {id:ref.id,...receipt,...p,sourceDocumentDigest:p.contentVerified?receipt.responseDigest:null};
  }catch(e){return {id:ref.id,requestedUrl:ref.url,...receipt,observedAt:new Date().toISOString(),status:'review-failed',failureKind:lebanonFailure(e),contentVerified:false,sourceDocumentDigest:null,sourceDataRecords:0};}};
  for(let i=0;i<config.references.length;i+=2)report.references.push(...await Promise.all(config.references.slice(i,i+2).map(probe)));
  report.completedAt=new Date().toISOString();return report;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2),options={};if(args.length%2)throw Error('usage: --report NEW.json [--curl EXECUTABLE]');for(let i=0;i<args.length;i+=2){if(!['--report','--curl'].includes(args[i])||Object.hasOwn(options,args[i]))throw Error('lb-cli-arguments');options[args[i]]=args[i+1];}if(!options['--report'])throw Error('lb-report-required');
  const path=resolve(options['--report']);if(existsSync(path))throw Error('report-already-exists');const curl=options['--curl'],report=await inspectLebanonSources(curl?createPostalCurlFetcher(curl,hosts):fetch,curl?'curl-verified-tls':'node-verified-tls');
  mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({report:path,references:report.references.map(r=>({id:r.id,status:r.status,failure:r.failureKind})),m2:false}));
}
