export const ADDRESS_PLATFORM_BLUEPRINT_VERSION = 'address-platform-blueprint-v1';

export type AddressPlatformBlueprintStatus =
  | 'partial'
  | 'planned';

export type AddressPlatformBlueprintId =
  | 'agid-place-record'
  | 'address-validation-pipeline'
  | 'address-identity'
  | 'address-enrichment'
  | 'address-developer-platform'
  | 'address-review-console'
  | 'address-search-federation'
  | 'edge-address-resolver'
  | 'zk-credential-uniqueness';

export type ExternalInspirationId =
  | 'google-maps-platform'
  | 'here-technologies'
  | 'tomtom'
  | 'mapbox'
  | 'overture-maps'
  | 'okta'
  | 'persona'
  | 'world-id'
  | 'vercel'
  | 'cloudflare'
  | 'clearbit'
  | 'opencorporates';

export type ExternalInspiration = {
  id: ExternalInspirationId;
  name: string;
  sourceUrl: string;
  absorbedPattern: string;
  dependencyPolicy: 'reference-only' | 'optional-adapter' | 'oss-data-source';
};

export type AddressPlatformBlueprint = {
  id: AddressPlatformBlueprintId;
  name: string;
  status: AddressPlatformBlueprintStatus;
  inspiredBy: ExternalInspirationId[];
  purpose: string;
  absorbedAs: string[];
  implementationRefs: string[];
  verificationRefs: string[];
  privacySafeguards: string[];
  antiPatterns: string[];
  nextSteps: string[];
};

export type AddressPlatformBlueprintSummary = {
  version: typeof ADDRESS_PLATFORM_BLUEPRINT_VERSION;
  totalBlueprints: number;
  partial: number;
  planned: number;
  externalInspirations: number;
  optionalAdapters: ExternalInspirationId[];
  ossDataSources: ExternalInspirationId[];
  privacyCriticalBlueprints: AddressPlatformBlueprintId[];
  highestPriorityNextSteps: string[];
};

export type AddressPlatformBlueprintValidation = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

const EXTERNAL_INSPIRATIONS: ExternalInspiration[] = [
  {
    id: 'google-maps-platform',
    name: 'Google Maps Platform',
    sourceUrl: 'https://developers.google.com/maps/documentation',
    absorbedPattern: 'Place-like stable records, address validation confidence, geocoding/reverse-geocoding UX.',
    dependencyPolicy: 'reference-only',
  },
  {
    id: 'here-technologies',
    name: 'HERE Technologies',
    sourceUrl: 'https://docs.here.com/geocoding-and-search/docs/introduction-to-here-geocoding-search-api-v7',
    absorbedPattern: 'Global geocoding/search, POI discovery, and contextual reverse geocoding.',
    dependencyPolicy: 'optional-adapter',
  },
  {
    id: 'tomtom',
    name: 'TomTom Developer Platform',
    sourceUrl: 'https://developer.tomtom.com/geocoding-api/documentation/product-information/introduction',
    absorbedPattern: 'Machine-oriented geocoding, typo-tolerant address lookup, and entry-point accuracy ideas.',
    dependencyPolicy: 'optional-adapter',
  },
  {
    id: 'mapbox',
    name: 'Mapbox Search',
    sourceUrl: 'https://docs.mapbox.com/api/search/geocoding/',
    absorbedPattern: 'Forward/reverse geocoding, language-aware results, feature types, routable points, and entrances.',
    dependencyPolicy: 'optional-adapter',
  },
  {
    id: 'overture-maps',
    name: 'Overture Maps',
    sourceUrl: 'https://docs.overturemaps.org/',
    absorbedPattern: 'Open map data themes for addresses, buildings, places, divisions, and transportation.',
    dependencyPolicy: 'oss-data-source',
  },
  {
    id: 'okta',
    name: 'Okta Identity Engine',
    sourceUrl: 'https://developer.okta.com/docs/concepts/oie-intro/',
    absorbedPattern: 'Policy-driven identity, staff/device/admin authorization, and step-up verification.',
    dependencyPolicy: 'reference-only',
  },
  {
    id: 'persona',
    name: 'Persona',
    sourceUrl: 'https://docs.withpersona.com/getting-started',
    absorbedPattern: 'Verification flows, review cases, workflow routing, and audit-friendly decision UX.',
    dependencyPolicy: 'reference-only',
  },
  {
    id: 'world-id',
    name: 'World ID',
    sourceUrl: 'https://docs.world.org/',
    absorbedPattern: 'Uniqueness and proof-of-membership ideas without making biometrics or identity the AGID core.',
    dependencyPolicy: 'reference-only',
  },
  {
    id: 'vercel',
    name: 'Vercel',
    sourceUrl: 'https://vercel.com/docs',
    absorbedPattern: 'Developer experience, templates, deployment checklists, docs, SDKs, and dashboards.',
    dependencyPolicy: 'reference-only',
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare Workers',
    sourceUrl: 'https://developers.cloudflare.com/workers/',
    absorbedPattern: 'Edge resolver, local-first fallback, cache strategy, abuse controls, and Anycast-like routing.',
    dependencyPolicy: 'reference-only',
  },
  {
    id: 'clearbit',
    name: 'Clearbit',
    sourceUrl: 'https://help.clearbit.com/hc/en-us/categories/360000913214-APIs',
    absorbedPattern: 'Company and destination enrichment patterns, limited to public/business data by default.',
    dependencyPolicy: 'reference-only',
  },
  {
    id: 'opencorporates',
    name: 'OpenCorporates',
    sourceUrl: 'https://api.opencorporates.com/documentation/API-Reference',
    absorbedPattern: 'Public company metadata, issuer verification, carrier identity, and business-location evidence.',
    dependencyPolicy: 'optional-adapter',
  },
];

