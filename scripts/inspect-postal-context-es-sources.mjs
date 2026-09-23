import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(readFileSync(join(root, 'data/postal_country_packs/es/postal-context/m2-source-review.json'), 'utf8'));

function fail(code) { throw new Error(`es-source-audit:${code}`); }
export function sourceDigest(bytes) { return `sha256:${createHash('sha256').update(bytes).digest('hex')}`; }

function asJson(input) {
  return typeof input === 'string' || Buffer.isBuffer(input) ? JSON.parse(input.toString()) : input;
}

function inspectRings(geometry) {
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.type === 'MultiPolygon' ? geometry.coordinates : fail('featureinfo-geometry-type');
  let rings = 0;
  let positions = 0;
  for (const polygon of polygons) for (const ring of polygon) {
    rings += 1;
    if (ring.length < 4 || ring[0]?.[0] !== ring.at(-1)?.[0] || ring[0]?.[1] !== ring.at(-1)?.[1]) fail('featureinfo-open-ring');
    for (const position of ring) {
      positions += 1;
      const [x, y] = position;
      if (!Number.isFinite(x) || !Number.isFinite(y) || x < -180 || x > 180 || y < -90 || y > 90) fail('featureinfo-position');
    }
  }
  return { rings, positions };
}

export function inspectSpainSample(candidateInput, findInput, featureInfoInput) {
  const candidates = asJson(candidateInput);
  const find = asJson(findInput);
  const featureInfo = asJson(featureInfoInput);
  if (!Array.isArray(candidates) || candidates.length !== 1) fail('candidate-count');
  const candidate = candidates[0];
  if (candidate.postalCode !== '28013' || candidate.type !== 'Codpost' || candidate.geom !== null) fail('candidate-contract');
  if (find?.type !== 'FeatureCollection' || find.features?.length !== 1 || find.features[0]?.properties?.postalCode !== '28013' || find.features[0]?.geometry?.type !== 'Point') fail('find-point-contract');
  if (featureInfo?.type !== 'FeatureCollection' || featureInfo.features?.length !== 1 || featureInfo.numberReturned !== 1 || featureInfo.totalFeatures !== 'unknown') fail('featureinfo-contract');
  const feature = featureInfo.features[0];
  if (feature.properties?.cod_postal !== '28013' || !['Polygon', 'MultiPolygon'].includes(feature.geometry?.type)) fail('featureinfo-postcode');
  const structure = inspectRings(feature.geometry);
  return {
    postcode: '28013',
    candidateGeometry: null,
    findGeometryType: 'Point',
    featureInfoGeometryType: feature.geometry.type,
    featureInfoFeatureId: feature.id,
    ringCount: structure.rings,
    coordinateCount: structure.positions,
    sourceCreatedAt: feature.properties.alta_db,
    sourceEffectiveDate: String(feature.properties.fecha_alta),
    responseTimestamp: featureInfo.timeStamp,
  };
}

