import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, relative, sep } from 'node:path';

import {
  buildVeygritRepositoryHandoff,
  buildVeygritRepositoryHandoffMarkdown,
  validateVeygritRepositoryHandoff,
} from '../src/lib/veygritRepositoryHandoff';

const root = process.cwd();
const checkOnly = process.argv.includes('--check');
const handoff = buildVeygritRepositoryHandoff();
const validation = validateVeygritRepositoryHandoff(handoff);
const outputPath = handoff.handoffExport.generatedFile;
const content = buildVeygritRepositoryHandoffMarkdown(handoff);

function displayPath(path: string) {
  return path.startsWith(root) ? relative(root, path).split(sep).join('/') : path;
}

if (!validation.ok) {
  console.error(JSON.stringify({
    status: 'blocked',
    verifier: 'sync-veygrit-github-handoff',
    findings: validation.errors,
  }));
  process.exit(1);
}

if (!existsSync(dirname(outputPath))) {
  console.error(JSON.stringify({
    status: 'blocked',
    verifier: 'sync-veygrit-github-handoff',
    ruleId: 'missing-veygrit-app-root',
    outputPath: displayPath(outputPath),
    remediation: 'Restore or relink the local Veygrit Sites app root before exporting the handoff.',
  }));
  process.exit(1);
}

const current = existsSync(outputPath) ? readFileSync(outputPath, 'utf8') : '';

if (checkOnly) {
  if (current !== content) {
    console.error(JSON.stringify({
      status: 'blocked',
      verifier: 'sync-veygrit-github-handoff',
      mode: 'check',
      ruleId: 'generated-handoff-out-of-date',
      outputPath: displayPath(outputPath),
      remediation: 'Run npm run sync:veygrit-github-handoff from AGID.',
    }));
    process.exit(1);
  }

  console.log(JSON.stringify({
    status: 'pass',
    verifier: 'sync-veygrit-github-handoff',
    mode: 'check',
    outputPath: displayPath(outputPath),
    remoteMutationAllowedThisTurn: false,
  }));
  process.exit(0);
}

if (current !== content) {
  writeFileSync(outputPath, content, 'utf8');
}

console.log(JSON.stringify({
  status: 'pass',
  verifier: 'sync-veygrit-github-handoff',
  mode: 'write',
  outputPath: displayPath(outputPath),
  changed: current !== content,
  remoteMutationAllowedThisTurn: false,
}));
