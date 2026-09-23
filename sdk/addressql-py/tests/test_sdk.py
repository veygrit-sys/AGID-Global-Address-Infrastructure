import unittest

from addressql import (
    address_match,
    country_resolve,
    delivery_available,
    normalize_address,
    postal_normalize,
    postal_status,
    postal_validate,
)


class AddressQlSdkTest(unittest.TestCase):
    def test_country_and_postal_metadata(self):
        self.assertEqual(country_resolve("Nihon")["country_code"], "JP")
        self.assertEqual(postal_status("HK"), "none")
        self.assertEqual(postal_normalize("1000001", "JP"), "100-0001")

    def test_validation_and_delivery_non_claims(self):
        postal = postal_validate("1000001", "JP")
        delivery = delivery_available("HK", "", "synthetic_carrier")

        self.assertTrue(postal["valid"])
        self.assertIsNone(postal["exists"])
        self.assertEqual(postal["validation_scope"], "format_only")
        self.assertIn("postal_existence_evidence_required", postal["warnings"])
        self.assertIn("not full address identity", " ".join(postal["non_claims"]))
        self.assertFalse(delivery["available"])
        self.assertIn("approved_delivery_source_required", delivery["reasons"])
        self.assertIn("not proof of residence", " ".join(delivery["non_claims"]))

    def test_matching_is_purpose_relative(self):
        a = normalize_address("Synthetic US Fixture Street", "US")
        b = normalize_address(" Synthetic   US Fixture   Street ", "US")
        decision = address_match(a, b, "delivery")

        self.assertTrue(decision["match"])
        self.assertEqual(decision["purpose"], "delivery")
        self.assertIn("not proof of residence", " ".join(decision["non_claims"]))

    def test_matching_handles_abbreviations_and_bounded_typos(self):
        full = normalize_address("Synthetic Fixture Street 12", "US")
        abbreviated = normalize_address("Synthetic Fixture St. 12", "US")
        typo = normalize_address("Synthetic Fixtur Street 12", "US")

        self.assertTrue(address_match(full, abbreviated)["match"])
        self.assertTrue(address_match(full, typo)["match"])

    def test_matching_rejects_explicit_country_mismatch(self):
        us = normalize_address("Synthetic Fixture Street 12", "US")
        ca = normalize_address("Synthetic Fixture Street 12", "CA")

        self.assertFalse(address_match(us, ca)["match"])
        self.assertEqual(address_match(us, ca)["confidence"], 0.0)


if __name__ == "__main__":
    unittest.main()
