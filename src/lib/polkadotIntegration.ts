import { sha256Hex } from './sha256';

export const AGID_POLKADOT_INTEGRATION_MODEL_VERSION = 'agid-polkadot-integration-v1';
export const AGID_POLKADOT_COMMITMENT_ALGORITHM = 'sha256-agid-polkadot-public-commitment-v1';

export type PolkadotIntegrationStageId =
  | 'chain-commitment'
  | 'zk-address-proof'
  | 'zk-delivery'
  | 'address-credential'
  | 'credential-marketplace'
  | 'aoid-ownership'
  | 'aoid-inheritance'
  | 'address-reputation'
  | 'humanitarian-identity'
  | 'disaster-address'
  | 'address-lineage'
  | 'aoid-history-proof'
  | 'address-dao';

export type PolkadotCommitmentEntityType =
  | 'zk-proof'
  | 'credential'
  | 'credential-issuer'
  | 'aoid-ownership'
  | 'aoid-inheritance'
  | 'reputation'
  | 'humanitarian-identity'
  | 'disaster-address'
  | 'address-lineage'
  | 'dao-rule-set';

export type PolkadotIntegrationStage = {
  modelVersion: typeof AGID_POLKADOT_INTEGRATION_MODEL_VERSION;
  id: PolkadotIntegrationStageId;
  order: number;
  label: string;
  role: string;
  dependsOn: PolkadotIntegrationStageId[];
  onChainSurface: 'commitment-registry' | 'credential-registry' | 'ownership-registry' | 'lineage-registry' | 'dao-governance';
  publishOnly: string[];
  keepOffChain: string[];
};

export type PolkadotPublicationDecision = {
  modelVersion: typeof AGID_POLKADOT_INTEGRATION_MODEL_VERSION;
  stageId: PolkadotIntegrationStageId;
  publishable: boolean;
  onChainSurface: PolkadotIntegrationStage['onChainSurface'];
  forbiddenFields: string[];
  warnings: string[];
  redactedPayload: Record<string, unknown>;
};

export type PolkadotChainCommitment = {
  modelVersion: typeof AGID_POLKADOT_INTEGRATION_MODEL_VERSION;
  algorithm: typeof AGID_POLKADOT_COMMITMENT_ALGORITHM;
  stageId: PolkadotIntegrationStageId;
  entityType: PolkadotCommitmentEntityType;
  entityId: string;
  commitmentId: string;
  commitmentHash: string;
  publicPayload: Record<string, unknown>;
  publishable: boolean;
  forbiddenFields: string[];
  warnings: string[];
};

export type PolkadotExtrinsicPlan = {
  modelVersion: typeof AGID_POLKADOT_INTEGRATION_MODEL_VERSION;
  stageId: PolkadotIntegrationStageId;
  ready: boolean;
  pallet: string;
  extrinsic: string;
  chainRole: string;
  requiredCommitments: string[];
  forbiddenOnChainFields: string[];
  warnings: string[];
};

