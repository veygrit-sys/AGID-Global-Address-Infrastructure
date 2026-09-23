const base32Alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const agidPrefixLength = 2;
const agidHashLength = 10;
const agidTotalLength = 12;

class AgidResult {
  const AgidResult({required this.id, required this.lat, required this.lon, this.face});

  final String id;
  final double lat;
  final double lon;
  final int? face;
}

class AgidBounds {
  const AgidBounds({required this.minLat, required this.maxLat, required this.minLon, required this.maxLon});

  final double minLat;
  final double maxLat;
  final double minLon;
  final double maxLon;
}

AgidResult encode(double lat, double lon) {
  throw UnimplementedError('wire this package to the AGID reference implementation');
}

AgidResult? decode(String id) => null;

AgidBounds cellBounds(String id) {
  throw UnimplementedError('wire this package to the AGID reference implementation');
}
