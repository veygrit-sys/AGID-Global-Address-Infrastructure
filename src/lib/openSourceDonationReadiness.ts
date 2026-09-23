import {
  OPEN_SOURCE_FEATURE_AREAS,
  type OpenSourceFeatureArea,
} from './openCoreProductStrategy';

export const OPEN_SOURCE_DONATION_READINESS_VERSION = 'agid-open-source-donation-readiness-v1';

export type DonationReadinessGrade =
  | 'not-ready'
  | 'small-donation-ready'
  | 'small-grant-ready'
  | 'medium-grant-ready'
  | 'large-grant-not-yet';

export type FundingFit = 'high' | 'medium' | 'low' | 'not-now';

export type FundingProbability = 'high' | 'medium-high' | 'medium' | 'low' | 'very-low';

export type FundingOpportunity = {
  id: string;
  organization: string;
  programOrService: string;
  fit: FundingFit;
  probability: FundingProbability;
  officialRange: string;
  realisticAsk: string;
  bestOpenSourcePackage: string;
  whyItFits: string[];
  blockers: string[];
  sourceUrl: string;
};

export type ProfessionalReview = {
  role: string;
  score: number;
  seesAsFundableBecause: string[];
  doubts: string[];
  nextProofNeeded: string[];
};

export type OpenSourceAreaReadiness = {
  areaId: OpenSourceFeatureArea['id'];
  label: string;
  score: number;
  grade: DonationReadinessGrade;
  donationPitch: string;
  strongEvidence: string[];
  weakEvidence: string[];
  improveWithoutChangingPhilosophy: string[];
  doNotDo: string[];
};

export type DonationReadinessAssessment = {
  version: typeof OPEN_SOURCE_DONATION_READINESS_VERSION;
  overallScore: number;
  overallGrade: DonationReadinessGrade;
  conclusion: string;
  principlesNotToBend: string[];
  areaReadiness: OpenSourceAreaReadiness[];
  professionalReviews: ProfessionalReview[];
  fundingOpportunities: FundingOpportunity[];
  firstFundingPackages: string[];
};

export type DonationReadinessValidation = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

