'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  totalRows: number;
}

const STEP_MESSAGES = [
  'Sending your data to the AI…',
  'Mapping column names semantically…',
  'Extracting CRM fields from each row…',
  'Validating enums and skip rules…',
  'Finalising your import…',
];

export default function BatchProgress({ totalRows }: Props) {
  const [progress,   setProgress]  = useState(0);
  const [elapsed,    setElapsed]   = useState(0);
  const [msgIdx,     setMsgIdx]    = useState(0);
  const startRef = useRef(Date.now());

  // Simulated progress: climbs to 88% over ~40 s, then holds.
  // Snaps to 100% when the parent unmounts this component (step changes).
  useEffect(() => {
    const totalMs = Math.max(15_000, totalRows * 400); // ~0.4 s per row estimate

    const progressTimer = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      // Asymptotic curve: reaches 88% at totalMs, never hits 100
      const pct = 88 * (1 - Math.exp(-3 * (elapsed / totalMs)));
      setProgress(Math.min(pct, 88));
    }, 80);

    const elapsedTimer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);

    const msgTimer = setInterval(() => {
      setMsgIdx((i) => (i + 1) % STEP_MESSAGES.length);
    }, 3000);

    return () => {
      clearInterval(progressTimer);
      clearInterval(elapsedTimer);
      clearInterval(msgTimer);
    };
  }, [totalRows]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[55vh] animate-fade-in">
      <div className="w-full max-w-lg">
        {/* Spinner + icon */}
        <div className="flex justify-center mb-8">
          <div className="relative w-20 h-20">
            {/* Outer spinning ring */}
            <svg className="absolute inset-0 w-full h-full animate-spin" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="rgb(124 58 237 / 0.15)" strokeWidth="5" />
              <circle cx="40" cy="40" r="34" fill="none" stroke="rgb(139 92 246)" strokeWidth="5"
                strokeDasharray="213" strokeDashoffset="160" strokeLinecap="round" />
            </svg>
            {/* Inner icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-8 h-8 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Status message */}
        <h2 className="text-center text-xl font-semibold text-white mb-2">
          AI Extraction in Progress
        </h2>
        <p className="text-center text-slate-400 text-sm mb-8 h-5 transition-all duration-500">
          {STEP_MESSAGES[msgIdx]}
        </p>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-slate-500 mb-2">
            <span>{Math.round(progress)}%</span>
            <span>{elapsed}s elapsed · {totalRows} rows queued</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-400 transition-all duration-200 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Batch info */}
        <p className="text-center text-xs text-slate-600 mt-4">
          Processing in batches of 20 · up to 3 concurrent
        </p>
      </div>
    </div>
  );
}
