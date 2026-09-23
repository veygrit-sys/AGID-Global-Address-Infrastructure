# Generated parity test: encode/decode/cellBounds must match agid-spec/test-vectors.json before formal distribution.
ExUnit.start()

defmodule AgidParityTest do
  use ExUnit.Case

  test "encode/decode/cellBounds match spec" do
    assert {:ok, encoded} = Agid.encode(35.681236, 139.767125)
    assert encoded.id == "JP05AV8TJGHD"
    decoded = Agid.decode("JP05AV8TJGHD")
    assert_in_delta decoded.lat, 35.68121961131576, 0.000001
    assert_in_delta decoded.lon, 139.76712226867676, 0.000001
    bounds = Agid.cellBounds("JP05AV8TJGHD")
    assert_in_delta bounds.minLat, 35.68121961131576, 0.000001
    assert_in_delta bounds.maxLat, 35.68127755465351, 0.000001
    assert_in_delta bounds.minLon, 139.76712226867676, 0.000001
    assert_in_delta bounds.maxLon, 139.767165184021, 0.000001
  end
end
