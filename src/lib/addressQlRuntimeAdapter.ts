export const ADDRESSQL_RUNTIME_ADAPTER_VERSION =
  'addressql-runtime-adapter-v0.1';

export type AddressQlRuntimePurpose = 'existence' | 'delivery';
export type AddressQlRuntimeAdapterMode = 'approved' | 'conformance';
export type AddressQlRuntimeDecisionStatus =
  | 'pass'
  | 'fail'
  | 'unknown'
  | 'conflict';

export type AddressQlRuntimeAdapterEvidence = {
  sourceId: string;
  sourceVersion: string;
  reuseRights: string;
  coverageStatement: string;
  correctionUrl: string;
  retrievedAt: string;
  validUntil: string;
  datasetDigest: string;
  holdoutDigest: string;
  reportDigest: string;
  attestationKeyId: string;
  attestationSignature: string;
};

export type AddressQlRuntimeValidationInput = {
  countryCode: string;
  postalCode: string;
  purpose: AddressQlRuntimePurpose;
};

export type AddressQlRuntimeAdapterDecision = {
  status: AddressQlRuntimeDecisionStatus;
  confidence: number;
  reasonCode: string;
};

export type AddressQlRuntimeAdapter = {
  id: string;
  version: string;
  mode: AddressQlRuntimeAdapterMode;
  countryCodes: readonly string[];
  purposes: readonly AddressQlRuntimePurpose[];
  evidence: AddressQlRuntimeAdapterEvidence;
  evaluate: (
    input: AddressQlRuntimeValidationInput,
  ) => AddressQlRuntimeAdapterDecision;
};

export type AddressQlRuntimeAdapterRegistryOptions = {
  now?: string | number | Date;
  clock?: () => string | number | Date;
  allowConformanceAdapters?: boolean;
  verifyIndependentAttestation?: (
    evidence: AddressQlRuntimeAdapterEvidence,
  ) => boolean;
};

export type AddressQlRuntimeAdapterEvaluation = {
  status: AddressQlRuntimeDecisionStatus;
  confidence: number;
  reasonCode: string;
  evidenceLevel: 'independently_attested' | 'synthetic_conformance';
  liveEligible: boolean;
  sourceRefs: string[];
  adapterIds: string[];
};

export type AddressQlRuntimeAdapterCapability = {
  countryCode: string;
  purpose: AddressQlRuntimePurpose;
  evidenceLevel: 'independently_attested' | 'synthetic_conformance';
  liveEligible: boolean;
  sourceRefs: string[];
  adapterIds: string[];
};

export type AddressQlRuntimeAdapterRegistry = {
  adapterCount: number;
  approvedAdapterCount: number;
  conformanceAdapterCount: number;
  capability: (input: {
    countryCode: string;
    purpose: AddressQlRuntimePurpose;
  }) => AddressQlRuntimeAdapterCapability | null;
  evaluate: (
    input: AddressQlRuntimeValidationInput,
  ) => AddressQlRuntimeAdapterEvaluation | null;
};

const TECHNICAL_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/;
const COUNTRY_CODE = /^[A-Z]{2}$/;
const DIGEST = /^sha256:[a-f0-9]{64}$/;

function exactDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function hasHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function validEvidenceShape(evidence: AddressQlRuntimeAdapterEvidence) {
  const retrievedAt = exactDate(evidence.retrievedAt);
  const validUntil = exactDate(evidence.validUntil);
  return Boolean(
    TECHNICAL_ID.test(evidence.sourceId)
    && evidence.sourceVersion.trim()
    && evidence.reuseRights.trim()
    && evidence.coverageStatement.trim()
    && hasHttpsUrl(evidence.correctionUrl)
    && retrievedAt
    && validUntil
    && validUntil > retrievedAt
    && DIGEST.test(evidence.datasetDigest)
    && DIGEST.test(evidence.holdoutDigest)
    && DIGEST.test(evidence.reportDigest)
    && TECHNICAL_ID.test(evidence.attestationKeyId)
    && evidence.attestationSignature.trim(),
  );
}

function adapterShapeIsValid(adapter: AddressQlRuntimeAdapter) {
  return Boolean(
    TECHNICAL_ID.test(adapter.id)
    && adapter.version.trim()
    && adapter.countryCodes.length
    && adapter.countryCodes.every(code => COUNTRY_CODE.test(code))
    && new Set(adapter.countryCodes).size === adapter.countryCodes.length
    && adapter.purposes.length
    && new Set(adapter.purposes).size === adapter.purposes.length
    && validEvidenceShape(adapter.evidence),
  );
}

function evaluationTime(
  options: Pick<AddressQlRuntimeAdapterRegistryOptions, 'now' | 'clock'>,
) {
  const value = options.clock?.() ?? options.now ?? new Date();
  const now = new Date(value);
  return Number.isNaN(now.getTime()) ? null : now;
}

function decisionIsValid(decision: AddressQlRuntimeAdapterDecision) {
  return Boolean(
    ['pass', 'fail', 'unknown', 'conflict'].includes(decision.status)
    && Number.isFinite(decision.confidence)
    && decision.confidence >= 0
    && decision.confidence <= 1
    && TECHNICAL_ID.test(decision.reasonCode),
  );
}

