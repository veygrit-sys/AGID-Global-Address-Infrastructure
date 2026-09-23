from __future__ import annotations

from dataclasses import dataclass
from math import asin, cos, isfinite, radians, sin, sqrt
from re import sub
from unicodedata import category, normalize

SOURCE_VERSION = "synthetic-addressql-sdk-v0.4"


@dataclass(frozen=True)
class CountryProfile:
    country_code: str
    country_name: str
    native_name: str | None
    aliases: tuple[str, ...]
    languages: tuple[str, ...]
    postal_status: str
    postal_required_default: bool
    postal_example: str | None
    postal_equivalent_strategy: str
    source_version: str = SOURCE_VERSION


COUNTRY_PROFILES = (
    CountryProfile("JP", "Japan", "日本", ("Nippon", "Nihon", "日本国"), ("ja", "en"), "official", True, "100-0001", "official_postal_code"),
    CountryProfile("US", "United States", "United States", ("USA", "United States of America"), ("en", "es"), "official", True, "94105", "official_postal_code"),
    CountryProfile("HK", "Hong Kong", "香港", ("Hong Kong SAR", "香港特別行政区"), ("zh-Hant", "en"), "none", False, None, "agid_region_postal_equivalent"),
    CountryProfile("AE", "United Arab Emirates", "الإمارات العربية المتحدة", ("UAE",), ("ar", "en"), "none", False, None, "agid_region_postal_equivalent"),
    CountryProfile("GH", "Ghana", "Ghana", tuple(), ("en",), "weak", False, None, "digital_address_or_agid_region"),
)

def clean_text(value: object) -> str:
    return " ".join(str(value).strip().split()) if isinstance(value, str) else ""


def normalize_country(value: object) -> str:
    return clean_text(value).upper()


def country_address_profile(country_code: object) -> CountryProfile | None:
    country = normalize_country(country_code)
    return next((profile for profile in COUNTRY_PROFILES if profile.country_code == country), None)


def country_resolve(country_input: object) -> dict:
    value = clean_text(country_input)
    lowered = value.lower()
    profile = next(
        (
            item
            for item in COUNTRY_PROFILES
            if item.country_code.lower() == lowered
            or item.country_name.lower() == lowered
            or (item.native_name or "").lower() == lowered
            or lowered in {alias.lower() for alias in item.aliases}
        ),
        None,
    )
    return {
        "input": value,
        "country_code": profile.country_code if profile else normalize_country(value),
        "confidence": 1.0 if profile else 0.2,
        "source_version": SOURCE_VERSION,
        "warnings": [] if profile else ["country_not_found_in_source_version"],
        "non_claims": ["Country resolution is not sovereignty adjudication."],
    }


def postal_status(country_code: object) -> str:
    profile = country_address_profile(country_code)
    return profile.postal_status if profile else "unknown"


def postal_normalize(postal_code: object, country_code: object) -> str:
    country = normalize_country(country_code)
    postal = clean_text(postal_code).upper()
    if country == "JP":
        digits = sub(r"\D", "", postal)
        if len(digits) == 7:
            postal = f"{digits[:3]}-{digits[3:]}"
    return postal


def postal_validate(postal_code: object, country_code: object) -> dict:
    country = normalize_country(country_code)
    profile = country_address_profile(country)
    postal = postal_normalize(postal_code, country)
    warnings: list[str] = []
    valid = False
    format_valid = False

    if profile is None:
        warnings.append("country_profile_missing")
    elif not postal:
        valid = not profile.postal_required_default
        format_valid = valid
        if not valid:
            warnings.append("postal_required_but_missing")
    elif country == "JP":
        format_valid = len(postal) == 8 and postal[3] == "-" and postal[:3].isdigit() and postal[4:].isdigit()
        valid = format_valid
    elif country == "US":
        format_valid = len(postal) == 5 and postal.isdigit() or len(postal) == 10 and postal[5] == "-"
        valid = format_valid
    else:
        format_valid = profile.postal_status != "none"
        valid = format_valid

    if postal and format_valid and profile and profile.postal_status != "none":
        warnings.append("postal_existence_evidence_required")

    return {
        "valid": valid,
        "format_valid": format_valid,
        "exists": None,
        "validation_scope": "postal_equivalent_required" if profile and profile.postal_status == "none" else "format_only",
        "postal_code": postal,
        "country": country,
        "source_version": SOURCE_VERSION,
        "warnings": warnings,
        "non_claims": ["Postal validity is not full address identity."],
    }


def postal_equivalent(region_ref: object, country_code: object) -> dict:
    country = normalize_country(country_code)
    region = clean_text(region_ref) or f"agid-country-{country.lower()}-postal-equivalent"
    return {
        "region_ref": region,
        "country": country,
        "confidence": 0.6,
        "source_version": SOURCE_VERSION,
        "non_claims": ["Postal-equivalent regions are fallback operational regions, not official postal codes."],
    }


