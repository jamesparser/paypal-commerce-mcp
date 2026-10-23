'use client';

// The AG Grid used by every endpoint page. Pages are server components, so the columns they pass
// must be plain data, with no functions. Money columns name the column type below
// (`type: 'money'`), which keeps the formatter here on the client; date columns set the grid's
// built-in `cellDataType: 'dateString'` ('YYYY-MM-DD') or `'dateTimeString'` ('YYYY-MM-DDThh:mm:ssZ').

import { useState } from 'react';
import {
  ClientSideRowModelModule,
  ColumnAutoSizeModule,
  DateFilterModule,
  enableDevValidations,
  NumberFilterModule,
  QuickFilterModule,
  TextFilterModule,
  themeQuartz,
  type ColDef,
  type ColTypeDefs,
  type ValueFormatterParams,
} from 'ag-grid-community';
import { AgGridProvider, AgGridReact } from 'ag-grid-react';

if (process.env.NODE_ENV !== 'production') {
  enableDevValidations();
}

// Only the grid features these pages use: in-memory rows, filters for each column type, the
// search box (quick filter) and sizing columns to their content.
const modules = [
  ClientSideRowModelModule,
  TextFilterModule,
  NumberFilterModule,
  DateFilterModule,
  QuickFilterModule,
  ColumnAutoSizeModule,
];

// Same PayPal tokens as the dashboard (app/globals.css).
const theme = themeQuartz.withParams({
  fontFamily: 'var(--pp-font)',
  accentColor: 'var(--pp-blue)',
  foregroundColor: 'var(--pp-ink)',
  borderColor: 'var(--pp-border)',
  headerFontWeight: 600,
  headerTextColor: 'var(--pp-muted)',
  rowHoverColor: 'var(--pp-highlight)',
});

export type Row = Record<string, unknown>;

// Money columns hold numbers and format them in the row's `currency`.
const formatMoney = ({ value, data }: ValueFormatterParams<Row>) => {
  if (typeof value !== 'number') return '';
  const code = typeof data?.currency === 'string' ? data.currency : '';
  // Crypto codes like USDC are not ISO 4217; Intl throws on them.
  if (!code || !/^[A-Z]{3}$/.test(code)) {
    return code ? `${value.toLocaleString('en-US', { maximumFractionDigits: 6 })} ${code}` : value.toLocaleString('en-US');
  }
  try {
    return value.toLocaleString('en-US', { style: 'currency', currency: code });
  } catch {
    return `${value.toLocaleString('en-US')} ${code}`;
  }
};

const columnTypes: ColTypeDefs<Row> = {
  money: { valueFormatter: formatMoney, filter: 'agNumberColumnFilter' },
};

const defaultColDef: ColDef<Row> = { filter: true };
const autoSizeStrategy = { type: 'fitCellContents' } as const;

export function DataGrid({ rows, columns }: { rows: Row[]; columns: ColDef<Row>[] }) {
  const [search, setSearch] = useState('');

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search all columns…"
        aria-label="Search all columns"
        className="h-10 w-72 rounded border border-pp-border px-3 text-sm outline-none focus:border-pp-blue"
      />
      <div className="min-h-0 flex-1">
        <AgGridProvider modules={modules}>
          <AgGridReact
            theme={theme}
            rowData={rows}
            columnDefs={columns}
            columnTypes={columnTypes}
            defaultColDef={defaultColDef}
            quickFilterText={search}
            autoSizeStrategy={autoSizeStrategy}
            enableCellTextSelection
          />
        </AgGridProvider>
      </div>
    </div>
  );
}
