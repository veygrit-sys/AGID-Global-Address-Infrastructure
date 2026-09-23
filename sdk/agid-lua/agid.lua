local agid = {}

agid.BASE32_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
agid.PREFIX_LENGTH = 2
agid.HASH_LENGTH = 10
agid.TOTAL_LENGTH = 12

function agid.encode(lat, lon)
  error("wire this package to the AGID reference implementation")
end

function agid.decode(id)
  return nil
end

function agid.cellBounds(id)
  error("wire this package to the AGID reference implementation")
end

return agid
