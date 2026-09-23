module AGID

export encode, decode, cellBounds, AGIDResult, AGIDBounds

const BASE32_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
const PREFIX_LENGTH = 2
const HASH_LENGTH = 10
const TOTAL_LENGTH = 12

struct AGIDResult
    id::String
    lat::Float64
    lon::Float64
    face::Union{Int, Nothing}
end

struct AGIDBounds
    minLat::Float64
    maxLat::Float64
    minLon::Float64
    maxLon::Float64
end

function encode(lat::Real, lon::Real)
    error("wire this package to the AGID reference implementation")
end

decode(id::AbstractString) = nothing
cellBounds(id::AbstractString) = error("wire this package to the AGID reference implementation")

end
