import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchBoundedOfficialResponse, probeOfficialReference, sourceDigest } from './lib/postal-context-source-probe.mjs';

const P = JSON.parse(readFileSync(new URL('../data/postal_country_packs/ge/postal-context/m2-source-review.json', import.meta.url)));
const L = P.postal_probe, N = P.nsdi_probe;
const HOSTS = new Set(['www.gpost.ge', 'gpost.ge', 'nsdi.gov.ge', 'www.napr.gov.ge', 'napr.gov.ge', 'www.geostat.ge', 'geostat.ge']);
const object = value => value && typeof value === 'object' && !Array.isArray(value);
const keys = (value, expected) => object(value) && JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...expected].sort());
const decode = bytes => {
  if (bytes.length > P.limits.max_response_bytes) throw new Error('ge-byte-limit');
  try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch { throw new Error('ge-invalid-utf8'); }
};
const entities = value => value.replace(/&([^;\s]{1,32});/g, (_, key) => {
  const named = {amp:'&',quot:'"',apos:"'",lt:'<',gt:'>',nbsp:' '};
  if (Object.hasOwn(named,key)) return named[key];
  if (!/^#(?:x[0-9a-f]+|\d+)$/i.test(key)) throw new Error('ge-unknown-entity');
  const hex = key[1].toLowerCase() === 'x', number = Number.parseInt(key.slice(hex ? 2 : 1), hex ? 16 : 10);
  if (!number || number > 0x10ffff || (number >= 0xd800 && number <= 0xdfff)) throw new Error('ge-invalid-entity');
  return String.fromCodePoint(number);
});
const clean = value => {
  const result = entities(value).normalize('NFC').trim().replace(/\s+/g,' ');
  if (result.length > P.limits.max_text_characters || /[<>\u0000-\u001f\u007f]/.test(result)) throw new Error('ge-field-text');
  return result;
};
const count = (text, regex) => [...text.matchAll(regex)].length;
const bump = (map,key) => map.set(key,(map.get(key) ?? 0) + 1);

// Session values are deliberately not exported. They exist only inside this
// public-form request flow and are never serialized in a report or error.
function parsePublicForm(html) {
  const forms = [...html.matchAll(/<form\s+Id="FindPostalCodeForm"([^>]*)>([\s\S]*?)<\/form>/gi)];
  if (forms.length !== 1) throw new Error('ge-form-missing-or-duplicate');
  const [,attributes,body] = forms[0];
  if (!/action="\/Help\/FindPostalCode"/i.test(attributes) || !/method="post"/i.test(attributes)
    || !body.includes('name="postalCodeSearchValue"') || !body.includes('name="regionTypeId" type="hidden" value="1"')) throw new Error('ge-form-contract-drift');
  const tokens = [...body.matchAll(/name="__RequestVerificationToken" type="hidden" value="([A-Za-z0-9_-]{20,512})"/g)];
  if (tokens.length !== 1) throw new Error('ge-form-session-missing');
  return tokens[0][1];
}

export function profileGePostalResult(bytes) {
  const html = decode(bytes).replace(/<!--[\s\S]*?-->/g,'');
  if (/<(?:iframe|object|form)\b/i.test(html)) throw new Error('ge-result-unexpected-document');
  const headings = [...html.matchAll(/<div class="com-district com-cl-pal-02">([^<]*)<\/div>/g)].map(m => ({index:m.index,label:clean(m[1])}));
  const cards = [...html.matchAll(/<div\b([^>]*class="com-cell-postcode(?: com-hide)?"[^>]*)>\s*<div class="com-pad">\s*<div class="com-postcode-name com-cl-pal-02">([^<]*)<\/div>\s*<div class="com-location-name">([^<]*)<\/div>\s*<\/div>\s*<\/div>/g)];
  if (!cards.length || cards.length > P.limits.max_rows || !headings.length
    || count(html,/class="com-cell-postcode(?: com-hide)?"/g) !== cards.length
    || count(html,/class="com-postcode-name com-cl-pal-02"/g) !== cards.length
    || count(html,/class="com-location-name"/g) !== cards.length) throw new Error('ge-result-card-contract');
  const groups = new Map(), codes = new Set(), tuples = new Map(), labels = new Map();
  let missingCodeRows=0, missingLocationRows=0, invalidCodeRows=0, leadingZeroRows=0, initiallyHiddenRows=0, numericLocatorLabelRows=0;
  for (const card of cards) {
    const heading = headings.filter(h => h.index < card.index).at(-1);
    if (!heading?.label) throw new Error('ge-result-group-missing');
    const code = clean(card[2]), label = clean(card[3]);
    if (!groups.has(heading.label)) groups.set(heading.label,0); bump(groups,heading.label);
    if (!code) missingCodeRows++; else if (!/^\d{4}$/.test(code)) invalidCodeRows++;
    if (!label) missingLocationRows++;
    if (/^\d{4}$/.test(code)) { codes.add(code); if (code.startsWith('0')) leadingZeroRows++; }
    if (/data-card-visibility="gone"/.test(card[1])) initiallyHiddenRows++;
    if (/\d/.test(label)) numericLocatorLabelRows++;
    const groupLabel = JSON.stringify([heading.label,label]);
    if (!labels.has(groupLabel)) labels.set(groupLabel,new Set()); labels.get(groupLabel).add(code);
    bump(tuples,JSON.stringify([heading.label,code,label]));
  }
  const excessDuplicates = [...tuples.values()].reduce((n,c) => n + Math.max(0,c-1),0);
  return {observedRows:cards.length,groupCount:groups.size,groupSizes:[...groups.values()],distinctCodes:codes.size,
    missingCodeRows,missingCodeRate:missingCodeRows/cards.length,missingLocationRows,missingLocationRate:missingLocationRows/cards.length,
    invalidCodeRows,invalidCodeRate:invalidCodeRows/cards.length,leadingZeroRows,initiallyHiddenRows,numericLocatorLabelRows,
    distinctGroupLocationLabels:labels.size,labelsWithMultipleCodes:[...labels.values()].filter(v=>v.size>1).length,
    excessDuplicateComparisonRows:excessDuplicates,duplicateExcessRate:excessDuplicates/cards.length,
    geometryType:'none',postalGeometryRecords:0,exactCivicAddressRelations:0,exactBuildingRelations:0,
    stableRecordIdentityVerified:false,assignmentEdition:null,assignmentValidity:null,currentNationalCoverageVerified:false,
    sourceRowsPersisted:0,rowsDeduplicated:0,codesInferred:0,hiddenCardsAreNotMissingRows:true};
}

export function parseGeNsdiPage(bytes, component) {
  const html = decode(bytes), matches = [...html.matchAll(/data-page="([^"]+)"/g)];
  if (matches.length !== 1) throw new Error('ge-nsdi-page-shape');
  let data; try { data=JSON.parse(entities(matches[0][1])); } catch { throw new Error('ge-nsdi-page-json'); }
  if (data.component !== component || !object(data.props)) throw new Error('ge-nsdi-component-drift');
  return data.props;
}

export function profileGeNsdiTerms(bytes) {
  const terms = parseGeNsdiPage(bytes,'Terms').terms;
  if (!object(terms) || typeof terms.content !== 'string') throw new Error('ge-nsdi-terms-shape');
  const plain = entities(terms.content.replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ');
  const missingMarkers = N.terms_markers.filter(m => !plain.includes(m));
  if (missingMarkers.length) throw new Error('ge-nsdi-terms-drift');
  return {embeddedTermsDigest:sourceDigest(Buffer.from(terms.content)),termsIdentifier:terms.id,termsVersionDate:null,
    freeSearchAndView:true,downloadRequiresResourcePermission:true,rightsFollowResourceOwner:true,
    blanketDataReuseLicense:false,contractAcceptancePerformed:false};
}

export function profileGeNsdiCatalog(bytes) {
  const props = parseGeNsdiPage(bytes,'Geoportal');
  if (!object(props.themes) || !Number.isSafeInteger(props.totalPublishedCount) || props.totalPublishedCount<0) throw new Error('ge-nsdi-catalog-shape');
  const entries=[];
  for (const themes of Object.values(props.themes)) {
    if (!Array.isArray(themes)) throw new Error('ge-nsdi-theme-shape');
    for (const theme of themes) { if (!Array.isArray(theme.children)) throw new Error('ge-nsdi-theme-shape'); entries.push(...theme.children); }
  }
  if (entries.length>P.limits.max_rows || entries.some(e=>!object(e)||!Number.isSafeInteger(e.id)||typeof e.label!=='string')) throw new Error('ge-nsdi-entry-shape');
  const resources=N.resources.map(spec=>{
    const found=entries.filter(e=>e.id===spec.id);
    if (!found.length || found.some(e=>e.label!==spec.label||e.identifier!==spec.identifier||e.downloadUrl!==null)) throw new Error('ge-nsdi-resource-drift');
    return {metadataId:spec.id,label:spec.label,identifier:spec.identifier,themeOccurrences:found.length,downloadUrl:null,licenseMetadataUrl:spec.license_url,
      geometryFeaturesFetched:0,postalAssignmentAuthority:false};
  });
  return {reportedPublishedResources:props.totalPublishedCount,themeOccurrences:entries.length,distinctMetadataIds:new Set(entries.map(e=>e.id)).size,
    repeatedThemeOccurrences:entries.length-new Set(entries.map(e=>e.id)).size,resources,countsArePostalCoverage:false};
}

export function profileGeResourceLicense(bytes,id) {
  const spec=N.resources.find(r=>r.id===id); if (!spec) throw new Error('ge-resource-not-reviewed');
  let data; try { data=JSON.parse(decode(bytes)); } catch { throw new Error('ge-resource-license-json'); }
  if (!keys(data,['license'])||!keys(data.license,['type','url','text'])||data.license.type!==spec.expected_license
    ||data.license.url!==null||typeof data.license.text!=='string'||sourceDigest(bytes)!==spec.expected_response_digest) throw new Error('ge-resource-license-drift');
  return {metadataId:id,declaredLicense:data.license.type,declaredLicenseUrl:null,licenseTextDigest:sourceDigest(Buffer.from(data.license.text)),
    commercialUsePermitted:false,adaptedSharingPermittedByReviewedConditions:spec.adapted_sharing_permitted,
    exactLicenseResponseVerified:true,resourceEdition:null,publicationRightsForAgidPackCleared:false};
}

async function readResponse(response) {
  if (response.status!==200 || !response.body) { await response.body?.cancel(); throw new Error('ge-http-status'); }
  if (Number(response.headers.get('content-length')??0)>P.limits.max_response_bytes) {await response.body.cancel();throw new Error('ge-byte-limit');}
  const chunks=[];let total=0;
  for await (const chunk of response.body) { total+=chunk.length;if(total>P.limits.max_response_bytes)throw new Error('ge-byte-limit');chunks.push(chunk); }
  const bytes=Buffer.concat(chunks);decode(bytes);return bytes;
}
const metadata=(url,response,bytes)=>({requestedUrl:url,observedAt:new Date().toISOString(),httpStatus:response.status,contentType:response.headers.get('content-type'),
  lastModified:response.headers.get('last-modified'),byteLength:bytes.length,responseDigest:sourceDigest(bytes)});
const safeError=e=>/^ge-[a-z-]+$/.test(e.message)?e.message:['EACCES','ENOTFOUND','ECONNRESET','UND_ERR_CONNECT_TIMEOUT'].includes(e.cause?.code)?e.cause.code:'network-or-parser-error';

export async function inspectGeSources(fetcher=fetch) {
  const report={schemaVersion:'postal-context-ge-source-review/v1',countryCode:'GE',observedAt:new Date().toISOString(),references:[],legacyFinder:null,postalSearch:null,nsdi:{},
    userAuthenticationPerformed:false,anonymousFormSessionUsed:false,sessionValuesPersisted:false,contractAcceptancePerformed:false,paidOperations:0,
    sourceSnapshotsRetained:0,publishedDataArtifacts:0,realAgidRuntimeVerified:false,countryM2Achieved:false};
  for(const ref of P.reference_probes) {
    try {report.references.push({...await probeOfficialReference(ref,HOSTS,fetcher),observedAt:new Date().toISOString()});}
    catch(e){report.references.push({id:ref.id,requestedUrl:ref.url,status:'fetch-error',contentVerified:false,error:safeError(e),observedAt:new Date().toISOString()});}
  }
  try {
    const old=await fetchBoundedOfficialResponse(L.legacy_url,{allowedHosts:HOSTS,fetcher});
    report.legacyFinder={...old.metadata,observedAt:new Date().toISOString(),byteLength:old.bytes?.length??0,responseDigest:old.bytes&&sourceDigest(old.bytes),
      containsSearchForm:old.bytes?decode(old.bytes).includes('Id="FindPostalCodeForm"'):false,linksCurrentFinder:old.bytes?decode(old.bytes).includes('/help/postal-codes'):false};
    const response=await fetcher(L.form_url,{redirect:'manual',credentials:'omit',signal:AbortSignal.timeout(P.limits.timeout_ms)});
    if (!(response.headers.get('content-type')??'').startsWith('text/html')) throw new Error('ge-form-mime');
    const formBytes=await readResponse(response), token=parsePublicForm(decode(formBytes));
    const cookieHeaders=response.headers.getSetCookie().map(v=>v.split(';')[0]).filter(v=>/^__RequestVerificationToken=[A-Za-z0-9_-]{20,512}$/.test(v));
    if(cookieHeaders.length!==1)throw new Error('ge-form-cookie-missing');
    report.anonymousFormSessionUsed=true;
    const observations=[];
    for(let i=0;i<2;i++) {
      const result=await fetcher(L.search_url,{method:'POST',redirect:'manual',credentials:'omit',signal:AbortSignal.timeout(P.limits.timeout_ms),
        headers:{'Content-Type':'application/x-www-form-urlencoded',Cookie:cookieHeaders[0]},
        body:new URLSearchParams({__RequestVerificationToken:token,regionTypeId:L.region_type,postalCodeSearchValue:L.query}).toString()});
      if (!(result.headers.get('content-type')??'').startsWith('text/html'))throw new Error('ge-search-mime');
      const bytes=await readResponse(result);observations.push({...metadata(L.search_url,result,bytes),method:'POST',profile:profileGePostalResult(bytes)});
    }
    report.postalSearch={form:metadata(L.form_url,response,formBytes),queryScope:L.query_scope,regionTypeId:L.region_type,query:L.query,
      first:observations[0],repeat:observations[1],byteIdenticalRepeat:observations[0].responseDigest===observations[1].responseDigest,
      atomicSnapshotVerified:false,sourceRowsPersisted:0,sourceRightsCleared:false};
  }catch(e){report.postalSearch={status:'probe-error',error:safeError(e)};}
  for(const [key,url,profile] of [['terms',N.terms_url,profileGeNsdiTerms],['catalog',N.portal_url,profileGeNsdiCatalog],
    ...N.resources.map(r=>['license'+r.id,r.license_url,b=>profileGeResourceLicense(b,r.id)])]) {
    try {const r=await fetchBoundedOfficialResponse(url,{allowedHosts:HOSTS,fetcher});if(!r.bytes)throw new Error('ge-http-status');
      const expected=key.startsWith('license')?'application/json':'text/html';
      if((r.metadata.contentType??'').split(';')[0]!==expected)throw new Error('ge-nsdi-mime');
      report.nsdi[key]={...r.metadata,observedAt:new Date().toISOString(),byteLength:r.bytes.length,responseDigest:sourceDigest(r.bytes),profile:profile(r.bytes)};
    }catch(e){report.nsdi[key]={requestedUrl:url,status:'probe-error',error:safeError(e),observedAt:new Date().toISOString()};}
  }
  report.completedAt=new Date().toISOString();return report;
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2);if(args.length!==2||args[0]!=='--report')throw new Error('usage: node scripts/inspect-postal-context-ge-sources.mjs --report new.json');
  const output=resolve(args[1]);if(existsSync(output))throw new Error('report-already-exists');
  const report=await inspectGeSources();mkdirSync(dirname(output),{recursive:true});writeFileSync(output,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({country:'GE',postal:report.postalSearch?.first?.profile??report.postalSearch,nsdi:Object.fromEntries(Object.entries(report.nsdi).map(([k,v])=>[k,v.profile??v])),countryM2Achieved:false}));
}
