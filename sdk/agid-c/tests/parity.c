/* Generated parity test: encode/decode/cellBounds must match agid-spec/test-vectors.json before formal distribution. */
#include "agid.h"
#include <assert.h>
#include <math.h>
#include <string.h>

static const double EPS = 0.000001;

static void close_enough(double actual, double expected) {
  assert(fabs(actual - expected) < EPS);
}

int main(void) {
  agid_result encoded;
  agid_result decoded;
  agid_bounds bounds;

  assert(agid_encode(35.681236, 139.767125, &encoded) == 0);
  assert(strcmp(encoded.id, "JP05AV8TJGHD") == 0);
  assert(agid_decode("JP05AV8TJGHD", &decoded) == 0);
  close_enough(decoded.lat, 35.68121961131576);
  close_enough(decoded.lon, 139.76712226867676);
  assert(agid_cell_bounds("JP05AV8TJGHD", &bounds) == 0); /* cellBounds parity */
  close_enough(bounds.min_lat, 35.68121961131576);
  close_enough(bounds.max_lat, 35.68127755465351);
  close_enough(bounds.min_lon, 139.76712226867676);
  close_enough(bounds.max_lon, 139.767165184021);
  return 0;
}
