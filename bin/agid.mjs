#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const tsxCli = join(root, 'node_modules', 'tsx', 'dist', 'cli.mjs');
const entry = join(root, 'scripts', 'agid-cli.ts');

if (!existsSync(tsxCli)) {
  console.error('AGID CLI requires project dependencies. Run npm install before using bin/agid.mjs.');
  process.exit(1);
}

const result = spawnSync(process.execPath, [tsxCli, entry, ...process.argv.slice(2)], {
  cwd: root,
  stdio: 'inherit',
});

process.exit(result.status ?? 1);
