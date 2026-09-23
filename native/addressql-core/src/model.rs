use crate::fixtures::PostalPattern;

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum PostalStatus {
    Official,
    Weak,
    None,
    CarrierSpecific,
    Unknown,
}

impl PostalStatus {
    pub fn as_str(self) -> &'static str {
        match self {
            PostalStatus::Official => "official",
            PostalStatus::Weak => "weak",
            PostalStatus::None => "none",
            PostalStatus::CarrierSpecific => "carrier_specific",
            PostalStatus::Unknown => "unknown",
        }
    }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct CountryProfile {
    pub country_code: &'static str,
    pub country_name: &'static str,
    pub native_name: Option<&'static str>,
    pub aliases: &'static [&'static str],
    pub languages: &'static [&'static str],
    pub postal_status: PostalStatus,
    pub postal_required_default: bool,
    pub postal_pattern: Option<PostalPattern>,
    pub postal_example: Option<&'static str>,
    pub postal_equivalent_strategy: &'static str,
    pub source_version: &'static str,
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct PostalArea {
    pub country_code: &'static str,
    pub postal_code: &'static str,
    pub region_ref: &'static str,
    pub region_name: &'static str,
    pub centroid_lat: f64,
    pub centroid_lon: f64,
    pub source_version: &'static str,
}

#[derive(Clone, Debug, PartialEq)]
pub struct CountryResolution {
    pub input: String,
    pub country_code: String,
    pub confidence: f64,
    pub source_version: &'static str,
    pub warnings: Vec<&'static str>,
    pub non_claims: Vec<&'static str>,
}

#[derive(Clone, Debug, PartialEq)]
pub struct NormalizedAddress {
    pub normalized_text: String,
    pub country: String,
    pub locale: &'static str,
    pub source_version: &'static str,
    pub warnings: Vec<&'static str>,
    pub non_claims: Vec<&'static str>,
}

#[derive(Clone, Debug, PartialEq)]
pub struct AddressMatchDecision {
    pub is_match: bool,
    pub confidence: f64,
    pub purpose: String,
    pub source_version: &'static str,
    pub non_claims: Vec<&'static str>,
}

#[derive(Clone, Debug, PartialEq)]
pub struct PostalValidation {
    pub valid: bool,
    pub format_valid: bool,
    pub exists: Option<bool>,
    pub validation_scope: &'static str,
    pub postal_code: String,
    pub country: String,
    pub region_hint: Option<&'static str>,
    pub source_version: &'static str,
    pub warnings: Vec<&'static str>,
    pub non_claims: Vec<&'static str>,
}

#[derive(Clone, Debug, PartialEq)]
pub struct PostalEquivalent {
    pub region_ref: String,
    pub country: String,
    pub confidence: f64,
    pub source_version: &'static str,
    pub non_claims: Vec<&'static str>,
}

#[derive(Clone, Debug, PartialEq)]
pub struct DeliveryAvailability {
    pub available: bool,
    pub carrier: String,
    pub service_level: String,
    pub reasons: Vec<&'static str>,
    pub source_version: &'static str,
    pub non_claims: Vec<&'static str>,
}

#[derive(Clone, Debug, PartialEq)]
pub struct DistanceEstimate {
    pub distance_km: Option<f64>,
    pub metric: &'static str,
    pub confidence: f64,
    pub source_version: &'static str,
    pub warnings: Vec<&'static str>,
    pub non_claims: Vec<&'static str>,
}
