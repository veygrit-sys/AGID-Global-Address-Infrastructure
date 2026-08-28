import {existsSync,mkdirSync,readFileSync,statSync,writeFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {fetchBoundedOfficialResponse,sourceDigest} from './lib/postal-context-source-probe.mjs';
import {createPostalCurlFetcher} from './lib/postal-context-curl-fetch.mjs';
export const config=JSON.parse(readFileSync(new URL('../data/postal_country_packs/la/postal-context/m2-source-review.json',import.meta.url)));
const hosts=new Set(config.allowed_hosts);
const visible=s=>s.replace(/<!--[\s\S]*?-->/g,' ').replace(/<(script|style|head|nav|header|footer)\b[^>]*>[\s\S]*?<\/\1>/gi,' ');
export const laosPlain=s=>s.replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&rsquo;/g,'’').replace(/&lsquo;/g,'‘').replace(/&quot;/g,'"').replace(/&amp;/g,'&').replace(/\s+/gu,' ').trim();
const exactKeys=(v,k)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join('|')===[...k].sort().join('|');
const instant=s=>typeof s==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString()===s;
export function laosFailure(e){return /^(la-[a-z-]+|curl-[a-z-]+|reference-[a-z-]+|unapproved-reference-host|empty-reference|redirect-without-location)$/.test(e?.message??'')?e.message:['TimeoutError','AbortError'].includes(e?.name)?'request-timeout':'network-or-parser-error';}
export function safeLaosUrl(s){const u=new URL(s);u.username='';u.password='';u.hash='';for(const k of [...u.searchParams.keys()])if(!['f','lang','p','id','r','title','oldid'].includes(k))u.searchParams.set(k,'REDACTED');return u.href;}

// Profiles bounded public observations; never emits postcode, village or address cells.
export function profileLaosDom(bytes){
  if(!bytes.length||bytes.length>config.limits.max_dom_capture_bytes)throw Error('la-dom-byte-limit');let c;try{c=JSON.parse(new TextDecoder('utf8',{fatal:true}).decode(bytes));}catch{throw Error('la-dom-json');}
  if(!exactKeys(c,['schemaVersion','overview','detail'])||c.schemaVersion!=='postal-context-la-dom-capture/v1')throw Error('la-dom-schema');
  const o=c.overview,d=c.detail,a=config.operator_ui;
  if(!exactKeys(o,['url','observedAt','title','mainText','rightsReserved'])||!exactKeys(d,['url','observedAt','title','mainText','heading','paragraphs','loadMorePresent'])||o.url!==a.url||o.title!==a.title||d.url!==a.detail_url||d.title!==a.detail_title||d.heading!==a.detail_heading||typeof o.mainText!=='string'||typeof d.mainText!=='string'||typeof o.rightsReserved!=='boolean'||typeof d.loadMorePresent!=='boolean'||!instant(o.observedAt)||!instant(d.observedAt)||Date.parse(d.observedAt)<Date.parse(o.observedAt)||Date.parse(d.observedAt)-Date.parse(o.observedAt)>600000)throw Error('la-dom-binding');
  const lines=o.mainText.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);if(lines.shift()!==a.heading||!lines.length||lines.length%2||lines.length>config.limits.max_regions*2)throw Error('la-dom-overview-shape');
  const regions=[];for(let i=0;i<lines.length;i+=2){const m=lines[i+1].match(new RegExp('^'+a.total_prefix+' (\\d+) '+a.total_suffix+'$'));if(!m||!lines[i]||Number(m[1])>100000)throw Error('la-dom-overview-count');regions.push({name:lines[i],count:Number(m[1])});}
  if(new Set(regions.map(r=>r.name.normalize('NFC'))).size!==regions.length)throw Error('la-dom-duplicate-region');
  const regionIndex=regions.findIndex(r=>r.name===d.heading);if(regionIndex<0||!Array.isArray(d.paragraphs)||!d.paragraphs.length||d.paragraphs.length>config.limits.max_sample_rows||d.paragraphs.length>regions[regionIndex].count||d.paragraphs.some(p=>typeof p!=='string'||!p.trim()||p.length>1000))throw Error('la-dom-sample-shape');
  const actualLines=d.mainText.split(/\r?\n/).map(s=>s.trim());for(const p of new Set(d.paragraphs))if(actualLines.filter(s=>s===p.trim()).length<d.paragraphs.filter(s=>s===p).length)throw Error('la-dom-row-binding');
  if(!d.mainText.includes(d.heading)||d.loadMorePresent!==d.mainText.includes(a.load_more))throw Error('la-dom-controls');
  const tokens=d.paragraphs.map(p=>p.trim().split(/\s+/u)[0]),valid=tokens.filter(s=>/^\d{5}$/.test(s)),distinct=new Set(valid).size,uniqueRows=new Set(d.paragraphs.map(s=>s.normalize('NFC').trim())).size;
  return {status:'partial-public-ui-observation-not-release',captureDigest:sourceDigest(bytes),captureBytes:bytes.length,overviewObservedAt:o.observedAt,sampleObservedAt:d.observedAt,overviewUrl:o.url,sampleUrl:d.url,rightsReservedFooter:o.rightsReserved,
    regionCards:regions.map((r,i)=>({ordinal:i+1,advertisedRows:r.count})),advertisedRegionalRowSum:regions.reduce((n,r)=>n+r.count,0),advertisedTotalsAreNotUniquePostcodes:true,uniqueNationalPostcodes:null,
    sampleRegionOrdinal:regionIndex+1,sampleRegionAdvertisedRows:regions[regionIndex].count,sampleRows:d.paragraphs.length,validFiveDigitRows:valid.length,invalidCodeRows:tokens.length-valid.length,invalidCodeRate:(tokens.length-valid.length)/tokens.length,leadingZeroRows:valid.filter(s=>s.startsWith('0')).length,uniqueObservedCodes:distinct,repeatedCodeRows:valid.length-distinct,repeatedCodesAreNotDuplicateAssignments:true,distinctObservedRowTexts:uniqueRows,duplicateRowTextExcess:d.paragraphs.length-uniqueRows,loadMorePresent:d.loadMorePresent,
    sampleRowsDeduplicated:0,zeroPaddingPerformed:0,sourceCellsPersisted:0,rawHttpDataBytesVerified:false,atomicSnapshot:false,completeNationalSnapshot:false,immutableDataArtifact:false,productionEligible:false,countryM2Achieved:false};
}

