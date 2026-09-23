import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {fetchBoundedOfficialResponse,sourceDigest} from './lib/postal-context-source-probe.mjs';
import {createPostalCurlFetcher} from './lib/postal-context-curl-fetch.mjs';

export const config=JSON.parse(readFileSync(new URL('../data/postal_country_packs/lk/postal-context/m2-source-review.json',import.meta.url)));
const hosts=new Set(config.allowed_hosts);
export const sriLankaPlain=s=>s.replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/\s+/gu,' ').trim();
const attribute=(tag,key)=>{const found=[...tag.matchAll(new RegExp('(?:^|\\s)'+key+'\\s*=\\s*(["\'])(.*?)\\1','gi'))];if(found.length!==1)throw Error('lk-attribute-binding');return found[0][2];};
const matchDigest=(value,expected)=>{if(sourceDigest(value)!==expected)throw Error('lk-content-drift-requires-review');};
export const sriLankaFailure=e=>/^(lk-[a-z-]+|curl-[a-z-]+|reference-[a-z-]+|unapproved-reference-host|empty-reference|redirect-without-location)$/.test(e?.message??'')?e.message:['AbortError','TimeoutError'].includes(e?.name)?'request-timeout':'network-or-parser-error';
export function safeSriLankaUrl(value){const u=new URL(value);u.username='';u.password='';u.hash='';for(const [k,v] of [...u.searchParams])if(k!=='f'||!['json','pjson'].includes(v))u.searchParams.set(k,'REDACTED');return u.href;}

// Initial public HTML only: the two forms reuse a DOM ID. Bind by form name,
// compare code sets, never zip by position or submit the forms. Emit no rows.
export function profileSriLankaForm(html,review=config.form_review){
  const forms=[...html.matchAll(/<form\b([^>]*)>([\s\S]*?)<\/form>/gi)];
  if(forms.length!==2)throw Error('lk-form-count');
  const lists=review.forms.map(expected=>{
    const matches=forms.filter(f=>attribute(f[1],'name')===expected.name);
    if(matches.length!==1)throw Error('lk-form-binding');const form=matches[0];
    if(attribute(form[1],'action')!=='index.php'||attribute(form[1],'method').toLowerCase()!=='post')throw Error('lk-form-action');
    const selects=[...form[2].matchAll(/<select\b([^>]*)>([\s\S]*?)<\/select>/gi)];
    if(selects.length!==1||attribute(selects[0][1],'name')!=='poid'||attribute(selects[0][1],'id')!=='wgtmsr')throw Error('lk-select-binding');
    const options=[...selects[0][2].matchAll(/<option\b([^>]*)>([\s\S]*?)<\/option>/gi)].map(o=>({value:attribute(o[1],'value'),label:sriLankaPlain(o[2])}));
    if(options.length!==review.candidate_count+1||options.length>10000)throw Error('lk-option-count');
    if(options[0].value!=='0'||options[0].label!==expected.placeholder)throw Error('lk-placeholder');
    const rows=options.slice(1);
    if(rows.some(r=>!/^\d{5}$/.test(r.value)||!r.label)||(expected.name==='frm2'&&rows.some(r=>r.label!==r.value)))throw Error('lk-option-schema');
    if(new Set(rows.map(r=>r.value)).size!==rows.length||new Set(rows.map(r=>r.label)).size!==rows.length)throw Error('lk-duplicate-option');
    if(expected.options_digest)matchDigest(JSON.stringify(options),expected.options_digest);
    return {name:expected.name,rows,optionsDigest:sourceDigest(JSON.stringify(options))};
  });
  const [offices,codes]=lists;
  const officeCodes=new Set(offices.rows.map(r=>r.value)),codeSet=new Set(codes.rows.map(r=>r.value));
  if(officeCodes.size!==codeSet.size||[...officeCodes].some(c=>!codeSet.has(c)))throw Error('lk-code-set-mismatch');
  const normalizedLabels=offices.rows.map(r=>r.label.normalize('NFC').toLocaleLowerCase('en').replace(/\s+/gu,' ').trim());
  return {observationGrain:'public-initial-html-options-not-current-national-assignments',forms:lists.map(list=>({name:list.name,candidateOptions:list.rows.length,placeholderOptions:1,uniqueCodeValues:new Set(list.rows.map(r=>r.value)).size,leadingZeroCodes:list.rows.filter(r=>r.value.startsWith('0')).length,optionsDigest:list.optionsDigest})),sharedDomId:'wgtmsr',formScopedBinding:true,codeSetsEqual:true,positionalCodeMismatches:offices.rows.filter((r,i)=>r.value!==codes.rows[i].value).length,normalizedOfficeLabelCollisions:normalizedLabels.length-new Set(normalizedLabels).size,officeLabelNormalization:'NFC, en lowercase, whitespace collapsed; not transliteration or national name uniqueness',nationalCoverageVerified:false,assignmentRowsValidated:0,valuesPersisted:0,formSubmissions:0,browserRuntimeVerified:false};
}

