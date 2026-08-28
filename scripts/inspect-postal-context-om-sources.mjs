import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {fetchBoundedOfficialResponse, sourceDigest} from './lib/postal-context-source-probe.mjs';
import {createPostalCurlFetcher} from './lib/postal-context-curl-fetch.mjs';

export const config = JSON.parse(readFileSync(new URL('../data/postal_country_packs/om/postal-context/m2-source-review.json', import.meta.url)));
const hosts = new Set(config.live_allowed_hosts);
const fail = reason => { throw Error('om-' + reason); };
const normalized = s => s.normalize('NFC').replace(/\s+/gu, ' ').trim();
const plain = s => normalized(s.replace(/<(script|style|head)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]*>/g, ' '));
const mimeBase = s => (s ?? '').split(';')[0].trim().toLowerCase();
const safeFailure = e => /^(om-[a-z-]+|curl-[a-z-]+|reference-[a-z-]+|unapproved-reference-host|empty-reference|redirect-without-location)$/.test(e?.message ?? '') ? e.message : 'network-or-parser-error';

export function profileOmanLayer(document) {
  if (document.error || document.layers?.length !== 1 || document.tables?.length !== 0) fail('layer-envelope');
  const l = document.layers[0];
  if (l.id !== 3 || l.name !== 'WilayatB' || l.type !== 'Feature Layer' || l.geometryType !== 'esriGeometryPolygon'
      || l.objectIdField !== 'OBJECTID' || l.globalIdField !== 'GLOBALID' || l.extent?.spatialReference?.wkid !== 4326
      || l.extent.spatialReference.latestWkid !== 4326 || l.relationships?.length !== 0) fail('layer-identity');
  const types = {Shape__Area:'Double', Shape__Length:'Double', OBJECTID:'OID', NSDIFID:'String', NAMEAR:'String', NAMEEN:'String',
    FEATURELOADDATE:'Date', FEATUREUPDATEDATE:'Date', FEATUREPROVIDER:'String', SOURCEFID:'String', REMARKSAR:'String',
    REMARKSEN:'String', FEATUREOWNER:'String', GLOBALID:'GlobalID', longitude:'Double', latitude:'Double', WilayaID:'Integer', GovernorateID:'Integer'};
  if (!Array.isArray(l.fields) || l.fields.length !== 18 || new Set(l.fields.map(f => f.name)).size !== 18
      || l.fields.some(f => !Object.hasOwn(types, f.name) || f.type !== 'esriFieldType' + types[f.name]
        || f.nullable !== !['Shape__Area', 'Shape__Length', 'OBJECTID', 'GLOBALID'].includes(f.name))) fail('layer-fields');
  if (!l.copyrightText?.includes('[Ministry of Interior]') || !l.copyrightText.includes('[National Center for Statistics and Information ]')) fail('layer-owner');
  return {...config.references.find(r => r.id === 'ncsi-layer').reviewed_profile,
    fieldSchema:l.fields.map(({name, type, nullable, length}) => ({name, type, nullable, ...(length ? {length} : {})})),
    exposedCapabilities:l.capabilities, snapshotLimit:l.maxRecordCount, snapshotLimitIsTotal:false,
    businessKeysUnique:null, globalIdSchemaIsRealRowValidation:false};
}

