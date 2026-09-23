import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { buildVeygritSitesBridge } from '../src/lib/veygritSitesBridge';
import { renderVeygritSitesTransitionButtonsModule } from '../src/lib/veygritSitesTransitionButtons';
import { buildVeygritTransitionMap } from '../src/lib/veygritTransitionMap';

const bridge = buildVeygritSitesBridge();
const transitionMap = buildVeygritTransitionMap();
const siteAppRoot = join(bridge.codexThread.localRoot, 'work', 'veygrit-app');
const buttonSourcePath = join(siteAppRoot, 'src', 'veygritTransitionButtons.js');
const mainSourcePath = join(siteAppRoot, 'src', 'main.jsx');
const stylesPath = join(siteAppRoot, 'src', 'styles.css');

assert.equal(existsSync(buttonSourcePath), true, 'Veygrit Sites transition button source must exist');
assert.equal(existsSync(mainSourcePath), true, 'Veygrit Sites main source must exist');
assert.equal(existsSync(stylesPath), true, 'Veygrit Sites stylesheet must exist');

const buttonSource = readFileSync(buttonSourcePath, 'utf8');
const mainSource = readFileSync(mainSourcePath, 'utf8');
const styles = readFileSync(stylesPath, 'utf8');
const nodesById = new Map(transitionMap.nodes.map(node => [node.id, node]));
const primaryButtons = transitionMap.edges.filter(edge => edge.kind === 'primary_button');

assert.equal(buttonSource, renderVeygritSitesTransitionButtonsModule());

for (const edge of primaryButtons) {
  const destination = nodesById.get(edge.to);
  assert.ok(destination, `missing transition destination for ${edge.id}`);
  assert.match(buttonSource, new RegExp(`id:\\s*'${edge.id.replace('integration-button-', '')}'`));
  assert.match(buttonSource, new RegExp(`label:\\s*'${edge.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`));
  assert.match(buttonSource, new RegExp(`href:\\s*'${destination.routeRef.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`));
}

assert.match(mainSource, /veygritTransitionButtons/);
assert.match(mainSource, /commerce-entry-panel/);
assert.match(mainSource, /commerce-entry-link/);
assert.match(styles, /\.commerce-entry-panel/);
assert.match(styles, /\.commerce-entry-list/);
assert.match(styles, /grid-template-columns:\s*1fr/);

assert.doesNotMatch(buttonSource, /rawAddress|recipientPhone|providerAccessToken|proofWitness|privateKey|proofSecret/i);
assert.doesNotMatch(buttonSource, /sk_live_|ghp_[A-Za-z0-9_]+|github_pat_/);

console.log(JSON.stringify({
  status: 'pass',
  verifier: 'verify-veygrit-sites-ui-smoke',
  checkedButtons: primaryButtons.length,
  sitePackage: 'veygrit-address-wallet',
  remoteMutationAllowedThisTurn: bridge.githubConnection.remoteMutationAllowedThisTurn,
}));
