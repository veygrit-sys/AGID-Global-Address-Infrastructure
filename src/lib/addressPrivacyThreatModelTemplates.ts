import { scanNoRawAddressReleaseText } from './noRawAddressReleaseScan';
import { stableJson } from './redactedWorkflowCore';

export const ADDRESS_PRIVACY_THREAT_MODEL_TEMPLATES_VERSION = 'address-privacy-threat-model-templates-v0.1';

export const ADDRESS_PRIVACY_THREAT_TEMPLATE_IDS = [
  'address-element-registration',
  'address-portal-consent',
  'pos-terminal-handoff',
  'field-handoff-offline',
  'evidence-vault-local-ocr',
  'hosted-registry-webhooks',
  'zk-address-predicate',
  'agid-s-qr-nfc',
  'locker-pudo-simulator',
  'developer-console-fixtures',
] as const;

export type AddressPrivacyThreatTemplateId = typeof ADDRESS_PRIVACY_THREAT_TEMPLATE_IDS[number];

export type AddressPrivacyThreatCategory =
  | 'linkability'
  | 'identifiability'
  | 'detectability'
  | 'information-disclosure'
  | 'unawareness'
  | 'non-compliance'
  | 'spoofing'
  | 'tampering'
  | 'repudiation'
  | 'denial-of-service'
  | 'privilege-abuse';

export type AddressPrivacySeverity = 'low' | 'medium' | 'high' | 'critical';

export type AddressPrivacyThreatTemplate = {
  id: AddressPrivacyThreatTemplateId;
  title: string;
  surface: string;
  mode: 'local-only' | 'local-plus-server' | 'zk-only' | 'ethereum-registry' | 'full-zk-ethereum' | 'mixed';
  ownerRole: string;
  reviewCadence: string;
  privacyGoal: string;
  nonGoals: string[];
  protectedAssets: string[];
  trustBoundaries: string[];
  attackerControlledInputs: string[];
  misuseCases: Array<{
    id: string;
    title: string;
    categories: AddressPrivacyThreatCategory[];
    severity: AddressPrivacySeverity;
    scenario: string;
    primaryControls: string[];
    verification: string[];
  }>;
  requiredInvariants: string[];
  dataMinimizationRules: string[];
  safePublicOutputs: string[];
  forbiddenOutputs: string[];
  highRiskModeRequirements: string[];
  openQuestions: string[];
  verificationCommands: string[];
};

export type AddressPrivacyThreatModelChecklist = {
  role: 'developer' | 'security-reviewer' | 'privacy-reviewer' | 'operator' | 'auditor';
  requiredActions: string[];
};

export type AddressPrivacyThreatModelTemplateFile = {
  path: string;
  role: 'manifest' | 'templates' | 'checklists' | 'markdown' | 'documentation';
  mediaType: 'application/json' | 'text/markdown';
  licenseOrTerms: 'Apache-2.0';
  containsPersonalData: false;
  containsRawAddressData: false;
  containsThirdPartyData: false;
};

export type AddressPrivacyThreatModelTemplatePack = {
  manifest: {
    kitId: 'address-privacy-threat-model-templates';
    version: typeof ADDRESS_PRIVACY_THREAT_MODEL_TEMPLATES_VERSION;
    generatedAt: string;
    licenseOrTerms: 'Apache-2.0';
    privacyPosition: string;
    files: AddressPrivacyThreatModelTemplateFile[];
    counts: {
      templates: number;
      checklists: number;
      misuseCases: number;
      requiredInvariants: number;
    };
  };
  templates: AddressPrivacyThreatTemplate[];
  checklists: AddressPrivacyThreatModelChecklist[];
};

export type AddressPrivacyThreatModelTemplateValidation = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

const GENERATED_AT = '2026-06-20T00:00:00.000Z';

const COMMON_INVARIANTS = [
  'No raw address, raw AOID, AGID-S payload, proof code, recipient secret, precise private coordinates, or witness material crosses public or shared boundaries by default.',
  'AOID must not become a global public tracking identifier.',
  'Purpose, audience, and retention must be explicit before any disclosure leaves local state.',
  'High-risk mode prefers coarse disclosure, short-lived aliases, local proof checks, immediate revocation or used-state marking, and no address-history retention.',
];

const COMMON_FORBIDDEN_OUTPUTS = [
  'plain address body',
  'raw AOID body',
  'AGID-S plaintext or production ciphertext',
  'recipient name',
  'phone number',
  'unit or room detail',
  'proof code',
  'proof witness',
  'private key or device secret',
  'precise private coordinate',
];

const COMMON_SAFE_OUTPUTS = [
  'addressCommitment',
  'aoidCommitment',
  'shortAlias',
  'waybillAlias',
  'issuerRef',
  'revocationRoot',
  'freshnessRoot',
  'nullifierHash',
  'redactedEvidenceRef',
  'coarseRegionCode',
  'publicProofSignals',
];

