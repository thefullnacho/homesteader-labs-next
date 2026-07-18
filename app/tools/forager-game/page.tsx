import Link from 'next/link';
import { ArrowRight, Eye, Cpu, ShieldAlert, Sparkles } from 'lucide-react';
import { SectionHead, Stamp } from '@/components/field/kit';
import FaqAccordion from '@/components/ui/FaqAccordion';
import DomainPicker from '@/components/foragerGame/DomainPicker';

const FEATURES = [
  { icon: Eye,         label: 'Same image, same options', sub: 'You and the AI both see the same iNaturalist photo and pick from the same 4 species options' },
  { icon: Cpu,         label: '187 ms per scan',          sub: 'The model runs on a 4 TOPS Hailo chip in the WALKING MAN PRO — offline, in your hand, faster than you can read' },
  { icon: ShieldAlert, label: 'Real deadly lookalikes',   sub: 'Distractors prefer the documented lookalikes a forager actually confuses. Get one wrong → see why' },
  { icon: Sparkles,    label: '109 curated rounds',       sub: 'Across berries, edible mushrooms, psilocybes, and medicinal plants — all CC-BY / CC-0 with full attribution' },
];

const FAQS = [
  {
    q: "Is the AI's score really fair?",
    a: "The AI's prediction is restricted to the same 4 options you see — it can't pick a class that wasn't on your screen. Confidence shown is the softmax over those 4 options. This is the same model that runs on WALKING MAN PRO, just running on a browser-friendly CPU build for the curated dataset.",
  },
  {
    q: "Where do the images come from?",
    a: "Research-grade observations from iNaturalist, filtered to CC-BY and CC-0 licenses so we can use them in a marketing context. Every image shows the observer name, license, and a link back to the original observation.",
  },
  {
    q: "What model is this?",
    a: "An EfficientNet Lite2 classifier, separately trained for each domain (berries, edible mushrooms, psilocybes + deadly lookalikes, medicinal plants). The training pipeline and ONNX exports are open-source under Apache 2.0 on the forager_ml repo.",
  },
  {
    q: "Will the device replace expert identification?",
    a: "No. Wild plant and mushroom identification carries fatal risk — amatoxin poisoning has no field antidote. Both the game and the device are educational and confirmatory tools. Always verify with an expert before consumption decisions.",
  },
  {
    q: "Why is the AI sometimes wrong?",
    a: "Vision models struggle with the same things humans do — partial views, atypical specimens, juvenile vs mature growth stages, and especially the visually-similar deadly lookalikes the model was trained to flag. The mycologist domain (psilocybes vs Galerinas) is the hardest by design, and the AI scores roughly 60% there — your best chance to win.",
  },
  {
    q: "How do I get the actual device?",
    a: "WALKING MAN PRO is the field tool — Raspberry Pi 5 + Hailo 8L accelerator + 5\" e-ink display + offline voice trigger. Runs the same models you just played against, plus the domain router that picks the right expert automatically. Available at /shop/wlk-mn-pro/.",
  },
];

export default function ForagerGameLanding() {
  return (
    <>
      {/* Header band */}
      <section className="bg-kraft grain border-b-2 border-ink relative">
        <div className="max-w-6xl mx-auto px-4 pt-10 pb-10 relative z-[2]">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-ink/60 mb-5">
            <Link href="/tools/" className="hover:text-marker underline underline-offset-4">
              Tools
            </Link>
            <span>/</span>
            <span>Forager Game</span>
            <span className="ml-auto">10 rounds · 4 domains</span>
          </div>
          <div className="flex flex-wrap gap-2 mb-5">
            <Stamp color="text-moss">Real photos, real lookalikes</Stamp>
            <Stamp color="text-slateblue" rotate="1.6deg">Runs offline on device</Stamp>
          </div>
          <h1 className="font-display uppercase text-3xl sm:text-5xl leading-[0.98] max-w-3xl text-balance">
            Can you beat the AI?
          </h1>
          <p className="mt-4 text-lg md:text-xl leading-relaxed max-w-2xl text-ink/85 italic">
            Ten rounds. Real iNaturalist photos. You pick a species — then see how
            the vision model that runs the WALKING MAN PRO scored on the same image.
          </p>
          <p className="mt-3 font-hand font-semibold text-marker text-xl rotate-[-1deg]">
            ✎ the mycologist rounds are your best chance to win
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 pt-12 pb-12">
        {/* Domain picker */}
        <section>
          <SectionHead no="§1" title="Pick your domain" right="10 rounds each" />
          <DomainPicker />
        </section>

        {/* What's inside */}
        <section className="mt-14">
          <SectionHead no="§2" title="What's inside" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FEATURES.map((f) => (
              <div key={f.label} className="card-paper grain p-5">
                <div className="flex items-start gap-3 relative z-[2]">
                  <f.icon size={20} className="text-marker shrink-0 mt-1" />
                  <div>
                    <p className="font-mono font-bold uppercase text-sm mb-1">{f.label}</p>
                    <p className="text-[0.95rem] text-ink/80 leading-snug">{f.sub}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-14">
          <SectionHead no="§3" title="Questions on file" />
          <FaqAccordion faqs={FAQS} prefix="GAME" defaultOpen={0} />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: FAQS.map(({ q, a }) => ({
                  "@type": "Question",
                  name: q,
                  acceptedAnswer: { "@type": "Answer", text: a },
                })),
              }),
            }}
          />
        </section>

        {/* Device CTA */}
        <section className="mt-14 no-print">
          <div className="bg-ink text-paper border-2 border-ink p-6 md:p-8 text-center">
            <p className="font-display uppercase text-xl md:text-2xl">The real device</p>
            <p className="mt-3 text-[0.95rem] text-paper/75 max-w-md mx-auto leading-relaxed">
              You just played against the brain. The body is WALKING MAN PRO — a
              5&quot; field tool that runs the same model in your pocket, offline,
              at 187 ms per scan.
            </p>
            <Link
              href="/shop/wlk-mn-pro/"
              className="mt-5 inline-flex items-center justify-center gap-2 bg-paper text-ink border-2 border-paper px-6 py-3 font-mono text-[0.78rem] uppercase tracking-wider hover:bg-marker hover:border-marker hover:text-paper transition-colors"
            >
              See WALKING MAN PRO <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        {/* Safety + station footer */}
        <p className="mt-12 text-center font-mono text-[0.64rem] uppercase tracking-[0.3em] text-ink/40 border-t border-ink/20 pt-6">
          Educational only · Never eat a wild ID · Amatoxin has no field antidote
        </p>
      </div>
    </>
  );
}