export function profileLaopedia(html,ref){
  const title=laosPlain(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]??''),parts=html.split('<div class="mw-parser-output">'),revisions=[...html.matchAll(/"wgRevisionId":(\d+)/g)];
  if(title!==ref.title||parts.length!==2||revisions.length!==1||Number(revisions[0][1])!==ref.revision)throw Error('la-wiki-binding');
  const end=parts[1].search(/<!--\s*NewPP limit report/);if(end<0)throw Error('la-wiki-section');const body=parts[1].slice(0,end),text=laosPlain(body),digest=sourceDigest(text);if(digest!==ref.expected_article_digest)throw Error('la-wiki-article-drift-requires-review');
  const sections=body.split(/<h2\b[^>]*>/).slice(1),items=[...body.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].map(m=>laosPlain(m[1]));if(!sections.length||!items.length||items.length>100)throw Error('la-wiki-list-shape');
  const parsed=items.map(s=>{const m=s.match(/^ລະຫັດໄປສະນີ ເຂດ (\d+): (\S+)(?: \((.*))?$/u);if(!m)throw Error('la-wiki-row-shape');const villages=m[3]?.replace(/\)$/u,'').split(',').map(s=>s.trim().normalize('NFC')).filter(Boolean)??[];return {code:m[2],villages,unclosed:m[3]!==undefined&&!m[3].endsWith(')')};});
  const range=laosPlain(body.match(/<b>([\s\S]*?)<\/b>/)?.[1]??'').match(/(\d{5}) - (\d{5})/);if(!range||Number(range[2])<Number(range[1]))throw Error('la-wiki-range-shape');const cardinality=Number(range[2])-Number(range[1])+1;
  const named=parsed.filter(r=>r.villages.length),withinRange=parsed.filter(r=>/^\d{5}$/.test(r.code)&&Number(r.code)>=Number(range[1])&&Number(r.code)<=Number(range[2]));
  return {revision:ref.revision,articleDigest:digest,articleBytes:Buffer.byteLength(text),geographicHeadings:sections.length,headingsWithoutDetailLists:sections.filter(s=>!/<li\b/.test(s)).length,explicitZoneRows:parsed.length,invalidCodeRows:parsed.filter(r=>!/^\d{5}$/.test(r.code)).length,leadingZeroRows:parsed.filter(r=>/^0\d{4}$/.test(r.code)).length,
    statedRangeCardinality:cardinality,uniqueListedCodesWithinRange:new Set(withinRange.map(r=>r.code)).size,rangeIsNotExpanded:true,rangeIsNotCompleteAssignmentEvidence:true,rowsWithVillageDetails:named.length,rowsWithoutVillageDetails:parsed.length-named.length,missingVillageDetailRate:(parsed.length-named.length)/parsed.length,villageTokenObservations:named.reduce((n,r)=>n+r.villages.length,0),duplicateVillageTokenExcessWithinRows:named.reduce((n,r)=>n+r.villages.length-new Set(r.villages).size,0),unclosedVillageLists:parsed.filter(r=>r.unclosed).length,
    villageNamesAreNotStableIdentifiers:true,rowsRepaired:0,sourceCellsPersisted:0,currentAssignmentRowsValidated:0,completeNationalSnapshot:false,geometryAuthority:'none',immutableProductionArtifact:false};
}

