import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

import {
  ADDRESS_WALLET_CARRIER_COUNTRY_FORMS_VERSION,
  buildAddressWalletCarrierLabelTransform,
  buildAddressWalletCarrierCoverageMatrix,
  buildAddressWalletCarrierCountryFeatureMatrix,
  buildAddressWalletCarrierCountryFormCatalog,
  buildAddressWalletCarrierPreflightPreview,
  ENGLISH_SPEAKING_CARRIER_COUNTRY_CODES,
  MULTILINGUAL_CARRIER_COUNTRY_CODES,
  normalizeAddressWalletPoBoxSpelling,
  preflightAddressWalletCarrierShipment,
  selectAddressWalletCarrierCountryForm,
  validateAddressWalletCarrierLabelTransform,
  validateAddressWalletCarrierCountryFeatureMatrix,
  validateAddressWalletCarrierCountryFormCatalog,
} from './addressWalletCarrierCountryForms';

test('Address Wallet carrier country form catalog validates DHL/UPS MVP scope', () => {
  const catalog = buildAddressWalletCarrierCountryFormCatalog();

  assert.equal(catalog.version, ADDRESS_WALLET_CARRIER_COUNTRY_FORMS_VERSION);
  assert.deepEqual(validateAddressWalletCarrierCountryFormCatalog(catalog), []);
  assert.equal(catalog.productName, 'Address Wallet Carrier Country Forms');
  assert.match(catalog.scope, /DHL\/UPS MVP/);
  assert.match(catalog.runtimeRules.join('\n'), /server-side/);
});

test('catalog captures the first DHL/UPS MVP country forms', () => {
  const catalog = buildAddressWalletCarrierCountryFormCatalog();
  const countryCodes = new Set(catalog.countries.map(country => country.countryCode));

  for (const countryCode of ['JP', 'US', 'DE', 'FR', 'GB', 'CA', 'AU', 'MX']) {
    assert.ok(countryCodes.has(countryCode), `${countryCode} should be included`);
  }
  for (const countryCode of ENGLISH_SPEAKING_CARRIER_COUNTRY_CODES) {
    assert.ok(countryCodes.has(countryCode), `${countryCode} should be included as English-speaking form coverage`);
  }
  for (const countryCode of MULTILINGUAL_CARRIER_COUNTRY_CODES) {
    assert.ok(countryCodes.has(countryCode), `${countryCode} should be included as multilingual form coverage`);
  }

  for (const country of catalog.countries) {
    assert.ok(country.carriers.dhl, `${country.countryCode} should include DHL`);
    assert.ok(country.carriers.ups, `${country.countryCode} should include UPS`);
    assert.ok(country.requiredWalletFields.includes('recipient'));
    assert.ok(country.requiredWalletFields.includes('countryCode'));
    assert.ok(country.optionalWalletFields.includes('poBox'));
    assert.match(country.addressFormatPath, new RegExp(`${country.countryCode}\\.json$`));
  }
});