const AREA_READINESS_BY_ID: Record<OpenSourceFeatureArea['id'], Omit<OpenSourceAreaReadiness, 'areaId' | 'label'>> = {
  'agid-aoid-standards': {
    score: 78,
    grade: 'medium-grant-ready',
    donationPitch: 'Public AGID/AOID/AGID-S specifications and test vectors can become a credible open address interoperability layer.',
    strongEvidence: [
      'Clear open-core boundary exists.',
      'Multi-language SDK parity work exists.',
      'AGID-S privacy distinction is documented.',
    ],
    weakEvidence: [
      'Public spec needs release-candidate versioning and conformance badges.',
      'AOID public/private boundary needs one short explainer for non-cryptographers.',
    ],
    improveWithoutChangingPhilosophy: [
      'Publish a stable v0.1 spec bundle with canonical examples.',
      'Add conformance fixtures and implementation status badges.',
    ],
    doNotDo: [
      'Do not make a hosted registry mandatory for standard conformance.',
      'Do not turn AGID into a token-first naming scheme.',
    ],
  },
  'sdk-cli': {
    score: 74,
    grade: 'small-grant-ready',
    donationPitch: 'The SDK/CLI line can attract developer-infrastructure grants once install, test vector, and release instructions are simplified.',
    strongEvidence: [
      'Many SDK language targets are present.',
      'Generated parity vectors and scripts exist.',
      'CLI/OpenAPI direction is documented.',
    ],
    weakEvidence: [
      'The generated SDK surface needs a release matrix.',
      'Some language targets likely need real CI before external maintainers trust them.',
    ],
    improveWithoutChangingPhilosophy: [
      'Create a one-command conformance test for every SDK.',
      'Publish minimal package examples for JavaScript, Python, Rust, Go, Java, Swift, and Kotlin first.',
    ],
    doNotDo: [
      'Do not claim production-grade support for every generated SDK before CI proves it.',
    ],
  },
  'local-resolver': {
    score: 76,
    grade: 'medium-grant-ready',
    donationPitch: 'A local-first resolver is the strongest public-good story: address display and validation without a central tracking service.',
    strongEvidence: [
      'Local resolver, address rendering, language tabs, and official-source metadata are present.',
      'Regional stress tests and quality models exist.',
      'The project explicitly preserves Mode 0 Local Only.',
    ],
    weakEvidence: [
      'Coverage is broad but uneven across countries, territories, oceans, and natural features.',
      'The strongest quality claims need public benchmark fixtures and reproducible reports.',
    ],
    improveWithoutChangingPhilosophy: [
      'Publish a repeatable global address display benchmark with red/amber/green country coverage.',
      'Add small self-host data packs with license manifests.',
    ],
    doNotDo: [
      'Do not depend on proprietary geocoding APIs for the core resolver.',
      'Do not expose raw query logs in hosted mode.',
    ],
  },
  'address-element': {
    score: 70,
    grade: 'small-grant-ready',
    donationPitch: 'The Address Element is a practical adoption surface for EC, CMS, POS, and shopping agents if privacy-safe host events are stabilized.',
    strongEvidence: [
      'Embeddable component and AddressIntent model exist.',
      'Language, QR/NFC, correction, and quality-state requirements are defined.',
    ],
    weakEvidence: [
      'Host integration examples are not yet polished.',
      'Public event contracts need stronger no-raw-address fixtures.',
    ],
    improveWithoutChangingPhilosophy: [
      'Ship three working examples: static HTML, React checkout, and POS intake.',
      'Add event contract docs with redacted payload samples.',
    ],
    doNotDo: [
      'Do not leak raw AOID, AGID-S payload, proof code, or recipient secret to host pages.',
    ],
  },
  'basic-pos': {
    score: 69,
    grade: 'small-grant-ready',
    donationPitch: 'The POS reference app has public-interest value for stores, disaster sites, and delivery handoff, but needs hardened task flow and offline proofs.',
    strongEvidence: [
      'POS route, QR/NFC, language settings, device diagnostics, receipt, and handoff concepts exist.',
      'High-risk mode and local/offline mode are part of the design.',
    ],
    weakEvidence: [
      'The UI still needs a clearer operator task flow.',
      'Hardware integrations are mostly contracts and diagnostics rather than certified field deployments.',
    ],
    improveWithoutChangingPhilosophy: [
      'Refactor POS into Intake, Decision, Handoff, Devices, Queue, Reports, and Settings.',
      'Publish a local-only disaster handoff demo with fake data.',
    ],
    doNotDo: [
      'Do not require Ethereum, ZK, or hosted registry for basic scan-to-decision operation.',
      'Do not store precise high-risk addresses in receipts.',
    ],
  },
  'privacy-security': {
    score: 82,
    grade: 'medium-grant-ready',
    donationPitch: 'The privacy/security boundary is the strongest philosophical asset: no raw address logs, public/private separation, and anti-surveillance framing.',
    strongEvidence: [
      'Security/privacy design document exists.',
      'No-raw-address, public/private separation, high-risk mode, and ZK separation are documented.',
      'Open-core monetization rules protect safety controls from paywalls.',
    ],
    weakEvidence: [
      'External security audit and threat model sign-off are still missing.',
      'Secret scanning and release artifact scanning should become automated release gates.',
    ],
    improveWithoutChangingPhilosophy: [
      'Add a public threat model issue template and security policy.',
      'Run automated fixture scans for raw address, private keys, proof witness, and AGID-S payload leakage.',
    ],
    doNotDo: [
      'Do not add analytics that can reconstruct address use history.',
      'Do not make high-risk privacy controls paid.',
    ],
  },
  'zk-baseline': {
    score: 58,
    grade: 'small-donation-ready',
    donationPitch: 'ZK baseline is promising but not yet strong enough for large cryptography grants without circuit audits and reproducible witness tests.',
    strongEvidence: [
      'ZK address predicate papers and proof models exist.',
      'Circom/snarkjs fixture work exists.',
      'Nullifier, freshness, ownership, and bundle compatibility concepts are modeled.',
    ],
    weakEvidence: [
      'Production circuits and audited constraints are not mature.',
      'Proof generation UX and leakage analysis need deeper validation.',
    ],
    improveWithoutChangingPhilosophy: [
      'Scope the first grant to one simple circuit: area membership plus nullifier, with no raw address output.',
      'Publish public signal schemas and witness-handling rules.',
    ],
    doNotDo: [
      'Do not present ZK as proving real-world address truth by itself.',
      'Do not log witnesses in managed proof services.',
    ],
  },
  'docs-research': {
    score: 73,
    grade: 'small-grant-ready',
    donationPitch: 'The research corpus is unusually rich, but needs canonical paths and claim-status labels before it feels grant-review ready.',
    strongEvidence: [
      'Papers, verification notes, chapter notes, security docs, and product docs exist.',
      'Material governance and document index exist.',
      'The project distinguishes verified, unverified, and application-layer claims.',
    ],
    weakEvidence: [
      'The document set is still large and intimidating.',
      'Some claims need executive summaries and diagrams for non-technical grant reviewers.',
    ],
    improveWithoutChangingPhilosophy: [
      'Create a five-page funder brief and one technical appendix per funding package.',
      'Mark every major claim as verified, experimentally supported, design hypothesis, or future work.',
    ],
    doNotDo: [
      'Do not overclaim that address truth can be fully solved.',
      'Do not merge ZK, Ethereum, and AMT into one confusing promise.',
    ],
  },
};

