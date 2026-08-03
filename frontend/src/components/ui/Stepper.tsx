'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Step {
  id: string;
  label: string;
}

interface StepperProps {
  steps: Step[];
  currentStepIndex: number;
  className?: string;
}

export default function Stepper({ steps, currentStepIndex, className }: StepperProps) {
  return (
    <div className={cn('flex items-center w-full', className)}>
      {steps.map((step, index) => {
        const isComplete = index < currentStepIndex;
        const isActive = index === currentStepIndex;
        const isLast = index === steps.length - 1;

        return (
          <div key={step.id} className={cn('flex items-center', !isLast && 'flex-1')}>
            <div className="flex flex-col items-center relative">
              <div
                className={cn(
                  'stepper-circle z-10',
                  isComplete && 'stepper-circle-complete',
                  isActive && 'stepper-circle-active',
                  !isComplete && !isActive && 'stepper-circle-inactive'
                )}
              >
                {isComplete ? <Check className="w-4 h-4" /> : index + 1}
              </div>
              <span
                className={cn(
                  'absolute top-10 text-xs font-medium whitespace-nowrap hidden md:block',
                  (isComplete || isActive) ? 'text-slate-800' : 'text-stone-400'
                )}
              >
                {step.label}
              </span>
            </div>
            
            {!isLast && (
              <div
                className={cn(
                  'stepper-line',
                  isComplete && 'stepper-line-active'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
