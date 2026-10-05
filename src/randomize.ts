import { RoleCode, ItemA, ScenarioB, MiniGameC } from './types';

/**
 * Pure Fisher-Yates shuffle
 */
export function shuffleArray<T>(array: readonly T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Pre-generate randomized orders for all sections for a session
 */
export function generateRandomOrdersForSession(
  itemsA: ItemA[],
  scenariosB: ScenarioB[],
  gamesC: MiniGameC[]
) {
  // A: for each item, decide if card1 is first or card2 is first
  const randomOrdersA: Record<string, { first: 'card1' | 'card2'; second: 'card1' | 'card2' }> = {};
  for (const item of itemsA) {
    const isFirstCard1 = Math.random() < 0.5;
    randomOrdersA[item.id] = {
      first: isFirstCard1 ? 'card1' : 'card2',
      second: isFirstCard1 ? 'card2' : 'card1',
    };
  }

  // B: for each scenario, shuffle the 4 option codes
  const randomOrdersB: Record<string, RoleCode[]> = {};
  for (const scenario of scenariosB) {
    const codes = scenario.options.map((o) => o.code);
    randomOrdersB[scenario.id] = shuffleArray(codes);
  }

  // C: for each mini-game, shuffle the 9 card codes
  const randomOrdersC: Record<string, RoleCode[]> = {};
  for (const game of gamesC) {
    const codes = game.cards.map((c) => c.code);
    randomOrdersC[game.id] = shuffleArray(codes);
  }

  return {
    randomOrdersA,
    randomOrdersB,
    randomOrdersC,
  };
}
