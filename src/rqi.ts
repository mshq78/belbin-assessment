import {
  ResponseA,
  ResponseB,
  ResponseC,
  RQIResult,
  RQILevel,
  RoleCode,
} from './types';
import { ROLE_CODES_LIST, RQI_WARNING_NOTE } from './config';

/**
 * Calculates rank vector with average ranks for tied values.
 * Higher score gets rank 1 (descending).
 */
export function calculateAverageRanks(values: number[]): number[] {
  const n = values.length;
  const indexed = values.map((val, idx) => ({ val, idx }));

  // Sort descending by value
  indexed.sort((a, b) => b.val - a.val);

  const ranks = new Array<number>(n);
  let i = 0;

  while (i < n) {
    let j = i;
    // Find all tied items
    while (j < n && indexed[j].val === indexed[i].val) {
      j++;
    }

    // Positions in sorted order are (i + 1) to j
    // Average rank is the average of numbers from (i + 1) to j
    const avgRank = (i + 1 + j) / 2;

    for (let k = i; k < j; k++) {
      ranks[indexed[k].idx] = avgRank;
    }

    i = j;
  }

  return ranks;
}

/**
 * Calculates Spearman Rank Correlation between two score arrays of length 9,
 * using average ranks for ties. Returns 0 if variance is zero.
 */
export function calculateSpearmanCorrelation(xValues: number[], yValues: number[]): number {
  const n = xValues.length;
  if (n <= 1) return 0;

  const rx = calculateAverageRanks(xValues);
  const ry = calculateAverageRanks(yValues);

  const meanX = rx.reduce((a, b) => a + b, 0) / n;
  const meanY = ry.reduce((a, b) => a + b, 0) / n;

  let cov = 0;
  let varX = 0;
  let varY = 0;

  for (let i = 0; i < n; i++) {
    const dx = rx[i] - meanX;
    const dy = ry[i] - meanY;
    cov += dx * dy;
    varX += dx * dx;
    varY += dy * dy;
  }

  if (varX < 1e-9 || varY < 1e-9) {
    return 0;
  }

  const r = cov / (Math.sqrt(varX) * Math.sqrt(varY));
  // Clamp to [-1, 1] to avoid float precision anomalies
  return Math.max(-1, Math.min(1, r));
}

/**
 * Calculates RQI (Response Quality Index) for administrative review.
 */
export function calculateRQI(
  responsesA: ResponseA[],
  responsesB: ResponseB[],
  responsesC: ResponseC[],
  rawA: Record<RoleCode, number>,
  rawB: Record<RoleCode, number>,
  rawC: Record<RoleCode, number>
): RQIResult {
  // 1. Section A speed check: >= 4 items with responseTime < 1500ms
  const fastCountA = responsesA.filter((r) => r.responseTimeMs < 1500).length;
  const fastPercentA = (fastCountA / Math.max(1, responsesA.length)) * 100;
  const speedDeductionA = fastCountA >= 4 ? 15 : 0;

  // 2. Section B speed check: >= 3 scenarios with responseTime < 4000ms
  const fastCountB = responsesB.filter((r) => r.responseTimeMs < 4000).length;
  const fastPercentB = (fastCountB / Math.max(1, responsesB.length)) * 100;
  const speedDeductionB = fastCountB >= 3 ? 15 : 0;

  // 3. Section A side bias check: >= 15 of 18 choices in one display side
  const firstSideCountA = responsesA.filter((r) => r.chosenSide === 'first').length;
  const secondSideCountA = responsesA.filter((r) => r.chosenSide === 'second').length;
  const maxSideCountA = Math.max(firstSideCountA, secondSideCountA);
  const maxSidePercentA = (maxSideCountA / Math.max(1, responsesA.length)) * 100;
  const sideBiasDeductionA = maxSideCountA >= 15 ? 15 : 0;

  // 4. Consistency across sections using Spearman rank correlation of 9 roles
  const vecA = ROLE_CODES_LIST.map((code) => rawA[code] || 0);
  const vecB = ROLE_CODES_LIST.map((code) => rawB[code] || 0);
  const vecC = ROLE_CODES_LIST.map((code) => rawC[code] || 0);

  const spearmanAB = calculateSpearmanCorrelation(vecA, vecB);
  const spearmanAC = calculateSpearmanCorrelation(vecA, vecC);
  const spearmanBC = calculateSpearmanCorrelation(vecB, vecC);

  const avgSpearman = (spearmanAB + spearmanAC + spearmanBC) / 3;

  let spearmanDeduction = 0;
  if (avgSpearman > 0.4) {
    spearmanDeduction = 0;
  } else if (avgSpearman >= 0.2) {
    spearmanDeduction = 5;
  } else if (avgSpearman >= 0.0) {
    spearmanDeduction = 10;
  } else {
    spearmanDeduction = 20;
  }

  const totalDeductions =
    speedDeductionA + speedDeductionB + sideBiasDeductionA + spearmanDeduction;
  const score = Math.max(0, 100 - totalDeductions);

  let level: RQILevel = 'stable';
  let levelLabel = 'پایدار';

  if (score >= 80) {
    level = 'stable';
    levelLabel = 'پایدار';
  } else if (score >= 60) {
    level = 'caution';
    levelLabel = 'قابل استفاده با احتیاط';
  } else {
    level = 'retest';
    levelLabel = 'پیشنهاد اجرای مجدد یا بررسی تکمیلی';
  }

  return {
    score,
    level,
    levelLabel,
    deductions: {
      speedA: speedDeductionA,
      speedB: speedDeductionB,
      sideBiasA: sideBiasDeductionA,
      spearman: spearmanDeduction,
      totalDeductions,
    },
    details: {
      fastCountA,
      fastPercentA,
      fastCountB,
      fastPercentB,
      firstSideCountA,
      secondSideCountA,
      maxSidePercentA,
      spearmanAB,
      spearmanAC,
      spearmanBC,
      avgSpearman,
    },
    warningNote: RQI_WARNING_NOTE,
  };
}