export function profileOmanReference(bytes, ref, contentType, workbookProfile) {
  if (!Buffer.isBuffer(bytes) || bytes.length > config.limits.max_response_bytes) fail('byte-limit');
  if (!ref.reviewed_digest || bytes.length !== ref.reviewed_bytes || sourceDigest(bytes) !== ref.reviewed_digest) fail('content-drift');
  if (!ref.accepted_mime.includes(mimeBase(contentType))) fail('mime');
  let profile = structuredClone(ref.reviewed_profile);
  if (ref.kind === 'reviewed-pdf') {
    if (bytes.subarray(0, 5).toString() !== '%PDF-') fail('pdf-header');
    profile.priorVisualReviewReusedByExactBytes = true;
  } else if (ref.kind === 'reviewed-workbook') {
    if (bytes.subarray(0, 4).toString('hex') !== '504b0304') fail('xlsx-header');
    if (workbookProfile) {
      try { assert.deepEqual(workbookProfile, ref.reviewed_profile); } catch { fail('workbook-profile-binding'); }
    }
    profile.structureRecomputed = Boolean(workbookProfile);
    profile.priorAggregateReviewReusedByExactBytes = !workbookProfile;
  } else {
    let text; try { text = new TextDecoder('utf-8', {fatal:true}).decode(bytes); } catch { fail('encoding'); }
    if (ref.kind === 'reviewed-layer-json') {
      let document; try { document = JSON.parse(text); } catch { fail('json'); }
      profile = profileOmanLayer(document);
    } else if (ref.kind === 'reviewed-html') {
      const head = text.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? '';
      const titles = [...head.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)];
      if (titles.length !== 1 || normalized(titles[0][1]) !== ref.title) fail('title');
      const body = plain(text);
      const markers = {
        'post-terms':['Company Name', 'Website.com', 'viewing', 'publishing', 'harvesting'],
        'gov-building':['Muscat Governorate', 'July 02, 2026', 'building numbering'],
        'dg-open':['PostOfficeLocations', '4/2025', '2024-2025', 'محافظة الداخلية'],
        'data-terms':['Open Government License', 'without obtaining separate permission'],
      }[ref.id];
      if (!markers || markers.some(m => !body.includes(m))) fail('html-markers');
      if (ref.id === 'dg-open' && (!text.includes(profile.linkedWorkbook) || !text.includes(profile.linkedLicense))) fail('listing-binding');
      if (ref.id === 'data-terms' && !text.includes(profile.linkedLicense)) fail('license-link');
    } else fail('reference-kind');
  }
  return {status:ref.kind === 'reviewed-workbook' ? 'poi-workbook-reviewed-not-postal-assignments' : 'reference-verified-not-data',
    contentVerified:true, transportBytesVerified:true, profile, postalAssignmentsValidated:0, productionGeometryRecords:0};
}

function empty(mode) {
  return {schemaVersion:'postal-context-om-source-review/v1', countryCode:'OM', generatedAt:new Date().toISOString(), mode,
    criterionId:config.m2_criterion.id, criterionDefinition:config.m2_criterion.definition, references:[],
    licensedNationalOfficeCodeArtifacts:0, currentPostalAssignmentsValidated:0, productionGeometryRecords:0,
    civicBuildingRelations:0, publishedImmutableDataArtifacts:0, realAgidRuntimeVerified:false,
    quality:{nationalCoverage:null, postalAssignmentCompleteness:null, currentOfficeValidity:null, positionalAccuracyMetres:null},
    rawSourceRowsInGit:0, rawDocumentsInGit:0, paidOperations:0, authenticatedSourceRequests:0,
    directoryHarvests:0, featureQueries:0, formSubmissions:0, contractAcceptancePerformed:false, countryM2Achieved:false};
}

export function inspectOmanObservations(observations) {
  if (!Array.isArray(observations) || observations.length !== config.references.length || new Set(observations.map(o => o.id)).size !== observations.length) fail('observation-set');
  const report = empty('offline-verification-of-captured-public-sources');
  for (const ref of config.references) {
    const o = observations.find(x => x.id === ref.id);
    if (!o || o.requestedUrl !== ref.url || o.observedAt !== ref.reviewed_observed_at
        || !Number.isFinite(Date.parse(o.observedAt)) || Date.parse(o.observedAt) > Date.now()) fail('observation-binding');
    const row = {id:ref.id, sourceId:ref.source_id, requestedUrl:ref.url, observedAt:o.observedAt, httpStatus:o.httpStatus,
      networkRequestsDuringVerification:0};
    if (ref.kind === 'acquisition-failed') {
      if (o.httpStatus !== null || o.bytes != null || o.responseDigest !== null || o.byteLength !== 0 || o.failureKind !== ref.reviewed_failure) fail('failure-receipt');
      report.references.push({...row, status:'acquisition-failed', failureKind:o.failureKind, contentVerified:false, sourceDocumentDigest:null});
      continue;
    }
    if (o.httpStatus !== 200 || o.finalUrl !== ref.url || o.redirects?.length !== 0 || !Buffer.isBuffer(o.bytes)
        || o.byteLength !== o.bytes.length || o.responseDigest !== sourceDigest(o.bytes)) fail('receipt-binding');
    if (ref.kind === 'reviewed-workbook' && !o.workbookProfile) fail('fresh-workbook-profile-required');
    const profile = profileOmanReference(o.bytes, ref, o.contentType, o.workbookProfile);
    report.references.push({...row, finalUrl:o.finalUrl, contentType:o.contentType, lastModified:o.lastModified ?? null,
      byteLength:o.byteLength, responseDigest:o.responseDigest, sourceDocumentDigest:o.responseDigest, ...profile});
  }
  report.completedAt = new Date().toISOString();
  return report;
}

