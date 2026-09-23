export type PriorityUnverifiedItemId =
  | 'candidate-generation-global-completeness'
  | 'multilingual-search-recall'
  | 'natural-cultural-feature-coverage'
  | 'gis-strict-validation'
  | 'commercial-validator-comparison'
  | 'zk-circuit-safety'
  | 'agid-aoid-production-security';

export type VerificationPosture =
  | 'partial-local-evidence'
  | 'strict-warning-open'
  | 'external-benchmark-required'
  | 'cryptographic-audit-required'
  | 'production-audit-required';

export type DataSourcePosture =
  | 'local-fixture'
  | 'local-static-registry'
  | 'public-oss-source'
  | 'external-live-required'
  | 'terms-review-required'
  | 'external-audit-required';

export type FailureAction =
  | 'unresolved'
  | 'candidate-only'
  | 'additional-evidence-required'
  | 'manual-review'
  | 'block-verified-issuance'
  | 'zk-ready-only'
  | 'external-approval-required';

export type VerificationSlice = {
  id: string;
  label: string;
  examples: string[];
  expectedRisk: 'low' | 'medium' | 'high';
};

export type DataSourceSlice = {
  id: string;
  label: string;
  posture: DataSourcePosture;
  externalApprovalRequired: boolean;
  evidenceUse: string;
};

export type FailureBehavior = {
  id: string;
  trigger: string;
  action: FailureAction;
  publicBehavior: string;
  blocksVerifiedIssuance: boolean;
};

export type PriorityUnverifiedVerificationItem = {
  id: PriorityUnverifiedItemId;
  priority: 'S';
  title: string;
  currentPosture: VerificationPosture;
  claimBoundary: string;
  regionSlices: VerificationSlice[];
  useCaseSlices: VerificationSlice[];
  dataSourceSlices: DataSourceSlice[];
  metrics: string[];
  localEvidence: string[];
  failureBehaviors: FailureBehavior[];
  safePaperWording: string;
  forbiddenClaims: string[];
};

export type PriorityUnverifiedVerificationFinding = {
  itemId: string;
  severity: 'error' | 'warning';
  message: string;
};

const requiresExternalApproval = (source: DataSourceSlice) =>
  source.posture === 'external-live-required' ||
  source.posture === 'terms-review-required' ||
  source.posture === 'external-audit-required';

const commonRegionSlices: VerificationSlice[] = [
  {
    id: 'dense-formal-postal',
    label: 'Dense formal postal regions',
    examples: ['JP Tokyo', 'US New York', 'FR Ile-de-France'],
    expectedRisk: 'medium',
  },
  {
    id: 'weak-postal-rural',
    label: 'Weak postal or rural regions',
    examples: ['KE rural counties', 'TZ rural regions', 'NG informal settlements'],
    expectedRisk: 'high',
  },
  {
    id: 'no-postal-urban',
    label: 'No-normal-postcode urban regions',
    examples: ['HK', 'AE', 'QA'],
    expectedRisk: 'high',
  },
  {
    id: 'island-coastal',
    label: 'Island, coastal, and port regions',
    examples: ['KI', 'TV', 'SB', 'remote ports'],
    expectedRisk: 'high',
  },
  {
    id: 'disputed-cross-border',
    label: 'Disputed or cross-border policy regions',
    examples: ['neutral policy overlays', 'cross-border delivery zones'],
    expectedRisk: 'high',
  },
];

const commonUseCaseSlices: VerificationSlice[] = [
  {
    id: 'international-delivery',
    label: 'International delivery',
    examples: ['carrier label', 'cross-border handoff', 'customs-safe alias'],
    expectedRisk: 'high',
  },
  {
    id: 'ec-checkout',
    label: 'E-commerce checkout',
    examples: ['address form autofill', 'postal lookup', 'candidate selection'],
    expectedRisk: 'medium',
  },
  {
    id: 'field-ops',
    label: 'Field operations',
    examples: ['cannot-reach report', 'offline receipt', 'safe stopping point'],
    expectedRisk: 'high',
  },
  {
    id: 'hotel-pos-handoff',
    label: 'Hotel, POS, and locker handoff',
    examples: ['OPERA preview', 'POS decision', 'locker receipt'],
    expectedRisk: 'high',
  },
  {
    id: 'zk-eligibility',
    label: 'Private eligibility proof',
    examples: ['region membership', 'delivery eligibility', 'freshness predicate'],
    expectedRisk: 'high',
  },
];

