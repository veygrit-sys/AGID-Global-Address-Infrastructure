export const ACCESSIBILITY_HARDENING_VERSION = 'accessibility-hardening-v1';

export type AccessibilityHardeningPriority = 'P0' | 'P1' | 'P2';

export type AccessibilitySurface =
  | 'global-shell'
  | 'map-canvas'
  | 'address-registration'
  | 'address-language-tabs'
  | 'pos-terminal'
  | 'review-dashboard'
  | 'portal-consent'
  | 'print-export'
  | 'high-risk-mode';

export type AccessibilityCapability =
  | 'keyboard'
  | 'focus'
  | 'screen-reader'
  | 'contrast'
  | 'motion'
  | 'language-direction'
  | 'touch-target'
  | 'error-recovery'
  | 'privacy-narration';

export type AccessibilityHardeningMeasure = {
  id: string;
  priority: AccessibilityHardeningPriority;
  surfaces: AccessibilitySurface[];
  capability: AccessibilityCapability;
  title: string;
  goal: string;
  rules: string[];
  successMetric: string;
};

export type AccessibilityHardeningPlan = {
  version: typeof ACCESSIBILITY_HARDENING_VERSION;
  principle: string;
  measures: AccessibilityHardeningMeasure[];
  releaseGates: string[];
  implementationOrder: string[];
};

export type EvaluateAccessibilityHardeningInput = {
  surface: AccessibilitySurface;
  keyboardPrimaryPath: boolean;
  focusVisible: boolean;
  focusRestoredAfterModal: boolean;
  decisionAnnounced: boolean;
  warningsProgrammatic: boolean;
  usesColorOnlyStatus: boolean;
  minimumContrastRatio: number;
  languageAndDirectionSynced: boolean;
  reducedMotionSupported: boolean;
  minimumTouchTargetPx: number;
  formErrorsLinked: boolean;
  mapHasKeyboardAlternative: boolean;
  highRiskMode: boolean;
  privacyRiskAnnounced: boolean;
  rawAddressHiddenInHighRisk: boolean;
};

export type AccessibilityHardeningEvaluation = {
  valid: boolean;
  grade: 'ready' | 'attention' | 'blocked';
  score: number;
  requiredSurfaces: AccessibilitySurface[];
  blockers: string[];
  warnings: string[];
};

