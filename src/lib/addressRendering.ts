
import {
countryName,
normalizeEnglishAddressBuildingName,
normalizeEnglishAddressPart,
renderStreetAddressLine,
uniqueAddressParts,
} from './addressEnglish';
import type { AddressFormat } from '../data/address_formats';
import { mergeOpenSourceAddressEvidence } from './addressEvidence';
import { renderAddressFormatTemplate } from './addressFormatRenderer';
import { applyShippingAbbreviations } from './addressUtils';
import {
renderMO,
} from './chineseAddressUtils';
import { renderEnglishAddressMode } from './englishAddressMode';
import { isEnglishAddressCountry,isInternationalShippingEnglishTab } from './languageTabs';
import { buildFrenchShippingAddress,isFrenchShippingCountry } from './frenchShippingAddress';
import { buildSpanishShippingAddress,isSpanishShippingCountry } from './spanishShippingAddress';
import { buildChineseShippingAddress,isChineseShippingCountry } from './chineseShippingAddress';
import {
buildMajorEuropeanShippingAddress,
isMajorEuropeanShippingCountry,
} from './majorEuropeanShippingAddress';
import {
buildArabicShippingAddress,
isArabicShippingCountry,
} from './arabicShippingAddress';
import {
buildRemainingEuropeanShippingAddress,
isRemainingEuropeanShippingCountry,
supportsRemainingEuropeanDomesticLanguage,
} from './remainingEuropeanShippingAddress';
import {
buildRemainingAfricanShippingAddress,
prefersRemainingAfricanInternationalRenderer,
supportsRemainingAfricanDomesticLanguage,
} from './remainingAfricanShippingAddress';
import {
buildRemainingAsianShippingAddress,
prefersRemainingAsianInternationalRenderer,
supportsRemainingAsianDomesticLanguage,
} from './remainingAsianShippingAddress';
import {
buildRemainingOceaniaShippingAddress,
prefersRemainingOceaniaInternationalRenderer,
supportsRemainingOceaniaDomesticLanguage,
} from './remainingOceaniaShippingAddress';

export interface CanonicalAddress {
  country_code: string;
  country: string;
  state: string;
  city: string;
  district: string;
  subdistrict: string;
  suburb: string;
  road: string;
  house_number: string;
  building: string;
  postcode: string;
  poi: string;
  plus_code?: string;
  po_box?: string;
  unit?: string;
  floor?: string;
  block?: string;
  zone?: string;
  additional_number?: string;
  short_address?: string;
}

/**
 * Unicode Normalization for Addresses
 */
export function normalizeUnicode(text: string): string {
  if (!text) return "";
  return text
    .normalize('NFKC') // Compatibility Decomposition, then Canonical Composition (handles fullwidth etc)
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
    .replace(/[\u3000\s]+/g, " ")
    .trim();
}

/**
 * Creates a Canonical Address object from raw API details
 */