const commonSourceSlices: DataSourceSlice[] = [
  {
    id: 'official-postal-admin',
    label: 'Official postal and administrative data',
    posture: 'local-static-registry',
    externalApprovalRequired: false,
    evidenceUse: 'Used for country rules, postal availability class, freshness, and authority labels.',
  },
  {
    id: 'oss-geo',
    label: 'OpenStreetMap, Overture-style building and road evidence',
    posture: 'public-oss-source',
    externalApprovalRequired: false,
    evidenceUse: 'Used as source-bound candidate evidence, never as a sole strong verifier.',
  },
  {
    id: 'local-redacted-feedback',
    label: 'Redacted local feedback and audit envelopes',
    posture: 'local-fixture',
    externalApprovalRequired: false,
    evidenceUse: 'Used to replay failure states without storing private address material.',
  },
];

const commercialSourceSlices: DataSourceSlice[] = [
  ...commonSourceSlices,
  {
    id: 'commercial-validators',
    label: 'Commercial address validators',
    posture: 'terms-review-required',
    externalApprovalRequired: true,
    evidenceUse: 'Used only in an approved same-input benchmark; no live call in local loops.',
  },
];

const defaultFailureBehaviors: FailureBehavior[] = [
  {
    id: 'candidate-missing',
    trigger: 'The expected target is not in the candidate set.',
    action: 'unresolved',
    publicBehavior: 'Return unresolved or additional-evidence-required; do not issue a verified PID.',
    blocksVerifiedIssuance: true,
  },
  {
    id: 'near-tie-or-low-confidence',
    trigger: 'Multiple candidates are near-tied or below the quality threshold.',
    action: 'manual-review',
    publicBehavior: 'Show candidate-only output with source labels and require operator/user confirmation.',
    blocksVerifiedIssuance: true,
  },
  {
    id: 'source-stale-or-unlicensed',
    trigger: 'Source freshness, license, or allowed-use cannot be verified.',
    action: 'additional-evidence-required',
    publicBehavior: 'Keep the result in review state and show source-risk, not a final address truth claim.',
    blocksVerifiedIssuance: true,
  },
];

