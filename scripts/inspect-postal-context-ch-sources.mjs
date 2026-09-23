import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const config = JSON.parse(readFileSync(join(ROOT, 'data/postal_country_packs/ch/postal-context/m2-source-review.json'), 'utf8'));

function fail(message) {
  throw new Error(`ch-m2-${message}`);
}

export function digest(bytes) {
  return `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
}

export function validateSwitzerlandM2Report(report) {
  if (report.countryCode !== 'CH' || report.criterionId !== config.criterion.id) fail('report-identity');
  if (report.source.itemDatetime !== config.sourceItemDatetime) fail('source-item-datetime');
  if (!report.rights.redistribution || !report.rights.derivatives || !report.rights.commercialUse || !report.rights.apiPublication) fail('rights-gate');
  if (report.sourceProfile.dbfPostalAreaFeatures !== 4073
    || report.sourceProfile.switzerlandNpa6Features !== 4060
    || report.sourceProfile.liechtensteinNpa6FeaturesExcluded !== 13
    || report.sourceProfile.switzerlandNpa4Features !== 3177) fail('source-counts');
  if (report.transformation.validationRows !== 5716
    || report.transformation.maximumDifferenceMeters > 0.002
    || report.transformation.displaySimplificationToleranceMeters !== 5
    || report.transformation.publishedPositions !== 679832
    || report.transformation.provenanceClass !== 'derived') fail('transformation-profile');
  if (report.artifacts.geometry.features !== 3177
    || report.artifacts.geometry.positions !== 679832
    || report.artifacts.geometry.bytes !== 16624278) fail('geometry-profile');
  if (!report.runtime.realPackLoaded
    || report.runtime.postcode1000Status !== 'unique'
    || report.runtime.postcode1000Geometry !== 'MultiPolygon'
    || report.runtime.liechtenstein9490Status !== 'no_match'
    || !report.runtime.realAgidRuntimeVerified && report.realAgidRuntimeVerified !== true) fail('runtime-profile');
  if (!report.runtime.apiGeometryResponseVerified
    || !report.runtime.appFeatureConversionVerified
    || !report.runtime.mapFitVerified
    || !report.runtime.clearAndResearchVerified
    || !report.runtime.uiDisplaysPostalCodeGeometryProvenanceSourceDateConfidence) fail('app-profile');
  if (report.rawSourceBodiesInGit !== 0
    || report.authenticatedRequests !== 0
    || report.paidOperations !== 0
    || report.contractAcceptances !== 0
    || report.newAccountsRepositoriesOrDestinations !== 0) fail('operation-boundary');
  if (report.publishedImmutableDataArtifacts !== 3
    || !report.realAgidRuntimeVerified
    || !report.realAgidAppAreaVisualizationVerified
    || !report.countryM2Achieved) fail('m2-result');
  return { countryCode: 'CH', features: 3177, positions: 679832, countryM2Achieved: true };
}

export function validateCommittedArtifacts(report) {
  for (const role of ['graph', 'geometry', 'descriptor']) {
    const receipt = report.artifacts[role];
    const path = join(ROOT, receipt.path);
    const bytes = readFileSync(path);
    if (bytes.length !== receipt.bytes || digest(bytes) !== receipt.digest) fail(`artifact-${role}`);
  }
  const descriptor = JSON.parse(readFileSync(join(ROOT, report.artifacts.descriptor.path), 'utf8'));
  if (descriptor.countryCode !== 'CH'
    || descriptor.releaseId !== 'ch-swisstopo-plzo-2026-08-11'
    || descriptor.maturity !== 'M2_experimental'
    || descriptor.synthetic
    || !descriptor.promotionEligible) fail('descriptor-policy');
  return descriptor;
}

export function auditSourceDirectory(sourceDirectory) {
  const receipts = config.references.map(reference => {
    const path = join(sourceDirectory, reference.auditFile);
    const bytes = readFileSync(path);
    if (statSync(path).size !== reference.bytes || digest(bytes) !== reference.digest) fail(`source-${reference.id}`);
    return { id: reference.id, bytes: bytes.length, digest: reference.digest };
  });
  const stac = JSON.parse(readFileSync(join(sourceDirectory, 'stac-items.json'), 'utf8'));
  if (stac.features?.length !== 1
    || stac.features[0]?.id !== 'ortschaftenverzeichnis_plz'
    || stac.features[0]?.properties?.datetime !== config.sourceItemDatetime) fail('stac-item');
  const terms = readFileSync(join(sourceDirectory, 'ogd-terms.html'), 'utf8');
  if (!/commercial/i.test(terms) || !/swisstopo/i.test(terms) || !/source/i.test(terms)) fail('ogd-terms-content');
  return receipts;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = JSON.parse(readFileSync(join(ROOT, 'reports/postal-context-m2/ch-source-review-2026-08-29.json'), 'utf8'));
  const sourceDirectory = process.argv[2];
  const result = {
    report: validateSwitzerlandM2Report(report),
    descriptor: validateCommittedArtifacts(report).releaseId,
    sources: sourceDirectory ? auditSourceDirectory(resolve(sourceDirectory)) : 'not-requested',
  };
  console.log(JSON.stringify(result, null, 2));
}
