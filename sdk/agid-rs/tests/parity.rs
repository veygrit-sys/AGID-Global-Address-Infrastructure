// Generated parity test: encode/decode/cellBounds must match agid-spec/test-vectors.json before formal distribution.
use agid::{cell_bounds, decode, encode};

const EPS: f64 = 0.000001;
const PARITY_VECTORS: &[(&str, f64, f64, &str, f64, f64, f64, f64, f64, f64)] = &[
    ("Tokyo Station", 35.681236, 139.767125, "JP05AV8TJGHD", 35.68121961131576, 139.76712226867676, 35.68121961131576, 35.68127755465351, 139.76712226867676, 139.767165184021),
    ("Null Island", 0, 0, "3B0200000000", 0, 0, 0, 0.00004291534423828125, 0, 0.00004291534423828125),
    ("New York City", 40.7128, -74.006, "US0ECWVG02V9", 40.712787854519725, -74.00600910186768, 40.71278177280159, 40.712830550646764, -74.00600910186768, -74.00596618652344),
];

fn close(actual: f64, expected: f64) {
    assert!((actual - expected).abs() < EPS, "expected {expected}, got {actual}");
}

#[test]
fn encode_decode_cellbounds_match_spec() {
    for (name, lat, lon, id, decoded_lat, decoded_lon, min_lat, max_lat, min_lon, max_lon) in PARITY_VECTORS {
        let encoded = encode(*lat, *lon).expect(name);
        assert_eq!(encoded.id, *id, "{name} encode parity");
        let decoded = decode(id).expect(name);
        close(decoded.lat, *decoded_lat);
        close(decoded.lon, *decoded_lon);
        let bounds = cell_bounds(id).expect(name);
        close(bounds.min_lat, *min_lat);
        close(bounds.max_lat, *max_lat);
        close(bounds.min_lon, *min_lon);
        close(bounds.max_lon, *max_lon);
    }
}
