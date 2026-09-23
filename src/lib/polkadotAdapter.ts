import { sha256Hex } from './sha256';
import {
  buildPolkadotExtrinsicPlan,
  listPolkadotIntegrationStages,
  type PolkadotChainCommitment,
  type PolkadotIntegrationStageId,
} from './polkadotIntegration';

export const POLKADOT_ADAPTER_MODEL_VERSION = 'agid-polkadot-adapter-v1';

export type PolkadotAdapterNetwork = {
  networkId: string;
  relayChain?: 'polkadot' | 'kusama' | 'rococo' | 'local';
  parachainId?: number;
  genesisHash?: string;
  finalityDepth: number;
};

export type PolkadotAnchorOptions = {
  observedAt?: string;
};

export type PolkadotFinalityOptions = {
  finalizedBlockNumber?: number;
  requiredConfirmations?: number;
  observedAt?: string;
};

export type PolkadotAnchorStatus = 'anchored' | 'already_anchored' | 'rejected';
export type PolkadotFinalityStatus = 'pending' | 'finalized' | 'missing';

export type PolkadotAnchorResult = {
  modelVersion: typeof POLKADOT_ADAPTER_MODEL_VERSION;
  status: PolkadotAnchorStatus;
  network: PolkadotAdapterNetwork;
  commitmentId: string;
  commitmentHash: string;
  stageId: PolkadotIntegrationStageId;
  entityType: PolkadotChainCommitment['entityType'];
  publicPayload: Record<string, unknown>;
  pallet?: string;
  extrinsic?: string;
  txHash?: string;
  blockHash?: string;
  blockNumber?: number;
  observedAt?: string;
  finalized: boolean;
  finalityStatus?: Exclude<PolkadotFinalityStatus, 'missing'>;
  errors: string[];
  warnings: string[];
};

export type PolkadotCommitmentRecord = {
  modelVersion: typeof POLKADOT_ADAPTER_MODEL_VERSION;
  network: PolkadotAdapterNetwork;
  commitmentId: string;
  commitmentHash: string;
  stageId: PolkadotIntegrationStageId;
  entityType: PolkadotChainCommitment['entityType'];
  publicPayload: Record<string, unknown>;
  pallet: string;
  extrinsic: string;
  txHash: string;
  blockHash: string;
  blockNumber: number;
  observedAt: string;
  finalized: boolean;
  finalityStatus: Exclude<PolkadotFinalityStatus, 'missing'>;
  warnings: string[];
};

export type PolkadotFinalityResult = {
  modelVersion: typeof POLKADOT_ADAPTER_MODEL_VERSION;
  status: PolkadotFinalityStatus;
  network: PolkadotAdapterNetwork;
  commitmentId: string;
  commitmentHash?: string;
  blockNumber?: number;
  finalizedBlockNumber?: number;
  confirmations: number;
  requiredConfirmations: number;
  finalized: boolean;
  observedAt?: string;
  errors: string[];
  warnings: string[];
};

export type CreateInMemoryPolkadotAdapterOptions = {
  networkId?: string;
  relayChain?: PolkadotAdapterNetwork['relayChain'];
  parachainId?: number;
  genesisHash?: string;
  finalityDepth?: number;
  initialBlockNumber?: number;
  finalizedBlockNumber?: number;
};