function misuse(
  templateId: AddressPrivacyThreatTemplateId,
  index: number,
  title: string,
  categories: AddressPrivacyThreatCategory[],
  severity: AddressPrivacySeverity,
  scenario: string,
  primaryControls: string[],
  verification: string[],
) {
  return {
    id: `${templateId}-tm-${String(index).padStart(2, '0')}`,
    title,
    categories,
    severity,
    scenario,
    primaryControls,
    verification,
  };
}

function template(
  value: Omit<AddressPrivacyThreatTemplate, 'requiredInvariants' | 'safePublicOutputs' | 'forbiddenOutputs'> & {
    requiredInvariants?: string[];
    safePublicOutputs?: string[];
    forbiddenOutputs?: string[];
  },
): AddressPrivacyThreatTemplate {
  return {
    ...value,
    requiredInvariants: [...COMMON_INVARIANTS, ...(value.requiredInvariants ?? [])],
    safePublicOutputs: [...COMMON_SAFE_OUTPUTS, ...(value.safePublicOutputs ?? [])],
    forbiddenOutputs: [...COMMON_FORBIDDEN_OUTPUTS, ...(value.forbiddenOutputs ?? [])],
  };
}

export const ADDRESS_PRIVACY_THREAT_MODEL_TEMPLATES: AddressPrivacyThreatTemplate[] = [
  template({
    id: 'address-element-registration',
    title: 'Address Element / Registration Threat Model',
    surface: 'Embedded address entry, postal assist, AGID assist, correction feedback',
    mode: 'local-only',
    ownerRole: 'Frontend and privacy engineer',
    reviewCadence: 'Every public widget release and every new host integration',
    privacyGoal: 'Let users enter or correct an address locally while public host events expose only quality state, country, language, and commitments.',
    nonGoals: ['Prove legal residence', 'Store a public address book', 'Train on private corrections without explicit opt-in'],
    protectedAssets: ['address draft', 'correction feedback', 'language preference', 'postal assist candidates', 'addressCommitment'],
    trustBoundaries: ['browser component to host page', 'local state to telemetry', 'manual edit to feedback queue', 'postal assist adapter to UI'],
    attackerControlledInputs: ['host page props', 'paste/upload text', 'postal code field', 'AGID field', 'feedback text', 'language switch'],
    misuseCases: [
      misuse('address-element-registration', 1, 'Host page exfiltrates raw draft through events', ['information-disclosure', 'unawareness'], 'critical', 'A merchant embeds the element and records each keystroke or correction as plain text.', ['emit redacted events only', 'host contract forbids raw draft callbacks', 'local-only default state'], ['verify:address-element', 'verify:no-raw-address']),
      misuse('address-element-registration', 2, 'Feedback becomes a private address training feed', ['non-compliance', 'unawareness'], 'high', 'Correction feedback is synced and reused for learning without consent or redaction.', ['explicit opt-in', 'feedback categories before free text', 'redaction and retention policy'], ['verify:address-registration', 'manual DPIA review']),
    ],
    dataMinimizationRules: ['Keep draft text in component state until explicit submit.', 'Host events carry commitment, status, country, language, and issue category only.'],
    highRiskModeRequirements: ['Disable external telemetry.', 'Do not persist history.', 'Prefer coarse AGID or AGID-S handoff.'],
    openQuestions: ['Which host event names are stable public API?', 'Which feedback categories can be learned without private text?'],
    verificationCommands: ['npm run verify:address-element', 'npm run verify:address-registration', 'npm run verify:no-raw-address'],
  }),
  template({
    id: 'address-portal-consent',
    title: 'Address Portal Consent Threat Model',
    surface: 'User consent, scope, revoke, delete, export, and Address Item management',
    mode: 'local-plus-server',
    ownerRole: 'Product privacy and identity engineer',
    reviewCadence: 'Every new scope, issuer, export type, or deletion workflow',
    privacyGoal: 'Let a user see, revoke, delete, and export who may use address-derived facts without exposing the address itself.',
    nonGoals: ['Make revocation paid-only', 'Let a third party silently expand scopes', 'Use AOID as a public profile id'],
    protectedAssets: ['address item', 'scope grant', 'issuer link', 'revocation state', 'export package'],
    trustBoundaries: ['portal local storage to registry', 'user consent screen to relying party', 'export package to user device'],
    attackerControlledInputs: ['relying party scope request', 'redirect URL', 'issuer metadata', 'export filter', 'revocation callback'],
    misuseCases: [
      misuse('address-portal-consent', 1, 'Scope confusion grants more than the user understood', ['unawareness', 'privilege-abuse'], 'high', 'A relying party requests delivery and identity scopes with misleading UI copy.', ['scope labels are human-readable', 'purpose binding', 'deny by default for unknown scopes'], ['verify:portal']),
      misuse('address-portal-consent', 2, 'Export leaks private address material', ['information-disclosure', 'non-compliance'], 'critical', 'A user export includes raw AOID body, private evidence, or proof secrets.', ['redacted export manifest', 'field allowlist', 'no-raw-address scan'], ['verify:portal', 'verify:no-raw-address']),
    ],
    dataMinimizationRules: ['Portal lists relying parties and scopes, not raw address text.', 'Export defaults to commitments and references unless user explicitly requests local private backup.'],
    highRiskModeRequirements: ['One-click revoke.', 'No history retention after high-risk handoff.', 'Short alias display only.'],
    openQuestions: ['Which scopes are mandatory for each integration?', 'What export format is safe for nontechnical users?'],
    verificationCommands: ['npm run verify:portal', 'npm run verify:no-raw-address'],
  }),
  template({
    id: 'pos-terminal-handoff',
    title: 'POS Terminal Handoff Threat Model',
    surface: 'Scan -> Decision -> Handoff -> Report',
    mode: 'mixed',
    ownerRole: 'POS engineer and operations security reviewer',
    reviewCadence: 'Every device integration, payment or carrier handoff release',
    privacyGoal: 'Let staff decide whether to accept, reject, or complete a handoff without storing address bodies or reusable proof secrets.',
    nonGoals: ['Replace carrier compliance systems', 'Store customer address history in POS logs'],
    protectedAssets: ['QR/NFC intake', 'waybill alias', 'recipient proof status', 'terminal signature', 'handoff receipt'],
    trustBoundaries: ['scanner to POS runtime', 'POS to registry', 'POS to printer', 'offline queue to sync service'],
    attackerControlledInputs: ['QR payload', 'NFC payload', 'barcode', 'operator override', 'printer template', 'offline sync batch'],
    misuseCases: [
      misuse('pos-terminal-handoff', 1, 'Copied QR is reused after the handoff', ['spoofing', 'linkability'], 'high', 'An attacker screenshots a QR and replays it at a different counter.', ['jti or nullifier required', 'short alias TTL', 'challenge-response for high-risk flows'], ['verify:pos-ui', 'verify:mandatory-security']),
      misuse('pos-terminal-handoff', 2, 'Audit report stores the private delivery payload', ['information-disclosure', 'repudiation'], 'critical', 'The report stores QR body, address text, proof code, or recipient details.', ['redacted receipt schema', 'terminal signature', 'no raw payload persistence'], ['verify:pos-ui', 'verify:no-raw-address']),
    ],
    dataMinimizationRules: ['Reports store terminal signature, alias, status, roots, and commitments only.', 'Printers receive formatted redacted receipt output.'],
    highRiskModeRequirements: ['Require recipient live proof.', 'Short alias TTL.', 'No precise address on printed receipt.'],
    openQuestions: ['Which terminals need hardware key storage?', 'Which carriers accept recipient proof status without full address disclosure?'],
    verificationCommands: ['npm run verify:pos-ui', 'npm run verify:mandatory-security', 'npm run verify:no-raw-address'],
  }),
  template({
    id: 'field-handoff-offline',
    title: 'Field Handoff / Offline Sync Threat Model',
    surface: 'Mobile field handoff, reachability, offline queue, CRDT sync',
    mode: 'local-only',
    ownerRole: 'Field operations and sync engineer',
    reviewCadence: 'Every offline queue, conflict resolution, or reachability change',
    privacyGoal: 'Keep field operation usable during network loss while preventing offline queues from becoming raw address dumps.',
    nonGoals: ['Publish exact delivery destinations', 'Guarantee legal identity without issuer credential'],
    protectedAssets: ['offline receipt', 'nullifier used state', 'reachability category', 'device signature', 'sync vector'],
    trustBoundaries: ['field device to local queue', 'local queue to server sync', 'reachability report to public map', 'recipient proof to receipt'],
    attackerControlledInputs: ['offline batch', 'device clock', 'carrier note', 'reachability report', 'conflict resolution choice'],
    misuseCases: [
      misuse('field-handoff-offline', 1, 'Offline queue is stolen from device storage', ['information-disclosure', 'linkability'], 'critical', 'A lost field device contains queue records with private destinations or proof secrets.', ['encrypted local queue', 'redacted receipt only', 'device wipe and key rotation'], ['verify:offline-field-kit']),
      misuse('field-handoff-offline', 2, 'Reachability reports expose vulnerable locations', ['detectability', 'information-disclosure'], 'high', 'A public cannot-reach report reveals a precise home, shelter, or high-risk route.', ['coarse public projection', 'private operator receipt', 'high-risk mode'], ['verify:offline-field-kit', 'verify:no-raw-address']),
    ],
    dataMinimizationRules: ['Conflict records carry aliases, nullifiers, vector clocks, and redacted reasons.', 'Public reachability reports use category and coarse region.'],
    highRiskModeRequirements: ['Disable precise telemetry.', 'Keep reports local until reviewed.', 'Prefer AGID-S or coarse area proof.'],
    openQuestions: ['How long can local queues survive before requiring review?', 'Which conflict states require human review?'],
    verificationCommands: ['npm run verify:offline-field-kit', 'npm run verify:field-handoff', 'npm run verify:no-raw-address'],
  }),
  template({
    id: 'evidence-vault-local-ocr',
    title: 'Evidence Vault / Local OCR Threat Model',
    surface: 'Photo/PDF OCR, redaction, encrypted evidence, proof of possession',
    mode: 'local-only',
    ownerRole: 'Evidence vault and privacy engineer',
    reviewCadence: 'Every OCR model, file parser, evidence export, or retention policy change',
    privacyGoal: 'Let users prove possession or extract address candidates without uploading documents to relying-party servers by default.',
    nonGoals: ['Make uploaded documents public fixtures', 'Train OCR on private evidence without explicit consent'],
    protectedAssets: ['source document', 'OCR draft', 'redacted evidence reference', 'document commitment', 'retention policy'],
    trustBoundaries: ['file picker to local OCR', 'OCR draft to editable form', 'evidence vault to verifier', 'encrypted storage to export'],
    attackerControlledInputs: ['PDF', 'image file', 'OCR text', 'redaction mask', 'export request', 'malformed metadata'],
    misuseCases: [
      misuse('evidence-vault-local-ocr', 1, 'OCR draft leaks to server logs', ['information-disclosure', 'non-compliance'], 'critical', 'A document parser or debug logger sends extracted address text to a server.', ['local OCR default', 'debug log redaction', 'server upload opt-in'], ['verify:evidence-vault', 'verify:no-raw-address']),
      misuse('evidence-vault-local-ocr', 2, 'Verifier receives the source document unnecessarily', ['unawareness', 'information-disclosure'], 'high', 'A relying party asks for the full file when a commitment or predicate proof is enough.', ['redacted evidence reference', 'proof of possession', 'explicit disclosure confirmation'], ['verify:evidence-vault']),
    ],
    dataMinimizationRules: ['OCR text is editable local draft until user confirms.', 'Verifier receives commitment, status, or proof instead of the document by default.'],
    highRiskModeRequirements: ['No cloud OCR.', 'No persistent source document unless encrypted.', 'Short retention and local delete path.'],
    openQuestions: ['Which file types are supported safely?', 'Which evidence classes require legal hold controls?'],
    verificationCommands: ['npm run verify:evidence-vault', 'npm run verify:no-raw-address'],
  }),
  template({
    id: 'hosted-registry-webhooks',
    title: 'Hosted Registry API / Webhooks Threat Model',
    surface: 'Issuer, revocation, freshness, nullifier, used-state, webhooks',
    mode: 'local-plus-server',
    ownerRole: 'Registry backend and platform security engineer',
    reviewCadence: 'Every registry schema, webhook event, endpoint discovery, or adapter release',
    privacyGoal: 'Provide public verification state without turning the registry into a plaintext address or AOID database.',
    nonGoals: ['Store address bodies', 'Store AOID plaintext', 'Publish full AGID-S payloads'],
    protectedAssets: ['issuer metadata', 'credential commitment', 'revocation root', 'freshness root', 'nullifier hash', 'webhook signature'],
    trustBoundaries: ['client to registry API', 'registry to webhook receiver', 'admin dashboard to registry', 'registry to cache'],
    attackerControlledInputs: ['webhook URL', 'issuer metadata', 'credential status update', 'nullifier submission', 'API key label'],
    misuseCases: [
      misuse('hosted-registry-webhooks', 1, 'Webhook payload carries private address data', ['information-disclosure', 'non-compliance'], 'critical', 'A webhook event includes address text, AOID body, or QR/NFC payload.', ['webhook allowlist schema', 'payload scanner', 'signature over redacted body'], ['verify:dashboard', 'verify:no-raw-address']),
      misuse('hosted-registry-webhooks', 2, 'Nullifier reused across contexts links users', ['linkability', 'detectability'], 'high', 'A relying party correlates the same nullifier across delivery, aid, and identity contexts.', ['domain-separated nullifiers', 'purpose-specific registry buckets', 'privacy review before new domain'], ['verify:dashboard', 'verify:zk-baseline']),
    ],
    dataMinimizationRules: ['Registry stores roots, commitments, nullifiers, statuses, and policy hashes only.', 'Webhook logs mask bodies by default.'],
    highRiskModeRequirements: ['Delayed or batched public anchoring.', 'No raw event payload retention.', 'Strict domain separation.'],
    openQuestions: ['Which event types need public transparency?', 'What retention period is needed for used-state records?'],
    verificationCommands: ['npm run verify:dashboard', 'npm run verify:no-raw-address', 'npm run verify:mandatory-security'],
  }),
  template({
    id: 'zk-address-predicate',
    title: 'ZK Address Predicate Threat Model',
    surface: 'Private address, residence, delivery eligibility, AOID ownership, and PID audit proofs',
    mode: 'zk-only',
    ownerRole: 'Cryptography engineer and privacy reviewer',
    reviewCadence: 'Every proof relation, public signal schema, circuit, or verifier release',
    privacyGoal: 'Prove address-derived facts without revealing the address, AOID body, exact location, witness, or private credential material.',
    nonGoals: ['Claim production cryptographic assurance without audit', 'Use ZK to prove real-world truth without issuer/evidence model'],
    protectedAssets: ['witness', 'credential secret', 'private salt', 'AOID secret', 'address predicate', 'nullifier secret'],
    trustBoundaries: ['witness builder to prover', 'prover to verifier', 'public signal schema to registry', 'proof bundle to relying party'],
    attackerControlledInputs: ['challenge', 'public statement', 'issuer root', 'area root', 'revocation root', 'proof bundle composition'],
    misuseCases: [
      misuse('zk-address-predicate', 1, 'Public signals leak a unique location', ['identifiability', 'information-disclosure'], 'critical', 'The public statement exposes a region, timestamp, or predicate so narrow that it identifies the holder.', ['minimum anonymity threshold', 'coarse predicate policies', 'public signal review'], ['verify:zk-baseline']),
      misuse('zk-address-predicate', 2, 'Cross-proof nullifier links unrelated actions', ['linkability'], 'critical', 'The same nullifier domain is used for residence, delivery, and aid claims.', ['domain separation', 'scope-bound challenge', 'proof bundle compatibility check'], ['verify:zk-baseline']),
    ],
    dataMinimizationRules: ['Witnesses never leave local proving context.', 'Public signals contain only predicate id, scope, roots, challenge, and domain-separated nullifier if needed.'],
    highRiskModeRequirements: ['Avoid precise area predicates.', 'Use short validity windows.', 'Avoid permanent public proof anchoring unless required.'],
    openQuestions: ['Which predicates have enough anonymity sets?', 'Which proof systems are production-ready after audit?'],
    verificationCommands: ['npm run verify:zk-baseline', 'npm run verify:no-raw-address'],
  }),
  template({
    id: 'agid-s-qr-nfc',
    title: 'AGID-S QR/NFC Sharing Threat Model',
    surface: 'Encrypted AGID sharing over QR, NFC, link, or paper',
    mode: 'local-only',
    ownerRole: 'AGID-S and mobile security engineer',
    reviewCadence: 'Every payload version, scanner parser, key rotation, or revocation change',
    privacyGoal: 'Allow only authorized readers to decrypt an AGID while public QR/NFC surfaces reveal no location or personal data.',
    nonGoals: ['Put AGID-S ciphertext on public ledgers by default', 'Use permanent exact location QR for high-risk cases'],
    protectedAssets: ['AGID plaintext', 'AGID-S ciphertext', 'recipient key', 'jti', 'expiry', 'purpose'],
    trustBoundaries: ['issuer device to QR/NFC medium', 'QR/NFC scanner to decryptor', 'decryptor to POS or field app', 'revocation check to registry'],
    attackerControlledInputs: ['QR image', 'NFC tag', 'link alias', 'key id', 'expiry metadata', 'revocation response'],
    misuseCases: [
      misuse('agid-s-qr-nfc', 1, 'Copied AGID-S remains useful too long', ['spoofing', 'linkability'], 'high', 'A copied QR is scanned later by a different party after the intended handoff.', ['short expiry', 'jti and used-state', 'recipient-specific encryption'], ['verify:mandatory-security']),
      misuse('agid-s-qr-nfc', 2, 'Parser logs decrypted AGID', ['information-disclosure'], 'critical', 'The scanner debug log stores plaintext after decryption.', ['decrypt only in local memory', 'redacted logs', 'no plaintext persistence by default'], ['verify:no-raw-address']),
    ],
    dataMinimizationRules: ['Payload contains AGID, expiry, purpose, and jti only when needed.', 'Public logs store ciphertext hash or alias, not plaintext or production ciphertext sample.'],
    highRiskModeRequirements: ['Use coarse AGID where possible.', 'Expire immediately after use.', 'No address history retention.'],
    openQuestions: ['Which key distribution model is supported for groups?', 'How are lost reader keys revoked?'],
    verificationCommands: ['npm run verify:mandatory-security', 'npm run verify:no-raw-address'],
  }),
  template({
    id: 'locker-pudo-simulator',
    title: 'Open Locker/PUDO Simulator Threat Model',
    surface: 'Locker/PUDO QR/NFC intake, local MQTT/HTTP/Modbus simulation, receipts',
    mode: 'local-only',
    ownerRole: 'Locker/PUDO engineer and device security reviewer',
    reviewCadence: 'Every simulator scenario, hardware protocol adapter, or receipt schema update',
    privacyGoal: 'Simulate locker and PUDO operations without storing raw address data, device secrets, or QR/NFC payloads.',
    nonGoals: ['Control real locker doors without certified adapter review', 'Store production carrier payloads in fixtures'],
    protectedAssets: ['locker assignment', 'QR/NFC proof status', 'device state', 'local protocol frame', 'operator receipt'],
    trustBoundaries: ['scanner to simulator', 'simulator to protocol frame', 'operator action to receipt', 'offline queue to sync'],
    attackerControlledInputs: ['QR/NFC scan', 'simulator script event', 'Modbus value', 'MQTT topic alias', 'HTTP path alias', 'device metadata'],
    misuseCases: [
      misuse('locker-pudo-simulator', 1, 'Simulator fixture includes real shipment payload', ['information-disclosure'], 'high', 'A demo script accidentally stores production QR, NFC, waybill, or address material.', ['fixture scanner', 'commitment-only payloads', 'negative private-material tests'], ['verify:open-locker-pudo', 'verify:no-raw-address']),
      misuse('locker-pudo-simulator', 2, 'Offline command is mistaken for real hardware authority', ['tampering', 'repudiation'], 'medium', 'A simulator frame is copied into a production control path without certification.', ['simulation-only boundary', 'adapter separation', 'signed production command schema'], ['verify:open-locker-pudo']),
    ],
    dataMinimizationRules: ['Protocol frames contain metadata and commitments only.', 'Receipts use aliases, statuses, and audit hashes.'],
    highRiskModeRequirements: ['NFC/passkey/AOID credential proof.', 'Short TTL.', 'No precise locker address disclosure.'],
    openQuestions: ['Which production adapter contracts are in scope?', 'Which physical reader faults should block release?'],
    verificationCommands: ['npm run verify:open-locker-pudo', 'npm run verify:no-raw-address'],
  }),
  template({
    id: 'developer-console-fixtures',
    title: 'Developer Console / Public Fixtures Threat Model',
    surface: 'API keys, webhooks, SDK snippets, OpenAPI, test vectors, launch checks',
    mode: 'mixed',
    ownerRole: 'Developer platform and release engineer',
    reviewCadence: 'Every docs, SDK, OpenAPI, webhook, or fixture release',
    privacyGoal: 'Make public integration examples useful without embedding real addresses, real ciphertexts, private keys, or production identifiers.',
    nonGoals: ['Ship real customer data as sample fixtures', 'Expose full webhook payload logs by default'],
    protectedAssets: ['API key tail', 'webhook secret', 'SDK fixture', 'OpenAPI example', 'test vector', 'launch checklist'],
    trustBoundaries: ['developer console to browser', 'fixture generator to repository', 'webhook log to dashboard', 'OpenAPI docs to public release'],
    attackerControlledInputs: ['developer-provided endpoint', 'API key label', 'webhook sample body', 'SDK snippet', 'fixture metadata'],
    misuseCases: [
      misuse('developer-console-fixtures', 1, 'Public test vector contains private address or proof material', ['information-disclosure', 'non-compliance'], 'critical', 'A fixture copied from a real support case is committed to the repository.', ['synthetic fixture rule', 'secret scan', 'no-raw-address release scan'], ['verify:no-raw-address', 'verify:preaudit-secrets']),
      misuse('developer-console-fixtures', 2, 'Webhook debugging reveals private payloads', ['information-disclosure'], 'high', 'The console stores full webhook bodies for convenience.', ['body masking by default', 'signature and event id display', 'explicit secure reveal workflow'], ['verify:developer-console']),
    ],
    dataMinimizationRules: ['Public docs use synthetic-public examples only.', 'Console shows key tails and hashes, not secrets or full payloads.'],
    highRiskModeRequirements: ['Disable public example export from high-risk sessions.', 'Require reviewer approval for public docs.'],
    openQuestions: ['Which fixture generator owns synthetic sample data?', 'Which log fields are safe for developer support?'],
    verificationCommands: ['npm run verify:developer-console', 'npm run verify:no-raw-address', 'npm run verify:preaudit-secrets'],
  }),
];

