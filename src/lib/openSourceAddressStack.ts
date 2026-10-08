export type OpenSourceAddressStackStatus = 'integrated' | 'optional' | 'license-gated';

export type OpenSourceAddressStackEntry = {
  id: 'libpostal' | 'photon' | 'pelias' | 'overture-addresses';
  name: string;
  role: 'address-parsing' | 'search-autocomplete' | 'full-geocoding' | 'address-corpus';
  status: OpenSourceAddressStackStatus;
  softwareLicense: string;
  dataLicenseBoundary: string;
  deployment: 'loopback-sidecar' | 'remote-or-self-hosted' | 'self-hosted-service' | 'versioned-dataset';
  projectUrl: string;
  repositoryUrl?: string;
  defaultEnabled: boolean;
};

/**
 * Address OSS is recorded as an operational stack rather than npm
 * dependencies. libpostal is a native sidecar, Photon and Pelias are services,
 * and Overture Addresses is a separately licensed dataset.
 */
export const OPEN_SOURCE_ADDRESS_STACK: readonly OpenSourceAddressStackEntry[] = [
  {
    id: 'libpostal',
    name: 'libpostal',
    role: 'address-parsing',
    status: 'integrated',
    softwareLicense: 'MIT',
    dataLicenseBoundary: 'Record parser-model and training-data provenance separately from the MIT software.',
    deployment: 'loopback-sidecar',
    projectUrl: 'https://github.com/openvenues/libpostal',
    repositoryUrl: 'https://github.com/openvenues/libpostal',
    defaultEnabled: false,
  },
  {
    id: 'photon',
    name: 'Photon',
    role: 'search-autocomplete',
    status: 'integrated',
    softwareLicense: 'Apache-2.0',
    dataLicenseBoundary: 'OpenStreetMap-derived indexes retain ODbL attribution and data obligations.',
    deployment: 'remote-or-self-hosted',
    projectUrl: 'https://photon.komoot.io/',
    repositoryUrl: 'https://github.com/komoot/photon',
    defaultEnabled: true,
  },
  {
    id: 'pelias',
    name: 'Pelias',
    role: 'full-geocoding',
    status: 'optional',
    softwareLicense: 'MIT',
    dataLicenseBoundary: 'Track the license and attribution of every imported source independently.',
    deployment: 'self-hosted-service',
    projectUrl: 'https://pelias.io/',
    repositoryUrl: 'https://github.com/pelias/pelias',
    defaultEnabled: false,
  },
  {
    id: 'overture-addresses',
    name: 'Overture Addresses',
    role: 'address-corpus',
    status: 'license-gated',
    softwareLicense: 'Dataset; source-specific terms',
    dataLicenseBoundary: 'Keep release version, source attribution, and source-specific license fields; do not treat alpha IDs as stable AGID identifiers.',
    deployment: 'versioned-dataset',
    projectUrl: 'https://docs.overturemaps.org/guides/addresses/',
    defaultEnabled: false,
  },
] as const;

export type OpenSourceAddressStackAudit = {
  integrated: OpenSourceAddressStackEntry[];
  optionalAdditions: OpenSourceAddressStackEntry[];
  licenseGated: OpenSourceAddressStackEntry[];
  hasLocalParser: boolean;
  hasSearchAutocomplete: boolean;
  hasFullSelfHostedGeocoder: boolean;
};

export function auditOpenSourceAddressStack(
  entries: readonly OpenSourceAddressStackEntry[] = OPEN_SOURCE_ADDRESS_STACK,
): OpenSourceAddressStackAudit {
  const integrated = entries.filter(entry => entry.status === 'integrated');
  return {
    integrated,
    optionalAdditions: entries.filter(entry => entry.status === 'optional'),
    licenseGated: entries.filter(entry => entry.status === 'license-gated'),
    hasLocalParser: integrated.some(entry => entry.role === 'address-parsing'),
    hasSearchAutocomplete: integrated.some(entry => entry.role === 'search-autocomplete'),
    hasFullSelfHostedGeocoder: integrated.some(
      entry => entry.role === 'full-geocoding' && entry.deployment === 'self-hosted-service',
    ),
  };
}