export function sriLankaSection(html,ref){
  const text=sriLankaPlain(html.replace(/<!--[\s\S]*?-->/g,' ').replace(/<(script|style|head)\b[^>]*>[\s\S]*?<\/\1>/gi,' '));
  const parts=text.split(ref.section_start);if(parts.length!==2)throw Error('lk-section-binding');
  const end=parts[1].indexOf(ref.section_end);if(end<0)throw Error('lk-section-binding');
  return (ref.section_start+parts[1].slice(0,end)).trim();
}
export function profileSriLankaReference(bytes,ref,mime){
  const base={contentVerified:false,sourceDataRecords:0};
  if(ref.kind==='manual-reference')return {...base,status:'manual-review-required-not-data'};
  if(ref.kind!=='reviewed-section')matchDigest(bytes,ref.expected_digest);
  const type=(mime??'').split(';')[0].trim().toLowerCase();
  if(ref.kind==='arcgis-service'||ref.kind==='arcgis-layer'){
    if(!['text/plain','application/json'].includes(type))throw Error('lk-json-mime');
    const d=JSON.parse(new TextDecoder('utf8',{fatal:true}).decode(bytes));
    if(d.error||d.features||d.records)throw Error('lk-not-metadata');
    const crs=d.spatialReference??d.extent?.spatialReference;
    if(crs?.wkid!==4326||crs.latestWkid!==4326)throw Error('lk-crs-binding');
    let profile;
    if(ref.kind==='arcgis-service'){
      if(d.serviceItemId!==ref.service_item_id||!Array.isArray(d.layers)||JSON.stringify(d.layers.map(l=>l.id))!==JSON.stringify(ref.layer_ids))throw Error('lk-service-binding');
      profile={serviceItemId:d.serviceItemId,advertisedLayerCount:d.layers.length,administrativeLayerIds:[3,4,5,6,7],unqueriedLayerIds:[0,1,2,8,9,10,11],metadataCapabilitiesAreNotPermission:true};
    }else{
      if(d.id!==ref.layer_id||d.name!==ref.layer_name||d.type!=='Feature Layer'||d.geometryType!=='esriGeometryPolygon'||!Array.isArray(d.fields)||d.fields.length>100)throw Error('lk-layer-binding');
      const fields=d.fields.map(f=>({name:f.name,type:f.type,nullable:f.nullable??null,length:f.length??null}));
      if(new Set(fields.map(f=>f.name)).size!==fields.length)throw Error('lk-field-duplicate');
      profile={layerId:d.id,layerName:d.name,declaredGeometryType:d.geometryType,fieldCount:fields.length,fieldSchemaDigest:sourceDigest(JSON.stringify(fields)),postalNamedFieldCount:fields.filter(f=>/postal|postcode|post_code/i.test(f.name)).length,personalContactFieldNames:fields.filter(f=>/^gnd_officer_(?:name|phone)$/.test(f.name)).map(f=>f.name),nullableUnspecifiedFieldCount:fields.filter(f=>f.nullable===null).length,fieldNullabilityIsNotMissingRate:true,administrativeIdentifiersAreNotPostcodes:true};
    }
    return {...base,contentVerified:true,status:'metadata-verified-not-features',profile:{...profile,spatialReference:crs,copyrightTextEmpty:d.copyrightText==='',featureRequestsMade:0,postalRelationVerified:false,rightsInServiceVerified:false,recordValuesPersisted:0}};
  }
  if(type!=='text/html')throw Error('lk-html-mime');
  const html=new TextDecoder('utf8',{fatal:true}).decode(bytes);
  if(sriLankaPlain(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]??'')!==ref.title)throw Error('lk-title-binding');
  if(ref.kind==='search-form')return {...base,contentVerified:true,status:'initial-form-options-verified-not-data',profile:profileSriLankaForm(html)};
  if(ref.kind==='reviewed-section'){
    const section=sriLankaSection(html,ref);matchDigest(section,ref.expected_section_digest);
    return {...base,contentVerified:true,status:'reference-section-verified-not-data',profile:{reviewedScope:ref.reviewed_scope,sectionDigest:sourceDigest(section),sectionBytes:Buffer.byteLength(section),rawResponseSeparatelyHashed:true,dynamicMarkupIsNotDataEdition:true,sourceEdition:null,bulkReusePermissionVerified:false,currentLegalStatusVerified:false}};
  }
  if(ref.kind!=='reviewed-html')throw Error('lk-kind');
  return {...base,contentVerified:true,status:'reference-verified-not-data',profile:{reviewedScope:ref.reviewed_scope,sourceEdition:null,siteDateIsNotDataEdition:true,bulkReusePermissionVerified:false,currentLegalStatusVerified:false}};
}

