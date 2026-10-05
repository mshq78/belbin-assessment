import {
  RoleCode,
  ResponseA,
  ResponseB,
  ResponseC,
  ScoringSummary,
  ScoredRole,
  RoleCategory,
} from './types';
import {
  ROLE_CODES_LIST,
  ROLES_METADATA,
  WEIGHTS,
  CATEGORY_LABELS,
} from './config';

/**
 * Pure scoring calculation engine according to specification section 6.
 */
export function calculateScores(
  responsesA: ResponseA[],
  responsesB: ResponseB[],
  responsesC: ResponseC[]
): ScoringSummary {
  // Initialize raw score tallies
  const rawA: Record<RoleCode, number> = {} as any;
  const rawB: Record<RoleCode, number> = {} as any;
  const rawC: Record<RoleCode, number> = {} as any;

  for (const code of ROLE_CODES_LIST) {
    rawA[code] = 0;
    rawB[code] = 0;
    rawC[code] = 0;
  }

  // Sum raw scores from A
  for (const resp of responsesA) {
    for (const [code, score] of Object.entries(resp.allocatedScores)) {
      if (score && code in rawA) {
        rawA[code as RoleCode] += score;
      }
    }
  }

  // Sum raw scores from B
  for (const resp of responsesB) {
    for (const [code, score] of Object.entries(resp.allocatedScores)) {
      if (score && code in rawB) {
        rawB[code as RoleCode] += score;
      }
    }
  }

  // Sum raw scores from C
  for (const resp of responsesC) {
    for (const [code, score] of Object.entries(resp.allocatedScores)) {
      if (score && code in rawC) {
        rawC[code as RoleCode] += score;
      }
    }
  }

  // Calculate normalized and final scores with full float precision
  const rolesData: Array<{
    code: RoleCode;
    rawA: number;
    rawB: number;
    rawC: number;
    fc: number;
    sjt: number;
    game: number;
    finalScore: number;
    displayScore: number;
  }> = [];

  for (const code of ROLE_CODES_LIST) {
    const a = rawA[code];
    const b = rawB[code];
    const c = rawC[code];

    const fc = (a / 12) * 100;
    const sjt = (b / 12) * 100;
    const game = (c / 9) * 100;

    const finalScore = fc * WEIGHTS.A + sjt * WEIGHTS.B + game * WEIGHTS.C;
    const displayScore = Math.round(finalScore * 10) / 10;

    rolesData.push({
      code,
      rawA: a,
      rawB: b,
      rawC: c,
      fc,
      sjt,
      game,
      finalScore,
      displayScore,
    });
  }

  // Sorting and Tie-breaking
  // 1. Descending by finalScore
  // 2. If equal in display precision (1 decimal): compare SJT (B), then FC (A), then GAME (C)
  // 3. If all 3 equal: equal rank
  rolesData.sort((r1, r2) => {
    if (r1.displayScore !== r2.displayScore) {
      return r2.displayScore - r1.displayScore;
    }
    // Tie-break 1: SJT (Section B)
    if (Math.abs(r1.sjt - r2.sjt) > 0.0001) {
      return r2.sjt - r1.sjt;
    }
    // Tie-break 2: FC (Section A)
    if (Math.abs(r1.fc - r2.fc) > 0.0001) {
      return r2.fc - r1.fc;
    }
    // Tie-break 3: GAME (Section C)
    if (Math.abs(r1.game - r2.game) > 0.0001) {
      return r2.game - r1.game;
    }
    // Complete tie
    return 0;
  });

  // Assign ranks (handling true ties)
  const scoredRoles: ScoredRole[] = [];
  let currentRank = 1;

  for (let i = 0; i < rolesData.length; i++) {
    const item = rolesData[i];

    if (i > 0) {
      const prev = rolesData[i - 1];
      const isCompleteTie =
        prev.displayScore === item.displayScore &&
        Math.abs(prev.sjt - item.sjt) < 0.0001 &&
        Math.abs(prev.fc - item.fc) < 0.0001 &&
        Math.abs(prev.game - item.game) < 0.0001;

      if (!isCompleteTie) {
        currentRank = i + 1;
      }
    }

    let category: RoleCategory = 'leastPreferred';
    if (currentRank <= 3) {
      category = 'preferred';
    } else if (currentRank <= 6) {
      category = 'manageable';
    } else {
      category = 'leastPreferred';
    }

    scoredRoles.push({
      code: item.code,
      persianTitle: ROLES_METADATA[item.code].persianTitle,
      englishTitle: ROLES_METADATA[item.code].englishTitle,
      rawA: item.rawA,
      rawB: item.rawB,
      rawC: item.rawC,
      fc: item.fc,
      sjt: item.sjt,
      game: item.game,
      finalScore: item.finalScore,
      displayScore: item.displayScore,
      rank: currentRank,
      category,
      categoryTitle: CATEGORY_LABELS[category],
    });
  }

  // Close gap rule:
  // If difference in finalScore between two adjacent ranked roles is <= 3,
  // flag closeGapWithNext and closeGapExplanation.
  for (let i = 0; i < scoredRoles.length - 1; i++) {
    const current = scoredRoles[i];
    const next = scoredRoles[i + 1];
    const diff = Math.abs(current.finalScore - next.finalScore);

    if (diff <= 3) {
      current.closeGapWithNext = true;
      current.closeGapExplanation =
        'فاصله امتیاز با نقش بعدی اندک (≤ ۳ امتیاز) است؛ ترتیب این دو نقش نباید بیش از حد تفسیر شود.';
    }
  }

  const rawTotals: Record<RoleCode, { rawA: number; rawB: number; rawC: number }> = {} as any;
  const normalizedTotals: Record<RoleCode, { fc: number; sjt: number; game: number }> = {} as any;
  const finalTotals: Record<RoleCode, number> = {} as any;

  for (const role of scoredRoles) {
    rawTotals[role.code] = {
      rawA: role.rawA,
      rawB: role.rawB,
      rawC: role.rawC,
    };
    normalizedTotals[role.code] = {
      fc: role.fc,
      sjt: role.sjt,
      game: role.game,
    };
    finalTotals[role.code] = role.finalScore;
  }

  const top3 = scoredRoles.slice(0, 3);

  return {
    roles: scoredRoles,
    top3,
    rawTotals,
    normalizedTotals,
    finalTotals,
  };
}