const STAGES: PolkadotIntegrationStage[] = [
  {
    modelVersion: AGID_POLKADOT_INTEGRATION_MODEL_VERSION,
    id: 'chain-commitment',
    order: 1,
    label: 'Chain Commitment Layer',
    role: 'Create privacy-safe public commitments before any Polkadot publication.',
    dependsOn: [],
    onChainSurface: 'commitment-registry',
    publishOnly: ['commitmentHash', 'stageId', 'entityType', 'issuerDid', 'policyHash', 'verifierVersion'],
    keepOffChain: ['address', 'recipient', 'phone', 'unit', 'subjectId', 'AOID plaintext'],
  },
  {
    modelVersion: AGID_POLKADOT_INTEGRATION_MODEL_VERSION,
    id: 'zk-address-proof',
    order: 2,
    label: 'ZK Address Proof Registry',
    role: 'Anchor residence proof verifier versions, commitments, nullifiers, and revocation roots.',
    dependsOn: ['chain-commitment'],
    onChainSurface: 'commitment-registry',
    publishOnly: ['proofCommitment', 'subjectCommitment', 'bindingCommitment', 'regionClaim', 'nullifier'],
    keepOffChain: ['street', 'houseNumber', 'recipient', 'phone', 'exactCoordinates'],
  },
  {
    modelVersion: AGID_POLKADOT_INTEGRATION_MODEL_VERSION,
    id: 'zk-delivery',
    order: 3,
    label: 'ZK Delivery Eligibility',
    role: 'Anchor delivery eligibility and legitimate recipient proofs without revealing address or person data.',
    dependsOn: ['zk-address-proof'],
    onChainSurface: 'commitment-registry',
    publishOnly: ['deliveryRegionCommitment', 'recipientCommitment', 'carrierPolicyHash', 'nullifier'],
    keepOffChain: ['realAddress', 'recipientName', 'phone', 'deliveryInstructions'],
  },
  {
    modelVersion: AGID_POLKADOT_INTEGRATION_MODEL_VERSION,
    id: 'address-credential',
    order: 4,
    label: 'Address Credential',
    role: 'Register credential type, issuer DID, schema hash, and revocation registry root.',
    dependsOn: ['zk-address-proof', 'zk-delivery'],
    onChainSurface: 'credential-registry',
    publishOnly: ['credentialType', 'issuerDid', 'schemaHash', 'revocationRoot', 'freshnessRoot', 'freshnessPolicyHash', 'checkedAt', 'freshUntil'],
    keepOffChain: ['credential body', 'address body', 'subjectId'],
  },
  {
    modelVersion: AGID_POLKADOT_INTEGRATION_MODEL_VERSION,
    id: 'credential-marketplace',
    order: 5,
    label: 'Credential Marketplace',
    role: 'Anchor credential issuer trust registry roots and list credential products for residence, delivery, and disaster support.',
    dependsOn: ['address-credential'],
    onChainSurface: 'credential-registry',
    publishOnly: ['registryId', 'registryVersion', 'trustRegistryRoot', 'trustPolicyHash', 'issuerCounts', 'sourceIds', 'generatedAt', 'issuerDid', 'credentialType', 'feePolicyHash'],
    keepOffChain: ['applicant identity', 'credential evidence', 'address evidence'],
  },
  {
    modelVersion: AGID_POLKADOT_INTEGRATION_MODEL_VERSION,
    id: 'aoid-ownership',
    order: 6,
    label: 'AOID Ownership',
    role: 'Manage AOID ownership, update authority, delegation, QR reissue, and sharing via commitments.',
    dependsOn: ['address-credential'],
    onChainSurface: 'ownership-registry',
    publishOnly: ['aoidCommitment', 'ownerKeyCommitment', 'delegationPolicyHash'],
    keepOffChain: ['AOID plaintext', 'owner private key', 'address', 'phone'],
  },
  {
    modelVersion: AGID_POLKADOT_INTEGRATION_MODEL_VERSION,
    id: 'aoid-inheritance',
    order: 7,
    label: 'AOID Inheritance',
    role: 'Add multisig, timelock, guardian, and legal-credential handoff commitments for homes and facilities.',
    dependsOn: ['aoid-ownership'],
    onChainSurface: 'ownership-registry',
    publishOnly: ['inheritancePolicyHash', 'guardianSetCommitment', 'timelockPolicyHash'],
    keepOffChain: ['family identity', 'legal documents', 'property address'],
  },
  {
    modelVersion: AGID_POLKADOT_INTEGRATION_MODEL_VERSION,
    id: 'address-reputation',
    order: 8,
    label: 'Address Reputation',
    role: 'Publish privacy-preserving delivery success, return-rate, and fraud-report aggregates.',
    dependsOn: ['zk-delivery', 'address-credential'],
    onChainSurface: 'credential-registry',
    publishOnly: ['reputationCredentialHash', 'epoch', 'bucketNullifier', 'aggregateScore'],
    keepOffChain: ['recipient', 'carrier account', 'actual route', 'real address'],
  },
  {
    modelVersion: AGID_POLKADOT_INTEGRATION_MODEL_VERSION,
    id: 'humanitarian-identity',
    order: 9,
    label: 'Humanitarian Identity',
    role: 'Support displaced, disaster, and refugee identity credentials with cross-border verification.',
    dependsOn: ['address-credential', 'zk-delivery'],
    onChainSurface: 'credential-registry',
    publishOnly: ['aidCredentialType', 'issuerDid', 'eligibilityPolicyHash', 'revocationRoot'],
    keepOffChain: ['beneficiary identity', 'camp address', 'phone', 'case notes'],
  },
  {
    modelVersion: AGID_POLKADOT_INTEGRATION_MODEL_VERSION,
    id: 'disaster-address',
    order: 10,
    label: 'Disaster Address',
    role: 'Anchor virtual shelter, temporary housing, and aid hub address commitments.',
    dependsOn: ['humanitarian-identity'],
    onChainSurface: 'commitment-registry',
    publishOnly: ['disasterAddressCommitment', 'siteType', 'validityEpoch', 'issuerDid'],
    keepOffChain: ['evacuee list', 'private contact', 'temporary room assignment'],
  },
  {
    modelVersion: AGID_POLKADOT_INTEGRATION_MODEL_VERSION,
    id: 'address-lineage',
    order: 11,
    label: 'Address Lineage',
    role: 'Anchor address mapping theory events across administrative changes, redevelopment, and renaming.',
    dependsOn: ['chain-commitment'],
    onChainSurface: 'lineage-registry',
    publishOnly: ['lineageEventHash', 'mappingRuleHash', 'sourcePidCommitment', 'targetPidCommitment'],
    keepOffChain: ['old address text', 'new address text', 'resident history'],
  },
  {
    modelVersion: AGID_POLKADOT_INTEGRATION_MODEL_VERSION,
    id: 'aoid-history-proof',
    order: 12,
    label: 'AOID History Proof',
    role: 'Prove same-place history, merge, split, and legitimate update flows without exposing user history.',
    dependsOn: ['aoid-ownership', 'address-lineage'],
    onChainSurface: 'lineage-registry',
    publishOnly: ['historyProofCommitment', 'mergeSplitPolicyHash', 'lineageRoot'],
    keepOffChain: ['user history', 'raw old address', 'raw new address'],
  },
  {
    modelVersion: AGID_POLKADOT_INTEGRATION_MODEL_VERSION,
    id: 'address-dao',
    order: 13,
    label: 'Address DAO',
    role: 'Govern country-specific address rendering, translation, verification, and rule-set hashes.',
    dependsOn: ['address-lineage', 'credential-marketplace'],
    onChainSurface: 'dao-governance',
    publishOnly: ['ruleSetHash', 'localePolicyHash', 'countryCode', 'proposalHash'],
    keepOffChain: ['private address', 'private user complaint', 'raw identity'],
  },
];

