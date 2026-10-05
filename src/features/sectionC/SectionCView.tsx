import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssessment } from '../../context/AssessmentContext';
import { SECTION_C_MINIGAMES } from '../../data';
import { RoleCode, ResponseC, CardC } from '../../types';
import { UI_STRINGS } from '../../content/ui.fa';
import { Button } from '../../components/Button';
import { toPersianDigits } from '../../utils/number';
import { RotateCcw, ArrowLeft, ArrowUp, ArrowDown, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const SectionCView: React.FC = () => {
  const navigate = useNavigate();
  const { indexC, randomOrdersC, recordResponseC } = useAssessment();

  const currentGame = SECTION_C_MINIGAMES[indexC];
  const cardOrder = randomOrdersC[currentGame.id] || currentGame.cards.map((c) => c.code);

  const orderedCards: CardC[] = cardOrder
    .map((code) => currentGame.cards.find((c) => c.code === code))
    .filter((c): c is CardC => c !== undefined);

  // Array of 3 chosen codes in order: [1st, 2nd, 3rd]
  const [selectedRanks, setSelectedRanks] = useState<RoleCode[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    setSelectedRanks([]);
    setIsSubmitting(false);
    startTimeRef.current = Date.now();
  }, [currentGame.id, indexC]);

  const handleCardClick = (code: RoleCode) => {
    if (isSubmitting) return;

    const existingIndex = selectedRanks.indexOf(code);
    if (existingIndex !== -1) {
      // Deselect card
      setSelectedRanks((prev) => prev.filter((c) => c !== code));
    } else {
      if (selectedRanks.length < 3) {
        setSelectedRanks((prev) => [...prev, code]);
      }
    }
  };

  // Reorder ranks up/down for accessibility
  const handleMoveRank = (code: RoleCode, direction: 'up' | 'down') => {
    const idx = selectedRanks.indexOf(code);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= selectedRanks.length) return;

    const next = [...selectedRanks];
    const temp = next[idx];
    next[idx] = next[targetIdx];
    next[targetIdx] = temp;
    setSelectedRanks(next);
  };

  const handleReset = () => {
    setSelectedRanks([]);
  };

  const handleSubmit = async () => {
    if (selectedRanks.length !== 3 || isSubmitting) return;
    setIsSubmitting(true);

    const responseTimeMs = Date.now() - startTimeRef.current;
    const rankedChoices: [RoleCode, RoleCode, RoleCode] = [
      selectedRanks[0],
      selectedRanks[1],
      selectedRanks[2],
    ];

    const allocatedScores: { [key in RoleCode]?: number } = {
      [rankedChoices[0]]: 3,
      [rankedChoices[1]]: 2,
      [rankedChoices[2]]: 1,
    };

    const response: ResponseC = {
      gameId: currentGame.id,
      cardOrder,
      rankedChoices,
      allocatedScores,
      responseTimeMs,
    };

    const isFinished = await recordResponseC(response);
    if (isFinished) {
      navigate('/review');
    }
  };

  const isLast = indexC === SECTION_C_MINIGAMES.length - 1;

  return (
    <div className="flex flex-col justify-between min-h-[calc(100vh-140px)] select-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentGame.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
          className="space-y-4"
        >
          {/* Header */}
          <div className="text-center">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              {UI_STRINGS.sectionC.sectionTag}
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {currentGame.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-md mx-auto">
              {currentGame.prompt}
            </p>
          </div>

          {/* Progress / Instructions Indicator */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-amber-500" />
              <span>
                {selectedRanks.length === 0
                  ? UI_STRINGS.sectionC.pickInstruction
                  : selectedRanks.length < 3
                  ? UI_STRINGS.sectionC.remainingInstruction(toPersianDigits(3 - selectedRanks.length))
                  : UI_STRINGS.sectionC.completedInstruction}
              </span>
            </div>

            {selectedRanks.length > 0 && (
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-1 cursor-pointer transition py-1 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{UI_STRINGS.sectionC.resetGame}</span>
              </button>
            )}
          </div>

          {/* 9 Cards list with rank badges and accessible reordering arrows */}
          <div className="space-y-2">
            {orderedCards.map((card) => {
              const rankIndex = selectedRanks.indexOf(card.code);
              const isSelected = rankIndex !== -1;
              const rankNumber = rankIndex + 1;

              return (
                <div
                  key={card.code}
                  className={`w-full p-3 sm:p-3.5 rounded-2xl border transition-all duration-150 flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-amber-500/15 dark:bg-amber-400/20 border-amber-500 dark:border-amber-400 shadow-sm'
                      : 'bg-white/80 dark:bg-slate-900/80 border-slate-200/90 dark:border-slate-800 hover:border-amber-400/60 shadow-xs'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleCardClick(card.code)}
                    className="flex-1 flex items-center gap-3 text-right cursor-pointer"
                  >
                    {/* Rank Badge */}
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 shadow-xs'
                          : 'border border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {isSelected ? toPersianDigits(rankNumber) : ''}
                    </div>

                    <div className="flex-1 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 leading-snug">
                      {card.text}
                    </div>
                  </button>

                  {/* Accessibility Reorder Arrows for Selected Items */}
                  {isSelected && (
                    <div className="flex items-center gap-1 shrink-0 pl-1">
                      <button
                        type="button"
                        disabled={rankIndex === 0}
                        onClick={() => handleMoveRank(card.code, 'up')}
                        title={UI_STRINGS.sectionC.moveUp}
                        className="p-1 rounded-lg hover:bg-amber-200/50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={rankIndex === selectedRanks.length - 1}
                        onClick={() => handleMoveRank(card.code, 'down')}
                        title={UI_STRINGS.sectionC.moveDown}
                        className="p-1 rounded-lg hover:bg-amber-200/50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Submit Button */}
      <div className="pt-6 mt-6 border-t border-slate-200/80 dark:border-slate-800/80">
        <Button
          variant="primary"
          size="lg"
          disabled={selectedRanks.length !== 3 || isSubmitting}
          isLoading={isSubmitting}
          onClick={handleSubmit}
          className="w-full"
          leftIcon={<ArrowLeft className="w-5 h-5 rtl:rotate-180" />}
        >
          {isLast ? UI_STRINGS.sectionC.submitToReview : UI_STRINGS.sectionC.submitToNext}
        </Button>
      </div>
    </div>
  );
};
