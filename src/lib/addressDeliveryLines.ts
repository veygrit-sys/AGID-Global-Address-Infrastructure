// Published postal lines can contain an entire address component, several components,
// or a delivery instruction. Preserve the original even when a familiar pattern parses.
export const DELIVERY_LINE_KEYS = ['addressLine1', 'addressLine2', 'addressLine3'] as const;
export type DeliveryLineKey = typeof DELIVERY_LINE_KEYS[number];
export type DeliveryLines = Partial<Record<DeliveryLineKey, string>>;

export function readDeliveryLines(input: Record<string, unknown>): DeliveryLines {
  const lines: DeliveryLines = {};
  for (const [i, key] of DELIVERY_LINE_KEYS.entries()) {
    const n = i + 1;
    const aliases = [key, `line${n}`, `addressline${n}`, `address_line_${n}`, `address_line${n}`];
    for (const alias of aliases) {
      const value = input[alias];
      if (typeof value === 'string' && value.trim()) {
        lines[key] = value;
        break;
      }
    }
  }
  return lines;
}

type ParsedDeliveryAddress = Partial<Record<'street' | 'houseNumber' | 'subdistrict' | 'unit', string>>;

const ENGLISH_STREET = /^(\d+[A-Z]?)\s+([\p{L}\d][\p{L}\p{M}\d .’'\-]*\s(?:ST(?:REET)?|AVE(?:NUE)?|RD|ROAD|LN|LANE|BLVD|BOULEVARD|DR(?:IVE)?|CT|COURT|PL(?:ACE)?|WAY|CIR(?:CLE)?|HWY|HIGHWAY|TER(?:RACE)?|CRES(?:CENT)?|PKWY|PARKWAY)\.?(?:\s+(?:N|S|E|W|NE|NW|SE|SW))?)$/iu;
const PUERTO_RICO_STREET = /^([A-Z]?\d+[A-Z]?)\s+((?:CALLE|AVENIDA|AVE|CARR)\.?\s+[\p{L}\d][\p{L}\p{M}\d .’'\-]*)$/iu;

function primaryLine(country: string, state: string, line: string): ParsedDeliveryAddress {
  if (country === 'CN') {
    const match = /^([\p{Script=Han}A-Za-z\d·]+(?:路|街|巷|弄|大道))\s*([0-9０-９]+(?:之[0-9０-９]+)?[号號])$/u.exec(line);
    return match ? { street: match[1], houseNumber: match[2] } : {};
  }
  if (country === 'JP') {
    // Only split explicit Japanese block/number notation. Bare "1-2-3" may be a land-lot address.
    const match = /^([\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ヶケー]+?)\s*([0-9０-９]+丁目[0-9０-９]+番[0-9０-９]+号)$/u.exec(line);
    return match ? { subdistrict: match[1], houseNumber: match[2] } : {};
  }
  if (country === 'FR' || country === 'LU') {
    const match = /^(\d+(?:\s+(?:bis|ter|quater))?),?\s+((?:rue|avenue|boulevard|route|place|chemin|impasse|allée)\s+[\p{L}\p{M}\d .’'\-]+)$/iu.exec(line);
    return match ? { houseNumber: match[1], street: match[2] } : {};
  }
  if (country === 'NL') {
    const match = /^([\p{L}\p{M} .’'\-]+(?:straat|laan|weg|plein|dijk|gracht))\s+(\d+[a-z]?)$/iu.exec(line);
    return match ? { street: match[1], houseNumber: match[2] } : {};
  }
  if (country === 'MX') {
    // An explicit exterior-number marker avoids confusing numbered roads with premises.
    const match = /^((?:calle|avenida|calzada|boulevard)\s+[\p{L}\p{M}\d .’'\-]+?)\s+(?:n[oú]m(?:ero)?\.?\s+exterior|no\.)\s+(\d+[a-z]?)$/iu.exec(line);
    return match ? { street: match[1], houseNumber: match[2] } : {};
  }
  if (country === 'PR' || (country === 'US' && state.toUpperCase() === 'PR')) {
    const match = PUERTO_RICO_STREET.exec(line);
    if (match) return { houseNumber: match[1], street: match[2] };
  }
  if (['US', 'CA', 'NZ', 'AU', 'PR'].includes(country)) {
    const match = ENGLISH_STREET.exec(line);
    if (match) return { houseNumber: match[1], street: match[2] };
  }
  return {};
}

export function parseDeliveryLines(
  country: string, state: string, lines: DeliveryLines, explicit: ParsedDeliveryAddress,
): ParsedDeliveryAddress & { parsedLineKeys: DeliveryLineKey[] } {
  const primary = primaryLine(country, state, lines.addressLine1?.trim() ?? '');
  // Conflicting explicit values could refer to a different address. Never splice
  // in a number/street from that line to make a new combination.
  const parsedLineKeys: DeliveryLineKey[] = [];
  for (const key of ['street', 'houseNumber', 'subdistrict'] as const) {
    if (primary[key] && explicit[key] && primary[key] !== explicit[key]) return { parsedLineKeys };
  }
  if (primary.houseNumber) parsedLineKeys.push('addressLine1');
  if (['US', 'PR', 'CA', 'NZ', 'AU'].includes(country)) {
    const units: { key: DeliveryLineKey; value: string }[] = [];
    for (const key of ['addressLine2', 'addressLine3'] as const) {
      const match = /^(?:APT|APARTMENT|UNIT|SUITE|STE)\.?\s+([A-Z\d]+(?:[-/][A-Z\d]+)*)$/i.exec(lines[key]?.trim() ?? '');
      if (match) units.push({ key, value: match[1] });
    }
    if (units.length === 1 && (!explicit.unit || explicit.unit === units[0].value)) {
      primary.unit = units[0].value;
      parsedLineKeys.push(units[0].key);
    }
  }
  return { ...primary, parsedLineKeys };
}