def normalize_address(address_text: object, country_code: object) -> dict:
    return {
        "normalized_text": clean_text(address_text),
        "country": normalize_country(country_code),
        "locale": "und",
        "source_version": SOURCE_VERSION,
        "warnings": [],
        "non_claims": ["Normalization is not referent resolution."],
    }


ADDRESS_TOKEN_ALIASES = {
    "avenue": "avenue",
    "ave": "avenue",
    "boulevard": "boulevard",
    "blvd": "boulevard",
    "road": "road",
    "rd": "road",
    "street": "street",
    "st": "street",
    "strasse": "street",
    "straße": "street",
}


def normalize_address_match_text(value: object) -> str:
    folded = normalize("NFKC", clean_text(value)).casefold()
    punctuation_folded = "".join(
        " " if category(character)[0] in {"P", "S"} else character
        for character in folded
    )
    return " ".join(
        ADDRESS_TOKEN_ALIASES.get(token, token)
        for token in punctuation_folded.split()
    )


def edit_distance(left: str, right: str) -> int:
    if not left:
        return len(right)
    if not right:
        return len(left)
    previous = list(range(len(right) + 1))
    for left_index, left_character in enumerate(left, start=1):
        current = [left_index]
        for right_index, right_character in enumerate(right, start=1):
            current.append(
                min(
                    current[-1] + 1,
                    previous[right_index] + 1,
                    previous[right_index - 1]
                    + (left_character != right_character),
                )
            )
        previous = current
    return previous[-1]


def address_similarity(left: str, right: str) -> float:
    if not left or not right:
        return 0.0
    if left == right:
        return 1.0
    left_tokens = set(left.split())
    right_tokens = set(right.split())
    token_dice = (
        2 * len(left_tokens & right_tokens)
        / (len(left_tokens) + len(right_tokens))
    )
    character_similarity = 1 - edit_distance(left, right) / max(len(left), len(right))
    return max(0.0, min(1.0, token_dice * 0.4 + character_similarity * 0.6))


def address_match(address_a: dict, address_b: dict, purpose: str = "delivery") -> dict:
    text_a = normalize_address_match_text(address_a.get("normalized_text", ""))
    text_b = normalize_address_match_text(address_b.get("normalized_text", ""))
    country_a = normalize_country(address_a.get("country", ""))
    country_b = normalize_country(address_b.get("country", ""))
    countries_compatible = not country_a or not country_b or country_a == country_b
    similarity = address_similarity(text_a, text_b) if countries_compatible else 0.0
    matched = bool(text_a and text_b and countries_compatible and similarity >= 0.84)
    return {
        "match": matched,
        "confidence": similarity,
        "purpose": clean_text(purpose),
        "source_version": SOURCE_VERSION,
        "non_claims": [
            "A match decision is purpose-relative and not proof of residence.",
            "Fuzzy similarity is not evidence that two addresses have the same referent.",
        ],
    }


def address_distance_km(lat_a: float, lon_a: float, lat_b: float, lon_b: float) -> dict:
    if not all(isfinite(value) for value in (lat_a, lon_a, lat_b, lon_b)) or abs(lat_a) > 90 or abs(lat_b) > 90 or abs(lon_a) > 180 or abs(lon_b) > 180:
        return {"distance_km": None, "metric": "haversine", "confidence": 0.0, "source_version": SOURCE_VERSION, "warnings": ["invalid_coordinates"], "non_claims": ["Distance is metric-dependent and not route availability."]}
    d_lat = radians(lat_b - lat_a)
    d_lon = radians(lon_b - lon_a)
    h = sin(d_lat / 2) ** 2 + cos(radians(lat_a)) * cos(radians(lat_b)) * sin(d_lon / 2) ** 2
    return {"distance_km": 2 * 6371.0088 * asin(min(1.0, sqrt(h))), "metric": "haversine", "confidence": 0.75, "source_version": SOURCE_VERSION, "warnings": [], "non_claims": ["Distance is metric-dependent and not route availability."]}


def delivery_available(country_code: object, postal_code: object, carrier: str = "synthetic_carrier", service_level: str = "standard") -> dict:
    country = normalize_country(country_code)
    profile = country_address_profile(country)
    validation = postal_validate(postal_code, country)
    reasons: list[str] = []
    available = False
    if profile is None:
        reasons.append("country_profile_missing")
    if profile and profile.postal_required_default and not validation["valid"]:
        reasons.append("postal_required_but_invalid_or_missing")
    reasons.append("approved_delivery_source_required")
    return {"available": available, "carrier": clean_text(carrier), "service_level": clean_text(service_level), "reasons": reasons, "source_version": SOURCE_VERSION, "non_claims": ["Deliverability is not proof of residence or identity."]}
