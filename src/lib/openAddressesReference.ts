import type { CanonicalAddressParts } from './addressIntelligence';

export type OpenAddressesRecord = {
  source: string;
  countryCode?: string;
  state?: string;
  city?: string;
  district?: string;
  street?: string;
  houseNumber?: string;
  postcode?: string;
  lat?: number;
  lon?: number;
};

export type AddressReferenceMatch = {
  source: string;
  confidence: number;
  record: OpenAddressesRecord;
};

const clean = (value: unknown) => String(value ?? '').normalize('NFKC').trim().toLowerCase();

export function matchOpenAddressesReference(
  address: CanonicalAddressParts,
  records: OpenAddressesRecord[]
): AddressReferenceMatch | null {
  let match: AddressReferenceMatch | null = null;
  for (const record of records) {
    if (!record || !record.source || !address.country_code || !address.road || !address.house_number) continue;
    if (clean(record.countryCode) !== clean(address.country_code)
      || clean(record.street) !== clean(address.road)
      || clean(record.houseNumber) !== clean(address.house_number)) continue;

    const context = [
      [address.city, record.city, 0.15],
      [address.state, record.state, 0.1],
      [address.postcode, record.postcode, 0.1],
      [address.district, record.district, 0],
    ] as const;
    if (context.some(([input, reference]) => input && clean(input) !== clean(reference))) continue;
    if (!address.city && !address.postcode) continue;
    // Two plausible records, even when one has extra metadata, require disambiguation.
    if (match) return null;
    const confidence = context.reduce((score, [input, , weight]) => score + (input ? weight : 0), 0.6);
    match = { source: record.source, record, confidence: Math.round(confidence * 100) / 100 };
  }
  return match;
}
