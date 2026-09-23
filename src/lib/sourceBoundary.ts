import {
  COMMERCIAL_SOURCE_BOUNDARY_ENTRIES,
  DUAL_CONTRACT_SOURCE_BOUNDARY_ENTRIES,
} from './sourceBoundaryCommercial';
import { OPEN_SOURCE_SOURCE_BOUNDARY_ENTRIES } from './sourceBoundaryOpenSource';

export const SOURCE_BOUNDARY_VERSION = 'agid-source-boundary-v1';

export type SourceBoundaryKind =
  | 'open-source'
  | 'commercial'
  | 'dual-contract'
  | 'compatibility-shim';

export type SourceBoundaryLicense =
  | 'Apache-2.0'
  | 'MIT'
  | 'AGPL-3.0-or-commercial'
  | 'Commercial'
  | 'CC-BY-4.0'
  | 'CC0'
  | 'DATA-LICENSES';

export type SourceBoundaryCompatibility = {
  stableImport: string | null;
  keepCurrentPath: boolean;
  requiresShim: boolean;
  publicApiMustRemain: boolean;
  notes: string[];
};

export type SourceBoundaryEntry = {
  id: string;
  label: string;
  boundary: SourceBoundaryKind;
  license: SourceBoundaryLicense;
  currentPaths: string[];
  recommendedPaths: string[];
  compatibility: SourceBoundaryCompatibility;
  ossFallback?: string[];
  commercialDependsOn?: string[];
  guardrails: string[];
};

export type SourceBoundaryManifest = {
  version: typeof SOURCE_BOUNDARY_VERSION;
  principle: string;
  entries: SourceBoundaryEntry[];
  hardRules: string[];
};

export const SOURCE_BOUNDARY_HARD_RULES = [
  'Do not move existing source paths until compatibility shims or package aliases exist.',
  'Open-source entries cannot use a Commercial license.',
  'Commercial and dual-contract entries must define an OSS fallback or self-host path.',
  'Commercial modules may depend on OSS contracts, but OSS core must not import commercial modules.',
  'Mode 0 Local Only must not import hosted registry, managed proof, payment settlement, partner review, or enterprise dashboard code.',
  'No raw address, raw AOID, AGID-S payload, proof code, recipient secret, or passport-name payload may cross a commercial boundary by default.',
  'Docs must say when a file is an OSS protocol/model versus a hosted or regulated commercial operation.',
];

export const SOURCE_BOUNDARY_ENTRIES: SourceBoundaryEntry[] = [
  ...OPEN_SOURCE_SOURCE_BOUNDARY_ENTRIES,
  ...COMMERCIAL_SOURCE_BOUNDARY_ENTRIES,
  ...DUAL_CONTRACT_SOURCE_BOUNDARY_ENTRIES,
];

function cloneEntry(entry: SourceBoundaryEntry): SourceBoundaryEntry {
  return {
    ...entry,
    currentPaths: [...entry.currentPaths],
    recommendedPaths: [...entry.recommendedPaths],
    compatibility: {
      ...entry.compatibility,
      notes: [...entry.compatibility.notes],
    },
    ossFallback: entry.ossFallback ? [...entry.ossFallback] : undefined,
    commercialDependsOn: entry.commercialDependsOn ? [...entry.commercialDependsOn] : undefined,
    guardrails: [...entry.guardrails],
  };
}

export function getSourceBoundaryManifest(): SourceBoundaryManifest {
  return {
    version: SOURCE_BOUNDARY_VERSION,
    principle: 'Separate AGID/AOID source into OSS protocol/reference layers and commercial managed-operation layers while keeping existing imports stable through current paths and future shims.',
    entries: SOURCE_BOUNDARY_ENTRIES.map(cloneEntry),
    hardRules: [...SOURCE_BOUNDARY_HARD_RULES],
  };
}

export function getSourceBoundaryEntriesByKind(kind: SourceBoundaryKind): SourceBoundaryEntry[] {
  return getSourceBoundaryManifest().entries.filter(entry => entry.boundary === kind);
}

export function getSourceBoundaryEntry(id: string): SourceBoundaryEntry | undefined {
  return getSourceBoundaryManifest().entries.find(entry => entry.id === id);
}

