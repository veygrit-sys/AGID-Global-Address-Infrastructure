export type AlgeriaPostalCandidate = {
  value?: string | null;
  objectKind: 'postcode' | 'delivery-area' | 'postal-establishment' | 'mobile-postal-establishment' | 'po-box' | 'route' | 'administrative-area' | 'agid-cell' | 'model-output' | 'address' | 'building' | string;
  assignmentAuthority: 'algerie-poste-current-directory' | 'upu-2002-reference' | 'community' | 'model' | string;
  geometryType?: 'Point' | 'LineString' | 'Polygon' | 'MultiPolygon' | string | null;
  geometryAuthority?: 'algerie-poste-postal-circumscription' | 'government-administrative' | 'community' | 'model' | string | null;
  rightsCompatible?: boolean;
  completeCurrentDenominatorEvidence?: boolean;
  explicitSameCodeSurfaceBinding?: boolean;
  exactAddressBuildingRelationEvidence?: boolean;
};

export function normalizeAlgeriaPostcodeForM2(value: string | null | undefined) {
  const normalized = (value ?? '').normalize('NFKC').replace(/[\s\u00a0]+/gu, '');
  return /^\d{5}$/u.test(normalized) ? normalized : null;
}

export function assessAlgeriaPostalCandidate(candidate: AlgeriaPostalCandidate) {
  const reasons: string[] = [];
  const normalizedPostcode = candidate.objectKind === 'postcode' ? normalizeAlgeriaPostcodeForM2(candidate.value) : null;
  const currentAuthority = candidate.assignmentAuthority === 'algerie-poste-current-directory';
  const polygon = candidate.geometryType === 'Polygon' || candidate.geometryType === 'MultiPolygon';
  const postalGeometry = candidate.geometryAuthority === 'algerie-poste-postal-circumscription';
  if (candidate.objectKind !== 'postcode') reasons.push('non-postcode-object');
  if (candidate.objectKind === 'postcode' && !normalizedPostcode) reasons.push('invalid-five-digit-postcode');
  if (!currentAuthority) reasons.push('current-assignment-authority-missing');
  if (!candidate.completeCurrentDenominatorEvidence) reasons.push('complete-current-denominator-missing');
  if (!candidate.geometryType) reasons.push('postal-geometry-missing');
  else if (!polygon) reasons.push('non-area-geometry');
  else if (!postalGeometry) reasons.push('non-postal-geometry-proxy');
  if (!candidate.explicitSameCodeSurfaceBinding) reasons.push('same-code-surface-binding-missing');
  if (!candidate.rightsCompatible) reasons.push('agid-compatible-rights-missing');
  if (candidate.assignmentAuthority === 'model' || candidate.geometryAuthority === 'model' || candidate.objectKind === 'model-output') reasons.push('model-has-no-postal-authority');
  const eligibleForPostalArea = Boolean(normalizedPostcode && currentAuthority && candidate.completeCurrentDenominatorEvidence && polygon && postalGeometry && candidate.explicitSameCodeSurfaceBinding && candidate.rightsCompatible);
  const exactBuildingDetailAllowed = Boolean(candidate.objectKind === 'building' && candidate.exactAddressBuildingRelationEvidence && candidate.rightsCompatible);
  return {
    countryCode: 'DZ' as const,
    normalizedPostcode,
    classification: eligibleForPostalArea ? 'official' as const : 'none' as const,
    eligibleForPostalArea,
    eligibleForM2Release: eligibleForPostalArea,
    postalAgidLinkAllowed: eligibleForPostalArea,
    independentAddressContextAllowed: candidate.objectKind === 'address' || candidate.objectKind === 'building',
    exactBuildingDetailAllowed,
    addressOrBuildingInferredFromPostcode: false as const,
    reasons: [...new Set(reasons)],
  };
}
