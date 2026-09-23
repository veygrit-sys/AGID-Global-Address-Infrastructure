#ifndef AGID_H
#define AGID_H

#ifdef __cplusplus
extern "C" {
#endif

#define AGID_PREFIX_LENGTH 2
#define AGID_HASH_LENGTH 10
#define AGID_TOTAL_LENGTH 12

typedef struct agid_result {
  char id[AGID_TOTAL_LENGTH + 1];
  double lat;
  double lon;
  int face;
} agid_result;

typedef struct agid_bounds {
  double min_lat;
  double max_lat;
  double min_lon;
  double max_lon;
} agid_bounds;

int agid_encode(double lat, double lon, agid_result* out);
int agid_decode(const char* id, agid_result* out);
int agid_cell_bounds(const char* id, agid_bounds* out);

#ifdef __cplusplus
}
#endif

#endif