const BLUEPRINTS: AddressPlatformBlueprint[] = [
  {
    id: 'agid-place-record',
    name: 'AGID Place Record',
    status: 'partial',
    inspiredBy: ['google-maps-platform', 'mapbox', 'overture-maps', 'tomtom'],
    purpose: 'AGIDに紐づく場所・建物・入口・POI・自然地物・配送地点を、公開可能な標準レコードとして扱う。',
    absorbedAs: ['place record', 'delivery point record', 'entrance/routable point metadata', 'public natural-feature descriptor'],
    implementationRefs: [
      'src/lib/mapFeatureAddress.ts',
      'src/lib/naturalAddress.ts',
      'src/lib/agidAddressIntelligenceEngine.ts',
      'src/lib/addressResolutionSystem.ts',
    ],
    verificationRefs: [
      'src/lib/mapFeatureAddress.test.ts',
      'src/lib/naturalAddress.test.ts',
      'src/lib/addressResolutionSystem.test.ts',
    ],
    privacySafeguards: [
      'AGID Place Recordは公開可能な場所metadataに限定し、AOID private descriptor、部屋番号、受取人名、電話番号を含めない。',
      '高リスク用途では精密座標ではなくcoarse AGID、commitment、AGID-Sを使う。',
    ],
    antiPatterns: [
      'Google Place IDのような外部IDへ中核解決を固定依存させる。',
      '入口や部屋番号を公開Place Recordへ混ぜて個人住所を復元可能にする。',
    ],
    nextSteps: [
      'AGID Place RecordのJSON schemaを追加し、building/entrance/poi/natural/delivery-pointを型で分離する。',
    ],
  },
  {
    id: 'address-validation-pipeline',
    name: 'Address Validation Pipeline',
    status: 'partial',
    inspiredBy: ['google-maps-platform', 'here-technologies', 'tomtom', 'mapbox', 'overture-maps'],
    purpose: '郵便番号、国別住所制度、AGID逆ジオ、地物名、配送可否、ユーザー訂正を統合し、内部品質判定を返す。',
    absorbedAs: ['place/address confidence', 'validation evidence chain', 'postal/geocode/delivery-quality fusion'],
    implementationRefs: [
      'src/lib/addressVerificationEngine.ts',
      'src/lib/addressValidation.ts',
      'src/lib/shippingAddressAccuracy.ts',
      'src/services/PostalCodeDB.ts',
    ],
    verificationRefs: [
      'src/lib/addressVerificationEngine.test.ts',
      'src/lib/addressValidation.test.ts',
      'src/lib/shippingAddressAccuracy.test.ts',
    ],
    privacySafeguards: [
      'ユーザーには細かい品質スコアを出さず、verified / partial / needs-reviewなど操作判断だけを表示する。',
      '外部adapterへ送る場合はredaction済み住所またはpublic place queryに限定し、AOIDやAGID-S payloadを送らない。',
    ],
    antiPatterns: [
      '有料・proprietary geocoderを必須依存にする。',
      '低品質住所を高確信として表示し、再検証や手動確認を省略する。',
    ],
    nextSteps: [
      'Address Validation Pipelineのevidence型を統一し、郵便番号/逆ジオ/配送可否/ユーザー訂正を同じconfidence modelへ流す。',
    ],
  },
  {
    id: 'address-identity',
    name: 'Address Identity',
    status: 'partial',
    inspiredBy: ['okta', 'persona', 'world-id'],
    purpose: 'AOID credential、issuer trust、passkey、staff/device/admin権限を住所用途に限定して扱う。',
    absorbedAs: ['issuer trust policy', 'staff/device/admin authorization', 'AOID credential verification', 'step-up recipient proof'],
    implementationRefs: [
      'src/lib/addressIdentity.ts',
      'src/lib/addressCredential.ts',
      'src/lib/credentialIssuerTrustRegistry.ts',
      'src/lib/aoidOwnershipProof.ts',
      'src/lib/regionMembershipProof.ts',
    ],
    verificationRefs: [
      'src/lib/addressIdentity.test.ts',
      'src/lib/addressCredential.test.ts',
      'src/lib/credentialIssuerTrustRegistry.test.ts',
      'src/lib/aoidOwnershipProof.test.ts',
    ],
    privacySafeguards: [
      '本人そのものではなく、住所権限・居住属性・配送資格など用途別credentialだけを扱う。',
      '用途横断追跡を避けるため、domain separation、短期alias、nullifier、purpose scopeを必須にする。',
    ],
    antiPatterns: [
      'World ID的な本人性や生体情報をAGID/AOIDの中核へ入れる。',
      'AOIDを固定公開IDとして店舗・配送業者・支援団体で使い回す。',
    ],
    nextSteps: [
      'Address Identity policyをstaff/device/admin/issuer/recipientへ分割し、POSとAPIの権限判定を同じpolicy moduleに寄せる。',
    ],
  },
  {
    id: 'address-enrichment',
    name: 'Address Enrichment',
    status: 'partial',
    inspiredBy: ['clearbit', 'opencorporates', 'overture-maps', 'mapbox'],
    purpose: '建物名、入口、階層、配送メモ、法人拠点、issuer/配送業者メタデータを補完する。',
    absorbedAs: ['public business enrichment', 'issuer/carrier evidence', 'building and entrance metadata', 'delivery memo suggestions'],
    implementationRefs: [
      'src/lib/addressEntityResolution.ts',
      'src/lib/externalAddressValidationApps.ts',
      'src/lib/openSourceAddressResolutionStrategy.ts',
      'src/lib/crossBorderAuxiliaryData.ts',
    ],
    verificationRefs: [
      'src/lib/addressEntityResolution.test.ts',
      'src/lib/externalAddressValidationApps.test.ts',
      'src/lib/openSourceAddressResolutionStrategy.test.ts',
    ],
    privacySafeguards: [
      '個人住所のenrichmentは既定で無効にし、公開法人情報・公開地物・配送地点metadataから始める。',
      'フィードバック学習はraw住所を共有せず、local/private aggregateまたは差分プライバシー集計へ送る。',
    ],
    antiPatterns: [
      '個人宅を企業enrichmentのように自動補完して過剰な情報を表示する。',
      'OpenCorporates等の法人情報を個人住所の正当性証明と混同する。',
    ],
    nextSteps: [
      'Business/public-place enrichmentとpersonal-address enrichmentを別adapterにし、後者は明示同意とredactionを必須にする。',
    ],
  },
  {
    id: 'address-developer-platform',
    name: 'Address Developer Platform',
    status: 'partial',
    inspiredBy: ['vercel', 'cloudflare'],
    purpose: 'SDK、CLI、OpenAPI、test vectors、dashboard、webhook、テンプレートでAGID/AOID導入体験を整える。',
    absorbedAs: ['SDK/CLI/DX', 'template apps', 'OpenAPI and webhook logs', 'launch checklist'],
    implementationRefs: [
      'src/lib/openApiSpec.ts',
      'src/lib/apiEndpoints.ts',
      'src/lib/mcpServer.ts',
      'src/lib/addressLaunchCenter.ts',
    ],
    verificationRefs: [
      'src/lib/openApiSpec.test.ts',
      'src/lib/apiEndpoints.test.ts',
      'src/lib/mcpServer.test.ts',
      'src/lib/addressLaunchCenter.test.ts',
    ],
    privacySafeguards: [
      'テンプレートはLocal Only / Server Registry / ZK / Ethereumのmodeを選べるようにし、住所平文保存を既定にしない。',
      'SDKのtest vectorにはsynthetic住所とcommitmentだけを使う。',
    ],
    antiPatterns: [
      'EthereumやZKを必須にして通常POS/EC導入の速度と費用を落とす。',
      'Quickstartがraw住所ログやdebug payloadを標準出力へ出す。',
    ],
    nextSteps: [
      'Address Element、POS Terminal、Resolver APIのstarter templatesとlaunch checklistを同じdocs導線に統合する。',
    ],
  },
  {
    id: 'address-review-console',
    name: 'Address Review Console',
    status: 'partial',
    inspiredBy: ['persona', 'okta'],
    purpose: '住所審査、要確認、拒否、監査、再照合、異議申し立てを担当者が迷わず処理できる画面にする。',
    absorbedAs: ['verification flow', 'manual review queue', 'case audit timeline', 'role-based review decisions'],
    implementationRefs: [
      'src/components/AddressDashboardScreen.tsx',
      'src/lib/addressPortal.ts',
      'src/lib/addressRadar.ts',
      'src/lib/addressSignal.ts',
      'src/lib/posDesignReview.ts',
    ],
    verificationRefs: [
      'src/lib/addressPortal.test.ts',
      'src/lib/addressRadar.test.ts',
      'src/lib/addressSignal.test.ts',
      'src/lib/posDesignReview.test.ts',
    ],
    privacySafeguards: [
      '審査queueはredacted viewを基本にし、実住所や証明詳細の閲覧は権限・目的・監査理由を要求する。',
      '拒否/要確認理由はユーザー説明可能な粒度にしつつ、悪用可能な内部スコアは出さない。',
    ],
    antiPatterns: [
      '警告を小さく隠し、POS担当者が危険なhandoffを見落とす。',
      'reviewer全員にraw住所、AOID、配送履歴を広く見せる。',
    ],
    nextSteps: [
      'Address Review ConsoleにAddress Radarの判定理由、再照合receipt、staff action logを統合する。',
    ],
  },
  {
    id: 'address-search-federation',
    name: 'Address Search Federation',
    status: 'partial',
    inspiredBy: ['here-technologies', 'tomtom', 'mapbox', 'overture-maps'],
    purpose: '多言語地名、POI、道路、入口、自然地物、郵便番号を複数sourceから検索し、AGID候補へ正規化する。',
    absorbedAs: ['federated geocoder', 'language-aware ranking', 'source confidence normalization', 'POI/entrance candidate fusion'],
    implementationRefs: [
      'src/lib/geocodingSearch.ts',
      'src/lib/advancedSearch.ts',
      'src/lib/searchQuery.ts',
      'src/lib/placeSearchLanguage.ts',
      'src/lib/spatialAddressIndex.ts',
    ],
    verificationRefs: [
      'src/lib/geocodingSearch.test.ts',
      'src/lib/advancedSearch.test.ts',
      'src/lib/spatialAddressIndex.test.ts',
    ],
    privacySafeguards: [
      '外部検索は公開place queryまたはcoarse locationに限定し、個人AOIDや部屋番号を候補検索に送らない。',
      'providerごとのconfidenceを鵜呑みにせず、AGID内部のquality modelへ正規化する。',
    ],
    antiPatterns: [
      '1 providerの検索結果を真実として採用し、国別住所制度や配送可否を無視する。',
      '言語タブの表示名だけ変えて、検索rankingやaddress formattingを変えない。',
    ],
    nextSteps: [
      'source別candidate adapterを追加し、Nominatim/Pelias/OpenAddresses/Overtureの無料OSS経路を優先順に組む。',
    ],
  },
  {
    id: 'edge-address-resolver',
    name: 'Edge Address Resolver',
    status: 'partial',
    inspiredBy: ['cloudflare', 'vercel'],
    purpose: 'local-first resolverを中心に、必要なときだけedge/server/federated resolverへ委譲する。',
    absorbedAs: ['edge resolver', 'local-first fallback', 'cache-control/TTL policy', 'rate limit and abuse control'],
    implementationRefs: [
      'src/lib/agidLocalResolver.ts',
      'src/lib/agidRegistryApi.ts',
      'src/lib/federatedResolver.ts',
      'src/lib/addressRetrievalCache.ts',
      'src/lib/addressInternetProtocols.ts',
    ],
    verificationRefs: [
      'src/lib/agidLocalResolver.test.ts',
      'src/lib/agidRegistryApi.test.ts',
      'src/lib/federatedResolver.test.ts',
      'src/lib/addressRetrievalCache.test.ts',
    ],
    privacySafeguards: [
      'reverse lookup abuseを防ぐため、rate limit、coarse cache、purpose scope、high-risk modeをresolver policyに含める。',
      '精密AGIDや住所履歴はedge cacheへ長期保存しない。',
    ],
    antiPatterns: [
      'Anycast的高速化のために全世界のedgeへ個人住所やAOID履歴を複製する。',
      'TTLなしで災害避難所や配送可否を古いまま返す。',
    ],
    nextSteps: [
      'resolver responseにTTL、ETag、confidence、restricted/high-risk statusを標準フィールドとして追加する。',
    ],
  },
  {
    id: 'zk-credential-uniqueness',
    name: 'ZK Credential Uniqueness',
    status: 'partial',
    inspiredBy: ['world-id', 'persona', 'okta'],
    purpose: '本人そのものを登録せず、重複しない資格・居住・配送可能性・未使用状態だけを証明する。',
    absorbedAs: ['duplicate-resistant credential', 'ZK residence proof', 'anonymous nullifier', 'scope-bound eligibility proof'],
    implementationRefs: [
      'src/lib/addressDuplicateNullifier.ts',
      'src/lib/anonymousRateLimitProof.ts',
      'src/lib/privateAddressPredicateProof.ts',
      'src/lib/regionMembershipProof.ts',
      'src/lib/qualityThresholdProof.ts',
    ],
    verificationRefs: [
      'src/lib/addressDuplicateNullifier.test.ts',
      'src/lib/anonymousRateLimitProof.test.ts',
      'src/lib/privateAddressPredicateProof.test.ts',
      'src/lib/regionMembershipProof.test.ts',
    ],
    privacySafeguards: [
      'nullifierはdomain-separatedにし、支援、配送、居住、返品など用途横断で同一人物・同一住所を追跡できないようにする。',
      'ZKは住所の真実性を単独保証しないため、issuer trust、失効、鮮度、監査receiptと併用する。',
    ],
    antiPatterns: [
      'ZK証明を使えば住所検証やissuer trustが不要になると説明する。',
      '同じnullifierを複数purposeで使い回して匿名性を壊す。',
    ],
    nextSteps: [
      'ZK証明ごとにpublic signal schemaとdomain separation registryを作り、Proof Bundle Compatibilityへ接続する。',
    ],
  },
];

