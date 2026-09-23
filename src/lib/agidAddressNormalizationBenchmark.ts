import { performance } from 'node:perf_hooks';

import {
  encodeAGID,
  getAdjacentAGIDCells,
} from './agid';
import {
  buildAgidAddressReference,
  compareAgidBuildingReferences,
  normalizeAgidPublicAddress,
  type AgidPublicAddressMatchComponents,
} from './agidAddressReference';

export const AGID_ADDRESS_NORMALIZATION_BENCHMARK_VERSION =
  'agid-address-normalization-benchmark-v0.1';
export const AGID_ADDRESS_NORMALIZATION_VECTOR_COUNT = 10_000;

export type AgidAddressNormalizationVector = {
  id: string;
  variation:
    | 'canonical'
    | 'case'
    | 'width'
    | 'whitespace'
    | 'punctuation'
    | 'unicode-decomposition'
    | 'dash'
    | 'alternate-digits'
    | 'wrapping-symbols'
    | 'mixed';
  input: AgidPublicAddressMatchComponents;
  expectedCanonicalKey: string;
  synthetic: true;
};

export type AgidAddressNormalizationBenchmarkReport = {
  version: typeof AGID_ADDRESS_NORMALIZATION_BENCHMARK_VERSION;
  benchmarkSetId: string;
  vectorCount: typeof AGID_ADDRESS_NORMALIZATION_VECTOR_COUNT;
  normalizationSuccesses: number;
  normalizationFailures: number;
  normalizationSuccessRate: number;
  boundaryChecks: number;
  boundaryErrors: number;
  boundaryValueErrorRate: number;
  subPremiseSeparationChecks: number;
  subPremiseLeakageErrors: number;
  subPremiseLeakageRate: number;
  thresholds: {
    minimumNormalizationSuccessRate: 0.995;
    maximumBoundaryValueErrorRate: 0.001;
    maximumSubPremiseLeakageRate: 0;
  };
  passed: boolean;
  durationMs: number;
  sampleFailureIds: string[];
  privacy: {
    syntheticOnly: true;
    containsRecipientData: false;
    containsRealAddressData: false;
    containsPreciseResidentialCoordinates: false;
  };
  nonClaims: string[];
};

type BenchmarkProfile = {
  countryCode: string;
  adminInput: string;
  adminExpected: string;
  localityInput: string;
  localityExpected: string;
  streetInput: string;
  streetExpected: string;
};

const PROFILES: BenchmarkProfile[] = [
  {
    countryCode: 'US',
    adminInput: 'Synthetic State',
    adminExpected: 'SYNTHETIC STATE',
    localityInput: 'Test City',
    localityExpected: 'TEST CITY',
    streetInput: 'Example Street',
    streetExpected: 'EXAMPLE STREET',
  },
  {
    countryCode: 'JP',
    adminInput: 'テスト県',
    adminExpected: 'テスト県',
    localityInput: 'テスト市',
    localityExpected: 'テスト市',
    streetInput: 'サンプル通り',
    streetExpected: 'サンプル通り',
  },
  {
    countryCode: 'CN',
    adminInput: '测试省',
    adminExpected: '测试省',
    localityInput: '测试市',
    localityExpected: '测试市',
    streetInput: '示例路',
    streetExpected: '示例路',
  },
  {
    countryCode: 'TW',
    adminInput: '測試縣',
    adminExpected: '測試縣',
    localityInput: '測試市',
    localityExpected: '測試市',
    streetInput: '範例路',
    streetExpected: '範例路',
  },
  {
    countryCode: 'DE',
    adminInput: 'Test Region',
    adminExpected: 'TEST REGION',
    localityInput: 'Teststadt',
    localityExpected: 'TESTSTADT',
    streetInput: 'Beispielstraße',
    streetExpected: 'BEISPIELSTRASSE',
  },
  {
    countryCode: 'FR',
    adminInput: 'Région Test',
    adminExpected: 'REGION TEST',
    localityInput: 'Ville Tést',
    localityExpected: 'VILLE TEST',
    streetInput: 'Rue Exemple',
    streetExpected: 'RUE EXEMPLE',
  },
  {
    countryCode: 'ES',
    adminInput: 'Región Prueba',
    adminExpected: 'REGION PRUEBA',
    localityInput: 'Ciudad Prueba',
    localityExpected: 'CIUDAD PRUEBA',
    streetInput: 'Calle Ejemplo',
    streetExpected: 'CALLE EJEMPLO',
  },
  {
    countryCode: 'BR',
    adminInput: 'São Teste',
    adminExpected: 'SAO TESTE',
    localityInput: 'Cidade Teste',
    localityExpected: 'CIDADE TESTE',
    streetInput: 'Rua Exemplo',
    streetExpected: 'RUA EXEMPLO',
  },
  {
    countryCode: 'EG',
    adminInput: 'منطقة اختبار',
    adminExpected: 'منطقة اختبار',
    localityInput: 'مدينة اختبار',
    localityExpected: 'مدينة اختبار',
    streetInput: 'شارع مثال',
    streetExpected: 'شارع مثال',
  },
  {
    countryCode: 'IN',
    adminInput: 'परीक्षण राज्य',
    adminExpected: 'परीक्षण राज्य',
    localityInput: 'परीक्षण नगर',
    localityExpected: 'परीक्षण नगर',
    streetInput: 'उदाहरण मार्ग',
    streetExpected: 'उदाहरण मार्ग',
  },
];

