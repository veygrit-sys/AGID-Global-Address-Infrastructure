-- Veygrit -ship DHL routing persistence.
-- Product names are deliberately absent: carrier product identifiers are stored only as codes.

CREATE TABLE IF NOT EXISTS veygrit_ship_dhl_product_selection (
  shipment_ref text PRIMARY KEY,
  merchant_ref text NOT NULL,
  adapter text NOT NULL CHECK (adapter IN ('mydhl-express', 'ecommerce-americas-v4')),
  product_id_code varchar(10) NOT NULL CHECK (product_id_code ~ '^[A-Z0-9]{1,10}$'),
  origin_country_code char(2) NOT NULL CHECK (origin_country_code ~ '^[A-Z]{2}$'),
  destination_country_code char(2) NOT NULL CHECK (destination_country_code ~ '^[A-Z]{2}$'),
  status text NOT NULL CHECK (status IN ('selected', 'created')),
  saved_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS veygrit_ship_dhl_product_selection_merchant_idx
  ON veygrit_ship_dhl_product_selection (merchant_ref, saved_at DESC);

COMMENT ON COLUMN veygrit_ship_dhl_product_selection.product_id_code IS
  'Carrier product code such as GND or MyDHL P. Never store a localized product name as the identifier.';