export const ADDRESS_PRIVACY_THREAT_MODEL_CHECKLISTS: AddressPrivacyThreatModelChecklist[] = [
  {
    role: 'developer',
    requiredActions: [
      'Pick the closest template before adding a new address, proof, evidence, QR/NFC, webhook, or registry surface.',
      'List attacker-controlled inputs and prove they pass through validation, redaction, or rejection.',
      'Add or update tests named in the template verification commands.',
      'Do not publish sample values from real users, production QR/NFC payloads, or production AGID-S ciphertexts.',
    ],
  },
  {
    role: 'security-reviewer',
    requiredActions: [
      'Check spoofing, tampering, replay, linkability, and privilege-abuse cases.',
      'Confirm secret material is impossible to log through normal error paths.',
      'Confirm high-risk mode changes behavior rather than only changing copy.',
      'Require explicit mitigation owners for high or critical misuse cases.',
    ],
  },
  {
    role: 'privacy-reviewer',
    requiredActions: [
      'Confirm user awareness, consent, revocation, deletion, export, and retention controls.',
      'Check whether public outputs create linkability across relying parties.',
      'Reject new flows that make raw address disclosure the default.',
      'Escalate evidence vault, humanitarian, domestic-violence, refugee, or child-safety contexts for deeper review.',
    ],
  },
  {
    role: 'operator',
    requiredActions: [
      'Use review-required states for conflicts instead of dumping private payloads into notes.',
      'Rotate aliases, device keys, and webhook secrets after staff, carrier, or device changes.',
      'Keep offline queues encrypted and sync conflicts redacted.',
      'Do not treat simulator outputs as certified production hardware authority.',
    ],
  },
  {
    role: 'auditor',
    requiredActions: [
      'Sample logs, webhook events, exported reports, and fixtures for forbidden outputs.',
      'Verify no-raw-address, secret scan, and relevant surface tests were run before release.',
      'Check that public docs distinguish theory, simulator, managed service, and production claims.',
      'Record unresolved open questions before approving a release.',
    ],
  },
];

