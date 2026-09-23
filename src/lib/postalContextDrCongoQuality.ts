export type DrCongoPostalGeometryCandidate = {
  geometryType: 'Point' | 'LineString' | 'Polygon' | 'MultiPolygon' | string;
  sourceKind: 'official-postal' | 'open-reference' | 'model' | string;
  granularity: 'delivery-area-or-neighbourhood' | 'city-or-township' | 'province' | 'other' | string;
  name?: string | null;
  city?: string | null;
  state?: string | null;
  featureClass?: string | null;
  assignmentMatched: boolean;
  redistributionCompatible: boolean;
  topologyValid: boolean;
};

export type DrCongoPostalAssignment = {
  postcode: string;
  neighbourhood: string;
  city: string;
  state: string;
};

export function normalizeDrCongoPostcode(value: string) {
  const normalized = value.normalize('NFKC').replace(/[\s-]+/g, '');
  if (!/^\d{7}$/.test(normalized)) throw new Error('cd-postcode-must-be-seven-digits');
  return normalized;
}
export function decomposeDrCongoPostcode(value: string) {
  const postcode = normalizeDrCongoPostcode(value);
  return {
    postcode,
    primaryArea: postcode.slice(0, 2),
    localityOrTownship: postcode.slice(2, 4),
    sectorOrNeighbourhood: postcode.slice(4, 6),
    deliveryAreaOrPostOffice: postcode.slice(6),
    assignmentValidated: false as const,
  };
}

const key = (value: string | null | undefined) => (value ?? '')
  .normalize('NFKD').replace(/\p{Diacritic}/gu, '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('fr');

export function evaluateDrCongoPostalGeometryCandidate(
  assignment: DrCongoPostalAssignment,
  candidate: DrCongoPostalGeometryCandidate,
) {
  const reasons: string[] = [];
  let postcode: string | null = null;
  try { postcode = normalizeDrCongoPostcode(assignment.postcode); } catch { reasons.push('invalid-postcode'); }
  if (!['Polygon', 'MultiPolygon'].includes(candidate.geometryType)) reasons.push('non-areal-geometry');
  if (candidate.featureClass && !['postal', 'administrative', 'place'].includes(key(candidate.featureClass))) {
    reasons.push('unrelated-feature-class');
  }
  if (candidate.granularity !== 'delivery-area-or-neighbourhood') reasons.push('wrong-granularity');
  if (!candidate.assignmentMatched) reasons.push('assignment-not-matched');
  if (key(candidate.name) !== key(assignment.neighbourhood)) reasons.push('neighbourhood-name-mismatch');
  if (key(candidate.city) !== key(assignment.city)) reasons.push('city-mismatch');
  if (key(candidate.state) !== key(assignment.state)) reasons.push('state-mismatch');
  if (!candidate.topologyValid) reasons.push('invalid-topology');
  if (!candidate.redistributionCompatible) reasons.push('incompatible-rights');
  if (!['official-postal', 'open-reference'].includes(candidate.sourceKind)) reasons.push('unreviewed-source-kind');
  return {
    countryCode: 'CD' as const,
    postcode,
    classification: reasons.length === 0
      ? (candidate.sourceKind === 'official-postal' ? 'official' as const : 'derived-candidate' as const)
      : 'rejected' as const,
    eligibleForPostalArea: reasons.length === 0,
    reasons,
    agidLinkAllowed: reasons.length === 0,
    buildingOrAddressDetailInferred: false as const,
  };
}
