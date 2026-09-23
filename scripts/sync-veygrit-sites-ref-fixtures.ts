import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { buildVeygritSitesBridge } from '../src/lib/veygritSitesBridge';
import { renderVeygritSitesRefFixturesModule } from '../src/lib/veygritSitesRefFixtures';

const bridge = buildVeygritSitesBridge();
const fixturePath = join(bridge.codexThread.localRoot, 'work', 'veygrit-app', 'src', 'veygritRefFixtures.js');
const fixtureLabel = 'src/veygritRefFixtures.js';
const expected = renderVeygritSitesRefFixturesModule();
const checkOnly = process.argv.includes('--check');

if (checkOnly) {
  const actual = existsSync(fixturePath) ? readFileSync(fixturePath, 'utf8') : '';
  if (actual !== expected) {
    console.error(JSON.stringify({
      status: 'blocked',
      verifier: 'sync-veygrit-sites-ref-fixtures',
      mode: 'check',
      checked: fixtureLabel,
      remediation: 'Run npm run sync:veygrit-sites-ref-fixtures before verifying or saving the Sites app.',
      remoteMutationAllowedThisTurn: bridge.githubConnection.remoteMutationAllowedThisTurn,
    }));
    process.exit(1);
  }

  console.log(JSON.stringify({
    status: 'pass',
    verifier: 'sync-veygrit-sites-ref-fixtures',
    mode: 'check',
    checked: fixtureLabel,
    remoteMutationAllowedThisTurn: bridge.githubConnection.remoteMutationAllowedThisTurn,
  }));
  process.exit(0);
}

mkdirSync(dirname(fixturePath), { recursive: true });
writeFileSync(fixturePath, expected, 'utf8');

console.log(JSON.stringify({
  status: 'pass',
  verifier: 'sync-veygrit-sites-ref-fixtures',
  mode: 'write',
  wrote: fixtureLabel,
  remoteMutationAllowedThisTurn: bridge.githubConnection.remoteMutationAllowedThisTurn,
}));