const EXTRINSIC_PLANS: Record<PolkadotIntegrationStageId, Omit<PolkadotExtrinsicPlan, 'ready' | 'warnings'>> = {
  'chain-commitment': {
    modelVersion: AGID_POLKADOT_INTEGRATION_MODEL_VERSION,
    stageId: 'chain-commitment',
    pallet: 'agidCommitments',
    extrinsic: 'anchorCommitment',
    chainRole: 'Base privacy-safe commitment anchor.',
    requiredCommitments: ['commitmentHash'],
    forbiddenOnChainFields: [],
  },
  'zk-address-proof': {
    modelVersion: AGID_POLKADOT_INTEGRATION_MODEL_VERSION,
    stageId: 'zk-address-proof',
    pallet: 'agidZkProofs',
    extrinsic: 'registerAddressProofCommitment',
    chainRole: 'Residence and region proof verifier registry.',
    requiredCommitments: ['proofCommitment', 'subjectCommitment', 'bindingCommitment'],
    forbiddenOnChainFields: [],
  },
  'zk-delivery': {
    modelVersion: AGID_POLKADOT_INTEGRATION_MODEL_VERSION,
    stageId: 'zk-delivery',
    pallet: 'agidZkProofs',
    extrinsic: 'registerDeliveryEligibilityCommitment',
    chainRole: 'Delivery eligibility and carrier policy anchor.',
    requiredCommitments: ['deliveryRegionCommitment', 'recipientCommitment', 'carrierPolicyHash'],
    forbiddenOnChainFields: [],
  },
  'address-credential': {
    modelVersion: AGID_POLKADOT_INTEGRATION_MODEL_VERSION,
    stageId: 'address-credential',
    pallet: 'agidCredentials',
    extrinsic: 'registerCredentialSchema',
    chainRole: 'Credential schema, issuer, revocation root, and freshness root registry.',
    requiredCommitments: ['schemaHash', 'issuerDid', 'revocationRoot', 'freshnessRoot', 'freshnessPolicyHash'],
    forbiddenOnChainFields: [],
  },
  'credential-marketplace': {
    modelVersion: AGID_POLKADOT_INTEGRATION_MODEL_VERSION,
    stageId: 'credential-marketplace',
    pallet: 'agidCredentialMarketplace',
    extrinsic: 'anchorIssuerTrustRegistry',
    chainRole: 'Credential issuer trust registry root and credential product registry.',
    requiredCommitments: ['trustRegistryRoot', 'trustPolicyHash'],
    forbiddenOnChainFields: [],
  },
  'aoid-ownership': {
    modelVersion: AGID_POLKADOT_INTEGRATION_MODEL_VERSION,
    stageId: 'aoid-ownership',
    pallet: 'agidAoidOwnership',
    extrinsic: 'registerOwnershipCommitment',
    chainRole: 'AOID owner, delegation, QR reissue, and sharing commitment registry.',
    requiredCommitments: ['aoidCommitment', 'ownerKeyCommitment', 'delegationPolicyHash'],
    forbiddenOnChainFields: [],
  },
  'aoid-inheritance': {
    modelVersion: AGID_POLKADOT_INTEGRATION_MODEL_VERSION,
    stageId: 'aoid-inheritance',
    pallet: 'agidAoidOwnership',
    extrinsic: 'registerInheritancePolicy',
    chainRole: 'AOID inheritance policy, guardian, and timelock registry.',
    requiredCommitments: ['inheritancePolicyHash', 'guardianSetCommitment'],
    forbiddenOnChainFields: [],
  },
  'address-reputation': {
    modelVersion: AGID_POLKADOT_INTEGRATION_MODEL_VERSION,
    stageId: 'address-reputation',
    pallet: 'agidReputation',
    extrinsic: 'anchorReputationCredential',
    chainRole: 'Privacy-preserving delivery reputation aggregate registry.',
    requiredCommitments: ['reputationCredentialHash', 'bucketNullifier'],
    forbiddenOnChainFields: [],
  },
  'humanitarian-identity': {
    modelVersion: AGID_POLKADOT_INTEGRATION_MODEL_VERSION,
    stageId: 'humanitarian-identity',
    pallet: 'agidHumanitarian',
    extrinsic: 'registerAidEligibilityCredential',
    chainRole: 'Cross-border aid eligibility credential registry.',
    requiredCommitments: ['aidCredentialType', 'eligibilityPolicyHash', 'revocationRoot'],
    forbiddenOnChainFields: [],
  },
  'disaster-address': {
    modelVersion: AGID_POLKADOT_INTEGRATION_MODEL_VERSION,
    stageId: 'disaster-address',
    pallet: 'agidHumanitarian',
    extrinsic: 'anchorDisasterAddress',
    chainRole: 'Temporary shelter, hub, and aid point virtual-address registry.',
    requiredCommitments: ['disasterAddressCommitment', 'validityEpoch'],
    forbiddenOnChainFields: [],
  },
  'address-lineage': {
    modelVersion: AGID_POLKADOT_INTEGRATION_MODEL_VERSION,
    stageId: 'address-lineage',
    pallet: 'agidLineage',
    extrinsic: 'anchorLineageEvent',
    chainRole: 'Address mapping theory event and PID lineage registry.',
    requiredCommitments: ['lineageEventHash', 'mappingRuleHash'],
    forbiddenOnChainFields: [],
  },
  'aoid-history-proof': {
    modelVersion: AGID_POLKADOT_INTEGRATION_MODEL_VERSION,
    stageId: 'aoid-history-proof',
    pallet: 'agidLineage',
    extrinsic: 'anchorAoidHistoryProof',
    chainRole: 'AOID history, merge, split, and same-place proof registry.',
    requiredCommitments: ['historyProofCommitment', 'lineageRoot'],
    forbiddenOnChainFields: [],
  },
  'address-dao': {
    modelVersion: AGID_POLKADOT_INTEGRATION_MODEL_VERSION,
    stageId: 'address-dao',
    pallet: 'agidAddressDao',
    extrinsic: 'proposeRuleSetHash',
    chainRole: 'Govern country address rendering, translation, verification, and rule-set hashes.',
    requiredCommitments: ['ruleSetHash', 'proposalHash'],
    forbiddenOnChainFields: [],
  },
};

