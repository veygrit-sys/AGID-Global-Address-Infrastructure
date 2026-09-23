export const OPS_SCENARIOS = ['normal', 'blocked', 'offline'] as const;

export type OpsScenario = typeof OPS_SCENARIOS[number];

export function scenarioTime(scenario: OpsScenario, nonce: number) {
  const baseMinute = scenario === 'normal' ? 5 : scenario === 'blocked' ? 15 : 25;
  return new Date(Date.UTC(2026, 5, 20, 10, baseMinute + nonce, 0)).toISOString();
}
