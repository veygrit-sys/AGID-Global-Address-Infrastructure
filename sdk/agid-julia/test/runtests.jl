# Generated parity test: encode/decode/cellBounds must match agid-spec/test-vectors.json before formal distribution.
using Test
using AGID

@testset "encode/decode/cellBounds parity" begin
    encoded = encode(35.681236, 139.767125)
    @test encoded.id == "JP05AV8TJGHD"
    decoded = decode("JP05AV8TJGHD")
    @test isapprox(decoded.lat, 35.68121961131576; atol=0.000001)
    @test isapprox(decoded.lon, 139.76712226867676; atol=0.000001)
    bounds = cellBounds("JP05AV8TJGHD")
    @test isapprox(bounds.minLat, 35.68121961131576; atol=0.000001)
    @test isapprox(bounds.maxLat, 35.68127755465351; atol=0.000001)
    @test isapprox(bounds.minLon, 139.76712226867676; atol=0.000001)
    @test isapprox(bounds.maxLon, 139.767165184021; atol=0.000001)
end
