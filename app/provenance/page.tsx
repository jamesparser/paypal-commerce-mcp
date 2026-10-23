"use client";

import { useEffect, useMemo, useState } from "react";
import { DataGrid } from "@/app/(endpoints)/data-grid";

type Row = {
  id: string;
  ts: string;
  type: string;
  rail: string;
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
    ts: new Date(Date.now() - 3600000).toISOString(),
    type: "identity",
    rail: "x401",
    agent_id: "omega-1",
    detail: "identity issued",
    status: "ok",
    currency: "USD",
    amount: 0,
  },
  {
    id: "led_demo_2",
    ts: new Date(Date.now() - 3000000).toISOString(),
    type: "identity",
    rail: "x401",
    agent_id: "omega-2",
    detail: "identity issued",
    status: "ok",
    currency: "USD",
    amount: 0,
  },
  {
    id: "led_demo_3",
    ts: new Date(Date.now() - 2400000).toISOString(),
    type: "request_payment",
    rail: "x402",
    agent_id: "omega-1",
    counterparty: "omega-2",
    amount: 1.25,
    currency: "USDC",
    status: "quoted",
    detail: "quote q_8842 · EIP-3009 terms",
  },
  {
    id: "led_demo_4",
    ts: new Date(Date.now() - 1800000).toISOString(),
    type: "settle_x402",
    rail: "x402",
    agent_id: "omega-1",
    counterparty: "omega-2",
    amount: 1.25,
    currency: "USDC",
    status: "settled",
    detail: "TransferWithAuthorization · Base",
  },
  {
    id: "led_demo_5",
    ts: new Date(Date.now() - 1200000).toISOString(),
    type: "settle_x402",
    rail: "x402",
    agent_id: "omega-2",
    counterparty: "omega-1",
    amount: 0.4,
    currency: "USDC",
    status: "settled",
    detail: "TransferWithAuthorization · Base",
  },
  {
    id: "led_demo_6",
    ts: new Date(Date.now() - 600000).toISOString(),
    type: "paypal_invoice",
    rail: "paypal",
    agent_id: "omega-1",
    counterparty: "client@example.com",
    amount: 120,
    currency: "USD",
    status: "sent",
    detail: "INV-2041 · sandbox invoice",
  },
  {
    id: "led_demo_7",
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
  const [railFilter, setRailFilter] = useState("all");

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
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-10">
      <header>
        <p className="text-sm uppercase tracking-widest text-zinc-500">OmegaCommerce</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Fund provenance</h1>
        <p className="mt-2 max-w-2xl text-zinc-600">
          Every settlement an agent makes, on either rail. x401 is identity, x402 is
          agent-to-agent USDC, PayPal is the human economy. Click a row to see where the
          money came from and where it went.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card label="x402 USDC settled" value={`$${totals.usdc.toFixed(2)}`} hint="agent to agent" />
        <Card label="PayPal USD settled" value={`$${totals.usd.toFixed(2)}`} hint="invoices and payouts" />
        <Card label="Ledger events" value={String(totals.count)} hint="all rails" />
      </section>

      <div className="flex gap-2">
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

      <div className="flex h-[480px] flex-col">
        <DataGrid
          rows={filtered}
          columns={[
            { field: "ts", headerName: "Time" },
            { field: "agent_id", headerName: "Agent (x401)" },
            { field: "counterparty", headerName: "Counterparty" },
            { field: "rail", headerName: "Rail" },
            { field: "type", headerName: "Type" },
            { field: "amount", headerName: "Amount", type: "money" },
            { field: "status", headerName: "Status" },
            { field: "detail", headerName: "Provenance" },
          ]}
        />
      </div>
    </main>
  );
}

function Card({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 p-4">
      <p className="text-xs uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
      <p className="text-xs text-zinc-500">{hint}</p>
    </div>
  );
}
