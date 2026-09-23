import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  buildVeygritSitesBridge,
  validateVeygritSitesBridge,
} from '../src/lib/veygritSitesBridge';

type JsonObject = Record<string, unknown>;

function readJsonObject(path: string): JsonObject {
  const parsed = JSON.parse(readFileSync(path, 'utf8')) as unknown;
  assert(parsed && typeof parsed === 'object' && !Array.isArray(parsed), `${path} must contain a JSON object`);
  return parsed as JsonObject;
}

const bridge = buildVeygritSitesBridge();
const bridgeValidation = validateVeygritSitesBridge(bridge);
assert.equal(bridgeValidation.ok, true, `bridge validation failed: ${bridgeValidation.errors.join(', ')}`);

const hostingJsonPath = join(bridge.codexThread.localRoot, '.openai', 'hosting.json');
const sitePackageJsonPath = join(bridge.codexThread.localRoot, 'work', 'veygrit-app', 'package.json');
const siteBuildScriptPath = join(bridge.codexThread.localRoot, 'work', 'veygrit-app', 'scripts', 'build-sites.mjs');

assert.equal(existsSync(hostingJsonPath), true, 'Sites hosting.json must exist');
assert.equal(existsSync(sitePackageJsonPath), true, 'Veygrit Sites package.json must exist');
assert.equal(existsSync(siteBuildScriptPath), true, 'Veygrit Sites build script must exist');

const hostingJson = readJsonObject(hostingJsonPath);
const sitePackageJson = readJsonObject(sitePackageJsonPath);
const scripts = sitePackageJson.scripts as JsonObject | undefined;

assert.equal(hostingJson.project_id, bridge.sitesProject.projectId, 'Sites project_id must match bridge manifest');
assert.equal(sitePackageJson.name, 'veygrit-address-wallet', 'Sites package name must remain the expected Veygrit app');
assert.equal(scripts?.build, 'node scripts/build-sites.mjs', 'Sites build command must keep using the Sites packaging script');
assert.equal(bridge.safetyBoundaries.createSiteAllowed, false, 'bridge must reuse the existing Sites project');
assert.equal(bridge.safetyBoundaries.productionDeployRequiresExplicitApproval, true, 'production deploy must require explicit approval');
assert.equal(bridge.safetyBoundaries.pushRequiresExplicitApproval, true, 'git push must require explicit approval');
assert.equal(bridge.safetyBoundaries.persistSitesBypassToken, false, 'Sites bypass token must not be persisted');
assert.equal(bridge.safetyBoundaries.persistSourceRepositoryCredential, false, 'source repository credential must not be persisted');
assert.equal(bridge.safetyBoundaries.rawAddressMaterialAllowedInBridge, false, 'raw address material must not be allowed in the bridge');
assert.ok(
  bridge.validationGates.includes('npm run verify:veygrit-sites-link'),
  'bridge validation gates must include this local link verifier',
);

console.log(JSON.stringify({
  status: 'pass',
  verifier: 'verify-veygrit-sites-link',
  projectId: bridge.sitesProject.projectId,
  sitePackage: sitePackageJson.name,
  remoteMutationAllowedThisTurn: bridge.githubConnection.remoteMutationAllowedThisTurn,
  productionDeployRequiresExplicitApproval: bridge.safetyBoundaries.productionDeployRequiresExplicitApproval,
}));
