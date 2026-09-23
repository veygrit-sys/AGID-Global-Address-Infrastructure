import {
  type TradeComplianceSourceId,
  getRecommendedInitialTradeComplianceSources,
} from './tradeComplianceDataPlan';

export const DELIVERY_POS_SIMULATION_VERSION = 'delivery-pos-simulation-v1';

export type DeliveryPosScenarioKind = 'domestic' | 'cross-border';

export type DeliveryPosRole =
  | 'sender'
  | 'receptionist'
  | 'delivery-operator'
  | 'recipient'
  | 'manager'
  | 'cross-border-reviewer';

export type DeliveryPosGoal = {
  role: DeliveryPosRole;
  goal: string;
  riskToControl: string;
};

export type DeliveryPosScreenId =
  | 'role-login'
  | 'scan-intake'
  | 'decrypt-trust'
  | 'address-resolution'
  | 'domestic-decision'
  | 'cross-border-declaration'
  | 'cross-border-risk-review'
  | 'device-diagnostics'
  | 'handoff'
  | 'reverification-report'
  | 'exception-audit'
  | 'offline-sync-queue'
  | 'manager-settings';

export type DeliveryPosButtonId =
  | 'select-role'
  | 'scan-qr'
  | 'scan-nfc'
  | 'manual-entry'
  | 'decrypt-agid-s'
  | 'check-registry'
  | 'switch-address-language'
  | 'request-manual-address-review'
  | 'accept-domestic-shipment'
  | 'hold-for-review'
  | 'reject-shipment'
  | 'enter-hs-code'
  | 'estimate-duty'
  | 'check-customs-evidence'
  | 'mark-customs-review'
  | 'print-redacted-label'
  | 'create-handoff'
  | 'complete-delivery'
  | 'rescan-for-reverification'
  | 'run-printer-test'
  | 'run-cash-drawer-test'
  | 'pair-barcode-reader'
  | 'sync-deferred-events'
  | 'export-audit-report'
  | 'manager-override';

export type DeliveryPosDecision =
  | 'accepted'
  | 'review'
  | 'rejected'
  | 'completed';

export type DeliveryPosStep = {
  actor: DeliveryPosRole;
  from: DeliveryPosScreenId;
  action: DeliveryPosButtonId;
  to: DeliveryPosScreenId;
  expectedDecision?: DeliveryPosDecision;
  note: string;
};

export type DeliveryPosSimulationCase = {
  id: string;
  kind: DeliveryPosScenarioKind;
  title: string;
  goals: DeliveryPosGoal[];
  assumptions: string[];
  steps: DeliveryPosStep[];
  requiredScreens: DeliveryPosScreenId[];
  requiredButtons: DeliveryPosButtonId[];
  openSourceData: TradeComplianceSourceId[];
  expectedDecision: DeliveryPosDecision;
  surfacedGaps: string[];
};

export type DeliveryPosSimulationResult = {
  caseId: string;
  kind: DeliveryPosScenarioKind;
  visitedScreens: DeliveryPosScreenId[];
  usedButtons: DeliveryPosButtonId[];
  missingScreens: DeliveryPosScreenId[];
  missingButtons: DeliveryPosButtonId[];
  finalDecision: DeliveryPosDecision;
  warnings: string[];
};

export type DeliveryPosRequirementMap = {
  version: typeof DELIVERY_POS_SIMULATION_VERSION;
  scenarios: number;
  screens: Array<{
    id: DeliveryPosScreenId;
    usedBy: DeliveryPosRole[];
    scenarioKinds: DeliveryPosScenarioKind[];
  }>;
  buttons: Array<{
    id: DeliveryPosButtonId;
    usedBy: DeliveryPosRole[];
    scenarioKinds: DeliveryPosScenarioKind[];
  }>;
  transitions: DeliveryPosStep[];
  gaps: string[];
  openSourceData: TradeComplianceSourceId[];
};

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function goals(...items: DeliveryPosGoal[]): DeliveryPosGoal[] {
  return items;
}

function requiredScreensFromSteps(steps: DeliveryPosStep[]): DeliveryPosScreenId[] {
  return unique(steps.flatMap(step => [step.from, step.to]));
}

function requiredButtonsFromSteps(steps: DeliveryPosStep[]): DeliveryPosButtonId[] {
  return unique(steps.map(step => step.action));
}

