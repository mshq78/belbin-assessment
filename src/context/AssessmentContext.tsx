import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  ItemA,
  ScenarioB,
  MiniGameC,
  ResponseA,
  ResponseB,
  ResponseC,
  SessionRecord,
  ParticipantProfile,
  InProgressAssessment,
  RoleCode,
} from '../types';
import {
  SECTION_A_ITEMS,
  SECTION_B_SCENARIOS,
  SECTION_C_MINIGAMES,
} from '../data';
import { generateRandomOrdersForSession } from '../randomize';
import { calculateScores } from '../scoring';
import { calculateRQI } from '../rqi';
import { api, SyncStatus } from '../services/api';
import { INSTRUMENT_VERSION, WEIGHTS } from '../config';
import { generateTrackingCode } from '../utils/number';

interface AssessmentContextType {
  sessionId: string;
  trackingCode: string;
  startedAt: string;
  profile: ParticipantProfile;
  syncStatus: SyncStatus;

  // Active indices
  indexA: number;
  indexB: number;
  indexC: number;

  // Random display orders
  randomOrdersA: Record<string, { first: 'card1' | 'card2'; second: 'card1' | 'card2' }>;
  randomOrdersB: Record<string, RoleCode[]>;
  randomOrdersC: Record<string, RoleCode[]>;

  // Response records
  responsesA: ResponseA[];
  responsesB: ResponseB[];
  responsesC: ResponseC[];

  // Completed session record
  completedSession: SessionRecord | null;
  hasSavedProgress: boolean;

  // Actions
  startAssessment: (profile: ParticipantProfile) => Promise<void>;
  resumeAssessment: () => Promise<string>; // returns route to navigate
  recordResponseA: (response: ResponseA) => Promise<boolean>; // returns true if finished section A
  recordResponseB: (response: ResponseB) => Promise<boolean>; // returns true if finished section B
  recordResponseC: (response: ResponseC) => Promise<boolean>; // returns true if finished section C
  finalizeAssessment: () => Promise<SessionRecord>;
  resetAll: () => Promise<void>;
  autoFillAllAnswers: () => Promise<SessionRecord>;
}

const AssessmentContext = createContext<AssessmentContextType | undefined>(undefined);