export const PROFESSIONAL_REVIEWS: ProfessionalReview[] = [
  {
    role: 'Open-source maintainer',
    score: 73,
    seesAsFundableBecause: ['clear OSS/commercial boundary', 'SDK/test-vector direction', 'local-first principle'],
    doubts: ['too many files and generated artifacts', 'maintainer onboarding path is not yet obvious'],
    nextProofNeeded: ['CONTRIBUTING quickstart', 'good first issue labels', 'release checklist'],
  },
  {
    role: 'Security engineer',
    score: 76,
    seesAsFundableBecause: ['privacy/security model is explicit', 'no-raw-address invariants are testable'],
    doubts: ['needs automated secret and fixture scans', 'needs external threat model review'],
    nextProofNeeded: ['SECURITY.md', 'threat model table', 'release artifact scanner'],
  },
  {
    role: 'Privacy lawyer / DPO',
    score: 70,
    seesAsFundableBecause: ['data minimization and purpose scope are central', 'Portal revocation/export/delete is not paywalled'],
    doubts: ['jurisdictional compliance is not proven', 'retention and controller/processor roles need policy docs'],
    nextProofNeeded: ['DPIA-style privacy impact note', 'data retention matrix', 'subprocessor-free local mode statement'],
  },
  {
    role: 'Humanitarian program officer',
    score: 72,
    seesAsFundableBecause: ['offline and high-risk modes fit disaster and displacement use cases', 'AGID-S avoids public precise locations'],
    doubts: ['needs field pilot story and local partner workflow', 'must avoid surveillance misuse'],
    nextProofNeeded: ['humanitarian scenario demo', 'do-no-harm checklist', 'offline conflict protocol'],
  },
  {
    role: 'Logistics / POS operator',
    score: 67,
    seesAsFundableBecause: ['POS handoff, QR/NFC, receipt, and device diagnostics are practical'],
    doubts: ['operator UI still needs fewer decisions per scan', 'hardware support is early'],
    nextProofNeeded: ['five-minute POS demo', 'offline queue test', 'printer/scanner diagnostic matrix'],
  },
  {
    role: 'Public-sector CIO',
    score: 66,
    seesAsFundableBecause: ['self-hosting and standards-first design reduce vendor lock-in'],
    doubts: ['needs procurement-grade security, accessibility, and data-license reports'],
    nextProofNeeded: ['deployment guide', 'accessibility audit', 'data license bill of materials'],
  },
  {
    role: 'Developer advocate',
    score: 68,
    seesAsFundableBecause: ['Address Element and SDKs can become adoption funnels'],
    doubts: ['quickstarts and examples are not yet simple enough'],
    nextProofNeeded: ['copy-paste examples', 'host app demo', 'API playground'],
  },
  {
    role: 'Grant program officer',
    score: 71,
    seesAsFundableBecause: ['public benefit is clear if scoped to local resolver, privacy, and humanitarian workflows'],
    doubts: ['scope is too wide for one grant', 'needs concrete milestone budget'],
    nextProofNeeded: ['three milestone packages under 6 months', 'impact metrics', 'letters of interest'],
  },
  {
    role: 'Accessibility / UX reviewer',
    score: 62,
    seesAsFundableBecause: ['operator clarity and language coverage are identified goals'],
    doubts: ['needs formal accessibility testing and simpler information hierarchy'],
    nextProofNeeded: ['keyboard-only scan flow', 'screen-reader labels', 'WCAG-focused audit'],
  },
  {
    role: 'Academic researcher',
    score: 75,
    seesAsFundableBecause: ['AMT, impossibility, lineage, and ZK predicate separation are publishable research angles'],
    doubts: ['proof/experiment status must be labeled rigorously'],
    nextProofNeeded: ['claim status table', 'reproducible Lean/GIS notebook', 'short academic abstract'],
  },
  {
    role: 'Crypto infrastructure engineer',
    score: 64,
    seesAsFundableBecause: ['ZK/Ethereum are optional verification layers instead of the core product'],
    doubts: ['circuits and verifier contracts need narrower scope and audit'],
    nextProofNeeded: ['one audited minimal circuit', 'public signals leakage test', 'L2 registry demo without raw location'],
  },
  {
    role: 'Data governance lead',
    score: 70,
    seesAsFundableBecause: ['data licensing and source governance are already tracked'],
    doubts: ['needs clearer provenance for every bundled dataset and deletion policy for evidence'],
    nextProofNeeded: ['DATA_LICENSES completeness report', 'source freshness policy', 'evidence retention defaults'],
  },
];

