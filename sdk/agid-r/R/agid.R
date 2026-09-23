BASE32_ALPHABET <- "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
AGID_PREFIX_LENGTH <- 2
AGID_HASH_LENGTH <- 10
AGID_TOTAL_LENGTH <- 12

agid_encode <- function(lat, lon) {
  stop("wire this package to the AGID reference implementation")
}

agid_decode <- function(id) {
  NULL
}

agid_cellBounds <- function(id) {
  stop("wire this package to the AGID reference implementation")
}