const domesticHappyPathSteps: DeliveryPosStep[] = [
  {
    actor: 'receptionist',
    from: 'role-login',
    action: 'select-role',
    to: 'scan-intake',
    note: 'Counter staff starts in a constrained cashier or pickup role before any scan action.',
  },
  {
    actor: 'sender',
    from: 'scan-intake',
    action: 'scan-qr',
    to: 'decrypt-trust',
    note: 'Sender presents an AGID, AOID QR, or AGID-S QR at the counter.',
  },
  {
    actor: 'receptionist',
    from: 'decrypt-trust',
    action: 'decrypt-agid-s',
    to: 'address-resolution',
    note: 'If encrypted, AGID-S is opened only with a terminal key and no raw private address is stored in the receipt.',
  },
  {
    actor: 'receptionist',
    from: 'address-resolution',
    action: 'switch-address-language',
    to: 'domestic-decision',
    note: 'Operator confirms the address view in the local language or international-shipping language.',
  },
  {
    actor: 'receptionist',
    from: 'domestic-decision',
    action: 'accept-domestic-shipment',
    to: 'handoff',
    expectedDecision: 'accepted',
    note: 'Domestic shipment is accepted when address quality, registry freshness, and redaction posture pass.',
  },
  {
    actor: 'receptionist',
    from: 'handoff',
    action: 'print-redacted-label',
    to: 'handoff',
    note: 'Printed output uses redacted receipt metadata and avoids raw AOID/private address leakage.',
  },
  {
    actor: 'delivery-operator',
    from: 'handoff',
    action: 'create-handoff',
    to: 'reverification-report',
    note: 'Delivery operator takes custody and creates a handoff record tied to the POS receipt.',
  },
  {
    actor: 'delivery-operator',
    from: 'reverification-report',
    action: 'complete-delivery',
    to: 'reverification-report',
    expectedDecision: 'completed',
    note: 'After delivery, the terminal rescans or reconciles the receipt to produce a completion report.',
  },
];

const domesticExceptionSteps: DeliveryPosStep[] = [
  {
    actor: 'receptionist',
    from: 'role-login',
    action: 'select-role',
    to: 'scan-intake',
    note: 'Receptionist begins a normal intake flow.',
  },
  {
    actor: 'recipient',
    from: 'scan-intake',
    action: 'scan-nfc',
    to: 'decrypt-trust',
    note: 'Recipient or pickup customer presents NFC instead of QR.',
  },
  {
    actor: 'receptionist',
    from: 'decrypt-trust',
    action: 'check-registry',
    to: 'domestic-decision',
    note: 'Registry reports stale, revoked, used, or low-freshness status.',
  },
  {
    actor: 'receptionist',
    from: 'domestic-decision',
    action: 'hold-for-review',
    to: 'exception-audit',
    expectedDecision: 'review',
    note: 'Shipment is held rather than released when trust state is incomplete.',
  },
  {
    actor: 'manager',
    from: 'exception-audit',
    action: 'manager-override',
    to: 'device-diagnostics',
    note: 'Manager can review the reason, device state, and operator notes before supervised action.',
  },
  {
    actor: 'manager',
    from: 'device-diagnostics',
    action: 'run-printer-test',
    to: 'device-diagnostics',
    note: 'Printer diagnostic verifies that redacted labels can be printed safely.',
  },
  {
    actor: 'manager',
    from: 'device-diagnostics',
    action: 'pair-barcode-reader',
    to: 'offline-sync-queue',
    note: 'Barcode reader is paired or fallback manual entry is documented before deferred sync.',
  },
];

