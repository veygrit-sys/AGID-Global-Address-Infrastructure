use crate::model::{CountryProfile, PostalArea, PostalStatus};

pub const SOURCE_VERSION: &str = "synthetic-addressql-v0.2";

pub const COUNTRY_PROFILES: &[CountryProfile] = &[
    CountryProfile {
        country_code: "JP",
        country_name: "Japan",
        native_name: Some("日本"),
        aliases: &["Nippon", "Nihon", "日本国"],
        languages: &["ja", "en"],
        postal_status: PostalStatus::Official,
        postal_required_default: true,
        postal_pattern: Some(PostalPattern::Japan),
        postal_example: Some("100-0001"),
        postal_equivalent_strategy: "official_postal_code",
        source_version: SOURCE_VERSION,
    },
    CountryProfile {
        country_code: "US",
        country_name: "United States",
        native_name: Some("United States"),
        aliases: &["USA", "United States of America"],
        languages: &["en", "es"],
        postal_status: PostalStatus::Official,
        postal_required_default: true,
        postal_pattern: Some(PostalPattern::UnitedStates),
        postal_example: Some("94105"),
        postal_equivalent_strategy: "official_postal_code",
        source_version: SOURCE_VERSION,
    },
    CountryProfile {
        country_code: "HK",
        country_name: "Hong Kong",
        native_name: Some("香港"),
        aliases: &["Hong Kong SAR", "香港特別行政区"],
        languages: &["zh-Hant", "en"],
        postal_status: PostalStatus::None,
        postal_required_default: false,
        postal_pattern: None,
        postal_example: None,
        postal_equivalent_strategy: "agid_region_postal_equivalent",
        source_version: SOURCE_VERSION,
    },
    CountryProfile {
        country_code: "AE",
        country_name: "United Arab Emirates",
        native_name: Some("الإمارات العربية المتحدة"),
        aliases: &["UAE"],
        languages: &["ar", "en"],
        postal_status: PostalStatus::None,
        postal_required_default: false,
        postal_pattern: None,
        postal_example: None,
        postal_equivalent_strategy: "agid_region_postal_equivalent",
        source_version: SOURCE_VERSION,
    },
    CountryProfile {
        country_code: "GH",
        country_name: "Ghana",
        native_name: Some("Ghana"),
        aliases: &[],
        languages: &["en"],
        postal_status: PostalStatus::Weak,
        postal_required_default: false,
        postal_pattern: None,
        postal_example: None,
        postal_equivalent_strategy: "digital_address_or_agid_region",
        source_version: SOURCE_VERSION,
    },
];

pub const POSTAL_AREAS: &[PostalArea] = &[
    PostalArea {
        country_code: "JP",
        postal_code: "100-0001",
        region_ref: "agid-jp-tokyo-chiyoda-chiyoda",
        region_name: "Chiyoda, Tokyo synthetic postal area",
        centroid_lat: 35.6852,
        centroid_lon: 139.7528,
        source_version: SOURCE_VERSION,
    },
    PostalArea {
        country_code: "US",
        postal_code: "94105",
        region_ref: "agid-us-ca-san-francisco-soma",
        region_name: "San Francisco SoMa synthetic postal area",
        centroid_lat: 37.7890,
        centroid_lon: -122.3940,
        source_version: SOURCE_VERSION,
    },
];

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum PostalPattern {
    Japan,
    UnitedStates,
}

impl PostalPattern {
    pub fn matches(self, value: &str) -> bool {
        match self {
            PostalPattern::Japan => {
                let bytes = value.as_bytes();
                (bytes.len() == 8
                    && bytes[0..3].iter().all(u8::is_ascii_digit)
                    && bytes[3] == b'-'
                    && bytes[4..8].iter().all(u8::is_ascii_digit))
                    || (bytes.len() == 7 && bytes.iter().all(u8::is_ascii_digit))
            }
            PostalPattern::UnitedStates => {
                let bytes = value.as_bytes();
                (bytes.len() == 5 && bytes.iter().all(u8::is_ascii_digit))
                    || (bytes.len() == 10
                        && bytes[0..5].iter().all(u8::is_ascii_digit)
                        && bytes[5] == b'-'
                        && bytes[6..10].iter().all(u8::is_ascii_digit))
            }
        }
    }
}
