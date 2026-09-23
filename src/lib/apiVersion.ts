export const API_LEGACY_BASE_PATH = '/api';
export const API_V1_BASE_PATH = '/api/v1';

function normalizeApiPath(path: string) {
  const trimmed = path.trim();
  if (!trimmed) return API_V1_BASE_PATH;
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

export function apiV1Path(path: string) {
  const normalized = normalizeApiPath(path);
  if (normalized === API_V1_BASE_PATH || normalized.startsWith(`${API_V1_BASE_PATH}/`)) {
    return normalized;
  }
  if (normalized === API_LEGACY_BASE_PATH) return API_V1_BASE_PATH;
  if (normalized.startsWith(`${API_LEGACY_BASE_PATH}/`)) {
    return `${API_V1_BASE_PATH}${normalized.slice(API_LEGACY_BASE_PATH.length)}`;
  }
  return `${API_V1_BASE_PATH}${normalized}`;
}

export function rewriteApiV1RequestUrl(url: string) {
  if (url === API_V1_BASE_PATH) return API_LEGACY_BASE_PATH;
  if (url.startsWith(`${API_V1_BASE_PATH}/`)) {
    return `${API_LEGACY_BASE_PATH}${url.slice(API_V1_BASE_PATH.length)}`;
  }
  return url;
}
