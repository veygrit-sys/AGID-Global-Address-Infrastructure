import type { AddressTabQualityScore } from './addressTabQuality';
import type { AddressValidationResult } from './addressValidation';

export type AddressQualityDecisionState =
  | 'address-ok'
  | 'needs-review'
  | 'rejected'
  | 'restricted';

export type AddressDisplayQualitySignal = {
  score?: number;
  isWeak?: boolean;
};

export type AddressQualityDecisionInput = {
  tabQuality?: Pick<AddressTabQualityScore, 'decision' | 'score' | 'tier' | 'needsReverification' | 'reasons'> | null;
  validation?: Pick<AddressValidationResult, 'status' | 'score' | 'postalCodeValid' | 'missingRequiredFields' | 'warnings' | 'quality'> | null;
  displayQuality?: AddressDisplayQualitySignal | null;
  restricted?: boolean;
};

export type AddressQualityDecision = {
  state: AddressQualityDecisionState;
  label: 'OK' | 'Needs Review' | 'Rejected' | 'Restricted';
  shortLabel: 'OK' | 'Review' | 'Reject' | 'Restricted';
  description: string;
  action: string;
  severity: 0 | 1 | 2 | 3;
  reasonCodes: string[];
};

export type AddressQualityPublicCopy = {
  label: string;
  shortLabel: string;
  description: string;
  action: string;
};

function addReason(reasons: string[], code: string) {
  if (!reasons.includes(code)) reasons.push(code);
}

export function decideAddressQuality(input: AddressQualityDecisionInput = {}): AddressQualityDecision {
  const reasons: string[] = [];
  const missingRequired = input.validation?.missingRequiredFields || [];
  const warnings = input.validation?.warnings || [];
  const tabDecision = input.tabQuality?.decision;
  const tabScore = typeof input.tabQuality?.score === 'number' ? input.tabQuality.score : undefined;
  const validationScore = typeof input.validation?.score === 'number' ? input.validation.score : undefined;
  const displayScore = typeof input.displayQuality?.score === 'number' ? input.displayQuality.score : undefined;

  if (input.restricted) addReason(reasons, 'restricted-policy');
  if (tabDecision === 'hide') addReason(reasons, 'address-tab-hidden');
  if (input.displayQuality?.isWeak && (tabScore === undefined || tabScore < 45)) addReason(reasons, 'weak-display');

  if (reasons.length > 0) {
    return {
      state: 'restricted',
      label: 'Restricted',
      shortLabel: 'Restricted',
      description: 'Do not use this address display for automatic registration or delivery.',
      action: 'Use AGID-S, ask for correction, or keep this result out of normal display.',
      severity: 3,
      reasonCodes: reasons,
    };
  }

  if (input.validation?.postalCodeValid === false) addReason(reasons, 'postal-code-invalid');
  if (missingRequired.length > 0) addReason(reasons, 'missing-required-fields');

  if (reasons.length > 0) {
    return {
      state: 'rejected',
      label: 'Rejected',
      shortLabel: 'Reject',
      description: 'This address cannot be accepted for automatic registration, label creation, or handoff yet.',
      action: 'Reject automatic use and request correction or operator review before retrying.',
      severity: 3,
      reasonCodes: reasons,
    };
  }

  if (tabDecision === 'reverify') addReason(reasons, 'tab-reverification-required');
  if (input.tabQuality?.needsReverification) addReason(reasons, 'quality-reverification-required');
  if (input.validation?.quality.mode === 'manual-required') addReason(reasons, 'manual-required-country-coverage');
  if (input.displayQuality?.isWeak) addReason(reasons, 'weak-display');

  if (reasons.length > 0) {
    return {
      state: 'needs-review',
      label: 'Needs Review',
      shortLabel: 'Review',
      description: 'A person should confirm the address before registration, label creation, or handoff.',
      action: 'Request missing fields, postal confirmation, or recipient correction.',
      severity: 2,
      reasonCodes: reasons,
    };
  }

  if (tabDecision === 'warn') addReason(reasons, 'tab-confidence-limited');
  if (input.validation?.status === 'partial') addReason(reasons, 'validation-partial');
  if ((tabScore ?? 100) < 70) addReason(reasons, 'tab-score-caution');
  if ((validationScore ?? 1) < 0.75) addReason(reasons, 'validation-score-caution');
  if ((displayScore ?? 1) < 0.72) addReason(reasons, 'display-score-caution');
  if (warnings.length > 0) addReason(reasons, 'validation-warning');

  if (reasons.length > 0) {
    return {
      state: 'needs-review',
      label: 'Needs Review',
      shortLabel: 'Review',
      description: 'The address is usable as a visible clue, but should not be treated as fully verified.',
      action: 'Allow display for context, but require confirmation before delivery, registration, or high-risk use.',
      severity: 2,
      reasonCodes: reasons,
    };
  }

  return {
    state: 'address-ok',
    label: 'OK',
    shortLabel: 'OK',
    description: 'The visible address has enough language, format, source, and display evidence.',
    action: 'Safe to use for normal address display and low-risk handoff.',
    severity: 0,
    reasonCodes: ['stable-display-evidence'],
  };
}

export function getAddressQualityPublicCopy(
  decision: Pick<AddressQualityDecision, 'state' | 'description' | 'action'>,
  language = 'en',
): AddressQualityPublicCopy {
  const ja = language.toLowerCase().startsWith('ja');
  if (decision.state === 'address-ok') {
    return {
      label: ja ? 'OK' : 'OK',
      shortLabel: 'OK',
      description: ja ? '通常表示・低リスク配送に利用できます。' : decision.description,
      action: ja ? '通常の住所表示と低リスクhandoffで利用できます。' : decision.action,
    };
  }
  if (decision.state === 'needs-review') {
    return {
      label: ja ? '要確認' : 'Needs Review',
      shortLabel: ja ? '確認' : 'Review',
      description: ja ? '登録・送り状・引き渡し前に人の確認が必要です。' : decision.description,
      action: ja ? '不足項目、郵便証拠、受取人修正を確認してください。' : decision.action,
    };
  }
  if (decision.state === 'rejected') {
    return {
      label: ja ? '拒否' : 'Rejected',
      shortLabel: ja ? '拒否' : 'Reject',
      description: ja ? 'このままでは自動登録・送り状作成・引き渡しに使えません。' : decision.description,
      action: ja ? '修正または運用者確認後に再試行してください。' : decision.action,
    };
  }
  return {
    label: ja ? '制限' : 'Restricted',
    shortLabel: ja ? '制限' : 'Restricted',
    description: ja ? '通常表示や自動利用から外すべき住所表示です。' : decision.description,
    action: ja ? 'AGID-S、粗い表示、または手動確認に切り替えてください。' : decision.action,
  };
}
