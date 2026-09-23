export type JsonRecord = Record<string, unknown>;

export function objectOrUndefined(value: unknown): JsonRecord | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as JsonRecord
    : undefined;
}

export function objectBody(value: unknown): JsonRecord {
  return objectOrUndefined(value) ?? {};
}

export function arrayOrUndefined<T = unknown>(value: unknown): T[] | undefined {
  return Array.isArray(value) ? value as T[] : undefined;
}
