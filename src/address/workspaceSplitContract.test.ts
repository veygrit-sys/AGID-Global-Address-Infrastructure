import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { ADDRESSQL_WORKSPACE_BRIDGE_VERSION } from '@agid/addressql';
import { AGID_CONTRACTS_WORKSPACE_BRIDGE_VERSION } from '@agid/contracts';
import { AGID_CORE_WORKSPACE_BRIDGE_VERSION } from '@agid/core';
import { AGID_COUNTRY_DATA_WORKSPACE_BRIDGE_VERSION } from '@agid/country-data';
import { AGID_STUDIO_WORKSPACE_BRIDGE_VERSION } from '@agid/studio';
import { AGID_TOPOGRAPHY_WORKSPACE_BRIDGE_VERSION } from '@agid/topography';

type WorkspaceManifest = {
  name: string;
  version: string;
  private: boolean;
  exports?: Record<string, string>;
  types?: string;
  dependencies?: Record<string, string>;
  agidWorkspace?: {
    role?: string;
    migrationPhase?: string;
    legacyEntrypoints?: string[];
  };
};

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const expectedWorkspaces = [
  {
    path: 'packages/contracts',
    name: '@agid/contracts',
    rank: 0,
    dependencies: [],
    bridgeVersion: 'AGID_CONTRACTS_WORKSPACE_BRIDGE_VERSION',
  },
  {
    path: 'packages/core',
    name: '@agid/core',
    rank: 1,
    dependencies: ['@agid/contracts'],
    bridgeVersion: 'AGID_CORE_WORKSPACE_BRIDGE_VERSION',
  },
  {
    path: 'packages/country-data',
    name: '@agid/country-data',
    rank: 2,
    dependencies: ['@agid/contracts', '@agid/core'],
    bridgeVersion: 'AGID_COUNTRY_DATA_WORKSPACE_BRIDGE_VERSION',
  },
  {
    path: 'packages/addressql',
    name: '@agid/addressql',
    rank: 3,
    dependencies: ['@agid/contracts', '@agid/core', '@agid/country-data'],
    bridgeVersion: 'ADDRESSQL_WORKSPACE_BRIDGE_VERSION',
  },
  {
    path: 'packages/topography',
    name: '@agid/topography',
    rank: 3,
    dependencies: ['@agid/contracts', '@agid/core'],
    bridgeVersion: 'AGID_TOPOGRAPHY_WORKSPACE_BRIDGE_VERSION',
  },
  {
    path: 'apps/studio',
    name: '@agid/studio',
    rank: 4,
    dependencies: [
      '@agid/addressql',
      '@agid/core',
      '@agid/country-data',
      '@agid/topography',
    ],
    bridgeVersion: 'AGID_STUDIO_WORKSPACE_BRIDGE_VERSION',
  },
] as const;

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

test('root registers exactly the six bounded AGID workspaces', () => {
  const rootManifest = readJson<{ workspaces?: string[] }>(
    resolve(root, 'package.json'),
  );

  assert.deepEqual(
    rootManifest.workspaces,
    expectedWorkspaces.map(workspace => workspace.path),
  );
});

test('workspace manifests preserve the directed compatibility graph', () => {
  const rankByName = new Map(
    expectedWorkspaces.map(workspace => [workspace.name, workspace.rank]),
  );

  for (const expected of expectedWorkspaces) {
    const workspaceRoot = resolve(root, expected.path);
    const manifest = readJson<WorkspaceManifest>(
      resolve(workspaceRoot, 'package.json'),
    );
    const internalDependencies = Object.keys(manifest.dependencies ?? {})
      .filter(name => name.startsWith('@agid/'))
      .sort();

    assert.equal(manifest.name, expected.name);
    assert.equal(manifest.version, '0.1.0');
    assert.equal(manifest.private, true);
    assert.equal(manifest.exports?.['.'], './src/index.ts');
    assert.equal(manifest.types, './src/index.ts');
    assert.equal(manifest.agidWorkspace?.migrationPhase, 'compatibility-bridge');
    assert.ok(manifest.agidWorkspace?.role?.trim());
    assert.deepEqual(internalDependencies, [...expected.dependencies].sort());

    for (const dependency of internalDependencies) {
      const dependencyRank = rankByName.get(dependency);
      assert.notEqual(
        dependencyRank,
        undefined,
        `${manifest.name} references an unregistered AGID workspace`,
      );
      assert.ok(
        dependencyRank! < expected.rank,
        `${manifest.name} must not depend sideways or back toward ${dependency}`,
      );
    }
  }
});

test('compatibility bridges and every declared legacy entrypoint remain present', () => {
  for (const expected of expectedWorkspaces) {
    const workspaceRoot = resolve(root, expected.path);
    const indexPath = resolve(workspaceRoot, 'src/index.ts');
    const manifest = readJson<WorkspaceManifest>(
      resolve(workspaceRoot, 'package.json'),
    );
    const indexSource = readFileSync(indexPath, 'utf8');

    assert.ok(existsSync(resolve(workspaceRoot, 'README.md')));
    assert.match(indexSource, new RegExp(`export const ${expected.bridgeVersion}`));

    const legacyEntrypoints = manifest.agidWorkspace?.legacyEntrypoints ?? [];
    assert.ok(legacyEntrypoints.length > 0);
    for (const legacyEntrypoint of legacyEntrypoints) {
      assert.equal(
        existsSync(resolve(root, legacyEntrypoint)),
        true,
        `${manifest.name} legacy entrypoint is missing: ${legacyEntrypoint}`,
      );
    }
  }
});

test('only Studio may own third-party runtime dependencies during bridge migration', () => {
  for (const expected of expectedWorkspaces) {
    const manifest = readJson<WorkspaceManifest>(
      resolve(root, expected.path, 'package.json'),
    );
    const thirdPartyDependencies = Object.keys(manifest.dependencies ?? {})
      .filter(name => !name.startsWith('@agid/'));

    if (expected.name === '@agid/studio') {
      assert.deepEqual(
        thirdPartyDependencies.sort(),
        ['lucide-react', 'react', 'react-dom'],
      );
    } else {
      assert.deepEqual(thirdPartyDependencies, []);
    }
  }
});

test('all six package names resolve through their public compatibility entrypoints', () => {
  assert.deepEqual(
    [
      AGID_CONTRACTS_WORKSPACE_BRIDGE_VERSION,
      AGID_CORE_WORKSPACE_BRIDGE_VERSION,
      AGID_COUNTRY_DATA_WORKSPACE_BRIDGE_VERSION,
      ADDRESSQL_WORKSPACE_BRIDGE_VERSION,
      AGID_TOPOGRAPHY_WORKSPACE_BRIDGE_VERSION,
      AGID_STUDIO_WORKSPACE_BRIDGE_VERSION,
    ],
    [
      'agid-contracts-workspace-bridge-v1',
      'agid-core-workspace-bridge-v1',
      'agid-country-data-workspace-bridge-v1',
      'addressql-workspace-bridge-v1',
      'agid-topography-workspace-bridge-v1',
      'agid-studio-workspace-bridge-v1',
    ],
  );
});