export function createCanonicalAddress(details: any): CanonicalAddress {
  const safeDetails = details && typeof details === 'object' ? details : {};
  const source = safeDetails?.address_analysis?.canonical
    ? { ...safeDetails, ...safeDetails.address_analysis.canonical }
    : safeDetails;
  const parts = {
    poi: source.poi || source.map_feature_name || source.bridge || source.heritage_site || source.ruins || source.park || source.river || source.stream || source.canal || source.lake || source.salt_lake || source.reservoir || source.lagoon || source.oxbow || source.pond || source.bay || source.waterfall || source.water || source.waterway || source.mountain || source.peak || source.grassland || source.desert || source.dryland || source.wilderness || source.salt_flat || source.salt_pan || source.dry_lake || source.badlands || source.bare_rock || source.scree || source.shingle || source.forest || source.wetland || source.beach || source.island || source.islet || source.archipelago || source.island_group || source.atoll || source.cay || source.key || source.cave || source.valley || source.glacier || source.ice_field || source.reef || source.spring || source.natural_feature || source.amenity || source.shop || source.office || source.tourism || source.leisure || source.railway || source.aeroway || source.historic || source.station || source.healthcare || source.natural || "",
    country: source.country || "",
    country_code: (source.country_code || "").toUpperCase(),
    postcode: source.postcode || source.postal_code || source.zip || "",
    state: source.state || source.province || source.region || source.department || source.governorate || source.emirate || "",
    city: source.city || source.town || source.village || source.municipality || "",
    district: source.city_district || source.district || source.county || source.subdivision || "",
    subdistrict: source.subdistrict || source.suburb || source.neighbourhood || source.quarter || source.colonia || source.bairro || source.hamlet || "",
    suburb: source.suburb || source.hamlet || source.colonia || source.bairro || "",
    road: source.road || source.street || source.square || source.avenue || source.place || "",
    house_number: source.house_number || source.houseNumber || "",
    building: source.building || source.building_name || source.organization || source.flats || "",
    plus_code: source.plus_code?.global_code || source.plus_code?.plus_code || source.plus_code || "",
    po_box: source.po_box || source.post_office_box || source.pobox || "",
    unit: source.unit || source.apartment || source.flat || source.office_number || "",
    floor: source.floor || source.level || "",
    block: source.block || source.parcel || "",
    zone: source.zone || source.zone_number || "",
    additional_number: source.additional_number || source.secondary_number || "",
    short_address: source.short_address || "",
  };
  const { address: mergedParts } = mergeOpenSourceAddressEvidence(parts, details);

  const extendedParts: Partial<CanonicalAddress> = {
    ...(parts.po_box ? { po_box: parts.po_box } : {}),
    ...(parts.unit ? { unit: parts.unit } : {}),
    ...(parts.floor ? { floor: parts.floor } : {}),
    ...(parts.block ? { block: parts.block } : {}),
    ...(parts.zone ? { zone: parts.zone } : {}),
    ...(parts.additional_number ? { additional_number: parts.additional_number } : {}),
    ...(parts.short_address ? { short_address: parts.short_address } : {}),
  };

  return {
    country_code: mergedParts.country_code,
    country: mergedParts.country,
    state: mergedParts.state,
    city: mergedParts.city,
    district: mergedParts.district,
    subdistrict: mergedParts.subdistrict,
    suburb: mergedParts.suburb,
    road: mergedParts.road,
    house_number: mergedParts.house_number,
    building: mergedParts.building,
    postcode: mergedParts.postcode,
    poi: mergedParts.poi,
    plus_code: mergedParts.plus_code,
    ...extendedParts,
  };
}

const meaningfulAddressTextPattern =
  /[A-Za-zÀ-ž\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af\u0400-\u04ff\u0370-\u03ff\u0590-\u05ff\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\u0e00-\u0e7f]/;

const comparableAddressPart = (value: string) =>
  normalizeUnicode(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '')
    .trim();

function meaningfulAddressContextPart(value: string, country: string) {
  const cleaned = normalizeUnicode(value).replace(/^[,，、]\s*|,\s*$/g, '').trim();
  if (!cleaned) return '';

  const comparable = comparableAddressPart(cleaned);
  const comparableCountry = comparableAddressPart(country);
  if (comparableCountry && comparable === comparableCountry) return cleaned;
  if (/^\d+[a-z]?$/.test(comparable)) return '';
  return meaningfulAddressTextPattern.test(cleaned) ? cleaned : '';
}

function uniqueCanonicalParts(parts: string[]) {
  const seen = new Set<string>();
  return parts
    .map(part => normalizeUnicode(part))
    .filter(Boolean)
    .filter(part => {
      const comparable = comparableAddressPart(part);
      if (!comparable || seen.has(comparable)) return false;
      seen.add(comparable);
      return true;
    });
}

/**
 * Address Rendering Engine for International Shipping
 */
export class AddressRenderer {

