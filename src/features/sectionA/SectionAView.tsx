import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssessment } from '../../context/AssessmentContext';
import { SECTION_A_ITEMS } from '../../data';
import { ChoiceA, ResponseA, DisplayedCardA } from '../../types';
import { UI_STRINGS } from '../../content/ui.fa';
import { Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const SectionAView: React.FC = () => {
  const navigate = useNavigate();
  const { indexA, randomOrdersA, recordResponseA } = useAssessment();

  const currentItem = SECTION_A_ITEMS[indexA];
  const order = randomOrdersA[currentItem.id] || { first: 'card1', second: 'card2' };

  const firstCard: DisplayedCardA = currentItem[order.first];
  const secondCard: DisplayedCardA = currentItem[order.second];

  const [selectedChoice, setSelectedChoice] = useState<ChoiceA | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const startTimeRef = useRef<number>(Date.now());

  // Reset timer and selection on item index change
  useEffect(() => {
    setSelectedChoice(null);
    setIsSubmitting(false);
    startTimeRef.current = Date.now();
  }, [currentItem.id, indexA]);

  const handleSelect = async (choice: ChoiceA) => {
    if (isSubmitting) return;
    const responseTimeMs = Date.now() - startTimeRef.current;
    setSelectedChoice(choice);
    setIsSubmitting(true);

    let firstCardPoints = 0;
    let secondCardPoints = 0;
    let chosenSide: 'first' | 'second' = 'first';

    if (choice === 0) {
      firstCardPoints = 3;
      secondCardPoints = 0;
      chosenSide = 'first';
    } else if (choice === 1) {
      firstCardPoints = 2;
      secondCardPoints = 1;
      chosenSide = 'first';
    } else if (choice === 2) {
      firstCardPoints = 1;
      secondCardPoints = 2;
      chosenSide = 'second';
    } else {
      firstCardPoints = 0;
      secondCardPoints = 3;
      chosenSide = 'second';
    }

    const allocatedScores = {
      [firstCard.code]: firstCardPoints,
      [secondCard.code]: secondCardPoints,
    };

    const response: ResponseA = {
      itemId: currentItem.id,
      firstDisplayCode: firstCard.code,
      secondDisplayCode: secondCard.code,
      choice,
      chosenSide,
      allocatedScores,
      responseTimeMs,
    };

    // 300ms transition for tactile response
    setTimeout(async () => {
      const isFinished = await recordResponseA(response);
      if (isFinished) {
        navigate('/break');
      }
    }, 300);
  };

  // Keyboard shortcut support (1, 2, 3, 4)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSubmitting) return;
      if (e.key === '1') handleSelect(0);
      else if (e.key === '2') handleSelect(1);
      else if (e.key === '3') handleSelect(2);
      else if (e.key === '4') handleSelect(3);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSubmitting, currentItem.id, firstCard, secondCard]);

  return (
    <div className="flex flex-col justify-between min-h-[calc(100vh-140px)] select-none">
      {/* Prompt Header */}
      <div className="text-center mb-4 sm:mb-6">
        <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
          {UI_STRINGS.sectionA.sectionTag}
        </span>
        <h2 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
          {UI_STRINGS.sectionA.prompt}
        </h2>
      </div>

      {/* Cards Container with Slide-in motion */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentItem.id}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 16 }}
          transition={{ duration: 0.25 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 my-auto"
        >
          {/* Card 1 Displayed */}
          <div
            className={`relative rounded-3xl border transition-all duration-200 overflow-hidden flex flex-col ${
              selectedChoice === 0 || selectedChoice === 1
                ? 'border-amber-500 ring-2 ring-amber-400/50 bg-amber-500/10 dark:bg-amber-400/10 shadow-lg'
                : 'border-slate-200/90 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 shadow-xs'
            }`}
          >
            {/* Visual Canvas Area */}
            <div className="h-36 sm:h-44 bg-gradient-to-br from-slate-100 via-amber-50/40 to-slate-200 dark:from-slate-800 dark:via-slate-850 dark:to-slate-900 flex flex-col items-center justify-center p-4 text-center relative border-b border-slate-200/60 dark:border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-white/80 dark:bg-slate-800/80 shadow-xs flex items-center justify-center text-amber-600 dark:text-amber-400 mb-2">
                <ImageIcon className="w-6 h-6 stroke-[1.5]" />
              </div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                {UI_STRINGS.sectionA.placeholderTitle}
              </span>
            </div>

            {/* Card Persian Title */}
            <div className="p-4 sm:p-5 flex-1 flex items-center justify-center text-center">
              <p className="font-extrabold text-slate-900 dark:text-slate-100 text-sm sm:text-base leading-snug">
                {firstCard.title}
              </p>
            </div>
          </div>

          {/* Card 2 Displayed */}
          <div
            className={`relative rounded-3xl border transition-all duration-200 overflow-hidden flex flex-col ${
              selectedChoice === 2 || selectedChoice === 3
                ? 'border-amber-500 ring-2 ring-amber-400/50 bg-amber-500/10 dark:bg-amber-400/10 shadow-lg'
                : 'border-slate-200/90 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 shadow-xs'
            }`}
          >
            {/* Visual Canvas Area */}
            <div className="h-36 sm:h-44 bg-gradient-to-br from-slate-100 via-amber-50/40 to-slate-200 dark:from-slate-800 dark:via-slate-850 dark:to-slate-900 flex flex-col items-center justify-center p-4 text-center relative border-b border-slate-200/60 dark:border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-white/80 dark:bg-slate-800/80 shadow-xs flex items-center justify-center text-amber-600 dark:text-amber-400 mb-2">
                <ImageIcon className="w-6 h-6 stroke-[1.5]" />
              </div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                {UI_STRINGS.sectionA.placeholderTitle}
              </span>
            </div>

            {/* Card Persian Title */}
            <div className="p-4 sm:p-5 flex-1 flex items-center justify-center text-center">
              <p className="font-extrabold text-slate-900 dark:text-slate-100 text-sm sm:text-base leading-snug">
                {secondCard.title}
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* 4-Scale Segmented Controls */}
      <div className="mt-6 pt-4 border-t border-slate-200/80 dark:border-slate-800/80">
        {/* Track Line with 4 Indicator Dots */}
        <div className="flex items-center justify-between px-8 mb-4 relative max-w-md mx-auto">
          <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-1 bg-slate-200 dark:bg-slate-800 rounded-full" />
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full transition-all duration-200 relative z-10 ${
                selectedChoice === idx
                  ? 'bg-amber-500 ring-4 ring-amber-300 dark:ring-amber-900 scale-125'
                  : 'bg-white dark:bg-slate-900 border-2 border-slate-400 dark:border-slate-600'
              }`}
            />
          ))}
        </div>

        {/* 4 Discrete Decision Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-xl mx-auto">
          <button
            type="button"
            onClick={() => handleSelect(0)}
            disabled={isSubmitting}
            className={`min-h-[52px] p-2.5 rounded-2xl border text-xs sm:text-sm font-bold transition active:scale-98 flex flex-col items-center justify-center text-center cursor-pointer ${
              selectedChoice === 0
                ? 'bg-slate-950 dark:bg-amber-500 border-slate-950 dark:border-amber-500 text-amber-200 dark:text-slate-950 shadow-md'
                : 'bg-white/80 dark:bg-slate-900/80 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-amber-400'
            }`}
          >
            <span>{UI_STRINGS.sectionA.optionEntirelyFirst}</span>
            <span className="text-[10px] opacity-75 mt-0.5 truncate max-w-full">
              {firstCard.title}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSelect(1)}
            disabled={isSubmitting}
            className={`min-h-[52px] p-2.5 rounded-2xl border text-xs sm:text-sm font-bold transition active:scale-98 flex flex-col items-center justify-center text-center cursor-pointer ${
              selectedChoice === 1
                ? 'bg-slate-800 dark:bg-amber-600 border-slate-800 dark:border-amber-600 text-white shadow-md'
                : 'bg-white/80 dark:bg-slate-900/80 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-amber-400'
            }`}
          >
            <span>{UI_STRINGS.sectionA.optionPartiallyFirst}</span>
            <span className="text-[10px] opacity-75 mt-0.5 truncate max-w-full">
              {firstCard.title}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSelect(2)}
            disabled={isSubmitting}
            className={`min-h-[52px] p-2.5 rounded-2xl border text-xs sm:text-sm font-bold transition active:scale-98 flex flex-col items-center justify-center text-center cursor-pointer ${
              selectedChoice === 2
                ? 'bg-slate-800 dark:bg-amber-600 border-slate-800 dark:border-amber-600 text-white shadow-md'
                : 'bg-white/80 dark:bg-slate-900/80 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-amber-400'
            }`}
          >
            <span>{UI_STRINGS.sectionA.optionPartiallySecond}</span>
            <span className="text-[10px] opacity-75 mt-0.5 truncate max-w-full">
              {secondCard.title}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSelect(3)}
            disabled={isSubmitting}
            className={`min-h-[52px] p-2.5 rounded-2xl border text-xs sm:text-sm font-bold transition active:scale-98 flex flex-col items-center justify-center text-center cursor-pointer ${
              selectedChoice === 3
                ? 'bg-slate-950 dark:bg-amber-500 border-slate-950 dark:border-amber-500 text-amber-200 dark:text-slate-950 shadow-md'
                : 'bg-white/80 dark:bg-slate-900/80 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-amber-400'
            }`}
          >
            <span>{UI_STRINGS.sectionA.optionEntirelySecond}</span>
            <span className="text-[10px] opacity-75 mt-0.5 truncate max-w-full">
              {secondCard.title}
            </span>
          </button>
        </div>

        {/* Keyboard Helper */}
        <div className="text-center mt-3 text-[11px] text-slate-400 dark:text-slate-500">
          {UI_STRINGS.sectionA.shortcutHint}
        </div>
      </div>
    </div>
  );
};
