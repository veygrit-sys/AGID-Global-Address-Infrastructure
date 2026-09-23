import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import {
  createInMemoryAgidRegistryApiStore,
  type AgidRegistryApiStoreAdapter,
  type AgidRegistrySnapshot,
} from '../lib/agidRegistryApi';

export const HOSTED_REGISTRY_STORE_VERSION = 'hosted-registry-store-v1';

export type HostedRegistryStorageMode = 'memory' | 'file';

export type HostedRegistryStoreOptions = {
  storageMode?: HostedRegistryStorageMode;
  filePath?: string;
};

function defaultHostedRegistryPath() {
  return process.env.AGID_REGISTRY_FILE_PATH
    || join(process.cwd(), '.agid-runtime', 'hosted-registry.json');
}

function configuredStorageMode(value: unknown, fallback: HostedRegistryStorageMode = 'memory'): HostedRegistryStorageMode {
  const mode = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (mode === 'file' || mode === 'hosted-file' || mode === 'json') return 'file';
  if (mode === 'memory' || mode === 'in-memory' || mode === 'mem') return 'memory';
  return fallback;
}

function emptySnapshot(): Partial<AgidRegistrySnapshot> {
  return {
    issuers: [],
    revokedCommitments: [],
    freshnessRoots: [],
    usedNullifiers: [],
    audit: [],
  };
}

function snapshotFromStoredJson(value: unknown): Partial<AgidRegistrySnapshot> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return emptySnapshot();
  const root = value as Record<string, unknown>;
  const snapshot = root.snapshot && typeof root.snapshot === 'object' && !Array.isArray(root.snapshot)
    ? root.snapshot as Partial<AgidRegistrySnapshot>
    : root as Partial<AgidRegistrySnapshot>;
  return snapshot;
}

export class FileHostedAgidRegistryApiStore implements AgidRegistryApiStoreAdapter {
  private loaded = false;
  private store = createInMemoryAgidRegistryApiStore();

  constructor(private readonly filePath = defaultHostedRegistryPath()) {}

  async capabilities() {
    await this.load();
    return this.store.capabilities();
  }

  async snapshot() {
    await this.load();
    return this.store.snapshot();
  }

  async auditEvents(limit?: number) {
    await this.load();
    return this.store.auditEvents(limit);
  }

  async registerIssuer(input: Parameters<AgidRegistryApiStoreAdapter['registerIssuer']>[0]) {
    await this.load();
    const result = this.store.registerIssuer(input);
    await this.persist();
    return result;
  }

  async revokeCommitment(input: Parameters<AgidRegistryApiStoreAdapter['revokeCommitment']>[0]) {
    await this.load();
    const result = this.store.revokeCommitment(input);
    await this.persist();
    return result;
  }

  async anchorFreshnessRoot(input: Parameters<AgidRegistryApiStoreAdapter['anchorFreshnessRoot']>[0]) {
    await this.load();
    const result = this.store.anchorFreshnessRoot(input);
    await this.persist();
    return result;
  }

  async verify(input: Parameters<AgidRegistryApiStoreAdapter['verify']>[0]) {
    await this.load();
    const result = this.store.verify(input);
    await this.persist();
    return result;
  }

  async markNullifierUsed(input: Parameters<AgidRegistryApiStoreAdapter['markNullifierUsed']>[0]) {
    await this.load();
    const result = this.store.markNullifierUsed(input);
    await this.persist();
    return result;
  }

  private async load() {
    if (this.loaded) return;
    try {
      const raw = await readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(raw);
      this.store = createInMemoryAgidRegistryApiStore(snapshotFromStoredJson(parsed));
    } catch (error) {
      if (!error || typeof error !== 'object' || !('code' in error) || error.code !== 'ENOENT') {
        throw error;
      }
      this.store = createInMemoryAgidRegistryApiStore(emptySnapshot());
    }
    this.loaded = true;
  }

  private async persist() {
    const snapshot = this.store.snapshot();
    const envelope = {
      storeVersion: HOSTED_REGISTRY_STORE_VERSION,
      persistedAt: new Date().toISOString(),
      privacy: snapshot.privacy,
      rawAddressStorage: false,
      rawAgidStorage: false,
      rawAoidStorage: false,
      agidSecureCiphertextStorage: false,
      snapshot,
    };
    await mkdir(dirname(this.filePath), { recursive: true });
    const tempPath = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(tempPath, `${JSON.stringify(envelope, null, 2)}\n`, 'utf8');
    await rename(tempPath, this.filePath);
  }
}

export function createConfiguredAgidRegistryApiStore(
  options: HostedRegistryStoreOptions & { defaultStorageMode?: HostedRegistryStorageMode } = {},
): AgidRegistryApiStoreAdapter {
  const storageMode = configuredStorageMode(
    options.storageMode ?? process.env.AGID_REGISTRY_STORE,
    options.defaultStorageMode ?? 'memory',
  );
  if (storageMode === 'file') {
    return new FileHostedAgidRegistryApiStore(options.filePath || defaultHostedRegistryPath());
  }
  return createInMemoryAgidRegistryApiStore();
}
