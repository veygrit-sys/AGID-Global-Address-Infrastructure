# Generated parity test: encode/decode/cellBounds must match agid-spec/test-vectors.json before formal distribution.
import unittest
import agid

suite "encode/decode/cellBounds parity":
  test "matches spec vectors":
    let encoded = encode(35.681236, 139.767125)
    check encoded.id == "JP05AV8TJGHD"
    let decoded = decode("JP05AV8TJGHD")
    check abs(decoded.lat - 35.68121961131576) < 0.000001
    check abs(decoded.lon - 139.76712226867676) < 0.000001
    let bounds = cellBounds("JP05AV8TJGHD")
    check abs(bounds.minLat - 35.68121961131576) < 0.000001
    check abs(bounds.maxLat - 35.68127755465351) < 0.000001
    check abs(bounds.minLon - 139.76712226867676) < 0.000001
    check abs(bounds.maxLon - 139.767165184021) < 0.000001
