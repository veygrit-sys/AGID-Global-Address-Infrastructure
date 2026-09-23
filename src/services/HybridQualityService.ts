import { agidFetch,type AgidApiResult } from '../lib/agidHttpClient';
import { apiV1Path } from '../lib/apiVersion';
import {
getHybridPolicy,
resolveHybridRuntime,
type HybridPolicy,
type HybridRuntimeContext,
type HybridRuntimeDecision,
} from '../lib/hybridArchitecture';

export type HybridQualityRequest = Omit<HybridRuntimeContext, 'online'> & {
  online?: boolean;
};

export type HybridQualityResponse = {
  decision: HybridRuntimeDecision;
  policy: HybridPolicy;
};

type HybridQualityOptions = {
  fetcher?: typeof fetch;
  online?: boolean;
  forceCentral?: boolean;
};

const QUALITY_CONFIDENCE: Record<HybridRuntimeDecision['qualityTier'], number> = {
  verified: 0.9,
  partial: 0.62,
  local: 0.42,
};

function buildLocalResult(
  request: HybridQualityRequest,
  options: HybridQualityOptions,
  warnings: string[] = [],
): AgidApiResult<HybridQualityResponse> {
  const decision = resolveHybridRuntime({
    ...request,
    online: options.online ?? request.online ?? true,
  });

  return {
    ok: true,
    data: {
      decision,
      policy: getHybridPolicy(request.workflow),
    },
    confidence: QUALITY_CONFIDENCE[decision.qualityTier],
    sources: ['agid-local-hybrid-policy'],
    warnings,
    cache: 'none',
    requestId: `local-hybrid-${Date.now().toString(36)}`,
  };
}

export async function fetchHybridQualityDecision(
  request: HybridQualityRequest,
  options: HybridQualityOptions = {},
): Promise<AgidApiResult<HybridQualityResponse>> {
  const localResult = buildLocalResult(request, options);
  const shouldUseCentral = options.forceCentral || localResult.data?.decision.shouldCallCentral;

  if (!shouldUseCentral) return localResult;

  try {
    return await agidFetch<HybridQualityResponse>(apiV1Path('/hybrid/quality'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      source: 'agid-central-quality',
      timeoutMs: 8000,
      retries: 1,
      retryUnsafe: true,
      fetcher: options.fetcher,
    });
  } catch {
    return buildLocalResult(request, options, [
      'Central quality service is unavailable; using local hybrid policy.',
    ]);
  }
}
