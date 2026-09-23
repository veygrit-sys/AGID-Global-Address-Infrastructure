# frozen_string_literal: true

module Agid
  BASE32_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
  PREFIX_LENGTH = 2
  HASH_LENGTH = 10
  TOTAL_LENGTH = 12

  Result = Struct.new(:id, :lat, :lon, :face, keyword_init: true)
  Bounds = Struct.new(:minLat, :maxLat, :minLon, :maxLon, keyword_init: true)

  def self.encode(lat, lon)
    raise NotImplementedError, "wire this package to the AGID reference implementation"
  end

  def self.decode(id)
    nil
  end

  def self.cellBounds(id)
    raise NotImplementedError, "wire this package to the AGID reference implementation"
  end
end
