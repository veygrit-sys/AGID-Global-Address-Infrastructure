import { normalizeApiAddress,parseAddressText,type CanonicalAddressParts } from './addressIntelligence';

export type LibpostalComponent = {
  label: string;
  value: string;
};

export type OptionalLibpostalResult = {
  source: 'libpostal' | 'local-parser';
  available: boolean;
  canonical: CanonicalAddressParts;
  components: LibpostalComponent[];
};

export const LOCAL_LIBPOSTAL_ENDPOINT_POLICY_VERSION =
  'agid-local-libpostal-endpoint-policy-v1';

export type LocalLibpostalEndpointPolicy = {
  version: typeof LOCAL_LIBPOSTAL_ENDPOINT_POLICY_VERSION;
  status: 'ready' | 'disabled' | 'blocked';
  network: 'loopback-only' | 'none';
  reason?: 'endpoint-not-configured' | 'endpoint-must-be-absolute-loopback-http' | 'endpoint-must-not-contain-credentials';
};

export type LocalLibpostalResult = OptionalLibpostalResult & {
  endpointPolicy: LocalLibpostalEndpointPolicy;
};

type ParseOptions = {
  text: string;
  countryCode?: string;
  endpoint?: string;
  fetcher?: typeof fetch;
};

const LABEL_TO_CANONICAL: Record<string, keyof CanonicalAddressParts> = {
  country: 'country',
  country_code: 'country_code',
  state: 'state',
  province: 'state',
  city: 'city',
  city_district: 'district',
  suburb: 'suburb',
  road: 'road',
  street: 'road',
  house_number: 'house_number',
  postcode: 'postcode',
  postal_code: 'postcode',
  building: 'building',
  house: 'building',
  venue: 'poi',
};

function componentsToCanonical(components: LibpostalComponent[], countryCode?: string): CanonicalAddressParts {
  const raw: Record<string, string> = {};
  for (const component of components) {
    const key = LABEL_TO_CANONICAL[component.label];
    if (key && !raw[key]) raw[key] = component.value;
  }
  if (countryCode && !raw.country_code) raw.country_code = countryCode.toLowerCase();
  return normalizeApiAddress(raw);
}

function localResult(text: string, countryCode?: string): OptionalLibpostalResult {
  const canonical = parseAddressText(text);
  if (countryCode && !canonical.country_code) canonical.country_code = countryCode.toLowerCase();
  return {
    source: 'local-parser',
    available: false,
    canonical,
    components: Object.entries(canonical).map(([label, value]) => ({ label, value: String(value) })),
  };
}

/**
 * The local-only path is the privacy-preserving integration point for an
 * optional libpostal sidecar. Relative and non-loopback URLs are deliberately
 * rejected before any input is sent to a fetch implementation.
 */
export function assessLocalLibpostalEndpoint(endpoint?: string): LocalLibpostalEndpointPolicy {
  if (!endpoint) {
    return {
      version: LOCAL_LIBPOSTAL_ENDPOINT_POLICY_VERSION,
      status: 'disabled',
      network: 'none',
      reason: 'endpoint-not-configured',
    };
  }
  try {
    const parsed = new URL(endpoint);
    if (parsed.username || parsed.password) {
      return {
        version: LOCAL_LIBPOSTAL_ENDPOINT_POLICY_VERSION,
        status: 'blocked',
        network: 'none',
        reason: 'endpoint-must-not-contain-credentials',
      };
    }
    const isLoopback = ['127.0.0.1', '::1', '[::1]', 'localhost'].includes(parsed.hostname);
    if (parsed.protocol !== 'http:' || !isLoopback) {
      return {
        version: LOCAL_LIBPOSTAL_ENDPOINT_POLICY_VERSION,
        status: 'blocked',
        network: 'none',
        reason: 'endpoint-must-be-absolute-loopback-http',
      };
    }
    return {
      version: LOCAL_LIBPOSTAL_ENDPOINT_POLICY_VERSION,
      status: 'ready',
      network: 'loopback-only',
    };
  } catch {
    return {
      version: LOCAL_LIBPOSTAL_ENDPOINT_POLICY_VERSION,
      status: 'blocked',
      network: 'none',
      reason: 'endpoint-must-be-absolute-loopback-http',
    };
  }
}

export async function parseAddressWithOptionalLibpostal({
  text,
  countryCode,
  endpoint,
  fetcher = fetch,
}: ParseOptions): Promise<OptionalLibpostalResult> {
  if (!endpoint) return localResult(text, countryCode);

  try {
    const response = await fetcher(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, countryCode }),
    });
    if (!response.ok) return localResult(text, countryCode);

    const data = await response.json();
    const components = Array.isArray(data.components) ? data.components : [];
    if (data.source === 'local-parser' || data.available === false) {
      return {
        source: 'local-parser',
        available: false,
        canonical: data.canonical ? normalizeApiAddress(data.canonical) : componentsToCanonical(components, countryCode),
        components,
      };
    }

    return {
      source: 'libpostal',
      available: true,
      canonical: componentsToCanonical(components, countryCode),
      components,
    };
  } catch {
    return localResult(text, countryCode);
  }
}

export async function parseAddressWithLocalLibpostal({
  text,
  countryCode,
  endpoint,
  fetcher = fetch,
}: ParseOptions): Promise<LocalLibpostalResult> {
  const endpointPolicy = assessLocalLibpostalEndpoint(endpoint);
  if (endpointPolicy.status !== 'ready') {
    return {
      ...localResult(text, countryCode),
      endpointPolicy,
    };
  }
  const result = await parseAddressWithOptionalLibpostal({
    text,
    countryCode,
    endpoint,
    fetcher,
  });
  return {
    ...result,
    endpointPolicy,
  };
}