export const FUNDING_OPPORTUNITIES: FundingOpportunity[] = [
  {
    id: 'nlnet-open-internet',
    organization: 'NLnet Foundation',
    programOrService: 'Open calls / NGI-aligned funds',
    fit: 'high',
    probability: 'medium-high',
    officialRange: 'EUR 5,000-50,000, with possible scale-up if potential is proven',
    realisticAsk: 'EUR 25,000-50,000 for Local Resolver + Address Element + privacy test vectors',
    bestOpenSourcePackage: 'Local Resolver and Address Element: self-hostable address display, language tabs, postal assist, and no-raw-address tests.',
    whyItFits: [
      'Free/open source requirement matches the planned AGID core.',
      'Privacy-preserving, resilient internet infrastructure framing fits.',
      'Security/accessibility audit support would be useful.',
    ],
    blockers: [
      'Need a small milestone scope instead of the whole platform.',
      'Need a release-candidate spec and simple demo.',
    ],
    sourceUrl: 'https://nlnet.nl/funding.html',
  },
  {
    id: 'otf-internet-freedom',
    organization: 'Open Technology Fund',
    programOrService: 'Internet Freedom Fund / FOSS Sustainability Fund',
    fit: 'medium',
    probability: 'medium',
    officialRange: 'Internet Freedom Fund awards are USD 10,000-900,000 for up to 24 months; FOSS Sustainability Fund scopes can range from single-maintainer support to USD 400,000 ecosystem work',
    realisticAsk: 'USD 50,000-150,000 for AGID-S high-risk sharing, Portal revocation, local/offline POS, and anti-surveillance audits',
    bestOpenSourcePackage: 'Anti-surveillance address sharing: AGID-S, high-risk mode, no raw address logs, offline proof and revocation UX.',
    whyItFits: [
      'The project explicitly addresses censorship and surveillance risks.',
      'Local/offline and privacy-preserving operation can help at-risk users.',
      'OTF offers security, UX, and impact labs that match current gaps.',
    ],
    blockers: [
      'Must not look like a generic logistics or crypto product.',
      'Needs a narrow threat model and at-risk user research.',
    ],
    sourceUrl: 'https://www.opentech.fund/',
  },
  {
    id: 'sovereign-tech',
    organization: 'Sovereign Tech Agency',
    programOrService: 'Sovereign Tech Fund / Resilience / Standards',
    fit: 'medium',
    probability: 'low',
    officialRange: 'Project-specific strategic investments; no simple public fixed range on the homepage',
    realisticAsk: 'EUR 75,000-200,000 only after adoption evidence, security hardening, and standards work are clearer',
    bestOpenSourcePackage: 'Open address interoperability components: resolver, specs, conformance tests, data-license tooling, and security hardening.',
    whyItFits: [
      'Open digital infrastructure and standards are central to the program mission.',
      'AGID could become reusable infrastructure if the core is simplified and adopted.',
    ],
    blockers: [
      'Currently too early and too broad for a critical-infrastructure claim.',
      'Needs external users, maintainers, and security maturity.',
    ],
    sourceUrl: 'https://www.sovereign.tech/',
  },
  {
    id: 'openssf-alpha-omega',
    organization: 'OpenSSF / Alpha-Omega',
    programOrService: 'Open source security hardening partnerships',
    fit: 'low',
    probability: 'very-low',
    officialRange: 'Partnership/security-work funding, not a normal small-project donation pipeline',
    realisticAsk: 'USD 0 now; later request audit support or targeted hardening only after meaningful adoption',
    bestOpenSourcePackage: 'Security hardening: secret scanning, dependency review, no-raw-address tests, reproducible release artifacts.',
    whyItFits: [
      'The project is security-sensitive and would benefit from systemic hardening.',
      'OpenSSF/Alpha-Omega focuses on critical open-source security improvements.',
    ],
    blockers: [
      'AGID is not yet critical open-source infrastructure.',
      'Needs users, downstream dependency evidence, and a mature security process.',
    ],
    sourceUrl: 'https://alpha-omega.dev/',
  },
  {
    id: 'ethereum-esp',
    organization: 'Ethereum Foundation',
    programOrService: 'Ecosystem Support Program',
    fit: 'medium',
    probability: 'low',
    officialRange: 'No fixed public range; milestone-based and scope-dependent',
    realisticAsk: 'USD 20,000-80,000 equivalent for ZK address predicate schemas or privacy-preserving registry prototypes',
    bestOpenSourcePackage: 'ZK Address Predicate baseline: public signal schemas, nullifier/freshness proofs, verifier examples without token-first positioning.',
    whyItFits: [
      'Free, open-source, non-commercial builder infrastructure is in scope.',
      'ZK and registry primitives can strengthen Ethereum-adjacent tooling.',
    ],
    blockers: [
      'Must avoid pitching AGID as an address cryptocurrency.',
      'Needs a narrower Ethereum-specific deliverable.',
    ],
    sourceUrl: 'https://esp.ethereum.foundation/applicants',
  },
  {
    id: 'web3-foundation',
    organization: 'Web3 Foundation',
    programOrService: 'W3F Grants Program',
    fit: 'medium',
    probability: 'medium',
    officialRange: 'Level 1 up to USD 10,000; Level 2 up to USD 30,000; Level 3 unlimited with stricter approvals',
    realisticAsk: 'USD 10,000-30,000 for Polkadot adapter, ZK proof bundle registry, or revocation/freshness anchoring prototype',
    bestOpenSourcePackage: 'Polkadot adapter and proof bundle registry with public tests and no raw address payloads.',
    whyItFits: [
      'Grant levels match early adapter work.',
      'AGID has already considered Polkadot/ZK registry separation.',
    ],
    blockers: [
      'Polkadot-specific benefit must be concrete.',
      'At least half payment may be vested DOT under current grant rules.',
    ],
    sourceUrl: 'https://github.com/w3f/Grants-Program',
  },
  {
    id: 'unicef-venture-fund',
    organization: 'UNICEF Venture Fund',
    programOrService: 'Open-source frontier tech investments',
    fit: 'medium',
    probability: 'low',
    officialRange: 'Up to USD 100,000 seed; graduates can receive up to USD 400,000 growth funding',
    realisticAsk: 'USD 0-100,000 only if framed as a child/humanitarian field deployment with an eligible startup/entity and underserved-market pilot',
    bestOpenSourcePackage: 'Humanitarian Address Safety Kit: offline field handoff, AGID-S, reachability reports, and do-no-harm privacy defaults.',
    whyItFits: [
      'Open-source frontier technology and underserved-market impact fit some AGID humanitarian use cases.',
      'Geospatial and blockchain-adjacent portfolio examples exist.',
    ],
    blockers: [
      'Eligibility and impact must fit UNICEF calls; generic address infrastructure is not enough.',
      'Needs partner/pilot in an underserved market.',
    ],
    sourceUrl: 'https://www.unicefventurefund.org/',
  },
  {
    id: 'gitcoin-grants',
    organization: 'Gitcoin',
    programOrService: 'Gitcoin Grants / public goods rounds',
    fit: 'medium',
    probability: 'medium',
    officialRange: 'Round-dependent community donations and matching; no stable fixed amount',
    realisticAsk: 'USD 1,000-20,000 early community support; more only after demos, users, and credibility',
    bestOpenSourcePackage: 'Public-good demo package: local resolver, Address Element, AGID-S, and optional ZK registry examples.',
    whyItFits: [
      'Public goods funding and Ethereum-adjacent open-source communities are relevant.',
      'Small recurring supporters can validate interest before institutional grants.',
    ],
    blockers: [
      'Needs a concise public story and demo.',
      'Avoid token speculation and donation farming.',
    ],
    sourceUrl: 'https://grants.gitcoin.co/',
  },
  {
    id: 'digital-public-goods-alliance',
    organization: 'Digital Public Goods Alliance',
    programOrService: 'DPG Standard / Registry recognition',
    fit: 'medium',
    probability: 'medium',
    officialRange: 'Recognition, discovery, and credibility rather than direct grant funding',
    realisticAsk: 'USD 0 direct; use recognition to improve NLnet/UNICEF/public-sector credibility',
    bestOpenSourcePackage: 'Digital public good candidate: open source resolver, privacy law alignment, do-no-harm design, and SDG/humanitarian use cases.',
    whyItFits: [
      'Open software, privacy, best practices, and do-no-harm map well to AGID philosophy.',
      'Recognition can make later grants easier.',
    ],
    blockers: [
      'Needs clearer do-no-harm and privacy compliance evidence.',
      'Needs stable public documentation and deployment instructions.',
    ],
    sourceUrl: 'https://www.digitalpublicgoods.net/standard',
  },
];

