export type DjiboutiPostalCandidate = {
  value?: string | null;
  objectKind: 'postcode' | 'geocoded-address' | 'po-box' | 'administrative-area' | 'post-office' | 'route' | 'agid-cell' | 'model-output' | 'building' | string;
  assignmentAuthority: 'laposte-current-assignment' | 'upu-2020-reference' | 'community' | 'model' | string;
  geometryType?: 'Point' | 'LineString' | 'Polygon' | 'MultiPolygon' | string | null;
  geometryAuthority?: 'laposte-postal-area' | 'government-administrative' | 'community' | 'model' | string | null;
  rightsCompatible?: boolean;
  completeDenominatorEvidence?: boolean;
  exactBuildingRelationEvidence?: boolean;
};

export const DJIBOUTI_UPU_2020_REFERENCE_POSTCODES = new Set([
  '77101', '77102', '77103', '77104', '77105',
  '77201', '77301', '77401', '77501', '77601',
]);

export function normalizeDjiboutiPostcode(value: string | null | undefined) {
  const normalized = (value ?? '').normalize('NFKC').replace(/[\s\u00a0]+/gu, '');
  return /^\d{5}$/u.test(normalized) ? normalized : null;
}

export function decodeDjiboutiPostcode(value: string | null | undefined) {
  const normalized = normalizeDjiboutiPostcode(value);
  if (!normalized) return null;
  return { normalized, countryDigit: normalized[0], regionDigit: normalized[1], postOfficeDigits: normalized.slice(2) };
}

export function assessDjiboutiPostalCandidate(candidate: DjiboutiPostalCandidate) {
  const reasons: string[] = [];
  const normalizedPostcode = candidate.objectKind === 'postcode' ? normalizeDjiboutiPostcode(candidate.value) : null;
  const currentAuthority = candidate.assignmentAuthority === 'laposte-current-assignment';
  const polygon = candidate.geometryType === 'Polygon' || candidate.geometryType === 'MultiPolygon';
  const postalGeometry = candidate.geometryAuthority === 'laposte-postal-area';
  if (candidate.objectKind !== 'postcode') reasons.push('non-postcode-object');
  if (candidate.objectKind === 'postcode' && !normalizedPostcode) reasons.push('invalid-five-digit-postcode');
  if (!currentAuthority) reasons.push('current-assignment-authority-missing');
  if (!candidate.completeDenominatorEvidence) reasons.push('complete-current-denominator-missing');
  if (!candidate.geometryType) reasons.push('postal-geometry-missing');
  else if (!polygon) reasons.push('non-area-geometry');
  else if (!postalGeometry) reasons.push('non-postal-geometry-proxy');
  if (!candidate.rightsCompatible) reasons.push('agid-compatible-rights-missing');
  if (candidate.assignmentAuthority === 'model' || candidate.geometryAuthority === 'model' || candidate.objectKind === 'model-output') reasons.push('model-has-no-postal-authority');
  const eligibleForPostalArea = Boolean(normalizedPostcode && currentAuthority && candidate.completeDenominatorEvidence && polygon && postalGeometry && candidate.rightsCompatible);
  const exactBuildingDetailAllowed = Boolean(candidate.objectKind === 'building' && candidate.exactBuildingRelationEvidence && candidate.rightsCompatible);
  return {
    countryCode: 'DJ' as const,
    normalizedPostcode,
    classification: eligibleForPostalArea ? 'official' as const : 'none' as const,
    eligibleForPostalArea,
    eligibleForM2Release: eligibleForPostalArea,
    postalAgidLinkAllowed: eligibleForPostalArea,
    independentAddressContextAllowed: candidate.objectKind !== 'postcode',
    exactBuildingDetailAllowed,
    buildingOrAddressDetailInferred: false as const,
    reasons: [...new Set(reasons)],
  };
}