export const priorityUnverifiedVerificationMatrix: PriorityUnverifiedVerificationItem[] = [
  {
    id: 'candidate-generation-global-completeness',
    priority: 'S',
    title: 'World-scale candidate generation completeness',
    currentPosture: 'partial-local-evidence',
    claimBoundary: 'Assume candidate-generation sufficiency only inside measured region and source coverage.',
    regionSlices: commonRegionSlices,
    useCaseSlices: commonUseCaseSlices.filter(slice => slice.id !== 'zk-eligibility'),
    dataSourceSlices: commonSourceSlices,
    metrics: ['recall@k', 'candidate-miss-rate', 'unresolved-rate', 'source-coverage-rate'],
    localEvidence: ['address-morphism expectation tests', 'postal country pack tests', 'resolver conformance tests'],
    failureBehaviors: defaultFailureBehaviors,
    safePaperWording:
      'Candidate generation is source-bound and region-measured; insufficient coverage returns unresolved or additional evidence required.',
    forbiddenClaims: ['all global addresses are always in the candidate set', 'complete worldwide recall'],
  },
  {
    id: 'multilingual-search-recall',
    priority: 'S',
    title: 'Multilingual search recall improvement',
    currentPosture: 'partial-local-evidence',
    claimBoundary: 'Treat multilingual expansion as recall support, not identity preservation.',
    regionSlices: [
      commonRegionSlices[0],
      commonRegionSlices[1],
      {
        id: 'multi-script-regions',
        label: 'Multi-script and transliteration-heavy regions',
        examples: ['JP', 'KR', 'CN/TW/HK', 'Arabic-script regions', 'Cyrillic-script regions'],
        expectedRisk: 'high',
      },
      commonRegionSlices[4],
    ],
    useCaseSlices: [
      commonUseCaseSlices[0],
      commonUseCaseSlices[1],
      {
        id: 'map-search',
        label: 'Map and place search',
        examples: ['old names', 'aliases', 'romanization variants', 'local-language labels'],
        expectedRisk: 'high',
      },
    ],
    dataSourceSlices: [
      ...commonSourceSlices,
      {
        id: 'language-alias-pack',
        label: 'Language, alias, old-name, and transliteration packs',
        posture: 'local-static-registry',
        externalApprovalRequired: false,
        evidenceUse: 'Used for candidate expansion before structural and source gates.',
      },
    ],
    metrics: ['recall@k', 'false-merge-rate', 'alias-collision-rate', 'script-coverage-rate'],
    localEvidence: ['language compatibility tests', 'address translation tests', 'search query tests'],
    failureBehaviors: [
      ...defaultFailureBehaviors,
      {
        id: 'language-false-merge',
        trigger: 'Alias or transliteration maps two different entities together.',
        action: 'candidate-only',
        publicBehavior: 'Keep multilingual result as a candidate only and require structure/source confirmation.',
        blocksVerifiedIssuance: true,
      },
    ],
    safePaperWording:
      'Multilingual expansion may improve recall, but identity decisions require secondary structure, source, and history gates.',
    forbiddenClaims: ['translation preserves address identity', 'all aliases are resolved without ambiguity'],
  },
  {
    id: 'natural-cultural-feature-coverage',
    priority: 'S',
    title: 'Worldwide natural and cultural feature coverage',
    currentPosture: 'partial-local-evidence',
    claimBoundary: 'Natural and cultural referents are source-bound feature references, not universal recognized addresses.',
    regionSlices: [
      {
        id: 'natural-cultural-feature',
        label: 'Natural and cultural feature regions',
        examples: ['rivers', 'waterfalls', 'lakes', 'deserts', 'wetlands', 'heritage sites'],
        expectedRisk: 'high',
      },
      commonRegionSlices[3],
      {
        id: 'polar-and-glacier',
        label: 'Polar, glacier, and ice regions',
        examples: ['AQ', 'Arctic islands', 'glaciers'],
        expectedRisk: 'high',
      },
      commonRegionSlices[4],
    ],
    useCaseSlices: [
      {
        id: 'non-postal-place-reference',
        label: 'Non-postal place reference',
        examples: ['marine handoff', 'trail delivery', 'research station approach'],
        expectedRisk: 'high',
      },
      commonUseCaseSlices[2],
      {
        id: 'humanitarian-disaster',
        label: 'Humanitarian and disaster response',
        examples: ['temporary camp', 'floodplain', 'remote aid point'],
        expectedRisk: 'high',
      },
    ],
    dataSourceSlices: [
      ...commonSourceSlices,
      {
        id: 'gazetteer-heritage-science',
        label: 'Gazetteer, heritage, polar, and scientific sources',
        posture: 'external-live-required',
        externalApprovalRequired: true,
        evidenceUse: 'Used for coverage benchmarks after source license and freshness review.',
      },
    ],
    metrics: ['feature-type-coverage-rate', 'geometry-quality-rate', 'name-alias-coverage-rate', 'unresolved-rate'],
    localEvidence: ['natural address tests', 'map feature address tests', 'polar/sea service tests'],
    failureBehaviors: defaultFailureBehaviors,
    safePaperWording:
      'Natural and cultural place support is feature-type and source-bound; missing or unstable sources stay unresolved.',
    forbiddenClaims: ['all natural place names are known', 'every cultural site is globally recognized'],
  },
  {
    id: 'gis-strict-validation',
    priority: 'S',
    title: 'GIS strict validation',
    currentPosture: 'strict-warning-open',
    claimBoundary: 'Hard-error-free local GIS validation is not the same as warning-free strict global validation.',
    regionSlices: [
      commonRegionSlices[0],
      commonRegionSlices[3],
      {
        id: 'polar-ocean-boundary',
        label: 'Polar, ocean, and boundary-heavy geometries',
        examples: ['AQ', 'ocean repositories', 'EEZ-adjacent geometries'],
        expectedRisk: 'high',
      },
    ],
    useCaseSlices: [
      commonUseCaseSlices[0],
      {
        id: 'postal-zone-design',
        label: 'Postal zone design',
        examples: ['split/merge', 'delivery-zone polygon', 'coverage gate'],
        expectedRisk: 'high',
      },
      commonUseCaseSlices[2],
    ],
    dataSourceSlices: commonSourceSlices,
    metrics: ['hard-error-count', 'strict-warning-count', 'geometry-validity-rate', 'source-id-coverage-rate'],
    localEvidence: ['verify:gis', 'verify:gis:budget', 'verify:gis:strict remains the strict target'],
    failureBehaviors: [
      ...defaultFailureBehaviors,
      {
        id: 'strict-warning-open',
        trigger: 'Strict GIS warnings remain after hard errors are zero.',
        action: 'manual-review',
        publicBehavior: 'Report machine-readable validity separately from strict global completeness.',
        blocksVerifiedIssuance: true,
      },
    ],
    safePaperWording:
      'Current GIS evidence supports machine-readable local validation; strict warning-free validation remains open.',
    forbiddenClaims: ['GIS is globally complete', 'warning-free strict validation is complete'],
  },
  {
    id: 'commercial-validator-comparison',
    priority: 'S',
    title: 'Commercial validator comparison',
    currentPosture: 'external-benchmark-required',
    claimBoundary: 'Compare by region, use case, and metric after terms review; do not make a victory claim.',
    regionSlices: [commonRegionSlices[0], commonRegionSlices[1], commonRegionSlices[2], commonRegionSlices[3]],
    useCaseSlices: [
      commonUseCaseSlices[0],
      commonUseCaseSlices[1],
      {
        id: 'identity-verification',
        label: 'Identity and compliance form verification',
        examples: ['KYC form split', 'postal consistency check', 'country-format check'],
        expectedRisk: 'high',
      },
    ],
    dataSourceSlices: commercialSourceSlices,
    metrics: ['precision', 'recall@k', 'latency', 'coverage-rate', 'cost-per-check', 'unresolved-safety-rate'],
    localEvidence: ['honest benchmark profile only; no live commercial calls in local loop'],
    failureBehaviors: [
      ...defaultFailureBehaviors,
      {
        id: 'terms-or-network-not-approved',
        trigger: 'Commercial API access, network use, or terms review is not explicitly approved.',
        action: 'external-approval-required',
        publicBehavior: 'Skip live comparison and keep the claim as a benchmark plan.',
        blocksVerifiedIssuance: true,
      },
    ],
    safePaperWording:
      'AMT can be benchmarked against commercial validators under the same inputs and metrics; current local evidence is a comparison plan.',
    forbiddenClaims: ['AGID beats all commercial validators', 'commercial validator parity is proven'],
  },
  {
    id: 'zk-circuit-safety',
    priority: 'S',
    title: 'Real ZK circuit safety',
    currentPosture: 'cryptographic-audit-required',
    claimBoundary: 'Current code is ZK-ready envelope and compatibility logic, not a fully audited proving system.',
    regionSlices: [
      commonRegionSlices[0],
      {
        id: 'small-anonymity-set',
        label: 'Small anonymity set regions',
        examples: ['small islands', 'single-building eligibility zones', 'rare attribute combinations'],
        expectedRisk: 'high',
      },
      commonRegionSlices[4],
    ],
    useCaseSlices: [
      commonUseCaseSlices[4],
      {
        id: 'age-region-residence',
        label: 'Residence or region predicate',
        examples: ['country membership', 'delivery area eligibility', 'freshness window'],
        expectedRisk: 'high',
      },
      commonUseCaseSlices[0],
    ],
    dataSourceSlices: [
      commonSourceSlices[0],
      {
        id: 'zk-circuit-audit',
        label: 'Circuit implementation and cryptographic audit',
        posture: 'external-audit-required',
        externalApprovalRequired: true,
        evidenceUse: 'Required for soundness, zero-knowledge, witness leakage, and setup assumptions.',
      },
      commonSourceSlices[2],
    ],
    metrics: ['soundness-review', 'witness-leakage-review', 'anonymity-set-size', 'nullifier-domain-separation'],
    localEvidence: ['ZK-ready envelope tests', 'proof bundle compatibility tests', 'no raw address gates'],
    failureBehaviors: [
      {
        id: 'no-audited-circuit',
        trigger: 'No audited proving circuit exists for the predicate.',
        action: 'zk-ready-only',
        publicBehavior: 'Expose only ZK-ready envelope status; do not call it a complete ZK proof.',
        blocksVerifiedIssuance: true,
      },
      {
        id: 'small-anonymity-set',
        trigger: 'Predicate attributes identify too few possible subjects.',
        action: 'manual-review',
        publicBehavior: 'Reject or coarsen the predicate before proof generation.',
        blocksVerifiedIssuance: true,
      },
    ],
    safePaperWording:
      'AMT provides predicate inputs and envelopes for future ZK proofs; full ZK safety requires circuit implementation and audit.',
    forbiddenClaims: ['complete ZK system', 'audited zero-knowledge proof is finished'],
  },
  {
    id: 'agid-aoid-production-security',
    priority: 'S',
    title: 'AGID/AOID production security',
    currentPosture: 'production-audit-required',
    claimBoundary: 'Local mandatory security gates are necessary but do not replace external production audit.',
    regionSlices: commonRegionSlices,
    useCaseSlices: commonUseCaseSlices,
    dataSourceSlices: [
      commonSourceSlices[2],
      {
        id: 'external-security-audit',
        label: 'External security and privacy audit',
        posture: 'external-audit-required',
        externalApprovalRequired: true,
        evidenceUse: 'Required before production claims around keys, revocation, sync, QR, delegation, and connector boundaries.',
      },
      {
        id: 'connector-policy',
        label: 'Connector-specific authorization and audit policy',
        posture: 'local-static-registry',
        externalApprovalRequired: false,
        evidenceUse: 'Used to ensure OPERA, POS, delivery, and registry connectors stay no-cache and least-privilege.',
      },
    ],
    metrics: ['mandatory-security-pass', 'no-raw-address-pass', 'secret-scan-pass', 'audit-redaction-pass'],
    localEvidence: ['verify:mandatory-security', 'verify:no-raw-address', 'verify:no-raw-address-kit', 'verify:preaudit-secrets'],
    failureBehaviors: [
      {
        id: 'private-material-risk',
        trigger: 'Private address, recipient, witness, proof code, key, token, or raw connector error could leak.',
        action: 'block-verified-issuance',
        publicBehavior: 'Block release, redact evidence, and require the smallest local fix before continuing.',
        blocksVerifiedIssuance: true,
      },
      {
        id: 'audit-not-complete',
        trigger: 'Threat model, key management, revocation, sync, QR, or delegation is not externally reviewed.',
        action: 'manual-review',
        publicBehavior: 'Keep production security as an application-layer open item, separate from AMT core theory.',
        blocksVerifiedIssuance: true,
      },
    ],
    safePaperWording:
      'AGID/AOID production security is an application-layer audit target; AMT should reference local gates but avoid production-security completion claims.',
    forbiddenClaims: ['production security is fully audited', 'AGID/AOID is unconditionally safe in production'],
  },
];

