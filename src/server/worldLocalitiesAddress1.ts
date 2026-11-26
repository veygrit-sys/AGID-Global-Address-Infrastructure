import { createHash, timingSafeEqual } from 'node:crypto';
import { LOCAL_ADDRESS_COMPONENTS } from '../lib/addressElementInputPolicy';
import { parseDeliveryLines, readDeliveryLines } from '../lib/addressDeliveryLines';

const LEVELS = ['none', 'postcode', 'locality', 'street', 'premise', 'unit'] as const;
const STATUSES = ['verified', 'partial', 'ambiguous', 'conflict', 'unverified'] as const;

type Address1Decision = {
  status: typeof STATUSES[number];
  level: typeof LEVELS[number];
  candidate_count: number | null;
  verified_fields: string[];
  unverified_fields: string[];
};

type Resolution = {
  address1_decision: Address1Decision;
  address1_source: 'world-localities' | 'not-configured' | 'unavailable' | 'not-applicable';
  address1_evidence: Array<{ source_id: string; snapshot?: string; use?: 'physical_context_only' }>;
  address1_matched_scope?: string;
  address1_issues?: string[];
};

const FIELD_ALIASES: Record<string, string[]> = {
  postcode: ['postcode', 'postalCode', 'postal_code'], state: ['state', 'province', 'region'],
  city: ['city', 'locality'], municipality: ['municipality'], town: ['town'],
  neighbourhood: ['neighbourhood', 'subdistrict'], city_district: ['city_district', 'district'],
  suburb: ['suburb'], road: ['road', 'street'], house_number: ['house_number', 'houseNumber'],
  house: ['house', 'building'], unit: ['unit', 'apartment'], block: ['block'], lot: ['lot'],
  place: ['place', 'poi'], organization: ['organization'], po_box: ['po_box', 'poBox'], entrance: ['entrance'],
  floor: ['floor'], island: ['island'], village: ['village'], hamlet: ['hamlet'],
  county: ['county'], state_code: ['state_code'], postal_city: ['postal_city'],
  plus_code: ['plus_code'], country: ['country'],
  urbanization: ['urbanization', 'urbanizacion'], subpremise: ['subpremise', 'interiorNumber'],
  street_direction: ['streetDirection'], pre_directional: ['preDirectional'],
  post_directional: ['postDirectional'], civic_number_suffix: ['civicNumberSuffix'],
  street_type: ['streetType'], township: ['township'], compound: ['compound'],
  landmark: ['landmark'], address_code: ['addressCode', 'address_code'],
};

