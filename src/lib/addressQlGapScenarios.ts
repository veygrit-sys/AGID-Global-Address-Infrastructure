export const ADDRESSQL_GAP_SCENARIOS_VERSION = 'addressql-gap-scenarios-v0.1';

export type AddressQlGapCategory =
  | 'source-completeness'
  | 'delivery-operations'
  | 'wallet-consent'
  | 'carrier-contract'
  | 'legal-compliance'
  | 'privacy-security'
  | 'temporal-history'
  | 'mobility-optimization'
  | 'settlement-evidence';

export type AddressQlGapOutcome =
  | 'unresolved'
  | 'requires-source'
  | 'requires-wallet-approval'
  | 'requires-carrier-adapter'
  | 'requires-human-review'
  | 'requires-commercial-layer'
  | 'requires-legal-policy'
  | 'requires-real-time-signal';

export type AddressQlMissingLayer =
  | 'official-source-catalog'
  | 'carrier-connect'
  | 'address-wallet'
  | 'merchant-console'
  | 'evidence-vault'
  | 'settlement-ledger'
  | 'risk-engine'
  | 'realtime-mobility'
  | 'legal-policy-engine'
  | 'manual-ops';

export type AddressQlGapScenario = {
  id: string;
  title: string;
  category: AddressQlGapCategory;
  situation: string;
  whyAddressQlAloneIsInsufficient: string;
  safeAddressQlBehavior: AddressQlGapOutcome;
  missingLayers: AddressQlMissingLayer[];
  firstExecutableArtifact: string;
  nonClaims: string[];
};

export const ADDRESSQL_GAP_SCENARIOS: AddressQlGapScenario[] = [
  {
    id: 'global-official-source-missing',
    title: 'Official source missing or not licensed',
    category: 'source-completeness',
    situation: 'A country, island, subdivision, postal area, or natural place name is missing from official or licensed source packs.',
    whyAddressQlAloneIsInsufficient: 'SQL can mark absence in the loaded source version, but it cannot infer that the real world entity does not exist.',
    safeAddressQlBehavior: 'requires-source',
    missingLayers: ['official-source-catalog', 'manual-ops'],
    firstExecutableArtifact: 'source completeness gate by official/OSM/GeoNames/Wikidata/admin/island/POI/natural/alias category',
    nonClaims: ['Missing from fixture or source pack is not proof that the place does not exist.'],
  },
  {
    id: 'friend-delivery-without-recipient-approval',
    title: 'Friend delivery before recipient approval',
    category: 'wallet-consent',
    situation: 'A purchaser chooses an Address Wallet friend, but the recipient has not approved the delivery request.',
    whyAddressQlAloneIsInsufficient: 'AddressQL can validate address-shaped data, but it cannot grant disclosure rights or recipient consent.',
    safeAddressQlBehavior: 'requires-wallet-approval',
    missingLayers: ['address-wallet', 'evidence-vault'],
    firstExecutableArtifact: 'friend delivery approval vector and consent receipt schema',
    nonClaims: ['Address Wallet friendship, login, or social graph membership is not delivery consent or residence proof.'],
  },
  {
    id: 'carrier-feature-not-supported',
    title: 'Carrier feature not supported in selected market',
    category: 'carrier-contract',
    situation: 'A merchant requests pickup, locker, COD, QR label, return label, or international documents for a carrier that does not support it.',
    whyAddressQlAloneIsInsufficient: 'AddressQL can expose carrier-neutral intent, but live support depends on carrier contracts, region, service level, and credentials.',
    safeAddressQlBehavior: 'requires-carrier-adapter',
    missingLayers: ['carrier-connect', 'merchant-console', 'manual-ops'],
    firstExecutableArtifact: 'carrier capability matrix with unsupported-feature fixtures',
    nonClaims: ['A normalized AddressQL function does not guarantee carrier feature availability.'],
  },
  {
    id: 'fastest-cheapest-live-ranking',
    title: 'Fastest or cheapest route depends on live signals',
    category: 'mobility-optimization',
    situation: 'The buyer asks for fastest or cheapest delivery, but rates, capacity, congestion, weather, cutoff times, and handoff queues change in real time.',
    whyAddressQlAloneIsInsufficient: 'Source-versioned SQL is not enough for live capacity and mobility state.',
    safeAddressQlBehavior: 'requires-real-time-signal',
    missingLayers: ['realtime-mobility', 'carrier-connect', 'risk-engine'],
    firstExecutableArtifact: 'rate quote and carrier allocation fixture with stale-signal non-claims',
    nonClaims: ['Fastest, cheapest, or ETA output is an estimate, not a carrier SLA guarantee.'],
  },
  {
    id: 'merchant-should-not-see-raw-address',
    title: 'Merchant must not see recipient raw address',
    category: 'privacy-security',
    situation: 'A merchant wants to ship to a wallet recipient or friend without seeing the recipient address.',
    whyAddressQlAloneIsInsufficient: 'AddressQL can mark privacy boundaries, but it does not operate the disclosure channel, encryption, or carrier handoff.',
    safeAddressQlBehavior: 'requires-commercial-layer',
    missingLayers: ['address-wallet', 'carrier-connect', 'evidence-vault'],
    firstExecutableArtifact: 'carrier-decryptable handoff ref and no-raw-address merchant callback test',
    nonClaims: ['Masking or hashing an address is not sufficient anonymous shipping.'],
  },
  {
    id: 'address-change-after-order',
    title: 'Recipient address changes after order creation',
    category: 'temporal-history',
    situation: 'A recipient changes address after a shipment intent is created but before label purchase, pickup, or delivery.',
    whyAddressQlAloneIsInsufficient: 'SQL history can record versions, but delivery execution needs policy for when old versus new address may be used.',
    safeAddressQlBehavior: 'requires-wallet-approval',
    missingLayers: ['address-wallet', 'carrier-connect', 'evidence-vault'],
    firstExecutableArtifact: 'address change event and shipment intent reauthorization fixture',
    nonClaims: ['Latest address value must not silently rewrite existing shipment obligations or evidence.'],
  },
  {
    id: 'restricted-building-or-access-note',
    title: 'Restricted building, gate, locker, or private access note',
    category: 'delivery-operations',
    situation: 'Delivery requires gate code, reception desk, tower access, port/airport gate, factory entry, or locker constraints.',
    whyAddressQlAloneIsInsufficient: 'AddressQL can score difficulty or represent a bottleneck, but private access instructions need scoped, auditable delivery channels.',
    safeAddressQlBehavior: 'requires-human-review',
    missingLayers: ['carrier-connect', 'manual-ops', 'evidence-vault'],
    firstExecutableArtifact: 'private access note policy and redacted handoff receipt fixture',
    nonClaims: ['Delivery difficulty score must not become a hidden denial rule or blacklist.'],
  },
  {
    id: 'legal-or-sanctions-block',
    title: 'Legal, sanctions, customs, or public-sector restriction',
    category: 'legal-compliance',
    situation: 'A shipment crosses legal, customs, sanctions, hazardous goods, age-gated, or public-sector policy boundaries.',
    whyAddressQlAloneIsInsufficient: 'AddressQL can expose country and region metadata, but legal decisions require policy, jurisdiction, product, party, and carrier context.',
    safeAddressQlBehavior: 'requires-legal-policy',
    missingLayers: ['legal-policy-engine', 'carrier-connect', 'merchant-console'],
    firstExecutableArtifact: 'legal policy decision fixture with product and jurisdiction refs',
    nonClaims: ['Country or postal validation is not customs, sanctions, tax, or legal compliance approval.'],
  },
  {
    id: 'proof-or-kyc-overclaim',
    title: 'Address proof or KYC overclaim',
    category: 'privacy-security',
    situation: 'A verifier tries to treat postal validation, ZK predicate, or wallet login as proof of legal identity or residence.',
    whyAddressQlAloneIsInsufficient: 'AddressQL can define proof input/output shape, but issuer authority, revocation, claim scope, and legal acceptance are external.',
    safeAddressQlBehavior: 'requires-legal-policy',
    missingLayers: ['address-wallet', 'evidence-vault', 'legal-policy-engine'],
    firstExecutableArtifact: 'proof scope registry and non-claim tests',
    nonClaims: ['ZK-ready, postal-valid, or wallet-authenticated does not mean legally KYC-verified.'],
  },
  {
    id: 'label-billing-or-carrier-adjustment',
    title: 'Label billing, adjustment, refund, or carrier invoice',
    category: 'settlement-evidence',
    situation: 'Carrier adjusts package dimensions, surcharge, failed pickup, return cost, refund, or invoice after label purchase.',
    whyAddressQlAloneIsInsufficient: 'AddressQL does not maintain financial ledgers, carrier invoice reconciliation, tax treatment, or dispute workflows.',
    safeAddressQlBehavior: 'requires-commercial-layer',
    missingLayers: ['settlement-ledger', 'evidence-vault', 'merchant-console'],
    firstExecutableArtifact: 'settlement entry and carrier adjustment event schema',
    nonClaims: ['Label creation is not final settlement, proof of delivery, or dispute resolution.'],
  },
];

