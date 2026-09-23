export const RESEARCH_PAPER_VOLUME_SEPARATION_VERSION = 'research-paper-volume-separation-v1';

export type ResearchPaperVolumeId =
  | 'amt-core'
  | 'agid-aoid-application'
  | 'zk-address-predicate';

export type ImplementationDetailLevel =
  | 'none'
  | 'boundary-only'
  | 'application-spec'
  | 'cryptographic-model';

export type ResearchPaperVolumeRule = {
  id: ResearchPaperVolumeId;
  title: string;
  role: string;
  centralQuestion: string;
  allowedClaims: string[];
  bridgeOnlyClaims: string[];
  forbiddenClaims: string[];
  maxImplementationDetail: ImplementationDetailLevel;
  companionPapers: ResearchPaperVolumeId[];
};

export type ResearchPaperSectionInput = {
  title: string;
  body?: string;
  topics?: string[];
};

export type ResearchPaperVolumeBoundaryInput = {
  volumeId: ResearchPaperVolumeId;
  sections: ResearchPaperSectionInput[];
};

export type ResearchPaperVolumeBoundaryFinding = {
  sectionTitle: string;
  code: string;
  message: string;
};

export type ResearchPaperVolumeBoundaryValidation = {
  valid: boolean;
  version: typeof RESEARCH_PAPER_VOLUME_SEPARATION_VERSION;
  volumeId: ResearchPaperVolumeId;
  errors: ResearchPaperVolumeBoundaryFinding[];
  warnings: ResearchPaperVolumeBoundaryFinding[];
};

export type ResearchPaperTopicClassification = {
  primaryVolume: ResearchPaperVolumeId;
  bridgeVolumes: ResearchPaperVolumeId[];
  warnings: string[];
};

type BoundaryPattern = {
  code: string;
  pattern: RegExp;
  message: string;
  bridgePattern?: RegExp;
};

const COMPANION_BRIDGE_RE =
  /\b(companion|boundary|out of scope|separate paper|separate manuscript|not part of (?:the )?core|application layer|cryptographic layer|implementation boundary|scope boundary)\b/i;

export const RESEARCH_PAPER_VOLUME_RULES: ResearchPaperVolumeRule[] = [
  {
    id: 'amt-core',
    title: 'Address Morphism Theory I: Core Semantics of Address Resolution',
    role: 'Core mathematical and semantic theory',
    centralQuestion:
      'When is an address reference resolvable, ambiguous, unresolved, rejected, or eligible for persistent identifier issuance?',
    allowedClaims: [
      'address expressions as observations over a time-dependent addressable world',
      'candidate generation, multilingual expansion, structural dissimilarity, clustering, abstention, and PID gates',
      'non-injective observation, projection loss, candidate incompleteness, lineage graphs, and context-relative optimality',
      'quality, source, governance, benchmark, and verification taxonomies at the semantic level',
      'proof sketches and Lean-formalizable impossibility or boundary theorems that do not depend on product identifiers',
    ],
    bridgeOnlyClaims: [
      'AGID and AOID may appear only as examples of application identifiers built on AMT outputs',
      'zero-knowledge proofs may appear only as companion privacy protocols consuming AMT envelopes',
      'implementation artifacts may appear only as validation evidence or conformance targets, not as core theory',
    ],
    forbiddenClaims: [
      'AGID encoding, AGID-S QR payload, AOID private record, AOID sync, POS workflow, SDK, OpenAPI, or carrier settlement details',
      'ZK circuit constraints, prover implementation, nullifier construction, Ethereum registry details, or cryptographic soundness claims',
      'claims that AMT itself provides privacy, identity proof, delivery authorization, payment settlement, or production deployment security',
    ],
    maxImplementationDetail: 'boundary-only',
    companionPapers: ['agid-aoid-application', 'zk-address-predicate'],
  },
  {
    id: 'agid-aoid-application',
    title: 'AGID/AOID Applications of Address Morphism Theory',
    role: 'Application architecture and public/private identifier specification',
    centralQuestion:
      'How should public geographic references and private operational address authority be implemented without turning AMT into a product spec?',
    allowedClaims: [
      'AGID public geographic reference, AOID private operational address identity, and AGID-S encrypted sharing envelope',
      'QR/NFC, POS, SDK, OpenAPI, MCP, Address Element, registry modes, resolver modes, conformance vectors, and local-first behavior',
      'public/private separation, no-raw-address defaults, security boundaries, source licenses, and operational safety constraints',
      'implementation tests and product claims that stay subordinate to AMT semantics and do not reprove AMT',
    ],
    bridgeOnlyClaims: [
      'AMT may be summarized as the semantic foundation, but AMT theorems are imported rather than reproved',
      'ZK may be referenced as an optional companion privacy layer, but proof soundness belongs to the ZK paper',
      'Ethereum and other ledgers may be optional registry or settlement adapters, not the identity of the project',
    ],
    forbiddenClaims: [
      'reproving AMT reference impossibility, lineage conservation, or No Free Lunch as if the application paper were AMT I',
      'claiming production zero-knowledge soundness, circuit correctness, anonymity-set safety, or verifier security',
      'treating AOID as a global public tracking identifier or treating Ethereum as mandatory for basic operation',
    ],
    maxImplementationDetail: 'application-spec',
    companionPapers: ['amt-core', 'zk-address-predicate'],
  },
  {
    id: 'zk-address-predicate',
    title: 'Address Morphism Theory II: Zero-Knowledge Address Predicates',
    role: 'Cryptographic companion framework for private address-derived predicates',
    centralQuestion:
      'Which AMT-derived facts can be proven without revealing the underlying address, AOID body, coordinates, or history?',
    allowedClaims: [
      'witness and public statement models, commitments, public predicates, nullifiers, purpose scope, freshness, and revocation',
      'issuer trust roots, proof bundle compatibility, replay and linkability analysis, and circuit audit requirements',
      'conditional claims that separate semantic truth from cryptographic proof validity',
      'implementation-supported proof-ready envelopes that are explicitly distinguished from audited production ZK backends',
    ],
    bridgeOnlyClaims: [
      'AMT appears as the semantic envelope provider, not as a cryptographic proof system',
      'AGID and AOID may appear as optional witness inputs or application references, not as the main identifier specification',
      'POS, delivery, humanitarian, or shopping-agent flows may appear as use cases, not as core proof theorems',
    ],
    forbiddenClaims: [
      'redefining AGID encode/decode, AOID record layout, QR/NFC UX, POS state machines, or SDK conformance as ZK theory',
      'claiming that ZK proves real-world address truth without issuer, freshness, source, and AMT envelope assumptions',
      'claiming production SNARK, STARK, or zkVM readiness without circuit implementation and independent audit',
    ],
    maxImplementationDetail: 'cryptographic-model',
    companionPapers: ['amt-core', 'agid-aoid-application'],
  },
];

