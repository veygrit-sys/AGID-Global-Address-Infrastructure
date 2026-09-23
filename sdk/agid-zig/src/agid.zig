pub const base32_alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
pub const prefix_length = 2;
pub const hash_length = 10;
pub const total_length = 12;

pub const Result = struct {
    id: [total_length]u8,
    lat: f64,
    lon: f64,
    face: ?u8,
};

pub const Bounds = struct {
    minLat: f64,
    maxLat: f64,
    minLon: f64,
    maxLon: f64,
};

pub fn encode(lat: f64, lon: f64) !Result {
    _ = lat;
    _ = lon;
    return error.NotImplemented;
}

pub fn decode(id: []const u8) ?Result {
    _ = id;
    return null;
}

pub fn cellBounds(id: []const u8) !Bounds {
    _ = id;
    return error.NotImplemented;
}
