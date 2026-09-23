import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchBoundedOfficialResponse, probeOfficialReference, sourceDigest } from './lib/postal-context-source-probe.mjs';
import { createPostalCurlFetcher } from './lib/postal-context-curl-fetch.mjs';

const PROFILE = JSON.parse(readFileSync(new URL('../data/postal_country_packs/bh/postal-context/m2-source-review.json', import.meta.url)));
const DATA = PROFILE.dataset_probe;
const HOSTS = new Set([...PROFILE.reference_probes, ...PROFILE.alternate_postal_probes, ...PROFILE.catalog_probes, PROFILE.terms_probe].map(p => new URL(p.url).hostname));
const fields = Object.keys(DATA.fields).sort();
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const missing = value => value === null || value === undefined || value === '';
const finite = value => typeof value === 'number' && Number.isFinite(value);
const normalizedText = value => typeof value === 'string' ? value.normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase() : null;
const repeats = map => [...map.values()].filter(n => n > 1);
const bump = (map, key) => map.set(key, (map.get(key) ?? 0) + 1);
const decodeEntities = text => text.replace(/&(amp|quot|apos|lt|gt|nbsp|#(?:x[0-9a-f]+|\d+));/gi, (_, entity) => {
  if (entity[0] !== '#') return ({amp:'&',quot:'"',apos:"'",lt:'<',gt:'>',nbsp:' '})[entity.toLowerCase()];
  const hex = entity[1].toLowerCase() === 'x', value = Number.parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10);
  if (value === 0 || value > 0x10ffff || (value >= 0xd800 && value <= 0xdfff)) throw new Error('bh-invalid-entity');
  return String.fromCodePoint(value);
});
const decodeBytes = bytes => {
  if (bytes.length > PROFILE.limits.max_response_bytes) throw new Error('reference-byte-limit');
  try { return new TextDecoder('utf-8', {fatal:true}).decode(bytes); } catch { throw new Error('bh-invalid-utf8'); }
};