const crossBorderHappyPathSteps: DeliveryPosStep[] = [
  {
    actor: 'sender',
    from: 'role-login',
    action: 'select-role',
    to: 'scan-intake',
    note: 'Sender starts a cross-border shipment request with a staff-assisted terminal.',
  },
  {
    actor: 'receptionist',
    from: 'scan-intake',
    action: 'manual-entry',
    to: 'cross-border-declaration',
    note: 'Operator can enter or scan destination, sender, item category, value, and country corridor.',
  },
  {
    actor: 'sender',
    from: 'cross-border-declaration',
    action: 'enter-hs-code',
    to: 'cross-border-risk-review',
    note: 'HS code is captured as assistive classification, not as a final customs ruling.',
  },
  {
    actor: 'cross-border-reviewer',
    from: 'cross-border-risk-review',
    action: 'check-customs-evidence',
    to: 'cross-border-risk-review',
    note: 'Reviewer checks static HS data, tariff evidence snapshots, and currency estimate freshness.',
  },
  {
    actor: 'cross-border-reviewer',
    from: 'cross-border-risk-review',
    action: 'estimate-duty',
    to: 'domestic-decision',
    note: 'Estimated duties are advisory and must not block solely on unavailable live APIs.',
  },
  {
    actor: 'receptionist',
    from: 'domestic-decision',
    action: 'accept-domestic-shipment',
    to: 'handoff',
    expectedDecision: 'accepted',
    note: 'Shipment can be accepted after address, declaration, and risk-review checks are complete.',
  },
  {
    actor: 'delivery-operator',
    from: 'handoff',
    action: 'create-handoff',
    to: 'reverification-report',
    note: 'Carrier handoff includes customs evidence id, not raw private address material.',
  },
  {
    actor: 'delivery-operator',
    from: 'reverification-report',
    action: 'rescan-for-reverification',
    to: 'reverification-report',
    expectedDecision: 'completed',
    note: 'Final reconciliation verifies that the same receipt and declaration stayed consistent.',
  },
];

const crossBorderExceptionSteps: DeliveryPosStep[] = [
  {
    actor: 'receptionist',
    from: 'role-login',
    action: 'select-role',
    to: 'scan-intake',
    note: 'Operator opens a cross-border shipment intake.',
  },
  {
    actor: 'sender',
    from: 'scan-intake',
    action: 'scan-qr',
    to: 'address-resolution',
    note: 'Destination address or AGID is scanned successfully, but trade fields are incomplete.',
  },
  {
    actor: 'receptionist',
    from: 'address-resolution',
    action: 'request-manual-address-review',
    to: 'cross-border-declaration',
    note: 'Low-confidence or remote destination address requires review before customs fields.',
  },
  {
    actor: 'cross-border-reviewer',
    from: 'cross-border-declaration',
    action: 'mark-customs-review',
    to: 'cross-border-risk-review',
    expectedDecision: 'review',
    note: 'Missing HS code, stale FX rate, restricted item hint, or unsupported corridor stays in review.',
  },
  {
    actor: 'manager',
    from: 'cross-border-risk-review',
    action: 'hold-for-review',
    to: 'exception-audit',
    note: 'Manager receives a review case instead of allowing silent shipment release.',
  },
  {
    actor: 'manager',
    from: 'exception-audit',
    action: 'export-audit-report',
    to: 'manager-settings',
    note: 'Audit export preserves decision evidence without raw AGID-S ciphertext or private AOID material.',
  },
];

