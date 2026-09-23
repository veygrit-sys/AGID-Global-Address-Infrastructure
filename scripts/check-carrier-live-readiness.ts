import { assessCarrierLiveEnvironment } from '../src/lib/carrierConnectorLayer';

const connectors = ['dhl', 'ups'] as const;
const results = connectors.map(connectorId => assessCarrierLiveEnvironment(connectorId, process.env));
const dhlEcommerceRequired = [
  'HEXASHIP_DHL_ECOMMERCE_BASE_URL',
  'HEXASHIP_DHL_ECOMMERCE_CLIENT_ID',
  'HEXASHIP_DHL_ECOMMERCE_CLIENT_SECRET',
  'HEXASHIP_DHL_ECOMMERCE_PICKUP_ACCOUNT',
  'HEXASHIP_DHL_ECOMMERCE_DISTRIBUTION_CENTER',
] as const;
const dhlEcommercePresent = dhlEcommerceRequired.filter(key => Boolean(process.env[key]?.trim()));
const dhlEcommerceMissing = dhlEcommerceRequired.filter(key => !process.env[key]?.trim());
const dhlEcommerceSandboxReady = dhlEcommerceMissing.length === 0;
const dhlEcommerceProductionReady = dhlEcommerceSandboxReady
  && process.env.HEXASHIP_DHL_ECOMMERCE_BASE_URL === 'https://api.dhlecs.com'
  && process.env.HEXASHIP_CARRIER_LIVE_TRAFFIC_ENABLED === 'true';

for (const result of results) {
  console.log(`${result.connectorId.toUpperCase()} carrier readiness`);
  console.log(`  sandbox: ${result.readyForSandbox ? 'ready' : 'blocked'}`);
  console.log(`  production: ${result.readyForProduction ? 'ready' : 'blocked'}`);
  console.log(`  live traffic: ${result.liveTrafficEnabled ? 'enabled' : 'disabled'}`);
  console.log(`  present keys: ${result.presentEnvKeys.length > 0 ? result.presentEnvKeys.join(', ') : '(none)'}`);
  console.log(`  missing keys: ${result.missingEnvKeys.length > 0 ? result.missingEnvKeys.join(', ') : '(none)'}`);
  console.log(`  next: ${result.nextActions.join(' | ')}`);
}

console.log('DHL ECOMMERCE AMERICAS V4 carrier readiness');
console.log(`  sandbox: ${dhlEcommerceSandboxReady ? 'ready' : 'blocked'}`);
console.log(`  production: ${dhlEcommerceProductionReady ? 'ready' : 'blocked'}`);
console.log(`  live traffic: ${process.env.HEXASHIP_CARRIER_LIVE_TRAFFIC_ENABLED === 'true' ? 'enabled' : 'disabled'}`);
console.log(`  present keys: ${dhlEcommercePresent.length > 0 ? dhlEcommercePresent.join(', ') : '(none)'}`);
console.log(`  missing keys: ${dhlEcommerceMissing.length > 0 ? dhlEcommerceMissing.join(', ') : '(none)'}`);
console.log('  next: Complete separate DHL eCommerce Americas onboarding; MyDHL Express credentials do not unlock eCommerce v4.');

const sandboxReady = results.every(result => result.readyForSandbox) && dhlEcommerceSandboxReady;
process.exitCode = sandboxReady ? 0 : 1;
