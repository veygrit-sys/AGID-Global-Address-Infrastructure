export type CameroonPostalCandidate = {
  value?: string | null;
  objectKind:
    | 'postcode'
    | 'po-box'
    | 'locality'
    | 'post-office'
    | 'route'
    | 'administrative-area'
    | 'agid-cell'
    | 'model-output'
    | 'building'
    | string;
  geometryType?: 'Point' | 'LineString' | 'Polygon' | 'MultiPolygon' | string | null;
  sourceKind: 'official-reference' | 'open-reference' | 'model' | string;
};

export function assessCameroonPostalCandidate(candidate: CameroonPostalCandidate) {
  const reasons = ['no-current-postcode-system'];
  const compactValue = candidate.value?.trim().toUpperCase() ?? '';
  if (candidate.objectKind !== 'postcode') reasons.push('non-postal-object');
  if (candidate.objectKind === 'po-box' || /\b(?:B\.?P\.?|P\.?O\.? BOX)\b/u.test(compactValue)) {
    reasons.push('po-box-is-not-postcode');
  }
  if (candidate.geometryType) reasons.push('non-postal-geometry-proxy');
  if (candidate.sourceKind === 'model') reasons.push('model-has-no-postal-authority');
  return {
    countryCode: 'CM' as const,
    normalizedPostcode: null,
    classification: 'none' as const,
    eligibleForPostalArea: false as const,
    reasons,
    postalAgidLinkAllowed: false as const,
    independentAddressContextAllowed: candidate.objectKind !== 'postcode',
    buildingOrAddressDetailInferred: false as const,
  };
}