export function getExternalInspirations(): ExternalInspiration[] {
  return EXTERNAL_INSPIRATIONS.map(source => ({ ...source }));
}

export function getExternalInspiration(id: ExternalInspirationId): ExternalInspiration {
  const source = EXTERNAL_INSPIRATIONS.find(item => item.id === id);
  if (!source) throw new Error(`unknown-external-inspiration:${id}`);
  return { ...source };
}

export function getAddressPlatformBlueprints(): AddressPlatformBlueprint[] {
  return BLUEPRINTS.map(blueprint => ({
    ...blueprint,
    inspiredBy: [...blueprint.inspiredBy],
    absorbedAs: [...blueprint.absorbedAs],
    implementationRefs: [...blueprint.implementationRefs],
    verificationRefs: [...blueprint.verificationRefs],
    privacySafeguards: [...blueprint.privacySafeguards],
    antiPatterns: [...blueprint.antiPatterns],
    nextSteps: [...blueprint.nextSteps],
  }));
}

export function getAddressPlatformBlueprint(id: AddressPlatformBlueprintId): AddressPlatformBlueprint {
  const blueprint = BLUEPRINTS.find(item => item.id === id);
  if (!blueprint) throw new Error(`unknown-address-platform-blueprint:${id}`);
  return getAddressPlatformBlueprints().find(item => item.id === id)!;
}

