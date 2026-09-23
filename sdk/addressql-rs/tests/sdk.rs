use addressql_sdk::{
    address_match, address_normalize, country_resolve, delivery_available, postal_normalize,
    postal_status, postal_validate, PostalStatus, ADDRESSQL_SDK_VERSION,
};

#[test]
fn rust_sdk_reuses_addressql_core() {
    assert_eq!(ADDRESSQL_SDK_VERSION, "addressql-sdk-rs-v0.4");
    assert_eq!(country_resolve("Nihon").country_code, "JP");
    assert_eq!(postal_status("HK"), PostalStatus::None);
    assert_eq!(postal_normalize("1000001", "JP"), "100-0001");
}

#[test]
fn rust_sdk_preserves_non_claims() {
    let postal = postal_validate(Some("1000001"), "JP");
    let delivery = delivery_available("HK", None, "synthetic_carrier", "standard");

    assert!(postal.valid);
    assert_eq!(postal.exists, None);
    assert_eq!(postal.validation_scope, "format_only");
    assert!(postal.warnings.contains(&"postal_existence_evidence_required"));
    assert!(postal.non_claims[0].contains("not full address identity"));
    assert!(!delivery.available);
    assert!(delivery.reasons.contains(&"approved_delivery_source_required"));
    assert!(delivery.non_claims[0].contains("not proof of residence"));
}

#[test]
fn rust_sdk_matching_is_purpose_relative() {
    let a = address_normalize("Synthetic US Fixture Street", "US");
    let b = address_normalize(" Synthetic   US Fixture   Street ", "US");
    let decision = address_match(&a, &b, "delivery");

    assert!(decision.is_match);
    assert_eq!(decision.purpose, "delivery");
    assert!(decision.non_claims[0].contains("not proof of residence"));
}