test('coverage matrix summarizes DHL/UPS runtime boundaries by country and continent', () => {
  const catalog = buildAddressWalletCarrierCountryFormCatalog();
  const matrix = buildAddressWalletCarrierCoverageMatrix(catalog);
  const dhl = matrix.carrierSummaries.find(summary => summary.carrier === 'dhl');
  const ups = matrix.carrierSummaries.find(summary => summary.carrier === 'ups');

  assert.equal(matrix.version, ADDRESS_WALLET_CARRIER_COUNTRY_FORMS_VERSION);
  assert.equal(matrix.productName, 'Address Wallet DHL/UPS Coverage Matrix');
  assert.equal(matrix.countryCount, catalog.countries.length);
  assert.equal(matrix.countryCount, 102);
  assert.deepEqual(matrix.countryCodes, ['AG', 'AO', 'AR', 'AT', 'AU', 'BB', 'BE', 'BF', 'BJ', 'BO', 'BR', 'BS', 'BW', 'BZ', 'CA', 'CD', 'CG', 'CH', 'CI', 'CL', 'CM', 'CO', 'CR', 'CU', 'CV', 'CY', 'CZ', 'DE', 'DK', 'DM', 'DO', 'EC', 'ES', 'FI', 'FR', 'GA', 'GB', 'GD', 'GH', 'GM', 'GN', 'GR', 'GT', 'GW', 'GY', 'HK', 'HN', 'HU', 'IE', 'IN', 'IT', 'JM', 'JP', 'KE', 'KN', 'LC', 'LI', 'LR', 'LU', 'MC', 'ML', 'MT', 'MW', 'MX', 'MY', 'MZ', 'NA', 'NE', 'NG', 'NI', 'NL', 'NO', 'NZ', 'PA', 'PE', 'PH', 'PL', 'PR', 'PT', 'PY', 'RO', 'RW', 'SE', 'SG', 'SL', 'SN', 'ST', 'SV', 'TG', 'TL', 'TR', 'TT', 'TZ', 'UA', 'UG', 'US', 'UY', 'VC', 'VE', 'ZA', 'ZM', 'ZW']);
  assert.deepEqual(matrix.continentCoverage.Africa, ['AO', 'BF', 'BJ', 'BW', 'CD', 'CG', 'CI', 'CM', 'CV', 'GA', 'GH', 'GM', 'GN', 'GW', 'KE', 'LR', 'ML', 'MW', 'MZ', 'NA', 'NE', 'NG', 'RW', 'SL', 'SN', 'ST', 'TG', 'TZ', 'UG', 'ZA', 'ZM', 'ZW']);
  assert.deepEqual(matrix.continentCoverage.Asia, ['HK', 'IN', 'JP', 'MY', 'PH', 'SG', 'TL', 'TR']);
  assert.deepEqual(matrix.continentCoverage.Europe, ['AT', 'BE', 'CH', 'CY', 'CZ', 'DE', 'DK', 'ES', 'FI', 'FR', 'GB', 'GR', 'HU', 'IE', 'IT', 'LI', 'LU', 'MC', 'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 'SE', 'UA']);
  assert.deepEqual(matrix.continentCoverage.Americas, ['AG', 'AR', 'BB', 'BO', 'BR', 'BS', 'BZ', 'CA', 'CL', 'CO', 'CR', 'CU', 'DM', 'DO', 'EC', 'GD', 'GT', 'GY', 'HN', 'JM', 'KN', 'LC', 'MX', 'NI', 'PA', 'PE', 'PR', 'PY', 'SV', 'TT', 'US', 'UY', 'VC', 'VE']);
  assert.deepEqual(matrix.continentCoverage.Oceania, ['AU', 'NZ']);
  assert.ok(dhl);
  assert.ok(ups);
  assert.equal(dhl?.countryCount, 102);
  assert.equal(ups?.countryCount, 102);
  assert.deepEqual(dhl?.capabilityModes, ['global_express_api_available']);
  assert.ok(ups?.capabilityModes.includes('runtime_capability_check_required'));
  assert.ok(ups?.capabilityModes.includes('street_level_validation_available'));
  assert.deepEqual(ups?.streetLevelValidationCountryCodes, ['US']);
  assert.equal(dhl?.serverSideRuntimeChecksRequired, true);
  assert.equal(ups?.localFormOnlyBoundary, true);
  assert.equal(matrix.productionTraffic, false);
  assert.ok(matrix.blockedMaterial.includes('rawAddress'));
  assert.ok(matrix.blockedMaterial.includes('carrierApiKey'));
  assert.match(matrix.nonClaims.join('\n'), /not a live DHL\/UPS service guarantee/);
  assert.doesNotMatch(JSON.stringify(matrix), /recipientPhoneValue|carrierApiKeyValue|rawAddressValue|proofSecretValue|privateKeyValue/);
});

test('country feature matrix defines DHL/UPS functions per MVP country without live-service claims', () => {
  const catalog = buildAddressWalletCarrierCountryFormCatalog();
  const matrix = buildAddressWalletCarrierCountryFeatureMatrix(catalog);

  assert.equal(matrix.version, ADDRESS_WALLET_CARRIER_COUNTRY_FORMS_VERSION);
  assert.equal(matrix.productName, 'Address Wallet DHL/UPS Country Feature Matrix');
  assert.deepEqual(validateAddressWalletCarrierCountryFeatureMatrix(matrix), []);
  assert.deepEqual(matrix.countryCodes, ['AG', 'AO', 'AR', 'AT', 'AU', 'BB', 'BE', 'BF', 'BJ', 'BO', 'BR', 'BS', 'BW', 'BZ', 'CA', 'CD', 'CG', 'CH', 'CI', 'CL', 'CM', 'CO', 'CR', 'CU', 'CV', 'CY', 'CZ', 'DE', 'DK', 'DM', 'DO', 'EC', 'ES', 'FI', 'FR', 'GA', 'GB', 'GD', 'GH', 'GM', 'GN', 'GR', 'GT', 'GW', 'GY', 'HK', 'HN', 'HU', 'IE', 'IN', 'IT', 'JM', 'JP', 'KE', 'KN', 'LC', 'LI', 'LR', 'LU', 'MC', 'ML', 'MT', 'MW', 'MX', 'MY', 'MZ', 'NA', 'NE', 'NG', 'NI', 'NL', 'NO', 'NZ', 'PA', 'PE', 'PH', 'PL', 'PR', 'PT', 'PY', 'RO', 'RW', 'SE', 'SG', 'SL', 'SN', 'ST', 'SV', 'TG', 'TL', 'TR', 'TT', 'TZ', 'UA', 'UG', 'US', 'UY', 'VC', 'VE', 'ZA', 'ZM', 'ZW']);
  assert.deepEqual(matrix.carriers, ['dhl', 'ups']);
  assert.equal(matrix.rows.length, 204);
  assert.equal(matrix.productionTraffic, false);

  const upsUs = matrix.rows.find(row => row.countryCode === 'US' && row.carrier === 'ups');
  const dhlJp = matrix.rows.find(row => row.countryCode === 'JP' && row.carrier === 'dhl');
  assert.ok(upsUs);
  assert.ok(dhlJp);
  assert.equal(upsUs.capabilityMode, 'street_level_validation_available');
  assert.equal(upsUs.features.find(feature => feature.feature === 'addressValidation')?.availability, 'sandbox_contract_required');
  assert.equal(dhlJp.features.find(feature => feature.feature === 'getRates')?.availability, 'sandbox_contract_required');
  assert.equal(dhlJp.features.find(feature => feature.feature === 'pickupRequest')?.availability, 'future');

  for (const row of matrix.rows) {
    const featureIds = row.features.map(feature => feature.feature);
    for (const feature of ['countryForm', 'recipientIdResolution', 'walletConsentHandoff', 'getRates', 'createShipment', 'createLabel', 'trackShipment', 'createReturn']) {
      assert.ok(featureIds.includes(feature as never), `${row.countryCode}/${row.carrier} should include ${feature}`);
    }
    assert.ok(row.features.every(feature => feature.feature === 'countryForm' || feature.serverSideOnly));
    assert.match(row.requiredRuntimeChecks.join('\n'), /capability preflight/);
    assert.match(row.nonClaims.join('\n'), /not a live DHL\/UPS service guarantee/);
  }
  assert.ok(matrix.blockedMaterial.includes('rawAddress'));
  assert.ok(matrix.blockedMaterial.includes('carrierApiKey'));
  assert.doesNotMatch(JSON.stringify(matrix), /recipientPhoneValue|carrierApiKeyValue|rawAddressValue|proofSecretValue|privateKeyValue/);
});

test('country feature matrix validator catches missing safe boundaries', () => {
  const matrix = buildAddressWalletCarrierCountryFeatureMatrix();
  const unsafe = {
    ...matrix,
    productionTraffic: true,
    rows: matrix.rows.map((row, index) => index === 0
      ? {
          ...row,
          productionTraffic: true,
          features: row.features.filter(feature => feature.feature !== 'walletConsentHandoff'),
          nonClaims: [],
        }
      : row),
  } as unknown as typeof matrix;
  const errors = validateAddressWalletCarrierCountryFeatureMatrix(unsafe);

  assert.ok(errors.includes('production-traffic-not-false'));
  assert.ok(errors.some(error => error.startsWith('missing-feature:')));
  assert.ok(errors.some(error => error.startsWith('row-production-traffic-not-false:')));
  assert.ok(errors.some(error => error.startsWith('missing-service-non-claim:')));
});

test('catalog points to existing address format JSON files', () => {
  const catalog = buildAddressWalletCarrierCountryFormCatalog();

  for (const country of catalog.countries) {
    assert.ok(existsSync(country.addressFormatPath), `${country.addressFormatPath} should exist`);
    const format = JSON.parse(readFileSync(country.addressFormatPath, 'utf8')) as {
      countryCode?: string;
      name?: string;
      native?: { fields?: unknown[] };
      english?: { fields?: unknown[] };
    };
    assert.equal(format.countryCode, country.countryCode);
    assert.equal(typeof format.name, 'string');
    assert.ok((format.native?.fields?.length ?? 0) > 0 || (format.english?.fields?.length ?? 0) > 0);
  }
});

test('carrier country form selection returns safe-to-store refs and next actions', () => {
  const dhlJapan = selectAddressWalletCarrierCountryForm({ carrier: 'dhl', countryCode: 'jp' });
  const upsUs = selectAddressWalletCarrierCountryForm({ carrier: 'ups', countryCode: 'US' });
  const unknown = selectAddressWalletCarrierCountryForm({ carrier: 'dhl', countryCode: 'ZZ' });

  assert.ok(dhlJapan);
  assert.ok(upsUs);
  assert.equal(unknown, null);
  assert.equal(dhlJapan?.countryCode, 'JP');
  assert.equal(dhlJapan?.requiredNextAction, 'render_wallet_country_form');
  assert.equal(upsUs?.form.carriers.ups.capabilityMode, 'street_level_validation_available');
  assert.ok(upsUs?.safeToStore.includes('carrierCapabilityRef'));
  assert.ok(upsUs?.blockedMaterial.includes('rawAddress'));
  assert.ok(upsUs?.blockedMaterial.includes('carrierApiKey'));
});

test('preflight preview view-model builds active next actions without private material', () => {
  const dhlJapan = buildAddressWalletCarrierPreflightPreview({
    carrier: 'dhl',
    countryCode: 'jp',
    includeCarrierCapabilityRef: true,
  });
  const upsUs = buildAddressWalletCarrierPreflightPreview({
    carrier: 'ups',
    countryCode: 'US',
  });

  assert.equal(dhlJapan.version, ADDRESS_WALLET_CARRIER_COUNTRY_FORMS_VERSION);
  assert.equal(dhlJapan.countryCode, 'JP');
  assert.equal(dhlJapan.activeNextAction, 'ready_for_hexaship_createShipment');
  assert.equal(dhlJapan.activeSelectionAction, 'render_wallet_country_form');
  assert.deepEqual(dhlJapan.activeMissingRefs, []);
  assert.equal(dhlJapan.capabilityMode, 'global_express_api_available');
  assert.equal(dhlJapan.productionTraffic, false);
  assert.equal(dhlJapan.privateMaterialExposed, false);

  assert.equal(upsUs.countryCode, 'US');
  assert.equal(upsUs.activeNextAction, 'run_carrier_capability_check');
  assert.equal(upsUs.activeSelectionAction, 'render_wallet_country_form');
  assert.deepEqual(upsUs.activeMissingRefs, ['carrierCapabilityRef']);
  assert.equal(upsUs.capabilityMode, 'street_level_validation_available');
  assert.equal(upsUs.productionTraffic, false);
  assert.doesNotMatch(JSON.stringify([dhlJapan, upsUs]), /rawAddressValue|recipientPhoneValue|carrierApiKeyValue|proofWitnessValue|privateKeyValue|proofSecretValue/);
});

test('carrier label transform keeps user familiar forms and maps descriptors to DHL and UPS label fields', () => {
  const dhl = buildAddressWalletCarrierLabelTransform({
    carrier: 'dhl',
    countryCode: 'JP',
    submittedFields: ['recipient', 'countryCode', 'postcode', 'state', 'city', 'street', 'building', 'unit'],
    labelFormat: 'pdf',
  });
  const ups = buildAddressWalletCarrierLabelTransform({
    carrier: 'ups',
    countryCode: 'US',
    submittedFields: ['recipient', 'countryCode', 'postcode', 'state', 'city', 'street', 'houseNumber'],
    labelFormat: 'zpl',
  });

  assert.ok(dhl);
  assert.ok(ups);
  assert.deepEqual(validateAddressWalletCarrierLabelTransform(dhl), []);
  assert.deepEqual(validateAddressWalletCarrierLabelTransform(ups), []);
  assert.equal(dhl.sourceFormMode, 'user_familiar_country_form');
  assert.equal(ups.sourceFormMode, 'user_familiar_country_form');
  assert.equal(dhl.userEntryPolicy.renderCountryNativeOrder, true);
  assert.equal(dhl.userEntryPolicy.doNotAskForCarrierSpecificShape, true);
  assert.equal(dhl.userEntryPolicy.carrierShapeGeneratedServerSide, true);
  assert.deepEqual(dhl.userEntryPolicy.acceptedPoBoxSpellings, ['P.O. Box', 'PO Box', 'P/O Box']);
  assert.match(dhl.sourceAddressFormatPath, /JP\.json$/);
  assert.match(ups.sourceAddressFormatPath, /US\.json$/);
  assert.equal(dhl.normalizedCarrierFields.postcode, 'receiver.postalAddress.postalCode');
  assert.equal(ups.normalizedCarrierFields.postcode, 'Shipment.ShipTo.Address.PostalCode');
  assert.equal(dhl.normalizedCarrierFields.poBox, 'receiver.postalAddress.addressLine1');
  assert.equal(ups.normalizedCarrierFields.poBox, 'Shipment.ShipTo.Address.AddressLine.0');
  assert.deepEqual(dhl.acceptedStreetAlternatives, ['street', 'poBox']);
  assert.equal(dhl.rawAddressExposedToMerchant, false);
  assert.equal(ups.serverSideOnly, true);
  assert.equal(dhl.requiredNextAction, 'ready_for_createLabel');
  assert.doesNotMatch(JSON.stringify([dhl, ups]), /rawAddressValue|recipientPhoneValue|carrierApiKeyValue|proofSecretValue|privateKeyValue/);
});

test('P.O. Box can satisfy the user form street alternative but still requires carrier runtime eligibility check', () => {
  const transform = buildAddressWalletCarrierLabelTransform({
    carrier: 'ups',
    countryCode: 'US',
    submittedFields: ['recipient', 'countryCode', 'postcode', 'state', 'city', 'poBox'],
    poBoxUsed: true,
  });
  const preflight = preflightAddressWalletCarrierShipment({
    carrier: 'ups',
    countryCode: 'US',
    recipientId: 'ship_recipient_synthetic_po_box_001',
    walletConsentRef: 'consent_synthetic_po_box_001',
    parcelProfileRef: 'parcel_profile_synthetic_po_box_001',
    carrierCapabilityRef: 'carrier_capability_ups_po_box_runtime_001',
    submittedFields: ['recipient', 'countryCode', 'postcode', 'state', 'city', 'poBox'],
  });

  assert.ok(transform);
  assert.deepEqual(validateAddressWalletCarrierLabelTransform(transform), []);
  assert.equal(transform.poBoxPolicy.usedInThisTransform, true);
  assert.equal(transform.poBoxPolicy.supportedAtFormLevel, true);
  assert.equal(transform.poBoxPolicy.labelEligibilityRuntimeCheckRequired, true);
  assert.ok(transform.userEntryPolicy.acceptedPoBoxSpellings.includes('P/O Box'));
  assert.equal(transform.userEntryPolicy.doNotAskForCarrierSpecificShape, true);
  assert.match(transform.poBoxPolicy.carrierSpecificWarning, /P\.O\. Box/);
  assert.equal(transform.requiredNextAction, 'run_carrier_capability_check');
  assert.deepEqual(transform.missingWalletFields, []);
  assert.equal(preflight.ok, true);
  assert.deepEqual(preflight.missingWalletFields, []);
  assert.equal(preflight.requiredNextAction, 'ready_for_hexaship_createShipment');
});

test('P/O/BOX spellings normalize without exposing raw address material to carrier label transforms', () => {
  assert.equal(normalizeAddressWalletPoBoxSpelling('P.O. Box'), 'PO Box');
  assert.equal(normalizeAddressWalletPoBoxSpelling('PO Box'), 'PO Box');
  assert.equal(normalizeAddressWalletPoBoxSpelling('P/O Box'), 'PO Box');
  assert.equal(normalizeAddressWalletPoBoxSpelling('P/O/BOX'), 'PO Box');
  assert.equal(normalizeAddressWalletPoBoxSpelling('private mailbox'), null);

  const transform = buildAddressWalletCarrierLabelTransform({
    carrier: 'dhl',
    countryCode: 'CA',
    submittedFields: ['recipient', 'countryCode', 'postcode', 'state', 'city', 'poBox'],
    poBoxSpelling: 'P/O/BOX',
  });

  assert.ok(transform);
  assert.deepEqual(validateAddressWalletCarrierLabelTransform(transform), []);
  assert.equal(transform.poBoxPolicy.usedInThisTransform, true);
  assert.equal(transform.poBoxPolicy.submittedSpellingAccepted, true);
  assert.equal(transform.poBoxPolicy.normalizedSpelling, 'PO Box');
  assert.equal(transform.requiredNextAction, 'run_carrier_capability_check');
  assert.equal(transform.rawAddressExposedToMerchant, false);
  assert.doesNotMatch(JSON.stringify(transform), /rawAddressValue|recipientPhoneValue|carrierApiKeyValue|proofSecretValue|privateKeyValue/);
});

test('shipment preflight connects Address Wallet forms to Hexaship createShipment refs', () => {
  const ready = preflightAddressWalletCarrierShipment({
    carrier: 'dhl',
    countryCode: 'JP',
    recipientId: 'ship_recipient_synthetic_001',
    walletConsentRef: 'consent_synthetic_hexaship_001',
    parcelProfileRef: 'parcel_profile_synthetic_small_box_001',
    carrierCapabilityRef: 'carrier_capability_dhl_jp_sandbox_001',
    addressFormVersion: 'jp-wallet-form-v0.1',
    submittedFields: ['recipient', 'countryCode', 'postcode', 'state', 'city'],
  });

  assert.equal(ready.ok, true);
  assert.equal(ready.requiredNextAction, 'ready_for_hexaship_createShipment');
  assert.deepEqual(ready.missingRefs, []);
  assert.deepEqual(ready.missingWalletFields, []);
  assert.equal(ready.safeRefs.recipientId, 'ship_recipient_synthetic_001');
  assert.equal(ready.productionTraffic, false);
});

test('shipment preflight blocks unsafe material and requires carrier capability before labels', () => {
  const unsafe = preflightAddressWalletCarrierShipment({
    carrier: 'ups',
    countryCode: 'US',
    recipientId: 'ship_recipient_synthetic_001',
    parcelProfileRef: 'parcel_profile_synthetic_small_box_001',
    walletConsentRef: 'consent_synthetic_hexaship_001',
    submittedFields: ['recipient', 'countryCode', 'postcode', 'state', 'city', 'street'],
    rawAddress: 'blocked synthetic private material',
    nested: {
      carrierApiKey: 'blocked synthetic secret',
    },
  });

  assert.equal(unsafe.ok, false);
  assert.equal(unsafe.requiredNextAction, 'run_carrier_capability_check');
  assert.deepEqual(unsafe.missingRefs, ['carrierCapabilityRef']);
  assert.ok(unsafe.rejectedKeys.includes('rawAddress'));
  assert.ok(unsafe.rejectedKeys.includes('nested.carrierApiKey'));
  assert.doesNotMatch(JSON.stringify(unsafe.safeRefs), /rawAddress|carrierApiKey|recipientPhone|proofWitness|privateKey/);
});

test('catalog docs and package verification gate are present', () => {
  const doc = readFileSync('docs/product/address-wallet-carrier-country-forms.md', 'utf8');
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> };

  assert.match(doc, /Address Wallet Carrier Country Forms/);
  assert.match(doc, /DHL\/UPS/);
  assert.match(doc, /102/);
  assert.match(doc, /English-speaking/);
  assert.match(doc, /Spanish-speaking/);
  assert.match(doc, /French-speaking/);
  assert.match(doc, /German-speaking/);
  assert.match(doc, /Portuguese-speaking/);
  assert.match(doc, /Coverage Matrix/);
  assert.match(doc, /Country Feature Matrix/);
  assert.match(doc, /createShipment/);
  assert.match(doc, /createLabel/);
  assert.match(doc, /trackShipment/);
  assert.match(doc, /createReturn/);
  assert.match(doc, /streetLevelValidationCountryCodes/);
  assert.match(doc, /serverSideRuntimeChecksRequired/);
  assert.match(doc, /productionTraffic`:\s*`false/);
  assert.match(doc, /runtime capability check/);
  assert.match(doc, /rawAddress/);
  assert.match(doc, /carrierApiKey/);
  assert.match(doc, /ready_for_hexaship_createShipment/);
  assert.match(doc, /P\.O\. Box/);
  assert.match(doc, /PO Box/);
  assert.match(doc, /P\/O Box/);
  assert.match(doc, /user familiar country form/i);
  assert.match(doc, /never has to choose a DHL or UPS address shape/i);
  assert.match(doc, /normalized carrier label fields/i);
  assert.doesNotMatch(doc, /sk_live|proofSecretValue|privateKeyValue/);
  assert.equal(packageJson.scripts?.['verify:address-wallet-carrier-country-forms'], 'tsx --test src/lib/addressWalletCarrierCountryForms.test.ts');
});
