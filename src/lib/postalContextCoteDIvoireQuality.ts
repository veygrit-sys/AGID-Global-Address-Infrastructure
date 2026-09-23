export type CoteDIvoirePostalCandidate = {
  value?: string | null;
  objectKind:
    | 'postcode'
    | 'po-box'
    | 'post-office-code'
    | 'home-delivery-indicator'
    | 'locality'
    | 'post-office'
    | 'route'
    | 'administrative-area'
    | 'agid-cell'
    | 'model-output'
    | string;
  geometryType?: 'Point' | 'LineString' | 'Polygon' | 'MultiPolygon' | string | null;
  sourceKind: 'official-reference' | 'open-reference' | 'model' | string;
};

export function assessCoteDIvoirePostalCandidate(candidate: CoteDIvoirePostalCandidate) {
  const reasons = ['no-current-postcode-system'];
  const compactValue = candidate.value?.trim().toUpperCase() ?? '';
  if (candidate.objectKind !== 'postcode') reasons.push('non-postal-object');
  if (candidate.objectKind === 'po-box' || /\bB\.?P\.?\b/u.test(compactValue)) {
    reasons.push('po-box-is-not-postcode');
  }
  if (
    candidate.objectKind === 'post-office-code' ||
    candidate.objectKind === 'home-delivery-indicator' ||
    /^(?:\d{2}|1\d{2})$/u.test(compactValue)
  ) {
    reasons.push('office-routing-code-is-not-postcode');
  }
  if (candidate.geometryType) reasons.push('non-postal-geometry-proxy');
  if (candidate.sourceKind === 'model') reasons.push('model-has-no-postal-authority');
  return {
    countryCode: 'CI' as const,
    normalizedPostcode: null,
    classification: 'none' as const,
    eligibleForPostalArea: false as const,
    reasons,
    postalAgidLinkAllowed: false as const,
    independentAddressContextAllowed: candidate.objectKind !== 'postcode',
    buildingOrAddressDetailInferred: false as const,
  };
}