export const ADDRESS_PRIVACY_THREAT_MODEL_FILES: AddressPrivacyThreatModelTemplateFile[] = [
  {
    path: 'data/address_privacy_threat_model_templates/manifest.json',
    role: 'manifest',
    mediaType: 'application/json',
    licenseOrTerms: 'Apache-2.0',
    containsPersonalData: false,
    containsRawAddressData: false,
    containsThirdPartyData: false,
  },
  {
    path: 'data/address_privacy_threat_model_templates/templates.json',
    role: 'templates',
    mediaType: 'application/json',
    licenseOrTerms: 'Apache-2.0',
    containsPersonalData: false,
    containsRawAddressData: false,
    containsThirdPartyData: false,
  },
  {
    path: 'data/address_privacy_threat_model_templates/checklists.json',
    role: 'checklists',
    mediaType: 'application/json',
    licenseOrTerms: 'Apache-2.0',
    containsPersonalData: false,
    containsRawAddressData: false,
    containsThirdPartyData: false,
  },
  {
    path: 'data/address_privacy_threat_model_templates/README.md',
    role: 'documentation',
    mediaType: 'text/markdown',
    licenseOrTerms: 'Apache-2.0',
    containsPersonalData: false,
    containsRawAddressData: false,
    containsThirdPartyData: false,
  },
  {
    path: 'data/address_privacy_threat_model_templates/markdown/*.md',
    role: 'markdown',
    mediaType: 'text/markdown',
    licenseOrTerms: 'Apache-2.0',
    containsPersonalData: false,
    containsRawAddressData: false,
    containsThirdPartyData: false,
  },
];

