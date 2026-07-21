import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle, Download } from 'lucide-react';
import { isSurvivalPlanPublic } from '@/lib/survivalPlan/visibility';
import { Stamp } from '@/components/field/kit';

export const metadata = {
  title: 'Plan Generated',
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export default async function SuccessPage(props: PageProps) {
  const params = await props.params;
  if (!isSurvivalPlanPublic()) notFound();

  const downloadUrl = `/api/survival-garden-plan/regenerate/?orderId=${encodeURIComponent(params.orderId)}`;

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      {/* Receipt card */}
      <div className="card-paper grain p-6 md:p-8">
        <div className="relative z-[2]">
          <div className="flex items-center justify-between gap-3 border-b-2 border-ink pb-4 mb-5">
            <div className="flex items-center gap-2 text-moss">
              <CheckCircle size={20} />
              <span className="font-mono text-[0.68rem] uppercase tracking-[0.18em]">Order confirmed</span>
            </div>
            <Stamp color="text-moss" rotate="-1.6deg">Paid</Stamp>
          </div>

          <h1 className="font-display uppercase text-3xl sm:text-4xl leading-[0.98] text-balance">
            Your plan is ready.
          </h1>
          <p className="mt-4 text-[0.95rem] text-ink/80 leading-relaxed">
            We&apos;ve generated your personalized survival garden plan and
            emailed a copy to your inbox. Download below — the link stays active
            for 30 days.
          </p>

          <a
            href={downloadUrl}
            download
            className="mt-6 inline-flex items-center justify-center bg-ink text-paper border-2 border-ink px-6 py-3 font-mono text-[0.78rem] uppercase tracking-wider hover:bg-marker hover:border-marker transition-colors"
          >
            <Download size={16} className="mr-2" />
            Download plan PDF
          </a>

          <p className="mt-5 font-mono text-[0.64rem] uppercase tracking-[0.18em] text-ink/40">
            Order ID: {params.orderId}
          </p>
        </div>
      </div>

      {/* Next steps ledger */}
      <div className="card-paper grain p-6 md:p-8 mt-6">
        <div className="relative z-[2]">
          <p className="font-display uppercase text-lg border-b-2 border-ink pb-2 mb-4">Next steps</p>
          <ul className="space-y-3 text-[0.95rem] text-ink/85 leading-relaxed">
            <li className="flex gap-3">
              <span className="font-mono text-sm font-semibold text-marker shrink-0">01</span>
              Save the PDF locally. It&apos;s yours forever.
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-sm font-semibold text-marker shrink-0">02</span>
              Scan the QR code inside to access the live companion page.
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-sm font-semibold text-marker shrink-0">03</span>
              Cross-reference frost dates with{' '}
              <Link
                className="underline decoration-marker decoration-2 underline-offset-4 hover:text-marker"
                href="/tools/weather/"
              >
                your local weather forecast
              </Link>
              .
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-sm font-semibold text-marker shrink-0">04</span>
              Order seeds from the recommended vendor list inside the PDF.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
