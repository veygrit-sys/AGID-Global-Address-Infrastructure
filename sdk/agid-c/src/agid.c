#include "agid.h"

int agid_encode(double lat, double lon, agid_result* out) {
  (void)lat;
  (void)lon;
  (void)out;
  return -1;
}

int agid_decode(const char* id, agid_result* out) {
  (void)id;
  (void)out;
  return -1;
}

int agid_cell_bounds(const char* id, agid_bounds* out) {
  (void)id;
  (void)out;
  return -1;
}
