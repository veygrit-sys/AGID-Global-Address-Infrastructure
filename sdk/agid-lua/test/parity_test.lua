-- Generated parity test: encode/decode/cellBounds must match agid-spec/test-vectors.json before formal distribution.
local agid = require("agid")

local PARITY_VECTORS = {
  { name = "Tokyo Station", lat = 35.681236, lon = 139.767125, id = "JP05AV8TJGHD", decodedLat = 35.68121961131576, decodedLon = 139.76712226867676, minLat = 35.68121961131576, maxLat = 35.68127755465351, minLon = 139.76712226867676, maxLon = 139.767165184021 }
}

local function close(actual, expected)
  assert(math.abs(actual - expected) < 0.000001)
end

for _, vector in ipairs(PARITY_VECTORS) do
  local encoded = agid.encode(vector.lat, vector.lon)
  assert(encoded.id == vector.id)
  local decoded = agid.decode(vector.id)
  close(decoded.lat, vector.decodedLat)
  close(decoded.lon, vector.decodedLon)
  local bounds = agid.cellBounds(vector.id)
  close(bounds.minLat, vector.minLat)
  close(bounds.maxLat, vector.maxLat)
  close(bounds.minLon, vector.minLon)
  close(bounds.maxLon, vector.maxLon)
end