export function renderAddressPrivacyThreatModelTemplateMarkdown(
  templateModel: AddressPrivacyThreatTemplate,
): string {
  const misuseRows = templateModel.misuseCases
    .map(item => `| ${item.id} | ${item.severity} | ${item.title} | ${item.categories.join(', ')} | ${item.primaryControls.join('; ')} |`)
    .join('\n');
  return `# ${templateModel.title}

Version: ${ADDRESS_PRIVACY_THREAT_MODEL_TEMPLATES_VERSION}
Surface: ${templateModel.surface}
Mode: ${templateModel.mode}
Owner: ${templateModel.ownerRole}
Review cadence: ${templateModel.reviewCadence}

## Privacy Goal

${templateModel.privacyGoal}

## Non-Goals

${templateModel.nonGoals.map(item => `- ${item}`).join('\n')}

## Protected Assets

${templateModel.protectedAssets.map(item => `- ${item}`).join('\n')}

## Trust Boundaries

${templateModel.trustBoundaries.map(item => `- ${item}`).join('\n')}

## Attacker-Controlled Inputs

${templateModel.attackerControlledInputs.map(item => `- ${item}`).join('\n')}

## Misuse Cases

| ID | Severity | Title | Categories | Primary Controls |
| --- | --- | --- | --- | --- |
${misuseRows}

## Required Invariants

${templateModel.requiredInvariants.map(item => `- ${item}`).join('\n')}

## Data Minimization Rules

${templateModel.dataMinimizationRules.map(item => `- ${item}`).join('\n')}

## Safe Public Outputs

${templateModel.safePublicOutputs.map(item => `- ${item}`).join('\n')}

## Forbidden Outputs

${templateModel.forbiddenOutputs.map(item => `- ${item}`).join('\n')}

## High-Risk Mode Requirements

${templateModel.highRiskModeRequirements.map(item => `- ${item}`).join('\n')}

## Open Questions

${templateModel.openQuestions.map(item => `- ${item}`).join('\n')}

## Verification Commands

${templateModel.verificationCommands.map(item => `- \`${item}\``).join('\n')}
`;
}

export function getAddressPrivacyThreatModelTemplate(
  id: AddressPrivacyThreatTemplateId,
): AddressPrivacyThreatTemplate {
  const found = ADDRESS_PRIVACY_THREAT_MODEL_TEMPLATES.find(item => item.id === id);
  if (!found) throw new Error(`Unknown address privacy threat model template: ${id}`);
  return {
    ...found,
    nonGoals: [...found.nonGoals],
    protectedAssets: [...found.protectedAssets],
    trustBoundaries: [...found.trustBoundaries],
    attackerControlledInputs: [...found.attackerControlledInputs],
    misuseCases: found.misuseCases.map(item => ({
      ...item,
      categories: [...item.categories],
      primaryControls: [...item.primaryControls],
      verification: [...item.verification],
    })),
    requiredInvariants: [...found.requiredInvariants],
    dataMinimizationRules: [...found.dataMinimizationRules],
    safePublicOutputs: [...found.safePublicOutputs],
    forbiddenOutputs: [...found.forbiddenOutputs],
    highRiskModeRequirements: [...found.highRiskModeRequirements],
    openQuestions: [...found.openQuestions],
    verificationCommands: [...found.verificationCommands],
  };
}

function createManifest(generatedAt: string): AddressPrivacyThreatModelTemplatePack['manifest'] {
  const misuseCases = ADDRESS_PRIVACY_THREAT_MODEL_TEMPLATES.reduce((sum, item) => sum + item.misuseCases.length, 0);
  const requiredInvariants = ADDRESS_PRIVACY_THREAT_MODEL_TEMPLATES.reduce((sum, item) => sum + item.requiredInvariants.length, 0);
  return {
    kitId: 'address-privacy-threat-model-templates',
    version: ADDRESS_PRIVACY_THREAT_MODEL_TEMPLATES_VERSION,
    generatedAt,
    licenseOrTerms: 'Apache-2.0',
    privacyPosition: 'Address privacy threat models must keep AGID/AOID local-first, Ethereum-optional, no-raw-address-by-default, and high-risk safe by design.',
    files: ADDRESS_PRIVACY_THREAT_MODEL_FILES.map(file => ({ ...file })),
    counts: {
      templates: ADDRESS_PRIVACY_THREAT_MODEL_TEMPLATES.length,
      checklists: ADDRESS_PRIVACY_THREAT_MODEL_CHECKLISTS.length,
      misuseCases,
      requiredInvariants,
    },
  };
}

export function buildAddressPrivacyThreatModelTemplatePack(input: {
  generatedAt?: string;
} = {}): AddressPrivacyThreatModelTemplatePack {
  return {
    manifest: createManifest(input.generatedAt || GENERATED_AT),
    templates: ADDRESS_PRIVACY_THREAT_MODEL_TEMPLATES.map(item => getAddressPrivacyThreatModelTemplate(item.id)),
    checklists: ADDRESS_PRIVACY_THREAT_MODEL_CHECKLISTS.map(item => ({
      ...item,
      requiredActions: [...item.requiredActions],
    })),
  };
}

export function validateAddressPrivacyThreatModelTemplatePack(
  pack = buildAddressPrivacyThreatModelTemplatePack(),
): AddressPrivacyThreatModelTemplateValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const ids = new Set<string>();

  if (pack.manifest.version !== ADDRESS_PRIVACY_THREAT_MODEL_TEMPLATES_VERSION) errors.push('version-mismatch');
  if (pack.manifest.counts.templates !== pack.templates.length) errors.push('template-count-mismatch');
  if (pack.manifest.counts.checklists !== pack.checklists.length) errors.push('checklist-count-mismatch');

  for (const file of pack.manifest.files) {
    if (file.containsPersonalData !== false) errors.push(`file-personal-data-not-false:${file.path}`);
    if (file.containsRawAddressData !== false) errors.push(`file-raw-address-data-not-false:${file.path}`);
    if (file.containsThirdPartyData !== false) errors.push(`file-third-party-data-not-false:${file.path}`);
  }

  for (const requiredId of ADDRESS_PRIVACY_THREAT_TEMPLATE_IDS) {
    if (!pack.templates.some(item => item.id === requiredId)) errors.push(`missing-template:${requiredId}`);
  }

  for (const item of pack.templates) {
    if (ids.has(item.id)) errors.push(`duplicate-template:${item.id}`);
    ids.add(item.id);
    if (!item.protectedAssets.length) errors.push(`missing-assets:${item.id}`);
    if (!item.trustBoundaries.length) errors.push(`missing-trust-boundaries:${item.id}`);
    if (!item.attackerControlledInputs.length) errors.push(`missing-attacker-inputs:${item.id}`);
    if (item.misuseCases.length < 2) errors.push(`not-enough-misuse-cases:${item.id}`);
    if (!item.requiredInvariants.some(rule => /No raw address/i.test(rule))) errors.push(`missing-no-raw-address-invariant:${item.id}`);
    if (!item.requiredInvariants.some(rule => /AOID/i.test(rule))) errors.push(`missing-aoid-invariant:${item.id}`);
    if (!item.highRiskModeRequirements.length) errors.push(`missing-high-risk-mode:${item.id}`);
    if (!item.verificationCommands.length) warnings.push(`missing-verification-commands:${item.id}`);
    const rendered = renderAddressPrivacyThreatModelTemplateMarkdown(item);
    const scan = scanNoRawAddressReleaseText(rendered);
    if (!scan.valid) errors.push(`rendered-template-leaks-private-material:${item.id}`);
  }

  const checklistRoles = new Set(pack.checklists.map(item => item.role));
  for (const role of ['developer', 'security-reviewer', 'privacy-reviewer', 'operator', 'auditor'] as const) {
    if (!checklistRoles.has(role)) errors.push(`missing-checklist-role:${role}`);
  }

  if (!stableJson(pack).includes('local-first')) warnings.push('local-first-not-mentioned');
  if (!stableJson(pack).includes('Ethereum-optional')) warnings.push('ethereum-optional-not-mentioned');

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
