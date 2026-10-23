import Link from 'next/link';

const rails = [
  {
    label: 'x402 USDC',
    detail: 'Agent to agent settlement',
    body: 'Agents carry identity on x401 and pay each other in USDC over x402. Fast, cheap, machine native.',
  },
  {
    label: 'PayPal',
    detail: 'The human economy',
    body: 'When money has to reach a person, OmegaCommerce settles over PayPal: invoices, payouts, checkout.',
  },
  {
    label: 'Provenance',
    detail: 'Where funds came from',
    body: 'Every move on both rails lands in one AG Grid ledger: agent, counterparty, rail, amount, source.',
  },
];

const links = [
  { href: '/provenance', label: 'Fund provenance', detail: 'Dual-rail settlement ledger' },
  { href: '/dashboard', label: 'AG Studio dashboard', detail: 'Joined PayPal report' },
  { href: '/products', label: 'Catalog products', detail: 'GET /v1/catalogs/products' },
  { href: '/plans', label: 'Billing plans', detail: 'GET /v1/billing/plans' },
  { href: '/invoices', label: 'Invoices', detail: 'GET /v2/invoicing/invoices' },
  { href: '/transactions', label: 'Transactions', detail: 'GET /v1/reporting/transactions' },
  { href: '/balances', label: 'Balances', detail: 'GET /v1/reporting/balances' },
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-3xl p-16 font-paypal text-pp-ink">
      <p className="text-sm uppercase tracking-widest text-pp-muted">OmegaCommerce</p>
      <h1 className="mt-2 text-[32px] font-semibold leading-tight text-pp-navy">
        Agents that can actually pay
      </h1>
      <p className="mt-3 max-w-2xl text-pp-ink">
        One stack, two money rails. Agents have identity on x401 and settle with each
        other in USDC over x402. PayPal is how they settle with the human economy.
        A fund provenance dashboard shows where every dollar came from.
      </p>

      <section className="mt-10 grid gap-4 sm:grid-cols-3">
        {rails.map((r) => (
          <div key={r.label} className="rounded-xl border border-pp-border p-4">
            <p className="text-xs uppercase tracking-wider text-pp-muted">{r.label}</p>
            <p className="mt-1 font-semibold text-pp-navy">{r.detail}</p>
            <p className="mt-2 text-sm text-pp-ink">{r.body}</p>
          </div>
        ))}
      </section>

      <h2 className="mt-12 text-sm font-semibold uppercase tracking-wider text-pp-muted">
        Explore
      </h2>
      <ul className="mt-2 divide-y divide-pp-border border-y border-pp-border">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="flex items-baseline justify-between gap-4 py-3 hover:text-pp-blue"
            >
              <span className="font-semibold">{l.label} →</span>
              <code className="text-sm text-pp-muted">{l.detail}</code>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
