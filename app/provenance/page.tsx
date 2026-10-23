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

type Identity = {
  agent_id: string;
  x401: string;
  wallet: string;
  paypal_email: string;
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
    agent_id: "omega-2",
    counterparty: "contractor@example.com",
    amount: 42.5,
    currency: "USD",
    status: "accepted",
    detail: "Sandbox payout batch",
  },
];

const AGENTS: Identity[] = [
  {
    agent_id: "omega-1",
    x401: "x401:omega-1",
    wallet: "0x7328…f82961",
    paypal_email: "sb-bi4p4753470877@business.example.com",
  },
  {
    agent_id: "omega-2",
    x401: "x401:omega-2",
    wallet: "0x788E…046B",
    paypal_email: "sb-5fchj53470869@business.example.com",
  },
];

export default function ProvenancePage() {
  const [rows, setRows] = useState<Row[]>(DEMO);
  const [railFilter, setRailFilter] = useState("all");
  const [agentId, setAgentId] = useState("omega-1");

  useEffect(() => {
    fetch("/api/ledger")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length) setRows(data);
      })
      .catch(() => {});
  }, []);

  const identity = useMemo(
    () => AGENTS.find((a) => a.agent_id === agentId) ?? AGENTS[0],
    [agentId]
  );

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (railFilter !== "all" && r.rail !== railFilter) return false;
      // show rows where this agent is sender or counterparty
      return r.agent_id === agentId || r.counterparty === agentId;
    });
  }, [rows, railFilter, agentId]);

  const totals = useMemo(() => {
    const scoped = rows.filter(
      (r) => r.agent_id === agentId || r.counterparty === agentId
    );
    const usdc = scoped
      .filter((r) => r.rail === "x402")
      .reduce((s, r) => s + (r.amount || 0), 0);
    const usd = scoped
      .filter((r) => r.rail === "paypal")
      .reduce((s, r) => s + (r.amount || 0), 0);
    return { usdc, usd, count: scoped.length };
  }, [rows, agentId]);

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-10">
      <header>
        <p className="text-sm uppercase tracking-widest text-zinc-500">OmegaCommerce</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Fund provenance
        </h1>
        <p className="mt-2 max-w-2xl text-zinc-600">
          Pick an agent identity. The ledger shows only that agent&apos;s settlements,
          on either rail. This is how you answer &quot;where did the funds come from&quot;
          without seeing someone else&apos;s money.
        </p>
      </header>

      {/* Identity picker */}
      <section className="rounded-xl border border-zinc-200 p-4">
        <p className="text-xs uppercase tracking-wider text-zinc-500">
          Viewing as (x401 identity)
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {AGENTS.map((a) => (
            <button
              key={a.agent_id}
              onClick={() => setAgentId(a.agent_id)}
              className={`rounded-full border px-4 py-2 text-sm ${
                agentId === a.agent_id
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-300 bg-white text-zinc-700"
              }`}
            >
              {a.agent_id}
            </button>
          ))}
        </div>
        <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-wider text-zinc-500">x401</dt>
            <dd className="mt-1 font-mono text-slate-900">{identity.x401}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-zinc-500">Agent wallet</dt>
            <dd className="mt-1 font-mono text-slate-900">{identity.wallet}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-zinc-500">
              PayPal sandbox account
            </dt>
            <dd className="mt-1 font-mono text-slate-900">{identity.paypal_email}</dd>
          </div>
        </dl>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card
          label="x402 USDC settled"
          value={`$${totals.usdc.toFixed(2)}`}
          hint="agent to agent"
        />
        <Card
          label="PayPal USD settled"
          value={`$${totals.usd.toFixed(2)}`}
          hint="invoices and payouts"
        />
        <Card label="Ledger events" value={String(totals.count)} hint={`for ${agentId}`} />
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

function Card({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 p-4">
      <p className="text-xs uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
      <p className="text-xs text-zinc-500">{hint}</p>
    </div>
  );
}