export async function inspectOmanSources(fetcher = fetch) {
  const report = empty('bounded-public-source-recheck');
  for (const ref of config.references) {
    const row = {id:ref.id, sourceId:ref.source_id, requestedUrl:ref.url};
    if (ref.kind === 'acquisition-failed' || (ref.kind === 'reviewed-workbook'
        && ['dg-license', 'dg-open'].some(id => !report.references.find(r => r.id === id)?.contentVerified))) {
      report.references.push({...row, status:'not-requested-review-required', contentVerified:false, sourceDocumentDigest:null});
      continue;
    }
    try {
      const {metadata:m, bytes} = await fetchBoundedOfficialResponse(ref.url, {allowedHosts:hosts, fetcher, maxBytes:config.limits.max_response_bytes});
      if (m.finalUrl !== ref.url || m.redirects.length) fail('unreviewed-redirect');
      const receipt = {...row, ...m, observedAt:new Date().toISOString(), byteLength:bytes?.length ?? 0, responseDigest:bytes ? sourceDigest(bytes) : null};
      if (!bytes) { report.references.push({...receipt, status:'http-access-failed', contentVerified:false, sourceDocumentDigest:null}); continue; }
      report.references.push({...receipt, ...profileOmanReference(bytes, ref, m.contentType), sourceDocumentDigest:receipt.responseDigest});
    } catch (e) {
      report.references.push({...row, observedAt:new Date().toISOString(), status:'review-failed', failureKind:safeFailure(e), contentVerified:false, sourceDocumentDigest:null});
    }
  }
  report.completedAt = new Date().toISOString();
  return report;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), options = {};
  if (args.length % 2) fail('cli-arguments');
  for (let i = 0; i < args.length; i += 2) {
    if (!['--report', '--curl', '--observations', '--python'].includes(args[i]) || Object.hasOwn(options, args[i])) fail('cli-arguments');
    options[args[i]] = args[i + 1];
  }
  if (!options['--report'] || (options['--observations'] && (!options['--python'] || options['--curl'])) || (!options['--observations'] && options['--python'])) fail('cli-arguments');
  const output = resolve(options['--report']);
  if (existsSync(output)) fail('report-exists');
  let report;
  if (options['--observations']) {
    const directory = resolve(options['--observations']);
    const observations = config.references.map(ref => {
      const r = JSON.parse(readFileSync(resolve(directory, ref.id + '.json')));
      if (ref.kind !== 'acquisition-failed') r.bytes = readFileSync(resolve(directory, ref.id + '.bin'));
      if (ref.kind === 'reviewed-workbook') r.workbookProfile = JSON.parse(execFileSync(options['--python'], ['-X', 'utf8', fileURLToPath(new URL('./inspect-postal-context-om-workbook.py', import.meta.url)), resolve(directory, ref.id + '.bin')], {encoding:'utf8', timeout:10000, maxBuffer:65536, windowsHide:true}));
      return r;
    });
    report = inspectOmanObservations(observations);
  } else report = await inspectOmanSources(options['--curl'] ? createPostalCurlFetcher(options['--curl'], hosts) : fetch);
  mkdirSync(dirname(output), {recursive:true});
  writeFileSync(output, JSON.stringify(report, null, 2) + '\n', {flag:'wx'});
  console.log(JSON.stringify({report:output, results:report.references.map(r => ({id:r.id, status:r.status})), countryM2Achieved:false}));
}
