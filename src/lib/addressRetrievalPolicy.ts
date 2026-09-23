export const ADDRESS_RETRIEVAL_TIMEOUTS = {
  coreReverseMs: 10_000,
  postalNearestMs: 7_000,
  optionalGeoMs: 5_000,
  regionalContextMs: 6_000,
  buildingNameMs: 3_500,
  globalContextMs: 4_000,
} as const;

export const ADDRESS_RETRIEVAL_RETRIES = {
  coreReverse: 1,
  optional: 0,
} as const;

export async function withAddressLookupTimeout<T>(
  lookup: Promise<T>,
  timeoutMs: number,
  fallback: T,
): Promise<T> {
  if (timeoutMs <= 0) return lookup;

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<T>(resolve => {
    timeoutId = setTimeout(() => resolve(fallback), timeoutMs);
  });

  try {
    return await Promise.race([lookup, timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
