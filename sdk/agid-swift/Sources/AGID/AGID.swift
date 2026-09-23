public let base32Alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
public let agidPrefixLength = 2
public let agidHashLength = 10
public let agidTotalLength = 12

public struct AGIDResult: Equatable {
    public let id: String
    public let lat: Double
    public let lon: Double
    public let face: Int?
}

public struct AGIDBounds: Equatable {
    public let minLat: Double
    public let maxLat: Double
    public let minLon: Double
    public let maxLon: Double
}

public func encode(lat: Double, lon: Double) throws -> AGIDResult {
    throw AGIDError.notImplemented
}

public func decode(_ id: String) -> AGIDResult? {
    nil
}

public func cellBounds(_ id: String) throws -> AGIDBounds {
    throw AGIDError.notImplemented
}

public enum AGIDError: Error {
    case notImplemented
}