const VARIATIONS: AgidAddressNormalizationVector['variation'][] = [
  'canonical',
  'case',
  'width',
  'whitespace',
  'punctuation',
  'unicode-decomposition',
  'dash',
  'alternate-digits',
  'wrapping-symbols',
  'mixed',
];

function toFullwidthAscii(value: string) {
  return [...value].map(character => {
    const code = character.charCodeAt(0);
    if (code === 0x20) return '\u3000';
    if (code >= 0x21 && code <= 0x7E) {
      return String.fromCharCode(code + 0xFEE0);
    }
    return character;
  }).join('');
}

function toArabicIndicDigits(value: string) {
  return value.replace(/\d/g, digit =>
    String.fromCodePoint(0x0660 + Number(digit)));
}

function addWhitespace(value: string) {
  return `  ${value.replace(/\s+/g, '   ')}  `;
}

function addPunctuation(value: string) {
  return `(${value.replace(/\s+/g, ' , ')})`;
}

function transformText(
  value: string,
  variation: AgidAddressNormalizationVector['variation'],
) {
  if (variation === 'case') return value.toLocaleLowerCase('und');
  if (variation === 'width') return toFullwidthAscii(value);
  if (variation === 'whitespace') return addWhitespace(value);
  if (variation === 'punctuation') return addPunctuation(value);
  if (variation === 'unicode-decomposition') return value.normalize('NFD');
  if (variation === 'alternate-digits') return toArabicIndicDigits(value);
  if (variation === 'wrapping-symbols') return `[ ${value} ]`;
  if (variation === 'mixed') {
    return toFullwidthAscii(addWhitespace(value.toLocaleLowerCase('und')));
  }
  return value;
}

function transformHouseNumber(
  value: string,
  variation: AgidAddressNormalizationVector['variation'],
) {
  if (variation === 'dash') return value.replace('-', ' – ');
  if (variation === 'width') return toFullwidthAscii(value);
  if (variation === 'alternate-digits') return toArabicIndicDigits(value);
  if (variation === 'whitespace' || variation === 'mixed') {
    return ` ${value.replace('-', ' - ')} `;
  }
  if (variation === 'punctuation' || variation === 'wrapping-symbols') {
    return `#${value}`;
  }
  return value;
}

function canonicalKey(input: {
  countryCode: string;
  adminArea: string;
  locality: string;
  street: string;
  houseNumber: string;
  buildingId: string;
}) {
  return JSON.stringify([
    input.countryCode,
    input.adminArea,
    input.locality,
    input.street,
    input.houseNumber,
    input.buildingId,
  ]);
}

export function buildAgidAddressNormalizationBenchmarkVectors():
AgidAddressNormalizationVector[] {
  return Array.from(
    { length: AGID_ADDRESS_NORMALIZATION_VECTOR_COUNT },
    (_, index) => {
      const profile = PROFILES[index % PROFILES.length];
      const variation = VARIATIONS[Math.floor(index / PROFILES.length) % VARIATIONS.length];
      const serial = Math.floor(index / (PROFILES.length * VARIATIONS.length)) + 1;
      const houseNumber = `${(serial % 997) + 1}-${(serial % 89) + 1}`;
      const buildingId = `BLDG-${String(serial).padStart(4, '0')}`;
      const expectedAdmin = `${profile.adminExpected} ${serial}`;
      const expectedLocality = `${profile.localityExpected} ${serial}`;
      const expectedStreet = `${profile.streetExpected} ${serial}`;
      return {
        id: `synthetic-${profile.countryCode}-${String(index + 1).padStart(5, '0')}`,
        variation,
        input: {
          countryCode: variation === 'case'
            ? profile.countryCode.toLowerCase()
            : variation === 'width'
              ? toFullwidthAscii(profile.countryCode)
              : profile.countryCode,
          adminArea: transformText(
            `${profile.adminInput} ${serial}`,
            variation,
          ),
          locality: transformText(
            `${profile.localityInput} ${serial}`,
            variation,
          ),
          street: transformText(
            `${profile.streetInput} ${serial}`,
            variation,
          ),
          houseNumber: transformHouseNumber(houseNumber, variation),
          buildingId,
        },
        expectedCanonicalKey: canonicalKey({
          countryCode: profile.countryCode,
          adminArea: expectedAdmin,
          locality: expectedLocality,
          street: expectedStreet,
          houseNumber,
          buildingId,
        }),
        synthetic: true,
      };
    },
  );
}