export function verifyPriorityUnverifiedVerificationMatrix(
  items: PriorityUnverifiedVerificationItem[] = priorityUnverifiedVerificationMatrix,
) {
  const findings: PriorityUnverifiedVerificationFinding[] = [];
  const ids = new Set<PriorityUnverifiedItemId>();

  for (const item of items) {
    if (ids.has(item.id)) {
      findings.push({ itemId: item.id, severity: 'error', message: 'Duplicate priority item id.' });
    }
    ids.add(item.id);

    if (item.priority !== 'S') {
      findings.push({ itemId: item.id, severity: 'error', message: 'Priority item must stay S.' });
    }
    if (item.regionSlices.length < 3) {
      findings.push({ itemId: item.id, severity: 'error', message: 'At least three region slices are required.' });
    }
    if (item.useCaseSlices.length < 3) {
      findings.push({ itemId: item.id, severity: 'error', message: 'At least three use-case slices are required.' });
    }
    if (item.dataSourceSlices.length < 3) {
      findings.push({ itemId: item.id, severity: 'error', message: 'At least three data-source slices are required.' });
    }
    if (item.failureBehaviors.length < 2) {
      findings.push({ itemId: item.id, severity: 'error', message: 'At least two failure behaviors are required.' });
    }
    if (!item.failureBehaviors.every(behavior => behavior.blocksVerifiedIssuance)) {
      findings.push({ itemId: item.id, severity: 'error', message: 'Every failure behavior must block verified issuance.' });
    }
    if (item.dataSourceSlices.some(source => requiresExternalApproval(source) && !source.externalApprovalRequired)) {
      findings.push({ itemId: item.id, severity: 'error', message: 'External data sources require explicit approval.' });
    }
    if (/\b(all|complete|fully proven|victory|beats all)\b/i.test(item.safePaperWording)) {
      findings.push({ itemId: item.id, severity: 'error', message: 'Safe paper wording contains an overclaim marker.' });
    }
    if (item.forbiddenClaims.length === 0) {
      findings.push({ itemId: item.id, severity: 'error', message: 'Forbidden claims must be listed.' });
    }
  }

  const byId = new Map(items.map(item => [item.id, item]));
  const candidate = byId.get('candidate-generation-global-completeness');
  if (candidate && !['recall@k', 'candidate-miss-rate', 'unresolved-rate'].every(metric => candidate.metrics.includes(metric))) {
    findings.push({ itemId: candidate.id, severity: 'error', message: 'Candidate generation must track recall, miss, and unresolved metrics.' });
  }

  const multilingual = byId.get('multilingual-search-recall');
  if (multilingual && !['recall@k', 'false-merge-rate'].every(metric => multilingual.metrics.includes(metric))) {
    findings.push({ itemId: multilingual.id, severity: 'error', message: 'Multilingual recall must track recall and false merge metrics.' });
  }

  const commercial = byId.get('commercial-validator-comparison');
  if (commercial && commercial.currentPosture !== 'external-benchmark-required') {
    findings.push({ itemId: commercial.id, severity: 'error', message: 'Commercial comparison must remain externally benchmarked, not locally proven.' });
  }

  const zk = byId.get('zk-circuit-safety');
  if (zk && zk.currentPosture !== 'cryptographic-audit-required') {
    findings.push({ itemId: zk.id, severity: 'error', message: 'ZK circuit safety must require cryptographic audit.' });
  }

  const security = byId.get('agid-aoid-production-security');
  if (security && !['verify:mandatory-security', 'verify:no-raw-address'].every(command => security.localEvidence.includes(command))) {
    findings.push({ itemId: security.id, severity: 'error', message: 'Production security must cite mandatory security and no-raw-address gates.' });
  }

  return {
    passed: findings.every(finding => finding.severity !== 'error'),
    findings,
    summary: {
      itemCount: items.length,
      regionSliceCount: items.reduce((sum, item) => sum + item.regionSlices.length, 0),
      useCaseSliceCount: items.reduce((sum, item) => sum + item.useCaseSlices.length, 0),
      dataSourceSliceCount: items.reduce((sum, item) => sum + item.dataSourceSlices.length, 0),
      failureBehaviorCount: items.reduce((sum, item) => sum + item.failureBehaviors.length, 0),
      externalSourceCount: items.flatMap(item => item.dataSourceSlices).filter(source => source.externalApprovalRequired).length,
    },
  };
}
