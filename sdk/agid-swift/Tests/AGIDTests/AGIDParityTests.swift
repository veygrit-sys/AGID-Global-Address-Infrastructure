// Generated parity test: encode/decode/cellBounds must match agid-spec/test-vectors.json before formal distribution.
import XCTest
@testable import AGID

final class AGIDParityTests: XCTestCase {
    func testEncodeDecodeCellBoundsMatchSpec() throws {
        let encoded = try encode(lat: 35.681236, lon: 139.767125)
        XCTAssertEqual(encoded.id, "JP05AV8TJGHD")
        let decoded = try XCTUnwrap(decode("JP05AV8TJGHD"))
        XCTAssertEqual(decoded.lat, 35.68121961131576, accuracy: 0.000001)
        XCTAssertEqual(decoded.lon, 139.76712226867676, accuracy: 0.000001)
        let bounds = try cellBounds("JP05AV8TJGHD")
        XCTAssertEqual(bounds.minLat, 35.68121961131576, accuracy: 0.000001)
        XCTAssertEqual(bounds.maxLat, 35.68127755465351, accuracy: 0.000001)
        XCTAssertEqual(bounds.minLon, 139.76712226867676, accuracy: 0.000001)
        XCTAssertEqual(bounds.maxLon, 139.767165184021, accuracy: 0.000001)
    }
}
