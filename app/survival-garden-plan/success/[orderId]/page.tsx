import Link from 'next/link';
import { CheckCircle, Download } from 'lucide-react';
import FieldStationLayout from '@/components/ui/FieldStationLayout';
import BrutalistBlock from '@/components/ui/BrutalistBlock';
import Typography from '@/components/ui/Typography';

export const metadata = {
  title: 'Plan Generated',
  robots: { index: false, follow: false },
};

interface PageProps {
  params: { orderId: string };
}

export default function SuccessPage({ params }: PageProps) {
  const downloadUrl = `/api/survival-garden-plan/regenerate/?orderId=${encodeURIComponent(params.orderId)}`;

  return (
    <FieldStationLayout stationId="SGP_SUCCESS" gridLines>
      <div className="max-w-2xl mx-auto py-12 px-4 space-y-6">

        <div className="flex items-center gap-3 text-accent">
          <CheckCircle size={24} />
          <Typography variant="small" className="font-mono uppercase tracking-widest">Order Confirmed</Typography>
        </div>

        <h1 className="text-3xl md:text-5xl font-bold uppercase tracking-tight leading-none">
          Your plan is<br />
          <span className="text-accent">ready.</span>
        </h1>

        <BrutalistBlock refTag="DOWNLOAD">
          <div className="space-y-4">
            <p className="text-sm font-mono opacity-70">
              We&apos;ve generated your personalized survival garden plan and emailed a copy to your inbox. Download below — link stays active for 30 days.
            </p>

            <a
              href={downloadUrl}
              download
              className="inline-flex items-center justify-center font-bold uppercase bg-accent text-white border-2 border-accent px-6 py-3 text-sm shadow-brutalist"
            >
              <Download size={16} className="mr-2" />
              Download_Plan_PDF
            </a>

            <p className="text-[10px] font-mono opacity-40 uppercase">
              Order ID: {params.orderId}
            </p>
          </div>
        </BrutalistBlock>

        <BrutalistBlock>
          <div className="space-y-3">
            <Typography variant="h3" className="uppercase tracking-tight">Next_Steps</Typography>
            <ul className="text-xs font-mono opacity-70 space-y-2 leading-relaxed">
              <li>• Save the PDF locally. It&apos;s yours forever.</li>
              <li>• Scan the QR code inside to access the live companion page.</li>
              <li>• Cross-reference frost dates with <Link className="text-accent underline" href="/tools/weather/">your local weather forecast</Link>.</li>
              <li>• Order seeds from the recommended vendor list inside the PDF.</li>
            </ul>
          </div>
        </BrutalistBlock>

      </div>
    </FieldStationLayout>
  );
}
