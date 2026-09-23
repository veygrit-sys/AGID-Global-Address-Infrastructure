// Generated parity test: encode/decode/cellBounds must match agid-spec/test-vectors.json before formal distribution.
#include "agid.hpp"
#include <cassert>
#include <cmath>

static void close_enough(double actual, double expected) {
  assert(std::abs(actual - expected) < 0.000001);
}

int main() {
  const auto encoded = agid::encode(35.681236, 139.767125);
  assert(encoded.has_value());
  assert(encoded->id == "JP05AV8TJGHD");
  const auto decoded = agid::decode("JP05AV8TJGHD");
  assert(decoded.has_value());
  close_enough(decoded->lat, 35.68121961131576);
  close_enough(decoded->lon, 139.76712226867676);
  const auto bounds = agid::cellBounds("JP05AV8TJGHD");
  assert(bounds.has_value());
  close_enough(bounds->minLat, 35.68121961131576);
  close_enough(bounds->maxLat, 35.68127755465351);
  close_enough(bounds->minLon, 139.76712226867676);
  close_enough(bounds->maxLon, 139.767165184021);
}