export function summarizeAddressPlatformBlueprints(): AddressPlatformBlueprintSummary {
  const blueprints = getAddressPlatformBlueprints();
  const externalInspirations = getExternalInspirations();
  const byStatus = (status: AddressPlatformBlueprintStatus) => blueprints
    .filter(blueprint => blueprint.status === status)
    .map(blueprint => blueprint.id);

  return {
    version: ADDRESS_PLATFORM_BLUEPRINT_VERSION,
    totalBlueprints: blueprints.length,
    partial: byStatus('partial').length,
    planned: byStatus('planned').length,
    externalInspirations: externalInspirations.length,
    optionalAdapters: externalInspirations
      .filter(source => source.dependencyPolicy === 'optional-adapter')
      .map(source => source.id),
    ossDataSources: externalInspirations
      .filter(source => source.dependencyPolicy === 'oss-data-source')
      .map(source => source.id),
    privacyCriticalBlueprints: blueprints
      .filter(blueprint => blueprint.privacySafeguards.length > 0)
      .map(blueprint => blueprint.id),
    highestPriorityNextSteps: blueprints
      .map(blueprint => blueprint.nextSteps[0])
      .filter((step): step is string => Boolean(step))
      .slice(0, 8),
  };
}

export function validateAddressPlatformBlueprints(
  blueprints = getAddressPlatformBlueprints(),
  externalInspirations = getExternalInspirations(),
): AddressPlatformBlueprintValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const knownSourceIds = new Set(externalInspirations.map(source => source.id));
  const seen = new Set<string>();

  for (const source of externalInspirations) {
    if (!source.sourceUrl.startsWith('https://')) errors.push(`non-https-source:${source.id}`);
    if (source.dependencyPolicy === 'optional-adapter') {
      warnings.push(`optional-paid-or-registered-adapter:${source.id}`);
    }
  }

  for (const blueprint of blueprints) {
    if (seen.has(blueprint.id)) errors.push(`duplicate-blueprint:${blueprint.id}`);
    seen.add(blueprint.id);
    if (!blueprint.name.trim()) errors.push(`missing-name:${blueprint.id}`);
    if (!blueprint.purpose.trim()) errors.push(`missing-purpose:${blueprint.id}`);
    if (blueprint.inspiredBy.length === 0) errors.push(`missing-inspiration:${blueprint.id}`);
    if (blueprint.absorbedAs.length === 0) errors.push(`missing-absorbed-as:${blueprint.id}`);
    if (blueprint.privacySafeguards.length === 0) errors.push(`missing-privacy-safeguard:${blueprint.id}`);
    if (blueprint.antiPatterns.length === 0) errors.push(`missing-anti-pattern:${blueprint.id}`);
    if (blueprint.nextSteps.length === 0) errors.push(`missing-next-step:${blueprint.id}`);
    for (const sourceId of blueprint.inspiredBy) {
      if (!knownSourceIds.has(sourceId)) errors.push(`unknown-inspiration:${blueprint.id}:${sourceId}`);
    }
    if (blueprint.status === 'partial' && blueprint.implementationRefs.length === 0) {
      errors.push(`partial-without-implementation-ref:${blueprint.id}`);
    }
    if (blueprint.status === 'partial' && blueprint.verificationRefs.length === 0) {
      errors.push(`partial-without-verification-ref:${blueprint.id}`);
    }
    if (blueprint.status === 'planned' && blueprint.implementationRefs.length > 0) {
      warnings.push(`planned-with-implementation-ref:${blueprint.id}`);
    }
  }

  const requiredBlueprints: AddressPlatformBlueprintId[] = [
    'agid-place-record',
    'address-validation-pipeline',
    'address-identity',
    'address-enrichment',
    'address-developer-platform',
    'address-review-console',
  ];
  for (const id of requiredBlueprints) {
    if (!seen.has(id)) errors.push(`missing-required-blueprint:${id}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
