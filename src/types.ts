export type RoleCode = 'PL' | 'RI' | 'CO' | 'SH' | 'ME' | 'TW' | 'IMP' | 'CF' | 'SP';

export interface RoleMeta {
  code: RoleCode;
  englishTitle: string;
  persianTitle: string;
}

export type RoleCategory = 'preferred' | 'manageable' | 'leastPreferred';

export interface RoleContentData {
  teamContribution: string;
  observableBehaviors: string;
  blindSpot: string;
  bestConditions: string;
}

// Section A Types
export interface ItemA {
  id: string; // e.g. "A01"
  card1: {
    code: RoleCode;
    title: string;
    imageDescription: string;
    imagePath: string;
  };
  card2: {
    code: RoleCode;
    title: string;
    imageDescription: string;
    imagePath: string;
  };
}

export type ChoiceA = 0 | 1 | 2 | 3; // 0: کاملاً کارت ۱ نمایش, 1: کمی کارت ۱ نمایش, 2: کمی کارت ۲ نمایش, 3: کاملاً کارت ۲ نمایش

export interface DisplayedCardA {
  code: RoleCode;
  title: string;
  imageDescription: string;
  imagePath: string;
}

export interface ResponseA {
  itemId: string;
  firstDisplayCode: RoleCode;
  secondDisplayCode: RoleCode;
  choice: ChoiceA; // 0, 1, 2, 3 in relation to display order
  chosenSide: 'first' | 'second'; // for side bias calculation
  allocatedScores: {
    [key in RoleCode]?: number;
  };
  responseTimeMs: number;
}

// Section B Types
export interface OptionB {
  code: RoleCode;
  text: string;
}

export interface ScenarioB {
  id: string; // e.g. "B01"
  title: string;
  context: string;
  options: OptionB[];
}

export interface ResponseB {
  scenarioId: string;
  optionOrder: RoleCode[]; // display order of options
  firstChoiceCode: RoleCode;
  secondChoiceCode: RoleCode;
  allocatedScores: {
    [key in RoleCode]?: number;
  };
  responseTimeMs: number;
}

// Section C Types
export interface CardC {
  code: RoleCode;
  text: string;
}

export interface MiniGameC {
  id: string; // e.g. "C01"
  title: string;
  prompt: string;
  cards: CardC[];
}

export interface ResponseC {
  gameId: string;
  cardOrder: RoleCode[]; // display order of cards
  rankedChoices: [RoleCode, RoleCode, RoleCode]; // 1st, 2nd, 3rd chosen codes
  allocatedScores: {
    [key in RoleCode]?: number;
  };
  responseTimeMs: number;
}

// Scoring and Results
export interface ScoredRole {
  code: RoleCode;
  persianTitle: string;
  englishTitle: string;
  rawA: number;
  rawB: number;
  rawC: number;
  fc: number;     // Normalized A (0..100)
  sjt: number;    // Normalized B (0..100)
  game: number;   // Normalized C (0..100)
  finalScore: number; // 0..100
  displayScore: number; // rounded to 1 decimal place
  rank: number;
  category: RoleCategory;
  categoryTitle: string;
  closeGapWithNext?: boolean; // if diff <= 3 with adjacent ranked role
  closeGapExplanation?: string;
}

export interface ScoringSummary {
  roles: ScoredRole[];
  top3: ScoredRole[];
  rawTotals: { [key in RoleCode]: { rawA: number; rawB: number; rawC: number } };
  normalizedTotals: { [key in RoleCode]: { fc: number; sjt: number; game: number } };
  finalTotals: { [key in RoleCode]: number };
}

// RQI Types
export type RQILevel = 'stable' | 'caution' | 'retest';

export interface RQIDeductions {
  speedA: number; // 0 or 15
  speedB: number; // 0 or 15
  sideBiasA: number; // 0 or 15
  spearman: number; // 0, 5, 10, 20
  totalDeductions: number;
}

export interface RQIResult {
  score: number; // 0..100
  level: RQILevel;
  levelLabel: string;
  deductions: RQIDeductions;
  details: {
    fastCountA: number;
    fastPercentA: number;
    fastCountB: number;
    fastPercentB: number;
    firstSideCountA: number;
    secondSideCountA: number;
    maxSidePercentA: number;
    spearmanAB: number;
    spearmanAC: number;
    spearmanBC: number;
    avgSpearman: number;
  };
  warningNote: string;
}

// Participant Profile
export interface ParticipantProfile {
  firstName?: string;
  lastName?: string;
  mobile?: string;
  orgCode?: string;
  fullName?: string;
}

// Assessment Session
export interface SessionRecord {
  sessionId: string;
  trackingCode?: string;
  instrumentVersion: string;
  weights: { A: number; B: number; C: number };
  startedAt: string; // ISO
  finishedAt: string; // ISO
  participantName?: string;
  participantProfile?: ParticipantProfile;
  responsesA: ResponseA[];
  responsesB: ResponseB[];
  responsesC: ResponseC[];
  scoring: ScoringSummary;
  rqi: RQIResult;
}

// Active Assessment Progress for resume
export interface InProgressAssessment {
  sessionId: string;
  trackingCode?: string;
  startedAt: string;
  participantName?: string;
  participantProfile?: ParticipantProfile;
  currentStep: 'intro' | 'sectionA' | 'break' | 'sectionB' | 'sectionC' | 'review' | 'reveal' | 'report';
  currentIndexA: number; // 0..17
  currentIndexB: number; // 0..8
  currentIndexC: number; // 0..2
  // Pre-generated randomized display orders to preserve across refresh
  randomOrdersA: { [itemId: string]: { first: 'card1' | 'card2'; second: 'card1' | 'card2' } };
  randomOrdersB: { [scenarioId: string]: RoleCode[] };
  randomOrdersC: { [gameId: string]: RoleCode[] };
  responsesA: ResponseA[];
  responsesB: ResponseB[];
  responsesC: ResponseC[];
}
