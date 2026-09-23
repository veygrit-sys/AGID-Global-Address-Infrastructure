// Generated parity test: encode/decode/cellBounds must match agid-spec/test-vectors.json before formal distribution.
import 'package:test/test.dart';
import 'package:agid/agid.dart';

void main() {
  test('encode/decode/cellBounds match spec', () {
    final encoded = encode(35.681236, 139.767125);
    expect(encoded.id, 'JP05AV8TJGHD');
    final decoded = decode('JP05AV8TJGHD')!;
    expect(decoded.lat, closeTo(35.68121961131576, 0.000001));
    expect(decoded.lon, closeTo(139.76712226867676, 0.000001));
    final bounds = cellBounds('JP05AV8TJGHD');
    expect(bounds.minLat, closeTo(35.68121961131576, 0.000001));
    expect(bounds.maxLat, closeTo(35.68127755465351, 0.000001));
    expect(bounds.minLon, closeTo(139.76712226867676, 0.000001));
    expect(bounds.maxLon, closeTo(139.767165184021, 0.000001));
  });
}