  /**
   * Main entry point for rendering an address based on specific tab/context
   */
  static render(tab: string, data: CanonicalAddress, format?: AddressFormat | null): string {
    const canonical = this.normalizeCanonical(data);
    const formattedByCountryRules = format
      ? renderAddressFormatTemplate(format, tab, canonical as unknown as Record<string, unknown>)
      : '';
    if (formattedByCountryRules) return formattedByCountryRules;

    // Check if it's the specialized International English tab
    if (isInternationalShippingEnglishTab(tab)) {
      if (isArabicShippingCountry(canonical.country_code)) {
        return buildArabicShippingAddress(canonical, 'international-shipping').formatted;
      }
      if (isChineseShippingCountry(canonical.country_code)) {
        return buildChineseShippingAddress(canonical, 'international-shipping').formatted;
      }
      if (prefersRemainingAsianInternationalRenderer(canonical.country_code)) {
        return buildRemainingAsianShippingAddress(
          canonical,
          'international-shipping',
        ).formatted;
      }
      if (prefersRemainingOceaniaInternationalRenderer(canonical.country_code)) {
        return buildRemainingOceaniaShippingAddress(
          canonical,
          'international-shipping',
        ).formatted;
      }
      if (prefersRemainingAfricanInternationalRenderer(canonical.country_code)) {
        return buildRemainingAfricanShippingAddress(
          canonical,
          'international-shipping',
        ).formatted;
      }
      if (
        isRemainingEuropeanShippingCountry(canonical.country_code)
        && !['GB', 'IE'].includes(canonical.country_code)
      ) {
        return buildRemainingEuropeanShippingAddress(
          canonical,
          'international-shipping',
        ).formatted;
      }
      if (isMajorEuropeanShippingCountry(canonical.country_code)) {
        return buildMajorEuropeanShippingAddress(canonical, 'international-shipping').formatted;
      }
      if (isFrenchShippingCountry(canonical.country_code)) {
        return buildFrenchShippingAddress(canonical, 'international-shipping').formatted;
      }
      if (isSpanishShippingCountry(canonical.country_code)) {
        return buildSpanishShippingAddress(canonical, 'international-shipping').formatted;
      }
      return this.renderInternationalEnglish(canonical);
    }

    // Otherwise render by language code
    return this.renderByLanguage(tab, canonical);
  }

  private static normalizeCanonical(data: CanonicalAddress): CanonicalAddress {
    const result = { ...data };
    Object.keys(result).forEach(key => {
      const k = key as keyof CanonicalAddress;
      if (typeof result[k] === 'string') {
        result[k] = normalizeUnicode(result[k] as string);
      }
    });
    return result;
  }