const FORBIDDEN_ON_CHAIN_FIELD_KEYS = new Set([
  'address',
  'addresstext',
  'fulladdress',
  'realaddress',
  'street',
  'road',
  'housenumber',
  'postcode',
  'postalcode',
  'recipient',
  'recipientname',
  'name',
  'phone',
  'phonenumber',
  'email',
  'unit',
  'room',
  'apartment',
  'flat',
  'suite',
  'floor',
  'lat',
  'lon',
  'lng',
  'latitude',
  'longitude',
  'coordinates',
  'geometry',
  'subjectid',
  'userid',
  'aoid',
  'privatekey',
  'secret',
  'privatepayload',
  'deliveryinstructions',
  'accessinstructions',
  'casenotes',
]);

function stableJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .filter(([, nested]) => nested !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, nested]) => `${JSON.stringify(key)}:${stableJson(nested)}`)
    .join(',')}}`;
}

function normalizeFieldKey(key: string) {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function findStage(stageId: PolkadotIntegrationStageId) {
  return STAGES.find(stage => stage.id === stageId);
}

function redactForbiddenFields(value: unknown, path = 'payload'): {
  forbiddenFields: string[];
  redacted: unknown;
} {
  if (Array.isArray(value)) {
    const forbiddenFields: string[] = [];
    const redacted = value.map((item, index) => {
      const result = redactForbiddenFields(item, `${path}[${index}]`);
      forbiddenFields.push(...result.forbiddenFields);
      return result.redacted;
    });
    return { forbiddenFields, redacted };
  }

  if (!value || typeof value !== 'object') {
    return { forbiddenFields: [], redacted: value };
  }

  const forbiddenFields: string[] = [];
  const redacted: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    const nestedPath = `${path}.${key}`;
    if (FORBIDDEN_ON_CHAIN_FIELD_KEYS.has(normalizeFieldKey(key))) {
      forbiddenFields.push(nestedPath);
      continue;
    }
    const result = redactForbiddenFields(nested, nestedPath);
    forbiddenFields.push(...result.forbiddenFields);
    redacted[key] = result.redacted;
  }
  return { forbiddenFields, redacted };
}

export function listPolkadotIntegrationStages(): PolkadotIntegrationStage[] {
  return STAGES.map(stage => ({
    ...stage,
    dependsOn: [...stage.dependsOn],
    publishOnly: [...stage.publishOnly],
    keepOffChain: [...stage.keepOffChain],
  }));
}

export function getNextPolkadotIntegrationStage(
  completedStageIds: readonly PolkadotIntegrationStageId[]
): PolkadotIntegrationStage | null {
  const completed = new Set(completedStageIds);
  const next = STAGES.find(stage => !completed.has(stage.id) && stage.dependsOn.every(dependency => completed.has(dependency)));
  return next ? listPolkadotIntegrationStages().find(stage => stage.id === next.id) ?? null : null;
}

export function evaluatePolkadotPublication(input: {
  stageId: PolkadotIntegrationStageId;
  publicPayload?: unknown;
}): PolkadotPublicationDecision {
  const stage = findStage(input.stageId);
  if (!stage) throw new Error(`Unknown Polkadot integration stage: ${input.stageId}`);

  const redaction = redactForbiddenFields(toRecord(input.publicPayload));
  const warnings = redaction.forbiddenFields.length > 0
    ? ['Polkadot publication can carry commitments and public policy metadata only; private fields were redacted.']
    : [];

  return {
    modelVersion: AGID_POLKADOT_INTEGRATION_MODEL_VERSION,
    stageId: input.stageId,
    publishable: redaction.forbiddenFields.length === 0,
    onChainSurface: stage.onChainSurface,
    forbiddenFields: redaction.forbiddenFields,
    warnings,
    redactedPayload: toRecord(redaction.redacted),
  };
}

export function buildPolkadotChainCommitment(input: {
  stageId: PolkadotIntegrationStageId;
  entityType: PolkadotCommitmentEntityType;
  entityId: string;
  publicPayload?: unknown;
  salt?: string;
}): PolkadotChainCommitment {
  const decision = evaluatePolkadotPublication({
    stageId: input.stageId,
    publicPayload: input.publicPayload,
  });
  const entityId = String(input.entityId || '').normalize('NFKC').trim();
  const publicPayload = decision.redactedPayload;
  const commitmentHash = sha256Hex(stableJson({
    algorithm: AGID_POLKADOT_COMMITMENT_ALGORITHM,
    modelVersion: AGID_POLKADOT_INTEGRATION_MODEL_VERSION,
    stageId: input.stageId,
    entityType: input.entityType,
    entityId,
    publicPayload,
    salt: input.salt || '',
  }));

  return {
    modelVersion: AGID_POLKADOT_INTEGRATION_MODEL_VERSION,
    algorithm: AGID_POLKADOT_COMMITMENT_ALGORITHM,
    stageId: input.stageId,
    entityType: input.entityType,
    entityId,
    commitmentId: `POLKA-${commitmentHash.slice(0, 20).toUpperCase()}`,
    commitmentHash,
    publicPayload,
    publishable: decision.publishable,
    forbiddenFields: decision.forbiddenFields,
    warnings: decision.warnings,
  };
}

export function buildPolkadotExtrinsicPlan(input: {
  stageId: PolkadotIntegrationStageId;
  commitment?: PolkadotChainCommitment;
}): PolkadotExtrinsicPlan {
  const plan = EXTRINSIC_PLANS[input.stageId];
  if (!plan) throw new Error(`Unknown Polkadot integration stage: ${input.stageId}`);
  const ready = input.commitment?.stageId === input.stageId && input.commitment.publishable === true;
  const warnings = input.commitment && input.commitment.publishable === false
    ? ['Commitment is not publishable until private fields are removed or redacted.']
    : [];

  return {
    ...plan,
    ready,
    requiredCommitments: [...plan.requiredCommitments],
    forbiddenOnChainFields: [
      ...Array.from(FORBIDDEN_ON_CHAIN_FIELD_KEYS).sort(),
      ...plan.forbiddenOnChainFields,
    ],
    warnings,
  };
}