export function profileLaosReference(bytes,ref,mime){
  const base={contentVerified:false,sourceDataRecords:0},type=(mime??'').split(';')[0].trim().toLowerCase();
  if(ref.kind.startsWith('manual-'))return {...base,status:'manual-review-required-not-data'};
  if(ref.kind==='arcgis-metadata'){
    if(!['text/plain','application/json'].includes(type))throw Error('la-layer-mime');const d=JSON.parse(new TextDecoder('utf8',{fatal:true}).decode(bytes));if(d.error||d.id!==ref.layer_id||d.name!==ref.layer_name||d.type!==ref.layer_type)throw Error('la-layer-binding');
    const group=d.type==='Group Layer';if(group?(d.geometryType!==null||d.fields!==null||JSON.stringify(d.subLayers?.map(l=>l.id))!=='[246,247,248]'):(d.geometryType!=='esriGeometryPolygon'||d.parentLayer?.id!==245||!Array.isArray(d.fields)))throw Error('la-layer-shape');
    const crs=d.extent?.spatialReference;if(crs?.wkid!==102100||crs.latestWkid!==3857)throw Error('la-layer-crs-drift');
    return {...base,contentVerified:true,status:'metadata-verified-not-features',profile:{layerId:d.id,layerName:d.name,layerType:d.type,declaredGeometryType:d.geometryType,fieldNames:d.fields?.map(f=>f.name)??[],spatialReference:crs,subLayerIds:d.subLayers?.map(l=>l.id)??[],copyrightTextEmpty:d.copyrightText==='',pcodeFieldPresent:d.fields?.some(f=>f.name==='PCode')??false,pcodeIsNotProofOfPostcode:true,postalRelationVerified:false,rightsVerified:false,featureRequestsMade:0,productionGeometryRecords:0}};
  }
  if(type!=='text/html')throw Error('la-reference-mime');const html=new TextDecoder('utf8',{fatal:true}).decode(bytes),clean=visible(html),text=laosPlain(clean);
  if(ref.kind==='wiki-article')return {...base,contentVerified:true,status:'partial-reference-profiled-not-release',profile:profileLaopedia(html,ref)};
  if(ref.kind==='operator-shell'){
    const title=laosPlain(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]??''),main=html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)?.[1];if(title!==ref.title||!main||!main.includes('BAILOUT_TO_CLIENT_SIDE_RENDERING'))throw Error('la-operator-shell-drift');
    return {...base,status:'initial-html-loading-shell-not-data',profile:{shellVerified:true,initialMainTextEmpty:laosPlain(visible(main))==='',rightsReservedFooter:laosPlain(html.match(/<footer[^>]*>([\s\S]*?)<\/footer>/i)?.[1]??'').includes('All Rights Reserved'),emptyHtmlDoesNotMeanDataAbsent:true}};
  }
  if(ref.kind==='legal-section'){
    if(laosPlain(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]??'')!==ref.title||!html.includes('href="'+ref.url+'"'))throw Error('la-law-binding');
    const parts=text.split(ref.section_start);if(parts.length!==2)throw Error('la-law-section');const end=parts[1].indexOf(ref.section_end);if(end<0)throw Error('la-law-section');const section=ref.section_start+parts[1].slice(0,end).trimEnd(),digest=sourceDigest(section);if(digest!==ref.expected_section_digest)throw Error('la-law-drift-requires-review');
    return {...base,contentVerified:true,status:'reference-verified-not-data',profile:{documentDate:ref.document_date,reviewedArticles:[9,10,11],sectionDigest:digest,sectionBytes:Buffer.byteLength(section),networkTypes:['post-office','mail-exchange-centre','mail-route'],postcodeIsDeliveryScopeIndicator:true,effectiveDate:null,currentLegalStatusVerified:false,translationSupersessionWordingNeedsReview:text.includes('This law is superseded by the Law on Postal Service No.06/NA'),statuteIsNotDataOrRedistributionPermission:true}};
  }
  const ok=ref.markers.every(s=>text.includes(s));return {...base,contentVerified:ok,status:ok?'reference-verified-not-data':'unconfirmed-reference-body',profile:ok?{documentDate:ref.document_date,aggregateContextOnly:true,microdataExcluded:true,exactDataArtifactObtained:false}:null};
}
export async function inspectLaosSources(fetcher=fetch,transport='node-verified-tls',domBytes=null){
  const report={schemaVersion:'postal-context-la-source-review/v1',countryCode:'LA',observedAt:new Date().toISOString(),transport,references:[],operatorObservation:domBytes?profileLaosDom(domBytes):null,rightsReview:config.rights_review,
    sourceRowsPersisted:0,currentAssignmentRowsValidated:0,productionGeometryRecords:0,civicBuildingRelations:0,publishedDataArtifacts:0,realAgidRuntimeVerified:false,assignmentQuality:{missingCodeRate:null,duplicateAssignmentRate:null,reason:'partial public observations are not a complete current licensed assignment dataset'},paidOperations:0,authenticatedRequests:0,privateQueries:0,contractAcceptancePerformed:false,countryM2Achieved:false};
  const probe=async ref=>{let receipt;try{const {bytes,metadata:m}=await fetchBoundedOfficialResponse(ref.url,{allowedHosts:hosts,fetcher,maxBytes:config.limits.max_response_bytes});receipt={...m,requestedUrl:safeLaosUrl(m.requestedUrl),finalUrl:safeLaosUrl(m.finalUrl),redirects:m.redirects.map(safeLaosUrl),observedAt:new Date().toISOString(),byteLength:bytes?.length??null,responseDigest:bytes?sourceDigest(bytes):null};const p=bytes?profileLaosReference(bytes,ref,m.contentType):{status:'http-error',contentVerified:false,sourceDataRecords:0};return {id:ref.id,...receipt,...p,sourceDocumentDigest:p.contentVerified?receipt.responseDigest:null};}catch(e){return {id:ref.id,requestedUrl:ref.url,...receipt,observedAt:new Date().toISOString(),status:'review-failed',failureKind:laosFailure(e),contentVerified:false,sourceDocumentDigest:null};}};
  for(let i=0;i<config.references.length;i+=2)report.references.push(...await Promise.all(config.references.slice(i,i+2).map(probe)));
  const wiki=report.references.filter(r=>r.profile?.articleDigest);report.currentAndLinkedWikiRevisionMatch=wiki.length===2&&wiki[0].profile.articleDigest===wiki[1].profile.articleDigest;report.completedAt=new Date().toISOString();return report;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2),options={};if(args.length%2)throw Error('usage: --report NEW.json [--dom-capture PRIVATE.json] [--curl EXECUTABLE]');for(let i=0;i<args.length;i+=2){if(!['--report','--dom-capture','--curl'].includes(args[i])||Object.hasOwn(options,args[i]))throw Error('la-cli-arguments');options[args[i]]=args[i+1];}if(!options['--report'])throw Error('la-report-required');const path=resolve(options['--report']);if(existsSync(path))throw Error('report-already-exists');
  let dom=null;if(options['--dom-capture']){if(statSync(options['--dom-capture']).size>config.limits.max_dom_capture_bytes)throw Error('la-dom-byte-limit');dom=readFileSync(options['--dom-capture']);}const curl=options['--curl'],report=await inspectLaosSources(curl?createPostalCurlFetcher(curl,hosts):fetch,curl?'curl-verified-tls':'node-verified-tls',dom);
  mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({report:path,references:report.references.map(r=>({id:r.id,status:r.status,failure:r.failureKind})),sampleRows:report.operatorObservation?.sampleRows??0,m2:false}));
}