export function validateAddressQlGapScenarios(scenarios = ADDRESSQL_GAP_SCENARIOS): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const categories = new Set(scenarios.map(scenario => scenario.category));

  for (const scenario of scenarios) {
    if (ids.has(scenario.id)) errors.push(`duplicate scenario: ${scenario.id}`);
    ids.add(scenario.id);
    if (!scenario.whyAddressQlAloneIsInsufficient) errors.push(`${scenario.id}: missing insufficiency reason`);
    if (scenario.missingLayers.length === 0) errors.push(`${scenario.id}: missing layers`);
    if (!scenario.firstExecutableArtifact) errors.push(`${scenario.id}: missing executable artifact`);
    if (scenario.nonClaims.length === 0) errors.push(`${scenario.id}: missing non-claims`);
    if (scenario.safeAddressQlBehavior === 'unresolved' && scenario.missingLayers.length === 0) {
      errors.push(`${scenario.id}: unresolved scenarios still need next-layer guidance`);
    }
  }

  for (const required of ['source-completeness', 'wallet-consent', 'carrier-contract', 'privacy-security', 'settlement-evidence'] satisfies AddressQlGapCategory[]) {
    if (!categories.has(required)) errors.push(`missing category: ${required}`);
  }
  if (!scenarios.some(scenario => scenario.missingLayers.includes('carrier-connect'))) {
    errors.push('carrier-connect layer must appear in gap scenarios');
  }
  if (!scenarios.some(scenario => scenario.missingLayers.includes('address-wallet'))) {
    errors.push('address-wallet layer must appear in gap scenarios');
  }

  return errors;
}
