defmodule Agid do
  @base32_alphabet "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
  @prefix_length 2
  @hash_length 10
  @total_length 12

  def base32_alphabet, do: @base32_alphabet
  def prefix_length, do: @prefix_length
  def hash_length, do: @hash_length
  def total_length, do: @total_length

  def encode(_lat, _lon) do
    {:error, :not_implemented}
  end

  def decode(_id), do: nil

  def cellBounds(_id), do: {:error, :not_implemented}
end
