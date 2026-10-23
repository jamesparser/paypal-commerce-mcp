import { NextResponse } from "next/server";

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

const ledger: Row[] = [];

export async function GET() {
  return NextResponse.json(ledger);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const row: Row = {
    id: `led_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    ts: new Date().toISOString(),
    type: body.type || "event",
    rail: body.rail || "x402",
    agent_id: body.agent_id || "unknown",
    counterparty: body.counterparty,
    amount: body.amount,
    currency: body.currency,
    status: body.status || "recorded",
    detail: body.detail,
  };
  ledger.push(row);
  return NextResponse.json(row, { status: 201 });
}
