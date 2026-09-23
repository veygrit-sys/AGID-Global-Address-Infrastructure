#include "agid.hpp"

namespace agid {

std::optional<Result> encode(double lat, double lon) {
  (void)lat;
  (void)lon;
  return std::nullopt;
}

std::optional<Result> decode(const std::string& id) {
  (void)id;
  return std::nullopt;
}

std::optional<Bounds> cellBounds(const std::string& id) {
  (void)id;
  return std::nullopt;
}

} // namespace agid