const FORBIDDEN_PATTERNS: Record<ResearchPaperVolumeId, BoundaryPattern[]> = {
  'amt-core': [
    {
      code: 'amt-core-agid-aoid-implementation-detail',
      pattern: /\b(AGID-S|AOID private|AOID sync|QR\/NFC|POS terminal|OpenAPI|SDK conformance|carrier settlement|Address Element)\b/i,
      message: 'AMT core must not contain AGID/AOID implementation details except as boundary-only companion references.',
      bridgePattern: COMPANION_BRIDGE_RE,
    },
    {
      code: 'amt-core-zk-implementation-detail',
      pattern: /\b(nullifier construction|ZK circuit|zero-knowledge circuit|prover implementation|SNARK|STARK|zkVM|Ethereum registry|L2 verifier)\b/i,
      message: 'AMT core must not carry cryptographic implementation or verifier claims.',
      bridgePattern: COMPANION_BRIDGE_RE,
    },
    {
      code: 'amt-core-product-claim',
      pattern: /\b(production deployment|managed service|POS workflow|payment settlement|carrier label API|hosted registry API)\b/i,
      message: 'Product and deployment claims belong to the application paper, not AMT core.',
      bridgePattern: COMPANION_BRIDGE_RE,
    },
  ],
  'agid-aoid-application': [
    {
      code: 'application-reproves-amt',
      pattern: /\b(reprove|complete proof of AMT|prove the AMT impossibility theorem|formalizes all AMT theorems)\b/i,
      message: 'The application paper should import AMT results and avoid reproving AMT core theory.',
      bridgePattern: COMPANION_BRIDGE_RE,
    },
    {
      code: 'application-claims-zk-soundness',
      pattern: /\b(proves zero-knowledge soundness|proves circuit soundness|production SNARK|audited zkVM|anonymity-set proof is complete)\b/i,
      message: 'Cryptographic soundness belongs to the ZK Address Predicate paper and independent audits.',
      bridgePattern: COMPANION_BRIDGE_RE,
    },
    {
      code: 'application-global-public-aoid',
      pattern: /\b(AOID is a global public identifier|global public AOID|AOID as a public tracking identifier|Ethereum is mandatory)\b/i,
      message: 'AGID/AOID application claims must preserve private AOID and Ethereum-optional boundaries.',
    },
  ],
  'zk-address-predicate': [
    {
      code: 'zk-redefines-application-spec',
      pattern: /\b(AGID encode\/decode SDK|AGID SDK conformance|AOID record layout|AOID QR sync|POS terminal UI|QR\/NFC UX|carrier label workflow)\b/i,
      message: 'The ZK paper may use AGID/AOID as inputs, but must not redefine application specs as proof theory.',
      bridgePattern: COMPANION_BRIDGE_RE,
    },
    {
      code: 'zk-confuses-proof-with-truth',
      pattern: /\b(ZK proves real-world address truth|zero-knowledge proves the address is true|cryptography replaces address validation)\b/i,
      message: 'ZK proves relations about committed data; semantic truth still depends on AMT, source, issuer, and freshness assumptions.',
    },
    {
      code: 'zk-unaudited-production-claim',
      pattern: /\b(production-ready ZK|audited circuit|complete SNARK deployment|complete STARK deployment|complete zkVM deployment)\b/i,
      message: 'Production ZK readiness requires implemented circuits and independent audit evidence.',
      bridgePattern: /\b(future|roadmap|requires audit|not yet|unverified|implementation boundary)\b/i,
    },
  ],
};

