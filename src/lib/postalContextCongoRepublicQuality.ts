export type CongoRepublicPostalCandidate = {
  value?: string | null;
  objectKind: 'postcode' | 'po-box' | 'locality' | 'post-office' | 'route' | 'administrative-area' | 'agid-cell' | 'model-output' | string;
  geometryType?: 'Point' | 'LineString' | 'Polygon' | 'MultiPolygon' | string | null;
  sourceKind: 'official-reference' | 'open-reference' | 'model' | string;
};

export function assessCongoRepublicPostalCandidate(candidate: CongoRepublicPostalCandidate) {
  const reasons = ['no-current-postcode-system'];
  if (candidate.objectKind !== 'postcode') reasons.push('non-postal-object');
  if (candidate.geometryType) reasons.push('non-postal-geometry-proxy');
  if (candidate.sourceKind === 'model') reasons.push('model-has-no-postal-authority');
  return {
    countryCode: 'CG' as const,
    normalizedPostcode: null,
    classification: 'none' as const,
    eligibleForPostalArea: false as const,
    reasons,
    postalAgidLinkAllowed: false as const,
    independentAddressContextAllowed: candidate.objectKind !== 'postcode',
    buildingOrAddressDetailInferred: false as const,
  };
}
