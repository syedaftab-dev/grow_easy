import { Fragment } from 'react';

interface Props {
  currentStep: 1 | 2 | 3 | 4;
}

const STEPS = [
  { id: 1 as const, label: 'Upload' },
  { id: 2 as const, label: 'Preview' },
  { id: 3 as const, label: 'Processing' },
  { id: 4 as const, label: 'Results' },
];

export default function Stepper({ currentStep }: Props) {
  return (
    <nav aria-label="Import steps" className="flex items-center w-full">
      {STEPS.map((step, idx) => {
        const isDone    = currentStep > step.id;
        const isActive  = currentStep === step.id;

        return (
          <Fragment key={step.id}>
            <div className="flex items-center gap-2.5 shrink-0">
              {/* Circle */}
              <div
                className={[
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300',
                  isDone   ? 'bg-brand text-white'
                  : isActive ? 'bg-brand text-white ring-4 ring-brand/25'
                  : 'bg-slate-800 text-slate-500 ring-1 ring-slate-700',
                ].join(' ')}
              >
                {isDone ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step.id
                )}
              </div>
              {/* Label */}
              <span
                className={[
                  'text-sm font-medium hidden sm:block transition-colors duration-300',
                  isActive || isDone ? 'text-white' : 'text-slate-500',
                ].join(' ')}
              >
                {step.label}
              </span>
            </div>
 
            {/* Connector line */}
            {idx < STEPS.length - 1 && (
              <div className="flex-1 mx-3 sm:mx-4 h-px transition-colors duration-500"
                style={{ background: isDone ? 'rgb(21 128 61)' : 'rgb(30 41 59)' }}
              />
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
