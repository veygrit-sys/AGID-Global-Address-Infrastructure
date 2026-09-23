export type CaboVerdePostalCandidate = {
  value?: string | null;
  objectKind:
    | 'postcode'
    | 'operator-contact-identifier'
    | 'cip'
    | 'administrative-area'
    | 'toponymic-area'
    | 'post-office'
    | 'route'
    | 'agid-cell'
    | 'model-output'
    | 'building'
    | string;
  assignmentAuthority:
    | 'correios-current-assignment'
    | 'correios-example'
    | 'upu-format'
    | 'contact-page'
    | 'cip-private'
    | 'community'
    | 'model'
    | string;
  geometryType?: 'Point' | 'LineString' | 'Polygon' | 'MultiPolygon' | string | null;
  geometryAuthority?: 'correios-postal-area' | 'ingt-administrative' | 'community' | 'synthetic' | 'model' | string | null;
  rightsCompatible?: boolean;
  completeDenominatorEvidence?: boolean;
  exactBuildingRelationEvidence?: boolean;
};

export function normalizeCaboVerdePostcode(value: string | null | undefined) {
  const normalized = (value ?? '')
    .normalize('NFKC')
    .replace(/[\s\u00a0]+/gu, '');
  return /^\d{4}$/u.test(normalized) ? normalized : null;
}

export function assessCaboVerdePostalCandidate(candidate: CaboVerdePostalCandidate) {
  const reasons: string[] = [];
  const normalizedPostcode = candidate.objectKind === 'postcode'
    ? normalizeCaboVerdePostcode(candidate.value)
    : null;
  const postalAssignmentAuthority = candidate.assignmentAuthority === 'correios-current-assignment';
  const polygonGeometry = candidate.geometryType === 'Polygon' || candidate.geometryType === 'MultiPolygon';
  const postalGeometryAuthority = candidate.geometryAuthority === 'correios-postal-area';

  if (candidate.objectKind !== 'postcode') reasons.push('non-postcode-object');
  if (candidate.objectKind === 'operator-contact-identifier' || /^\d{4}-\d{3}$/u.test((candidate.value ?? '').trim())) {
    reasons.push('operator-contact-identifier-not-canonical-postcode');
  }
  if (candidate.objectKind === 'cip' || candidate.assignmentAuthority === 'cip-private') {
    reasons.push('private-cip-not-public-postcode');
  }
  if (candidate.objectKind === 'postcode' && !normalizedPostcode) reasons.push('invalid-four-digit-postcode');
  if (!postalAssignmentAuthority) reasons.push('current-assignment-authority-missing');
  if (!candidate.completeDenominatorEvidence) reasons.push('complete-current-denominator-missing');
  if (!candidate.geometryType) reasons.push('postal-geometry-missing');
  else if (!polygonGeometry) reasons.push('non-area-geometry');
  else if (!postalGeometryAuthority) reasons.push('non-postal-geometry-proxy');
  if (!candidate.rightsCompatible) reasons.push('agid-compatible-rights-missing');
  if (candidate.assignmentAuthority === 'model' || candidate.geometryAuthority === 'model' || candidate.objectKind === 'model-output') {
    reasons.push('model-has-no-postal-authority');
  }

  const eligibleForPostalArea = Boolean(
    normalizedPostcode &&
    postalAssignmentAuthority &&
    candidate.completeDenominatorEvidence &&
    polygonGeometry &&
    postalGeometryAuthority &&
    candidate.rightsCompatible,
  );
  const exactBuildingDetailAllowed = Boolean(
    candidate.objectKind === 'building' &&
    candidate.exactBuildingRelationEvidence &&
    candidate.rightsCompatible,
  );

  return {
    countryCode: 'CV' as const,
    normalizedPostcode,
    classification: eligibleForPostalArea ? 'official' as const : 'none' as const,
    eligibleForPostalArea,
    eligibleForM2Release: eligibleForPostalArea,
    reasons: [...new Set(reasons)],
    postalAgidLinkAllowed: eligibleForPostalArea,
    independentAddressContextAllowed: candidate.objectKind !== 'postcode',
    exactBuildingDetailAllowed,
    buildingOrAddressDetailInferred: false as const,
  };
}
