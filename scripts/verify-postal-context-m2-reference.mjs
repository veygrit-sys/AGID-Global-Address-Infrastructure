import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_CONFIG = 'docs/postal-context-m2-reference.json';

function sha256(bytes) {
  return `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
}

function loadJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function positions(value) {
  if (!Array.isArray(value)) return 0;
  if (value.length >= 2 && typeof value[0] === 'number' && typeof value[1] === 'number') return 1;
  return value.reduce((total, item) => total + positions(item), 0);
}

function validPosition(value) {
  return Array.isArray(value)
    && value.length >= 2
    && Number.isFinite(value[0])
    && Number.isFinite(value[1])
    && value[0] >= -180
    && value[0] <= 180
    && value[1] >= -90
    && value[1] <= 90;
}

function samePosition(left, right) {
  return validPosition(left)
    && validPosition(right)
    && left[0] === right[0]
    && left[1] === right[1];
}

function validRing(value) {
  return Array.isArray(value)
    && value.length >= 4
    && value.every(validPosition)
    && samePosition(value[0], value.at(-1));
}

function validPolygon(value) {
  return Array.isArray(value) && value.length > 0 && value.every(validRing);
}

function validPostalGeometry(geometry) {
  if (geometry?.type === 'Polygon') return validPolygon(geometry.coordinates);
  return geometry?.type === 'MultiPolygon'
    && Array.isArray(geometry.coordinates)
    && geometry.coordinates.length > 0
    && geometry.coordinates.every(validPolygon);
}

function unique(values) {
  return new Set(values).size === values.length;
}

function pinnedArtifactFromUrl(url) {
  const match = String(url).match(/\/blob\/([0-9a-f]{40})\/(.+)$/);
  return match ? { commit: match[1], path: decodeURIComponent(match[2]) } : null;
}

export function verifyPostalContextM2Reference({
  rootDir = process.cwd(),
  configPath = DEFAULT_CONFIG,
} = {}) {
  const checks = [];
  const errors = [];
  const check = (name, condition, detail) => {
    checks.push({ name, passed: Boolean(condition), detail });
    if (!condition) errors.push(`${name}: ${detail}`);
  };

  const configFile = resolve(rootDir, configPath);
  const config = loadJson(configFile);
  const packRoot = resolve(rootDir, config.packRoot);
  const descriptorPath = resolve(packRoot, config.descriptor);
  const repositoryManifestPath = resolve(packRoot, config.repositoryManifest);
  const descriptorBytes = readFileSync(descriptorPath);
  const descriptor = JSON.parse(descriptorBytes.toString('utf8'));
  const repositoryManifest = loadJson(repositoryManifestPath);
  const ledger = loadJson(resolve(rootDir, config.ledger));
  const country = ledger.countries.find(item => item.countryCode === config.countryCode);
  const graphArtifact = descriptor.artifacts.find(item => item.role === 'graph');
  const geometryArtifact = descriptor.artifacts.find(item => item.role === 'geometry');
  const graphPath = resolve(dirname(descriptorPath), graphArtifact?.path ?? '');
  const geometryPath = resolve(dirname(descriptorPath), geometryArtifact?.path ?? '');
  const graphBytes = readFileSync(graphPath);
  const geometryBytes = readFileSync(geometryPath);
  const graph = JSON.parse(graphBytes.toString('utf8'));
  const geometry = JSON.parse(geometryBytes.toString('utf8'));

  check('reference-schema', config.schemaVersion === 'postal-context-m2-reference/v1', config.schemaVersion);
  check('ledger-entry', Boolean(country), config.countryCode);
  check('ledger-status', country?.status === 'm2_verified', country?.status);
  check('country-definition', country?.m2Definition?.id === config.m2DefinitionId, country?.m2Definition?.id);
  check('criterion-satisfied', country?.evidence?.criterionSatisfied === true, country?.evidence?.criterionSatisfied);
  check('real-evidence', country?.evidence?.synthetic === false, country?.evidence?.synthetic);
  check('no-blocker', country?.blocker === null, country?.blocker?.kind);
  check('descriptor-country', descriptor.countryCode === config.countryCode, descriptor.countryCode);
  check('descriptor-real', descriptor.synthetic === false, descriptor.synthetic);
  check('descriptor-promotable', descriptor.promotionEligible === true, descriptor.promotionEligible);
  check('no-address-points', descriptor.containsResidentialAddressPoints === false, descriptor.containsResidentialAddressPoints);
  check('manifest-country', repositoryManifest.repository.country_code === config.countryCode, repositoryManifest.repository.country_code);
  check('manifest-production-geometry', repositoryManifest.release_scope.contains_production_geometry === true, repositoryManifest.release_scope.contains_production_geometry);
  check('manifest-no-raw-source', repositoryManifest.release_scope.contains_raw_source_data === false, repositoryManifest.release_scope.contains_raw_source_data);
  check('release-id-chain', descriptor.releaseId === graph.release.releaseId && descriptor.releaseId === geometry.releaseId, descriptor.releaseId);
  check('manifest-digest-chain', descriptor.graphManifestDigest === graph.release.manifestDigest, descriptor.graphManifestDigest);

  for (const [role, artifact, bytes, data] of [
    ['graph', graphArtifact, graphBytes, graph],
    ['geometry', geometryArtifact, geometryBytes, geometry],
  ]) {
    check(`${role}-artifact-present`, Boolean(artifact), role);
    check(`${role}-bytes`, artifact?.byteLength === bytes.byteLength, `${artifact?.byteLength} / ${bytes.byteLength}`);
    check(`${role}-digest`, artifact?.digest === sha256(bytes), `${artifact?.digest} / ${sha256(bytes)}`);
    if (role === 'graph') {
      check('graph-node-count', artifact?.recordCounts?.nodes === data.nodes.length, `${artifact?.recordCounts?.nodes} / ${data.nodes.length}`);
      check('graph-assertion-count', artifact?.recordCounts?.assertions === data.assertions.length, `${artifact?.recordCounts?.assertions} / ${data.assertions.length}`);
    } else {
      const positionCount = data.features.reduce((total, feature) => total + positions(feature.geometry.coordinates), 0);
      check('geometry-feature-count', artifact?.recordCounts?.features === data.features.length, `${artifact?.recordCounts?.features} / ${data.features.length}`);
      check('geometry-position-count', artifact?.recordCounts?.positions === positionCount, `${artifact?.recordCounts?.positions} / ${positionCount}`);
    }
  }

  const nodeIds = graph.nodes.map(node => node.id);
  const assertionIds = graph.assertions.map(assertion => assertion.id);
  const geometryIds = geometry.features.map(feature => feature.id);
  const nodeIdSet = new Set(nodeIds);
  check('unique-node-ids', unique(nodeIds), nodeIds.length);
  check('unique-assertion-ids', unique(assertionIds), assertionIds.length);
  check('unique-geometry-ids', unique(geometryIds), geometryIds.length);
  check('allowed-node-kinds', graph.nodes.every(node => config.allowedNodeKinds.includes(node.kind)), config.allowedNodeKinds.join(','));
  check('assertion-node-links', graph.assertions.every(assertion => nodeIdSet.has(assertion.fromNodeId) && nodeIdSet.has(assertion.toNodeId)), graph.assertions.length);
  check('geometry-node-links', geometry.features.every(feature => nodeIdSet.has(feature.nodeId)), geometry.features.length);
  check('postal-area-only', geometry.features.every(feature => feature.role === 'postal_area'), geometry.features.length);
  check('polygonal-only', geometry.features.every(feature => ['Polygon', 'MultiPolygon'].includes(feature.geometry?.type)), geometry.features.length);
  check('renderable-geometries', geometry.features.every(feature => validPostalGeometry(feature.geometry)), geometry.features.length);
  check('source-metadata', geometry.features.every(feature =>
    feature.source?.sourceId
    && feature.source?.sourceVersion
    && feature.source?.sourceDate
    && feature.source?.licenseId
    && /^sha256:[a-f0-9]{64}$/.test(feature.source?.digest)
    && feature.source?.assignmentAuthority
    && feature.source?.geometryAuthority
  ), geometry.features.length);
  check('quality-metadata', geometry.features.every(feature =>
    ['authoritative', 'verified', 'derived'].includes(feature.quality?.status)
    && Number.isFinite(feature.quality?.confidence)
    && feature.quality.confidence >= 0
    && feature.quality.confidence <= 1
    && feature.quality?.validatedAt
  ), geometry.features.length);
  check('no-synthetic-source', geometry.features.every(feature => feature.source?.sourceType !== 'synthetic'), geometry.features.length);

  const nodeById = new Map(graph.nodes.map(node => [node.id, node]));
  const geometryById = new Map(geometry.features.map(feature => [feature.id, feature]));
  const assertionById = new Map(graph.assertions.map(assertion => [assertion.id, assertion]));
  const sampleResults = [];
  for (const sample of config.samplePostalCodes) {
    const node = nodeById.get(sample.postalContextId);
    const feature = geometryById.get(sample.geometryFeatureId);
    const assertion = assertionById.get(sample.assertionId);
    const context = nodeById.get(sample.contextId);
    check(`sample-${sample.postalCode}-node`, node?.postalCode === sample.postalCode && node?.kind === 'postal_feature', node?.id);
    check(`sample-${sample.postalCode}-geometry`, feature?.nodeId === sample.postalContextId && validPostalGeometry(feature?.geometry), feature?.id);
    check(`sample-${sample.postalCode}-context`, context?.id === sample.contextId, context?.id);
    check(`sample-${sample.postalCode}-assertion`, assertion?.fromNodeId === sample.postalContextId && assertion?.toNodeId === sample.contextId, assertion?.id);
    sampleResults.push({
      postalCode: sample.postalCode,
      postalContextId: node?.id,
      geometryFeatureId: feature?.id,
      geometryType: feature?.geometry?.type,
      contextId: context?.id,
      assertionId: assertion?.id,
      sourceId: feature?.source?.sourceId,
      sourceVersion: feature?.source?.sourceVersion,
      quality: feature?.quality,
    });
  }

  const descriptorDigest = sha256(descriptorBytes);
  check('ledger-descriptor-digest', country?.evidence?.runtime?.descriptorDigest === descriptorDigest, `${country?.evidence?.runtime?.descriptorDigest} / ${descriptorDigest}`);
  for (const artifact of country?.evidence?.artifacts ?? []) {
    const pinned = pinnedArtifactFromUrl(artifact.url);
    const localPath = pinned?.path ?? null;
    const absolutePath = localPath ? resolve(rootDir, localPath) : '';
    const present = Boolean(localPath && existsSync(absolutePath));
    check(`evidence-file-${localPath ?? artifact.url}`, present, localPath ?? artifact.url);
    if (present) {
      const localBytes = readFileSync(absolutePath);
      let bytes = localBytes;
      let source = 'working-tree';
      if ((artifact.bytes !== statSync(absolutePath).size || artifact.digest !== sha256(localBytes)) && pinned) {
        try {
          bytes = execFileSync('git', ['show', `${pinned.commit}:${pinned.path}`], {
            cwd: rootDir,
            encoding: 'buffer',
            maxBuffer: 128 * 1024 * 1024,
          });
          source = `git:${pinned.commit}`;
        } catch {
          source = 'missing-pinned-git-blob';
        }
      }
      check(`evidence-bytes-${localPath}`, artifact.bytes === bytes.byteLength, `${artifact.bytes} / ${bytes.byteLength} (${source})`);
      check(`evidence-digest-${localPath}`, artifact.digest === sha256(bytes), `${artifact.digest} / ${sha256(bytes)} (${source})`);
    }
  }

  const browserEvidence = config.browserEvidence;
  const browserReportPath = resolve(rootDir, browserEvidence?.report?.path ?? '');
  const browserScreenshotPath = resolve(rootDir, browserEvidence?.screenshot?.path ?? '');
  const browserReportPresent = Boolean(browserEvidence?.report?.path && existsSync(browserReportPath));
  const browserScreenshotPresent = Boolean(browserEvidence?.screenshot?.path && existsSync(browserScreenshotPath));
  const pinnedBrowserEvidenceBase = 'https://github.com/veygrit-sys/AGID-Global-Address-Infrastructure/blob/4101d6688c579ad71f4301a2dddc363efe06143d/';
  check('browser-report-present', browserReportPresent, browserEvidence?.report?.path);
  check('browser-screenshot-present', browserScreenshotPresent, browserEvidence?.screenshot?.path);
  check('browser-report-url-pinned', browserEvidence?.report?.url === `${pinnedBrowserEvidenceBase}${browserEvidence?.report?.path}`, browserEvidence?.report?.url);
  check('browser-screenshot-url-pinned', browserEvidence?.screenshot?.url === `${pinnedBrowserEvidenceBase}${browserEvidence?.screenshot?.path}`, browserEvidence?.screenshot?.url);
  check('browser-manual-visual-honesty', browserEvidence?.manualVisualInspection === false, browserEvidence?.manualVisualInspection);
  let browserReport = null;
  if (browserReportPresent) {
    const bytes = readFileSync(browserReportPath);
    browserReport = JSON.parse(bytes.toString('utf8'));
    check('browser-report-bytes', browserEvidence.report.bytes === bytes.byteLength, `${browserEvidence.report.bytes} / ${bytes.byteLength}`);
    check('browser-report-digest', browserEvidence.report.sha256 === sha256(bytes).slice(7), `${browserEvidence.report.sha256} / ${sha256(bytes)}`);
    check('browser-report-verdict', browserReport.verdict === 'pass', browserReport.verdict);
    check('browser-report-country', browserReport.countryCode === config.countryCode, browserReport.countryCode);
    check('browser-report-real-id-chain',
      browserReport.observed?.postalContextId === 'postal-mx-06000'
        && browserReport.observed?.geometryFeatureId === 'mx-derived-06000'
        && browserReport.observed?.assertionId === 'sepomex-mx-2025-06000-part-of-mx'
        && browserReport.observed?.linkedContextId === 'country-mx',
      browserReport.observed?.postalContextId,
    );
    check('browser-report-clear-and-re-search',
      browserReport.observed?.clearVerified === true
        && browserReport.observed?.reSearch01000Verified === true
        && browserReport.observed?.noMatch00000Verified === true,
      JSON.stringify({
        clear: browserReport.observed?.clearVerified,
        reSearch: browserReport.observed?.reSearch01000Verified,
        noMatch: browserReport.observed?.noMatch00000Verified,
      }),
    );
    check('browser-report-render-delta',
      browserReport.observed?.renderStats?.blueDominantPixels
        > browserReport.observed?.clearedRenderStats?.blueDominantPixels + 1_000
        && browserReport.observed?.reSearchRenderStats?.blueDominantPixels
          > browserReport.observed?.clearedRenderStats?.blueDominantPixels + 1_000,
      JSON.stringify({
        selected: browserReport.observed?.renderStats?.blueDominantPixels,
        cleared: browserReport.observed?.clearedRenderStats?.blueDominantPixels,
        reSearch: browserReport.observed?.reSearchRenderStats?.blueDominantPixels,
      }),
    );
    check('browser-report-postal-api-clean',
      Array.isArray(browserReport.observed?.postalContextFailures)
        && browserReport.observed.postalContextFailures.length === 0,
      browserReport.observed?.postalContextFailures?.length,
    );
  }
  if (browserScreenshotPresent) {
    const bytes = readFileSync(browserScreenshotPath);
    check('browser-screenshot-bytes', browserEvidence.screenshot.bytes === bytes.byteLength, `${browserEvidence.screenshot.bytes} / ${bytes.byteLength}`);
    check('browser-screenshot-digest', browserEvidence.screenshot.sha256 === sha256(bytes).slice(7), `${browserEvidence.screenshot.sha256} / ${sha256(bytes)}`);
  }

  const appSource = readFileSync(resolve(rootDir, 'src/App.tsx'), 'utf8');
  for (const label of config.requiredUiLabels) {
    check(`ui-label-${label}`, appSource.includes(label), label);
  }
  const sourceEvidence = country?.evidence?.sources?.[0];
  check('official-source-rights', sourceEvidence?.rightsReviewed === true, sourceEvidence?.rightsReviewed);
  check('official-source-current-version', sourceEvidence?.version?.includes(config.officialSourceRevalidation.observedDatasetUpdatedAt), sourceEvidence?.version);
  check('official-source-resource-count', sourceEvidence?.version?.includes(`${config.officialSourceRevalidation.resourceCount} state SHP resources`), sourceEvidence?.version);

  return {
    ok: errors.length === 0,
    schemaVersion: config.schemaVersion,
    countryCode: config.countryCode,
    m2DefinitionId: config.m2DefinitionId,
    descriptorDigest,
    releaseId: descriptor.releaseId,
    counts: {
      nodes: graph.nodes.length,
      assertions: graph.assertions.length,
      features: geometry.features.length,
      positions: geometryArtifact.recordCounts.positions,
    },
    sourceRevalidation: config.officialSourceRevalidation,
    browserEvidence: browserReport ? {
      verdict: browserReport.verdict,
      manualVisualInspection: browserEvidence.manualVisualInspection,
      selectedBluePixels: browserReport.observed.renderStats.blueDominantPixels,
      clearedBluePixels: browserReport.observed.clearedRenderStats.blueDominantPixels,
      reSearchBluePixels: browserReport.observed.reSearchRenderStats.blueDominantPixels,
    } : null,
    samples: sampleResults,
    checks,
    errors,
  };
}

const isCli = process.argv[1]
  && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (isCli) {
  const configFlag = process.argv.indexOf('--config');
  const result = verifyPostalContextM2Reference({
    configPath: configFlag >= 0 ? process.argv[configFlag + 1] : DEFAULT_CONFIG,
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (!result.ok) process.exitCode = 1;
}
