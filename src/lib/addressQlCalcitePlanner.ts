export const ADDRESSQL_CALCITE_PLANNER_VERSION = 'addressql-calcite-v0.5-deferred';

export type AddressQlCalciteGateId =
  | 'custom_sql_dialect_required'
  | 'multi_database_federation_required'
  | 'optimizer_rules_outgrow_macros'
  | 'adapter_sql_generation_required'
  | 'policy_aware_rewrite_required';

export type AddressQlCalciteActivationGate = {
  id: AddressQlCalciteGateId;
  meaning: string;
  evidenceRequired: string;
};

export type AddressQlCalciteComponent = {
  name: string;
  role: string;
  mustPreserve: string[];
};

export type AddressQlCalciteRewriteRule = {
  id: string;
  allowedRewrite: string;
  forbiddenRewrite: string;
  safetyBoundary: string;
};

export type AddressQlCalciteDialectExample = {
  name: string;
  sql: string;
  targetAdapters: string[];
  nonClaim: string;
};

export const ADDRESSQL_CALCITE_ACTIVATION_GATES: AddressQlCalciteActivationGate[] = [
  {
    id: 'custom_sql_dialect_required',
    meaning: 'AddressQL syntax cannot be expressed cleanly as ordinary SQL functions.',
    evidenceRequired: 'Accepted syntax proposal plus failing adapter examples.',
  },
  {
    id: 'multi_database_federation_required',
    meaning: 'One logical AddressQL query must target multiple database adapters consistently.',
    evidenceRequired: 'Cross-adapter query fixture covering PostgreSQL, DuckDB, SQLite, and at least one SDK-side target.',
  },
  {
    id: 'optimizer_rules_outgrow_macros',
    meaning: 'Macro/function wrappers produce repeated scans, unsafe pushdown, or unacceptable query-plan cost.',
    evidenceRequired: 'Benchmark or query-plan counterexample showing why planner rules are needed.',
  },
  {
    id: 'adapter_sql_generation_required',
    meaning: 'SDKs need one canonical AddressQL query lowered into several SQL dialects.',
    evidenceRequired: 'PostgreSQL, DuckDB, SQLite, and MySQL emission fixture.',
  },
  {
    id: 'policy_aware_rewrite_required',
    meaning: 'Privacy, proof, or policy functions need rewrite barriers that static docs cannot enforce.',
    evidenceRequired: 'Non-claim and privacy-boundary test vectors for proof and disclosure functions.',
  },
];

export const ADDRESSQL_CALCITE_COMPONENTS: AddressQlCalciteComponent[] = [
  {
    name: 'AddressQlDialectParser',
    role: 'Parses a small AddressQL SQL dialect without replacing ordinary SQL.',
    mustPreserve: ['function registry names', 'argument order', 'source-version literals'],
  },
  {
    name: 'AddressQlValidator',
    role: 'Validates function determinism, output kind, privacy boundary, and adapter capability.',
    mustPreserve: ['non-claims', 'determinism declarations', 'unsafe hash warnings'],
  },
  {
    name: 'AddressQlRelBridge',
    role: 'Maps AddressQL calls into relational algebra nodes for planning.',
    mustPreserve: ['purpose-relative semantics', 'volatility barriers', 'proof boundaries'],
  },
  {
    name: 'AddressQlRewritePlanner',
    role: 'Applies source-version, postal, spatial, delivery, and privacy-aware rewrite rules.',
    mustPreserve: ['source-version correctness', 'no raw witness fields', 'no private coordinate leakage'],
  },
  {
    name: 'AddressQlAdapterEmitter',
    role: 'Emits adapter-specific SQL or SDK-side query plans.',
    mustPreserve: ['semantic result shape', 'warnings', 'non-claims'],
  },
];

export const ADDRESSQL_CALCITE_REWRITE_RULES: AddressQlCalciteRewriteRule[] = [
  {
    id: 'source_version_literal_lock',
    allowedRewrite: 'Bind stable functions to the declared source_version before planner expansion.',
    forbiddenRewrite: 'Silently replace a declared source_version with latest source data.',
    safetyBoundary: 'source-version correctness',
  },
  {
    id: 'postal_predicate_pushdown',
    allowedRewrite: 'Push stable POSTAL_VALIDATE predicates below joins when country and postal source version are known.',
    forbiddenRewrite: 'Push postal predicates when source version is missing or the function is volatile.',
    safetyBoundary: 'determinism and source-version stability',
  },
  {
    id: 'geo_bbox_prefilter',
    allowedRewrite: 'Add coarse bounding-box prefilters before expensive region membership checks.',
    forbiddenRewrite: 'Log or project precise private coordinates as a side effect of optimization.',
    safetyBoundary: 'coordinate privacy',
  },
  {
    id: 'volatile_delivery_barrier',
    allowedRewrite: 'Keep delivery estimates and live-like carrier decisions late in the plan.',
    forbiddenRewrite: 'Cache volatile delivery decisions as stable facts.',
    safetyBoundary: 'volatility correctness',
  },
  {
    id: 'privacy_proof_barrier',
    allowedRewrite: 'Treat proof generation and verification as opaque privacy boundary operations.',
    forbiddenRewrite: 'Inline witness, private key, raw address, or proof-secret fields into a relational plan.',
    safetyBoundary: 'proof and witness safety',
  },
  {
    id: 'non_claim_preservation',
    allowedRewrite: 'Carry non-claims through projections, joins, and adapter emissions.',
    forbiddenRewrite: 'Drop non-claims when rewriting a function result into target SQL.',
    safetyBoundary: 'publication safety',
  },
];