export function summarizeSourceBoundary() {
  const manifest = getSourceBoundaryManifest();
  return {
    version: manifest.version,
    totalEntries: manifest.entries.length,
    openSourceEntries: manifest.entries.filter(entry => entry.boundary === 'open-source').length,
    commercialEntries: manifest.entries.filter(entry => entry.boundary === 'commercial').length,
    dualContractEntries: manifest.entries.filter(entry => entry.boundary === 'dual-contract').length,
    compatibilityShimRequired: manifest.entries.filter(entry => entry.compatibility.requiresShim).length,
    stableCurrentPaths: manifest.entries.filter(entry => entry.compatibility.keepCurrentPath).length,
    publicApiEntries: manifest.entries.filter(entry => entry.compatibility.publicApiMustRemain).length,
  };
}

export function buildSourceBoundaryMovePlan() {
  return getSourceBoundaryManifest().entries.map(entry => ({
    id: entry.id,
    boundary: entry.boundary,
    currentPaths: [...entry.currentPaths],
    recommendedPaths: [...entry.recommendedPaths],
    moveNow: false,
    firstStep: entry.compatibility.requiresShim
      ? 'add alias/barrel compatibility shim before moving files'
      : 'add docs redirect/index before moving files',
    keepStableImport: entry.compatibility.stableImport,
  }));
}

export function validateSourceBoundaryManifest(
  manifest = getSourceBoundaryManifest(),
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const ids = new Set<string>();

  for (const entry of manifest.entries) {
    if (ids.has(entry.id)) errors.push(`duplicate-entry:${entry.id}`);
    ids.add(entry.id);

    if (!entry.currentPaths.length) warnings.push(`entry-without-current-path:${entry.id}`);
    if (!entry.recommendedPaths.length) errors.push(`missing-recommended-path:${entry.id}`);
    if (!entry.guardrails.length) errors.push(`missing-guardrail:${entry.id}`);
    if (!entry.compatibility.notes.length) errors.push(`missing-compatibility-notes:${entry.id}`);
    if (!entry.compatibility.keepCurrentPath) errors.push(`must-keep-current-path-for-compatibility:${entry.id}`);
    if (entry.compatibility.requiresShim && !entry.compatibility.stableImport) {
      errors.push(`shim-entry-without-stable-import:${entry.id}`);
    }

    if (entry.boundary === 'open-source' && entry.license === 'Commercial') {
      errors.push(`open-source-entry-commercial-license:${entry.id}`);
    }
    if ((entry.boundary === 'commercial' || entry.boundary === 'dual-contract') && !entry.ossFallback?.length) {
      errors.push(`commercial-entry-without-oss-fallback:${entry.id}`);
    }
    if (entry.boundary === 'commercial' && !entry.commercialDependsOn?.length) {
      errors.push(`commercial-entry-without-open-dependencies:${entry.id}`);
    }
  }

  const requiredEntries = [
    'agid-aoid-public-standards',
    'local-resolver-address-display',
    'address-registration-and-element',
    'basic-pos-terminal',
    'address-portal-user-control',
    'privacy-security-release-gates',
    'zk-baseline-open-proof-relations',
    'hosted-registry-managed-service',
    'managed-zk-proof-generation',
    'veygrit-id-address-login',
    'operations-workspace-trading-models',
  ];
  for (const required of requiredEntries) {
    if (!ids.has(required)) errors.push(`missing-required-entry:${required}`);
  }

  const hardRuleText = manifest.hardRules.join(' | ').toLowerCase();
  for (const requiredRule of ['mode 0 local only', 'no raw address', 'oss core must not import commercial']) {
    if (!hardRuleText.includes(requiredRule)) errors.push(`missing-hard-rule:${requiredRule}`);
  }

  const ossCore = manifest.entries.filter(entry => entry.boundary === 'open-source');
  if (ossCore.some(entry => entry.recommendedPaths.some(path => path.includes('/commercial/')))) {
    errors.push('open-source-entry-recommends-commercial-path');
  }

  const commercial = manifest.entries.filter(entry => entry.boundary === 'commercial');
  if (commercial.some(entry => entry.recommendedPaths.every(path => !path.includes('/commercial/') && !path.includes('enterprise/')))) {
    errors.push('commercial-entry-without-commercial-path');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
