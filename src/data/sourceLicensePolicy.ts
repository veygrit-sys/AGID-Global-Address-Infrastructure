export type SourceLicenseInput = {
  license?: string | null;
  kind?: string;
  url?: string;
};

export type SourceLicenseStatus = {
  label: string;
  redistributable: boolean;
  requiresReview: boolean;
  reason: string;
};

export const LICENSE_REVIEW_REQUIRED = 'License review required before redistribution';

const REVIEW_PATTERN = /varies|check|terms|non-commercial|review|individual datasets vary/i;

export function resolveSourceLicenseStatus(source: SourceLicenseInput): SourceLicenseStatus {
  const explicitLicense = source.license?.trim();

  if (!explicitLicense) {
    return {
      label: LICENSE_REVIEW_REQUIRED,
      redistributable: false,
      requiresReview: true,
      reason: 'No explicit license metadata is registered for this source.',
    };
  }

  const requiresReview = REVIEW_PATTERN.test(explicitLicense);

  return {
    label: explicitLicense,
    redistributable: !requiresReview,
    requiresReview,
    reason: requiresReview
      ? 'The license label points to source-specific terms or mixed datasets that need review.'
      : 'Explicit source license metadata is registered.',
  };
}