export const AssessmentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sessionId, setSessionId] = useState<string>('');
  const [trackingCode, setTrackingCode] = useState<string>('');
  const [startedAt, setStartedAt] = useState<string>('');
  const [profile, setProfile] = useState<ParticipantProfile>({});
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');

  const [indexA, setIndexA] = useState<number>(0);
  const [indexB, setIndexB] = useState<number>(0);
  const [indexC, setIndexC] = useState<number>(0);

  const [randomOrdersA, setRandomOrdersA] = useState<Record<string, { first: 'card1' | 'card2'; second: 'card1' | 'card2' }>>({});
  const [randomOrdersB, setRandomOrdersB] = useState<Record<string, RoleCode[]>>({});
  const [randomOrdersC, setRandomOrdersC] = useState<Record<string, RoleCode[]>>({});

  const [responsesA, setResponsesA] = useState<ResponseA[]>([]);
  const [responsesB, setResponsesB] = useState<ResponseB[]>([]);
  const [responsesC, setResponsesC] = useState<ResponseC[]>([]);

  const [completedSession, setCompletedSession] = useState<SessionRecord | null>(null);
  const [hasSavedProgress, setHasSavedProgress] = useState<boolean>(false);

  // Subscribe to api sync updates
  useEffect(() => {
    return api.subscribeSync((status) => {
      setSyncStatus(status);
    });
  }, []);

  // Check saved progress on mount
  useEffect(() => {
    async function initCheck() {
      const saved = await api.getProgress();
      if (saved && saved.currentStep !== 'report') {
        setHasSavedProgress(true);
      }
    }
    initCheck();
  }, []);

  // Start new assessment
  const startAssessment = async (newProfile: ParticipantProfile) => {
    const newSessionId = `ses_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newTracking = generateTrackingCode();
    const newStarted = new Date().toISOString();

    const orders = generateRandomOrdersForSession(
      SECTION_A_ITEMS,
      SECTION_B_SCENARIOS,
      SECTION_C_MINIGAMES
    );

    setSessionId(newSessionId);
    setTrackingCode(newTracking);
    setStartedAt(newStarted);
    setProfile(newProfile);
    setRandomOrdersA(orders.randomOrdersA);
    setRandomOrdersB(orders.randomOrdersB);
    setRandomOrdersC(orders.randomOrdersC);

    setResponsesA([]);
    setResponsesB([]);
    setResponsesC([]);
    setIndexA(0);
    setIndexB(0);
    setIndexC(0);
    setCompletedSession(null);

    // Save initial progress
    await api.saveProgress({
      sessionId: newSessionId,
      trackingCode: newTracking,
      startedAt: newStarted,
      participantName: newProfile.fullName || `${newProfile.firstName || ''} ${newProfile.lastName || ''}`.trim() || undefined,
      participantProfile: newProfile,
      currentStep: 'sectionA',
      currentIndexA: 0,
      currentIndexB: 0,
      currentIndexC: 0,
      randomOrdersA: orders.randomOrdersA,
      randomOrdersB: orders.randomOrdersB,
      randomOrdersC: orders.randomOrdersC,
      responsesA: [],
      responsesB: [],
      responsesC: [],
    });
  };

  // Resume saved assessment
  const resumeAssessment = async (): Promise<string> => {
    const saved = await api.getProgress();
    if (!saved) return '/';

    setSessionId(saved.sessionId);
    setTrackingCode(saved.trackingCode || generateTrackingCode());
    setStartedAt(saved.startedAt);
    setProfile(saved.participantProfile || { fullName: saved.participantName });
    setRandomOrdersA(saved.randomOrdersA || {});
    setRandomOrdersB(saved.randomOrdersB || {});
    setRandomOrdersC(saved.randomOrdersC || {});

    setResponsesA(saved.responsesA || []);
    setResponsesB(saved.responsesB || []);
    setResponsesC(saved.responsesC || []);

    setIndexA(saved.currentIndexA || 0);
    setIndexB(saved.currentIndexB || 0);
    setIndexC(saved.currentIndexC || 0);

    switch (saved.currentStep) {
      case 'sectionA':
        return '/section-a';
      case 'break':
        return '/break';
      case 'sectionB':
        return '/section-b';
      case 'sectionC':
        return '/section-c';
      case 'review':
        return '/review';
      case 'reveal':
        return '/reveal';
      case 'report':
        return '/report';
      default:
        return '/section-a';
    }
  };

  // Record response A
  const recordResponseA = async (resp: ResponseA): Promise<boolean> => {
    const updated = [...responsesA, resp];
    setResponsesA(updated);

    const isLast = indexA >= SECTION_A_ITEMS.length - 1;
    const nextIndex = isLast ? indexA : indexA + 1;
    if (!isLast) {
      setIndexA(nextIndex);
    }

    await api.saveProgress({
      sessionId,
      trackingCode,
      startedAt,
      participantName: profile.fullName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim(),
      participantProfile: profile,
      currentStep: isLast ? 'break' : 'sectionA',
      currentIndexA: nextIndex,
      currentIndexB: indexB,
      currentIndexC: indexC,
      randomOrdersA,
      randomOrdersB,
      randomOrdersC,
      responsesA: updated,
      responsesB,
      responsesC,
    });

    return isLast;
  };

  // Record response B
  const recordResponseB = async (resp: ResponseB): Promise<boolean> => {
    const updated = [...responsesB, resp];
    setResponsesB(updated);

    const isLast = indexB >= SECTION_B_SCENARIOS.length - 1;
    const nextIndex = isLast ? indexB : indexB + 1;
    if (!isLast) {
      setIndexB(nextIndex);
    }

    await api.saveProgress({
      sessionId,
      trackingCode,
      startedAt,
      participantName: profile.fullName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim(),
      participantProfile: profile,
      currentStep: isLast ? 'sectionC' : 'sectionB',
      currentIndexA: indexA,
      currentIndexB: nextIndex,
      currentIndexC: indexC,
      randomOrdersA,
      randomOrdersB,
      randomOrdersC,
      responsesA,
      responsesB: updated,
      responsesC,
    });

    return isLast;
  };

  // Record response C
  const recordResponseC = async (resp: ResponseC): Promise<boolean> => {
    const updated = [...responsesC, resp];
    setResponsesC(updated);

    const isLast = indexC >= SECTION_C_MINIGAMES.length - 1;
    const nextIndex = isLast ? indexC : indexC + 1;
    if (!isLast) {
      setIndexC(nextIndex);
    }

    await api.saveProgress({
      sessionId,
      trackingCode,
      startedAt,
      participantName: profile.fullName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim(),
      participantProfile: profile,
      currentStep: isLast ? 'review' : 'sectionC',
      currentIndexA: indexA,
      currentIndexB: indexB,
      currentIndexC: nextIndex,
      randomOrdersA,
      randomOrdersB,
      randomOrdersC,
      responsesA,
      responsesB,
      responsesC: updated,
    });

    return isLast;
  };

  // Finalize assessment
  const finalizeAssessment = async (): Promise<SessionRecord> => {
    const scoring = calculateScores(responsesA, responsesB, responsesC);
    const rqi = calculateRQI(
      responsesA,
      responsesB,
      responsesC,
      scoring.rawTotals as any,
      scoring.rawTotals as any,
      scoring.rawTotals as any
    );

    const finishedAt = new Date().toISOString();
    const finalName =
      profile.fullName ||
      `${profile.firstName || ''} ${profile.lastName || ''}`.trim() ||
      undefined;

    const finalRecord: SessionRecord = {
      sessionId: sessionId || `ses_${Date.now()}`,
      trackingCode: trackingCode || generateTrackingCode(),
      instrumentVersion: INSTRUMENT_VERSION,
      weights: WEIGHTS,
      startedAt: startedAt || new Date().toISOString(),
      finishedAt,
      participantName: finalName,
      participantProfile: profile,
      responsesA,
      responsesB,
      responsesC,
      scoring,
      rqi,
    };

    await api.saveSession(finalRecord);
    await api.clearProgress();
    setHasSavedProgress(false);
    setCompletedSession(finalRecord);
    return finalRecord;
  };

  // Auto-fill answers for dev testing
  const autoFillAllAnswers = async (): Promise<SessionRecord> => {
    const mockProfile: ParticipantProfile = {
      firstName: 'امیرحسین',
      lastName: 'کاظمی',
      mobile: '09123456789',
      orgCode: 'DEV-TEST',
      fullName: 'امیرحسین کاظمی',
    };

    const orders = generateRandomOrdersForSession(
      SECTION_A_ITEMS,
      SECTION_B_SCENARIOS,
      SECTION_C_MINIGAMES
    );

    const mockA: ResponseA[] = SECTION_A_ITEMS.map((item, idx) => {
      const choice = (idx % 4) as 0 | 1 | 2 | 3;
      const firstScore = choice === 0 ? 3 : choice === 1 ? 2 : choice === 2 ? 1 : 0;
      const secondScore = 3 - firstScore;
      const order = orders.randomOrdersA[item.id];
      const card1 = item[order.first];
      const card2 = item[order.second];

      return {
        itemId: item.id,
        firstDisplayCode: card1.code,
        secondDisplayCode: card2.code,
        choice,
        chosenSide: choice <= 1 ? 'first' : 'second',
        allocatedScores: {
          [card1.code]: firstScore,
          [card2.code]: secondScore,
        },
        responseTimeMs: 2200 + Math.floor(Math.random() * 1500),
      };
    });

    const mockB: ResponseB[] = SECTION_B_SCENARIOS.map((scenario) => {
      const order = orders.randomOrdersB[scenario.id];
      const first = order[0];
      const second = order[1];
      return {
        scenarioId: scenario.id,
        optionOrder: order,
        firstChoiceCode: first,
        secondChoiceCode: second,
        allocatedScores: {
          [first]: 3,
          [second]: 1,
        },
        responseTimeMs: 5200 + Math.floor(Math.random() * 2000),
      };
    });

    const mockC: ResponseC[] = SECTION_C_MINIGAMES.map((game) => {
      const order = orders.randomOrdersC[game.id];
      const r1 = order[0];
      const r2 = order[1];
      const r3 = order[2];
      return {
        gameId: game.id,
        cardOrder: order,
        rankedChoices: [r1, r2, r3],
        allocatedScores: {
          [r1]: 3,
          [r2]: 2,
          [r3]: 1,
        },
        responseTimeMs: 7500 + Math.floor(Math.random() * 2500),
      };
    });

    const scoring = calculateScores(mockA, mockB, mockC);
    const rqi = calculateRQI(
      mockA,
      mockB,
      mockC,
      scoring.rawTotals as any,
      scoring.rawTotals as any,
      scoring.rawTotals as any
    );

    const record: SessionRecord = {
      sessionId: `ses_${Date.now()}_autofill`,
      trackingCode: generateTrackingCode(),
      instrumentVersion: INSTRUMENT_VERSION,
      weights: WEIGHTS,
      startedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
      finishedAt: new Date().toISOString(),
      participantName: mockProfile.fullName,
      participantProfile: mockProfile,
      responsesA: mockA,
      responsesB: mockB,
      responsesC: mockC,
      scoring,
      rqi,
    };

    setSessionId(record.sessionId);
    setTrackingCode(record.trackingCode!);
    setProfile(mockProfile);
    setResponsesA(mockA);
    setResponsesB(mockB);
    setResponsesC(mockC);
    setCompletedSession(record);

    await api.saveSession(record);
    await api.clearProgress();
    setHasSavedProgress(false);

    return record;
  };

  const resetAll = async () => {
    await api.clearProgress();
    setSessionId('');
    setTrackingCode('');
    setProfile({});
    setResponsesA([]);
    setResponsesB([]);
    setResponsesC([]);
    setIndexA(0);
    setIndexB(0);
    setIndexC(0);
    setCompletedSession(null);
    setHasSavedProgress(false);
  };

  return (
    <AssessmentContext.Provider
      value={{
        sessionId,
        trackingCode,
        startedAt,
        profile,
        syncStatus,
        indexA,
        indexB,
        indexC,
        randomOrdersA,
        randomOrdersB,
        randomOrdersC,
        responsesA,
        responsesB,
        responsesC,
        completedSession,
        hasSavedProgress,
        startAssessment,
        resumeAssessment,
        recordResponseA,
        recordResponseB,
        recordResponseC,
        finalizeAssessment,
        resetAll,
        autoFillAllAnswers,
      }}
    >
      {children}
    </AssessmentContext.Provider>
  );
};

export const useAssessment = (): AssessmentContextType => {
  const context = useContext(AssessmentContext);
  if (!context) {
    throw new Error('useAssessment must be used within an AssessmentProvider');
  }
  return context;
};
