import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import { buildVeygritSitesAppShellContract } from './veygritSitesAppShell';
import { buildVeygritSitesBridge } from './veygritSitesBridge';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test('Veygrit Sites app shell exposes AGID navigation, Home, and Store sections', () => {
  const bridge = buildVeygritSitesBridge();
  const contract = buildVeygritSitesAppShellContract();
  const appRoot = join(bridge.codexThread.localRoot, 'work', 'veygrit-app');
  const mainPath = join(appRoot, 'src', 'main.jsx');
  const stylesPath = join(appRoot, 'src', 'styles.css');

  assert.equal(existsSync(mainPath), true);
  assert.equal(existsSync(stylesPath), true);

  const mainSource = readFileSync(mainPath, 'utf8');
  const styles = readFileSync(stylesPath, 'utf8');

  for (const label of contract.mainNavLabels) {
    assert.match(mainSource, new RegExp(`>\\s*${escapeRegExp(label)}\\s*(?:<|$)`));
  }
  for (const label of contract.homeSectionLabels) {
    assert.match(mainSource, new RegExp(escapeRegExp(label)));
  }
  for (const label of contract.storeSectionLabels) {
    assert.match(mainSource, new RegExp(escapeRegExp(label)));
  }
  for (const marker of contract.requiredSourceMarkers) {
    assert.match(mainSource, new RegExp(escapeRegExp(marker)));
  }
  for (const cssClass of contract.requiredCssClasses) {
    assert.match(styles, new RegExp(escapeRegExp(cssClass)));
  }
  for (const pattern of contract.forbiddenSourcePatterns) {
    assert.doesNotMatch(mainSource, pattern);
  }
});
