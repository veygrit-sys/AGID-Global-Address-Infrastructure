import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const forbiddenScriptImportPatterns = [
  {
    label: 'import from scripts',
    pattern: /from\s+['"](?:\.\.\/)+scripts\//,
  },
  {
    label: 'dynamic import from scripts',
    pattern: /import\s*\(\s*['"](?:\.\.\/)+scripts\//,
  },
  {
    label: 'require scripts',
    pattern: /require\s*\(\s*['"](?:\.\.\/)+scripts\//,
  },
];

export function assertModulesDoNotImportScripts(modulePaths: string[]): void {
  for (const path of modulePaths) {
    const source = readFileSync(path, 'utf8');

    for (const { label, pattern } of forbiddenScriptImportPatterns) {
      assert.doesNotMatch(source, pattern, `${path} must not ${label}`);
    }
  }
}
