import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadPostalContextPack } from '../src/server/postalContextPackStore';

export type HfPostalPlanOptions = {
  descriptorPath: string;
  descriptorDigest: string;
  countryCode: string;
  dataset: string;
  revision: string;
  allowSynthetic?: boolean;
  allowExperimental?: boolean;
};

export function planPostalContextHfRelease(options: HfPostalPlanOptions) {
  // Offline only. No Hub credential, network, upload, repository creation,
  // hardware provisioning or billable service is available through this tool.
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}\/[A-Za-z0-9][A-Za-z0-9._-]{0,95}$/.test(options.dataset)
    || options.dataset.includes('..') || options.dataset.includes('--') || options.dataset.endsWith('.git')) throw new Error('hf-dataset-id-invalid');
  if (!/^[a-f0-9]{40}$/.test(options.revision)) throw new Error('hf-full-commit-required');
  if (!/^[A-Z]{2}$/.test(options.countryCode)) throw new Error('hf-country-invalid');
  const loaded = loadPostalContextPack(options.descriptorPath, options.descriptorDigest, {
    expectedCountryCode: options.countryCode,
    allowSynthetic: options.allowSynthetic === true,
    allowExperimental: options.allowExperimental === true,
  });
  if (loaded.descriptor.containsResidentialAddressPoints) throw new Error('hf-residential-publication-review-required');
  const name = basename(options.descriptorPath);
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(name)
    || /^(?:CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)/i.test(name)
    || name.endsWith('.') || loaded.descriptor.artifacts.some(a => a.path.toLowerCase() === name.toLowerCase())) throw new Error('hf-descriptor-filename-invalid');
  const descriptorBytes = readFileSync(options.descriptorPath);
  if ('sha256:' + createHash('sha256').update(descriptorBytes).digest('hex') !== loaded.descriptorDigest) throw new Error('hf-descriptor-changed-during-plan');
  const files = [
    { role: 'descriptor', path: name, digest: loaded.descriptorDigest, byteLength: descriptorBytes.length },
    ...loaded.descriptor.artifacts.map(a => ({ role: a.role, path: a.path, digest: a.digest, byteLength: a.byteLength })),
  ].map(file => ({ ...file, pinnedUrl: `https://huggingface.co/datasets/${options.dataset}/resolve/${options.revision}/${encodeURIComponent(file.path)}` }));
  return {
    schemaVersion: 'postal-context-hf-offline-plan/v1', countryCode: options.countryCode,
    dataset: options.dataset, revision: options.revision, releaseId: loaded.descriptor.releaseId,
    synthetic: loaded.descriptor.synthetic, runtimeMaturity: loaded.descriptor.maturity,
    localPackIntegrityVerified: true, files, totalBytes: files.reduce((n, f) => n + f.byteLength, 0),
    additionalSpendBudgetUsd: 0, networkRequestsPerformed: 0, uploadedBytes: 0,
    remoteRevisionVerified: false, remoteArtifactDigestsVerified: false,
    sourceAndPublicationRightsVerified: false, countryM2Achieved: false,
    automaticUploadAllowed: false, paidComputeAllowed: false, automaticRechargeAllowed: false,
    requiredBeforeUse: [
      'Approve the exact existing or new private HF destination and confirm remaining included storage/egress; no overage or paid hardware.',
      'Review exact source/output rights and privacy; schema validity and a PRO subscription do not grant data rights.',
      'Verify the supplied full Hub commit exists and all pinned remote bytes match these SHA-256 digests.',
      'Stage permitted files in approved ephemeral runtime storage; invoke the unchanged AGID pack loader and test real API responses.',
      'Keep Dataset Viewer conversion refs and Spaces demos separate from authoritative release evidence; review country-specific M2 independently.',
    ],
  };
}

export function parseHfPlanArguments(args: string[]): HfPostalPlanOptions {
  const values = new Map<string, string>();
  const switches = new Set<string>();
  const keys = new Set(['--descriptor', '--digest', '--country', '--dataset', '--revision']);
  for (let i = 0; i < args.length; i++) {
    const key = args[i];
    if (key === '--allow-synthetic' || key === '--allow-experimental') {
      if (switches.has(key)) throw new Error('hf-duplicate-option'); switches.add(key); continue;
    }
    if (!keys.has(key) || values.has(key) || !args[i + 1] || args[i + 1].startsWith('--')) throw new Error('hf-invalid-option');
    values.set(key, args[++i]);
  }
  if (values.size !== keys.size) throw new Error('hf-required-option-missing');
  return { descriptorPath: values.get('--descriptor')!, descriptorDigest: values.get('--digest')!, countryCode: values.get('--country')!,
    dataset: values.get('--dataset')!, revision: values.get('--revision')!,
    allowSynthetic: switches.has('--allow-synthetic'), allowExperimental: switches.has('--allow-experimental') };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length === 3 && process.argv[2] === '--help') {
    console.log('Offline plan only: --descriptor PATH --digest sha256:HEX --country CC --dataset OWNER/NAME --revision FULL_COMMIT [--allow-synthetic] [--allow-experimental]. No upload, remote verification or paid service.');
  } else console.log(JSON.stringify(planPostalContextHfRelease(parseHfPlanArguments(process.argv.slice(2))), null, 2));
}