export const ACCESSIBILITY_HARDENING_MEASURES: AccessibilityHardeningMeasure[] = [
  {
    id: 'p0-keyboard-primary-path',
    priority: 'P0',
    surfaces: ['global-shell', 'pos-terminal', 'address-registration', 'portal-consent'],
    capability: 'keyboard',
    title: 'Complete the primary workflow without a pointer',
    goal: 'Scanning, review, registration, consent, and handoff must not depend on mouse-only controls.',
    rules: [
      'Every primary action is reachable by Tab, Shift+Tab, Enter, and Space.',
      'Icon-only controls require accessible names and stable keyboard focus order.',
      'Map-only interactions must have a search, coordinate, AGID, or list-based fallback.',
    ],
    successMetric: 'A keyboard-only operator can complete the primary workflow without dead ends.',
  },
  {
    id: 'p0-visible-focus',
    priority: 'P0',
    surfaces: ['global-shell', 'pos-terminal', 'review-dashboard', 'portal-consent'],
    capability: 'focus',
    title: 'Make focus visible and recoverable',
    goal: 'Operators should always know which control will activate and return to the right place after dialogs.',
    rules: [
      'Use a high-contrast focus-visible ring on interactive controls.',
      'Focus is trapped only inside modal dialogs and restored to the opener when closed.',
      'Destructive confirmation flows move focus to the safest next action.',
    ],
    successMetric: 'Focus is visible on every interactive control and returns after modal close.',
  },
  {
    id: 'p0-programmatic-status',
    priority: 'P0',
    surfaces: ['pos-terminal', 'review-dashboard', 'print-export', 'high-risk-mode'],
    capability: 'screen-reader',
    title: 'Expose decisions and warnings programmatically',
    goal: 'Address OK, Carrier Scan OK, Recipient Pending, rejected, and review states must be available to assistive technology.',
    rules: [
      'Decision banners use headings or status regions with concise text.',
      'Blocking warnings are not hidden behind hover-only or visual-only affordances.',
      'Receipt and print/export summaries include text reasons, not only icons.',
    ],
    successMetric: 'A screen reader announces the active decision and the blocking reason before release.',
  },
  {
    id: 'p0-contrast-and-not-color-only',
    priority: 'P0',
    surfaces: ['global-shell', 'map-canvas', 'pos-terminal', 'review-dashboard'],
    capability: 'contrast',
    title: 'Do not encode operational meaning with color alone',
    goal: 'Status, danger, stale registry, high-risk mode, and review states must remain understandable in low-vision and forced-color contexts.',
    rules: [
      'Maintain at least 4.5:1 contrast for normal text and critical labels.',
      'Pair color states with text, icons, shape, or ordering.',
      'Map hover regions use visible outlines and labels that do not rely on hue alone.',
    ],
    successMetric: 'Operators can distinguish release, review, reject, and high-risk states without relying on color.',
  },
  {
    id: 'p0-language-direction-sync',
    priority: 'P0',
    surfaces: ['global-shell', 'address-language-tabs', 'pos-terminal', 'print-export'],
    capability: 'language-direction',
    title: 'Synchronize language, direction, and document semantics',
    goal: 'The selected language should update visible UI, document language, direction, address tabs, reports, and assistive technology metadata.',
    rules: [
      'Update html lang and dir when POS or app language changes.',
      'Address language tabs expose the active tab and panel relationship.',
      'English domestic and international-shipping variants are separate labels where needed.',
    ],
    successMetric: 'Language switching changes UI copy, text direction, active tab semantics, and report labels consistently.',
  },
  {
    id: 'p1-reduced-motion',
    priority: 'P1',
    surfaces: ['global-shell', 'map-canvas', 'pos-terminal'],
    capability: 'motion',
    title: 'Respect reduced-motion preferences',
    goal: 'Scanning, map highlighting, drawer transitions, and status changes should not create motion sickness or hide state changes.',
    rules: [
      'Disable non-essential animation when prefers-reduced-motion is enabled.',
      'Use instant state changes or opacity-free replacements for critical warnings.',
      'Never depend on animation alone to explain success or failure.',
    ],
    successMetric: 'The app remains readable and complete with reduced motion enabled.',
  },
  {
    id: 'p1-touch-targets',
    priority: 'P1',
    surfaces: ['pos-terminal', 'address-registration', 'portal-consent', 'review-dashboard'],
    capability: 'touch-target',
    title: 'Keep touch targets stable on tablets and field devices',
    goal: 'Cashiers, drivers, and field workers should not miss critical controls on small or ruggedized screens.',
    rules: [
      'Primary controls target at least 44 px on the shorter side.',
      'Controls do not shrink when translated strings become longer.',
      'Adjacent destructive and confirm actions have enough spacing to prevent accidental activation.',
    ],
    successMetric: 'Primary workflow controls remain at least 44 px and do not shift across languages.',
  },
  {
    id: 'p1-linked-errors',
    priority: 'P1',
    surfaces: ['address-registration', 'portal-consent', 'review-dashboard'],
    capability: 'error-recovery',
    title: 'Make errors actionable and linked to inputs',
    goal: 'Address defects, missing postal fields, PO Box/auto-lock requirements, and consent errors should point to the field or next action.',
    rules: [
      'Use aria-describedby or equivalent linkage for field errors.',
      'Show an error summary for multi-field address registration failures.',
      'Keep machine-readable error codes separate from user-facing text.',
    ],
    successMetric: 'A user can navigate from the error summary to the field or proof step that fixes it.',
  },
  {
    id: 'p1-map-keyboard-alternative',
    priority: 'P1',
    surfaces: ['map-canvas', 'address-registration'],
    capability: 'keyboard',
    title: 'Provide non-pointer alternatives for map selection',
    goal: 'AGID cell selection, hover region preview, and address lookup should not require precise pointer movement.',
    rules: [
      'Offer search, AGID input, coordinate input, and list-based candidate selection.',
      'Only click/confirm changes the active AGID; hover previews use non-committal outline state.',
      'Keyboard users can move through candidate cells or search results with visible focus.',
    ],
    successMetric: 'A keyboard user can select or confirm an AGID without using hover.',
  },
  {
    id: 'p2-high-risk-plain-language',
    priority: 'P2',
    surfaces: ['high-risk-mode', 'portal-consent', 'print-export'],
    capability: 'privacy-narration',
    title: 'Explain high-risk privacy consequences in plain language',
    goal: 'DV, evacuation, refugee, and humanitarian workflows should describe what is hidden, shared, expired, and logged.',
    rules: [
      'High-risk mode states what will not be shown: raw address, raw AGID/AOID, phone, and proof code.',
      'Consent screens describe purpose, retention, expiry, and revocation in short sentences.',
      'Printed and exported reports state that private address material was redacted.',
    ],
    successMetric: 'A non-technical operator can explain what was shared and what stayed hidden.',
  },
];