export function buildDeliveryPosSimulationCases(): DeliveryPosSimulationCase[] {
  const initialTradeSources = getRecommendedInitialTradeComplianceSources().map(source => source.id);
  const domesticRequiredScreens = requiredScreensFromSteps(domesticHappyPathSteps);
  const domesticExceptionScreens = requiredScreensFromSteps(domesticExceptionSteps);
  const crossBorderScreens = requiredScreensFromSteps(crossBorderHappyPathSteps);
  const crossBorderExceptionScreens = requiredScreensFromSteps(crossBorderExceptionSteps);

  return [
    {
      id: 'domestic-standard-handoff',
      kind: 'domestic',
      title: 'Domestic scan-to-handoff flow',
      goals: goals(
        {
          role: 'sender',
          goal: 'Present a QR/NFC/AGID-S package without exposing unnecessary private address details.',
          riskToControl: 'Sender accidentally hands over raw AOID or full address when a redacted flow would be enough.',
        },
        {
          role: 'receptionist',
          goal: 'Reach an accept/review/reject decision within one scan loop.',
          riskToControl: 'Staff releases a shipment without seeing trust, address-quality, or freshness state.',
        },
        {
          role: 'delivery-operator',
          goal: 'Take custody and later prove that the handoff matched the original POS decision.',
          riskToControl: 'The final delivery report cannot be tied back to the intake decision.',
        },
      ),
      assumptions: [
        'AGID-S can be decrypted locally by an authorized terminal key.',
        'Registry freshness is available or cached inside the allowed window.',
        'Domestic address display exposes at least one valid local or international language tab.',
      ],
      steps: domesticHappyPathSteps,
      requiredScreens: domesticRequiredScreens,
      requiredButtons: requiredButtonsFromSteps(domesticHappyPathSteps),
      openSourceData: [],
      expectedDecision: 'completed',
      surfacedGaps: [
        'The decision banner must show one dominant accept/review/reject state before the print button is reachable.',
        'Redacted label printing should be impossible before a receipt exists.',
      ],
    },
    {
      id: 'domestic-review-device-registry',
      kind: 'domestic',
      title: 'Domestic review flow with registry or device trouble',
      goals: goals(
        {
          role: 'recipient',
          goal: 'Use NFC or QR pickup without exposing raw private address material.',
          riskToControl: 'The recipient is forced to reveal personal address data at the counter.',
        },
        {
          role: 'manager',
          goal: 'Resolve stale registry, used-token, printer, drawer, barcode-reader, or measuring-instrument exceptions.',
          riskToControl: 'Staff overrides a rejection without an auditable reason and terminal diagnostic evidence.',
        },
      ),
      assumptions: [
        'The terminal may be online, offline, or in deferred-sync mode.',
        'Review cases are kept separate from ordinary accepted handoffs.',
      ],
      steps: domesticExceptionSteps,
      requiredScreens: domesticExceptionScreens,
      requiredButtons: requiredButtonsFromSteps(domesticExceptionSteps),
      openSourceData: [],
      expectedDecision: 'review',
      surfacedGaps: [
        'Exception audit needs filters for rejected, review, stale-registry, used-token, and device-failure cases.',
        'Device diagnostics should include printer, cash drawer, barcode reader, and measuring instrument even when payment is not used.',
      ],
    },
    {
      id: 'cross-border-standard-handoff',
      kind: 'cross-border',
      title: 'Cross-border accepted handoff with advisory customs evidence',
      goals: goals(
        {
          role: 'sender',
          goal: 'Create an international shipment with address and item metadata accepted by staff.',
          riskToControl: 'Sender believes tariff estimates are final customs rulings.',
        },
        {
          role: 'cross-border-reviewer',
          goal: 'Confirm HS, tariff, trade, and currency evidence without sending private AOID data to third-party APIs.',
          riskToControl: 'A live customs or currency API outage blocks the entire POS when cached evidence is sufficient.',
        },
        {
          role: 'delivery-operator',
          goal: 'Carry a package whose declaration evidence can be reconciled after handoff.',
          riskToControl: 'Cross-border evidence and delivery receipt drift apart after acceptance.',
        },
      ),
      assumptions: [
        'HS-code lookup is assistive and cached, not as a final customs ruling.',
        'Tariff and FX evidence are advisory with source date and provider metadata.',
        'No raw address, AOID, AGID-S ciphertext, or private delivery history is sent to external trade APIs.',
      ],
      steps: crossBorderHappyPathSteps,
      requiredScreens: crossBorderScreens,
      requiredButtons: requiredButtonsFromSteps(crossBorderHappyPathSteps),
      openSourceData: initialTradeSources,
      expectedDecision: 'completed',
      surfacedGaps: [
        'Cross-border declaration needs a visible distinction between required shipment fields and advisory trade evidence.',
        'The UI must avoid wording that sounds like final legal customs clearance.',
      ],
    },
    {
      id: 'cross-border-customs-review',
      kind: 'cross-border',
      title: 'Cross-border review when address or declaration is incomplete',
      goals: goals(
        {
          role: 'receptionist',
          goal: 'Avoid accepting an international shipment with missing HS, unsupported corridor, or low address quality.',
          riskToControl: 'Operator treats a partial address resolution as enough for customs or carrier handoff.',
        },
        {
          role: 'manager',
          goal: 'Export a concise audit case for review without private address disclosure.',
          riskToControl: 'Private identifiers leak into audit exports or carrier notes.',
        },
      ),
      assumptions: [
        'Some countries and remote regions require manual address or customs review.',
        'Unsupported corridors should be review states, not silent acceptance or destructive rejection.',
      ],
      steps: crossBorderExceptionSteps,
      requiredScreens: crossBorderExceptionScreens,
      requiredButtons: requiredButtonsFromSteps(crossBorderExceptionSteps),
      openSourceData: initialTradeSources,
      expectedDecision: 'review',
      surfacedGaps: [
        'Cross-border review needs reason chips: missing HS code, stale FX/tariff evidence, unsupported destination, low address confidence, and restricted item hint.',
        'Audit export should redact address, AOID, AGID-S ciphertext, phone, and recipient name by default.',
      ],
    },
  ];
}