export function getOpenSourceDonationReadiness(): DonationReadinessAssessment {
  const areaReadiness = OPEN_SOURCE_FEATURE_AREAS.map(area => ({
    areaId: area.id,
    label: area.label,
    ...AREA_READINESS_BY_ID[area.id],
  }));
  const overallScore = Math.round(areaReadiness.reduce((total, area) => total + area.score, 0) / areaReadiness.length);

  return {
    version: OPEN_SOURCE_DONATION_READINESS_VERSION,
    overallScore,
    overallGrade: 'small-grant-ready',
    conclusion: 'The open-source core is credible for small donations and focused small-to-medium grants, but not yet ready for large institutional funding without canonical releases, public demos, external security review, and adoption evidence.',
    principlesNotToBend: [
      'Mode 0 Local Only must remain real.',
      'Do not require ZK, Ethereum, hosted registry, or paid services for basic operation.',
      'Do not store raw address, raw AOID, AGID-S payloads, proof witness, or recipient secrets in public logs.',
      'Do not make high-risk privacy controls, revocation, deletion, export, or local decryption paid.',
      'Do not reposition AGID/AOID as a token-first crypto project.',
    ],
    areaReadiness,
    professionalReviews: PROFESSIONAL_REVIEWS.map(review => ({
      ...review,
      seesAsFundableBecause: [...review.seesAsFundableBecause],
      doubts: [...review.doubts],
      nextProofNeeded: [...review.nextProofNeeded],
    })),
    fundingOpportunities: FUNDING_OPPORTUNITIES.map(opportunity => ({
      ...opportunity,
      whyItFits: [...opportunity.whyItFits],
      blockers: [...opportunity.blockers],
    })),
    firstFundingPackages: [
      'NLnet package: Local Resolver + Address Element + no-raw-address conformance tests.',
      'OTF package: AGID-S high-risk sharing + Portal revocation + offline POS disaster workflow.',
      'W3F package: Polkadot adapter + proof bundle registry + revocation/freshness anchoring.',
      'Ethereum ESP package: minimal ZK Address Predicate public-signal schema and verifier example.',
      'DPGA/UNICEF package: Humanitarian Address Safety Kit with do-no-harm and local-first operation.',
    ],
  };
}