  /**
   * Renders address based on the specified language code
   */
  private static renderByLanguage(lang: string, data: CanonicalAddress): string {
    const isEnglish = lang.startsWith('en') || lang === 'international' || lang === 'romaji';
    const c = data.country_code;

    if (c === 'HK' && isEnglish && lang === 'en_domestic') {
      return this.renderDomesticEnglish(data);
    }

    if (c === 'MO' && (lang === 'pt' || lang === 'pt-PT')) {
      return renderMO(data, lang);
    }

    if (isChineseShippingCountry(c)) {
      const mode = isEnglish
        ? 'international-shipping'
        : lang.toLowerCase().includes('hans') || lang.toLowerCase() === 'zh-cn'
          ? 'domestic-simplified'
          : lang.toLowerCase().includes('hant') ||
              ['zh-tw', 'zh-hk', 'zh-mo'].includes(lang.toLowerCase())
            ? 'domestic-traditional'
            : c === 'CN'
              ? 'domestic-simplified'
              : 'domestic-traditional';
      return buildChineseShippingAddress(data, mode).formatted;
    }

    if (supportsRemainingAsianDomesticLanguage(c, lang)) {
      return buildRemainingAsianShippingAddress(
        data,
        'domestic',
        { domesticLanguage: lang },
      ).formatted;
    }

    if (supportsRemainingOceaniaDomesticLanguage(c, lang)) {
      return buildRemainingOceaniaShippingAddress(
        data,
        'domestic',
        { domesticLanguage: lang },
      ).formatted;
    }

    if (supportsRemainingAfricanDomesticLanguage(c, lang)) {
      return buildRemainingAfricanShippingAddress(
        data,
        'domestic',
        { domesticLanguage: lang },
      ).formatted;
    }

    if (isArabicShippingCountry(c)) {
      if (isEnglish && !isEnglishAddressCountry(c)) {
        return buildArabicShippingAddress(data, 'international-shipping').formatted;
      }
      if (lang.toLowerCase().startsWith('ar')) {
        return buildArabicShippingAddress(data, 'domestic-arabic').formatted;
      }
    }

    if (isSpanishShippingCountry(c)) {
      return buildSpanishShippingAddress(
        data,
        isEnglish ? 'international-shipping' : 'domestic',
      ).formatted;
    }

    if (supportsRemainingEuropeanDomesticLanguage(c, lang)) {
      return buildRemainingEuropeanShippingAddress(
        data,
        'domestic',
        { domesticLanguage: lang },
      ).formatted;
    }

    const isSwissFrenchDomestic = c === 'CH' && lang.toLowerCase().startsWith('fr');
    if (isMajorEuropeanShippingCountry(c) && !isSwissFrenchDomestic) {
      return buildMajorEuropeanShippingAddress(
        data,
        isEnglish ? 'international-shipping' : 'domestic',
        { domesticLanguage: lang },
      ).formatted;
    }

    const isFrenchDomestic = lang.toLowerCase().startsWith('fr');
    if (
      isFrenchShippingCountry(c) &&
      (isFrenchDomestic || (isEnglish && !(lang === 'en_domestic' && isEnglishAddressCountry(c))))
    ) {
      return buildFrenchShippingAddress(
        data,
        isEnglish ? 'international-shipping' : 'domestic',
      ).formatted;
    }

    // Specialized Logic for Portuguese-speaking Latin America.
    if (c === 'BR') {
      return this.renderLATAM(c, data, lang);
    }

    if (isEnglish && !isEnglishAddressCountry(c)) {
      return this.renderInternationalEnglish(data);
    }

    const isEastAsian = ['JP', 'KR', 'KP', 'VN', 'HU'].includes(c);

    // If it's English domestic inside an Inner/Outer Circle English address market.
    if (isEnglish && isEnglishAddressCountry(c)) {
      return this.renderDomesticEnglish(data);
    }

    if (isEastAsian && !isEnglish) {
      // Big-to-Small for East Asian languages
      const parts = uniqueCanonicalParts([
        data.postcode ? `〒${data.postcode}` : "",
        data.state,
        data.city,
        data.district,
        data.subdistrict,
        data.road,
        data.house_number,
        data.building || data.poi
      ]);
      return parts.join(data.country_code === 'JP' ? "" : " ");
    } else {
      // Small-to-Big for others
      const isRoadFirst = [
        'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'SE', 'NO', 'DK', 'FI',
        'CH', 'LU', 'CY', 'BA',
      ].includes(data.country_code);
      const t = (val: string) => isEnglish ? normalizeEnglishAddressPart(val, data.country_code) : val;
      const tb = (val: string) => isEnglish ? normalizeEnglishAddressBuildingName(val, data.country_code) : val;

      const line1 = isRoadFirst
        ? `${t(data.road)} ${t(data.house_number)}`.trim()
        : `${t(data.house_number)} ${t(data.road)}`.trim();

      const parts = uniqueCanonicalParts([
        tb(data.building || data.poi),
        line1,
        t(data.subdistrict),
        t(data.district),
        t(data.city),
        t(data.state),
        data.postcode
      ]);

      // Don't include country name in domestic view (except maybe for English intl)
      return parts.join(", ");
    }
  }

  /**
   * Specialized Rendering for Latin American countries
   */
  private static renderLATAM(country: string, data: CanonicalAddress, lang: string): string {
    const isEnglish = lang.startsWith('en') || lang === 'international' || lang === 'romaji';
    const t = (val: string) => isEnglish ? normalizeEnglishAddressPart(val, country) : val;
    const tb = (val: string) => isEnglish ? normalizeEnglishAddressBuildingName(val, country) : val;

    let housePart = t(data.house_number);
    let roadPart = t(data.road);

    // Colombia specific: Add # separator if it's a grid coordinate pattern
    if (country === 'CO' && housePart && !housePart.includes('#') && /^\d/.test(housePart)) {
      housePart = `# ${housePart}`;
    }

    const line1 = `${roadPart} ${housePart}`.trim();

    // Neighborhood is very important in MX (Colonia) and BR (Bairro)
    const neighborhood = t(data.subdistrict || data.suburb);

    const parts = [
      tb(data.building || data.poi),
      line1,
      neighborhood,
      t(data.city),
      t(data.state),
      data.postcode,
      isEnglish ? country.toUpperCase() : ""
    ].filter(Boolean);

    return parts.join(", ");
  }

