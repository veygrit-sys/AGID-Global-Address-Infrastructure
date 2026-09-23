import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {fetchBoundedOfficialResponse, sourceDigest} from './lib/postal-context-source-probe.mjs';
import {createPostalCurlFetcher} from './lib/postal-context-curl-fetch.mjs';

export const config = JSON.parse(readFileSync(new URL('../data/postal_country_packs/ph/postal-context/m2-source-review.json', import.meta.url)));
const hosts = new Set(config.live_allowed_hosts);
const fail = reason => { throw Error('ph-' + reason); };
const mime = value => (value ?? '').split(';')[0].trim().toLowerCase();
const normalized = value => value.normalize('NFC').replace(/\s+/gu, ' ').trim();
const safeFailure = e => /^(ph-[a-z-]+|curl-[a-z-]+|reference-[a-z-]+|unapproved-reference-host|empty-reference|redirect-without-location)$/.test(e?.message ?? '') ? e.message : 'network-or-parser-error';
const htmlText = text => normalized(text.replace(/<(script|style|head)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]*>/g, ' '));

export function profilePhilippinesReference(bytes, ref, contentType, tableProfile) {
  if (!Buffer.isBuffer(bytes) || !bytes.length || bytes.length > config.limits.max_response_bytes) fail('byte-limit');
  if (bytes.length !== ref.reviewed_bytes || sourceDigest(bytes) !== ref.reviewed_digest) fail('content-drift');
  if (!ref.accepted_mime.includes(mime(contentType))) fail('mime');
  const profile = structuredClone(ref.reviewed_profile);
  if (ref.kind === 'reviewed-pdf') {
    if (bytes.subarray(0, 5).toString() !== '%PDF-') fail('pdf-header');
    profile.priorVisualReviewReusedByExactBytes = true;
  } else if (['reviewed-html', 'reviewed-locator-html'].includes(ref.kind)) {
    let text;
    try { text = new TextDecoder('utf-8', {fatal:true}).decode(bytes); } catch { fail('encoding'); }
    const head = text.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? '';
    const titles = [...head.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)];
    if (titles.length !== 1 || normalized(titles[0][1]) !== ref.title) fail('title');
    const plain = htmlText(text);
    const markers = {
      locator:['Region', 'Provinces', 'City/Municipality', 'Zip Code', 'public domain unless otherwise stated', 'Copyright'],
      'zip-ph-announcement':['March 6, 2024', 'seven (7) digit alphanumeric', 'old four (4) digit'],
      'ip-code':['171.11.', 'government-owned or controlled corporations', '176.1.', 'for profit', '176.3.', 'copyright owner'],
    }[ref.id];
    if (!markers || markers.some(marker => !plain.includes(marker))) fail('html-markers');
    if (ref.kind === 'reviewed-locator-html') {
      if (tableProfile) {
        for (const [key, value] of Object.entries(tableProfile)) {
          try { assert.deepEqual(value, profile[key]); } catch { fail('table-profile-binding'); }
        }
        const expectedKeys = ['inputDigest','inputBytes','tableId','schema','grain','htmlBodyRows','allBlankRows','populatedRows','fourDigitRows',
          'invalidOrMissingCodeRows','missingFieldsInPopulatedRows','completeFourFieldCandidates','distinctFourDigitCodes','leadingZeroCodeRows',
          'sharedCodeGroups','rowsInSharedCodeGroups','exactDuplicateRowGroups','duplicateRowsBeyondFirst','localityKeysWithMultipleCodes',
          'distinctRegionLabels','distinctProvinceLabels','invalidRows','decodedMatrixDigest','normalization','rowsRepaired','rowsDeduplicated',
          'rowsExported','nationalCompleteness','sourceEffectiveDate','geometryRecords','addressBuildingRelations','countryM2Achieved'];
        if (Object.keys(tableProfile).length !== expectedKeys.length || expectedKeys.some(key => !Object.hasOwn(tableProfile, key))) fail('table-profile-schema');
      }
      profile.structureRecomputed = Boolean(tableProfile);
      profile.priorAggregateReviewReusedByExactBytes = !tableProfile;
    }
  } else fail('reference-kind');
  return {status:ref.kind === 'reviewed-locator-html' ? 'locator-snapshot-reviewed-not-complete-current-assignments' : 'reference-verified-not-data',
    contentVerified:true, transportBytesVerified:true, profile, currentPostalAssignmentsValidated:0, productionGeometryRecords:0};
}

function empty(mode) {
  return {schemaVersion:'postal-context-ph-source-review/v1', countryCode:'PH', generatedAt:new Date().toISOString(), mode,
    criterionId:config.m2_criterion.id, criterionDefinition:config.m2_criterion.definition, references:[],
    licensedCurrentNationalAssignmentArtifacts:0, currentPostalAssignmentsValidated:0, productionGeometryRecords:0,
    civicBuildingRelations:0, publishedImmutableDataArtifacts:0, realAgidRuntimeVerified:false,
    quality:{nationalCompleteness:null, currentValidity:null, postalAssignmentAccuracy:null, positionalAccuracyMetres:null},
    rawSourceRowsInGit:0, rawSourceDocumentsInGit:0, paidOperations:0, authenticatedSourceRequests:0,
    featureQueries:0, privatePostalIdRecordsIngested:0, contractAcceptancePerformed:false, countryM2Achieved:false};
}

