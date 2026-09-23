export const AMT_PID_HASH_BITS = 128;
export const DEFAULT_PID_MAX_ISSUED = 1_000_000_000_000;
export const DEFAULT_PID_MAX_COLLISION_RISK = 1e-12;

export type PidCollisionBudget = {
  hashBits?: number;
  maxIssued?: number;
  maxCollisionRisk?: number;
};

export type PidCollisionRiskReport = {
  hashBits: number;
  maxIssued: number;
  maxCollisionRisk: number;
  birthdayUpperBound: number;
  requiredBits: number;
  safetyMarginBits: number;
  pass: boolean;
  interpretation: string;
};

function assertPositiveInteger(value: number, name: string) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive safe integer.`);
  }
}

function assertProbability(value: number, name: string) {
  if (!Number.isFinite(value) || value <= 0 || value >= 1) {
    throw new Error(`${name} must be a probability between 0 and 1.`);
  }
}

export function birthdayCollisionUpperBound(maxIssued: number, hashBits = AMT_PID_HASH_BITS) {
  assertPositiveInteger(maxIssued, 'maxIssued');
  assertPositiveInteger(hashBits, 'hashBits');
  if (maxIssued < 2) return 0;

  const logBound = Math.log(maxIssued)
    + Math.log(maxIssued - 1)
    - Math.log(2)
    - hashBits * Math.log(2);

  if (logBound <= -745) return 0;
  return Math.min(1, Math.exp(logBound));
}

export function requiredBitsForCollisionRisk(maxIssued: number, maxCollisionRisk: number) {
  assertPositiveInteger(maxIssued, 'maxIssued');
  assertProbability(maxCollisionRisk, 'maxCollisionRisk');
  if (maxIssued < 2) return 1;

  const required = (
    Math.log(maxIssued)
    + Math.log(maxIssued - 1)
    - Math.log(2)
    - Math.log(maxCollisionRisk)
  ) / Math.log(2);

  return Math.max(1, Math.ceil(required));
}

export function verifyPidCollisionBudget(budget: PidCollisionBudget = {}): PidCollisionRiskReport {
  const hashBits = budget.hashBits ?? AMT_PID_HASH_BITS;
  const maxIssued = budget.maxIssued ?? DEFAULT_PID_MAX_ISSUED;
  const maxCollisionRisk = budget.maxCollisionRisk ?? DEFAULT_PID_MAX_COLLISION_RISK;

  assertPositiveInteger(hashBits, 'hashBits');
  assertPositiveInteger(maxIssued, 'maxIssued');
  assertProbability(maxCollisionRisk, 'maxCollisionRisk');

  const birthdayUpperBound = birthdayCollisionUpperBound(maxIssued, hashBits);
  const requiredBits = requiredBitsForCollisionRisk(maxIssued, maxCollisionRisk);
  const safetyMarginBits = hashBits - requiredBits;
  const pass = birthdayUpperBound <= maxCollisionRisk;

  return {
    hashBits,
    maxIssued,
    maxCollisionRisk,
    birthdayUpperBound,
    requiredBits,
    safetyMarginBits,
    pass,
    interpretation: pass
      ? 'The bounded hash PID collision budget is within the configured birthday-bound risk limit.'
      : 'The bounded hash PID collision budget exceeds the configured birthday-bound risk limit.',
  };
}