export const ADDRESSQL_CALCITE_DIALECT_EXAMPLES: AddressQlCalciteDialectExample[] = [
  {
    name: 'postal validation predicate',
    sql: "ADDRESSQL.POSTAL_VALIDATE(order_postal, country, SOURCE_VERSION 'synthetic-v0.5').valid",
    targetAdapters: ['PostgreSQL', 'DuckDB', 'SQLite', 'MySQL'],
    nonClaim: 'Postal validation is not address identity.',
  },
  {
    name: 'purpose-relative address match',
    sql: "ADDRESSQL.ADDRESS_MATCH(order_address, account_address, PURPOSE 'delivery').match",
    targetAdapters: ['PostgreSQL', 'DuckDB', 'SQLite'],
    nonClaim: 'Address match is purpose-relative and not proof of residence.',
  },
  {
    name: 'privacy proof barrier',
    sql: "ADDRESSQL.PROVE(envelope, CLAIM 'deliverable')",
    targetAdapters: ['PostgreSQL', 'SDK-side verifier'],
    nonClaim: 'Proof validity does not prove address resolution correctness.',
  },
];

export function shouldActivateAddressQlCalcite(activeGateIds: AddressQlCalciteGateId[]): boolean {
  return new Set(activeGateIds).size >= 3;
}

export function validateAddressQlCalcitePlannerPlan(): string[] {
  const errors: string[] = [];
  const gateIds = new Set<AddressQlCalciteGateId>();
  const ruleIds = new Set<string>();

  for (const gate of ADDRESSQL_CALCITE_ACTIVATION_GATES) {
    if (gateIds.has(gate.id)) errors.push(`duplicate Calcite activation gate: ${gate.id}`);
    gateIds.add(gate.id);
    if (!gate.evidenceRequired) errors.push(`${gate.id}: missing evidence requirement`);
  }

  if (ADDRESSQL_CALCITE_ACTIVATION_GATES.length < 5) errors.push('Calcite v0.5 needs at least five activation gates');
  if (shouldActivateAddressQlCalcite(['custom_sql_dialect_required', 'multi_database_federation_required']) !== false) {
    errors.push('Calcite must remain deferred until at least three gates are true');
  }
  if (!shouldActivateAddressQlCalcite(['custom_sql_dialect_required', 'multi_database_federation_required', 'adapter_sql_generation_required'])) {
    errors.push('Calcite activation threshold must be three gates');
  }

  for (const component of ADDRESSQL_CALCITE_COMPONENTS) {
    if (component.mustPreserve.length < 2) errors.push(`${component.name}: weak preservation contract`);
  }

  for (const rule of ADDRESSQL_CALCITE_REWRITE_RULES) {
    if (ruleIds.has(rule.id)) errors.push(`duplicate Calcite rewrite rule: ${rule.id}`);
    ruleIds.add(rule.id);
    if (!rule.forbiddenRewrite) errors.push(`${rule.id}: missing forbidden rewrite`);
    if (!rule.safetyBoundary) errors.push(`${rule.id}: missing safety boundary`);
  }

  for (const required of ['source_version_literal_lock', 'postal_predicate_pushdown', 'volatile_delivery_barrier', 'privacy_proof_barrier', 'non_claim_preservation']) {
    if (!ruleIds.has(required)) errors.push(`missing Calcite rewrite rule: ${required}`);
  }

  if (!ADDRESSQL_CALCITE_DIALECT_EXAMPLES.some(example => example.sql.includes('SOURCE_VERSION'))) {
    errors.push('Calcite dialect examples must show source-version locking');
  }
  if (!ADDRESSQL_CALCITE_DIALECT_EXAMPLES.some(example => example.nonClaim.includes('not proof'))) {
    errors.push('Calcite dialect examples must preserve proof/residence non-claims');
  }

  return errors;
}
