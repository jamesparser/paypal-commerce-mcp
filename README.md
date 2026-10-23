# OmegaCommerce

**PayPal AI Hackathon 2026.** Agents that can actually pay.

One stack, two money rails. Agents have identity (x401) and settle with each
other in USDC over x402. PayPal is how they settle with the human world:
payouts, invoices, checkout. A fund provenance dashboard shows every move.

Built on the official PayPal + AG Grid boilerplate.

## What this is

| Piece | What it does |
|---|---|
| **PayPal sandbox** | Orders, payouts, invoices. Meaningful PayPal integration. |
| **Commerce MCP** | Tools for agent identity, x402 quotes and settlement, PayPal payout, ledger. |
| **AG Grid endpoints** | One grid per PayPal endpoint the demo calls. |
| **AG Studio dashboard** | Joined report over PayPal data (from the boilerplate). |
| **Provenance page** (`/provenance`) | Fund-flow ledger across x401 / x402 / PayPal. |

## Quick start

Requires Node.js 20.9+ and PayPal sandbox REST app credentials from
[developer.paypal.com](https://developer.paypal.com/dashboard/applications/sandbox).

```bash
npm install
cp env.example .env.local   # fill PAYPAL_CLIENT_ID and PAYPAL_SECRET
npm run dev
```

Open http://localhost:3000 and http://localhost:3000/provenance.

Next.js loads the dotted `.env.local` (git-ignored). Never commit secrets.

### Environment

| Var | Required | Notes |
|---|---|---|
| `PAYPAL_CLIENT_ID` | yes | Sandbox REST app client id |
| `PAYPAL_SECRET` | yes | Sandbox REST app secret |
| `PAYPAL_MODE` | no | `sandbox` (default) or `live` |
| `AG_STUDIO` | no | AG Studio license key for `/dashboard` |
| `AG_STUDIO_OPENAI_API_KEY` | no | AI assistant on the dashboard |
| `KERNEL_API_KEY` | no | For headless agent browsers |
| `X402_MAX_USDC` | no | Cap for x402 settlements, default 100 |

## Commerce MCP server

`mcp/commerce-server.mjs` is a Model Context Protocol server over stdio.

```bash
npm install @modelcontextprotocol/sdk
node mcp/commerce-server.mjs
```

Tools:

- `agent_identity` - issue or read an agent x401 identity and wallet
- `request_payment` - x402 quote for an agent-to-agent USDC payment
- `settle_x402` - settle that payment (dry-run by default, live opt-in)
- `pay_with_paypal` - PayPal sandbox payout or invoice to a human
- `list_ledger` - full settlement ledger with provenance
- `get_paypal_balance` - PayPal sandbox balances

Register it in Claude Code or any MCP host:

```json
{
  "mcpServers": {
    "omega-commerce": {
      "command": "node",
      "args": ["mcp/commerce-server.mjs"],
      "env": {
        "PAYPAL_CLIENT_ID": "your-id",
        "PAYPAL_SECRET": "your-secret"
      }
    }
  }
}
```

## The demo

1. Issue agent identities (`agent_identity`).
2. Quote and settle an x402 payment between two agents (`request_payment` +
   `settle_x402`).
3. Pay a human contractor over PayPal (`pay_with_paypal`).
4. Open `/provenance` and show both rails side by side. Where did the funds
   come from, who got paid, which rail.

## Why this wins

- **Meaningful PayPal**: real sandbox payouts and invoices, not a mock.
- **Meaningful AI**: an MCP surface agents call, plus optional AG Studio AI.
- **Agentic commerce**: agents that pay each other and then settle outward.
- **Provenance**: a dashboard that answers "where did the money come from".

## Prize targets

- Best Use of Agentic Commerce
- Best Use of PayPal + AI
- Best Use of AG Grid
- Best Demo Delivery
- Overall 1st / 2nd / 3rd

A project can win one grand prize and one sponsor prize (or one honorable
mention and one sponsor prize). This project is built to compete on both.

## Sponsor tools used

| Tool | Used for |
|---|---|
| PayPal (sandbox) | Required. Payouts, invoices, balances. |
| AG Grid / AG Studio | Data grids and the joined dashboard. |
| Render | Hosting the demo. |
| OpenAI (optional) | AG Studio dashboard assistant. |

KERNEL is available for headless agent browsers and is not required by this demo.

## Submission notes

- Public repo with this `LICENSE` at the top.
- Demo video under 3 minutes on YouTube.
- English materials.
- Test credentials go in `.env.example` comments, never real values.

## Credits

Built on the official PayPal + AG Grid hackathon boilerplate:
https://github.com/paypaldev/hackathon-paypal-ag-grid-boilerplate

Hackathon: https://paypalaihackathon.devpost.com
