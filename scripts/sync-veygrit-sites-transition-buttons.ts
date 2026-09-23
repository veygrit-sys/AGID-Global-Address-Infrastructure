import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { buildVeygritSitesBridge } from '../src/lib/veygritSitesBridge';
import { renderVeygritSitesTransitionButtonsModule } from '../src/lib/veygritSitesTransitionButtons';

const bridge = buildVeygritSitesBridge();
const targetPath = join(bridge.codexThread.localRoot, 'work', 'veygrit-app', 'src', 'veygritTransitionButtons.js');
const targetLabel = 'src/veygritTransitionButtons.js';
const expected = renderVeygritSitesTransitionButtonsModule();
const checkOnly = process.argv.includes('--check');

if (checkOnly) {
  const actual = existsSync(targetPath) ? readFileSync(targetPath, 'utf8') : '';
  if (actual !== expected) {
    console.error(JSON.stringify({
      status: 'blocked',
      verifier: 'sync-veygrit-sites-transition-buttons',
      mode: 'check',
      checked: targetLabel,
      remediation: 'Run npm run sync:veygrit-sites-transition-buttons before verifying or saving the Sites app.',
      remoteMutationAllowedThisTurn: bridge.githubConnection.remoteMutationAllowedThisTurn,
    }));
    process.exit(1);
  }

  console.log(JSON.stringify({
    status: 'pass',
    verifier: 'sync-veygrit-sites-transition-buttons',
    mode: 'check',
    checked: targetLabel,
    remoteMutationAllowedThisTurn: bridge.githubConnection.remoteMutationAllowedThisTurn,
  }));
  process.exit(0);
}

mkdirSync(dirname(targetPath), { recursive: true });
writeFileSync(targetPath, expected, 'utf8');

console.log(JSON.stringify({
  status: 'pass',
  verifier: 'sync-veygrit-sites-transition-buttons',
  mode: 'write',
  wrote: targetLabel,
  remoteMutationAllowedThisTurn: bridge.githubConnection.remoteMutationAllowedThisTurn,
}));