export async function inspectSriLankaSources(fetcher=fetch,transport='node-verified-tls'){
  const report={schemaVersion:'postal-context-lk-source-review/v1',countryCode:'LK',observedAt:new Date().toISOString(),transport,references:[],rightsReview:config.rights_review,sourceRowsPersisted:0,currentAssignmentRowsValidated:0,productionGeometryRecords:0,civicBuildingRelations:0,publishedDataArtifacts:0,realAgidRuntimeVerified:false,assignmentQuality:{missingCodeRate:null,duplicateAssignmentRate:null,nationalCoverage:null,reason:'initial public form options and administrative schemas are not a rights-cleared current assignment dataset'},paidOperations:0,authenticatedRequests:0,privateQueries:0,featureQueries:0,formSubmissions:0,contractAcceptancePerformed:false,countryM2Achieved:false};
  const probe=async ref=>{let receipt;try{
    const {bytes,metadata:m}=await fetchBoundedOfficialResponse(ref.url,{allowedHosts:hosts,fetcher,maxBytes:config.limits.max_response_bytes});
    receipt={...m,requestedUrl:safeSriLankaUrl(m.requestedUrl),finalUrl:safeSriLankaUrl(m.finalUrl),redirects:m.redirects.map(safeSriLankaUrl),observedAt:new Date().toISOString(),byteLength:bytes?.length??null,responseDigest:bytes?sourceDigest(bytes):null};
    const p=bytes?profileSriLankaReference(bytes,ref,m.contentType):{status:'http-error',contentVerified:false,sourceDataRecords:0};
    return {id:ref.id,...receipt,...p,sourceDocumentDigest:p.contentVerified?receipt.responseDigest:null};
  }catch(e){return {id:ref.id,requestedUrl:ref.url,...receipt,observedAt:new Date().toISOString(),status:'review-failed',failureKind:sriLankaFailure(e),contentVerified:false,sourceDocumentDigest:null,sourceDataRecords:0};}};
  for(let i=0;i<config.references.length;i+=2)report.references.push(...await Promise.all(config.references.slice(i,i+2).map(probe)));
  report.completedAt=new Date().toISOString();return report;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2),options={};if(args.length%2)throw Error('usage: --report NEW.json [--curl EXECUTABLE]');
  for(let i=0;i<args.length;i+=2){if(!['--report','--curl'].includes(args[i])||Object.hasOwn(options,args[i]))throw Error('lk-cli-arguments');options[args[i]]=args[i+1];}
  if(!options['--report'])throw Error('lk-report-required');const path=resolve(options['--report']);if(existsSync(path))throw Error('report-already-exists');
  const curl=options['--curl'],report=await inspectSriLankaSources(curl?createPostalCurlFetcher(curl,hosts):fetch,curl?'curl-verified-tls':'node-verified-tls');
  mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({report:path,references:report.references.map(r=>({id:r.id,status:r.status,failure:r.failureKind})),m2:false}));
}
