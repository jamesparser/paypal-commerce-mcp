"use client";

import { useEffect, useMemo, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";

ModuleRegistry.registerModules([AllCommunityModule]);

type Row = {
  id: string;
  ts: string;
  type: string;
  rail: "x401" | "x402" | "paypal";
  agent_id: string;
  counterparty?: string;
  amount?: number;
  currency?: string;
  status?: string;
  detail?: string;
};

const DEMO: Row[] = [
  {
    id: "led_demo_1",
    ts: new Date().toISOString(),
    type: "identity",
    rail: "x401",
    agent_id: "omega-1",
    detail: "identity issued",
    status: "ok",
  },
  {
    id: "led_demo_2",
    ts: new Date().toISOString(),
    type: "settle_x402_dryrun",
    rail: "x402",
    agent_id: "omega-1",
    counterparty: "omega-2",
    amount: 0.25,
    currency: "USDC",
    status: "dry-run",
    detail: "EIP-3009 TransferWithAuthorization",
  },
  {
    id: "led_demo_3",
    ts: new Date().toISOString(),
    type: "paypal_payout",
    rail: "paypal",
    agent_id: "omega-1",
    counterparty: "contractor@example.com",
    amount: 42.5,
    currency: "USD",
    status: "accepted",
    detail: "Sandbox payout batch",
  },
];

export default function ProvenancePage() {
  const [rows, setRows] = useState<Row[]>(DEMO);
  const [railFilter, setRailFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/api/ledger")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length) setRows(data);
      })
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    if (railFilter === "all") return rows;
    return rows.filter((r) => r.rail === railFilter);
  }, [rows, railFilter]);

  const totals = useMemo(() => {
    const usdc = rows.filter((r) => r.rail === "x402").reduce((s, r) => s + (r.amount || 0), 0);
    const usd = rows.filter((r) => r.rail === "paypal").reduce((s, r) => s + (r.amount || 0), 0);
    return { usdc, usd, count: rows.length };
  }, [rows]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-8">
        <p className="text-sm uppercase tracking-widest text-zinc-500">OmegaCommerce</p>
        <h1 className="text-3xl font-semibold tracking-tight">Fund provenance</h1>
        <p className="mt-2 max-w-2xl text-zinc-600">
          Every settlement an agent makes, on either rail. x401 is identity, x402 is
          agent-to-agent USDC, PayPal is the human economy. Click a row to see where the
          money came from and where it went.
        </p>
      </header>

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card label="x402 USDC settled" value={`$${totals.usdc.toFixed(2)}`} hint="agent to agent" />
        <Card label="PayPal USD settled" value={`$${totals.usd.toFixed(2)}`} hint="invoices and payouts" />
        <Card label="Ledger events" value={String(totals.count)} hint="all rails" />
      </section>

      <div className="mb-3 flex gap-2">
        {["all", "x401", "x402", "paypal"].map((r) => (
          <button
            key={r}
            onClick={() => setRailFilter(r)}
            className={`rounded-full px-3 py-1 text-sm border ${
              railFilter === r
                ? "bg-zinc-900 text-white border-zinc-900"
                : "bg-white text-zinc-700 border-zinc-300"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="h-[420px] w-full rounded-lg border border-zinc-200">
        <AgGridReact
          rowData={filtered}
          columnDefs={[
            { field: "ts", headerName: "Time", flex: 1 },
            { field: "agent_id", headerName: "Agent (x401)", flex: 1 },
            { field: "counterparty", headerName: "Counterparty", flex: 1 },
            { field: "rail", headerName: "Rail", width: 100 },
            { field: "type", headerName: "Type", flex: 1 },
            { field: "amount", headerName: "Amount", width: 110 },
            { field: "currency", headerName: "CCY", width: 80 },
            { field: "status", headerName: "Status", width: 110 },
            { field: "detail", headerName: "Provenance", flex: 1.4 },
          ]}
          defaultColDef={{ sortable: true, filter: true, resizable: true }}
        />
      </div>
    </main>
  );
}

function Card({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 p-4">
      <p className="text-xs uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      <p className="text-xs text-zinc-500">{hint}</p>
    </div>
  );
}
