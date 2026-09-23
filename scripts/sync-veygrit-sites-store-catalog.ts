import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { buildVeygritSitesBridge } from '../src/lib/veygritSitesBridge';
import { renderVeygritSitesStoreCatalogModule } from '../src/lib/veygritSitesStoreCatalog';

const bridge = buildVeygritSitesBridge();
const targetPath = join(bridge.codexThread.localRoot, 'work', 'veygrit-app', 'src', 'veygritStoreCatalog.js');
const targetLabel = 'src/veygritStoreCatalog.js';
const expected = renderVeygritSitesStoreCatalogModule();
const checkOnly = process.argv.includes('--check');

if (checkOnly) {
  const actual = existsSync(targetPath) ? readFileSync(targetPath, 'utf8') : '';
  if (actual !== expected) {
    console.error(JSON.stringify({
      status: 'blocked',
      verifier: 'sync-veygrit-sites-store-catalog',
      mode: 'check',
      checked: targetLabel,
      remediation: 'Run npm run sync:veygrit-sites-store-catalog before verifying or saving the Sites app.',
      remoteMutationAllowedThisTurn: bridge.githubConnection.remoteMutationAllowedThisTurn,
    }));
    process.exit(1);
  }

  console.log(JSON.stringify({
    status: 'pass',
    verifier: 'sync-veygrit-sites-store-catalog',
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
  verifier: 'sync-veygrit-sites-store-catalog',
  mode: 'write',
  wrote: targetLabel,
  remoteMutationAllowedThisTurn: bridge.githubConnection.remoteMutationAllowedThisTurn,
}));
