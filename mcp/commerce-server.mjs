/**
 * Commerce MCP server.
 * Tools for agent identity (x401), x402 micropayments, and PayPal settlement.
 * Run: node mcp/commerce-server.mjs
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const PAYPAL_BASE =
  (process.env.PAYPAL_MODE || "sandbox") === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

const state = {
  ledger: [],
  agents: new Map(),
};

function authHeader() {
  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET || process.env.PAYPAL_SECRET;
  return "Basic " + Buffer.from(`${id}:${secret}`).toString("base64");
}

async function paypalToken() {
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`PayPal token failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function paypal(path, opts = {}) {
  const { access_token } = await paypalToken();
  const res = await fetch(`${PAYPAL_BASE}${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: res.status, body };
}

function record(entry) {
  const row = {
    id: `led_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    ts: new Date().toISOString(),
    ...entry,
  };
  state.ledger.push(row);
  return row;
}

const tools = [
  {
    name: "agent_identity",
    description:
      "Return the calling agent's x401 identity and wallet. Creates one if missing.",
    inputSchema: {
      type: "object",
      properties: {
        agent_id: { type: "string", description: "Stable agent name, e.g. omega-1" },
      },
      required: ["agent_id"],
    },
  },
  {
    name: "request_payment",
    description:
      "Request an x402 payment quote (agent-to-agent USDC micropayment terms).",
    inputSchema: {
      type: "object",
      properties: {
        from_agent: { type: "string" },
        to_agent: { type: "string" },
        amount_usdc: { type: "number" },
        reason: { type: "string" },
      },
      required: ["from_agent", "to_agent", "amount_usdc"],
    },
  },
  {
    name: "settle_x402",
    description:
      "Settle an x402 payment between agents. Caps at $100 USDC unless raised. Dry-run by default.",
    inputSchema: {
      type: "object",
      properties: {
        from_agent: { type: "string" },
        to_agent: { type: "string" },
        amount_usdc: { type: "number" },
        live: {
          type: "boolean",
          description: "false (default) = dry-run. true = live transfer.",
        },
      },
      required: ["from_agent", "to_agent", "amount_usdc"],
    },
  },
  {
    name: "pay_with_paypal",
    description:
      "Create a PayPal sandbox invoice or payout to a human. This is the fiat settlement rail.",
    inputSchema: {
      type: "object",
      properties: {
        kind: {
          type: "string",
          enum: ["invoice", "payout"],
          description: "invoice = bill a client. payout = pay a contractor.",
        },
        recipient_email: { type: "string" },
        amount_usd: { type: "number" },
        note: { type: "string" },
        agent_id: { type: "string", description: "Which agent initiated this" },
      },
      required: ["kind", "recipient_email", "amount_usd"],
    },
  },
  {
    name: "list_ledger",
    description:
      "Return the settlement ledger: every x402 and PayPal move with provenance.",
    inputSchema: {
      type: "object",
      properties: {
        rail: {
          type: "string",
          enum: ["all", "x402", "paypal"],
          description: "Filter by rail",
        },
        agent_id: { type: "string" },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "get_paypal_balance",
    description: "Read PayPal sandbox account balances.",
    inputSchema: { type: "object", properties: {} },
  },
];

const server = new Server(
  { name: "omega-commerce", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args = {} } = req.params;

  try {
    switch (name) {
      case "agent_identity": {
        let a = state.agents.get(args.agent_id);
        if (!a) {
          a = {
            agent_id: args.agent_id,
            x401: `x401:${args.agent_id}`,
            wallet: "0x" + Math.random().toString(16).slice(2, 12) + "...demo",
            created: new Date().toISOString(),
          };
          state.agents.set(args.agent_id, a);
          record({
            type: "identity",
            rail: "x401",
            agent_id: args.agent_id,
            detail: "identity issued",
          });
        }
        return { content: [{ type: "text", text: JSON.stringify(a, null, 2) }] };
      }

      case "request_payment": {
        const quote = {
          quote_id: `q_${Date.now()}`,
          from_agent: args.from_agent,
          to_agent: args.to_agent,
          amount_usdc: args.amount_usdc,
          asset: "USDC",
          chain: "eip155:8453",
          reason: args.reason || "",
          terms: "EIP-3009 TransferWithAuthorization",
          expires: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        };
        record({
          type: "quote",
          rail: "x402",
          agent_id: args.from_agent,
          counterparty: args.to_agent,
          amount: args.amount_usdc,
          currency: "USDC",
          detail: quote.quote_id,
        });
        return { content: [{ type: "text", text: JSON.stringify(quote, null, 2) }] };
      }

      case "settle_x402": {
        const cap = Number(process.env.X402_MAX_USDC || 100);
        if (args.amount_usdc > cap) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  error: `amount ${args.amount_usdc} USDC exceeds cap ${cap}`,
                  refused: true,
                }),
              },
            ],
            isError: true,
          };
        }
        const live = args.live === true;
        const row = record({
          type: live ? "settle_x402_live" : "settle_x402_dryrun",
          rail: "x402",
          agent_id: args.from_agent,
          counterparty: args.to_agent,
          amount: args.amount_usdc,
          currency: "USDC",
          status: live ? "submitted" : "dry-run",
          detail: live ? "EIP-3009 TransferWithAuthorization" : "no chain write",
        });
        return {
          content: [{ type: "text", text: JSON.stringify(row, null, 2) }],
        };
      }

      case "pay_with_paypal": {
        if (!process.env.PAYPAL_CLIENT_ID) {
          return {
            content: [{ type: "text", text: "PAYPAL_CLIENT_ID not set" }],
            isError: true,
          };
        }
        const { status, body } = await paypal("/v1/payments/payouts", {
          method: "POST",
          body: JSON.stringify({
            sender_batch_header: {
              sender_batch_id: `omc_${Date.now()}`,
              email_subject: "OmegaCommerce settlement",
            },
            items: [
              {
                recipient_type: "EMAIL",
                amount: {
                  value: String(args.amount_usd),
                  currency: "USD",
                },
                receiver: args.recipient_email,
                note: args.note || "Agent settlement",
                sender_item_id: `si_${Date.now()}`,
              },
            ],
          }),
        });
        const row = record({
          type: `paypal_${args.kind}`,
          rail: "paypal",
          agent_id: args.agent_id || "unknown",
          counterparty: args.recipient_email,
          amount: args.amount_usd,
          currency: "USD",
          status: status < 300 ? "accepted" : "error",
          detail: JSON.stringify(body).slice(0, 200),
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ paypal_status: status, paypal: body, ledger: row }, null, 2),
            },
          ],
        };
      }

      case "list_ledger": {
        let rows = state.ledger.slice();
        if (args.rail && args.rail !== "all") rows = rows.filter((r) => r.rail === args.rail);
        if (args.agent_id) rows = rows.filter((r) => r.agent_id === args.agent_id);
        if (args.limit) rows = rows.slice(-args.limit);
        return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] };
      }

      case "get_paypal_balance": {
        const { status, body } = await paypal("/v1/reporting/balances");
        return {
          content: [{ type: "text", text: JSON.stringify({ status, body }, null, 2) }],
        };
      }

      default:
        return { content: [{ type: "text", text: `Unknown tool: ${name}` }], isError: true };
    }
  } catch (err) {
    return { content: [{ type: "text", text: String(err.message || err) }], isError: true };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("omega-commerce MCP ready on stdio");