export function validateOpenSourceDonationReadiness(
  assessment = getOpenSourceDonationReadiness(),
): DonationReadinessValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const expectedAreaIds = new Set(OPEN_SOURCE_FEATURE_AREAS.map(area => area.id));
  const actualAreaIds = new Set<string>();

  if (assessment.overallScore < 65 || assessment.overallScore > 80) {
    warnings.push(`unexpected-overall-score:${assessment.overallScore}`);
  }
  if (assessment.overallGrade !== 'small-grant-ready') {
    errors.push(`unexpected-overall-grade:${assessment.overallGrade}`);
  }

  for (const area of assessment.areaReadiness) {
    if (actualAreaIds.has(area.areaId)) errors.push(`duplicate-area:${area.areaId}`);
    actualAreaIds.add(area.areaId);
    if (!expectedAreaIds.has(area.areaId)) errors.push(`unknown-area:${area.areaId}`);
    if (area.score < 0 || area.score > 100) errors.push(`invalid-score:${area.areaId}`);
    if (!area.donationPitch.trim()) errors.push(`missing-pitch:${area.areaId}`);
    if (!area.improveWithoutChangingPhilosophy.length) errors.push(`missing-improvement:${area.areaId}`);
    if (!area.doNotDo.length) errors.push(`missing-do-not-do:${area.areaId}`);
  }
  for (const expected of expectedAreaIds) {
    if (!actualAreaIds.has(expected)) errors.push(`missing-area:${expected}`);
  }

  for (const review of assessment.professionalReviews) {
    if (review.score < 0 || review.score > 100) errors.push(`invalid-professional-score:${review.role}`);
    if (!review.seesAsFundableBecause.length) errors.push(`missing-professional-upside:${review.role}`);
    if (!review.doubts.length) errors.push(`missing-professional-doubts:${review.role}`);
    if (!review.nextProofNeeded.length) errors.push(`missing-professional-proof:${review.role}`);
  }

  for (const opportunity of assessment.fundingOpportunities) {
    if (!opportunity.organization.trim()) errors.push(`missing-funder-organization:${opportunity.id}`);
    if (!opportunity.programOrService.trim()) errors.push(`missing-funder-program:${opportunity.id}`);
    if (!opportunity.realisticAsk.trim()) errors.push(`missing-realistic-ask:${opportunity.id}`);
    if (!/^https:\/\//.test(opportunity.sourceUrl)) errors.push(`missing-source-url:${opportunity.id}`);
    if (!opportunity.blockers.length) errors.push(`missing-funder-blockers:${opportunity.id}`);
  }

  const allText = JSON.stringify(assessment).toLowerCase();
  if (allText.includes('token-first')) {
    const doNotDoContext = assessment.principlesNotToBend.join(' ').toLowerCase() + assessment.areaReadiness.flatMap(area => area.doNotDo).join(' ').toLowerCase();
    if (!doNotDoContext.includes('token-first')) errors.push('token-first-mentioned-outside-guardrail');
  }
  if (!assessment.principlesNotToBend.some(rule => /Local Only/i.test(rule))) {
    errors.push('missing-local-only-principle');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