export function validateSpainAuditReport(report) {
  if (report.countryCode !== 'ES' || report.criterionId !== config.m2_criterion.id) fail('report-identity');
  if (report.references.length !== config.references.length || new Set(report.references.map(item => item.id)).size !== report.references.length) fail('report-reference-set');
  for (const reference of config.references) {
    const receipt = report.references.find(item => item.id === reference.id);
    if (!receipt || receipt.requestedUrl !== reference.url || receipt.httpStatus !== reference.http_status || receipt.byteLength !== reference.reviewed_bytes || receipt.responseDigest !== reference.expected_digest || receipt.contentVerified !== true) fail(`report-receipt-${reference.id}`);
  }
  if (report.officialMetadata.wmsUpdateSequence !== '3203' || report.officialMetadata.wmsLayer !== 'codigo-postal' || report.officialMetadata.embeddedPostcodePolygonReleaseEdition !== null || report.officialMetadata.nationalPolygonFeatureCountDeclared !== null) fail('report-metadata');
  if (report.sample28013.findGeometryType !== 'Point' || report.sample28013.featureInfoGeometryType !== 'Polygon' || report.sample28013.featureInfoCoordinateCount !== 16 || report.sample28013.productionEligibleRecords !== 0) fail('report-sample');
  if (!report.rights.surfaceGeometryExplicitlyViewOnly || !report.rights.cnigStatesCorreosIsOnlyDistributor || report.rights.publicFullPolygonRedistributionRightEstablished || !report.rights.correosProductRequiresPaymentContractAndLicense) fail('report-rights');
  if (report.quality.currentAssignmentDenominatorComplete || report.quality.nationalGeometryTopologyValidated || report.quality.inventedRepairOrProxyRecords !== 0) fail('report-quality');
  if (report.reproducibility.publishedImmutableDataArtifacts !== 0 || report.reproducibility.rawSourceBodiesInGit !== 0 || report.reproducibility.reproducibleTransformImplemented) fail('report-reproducibility');
  if (report.applicationEvidence.realEsArtifactLoaderVerified || report.applicationEvidence.realEsPostalApiVerified || report.applicationEvidence.realEsAppAreaVisualizationVerified || report.countryM2Achieved) fail('report-m2-overclaim');
  if (report.authenticatedRequests !== 0 || report.paidOperations !== 0 || report.contractAcceptances !== 0 || report.operatorDatabaseDownloads !== 0 || report.newAccountsRepositoriesOrDestinations !== 0) fail('report-operation-overclaim');
  if (!report.identityAndPostalPolicy.eaLedgerIdentityRemainsSeparate || report.identityAndPostalPolicy.facilityRoutePoBoxOrganizationReceivesInventedSurface) fail('report-identity-policy');
  return { references: report.references.length, samplePostcode: '28013', sampleGeometryType: 'Polygon', productionEligibleRecords: 0, countryM2Achieved: false };
}

export function auditSpainSourceDirectory(sourceDirectory, report) {
  for (const reference of config.references) {
    const bytes = readFileSync(join(sourceDirectory, reference.audit_file));
    if (bytes.length !== reference.reviewed_bytes) fail(`source-length-${reference.id}`);
    if (sourceDigest(bytes) !== reference.expected_digest) fail(`source-digest-${reference.id}`);
  }
  const sample = inspectSpainSample(
    readFileSync(join(sourceDirectory, 'cartociudad-candidates-28013.json')),
    readFileSync(join(sourceDirectory, 'cartociudad-find-28013.geojson')),
    readFileSync(join(sourceDirectory, 'cartociudad-featureinfo-28013.json')),
  );
  if (sample.featureInfoGeometryType !== 'Polygon' || sample.ringCount !== 1 || sample.coordinateCount !== 16) fail('source-sample');
  const capabilities = readFileSync(join(sourceDirectory, 'cartociudad-wms-capabilities.xml'), 'utf8');
  if (!capabilities.includes('updateSequence="3203"') || !capabilities.includes('<Name>codigo-postal</Name>') || !capabilities.includes('<AccessConstraints>CC BY 4.0 scne.es</AccessConstraints>')) fail('source-capabilities');
  const metadata = readFileSync(join(sourceDirectory, 'cartociudad-metadata.xml'), 'utf8');
  if (!metadata.includes('Postal codes are not available for download, they can only be viewed.') || !metadata.includes('2026-03-01')) fail('source-view-only');
  validateSpainAuditReport(report);
  return { ...sample, references: config.references.length, productionEligibleRecords: 0, countryM2Achieved: false };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const sourceDirectory = process.argv[2];
  const reportPath = process.argv[3] ?? join(root, 'reports/postal-context-m2/es-source-review-2026-08-30.json');
  if (!sourceDirectory) fail('usage');
  console.log(JSON.stringify(auditSpainSourceDirectory(sourceDirectory, JSON.parse(readFileSync(reportPath, 'utf8')))));
}