function fnv1a(value: string) {
  let hash = 0x811C9DC5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function runAgidAddressNormalizationBenchmark():
AgidAddressNormalizationBenchmarkReport {
  const startedAt = performance.now();
  const vectors = buildAgidAddressNormalizationBenchmarkVectors();
  const sampleFailureIds: string[] = [];
  let normalizationSuccesses = 0;

  for (const vector of vectors) {
    try {
      const normalized = normalizeAgidPublicAddress(vector.input);
      if (normalized.canonicalKey === vector.expectedCanonicalKey) {
        normalizationSuccesses += 1;
      } else if (sampleFailureIds.length < 10) {
        sampleFailureIds.push(vector.id);
      }
    } catch {
      if (sampleFailureIds.length < 10) sampleFailureIds.push(vector.id);
    }
  }

  const seamSource = encodeAGID(0, 45);
  const seamNeighbors = getAdjacentAGIDCells(seamSource);
  if (!seamNeighbors.length) {
    throw new Error('AGID seam benchmark requires at least one adjacent cell.');
  }
  const sourceBundle = buildAgidAddressReference({
    agid: seamSource.id,
    buildingId: 'BLDG-BOUNDARY',
  });
  const neighborBundles = seamNeighbors.map(neighbor =>
    buildAgidAddressReference({
      agid: neighbor.agid.id,
      buildingId: 'BLDG-BOUNDARY',
    }));
  const separateBundle = buildAgidAddressReference({
    agid: encodeAGID(0, 45.01).id,
    buildingId: 'BLDG-BOUNDARY',
  });
  let boundaryErrors = 0;
  const boundaryChecks = 2_000;

  for (let index = 0; index < boundaryChecks / 2; index += 1) {
    const adjacent = compareAgidBuildingReferences(
      sourceBundle.publicReference,
      neighborBundles[index % neighborBundles.length].publicReference,
    );
    if (!adjacent.sameOrNearArea || !adjacent.grid.boundaryMatch) {
      boundaryErrors += 1;
    }
    const separate = compareAgidBuildingReferences(
      sourceBundle.publicReference,
      separateBundle.publicReference,
    );
    if (separate.sameOrNearArea || separate.matchClass !== 'separate-area') {
      boundaryErrors += 1;
    }
  }

  let subPremiseLeakageErrors = 0;
  const subPremiseSeparationChecks = 1_000;
  for (let index = 0; index < subPremiseSeparationChecks; index += 1) {
    const unit = `SYNTH-UNIT-${index}`;
    const bundle = buildAgidAddressReference({
      agid: seamSource.id,
      buildingId: `BLDG-${String(index).padStart(4, '0')}`,
      subPremise: {
        unit,
        floor: `SYNTH-FLOOR-${index % 100}`,
        entrance: `SYNTH-ENTRY-${index % 10}`,
      },
    });
    const publicText = JSON.stringify(bundle.publicReference);
    if (
      !bundle.privateMetadata
      || publicText.includes(unit)
      || /sub.?premise|unit|floor|entrance|internalRoute/i.test(publicText)
    ) {
      subPremiseLeakageErrors += 1;
    }
  }

  const normalizationFailures = vectors.length - normalizationSuccesses;
  const normalizationSuccessRate = normalizationSuccesses / vectors.length;
  const boundaryValueErrorRate = boundaryErrors / boundaryChecks;
  const subPremiseLeakageRate =
    subPremiseLeakageErrors / subPremiseSeparationChecks;
  const thresholds = {
    minimumNormalizationSuccessRate: 0.995 as const,
    maximumBoundaryValueErrorRate: 0.001 as const,
    maximumSubPremiseLeakageRate: 0 as const,
  };
  const benchmarkSetId = `${AGID_ADDRESS_NORMALIZATION_BENCHMARK_VERSION}-${fnv1a(
    vectors.map(vector =>
      `${vector.id}:${vector.expectedCanonicalKey}`).join('\n'),
  )}`;

  return {
    version: AGID_ADDRESS_NORMALIZATION_BENCHMARK_VERSION,
    benchmarkSetId,
    vectorCount: AGID_ADDRESS_NORMALIZATION_VECTOR_COUNT,
    normalizationSuccesses,
    normalizationFailures,
    normalizationSuccessRate,
    boundaryChecks,
    boundaryErrors,
    boundaryValueErrorRate,
    subPremiseSeparationChecks,
    subPremiseLeakageErrors,
    subPremiseLeakageRate,
    thresholds,
    passed:
      normalizationSuccessRate >= thresholds.minimumNormalizationSuccessRate
      && boundaryValueErrorRate <= thresholds.maximumBoundaryValueErrorRate
      && subPremiseLeakageRate <= thresholds.maximumSubPremiseLeakageRate,
    durationMs: performance.now() - startedAt,
    sampleFailureIds,
    privacy: {
      syntheticOnly: true,
      containsRecipientData: false,
      containsRealAddressData: false,
      containsPreciseResidentialCoordinates: false,
    },
    nonClaims: [
      'Synthetic normalization success is not a measured real-world address success rate.',
      'Adjacent-grid acceptance does not prove a shared building, entrance, or delivery route.',
      'The benchmark does not contain recipient, resident, or real sub-premise data.',
    ],
  };
}
