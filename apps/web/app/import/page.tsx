'use client';

import { useState, useCallback } from 'react';
import Papa from 'papaparse';
import Stepper      from '@/components/Stepper';
import DropZone     from '@/components/DropZone';
import PreviewTable from '@/components/PreviewTable';
import BatchProgress from '@/components/BatchProgress';
import ResultsView  from '@/components/ResultsView';
import { importCsv } from '@/lib/api';
import type { ImportResponse } from '@/lib/types';

type Step = 1 | 2 | 3 | 4;

export default function ImportPage() {
  const [step,      setStep]      = useState<Step>(1);
  const [file,      setFile]      = useState<File | null>(null);
  const [headers,   setHeaders]   = useState<string[]>([]);
  const [rows,      setRows]      = useState<Record<string, string>[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [result,    setResult]    = useState<ImportResponse | null>(null);
  const [error,     setError]     = useState<string | null>(null);
  const [theme,     setTheme]     = useState<'dark' | 'light'>('dark');

  // ── Step 1 → 2 ────────────────────────────────────────────────────────────
  const handleFileAccepted = useCallback((accepted: File) => {
    setFile(accepted);
    setError(null);

    Papa.parse<Record<string, string>>(accepted, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      transform: (v) => v.trim(),
      complete: ({ data, meta }) => {
        setHeaders(meta.fields ?? []);
        setRows(data);
        setTotalRows(data.length);
        setStep(2);
      },
      error: (err) => setError(`Could not parse CSV: ${err.message}`),
    });
  }, []);

  // ── Step 2 → 3 → 4 ────────────────────────────────────────────────────────
  const handleConfirmImport = async () => {
    if (!file) return;
    setError(null);
    setStep(3);

    try {
      const response = await importCsv(file);
      setResult(response);
      setStep(4);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(msg);
      setStep(2); // bounce back to preview with retry option
    }
  };

  // ── Reset ──────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setStep(1);
    setFile(null);
    setHeaders([]);
    setRows([]);
    setTotalRows(0);
    setResult(null);
    setError(null);
  };

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'bg-slate-950 text-white dark' : 'light-theme bg-slate-50 text-slate-900'}`}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          {/* Logo mark */}
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand to-green-800 flex items-center justify-center shrink-0 shadow-lg shadow-green-950/40">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-white tracking-tight">GrowEasy</span>
            <span className="text-slate-500 text-sm hidden sm:inline">·</span>
            <span className="text-slate-400 text-sm hidden sm:inline">AI CSV Importer</span>
          </div>

          {/* File name chip (steps 2–4) */}
          {file && step > 1 && (
            <div className="ml-auto flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg">
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <span className="text-xs text-slate-300 max-w-[160px] truncate">{file.name}</span>
            </div>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className={`p-2 rounded-lg border transition-colors ${file && step > 1 ? '' : 'ml-auto'} ${
              isDark
                ? 'bg-slate-800/80 border-slate-700 text-amber-400 hover:bg-slate-800'
                : 'bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700'
            }`}
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* ── Stepper ────────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 pt-8 pb-6">
        <Stepper currentStep={step} />
      </div>

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 pb-12">

        {/* ─ Step 1: Upload ─ */}
        {step === 1 && (
          <DropZone onFileAccepted={handleFileAccepted} error={error} />
        )}

        {/* ─ Step 2: Preview ─ */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Error banner (from failed import retry) */}
            {error && (
              <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/25 animate-fade-in">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  <div>
                    <p className="text-red-400 text-sm font-medium">Import failed</p>
                    <p className="text-red-400/80 text-sm mt-0.5">{error}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleConfirmImport}
                    className="px-3.5 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors"
                  >
                    Retry Import
                  </button>
                  <button
                    onClick={() => setError(null)}
                    className="text-red-400 hover:text-red-300 p-1 transition-colors"
                    aria-label="Dismiss error"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            <PreviewTable
              headers={headers}
              rows={rows}
              totalRows={totalRows}
              fileName={file?.name}
            />

            {/* Action bar */}
            <div className="flex items-center justify-between pt-2">
              <button
                id="back-to-upload-btn"
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-sm font-medium transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                Choose different file
              </button>

              <button
                id="confirm-import-btn"
                onClick={handleConfirmImport}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand hover:bg-brand/90 active:bg-green-800 text-white text-sm font-semibold transition-all shadow-lg shadow-green-950/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                Confirm Import
                <span className="ml-1 text-green-200 font-normal">· {totalRows} rows</span>
              </button>
            </div>
          </div>
        )}

        {/* ─ Step 3: Processing ─ */}
        {step === 3 && (
          <BatchProgress totalRows={totalRows} />
        )}

        {/* ─ Step 4: Results ─ */}
        {step === 4 && result && (
          <ResultsView result={result} onReset={handleReset} onRetry={handleConfirmImport} />
        )}
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-800/50 py-4">
        <p className="text-center text-xs text-slate-600">
          GrowEasy AI CSV Importer · Powered by Groq Llama 3.3 70B
        </p>
      </footer>
    </div>
  );
}