export function simulateDeliveryPosCase(
  scenario: DeliveryPosSimulationCase,
): DeliveryPosSimulationResult {
  const visitedScreens = unique(scenario.steps.flatMap(step => [step.from, step.to]));
  const usedButtons = unique(scenario.steps.map(step => step.action));
  const missingScreens = scenario.requiredScreens.filter(screen => !visitedScreens.includes(screen));
  const missingButtons = scenario.requiredButtons.filter(button => !usedButtons.includes(button));
  const expectedSteps = scenario.steps.filter(step => step.expectedDecision);
  const finalDecision = expectedSteps.at(-1)?.expectedDecision ?? scenario.expectedDecision;
  const warnings: string[] = [];

  if (scenario.kind === 'cross-border' && !visitedScreens.includes('cross-border-declaration')) {
    warnings.push('cross-border-flow-missing-declaration-screen');
  }
  if (!usedButtons.includes('check-registry') && scenario.id.includes('review')) {
    warnings.push('review-flow-should-check-registry-or-record-why-unavailable');
  }
  if (usedButtons.includes('print-redacted-label') && !visitedScreens.includes('handoff')) {
    warnings.push('label-printing-before-handoff');
  }

  return {
    caseId: scenario.id,
    kind: scenario.kind,
    visitedScreens,
    usedButtons,
    missingScreens,
    missingButtons,
    finalDecision,
    warnings,
  };
}

export function deriveDeliveryPosRequirementMap(
  scenarios = buildDeliveryPosSimulationCases(),
): DeliveryPosRequirementMap {
  const transitions = scenarios.flatMap(scenario => scenario.steps);
  const allScreens = unique(scenarios.flatMap(scenario => scenario.requiredScreens));
  const allButtons = unique(scenarios.flatMap(scenario => scenario.requiredButtons));
  const gaps = unique(scenarios.flatMap(scenario => scenario.surfacedGaps));
  const openSourceData = unique(scenarios.flatMap(scenario => scenario.openSourceData));

  return {
    version: DELIVERY_POS_SIMULATION_VERSION,
    scenarios: scenarios.length,
    screens: allScreens.map((id) => {
      const relevant = scenarios.filter(scenario => scenario.requiredScreens.includes(id));
      return {
        id,
        usedBy: unique(relevant.flatMap(scenario => scenario.steps
          .filter(step => step.from === id || step.to === id)
          .map(step => step.actor))),
        scenarioKinds: unique(relevant.map(scenario => scenario.kind)),
      };
    }),
    buttons: allButtons.map((id) => {
      const relevant = scenarios.filter(scenario => scenario.requiredButtons.includes(id));
      return {
        id,
        usedBy: unique(relevant.flatMap(scenario => scenario.steps
          .filter(step => step.action === id)
          .map(step => step.actor))),
        scenarioKinds: unique(relevant.map(scenario => scenario.kind)),
      };
    }),
    transitions,
    gaps,
    openSourceData,
  };
}

export function summarizeDeliveryPosSimulation(
  scenarios = buildDeliveryPosSimulationCases(),
) {
  const results = scenarios.map(simulateDeliveryPosCase);
  return {
    version: DELIVERY_POS_SIMULATION_VERSION,
    scenarioCount: scenarios.length,
    domesticCount: scenarios.filter(scenario => scenario.kind === 'domestic').length,
    crossBorderCount: scenarios.filter(scenario => scenario.kind === 'cross-border').length,
    completedCount: results.filter(result => result.finalDecision === 'completed').length,
    reviewCount: results.filter(result => result.finalDecision === 'review').length,
    missingScreenCount: results.reduce((sum, result) => sum + result.missingScreens.length, 0),
    missingButtonCount: results.reduce((sum, result) => sum + result.missingButtons.length, 0),
    warningCount: results.reduce((sum, result) => sum + result.warnings.length, 0),
  };
}