// Keep all locally supported address discriminators in the same-record comparison.
// Keys without a source adapter come back as unverified; they never silently disappear.
const mappedAliases = new Set(Object.values(FIELD_ALIASES).flat());
for (const key of LOCAL_ADDRESS_COMPONENTS) {
  if (!mappedAliases.has(key)) {
    FIELD_ALIASES[key.replace(/[A-Z]/g, letter => '_' + letter.toLowerCase())] = [key];
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function decisionFrom(value: unknown, components: Record<string, string>): Address1Decision | null {
  if (!isRecord(value)) return null;
  const { status, level, candidate_count, verified_fields, unverified_fields } = value;
  const isFieldList = (fields: unknown): fields is string[] => Array.isArray(fields)
    && fields.every(field => typeof field === 'string' && Object.hasOwn(components, field));
  if (!STATUSES.some(item => item === status) || !LEVELS.some(item => item === level)
    || !(candidate_count === null || (typeof candidate_count === 'number'
      && Number.isSafeInteger(candidate_count) && candidate_count >= 0))
    || !isFieldList(verified_fields) || !isFieldList(unverified_fields)
    || verified_fields.some(field => unverified_fields.includes(field))) return null;
  const premise = level === 'premise' || level === 'unit';
  if ((premise && (candidate_count !== 1 || !verified_fields.some(key =>
    ['address_line1', 'house_number', 'house', 'organization', 'address_line2', 'unit', 'subpremise'].includes(key))))
    || (status === 'verified' && (!premise || unverified_fields.length))
    || ((status === 'ambiguous' || status === 'conflict' || status === 'unverified') && premise)
    || (status === 'unverified' && level !== 'none')
    || (level === 'unit' && !verified_fields.some(key => ['unit', 'subpremise', 'address_line1'].includes(key)))
    || Object.keys(components).some(key => key !== 'organization'
      && !verified_fields.includes(key) && !unverified_fields.includes(key))) return null;
  return { status: status as Address1Decision['status'], level: level as Address1Decision['level'],
    candidate_count: typeof candidate_count === 'number' ? candidate_count : null, verified_fields, unverified_fields };
}

function configuredEndpoint(value: string): URL {
  const url = new URL(value);
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (url.username || url.password || url.search || url.hash
    || (url.protocol !== 'https:' && !(loopback && url.protocol === 'http:'))) throw new Error('invalid-endpoint');
  return url;
}

export async function verifyWorldLocalitiesAddress1(
  body: Record<string, unknown>,
  country: string,
  targetAllowed: boolean,
  authorization: string | undefined,
  fetcher: typeof fetch = fetch,
  config = { endpoint: process.env.AGID_WORLD_LOCALITIES_URL, token: process.env.AGID_WORLD_LOCALITIES_TOKEN, callerToken: process.env.AGID_ADDRESS1_CALLER_TOKEN },
): Promise<Resolution> {
  const address = isRecord(body.address) ? body.address : {};
  const components: Record<string, string> = {};
  let contradictory = false;
  const assign = (key: string, value: unknown) => {
    if (typeof value !== 'string' || !value.trim()) return;
    const text = value.trim();
    if (components[key] && components[key] !== text) contradictory = true;
    else components[key] = text;
  };
  for (const [key, aliases] of Object.entries(FIELD_ALIASES)) {
    for (const alias of aliases) assign(key, address[alias]);
  }
  // A Chinese 单元 and 室 can be two distinct identifiers on the same building.
  assign(country === 'CN' ? 'cn_room' : 'unit', address.room);
  assign('postcode', body.postalCode ?? body.postcode);
  const lines = readDeliveryLines(address);
  const parsed = parseDeliveryLines(country, components.state || '', lines, {
    street: components.road, houseNumber: components.house_number,
    unit: components.unit, subdistrict: components.neighbourhood,
  });
  // China's current facility register indexes complete published address lines.
  if (country !== 'CN') {
    assign('road', parsed.street);
    assign('house_number', parsed.houseNumber);
  }
  assign('unit', parsed.unit);
  assign('neighbourhood', parsed.subdistrict);
  const lineKeys = ['addressLine1', 'addressLine2', 'addressLine3'] as const;
  lineKeys.forEach((key, index) => {
    if ((country === 'CN' && index === 0) || !parsed.parsedLineKeys.includes(key)) assign('address_line' + (index + 1), lines[key]);
  });
  // Unstructured text carries information that may have been lost by a generic parser.
  assign('address_line1', body.addressText);
  const fallback = (source: Resolution['address1_source'], status: Address1Decision['status'] = 'unverified'): Resolution => ({
    address1_source: source, address1_decision: {
      status, level: 'none', candidate_count: null,
      verified_fields: [], unverified_fields: Object.keys(components),
    }, address1_evidence: [],
  });
  if (body.scope === 'postal' || !/^[A-Z]{2}$/.test(country) || !Object.keys(components).length) {
    return fallback('not-applicable');
  }
  const declaredCountry = address.country_code ?? address.countryCode;
  if (contradictory || !targetAllowed
    || (typeof declaredCountry === 'string' && declaredCountry.trim().toUpperCase() !== country)) {
    return fallback('not-applicable', 'conflict');
  }
  if (!config.endpoint && !config.token) return fallback('not-configured');
  if (!config.token || !config.endpoint || !config.callerToken) return fallback('unavailable');
  const digest = (value: string) => createHash('sha256').update(value).digest();
  if (!authorization || !timingSafeEqual(digest(authorization), digest('Bearer ' + config.callerToken))) {
    return fallback('not-applicable');
  }
  try {
    const response = await fetcher(configuredEndpoint(config.endpoint), {
      method: 'POST', redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(5000),
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + config.token },
      body: JSON.stringify({ operation: 'validate', country, components }),
    });
    if (!response.ok) return fallback('unavailable');
    const envelope = await response.json();
    const result = envelope?.result;
    if (envelope?.schema_version !== 1 || envelope.operation !== 'validate'
      || result?.country !== country || result.deliverability_verified !== false) return fallback('unavailable');
    const decision = decisionFrom(result.address1_decision, components);
    if (!decision) return fallback('unavailable');
    const receipts = Array.isArray(result.evidence) ? result.evidence.slice(0, 8) : [];
    const physicalOnly = result.matched_scope === 'physical_address_context';
    const hasPhysicalReceipt = receipts.some((item: unknown) => isRecord(item) && item.use === 'physical_context_only');
    const mailingIssue = Array.isArray(result.issues) && result.issues.includes('gnaf_independent_mailing_source_required');
    if (physicalOnly && (country !== 'AU' || !hasPhysicalReceipt || !mailingIssue || decision.status === 'verified')) {
      return fallback('unavailable');
    }
    if (decision.level === 'premise' || decision.level === 'unit') {
      if ((!['published_address_point', 'published_office_address'].includes(result.matched_scope) && !physicalOnly)
        || result.blocking_conflict !== false
        || !receipts.some((item: unknown) => isRecord(item) && typeof item.source_id === 'string'
          && item.source_id.trim() && typeof item.record_id === 'string' && item.record_id.trim()
          && (!physicalOnly || item.use === 'physical_context_only'))) return fallback('unavailable');
    }
    return {
      address1_source: 'world-localities', address1_decision: decision,
      ...(typeof result.matched_scope === 'string' && { address1_matched_scope: result.matched_scope }),
      ...(mailingIssue && { address1_issues: ['gnaf_independent_mailing_source_required'] }),
      address1_evidence: receipts.filter(isRecord).flatMap(receipt =>
        typeof receipt.source_id === 'string' ? [{ source_id: receipt.source_id,
          ...(typeof receipt.snapshot === 'string' && { snapshot: receipt.snapshot }),
          ...(receipt.use === 'physical_context_only' && { use: 'physical_context_only' as const }),
        }] : []),
    };
  } catch {
    return fallback('unavailable');
  }
}