export function inspectPhilippinesObservations(observations) {
  if (!Array.isArray(observations) || observations.length !== config.references.length || new Set(observations.map(o => o.id)).size !== observations.length) fail('observation-set');
  const report = empty('offline-verification-of-captured-public-sources');
  for (const ref of config.references) {
    const o = observations.find(candidate => candidate.id === ref.id);
    if (!o || o.requestedUrl !== ref.url || o.observedAt !== ref.reviewed_observed_at
        || !Number.isFinite(Date.parse(o.observedAt)) || Date.parse(o.observedAt) > Date.now()) fail('observation-binding');
    const row = {id:ref.id, sourceId:ref.source_id, requestedUrl:ref.url, observedAt:o.observedAt,
      httpStatus:o.httpStatus, networkRequestsDuringVerification:0};
    if (o.finalUrl !== ref.url || o.redirects?.length !== 0 || !ref.accepted_mime.includes(mime(o.contentType))) fail('receipt-binding');
    if (ref.kind === 'http-denied') {
      if (o.httpStatus !== ref.reviewed_http_status || o.httpStatus !== 403 || o.bytes != null
          || o.responseDigest != null || (o.byteLength ?? 0) !== 0) fail('denial-receipt');
      report.references.push({...row, finalUrl:o.finalUrl, contentType:o.contentType, status:'http-denied',
        contentVerified:false, transportBytesVerified:false, sourceDocumentDigest:null, bypassAttempted:false});
      continue;
    }
    if (o.httpStatus !== 200 || !Buffer.isBuffer(o.bytes) || o.byteLength !== o.bytes.length || o.responseDigest !== sourceDigest(o.bytes)) fail('receipt-binding');
    if (ref.kind === 'reviewed-locator-html' && !o.tableProfile) fail('fresh-table-profile-required');
    const result = profilePhilippinesReference(o.bytes, ref, o.contentType, o.tableProfile);
    report.references.push({...row, finalUrl:o.finalUrl, contentType:o.contentType, lastModified:o.lastModified ?? null,
      byteLength:o.byteLength, responseDigest:o.responseDigest, sourceDocumentDigest:o.responseDigest, ...result});
  }
  report.completedAt = new Date().toISOString();
  return report;
}

export async function inspectPhilippinesSources(fetcher = fetch) {
  const report = empty('bounded-public-source-recheck');
  for (const ref of config.references) {
    const row = {id:ref.id, sourceId:ref.source_id, requestedUrl:ref.url};
    // Denials need a deliberate new source review after the recorded retry date.
    if (ref.kind === 'http-denied') {
      report.references.push({...row, status:'not-retried-prior-http-denial', contentVerified:false, sourceDocumentDigest:null});
      continue;
    }
    row.observedAt = new Date().toISOString();
    try {
      const {metadata, bytes} = await fetchBoundedOfficialResponse(ref.url, {allowedHosts:hosts, fetcher});
      Object.assign(row, metadata);
      if (!bytes) { report.references.push({...row, status:'http-error', contentVerified:false, sourceDocumentDigest:null}); continue; }
      row.byteLength = bytes.length;
      row.responseDigest = sourceDigest(bytes);
      const result = profilePhilippinesReference(bytes, ref, metadata.contentType);
      report.references.push({...row, sourceDocumentDigest:row.responseDigest, ...result});
    } catch (error) {
      report.references.push({...row, status:'unverified-source-requires-review', failureKind:safeFailure(error), contentVerified:false, sourceDocumentDigest:null});
    }
  }
  report.completedAt = new Date().toISOString();
  return report;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const options = {};
  for (let i=2; i<process.argv.length; i+=2) {
    const key = process.argv[i], value = process.argv[i+1];
    if (!['--observations','--python','--curl','--report'].includes(key) || !value || options[key]) fail('cli-arguments');
    options[key] = value;
  }
  if (!options['--report'] || (options['--observations'] && (!options['--python'] || options['--curl']))
      || (options['--python'] && !options['--observations'])) fail('cli-arguments');
  let report;
  if (options['--observations']) {
    const observations = JSON.parse(readFileSync(resolve(options['--observations']), 'utf8')).map(o => {
      const result = {...o, ...(o.bodyPath ? {bytes:readFileSync(resolve(o.bodyPath))} : {})};
      if (o.id === 'locator') result.tableProfile = JSON.parse(execFileSync(options['--python'], ['-B','-X','utf8',
        fileURLToPath(new URL('./inspect-postal-context-ph-table.py', import.meta.url)), resolve(o.bodyPath),
        '--expected-digest', config.references.find(r => r.id === 'locator').reviewed_digest],
      {encoding:'utf8', maxBuffer:65536, timeout:10000, windowsHide:true}));
      return result;
    });
    report = inspectPhilippinesObservations(observations);
  } else report = await inspectPhilippinesSources(options['--curl'] ? createPostalCurlFetcher(options['--curl'], hosts) : fetch);
  const output = resolve(options['--report']);
  mkdirSync(dirname(output), {recursive:true});
  writeFileSync(output, JSON.stringify(report, null, 2) + '\n', {flag:'wx'});
  console.log(JSON.stringify({report:output, results:report.references.map(r => ({id:r.id, status:r.status})), countryM2Achieved:false}));
}