export const ACCESSIBILITY_RELEASE_GATES = [
  'Keyboard-only primary workflow passes for map, address registration, POS, Portal, and Review Console.',
  'No blocking warning, decision state, or release action is represented by color alone.',
  'Minimum contrast for normal text and critical labels is at least 4.5:1.',
  'POS/app language updates html lang, direction, visible copy, and report labels.',
  'High-risk mode never exposes raw address, raw AGID, raw AOID, phone, recipient name, or proof code.',
];

export const ACCESSIBILITY_IMPLEMENTATION_ORDER = [
  'Global focus-visible, reduced-motion, forced-color, and screen-reader utilities.',
  'POS Terminal: decision banner semantics, action labels, stable buttons, and receipt summary.',
  'Map and address registration: keyboard alternatives for AGID selection and linked field errors.',
  'Portal and Review Console: consent semantics, error summaries, audit report text alternatives.',
  'Automated tests for accessibility contracts and targeted component interaction paths.',
];

function uniqueSurfaces(surfaces: AccessibilitySurface[]) {
  return Array.from(new Set(surfaces));
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function getAccessibilityHardeningPlan(): AccessibilityHardeningPlan {
  return {
    version: ACCESSIBILITY_HARDENING_VERSION,
    principle: 'AGID accessibility is an operational safety feature: every user must be able to understand, verify, and complete address workflows without relying on pointer precision, color alone, hidden warnings, or one language assumption.',
    measures: ACCESSIBILITY_HARDENING_MEASURES.map(measure => ({
      ...measure,
      surfaces: [...measure.surfaces],
      rules: [...measure.rules],
    })),
    releaseGates: [...ACCESSIBILITY_RELEASE_GATES],
    implementationOrder: [...ACCESSIBILITY_IMPLEMENTATION_ORDER],
  };
}

export function evaluateAccessibilityHardening(
  input: EvaluateAccessibilityHardeningInput,
): AccessibilityHardeningEvaluation {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const requiredSurfaces: AccessibilitySurface[] = [input.surface];

  if (!input.keyboardPrimaryPath) blockers.push('keyboard-primary-path-blocked');
  if (!input.focusVisible) blockers.push('focus-indicator-missing');
  if (!input.decisionAnnounced) blockers.push('decision-not-announced');
  if (!input.warningsProgrammatic) blockers.push('warnings-not-programmatic');
  if (input.usesColorOnlyStatus) blockers.push('color-only-status');
  if (input.minimumContrastRatio < 4.5) blockers.push('contrast-below-4.5');
  if (!input.languageAndDirectionSynced) blockers.push('language-direction-not-synced');
  if (input.highRiskMode && !input.rawAddressHiddenInHighRisk) {
    blockers.push('high-risk-raw-address-visible');
    requiredSurfaces.push('high-risk-mode');
  }

  if (!input.focusRestoredAfterModal) warnings.push('focus-not-restored-after-modal');
  if (input.minimumContrastRatio >= 4.5 && input.minimumContrastRatio < 7) {
    warnings.push('contrast-aa-but-not-enhanced');
  }
  if (!input.reducedMotionSupported) warnings.push('reduced-motion-not-supported');
  if (input.minimumTouchTargetPx < 44) warnings.push(`touch-target-too-small:${input.minimumTouchTargetPx}`);
  if (!input.formErrorsLinked) warnings.push('form-errors-not-linked');
  if (!input.mapHasKeyboardAlternative) {
    warnings.push('map-keyboard-alternative-missing');
    requiredSurfaces.push('map-canvas');
  }
  if (input.highRiskMode && !input.privacyRiskAnnounced) {
    warnings.push('high-risk-privacy-not-explained');
    requiredSurfaces.push('high-risk-mode', 'portal-consent');
  }

  const grade: AccessibilityHardeningEvaluation['grade'] = blockers.length > 0
    ? 'blocked'
    : warnings.length > 0
      ? 'attention'
      : 'ready';

  return {
    valid: blockers.length === 0,
    grade,
    score: clampScore(100 - blockers.length * 22 - warnings.length * 6),
    requiredSurfaces: uniqueSurfaces(requiredSurfaces),
    blockers,
    warnings,
  };
}
