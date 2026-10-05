import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssessment } from '../../context/AssessmentContext';
import { SECTION_B_SCENARIOS } from '../../data';
import { RoleCode, ResponseB, OptionB } from '../../types';
import { UI_STRINGS } from '../../content/ui.fa';
import { OptionRow } from '../../components/OptionRow';
import { Button } from '../../components/Button';
import { RotateCcw, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const SectionBView: React.FC = () => {
  const navigate = useNavigate();
  const { indexB, randomOrdersB, recordResponseB } = useAssessment();

  const currentScenario = SECTION_B_SCENARIOS[indexB];
  const optionOrder = randomOrdersB[currentScenario.id] || currentScenario.options.map((o) => o.code);

  const orderedOptions: OptionB[] = optionOrder
    .map((code) => currentScenario.options.find((o) => o.code === code))
    .filter((o): o is OptionB => o !== undefined);

  const [firstChoice, setFirstChoice] = useState<RoleCode | null>(null);
  const [secondChoice, setSecondChoice] = useState<RoleCode | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    setFirstChoice(null);
    setSecondChoice(null);
    setIsSubmitting(false);
    startTimeRef.current = Date.now();
  }, [currentScenario.id, indexB]);

  const handleSelectOption = (code: RoleCode) => {
    if (isSubmitting) return;

    if (!firstChoice) {
      setFirstChoice(code);
    } else if (firstChoice === code) {
      setFirstChoice(null);
      setSecondChoice(null);
    } else if (!secondChoice) {
      setSecondChoice(code);
    } else if (secondChoice === code) {
      setSecondChoice(null);
    } else {
      setSecondChoice(code);
    }
  };

  const handleResetChoices = () => {
    setFirstChoice(null);
    setSecondChoice(null);
  };

  const handleSubmit = async () => {
    if (!firstChoice || !secondChoice || isSubmitting) return;
    setIsSubmitting(true);

    const responseTimeMs = Date.now() - startTimeRef.current;

    const allocatedScores: { [key in RoleCode]?: number } = {
      [firstChoice]: 3,
      [secondChoice]: 1,
    };

    const response: ResponseB = {
      scenarioId: currentScenario.id,
      optionOrder,
      firstChoiceCode: firstChoice,
      secondChoiceCode: secondChoice,
      allocatedScores,
      responseTimeMs,
    };

    const isFinished = await recordResponseB(response);
    if (isFinished) {
      navigate('/section-c');
    }
  };

  return (
    <div className="flex flex-col justify-between min-h-[calc(100vh-140px)] select-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScenario.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
          className="space-y-4"
        >
          {/* Header */}
          <div className="text-center">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              {UI_STRINGS.sectionB.sectionTag}
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {currentScenario.title}
            </h2>
          </div>

          {/* Scenario Context Box */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm">
            <p className="text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
              {currentScenario.context}
            </p>
          </div>

          {/* Stage Progress & Reset */}
          <div className="flex items-center justify-between px-1">
            <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
              {!firstChoice
                ? UI_STRINGS.sectionB.stage1Instruction
                : !secondChoice
                ? UI_STRINGS.sectionB.stage2Instruction
                : UI_STRINGS.sectionB.completedInstruction}
            </p>

            {firstChoice && (
              <button
                type="button"
                onClick={handleResetChoices}
                className="text-xs text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-1 cursor-pointer transition py-1 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{UI_STRINGS.sectionB.resetChoices}</span>
              </button>
            )}
          </div>

          {/* 4 Options with OptionRow */}
          <div className="space-y-2.5">
            {orderedOptions.map((opt) => {
              const isFirst = firstChoice === opt.code;
              const isSecond = secondChoice === opt.code;

              return (
                <OptionRow
                  key={opt.code}
                  text={opt.text}
                  isSelected={isFirst}
                  isSecondarySelected={isSecond}
                  badgeContent={
                    isFirst
                      ? UI_STRINGS.sectionB.firstChoiceBadge
                      : isSecond
                      ? UI_STRINGS.sectionB.secondChoiceBadge
                      : undefined
                  }
                  onClick={() => handleSelectOption(opt.code)}
                />
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Footer Submit Action */}
      <div className="pt-6 mt-6 border-t border-slate-200/80 dark:border-slate-800/80">
        <Button
          variant="primary"
          size="lg"
          disabled={!firstChoice || !secondChoice || isSubmitting}
          isLoading={isSubmitting}
          onClick={handleSubmit}
          className="w-full"
          leftIcon={<ArrowLeft className="w-5 h-5 rtl:rotate-180" />}
        >
          {UI_STRINGS.sectionB.submitButton}
        </Button>
      </div>
    </div>
  );
};