function normalizeText(value: string) {
  return value.normalize('NFKC').replace(/\s+/g, ' ').trim();
}

function findVolumeRule(volumeId: ResearchPaperVolumeId) {
  return RESEARCH_PAPER_VOLUME_RULES.find(rule => rule.id === volumeId);
}

export function getResearchPaperVolumeSeparationPlan() {
  return {
    version: RESEARCH_PAPER_VOLUME_SEPARATION_VERSION,
    principle:
      'AMT is the semantic theory, AGID/AOID is the application identifier layer, and ZK Address Predicate is the cryptographic disclosure layer; each may cite the others only through explicit bridge boundaries.',
    volumes: RESEARCH_PAPER_VOLUME_RULES,
  };
}

export function validateResearchPaperVolumeBoundary(
  input: ResearchPaperVolumeBoundaryInput,
): ResearchPaperVolumeBoundaryValidation {
  const errors: ResearchPaperVolumeBoundaryFinding[] = [];
  const warnings: ResearchPaperVolumeBoundaryFinding[] = [];
  const rule = findVolumeRule(input.volumeId);

  if (!rule) {
    return {
      valid: false,
      version: RESEARCH_PAPER_VOLUME_SEPARATION_VERSION,
      volumeId: input.volumeId,
      errors: [{
        sectionTitle: '<volume>',
        code: 'unknown-volume',
        message: `Unknown volume id: ${input.volumeId}`,
      }],
      warnings,
    };
  }

  const patterns = FORBIDDEN_PATTERNS[input.volumeId];
  for (const section of input.sections) {
    const text = normalizeText(`${section.title}\n${section.body ?? ''}\n${section.topics?.join('\n') ?? ''}`);
    for (const boundary of patterns) {
      if (!boundary.pattern.test(text)) continue;
      const canBridge = boundary.bridgePattern?.test(text) ?? false;
      const finding = {
        sectionTitle: section.title,
        code: boundary.code,
        message: boundary.message,
      };
      if (canBridge) warnings.push(finding);
      else errors.push(finding);
    }
  }

  return {
    valid: errors.length === 0,
    version: RESEARCH_PAPER_VOLUME_SEPARATION_VERSION,
    volumeId: input.volumeId,
    errors,
    warnings,
  };
}

export function classifyResearchPaperTopic(topic: string): ResearchPaperTopicClassification {
  const text = normalizeText(topic);
  const warnings: string[] = [];

  const isZk = /\b(ZK|zero-knowledge|nullifier|witness|circuit|prover|verifier|revocation root|freshness root|proof bundle|commitment|SNARK|STARK|zkVM)\b/i.test(text);
  const isApplication = /\b(AGID|AOID|AGID-S|QR|NFC|POS|SDK|OpenAPI|MCP|Address Element|registry API|carrier label|shipping label|wallet|Ethereum|Polkadot)\b/i.test(text);
  const isAmt = /\b(AMT|address morphism|candidate generation|cluster|clustering|unresolved|ambiguous|PID|lineage|non-injective|impossibility|entropy|context-relative|structural dissimilarity)\b/i.test(text);

  if (isZk) {
    if (isAmt) warnings.push('Keep AMT as an imported semantic envelope, not as a cryptographic proof system.');
    if (isApplication) warnings.push('Keep AGID/AOID details as optional witness or application context.');
    return {
      primaryVolume: 'zk-address-predicate',
      bridgeVolumes: [
        ...(isAmt ? ['amt-core' as const] : []),
        ...(isApplication ? ['agid-aoid-application' as const] : []),
      ],
      warnings,
    };
  }

  if (isApplication) {
    if (isAmt) warnings.push('Summarize AMT dependency without reproving AMT core results.');
    return {
      primaryVolume: 'agid-aoid-application',
      bridgeVolumes: isAmt ? ['amt-core'] : [],
      warnings,
    };
  }

  if (isAmt) {
    return {
      primaryVolume: 'amt-core',
      bridgeVolumes: [],
      warnings,
    };
  }

  warnings.push('Topic is not clearly assigned; default to AMT only if it is semantic, otherwise create a companion appendix.');
  return {
    primaryVolume: 'amt-core',
    bridgeVolumes: [],
    warnings,
  };
}
