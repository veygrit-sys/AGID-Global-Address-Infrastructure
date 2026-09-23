pub use addressql_core::model::{
    AddressMatchDecision, CountryProfile, CountryResolution, DeliveryAvailability,
    DistanceEstimate, NormalizedAddress, PostalEquivalent, PostalStatus, PostalValidation,
};

pub use addressql_core::{
    address_distance_km, address_match, address_normalize, clean_text,
    country_address_profile, country_profile, country_resolve, delivery_available, normalize_country,
    postal_equivalent, postal_exists, postal_format_validate, postal_lookup, postal_normalize,
    postal_status, postal_validate,
};

pub const ADDRESSQL_SDK_VERSION: &str = "addressql-sdk-rs-v0.4";

pub fn sdk_non_claims() -> &'static [&'static str] {
    &[
        "SDK results are source-versioned decision support.",
        "Postal validation is not proof of residence or identity.",
        "Delivery availability is not a carrier SLA.",
    ]
}
