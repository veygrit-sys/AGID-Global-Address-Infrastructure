// Generated parity test: encode/decode/cellBounds must match agid-spec/test-vectors.json before formal distribution.
const std = @import("std");
const agid = @import("agid.zig");

test "encode/decode/cellBounds parity" {
    const encoded = try agid.encode(35.681236, 139.767125);
    try std.testing.expectEqualStrings("JP05AV8TJGHD", encoded.id[0..]);
    const decoded = agid.decode("JP05AV8TJGHD").?;
    try std.testing.expectApproxEqAbs(35.68121961131576, decoded.lat, 0.000001);
    try std.testing.expectApproxEqAbs(139.76712226867676, decoded.lon, 0.000001);
    const bounds = try agid.cellBounds("JP05AV8TJGHD");
    try std.testing.expectApproxEqAbs(35.68121961131576, bounds.minLat, 0.000001);
    try std.testing.expectApproxEqAbs(35.68127755465351, bounds.maxLat, 0.000001);
    try std.testing.expectApproxEqAbs(139.76712226867676, bounds.minLon, 0.000001);
    try std.testing.expectApproxEqAbs(139.767165184021, bounds.maxLon, 0.000001);
}
