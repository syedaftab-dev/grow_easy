'use client';

import { useState } from 'react';
import type { ImportResponse, CrmRecord, CrmStatus } from '@/lib/types';
import {
  CRM_FIELD_KEYS,
  CRM_FIELD_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
} from '@/lib/types';

interface Props {
  result: ImportResponse;
  onReset: () => void;
  onRetry?: () => void;
}

type ActiveTab = 'imported' | 'skipped';

export default function ResultsView({ result, onReset, onRetry }: Props) {
  const [tab, setTab] = useState<ActiveTab>(
    result.imported.length > 0 ? 'imported' : 'skipped',
  );

  const { summary, imported, skipped } = result;

  const hasFailedBatch = skipped.some((s) =>
    s.reason.toLowerCase().includes('failed') || s.reason.toLowerCase().includes('retries')
  );

  return (
    <div className="animate-slide-up space-y-6">
      {/* Failed batch inline retry prompt */}
      {hasFailedBatch && onRetry && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-amber-300">Some records failed AI extraction after backend retries</p>
              <p className="text-xs text-amber-400/80 mt-0.5">Rather than losing these rows silently, you can retry processing the failed batch right now.</p>
            </div>
          </div>
          <button
            onClick={onRetry}
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors shrink-0"
          >
            Retry this batch
          </button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <SummaryCard label="Total Rows" value={summary.total_rows} colour="slate" />
        <SummaryCard label="Imported"   value={summary.imported}   colour="emerald" />
        <SummaryCard label="Skipped"    value={summary.skipped}    colour={summary.skipped > 0 ? 'amber' : 'slate'} />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl w-fit">
        <TabButton
          id="tab-imported"
          active={tab === 'imported'}
          onClick={() => setTab('imported')}
          count={imported.length}
          label="Imported"
          colour="emerald"
        />
        <TabButton
          id="tab-skipped"
          active={tab === 'skipped'}
          onClick={() => setTab('skipped')}
          count={skipped.length}
          label="Skipped"
          colour="amber"
        />
      </div>

      {/* Tab panels */}
      {tab === 'imported' && (
        imported.length === 0 ? (
          <EmptyState message="No records were successfully imported." />
        ) : (
          <ImportedTable records={imported} />
        )
      )}

      {tab === 'skipped' && (
        skipped.length === 0 ? (
          <EmptyState message="No records were skipped. Perfect import!" />
        ) : (
          <SkippedCardList records={skipped} />
        )
      )}

      {/* Actions */}
      <div className="flex justify-end pt-2">
        <button
          id="import-another-btn"
          onClick={onReset}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
          </svg>
          Import Another File
        </button>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function SummaryCard({
  label, value, colour,
}: { label: string; value: number; colour: 'slate' | 'emerald' | 'amber' }) {
  const ring = {
    slate:   'ring-slate-700/50',
    emerald: 'ring-emerald-500/30',
    amber:   'ring-amber-500/30',
  }[colour];

  const text = {
    slate:   'text-white',
    emerald: 'text-emerald-400',
    amber:   'text-amber-400',
  }[colour];

  return (
    <div className={`rounded-xl bg-slate-900 p-4 ring-1 ${ring}`}>
      <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
      <p className={`text-3xl font-bold tracking-tight ${text}`}>{value.toLocaleString()}</p>
    </div>
  );
}

function TabButton({
  id, active, onClick, count, label, colour,
}: {
  id: string;
  active: boolean;
  onClick: () => void;
  count: number;
  label: string;
  colour: 'emerald' | 'amber';
}) {
  const badgeCls = colour === 'emerald'
    ? 'bg-emerald-500/15 text-emerald-400'
    : 'bg-amber-500/15 text-amber-400';

  return (
    <button
      id={id}
      onClick={onClick}
      className={[
        'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
        active
          ? 'bg-slate-800 text-white shadow-sm'
          : 'text-slate-400 hover:text-slate-300',
      ].join(' ')}
    >
      {label}
      <span className={`text-xs px-1.5 py-0.5 rounded-md font-semibold ${active ? badgeCls : 'bg-slate-700 text-slate-400'}`}>
        {count}
      </span>
    </button>
  );
}

function ImportedTable({ records }: { records: CrmRecord[] }) {
  return (
    <div className="rounded-xl border border-slate-800 overflow-hidden">
      <div className="overflow-auto max-h-[60vh] scrollbar-thin">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-900 border-b border-slate-700">
              <th className="px-3 py-3 text-right text-xs font-semibold text-slate-500 w-10 bg-slate-900">#</th>
              {CRM_FIELD_KEYS.map((k) => (
                <th key={k} className="px-4 py-3 text-left text-xs font-semibold text-slate-300 whitespace-nowrap bg-slate-900">
                  {CRM_FIELD_LABELS[k]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map((rec, idx) => (
              <tr key={idx} className="border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors">
                <td className="px-3 py-2.5 text-right text-xs text-slate-600 font-mono">{idx + 1}</td>
                {CRM_FIELD_KEYS.map((k) => (
                  <td key={k} className="px-4 py-2.5 whitespace-nowrap max-w-[200px] truncate" title={rec[k] ?? ''}>
                    {k === 'crm_status' && rec.crm_status ? (
                      <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${STATUS_COLORS[rec.crm_status as CrmStatus]}`}>
                        {STATUS_LABELS[rec.crm_status as CrmStatus]}
                      </span>
                    ) : rec[k] ? (
                      <span className="text-slate-300">{rec[k]}</span>
                    ) : (
                      <span className="text-slate-700">—</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SkippedCardList({ records }: { records: { reason: string; original_data?: Record<string, string> }[] }) {
  return (
    <div className="space-y-3 max-h-[65vh] overflow-y-auto scrollbar-thin pr-1">
      {records.map((rec, idx) => (
        <SkippedCardItem key={idx} record={rec} index={idx + 1} />
      ))}
    </div>
  );
}

function SkippedCardItem({
  record,
  index,
}: {
  record: { reason: string; original_data?: Record<string, string> };
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);

  // Filter out empty or whitespace-only fields
  const dataEntries = Object.entries(record.original_data ?? {}).filter(
    ([, v]) => v && String(v).trim() !== ''
  );

  const visibleEntries = expanded ? dataEntries : dataEntries.slice(0, 3);
  const hiddenCount = dataEntries.length - 3;

  return (
    <div className="rounded-xl bg-slate-900 border border-slate-800 border-l-4 border-l-amber-500/80 p-4 transition-all hover:bg-slate-900/90">
      {/* Card Header: Row # and Skip reason badge */}
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-800/80 px-2 py-0.5 rounded">
            Row #{index}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-500/10 ring-1 ring-amber-500/30 px-2.5 py-1 rounded-full">
            <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {record.reason}
          </span>
        </div>
      </div>

      {/* Card Body: Clean Key-Value List, one per line */}
      {dataEntries.length === 0 ? (
        <p className="text-xs text-slate-600 italic">No original row data provided</p>
      ) : (
        <div className="space-y-1.5 mt-2 bg-slate-950/60 rounded-lg p-3 border border-slate-800/60">
          {visibleEntries.map(([k, v]) => (
            <div key={k} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 text-xs">
              <span className="font-medium text-slate-400 sm:w-44 shrink-0 truncate" title={k}>
                {k}
              </span>
              <span className="text-slate-200 font-mono break-all">{v}</span>
            </div>
          ))}

          {hiddenCount > 0 && (
            <div className="pt-2 mt-2 border-t border-slate-800/60">
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1"
              >
                {expanded ? (
                  <>
                    Show fewer fields
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                    </svg>
                  </>
                ) : (
                  <>
                    Show all {dataEntries.length} fields (+{hiddenCount} more)
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-500">
      <svg className="w-10 h-10 mb-3 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p className="text-sm">{message}</p>
    </div>
  );
}