export function profileBhTermsHtml(bytes) {
  const html = decodeBytes(bytes);
  const matches = [...html.replace(/<!--[\s\S]*?-->/g, '').matchAll(/\$scope\.blocks\s*=\s*\{\s*"html"\s*:\s*("(?:[^"\\]|\\.)*")\s*,/g)];
  if (matches.length !== 1) throw new Error('bh-terms-template-shape');
  // Parse the JSON string, then its encoded HTML layer, never execute the page.
  const content = decodeEntities(JSON.parse(matches[0][1]));
  const plain = decodeEntities(content.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
  const missingMarkers = PROFILE.terms_probe.required_markers.filter(marker => !plain.toLowerCase().includes(marker.toLowerCase()));
  const pageDateMatches = plain.includes(PROFILE.terms_probe.page_updated_marker);
  const linkedLicenseObserved = html.includes(PROFILE.terms_probe.linked_license_url);
  return {
    status: missingMarkers.length === 0 && pageDateMatches && linkedLicenseObserved ? 'terms-observed-not-release-authorization' : 'terms-require-review',
    missingMarkers, pageContentDate: pageDateMatches ? PROFILE.terms_probe.page_updated : null,
    linkedLicenseObserved, responseDigest: sourceDigest(bytes), embeddedTermsHtmlDigest: sourceDigest(Buffer.from(content)),
    governingDocumentsMustBeReviewedTogether: true, contractAcceptancePerformed: false, m2ArtifactRightsCleared: false,
  };
}

export function profileBhMetadata(value) {
  const meta = value?.metas?.default;
  if (!object(value) || value.dataset_id !== DATA.dataset_id || !object(meta)
    || meta.publisher !== DATA.publisher || !Array.isArray(value.fields)
    || !same(value.fields.map(f => [f.name, f.type]).sort(), Object.entries(DATA.fields).sort())
    || !same(meta.geometry_types, ['Point']) || !Number.isSafeInteger(meta.records_count)
    || meta.records_count < 1 || meta.records_count > DATA.max_records) throw new Error('bh-metadata-schema');
  return {
    datasetId: value.dataset_id, publisher: meta.publisher, fieldNames: fields,
    recordsCount: meta.records_count, geometryTypes: meta.geometry_types,
    metadataBboxGeometryType: meta.bbox?.geometry?.type ?? null, bboxIsPostalGeometry: false,
    dataProcessedAt: meta.data_processed ?? null, metadataProcessedAt: meta.metadata_processed ?? null,
    modifiedAt: meta.modified ?? null, updateFrequency: meta.update_frequency ?? null,
    geographicReference: meta.geographic_reference ?? null,
    datasetLicense: meta.license ?? null, datasetLicenseUrl: meta.license_url ?? null,
    emptyLicenseFieldsDoNotNegatePortalLicense: true,
    postcodeFieldPresent: fields.includes('postcode'), stableOfficeOrBuildingIdDeclared: false,
    sourceAssignmentEdition: null, completePostcodeBlockAssignment: false,
  };
}

export function profileBhLandmarkRows(value) {
  if (!object(value) || !same(Object.keys(value).sort(), ['results','total_count']) || !Array.isArray(value.results)
    || !Number.isSafeInteger(value.total_count) || value.total_count < 0 || value.results.length > DATA.max_records) throw new Error('bh-records-envelope');
  const rows = value.results, ids = new Map(), blocks = new Map(), names = new Map(), points = new Map(), exact = new Map(), gov = new Map(), govReverse = new Map();
  const textFields = fields.filter(key => DATA.fields[key] === 'text');
  const r = { observedLandmarkRows:rows.length, apiTotal:value.total_count, numericBlockRows:0, validBlockSyntaxRows:0, missingBlockRows:0, invalidBlockRows:0,
    missingNameRows:0, missingGovernorateRows:0, invalidCounterRows:0, missingCoordinateRows:0, invalidCoordinateRows:0, coordinateFieldsMismatchRows:0 };
  for (const row of rows) {
    if (!object(row) || !same(Object.keys(row).sort(), fields) || textFields.some(key => row[key] !== null && (typeof row[key] !== 'string' || row[key].length > PROFILE.limits.max_string_characters))
      || (row.location !== null && (!object(row.location) || !same(Object.keys(row.location).sort(), ['lat','lon'])))) throw new Error('bh-row-schema');
    if (Number.isSafeInteger(row.n) && row.n > 0) bump(ids,row.n); else r.invalidCounterRows++;
    if (typeof row.block === 'number') r.numericBlockRows++;
    if (missing(row.block)) r.missingBlockRows++;
    else if (!Number.isSafeInteger(row.block) || row.block < 100 || row.block > 1299) r.invalidBlockRows++;
    else { r.validBlockSyntaxRows++; bump(blocks,String(row.block)); }
    if (!normalizedText(row.name) || !normalizedText(row.l_sm)) r.missingNameRows++;
    else bump(names,normalizedText(row.name));
    if (!normalizedText(row.governorate) || !normalizedText(row.lmhfzt)) r.missingGovernorateRows++;
    else {
      const en=normalizedText(row.governorate), ar=normalizedText(row.lmhfzt);
      if (!gov.has(en)) gov.set(en,new Set()); gov.get(en).add(ar);
      if (!govReverse.has(ar)) govReverse.set(ar,new Set()); govReverse.get(ar).add(en);
    }
    const coordinates=[row.x_longitude,row.y_latitude,row.location?.lon,row.location?.lat];
    if (coordinates.some(missing)) r.missingCoordinateRows++;
    else if (!coordinates.every(finite) || Math.abs(coordinates[0])>180 || Math.abs(coordinates[2])>180 || Math.abs(coordinates[1])>90 || Math.abs(coordinates[3])>90) r.invalidCoordinateRows++;
    else {
      if (row.x_longitude!==row.location.lon || row.y_latitude!==row.location.lat) r.coordinateFieldsMismatchRows++;
      bump(points,JSON.stringify([row.location.lon,row.location.lat]));
    }
    bump(exact,JSON.stringify(fields.map(key=>row[key])));
  }
  return { ...r, distinctCounters:ids.size, countersAreContiguousOneToN:ids.size===rows.length&&[...ids.keys()].every(n=>n<=rows.length),
    duplicateCounterGroups:repeats(ids).length, distinctBlocks:blocks.size, repeatedBlockGroups:repeats(blocks).length,
    rowsInRepeatedBlockGroups:repeats(blocks).reduce((sum,n)=>sum+n,0), distinctNormalizedEnglishNames:names.size,
    duplicateNormalizedNameGroups:repeats(names).length, distinctCoordinatePairs:points.size, duplicateCoordinateGroups:repeats(points).length,
    exactDuplicateRowGroups:repeats(exact).length, distinctGovernorateLabels:gov.size,
    ambiguousBilingualGovernorateLabelGroups:[...gov.values(),...govReverse.values()].filter(s=>s.size>1).length,
    rowsDeduplicated:0, coordinatesRepaired:0, postcodesInferredFromBlock:0,
    stableRecordIdentityVerified:false, providerCrsAndPositionAccuracyVerified:false,
    completeNationalCoverageVerified:false, currentAssignmentVerified:false, sourceAssignmentEdition:null,
    postalGeometryRecords:0, civicAddressesVerified:0, buildingLinksVerified:0, poBoxSubscribersRetrieved:0,
  };
}

export function profileBhCatalog(value) {
  if (!object(value) || !Number.isSafeInteger(value.total_count) || !Array.isArray(value.results) || value.results.length>PROFILE.limits.max_catalog_results) throw new Error('bh-catalog-schema');
  const datasets=value.results.map(d=>{
    if(typeof d.dataset_id!=='string'||d.dataset_id.length>200||!Array.isArray(d.fields))throw new Error('bh-catalog-schema');
    const names=d.fields.map(f=>f.name);
    return {id:d.dataset_id,fieldNames:names,declaredRecords:d.metas?.default?.records_count??null,
      possiblePostcodeBlockSchema:names.some(n=>/postal|postcode/i.test(n))&&names.some(n=>/block/i.test(n))};
  });
  return {totalMatches:value.total_count,returnedDatasetMetadata:datasets,allSearchResultsReturned:value.total_count===datasets.length,
    underlyingDatasetRecordsRetrieved:0,searchIsProofOfNationalAbsence:false};
}

async function jsonResponse(url,fetcher) {
  const {metadata,bytes}=await fetchBoundedOfficialResponse(url,{allowedHosts:HOSTS,fetcher});
  if(!bytes)throw new Error('bh-http-'+metadata.httpStatus);
  if((metadata.contentType??'').split(';')[0].trim()!=='application/json')throw new Error('bh-json-mime');
  return {observation:{...metadata,observedAt:new Date().toISOString(),responseDigest:sourceDigest(bytes),byteLength:bytes.length},value:JSON.parse(decodeBytes(bytes))};
}
const safeError = error => {
  if(error.name==='TimeoutError'||error.cause?.code==='UND_ERR_CONNECT_TIMEOUT')return 'timeout';
  if(/^(?:bh-(?:metadata-schema|records-envelope|row-schema|catalog-schema|json-mime|invalid-utf8|invalid-entity|terms-template-shape|http-\d{3})|reference-byte-limit|unapproved-reference-host|reference-redirect-limit|curl-(?:timeout|tls-verification-failed|network-error|invalid-response))$/.test(error.message))return error.message;
  return 'network-or-parser-error';
};
async function reference(probe,fetcher) {
  try{return {...await probeOfficialReference(probe,HOSTS,fetcher),observedAt:new Date().toISOString()};}
  catch(error){return {id:probe.id,requestedUrl:probe.url,observedAt:new Date().toISOString(),status:'fetch-error',contentVerified:false,error:safeError(error)};}
}

export async function inspectBhSources(fetcher=fetch, alternateFetcher=null) {
  const observedAt=new Date().toISOString(),references=[],catalogObservations=[];
  for(let offset=0;offset<PROFILE.reference_probes.length;offset+=3)references.push(...await Promise.all(PROFILE.reference_probes.slice(offset,offset+3).map(p=>reference(p,fetcher))));
  let termsObservation,landmarkObservation;
  try{
    const {metadata,bytes}=await fetchBoundedOfficialResponse(PROFILE.terms_probe.url,{allowedHosts:HOSTS,fetcher});
    if(!bytes||!(metadata.contentType??'').startsWith('text/html'))throw new Error('bh-http-'+metadata.httpStatus);
    termsObservation={...metadata,observedAt:new Date().toISOString(),...profileBhTermsHtml(bytes)};
  }catch(error){termsObservation={requestedUrl:PROFILE.terms_probe.url,status:'terms-error',error:safeError(error)};}
  try{
    const before=await jsonResponse(DATA.metadata_url,fetcher),metaBefore=profileBhMetadata(before.value);
    const data=await jsonResponse(DATA.records_url,fetcher),validation=profileBhLandmarkRows(data.value);
    const after=await jsonResponse(DATA.metadata_url,fetcher),metaAfter=profileBhMetadata(after.value);
    const metadataUnchanged=same(metaBefore,metaAfter);
    landmarkObservation={status:'public-point-context-not-m2',metadataBefore:{...before.observation,validation:metaBefore},records:data.observation,
      metadataAfter:{...after.observation,validation:metaAfter},validation:{...validation,metadataUnchangedDuringProbe:metadataUnchanged,
        completeObservedDatasetResponse:metadataUnchanged&&validation.apiTotal===validation.observedLandmarkRows&&validation.apiTotal===metaBefore.recordsCount,
        sourceRowsPersisted:0,responseIsRetainedSourceSnapshot:false}};
  }catch(error){landmarkObservation={status:'preflight-error',error:safeError(error)};}
  for(const probe of PROFILE.catalog_probes){
    try{const r=await jsonResponse(probe.url,fetcher);catalogObservations.push({id:probe.id,...r.observation,...profileBhCatalog(r.value)});}
    catch(error){catalogObservations.push({id:probe.id,requestedUrl:probe.url,status:'catalog-error',error:safeError(error)});}
  }
  const alternateAccessChecks=[];
  if(alternateFetcher)for(const probe of PROFILE.alternate_postal_probes)alternateAccessChecks.push({...await reference(probe,alternateFetcher),transport:'explicit-native-curl-verified-tls'});
  return {schemaVersion:'postal-context-bh-source-review/v1',countryCode:'BH',observedAt,status:'source-preflight-not-m2',references,termsObservation,landmarkObservation,catalogObservations,alternateAccessChecks,
    tlsVerificationDisabled:false,sourceDataSnapshotsPersisted:0,publishedDataArtifacts:0,
    completePostcodeBlockAssignmentVerified:false,rightsForPublicM2ArtifactCleared:false,realAgidRuntimeVerified:false,countryM2Achieved:false,
    note:'Only metadata, hashes and aggregate quality counts are retained. Public landmark points, block labels, metadata envelopes and postal statistics never become postcode assignments, civic addresses or building links. The government open-data licence is a positive source-specific basis, not a new publication approval or proof of a complete assignment artifact.'};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2);
  if(![2,4].includes(args.length)||args[0]!=='--report'||(args.length===4&&args[2]!=='--curl-executable'))throw new Error('usage: node scripts/inspect-postal-context-bh-sources.mjs --report new.json [--curl-executable /trusted/curl]');
  const output=resolve(args[1]);if(existsSync(output))throw new Error('report-already-exists');
  const alternate=args.length===4?createPostalCurlFetcher(resolve(args[3]),HOSTS):null;
  const report=await inspectBhSources(fetch,alternate);
  mkdirSync(dirname(output),{recursive:true});writeFileSync(output,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({references:report.references.map(r=>({id:r.id,status:r.status,contentVerified:r.contentVerified,error:r.error})),terms:report.termsObservation,landmarks:report.landmarkObservation,catalog:report.catalogObservations,alternateAccessChecks:report.alternateAccessChecks,countryM2Achieved:false},null,2));
}
