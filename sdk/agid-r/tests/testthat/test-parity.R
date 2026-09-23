# Generated parity test: encode/decode/cellBounds must match agid-spec/test-vectors.json before formal distribution.
test_that("encode/decode/cellBounds match spec", {
  encoded <- agid_encode(35.681236, 139.767125)
  expect_equal(encoded$id, "JP05AV8TJGHD")
  decoded <- agid_decode("JP05AV8TJGHD")
  expect_equal(decoded$lat, 35.68121961131576, tolerance = 0.000001)
  expect_equal(decoded$lon, 139.76712226867676, tolerance = 0.000001)
  bounds <- agid_cellBounds("JP05AV8TJGHD")
  expect_equal(bounds$minLat, 35.68121961131576, tolerance = 0.000001)
  expect_equal(bounds$maxLat, 35.68127755465351, tolerance = 0.000001)
  expect_equal(bounds$minLon, 139.76712226867676, tolerance = 0.000001)
  expect_equal(bounds$maxLon, 139.767165184021, tolerance = 0.000001)
})
