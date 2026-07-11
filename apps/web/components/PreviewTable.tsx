const PREVIEW_LIMIT = 100;

interface Props {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
  fileName?: string;
}

export default function PreviewTable({ headers, rows, totalRows, fileName }: Props) {
  const displayRows  = rows.slice(0, PREVIEW_LIMIT);
  const isTruncated  = totalRows > PREVIEW_LIMIT;

  return (
    <div className="animate-slide-up">
      {/* Meta bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center">
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <div>
            {fileName && <p className="text-sm font-medium text-white">{fileName}</p>}
            <p className="text-xs text-slate-400">
              {headers.length} column{headers.length !== 1 ? 's' : ''} · {totalRows} row{totalRows !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {isTruncated && (
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30">
            Showing {PREVIEW_LIMIT} of {totalRows} rows
          </span>
        )}
      </div>

      {/* Scrollable table */}
      <div className="rounded-xl border border-slate-800 overflow-hidden">
        <div className="overflow-auto max-h-[55vh] scrollbar-thin">
          <table className="w-full text-sm border-collapse">
            {/* Sticky header */}
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-900 border-b border-slate-700">
                {/* Row number column */}
                <th className="px-3 py-3 text-right text-xs font-semibold text-slate-500 w-12 shrink-0 bg-slate-900">
                  #
                </th>
                {headers.map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-300 whitespace-nowrap bg-slate-900"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {displayRows.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className="border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors"
                >
                  {/* Row number */}
                  <td className="px-3 py-2.5 text-right text-xs text-slate-600 font-mono">
                    {rowIdx + 1}
                  </td>
                  {headers.map((h) => (
                    <td
                      key={h}
                      className="px-4 py-2.5 text-slate-300 whitespace-nowrap max-w-[220px] truncate"
                      title={row[h] ?? ''}
                    >
                      {row[h] || <span className="text-slate-600 italic">—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isTruncated && (
        <p className="mt-2.5 text-xs text-slate-500 text-center">
          Preview limited to {PREVIEW_LIMIT} rows. All {totalRows} rows will be processed on import.
        </p>
      )}
    </div>
  );
}