  /**
   * Standard English formatting for domestic use
   */
  private static renderDomesticEnglish(data: CanonicalAddress): string {
    return renderEnglishAddressMode(data, 'domestic');
  }

  /**
   * International standard English (Small-to-Big, ASCII, Capitalized Country)
   */
  private static renderInternationalEnglish(data: CanonicalAddress): string {
    return renderEnglishAddressMode(data, 'international-shipping');
  }

  static renderInternationalShippingEnglish(data: CanonicalAddress): string {
    const canonical = this.normalizeCanonical(data);
    let text = isArabicShippingCountry(canonical.country_code)
      ? buildArabicShippingAddress(canonical, 'international-shipping').formatted
      : isChineseShippingCountry(canonical.country_code)
      ? buildChineseShippingAddress(canonical, 'international-shipping').formatted
      : prefersRemainingAsianInternationalRenderer(canonical.country_code)
      ? buildRemainingAsianShippingAddress(
          canonical,
          'international-shipping',
        ).formatted
      : prefersRemainingOceaniaInternationalRenderer(canonical.country_code)
      ? buildRemainingOceaniaShippingAddress(
          canonical,
          'international-shipping',
        ).formatted
      : prefersRemainingAfricanInternationalRenderer(canonical.country_code)
      ? buildRemainingAfricanShippingAddress(
          canonical,
          'international-shipping',
        ).formatted
      : isRemainingEuropeanShippingCountry(canonical.country_code)
        && !['GB', 'IE'].includes(canonical.country_code)
      ? buildRemainingEuropeanShippingAddress(
          canonical,
          'international-shipping',
        ).formatted
      : isMajorEuropeanShippingCountry(canonical.country_code)
        ? buildMajorEuropeanShippingAddress(canonical, 'international-shipping').formatted
      : isFrenchShippingCountry(canonical.country_code)
      ? buildFrenchShippingAddress(canonical, 'international-shipping').formatted
      : isSpanishShippingCountry(canonical.country_code)
        ? buildSpanishShippingAddress(canonical, 'international-shipping').formatted
        : this.renderInternationalEnglish(canonical);
    text = applyShippingAbbreviations(text);
    return text.toUpperCase();
  }

  static renderPartialAddress(tab: string, data: CanonicalAddress): string {
    const canonical = this.normalizeCanonical(data);
    const isEnglish = tab.startsWith('en') || tab === 'international' || isInternationalShippingEnglishTab(tab);
    const preserveLines = tab === 'shipping_label' || isInternationalShippingEnglishTab(tab);
    const c = canonical.country_code.toUpperCase();
    const t = (value: string) => isEnglish ? normalizeEnglishAddressPart(value, c) : value;
    const tb = (value: string) => isEnglish ? normalizeEnglishAddressBuildingName(value, c) : value;
    const country = isEnglish
      ? countryName(c, t(canonical.country))
      : canonical.country;
    const organization = tb(canonical.building || canonical.poi);
    const street = canonical.road
      ? renderStreetAddressLine(c, t(canonical.road), t(canonical.house_number))
      : '';
    const areaParts = uniqueAddressParts([
      t(canonical.subdistrict || canonical.suburb),
      t(canonical.district),
      t(canonical.city),
      t(canonical.state),
      canonical.postcode,
      country,
    ].map(part => meaningfulAddressContextPart(part, country)));

    const areaLine = areaParts.join(', ');
    const fallbackLines = uniqueAddressParts([
      organization,
      street,
      areaLine,
      !areaLine && canonical.plus_code ? `Plus Code: ${canonical.plus_code}` : '',
    ]);

    if (preserveLines) {
      return fallbackLines
        .map(line => isInternationalShippingEnglishTab(tab) ? line.toUpperCase() : line)
        .join('\n');
    }

    return fallbackLines.join('\n');
  }

  static renderCarrier(data: CanonicalAddress): string {
    return this.renderInternationalShippingEnglish(data);
  }
}
