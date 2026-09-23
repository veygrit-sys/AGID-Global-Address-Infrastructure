package org.agid

const val BASE32_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
const val AGID_PREFIX_LENGTH = 2
const val AGID_HASH_LENGTH = 10
const val AGID_TOTAL_LENGTH = 12

data class AgidResult(
    val id: String,
    val lat: Double,
    val lon: Double,
    val face: Int? = null,
)

data class AgidBounds(
    val minLat: Double,
    val maxLat: Double,
    val minLon: Double,
    val maxLon: Double,
)

fun encode(lat: Double, lon: Double): AgidResult {
    throw NotImplementedError("wire this package to the AGID reference implementation")
}

fun decode(id: String): AgidResult? = null

fun cellBounds(id: String): AgidBounds {
    throw NotImplementedError("wire this package to the AGID reference implementation")
}