function mergeDecisions(
  decisions: readonly AddressQlRuntimeAdapterDecision[],
): AddressQlRuntimeAdapterDecision {
  const conclusive = decisions.filter(
    decision => decision.status === 'pass' || decision.status === 'fail',
  );
  const statuses = new Set(conclusive.map(decision => decision.status));

  if (
    decisions.some(decision => decision.status === 'conflict')
    || statuses.size > 1
  ) {
    return {
      status: 'conflict',
      confidence: Math.max(...decisions.map(decision => decision.confidence)),
      reasonCode: 'runtime_adapter_conflict',
    };
  }

  if (conclusive.length) {
    const status = conclusive[0].status;
    return {
      status,
      confidence:
        conclusive.reduce((sum, decision) => sum + decision.confidence, 0)
        / conclusive.length,
      reasonCode:
        conclusive.length === 1
          ? conclusive[0].reasonCode
          : `runtime_adapter_${status}_agreement`,
    };
  }

  return {
    status: 'unknown',
    confidence: decisions.length
      ? Math.max(...decisions.map(decision => decision.confidence))
      : 0,
    reasonCode: 'runtime_adapter_unknown',
  };
}

export function createAddressQlRuntimeAdapterRegistry(
  adapters: readonly AddressQlRuntimeAdapter[] = [],
  options: AddressQlRuntimeAdapterRegistryOptions = {},
): AddressQlRuntimeAdapterRegistry {
  const authorizedAdapters = adapters.filter(adapter => {
    if (!adapterShapeIsValid(adapter)) return false;
    if (adapter.mode === 'conformance') {
      return options.allowConformanceAdapters === true;
    }
    return options.verifyIndependentAttestation?.(adapter.evidence) === true;
  });

  function activeAdapters() {
    const now = evaluationTime(options);
    if (!now) return [];
    return authorizedAdapters.filter(adapter => {
      const validUntil = exactDate(adapter.evidence.validUntil);
      return Boolean(validUntil && validUntil > now);
    });
  }

  function matchingAdapters(input: {
    countryCode: string;
    purpose: AddressQlRuntimePurpose;
  }) {
    const countryCode = input.countryCode.trim().toUpperCase();
    if (!COUNTRY_CODE.test(countryCode)) return [];
    const matching = activeAdapters().filter(
      adapter =>
        adapter.countryCodes.includes(countryCode)
        && adapter.purposes.includes(input.purpose),
    );
    const approved = matching.filter(adapter => adapter.mode === 'approved');
    return approved.length ? approved : matching;
  }

  function capability(input: {
    countryCode: string;
    purpose: AddressQlRuntimePurpose;
  }): AddressQlRuntimeAdapterCapability | null {
    const countryCode = input.countryCode.trim().toUpperCase();
    const matching = matchingAdapters(input);
    if (!matching.length) return null;
    const liveEligible = matching.every(adapter => adapter.mode === 'approved');
    return {
      countryCode,
      purpose: input.purpose,
      evidenceLevel: liveEligible
        ? 'independently_attested'
        : 'synthetic_conformance',
      liveEligible,
      adapterIds: matching.map(adapter => adapter.id).sort(),
      sourceRefs: matching
        .flatMap(adapter => [
          `adapter:${adapter.id}@${adapter.version}`,
          `source:${adapter.evidence.sourceId}@${adapter.evidence.sourceVersion}`,
          `dataset:${adapter.evidence.datasetDigest}`,
          `holdout:${adapter.evidence.holdoutDigest}`,
          `report:${adapter.evidence.reportDigest}`,
        ])
        .filter((value, index, values) => values.indexOf(value) === index)
        .sort(),
    };
  }

  return {
    get adapterCount() {
      return activeAdapters().length;
    },
    get approvedAdapterCount() {
      return activeAdapters().filter(
        adapter => adapter.mode === 'approved',
      ).length;
    },
    get conformanceAdapterCount() {
      return activeAdapters().filter(
        adapter => adapter.mode === 'conformance',
      ).length;
    },
    capability,
    evaluate(input) {
      const countryCode = input.countryCode.trim().toUpperCase();
      if (!COUNTRY_CODE.test(countryCode)) return null;
      const matching = matchingAdapters({ countryCode, purpose: input.purpose });
      if (!matching.length) return null;

      const evaluated = matching
        .map(adapter => ({ adapter, decision: adapter.evaluate({ ...input, countryCode }) }))
        .filter(item => decisionIsValid(item.decision));
      if (!evaluated.length) return null;

      const merged = mergeDecisions(evaluated.map(item => item.decision));
      const liveEligible = capability({
        countryCode,
        purpose: input.purpose,
      })?.liveEligible === true;
      return {
        ...merged,
        evidenceLevel: liveEligible
          ? 'independently_attested'
          : 'synthetic_conformance',
        liveEligible,
        adapterIds: evaluated.map(item => item.adapter.id).sort(),
        sourceRefs: evaluated
          .flatMap(({ adapter }) => [
            `adapter:${adapter.id}@${adapter.version}`,
            `source:${adapter.evidence.sourceId}@${adapter.evidence.sourceVersion}`,
            `dataset:${adapter.evidence.datasetDigest}`,
            `holdout:${adapter.evidence.holdoutDigest}`,
            `report:${adapter.evidence.reportDigest}`,
          ])
          .filter((value, index, values) => values.indexOf(value) === index)
          .sort(),
      };
    },
  };
}