export interface PolkadotCommitmentAdapter {
  readonly network: PolkadotAdapterNetwork;
  anchorCommitment(
    commitment: PolkadotChainCommitment,
    options?: PolkadotAnchorOptions
  ): Promise<PolkadotAnchorResult>;
  queryCommitment(commitmentId: string): Promise<PolkadotCommitmentRecord | null>;
  verifyFinality(commitmentId: string, options?: PolkadotFinalityOptions): Promise<PolkadotFinalityResult>;
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map(key => `${JSON.stringify(key)}:${stableJson(record[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value ?? null);
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function normalizeCommitmentId(commitmentId: string) {
  return String(commitmentId || '').normalize('NFKC').trim();
}

function toHexHash(value: unknown) {
  return `0x${sha256Hex(stableJson(value))}`;
}

const stagesById = new Map(listPolkadotIntegrationStages().map(stage => [stage.id, stage]));

export class InMemoryPolkadotCommitmentAdapter implements PolkadotCommitmentAdapter {
  readonly network: PolkadotAdapterNetwork;

  private readonly recordsById = new Map<string, PolkadotCommitmentRecord>();
  private readonly anchoredStages = new Set<PolkadotIntegrationStageId>();
  private nextBlockNumber: number;
  private finalizedBlockNumber: number;

  constructor(options: CreateInMemoryPolkadotAdapterOptions = {}) {
    const initialBlockNumber = Math.max(1, Math.floor(options.initialBlockNumber ?? 1));
    this.network = {
      networkId: options.networkId ?? 'local-mock',
      relayChain: options.relayChain ?? 'local',
      parachainId: options.parachainId,
      genesisHash: options.genesisHash,
      finalityDepth: Math.max(1, Math.floor(options.finalityDepth ?? 2)),
    };
    this.nextBlockNumber = initialBlockNumber;
    this.finalizedBlockNumber = Math.max(0, Math.floor(options.finalizedBlockNumber ?? initialBlockNumber - 1));
  }

  async anchorCommitment(
    commitment: PolkadotChainCommitment,
    options: PolkadotAnchorOptions = {}
  ): Promise<PolkadotAnchorResult> {
    const commitmentId = normalizeCommitmentId(commitment.commitmentId);
    const existing = this.recordsById.get(commitmentId);
    if (existing) return this.toAnchorResult(existing, 'already_anchored');

    const plan = buildPolkadotExtrinsicPlan({ stageId: commitment.stageId, commitment });
    const errors: string[] = [];
    if (!commitment.publishable || commitment.forbiddenFields.length > 0) {
      errors.push(
        'private-fields-forbidden',
        ...commitment.forbiddenFields.map(field => `forbidden-field:${field}`)
      );
    }
    if (!plan.ready) errors.push('extrinsic-plan-not-ready');
    errors.push(...this.missingStageDependencies(commitment.stageId).map(stageId => `stage-dependency-missing:${stageId}`));

    if (errors.length > 0) {
      return {
        modelVersion: POLKADOT_ADAPTER_MODEL_VERSION,
        status: 'rejected',
        network: clone(this.network),
        commitmentId,
        commitmentHash: commitment.commitmentHash,
        stageId: commitment.stageId,
        entityType: commitment.entityType,
        publicPayload: clone(commitment.publicPayload),
        pallet: plan.pallet,
        extrinsic: plan.extrinsic,
        finalized: false,
        errors,
        warnings: [...commitment.warnings, ...plan.warnings],
      };
    }

    const blockNumber = this.nextBlockNumber;
    const txHash = toHexHash({
      modelVersion: POLKADOT_ADAPTER_MODEL_VERSION,
      network: this.network,
      commitmentId,
      commitmentHash: commitment.commitmentHash,
      pallet: plan.pallet,
      extrinsic: plan.extrinsic,
      blockNumber,
    });
    const blockHash = toHexHash({
      modelVersion: POLKADOT_ADAPTER_MODEL_VERSION,
      network: this.network,
      blockNumber,
      txHash,
    });
    const observedAt = options.observedAt ?? new Date().toISOString();
    const record: PolkadotCommitmentRecord = {
      modelVersion: POLKADOT_ADAPTER_MODEL_VERSION,
      network: clone(this.network),
      commitmentId,
      commitmentHash: commitment.commitmentHash,
      stageId: commitment.stageId,
      entityType: commitment.entityType,
      publicPayload: clone(commitment.publicPayload),
      pallet: plan.pallet,
      extrinsic: plan.extrinsic,
      txHash,
      blockHash,
      blockNumber,
      observedAt,
      finalized: false,
      finalityStatus: 'pending',
      warnings: [...commitment.warnings, ...plan.warnings],
    };

    this.recordsById.set(commitmentId, record);
    this.anchoredStages.add(commitment.stageId);
    this.nextBlockNumber += 1;

    return this.toAnchorResult(record, 'anchored');
  }

  async queryCommitment(commitmentId: string): Promise<PolkadotCommitmentRecord | null> {
    const record = this.recordsById.get(normalizeCommitmentId(commitmentId));
    return record ? clone(record) : null;
  }

  async verifyFinality(
    commitmentId: string,
    options: PolkadotFinalityOptions = {}
  ): Promise<PolkadotFinalityResult> {
    const normalizedId = normalizeCommitmentId(commitmentId);
    const requiredConfirmations = Math.max(1, Math.floor(options.requiredConfirmations ?? this.network.finalityDepth));
    const finalizedBlockNumber = Math.max(
      0,
      Math.floor(options.finalizedBlockNumber ?? this.finalizedBlockNumber)
    );
    this.finalizedBlockNumber = Math.max(this.finalizedBlockNumber, finalizedBlockNumber);

    const record = this.recordsById.get(normalizedId);
    if (!record) {
      return {
        modelVersion: POLKADOT_ADAPTER_MODEL_VERSION,
        status: 'missing',
        network: clone(this.network),
        commitmentId: normalizedId,
        finalizedBlockNumber,
        confirmations: 0,
        requiredConfirmations,
        finalized: false,
        observedAt: options.observedAt,
        errors: ['commitment-not-found'],
        warnings: [],
      };
    }

    const confirmations = finalizedBlockNumber >= record.blockNumber
      ? finalizedBlockNumber - record.blockNumber + 1
      : 0;
    const finalized = record.finalized || confirmations >= requiredConfirmations;
    record.finalized = finalized;
    record.finalityStatus = finalized ? 'finalized' : 'pending';

    return {
      modelVersion: POLKADOT_ADAPTER_MODEL_VERSION,
      status: record.finalityStatus,
      network: clone(this.network),
      commitmentId: record.commitmentId,
      commitmentHash: record.commitmentHash,
      blockNumber: record.blockNumber,
      finalizedBlockNumber,
      confirmations,
      requiredConfirmations,
      finalized,
      observedAt: options.observedAt,
      errors: [],
      warnings: clone(record.warnings),
    };
  }

  private missingStageDependencies(stageId: PolkadotIntegrationStageId) {
    const stage = stagesById.get(stageId);
    return stage ? stage.dependsOn.filter(dependency => !this.anchoredStages.has(dependency)) : [];
  }

  private toAnchorResult(
    record: PolkadotCommitmentRecord,
    status: Extract<PolkadotAnchorStatus, 'anchored' | 'already_anchored'>
  ): PolkadotAnchorResult {
    return {
      modelVersion: POLKADOT_ADAPTER_MODEL_VERSION,
      status,
      network: clone(record.network),
      commitmentId: record.commitmentId,
      commitmentHash: record.commitmentHash,
      stageId: record.stageId,
      entityType: record.entityType,
      publicPayload: clone(record.publicPayload),
      pallet: record.pallet,
      extrinsic: record.extrinsic,
      txHash: record.txHash,
      blockHash: record.blockHash,
      blockNumber: record.blockNumber,
      observedAt: record.observedAt,
      finalized: record.finalized,
      finalityStatus: record.finalityStatus,
      errors: [],
      warnings: clone(record.warnings),
    };
  }
}

export function createInMemoryPolkadotAdapter(
  options: CreateInMemoryPolkadotAdapterOptions = {}
): PolkadotCommitmentAdapter {
  return new InMemoryPolkadotCommitmentAdapter(options);
}
