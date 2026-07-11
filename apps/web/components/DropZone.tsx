'use client';

import { useRef, useState, useCallback, type DragEvent, type ChangeEvent } from 'react';

interface Props {
  onFileAccepted: (file: File) => void;
  error?: string | null;
}

export default function DropZone({ onFileAccepted, error }: Props) {
  const [isDragging, setIsDragging]   = useState(false);
  const [fileError,  setFileError]    = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validate = useCallback((file: File): string | null => {
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      return 'Only CSV files are accepted.';
    }
    if (file.size > 10 * 1024 * 1024) {
      return 'File is too large. Maximum size is 10 MB.';
    }
    if (file.size === 0) {
      return 'The selected file is empty.';
    }
    return null;
  }, []);

  const handleFile = useCallback((file: File) => {
    const err = validate(file);
    if (err) { setFileError(err); return; }
    setFileError(null);
    onFileAccepted(file);
  }, [validate, onFileAccepted]);

  const onDragOver  = (e: DragEvent) => { e.preventDefault(); setIsDragging(true);  };
  const onDragLeave = (e: DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const onDrop      = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const displayError = fileError ?? error;

  return (
    <div className="flex flex-col items-center justify-center min-h-[55vh] animate-fade-in">
      <div className="w-full max-w-2xl">
        {/* Drop zone */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          aria-label="Upload CSV file"
          className={[
            'w-full rounded-2xl border-2 border-dashed p-12 flex flex-col items-center gap-5',
            'cursor-pointer transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-violet-500',
            isDragging
              ? 'border-violet-500 bg-violet-500/10 scale-[1.01]'
              : 'border-slate-700 bg-slate-900/60 hover:border-violet-600 hover:bg-violet-500/5',
          ].join(' ')}
        >
          {/* Icon */}
          <div className={[
            'w-16 h-16 rounded-2xl flex items-center justify-center transition-colors duration-200',
            isDragging ? 'bg-violet-600' : 'bg-slate-800',
          ].join(' ')}>
            <svg className="w-8 h-8 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </div>

          {/* Text */}
          <div className="text-center">
            <p className="text-lg font-semibold text-white mb-1">
              {isDragging ? 'Drop your CSV here' : 'Drag & drop your CSV file'}
            </p>
            <p className="text-slate-400 text-sm">or click to browse — max 10 MB</p>
          </div>

          {/* Supported formats tag */}
          <div className="flex flex-wrap gap-2 justify-center">
            {['Facebook Leads', 'Google Ads', 'Excel CSV', 'CRM Exports', 'Any CSV'].map((f) => (
              <span key={f} className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-400 text-xs font-medium">
                {f}
              </span>
            ))}
          </div>
        </button>

        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={onChange}
          id="csv-file-input"
        />

        {/* Error */}
        {displayError && (
          <div className="mt-4 flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 animate-fade-in">
            <svg className="w-5 h-5 text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <p className="text-red-400 text-sm">{displayError}</p>
          </div>
        )}
      </div>
    </div>
  );
}
