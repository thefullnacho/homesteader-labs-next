import { ArrowRight, Eye, Cpu, ShieldAlert, Sparkles } from 'lucide-react';
import FieldStationLayout from '@/components/ui/FieldStationLayout';
import BrutalistBlock from '@/components/ui/BrutalistBlock';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
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
    <FieldStationLayout stationId="FORAGER_GAME_LANDING" gridLines>
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">

        <header className="space-y-4">
          <Typography variant="small" className="font-mono opacity-50 uppercase tracking-widest">
            Homesteader_Labs // Forager_Game
          </Typography>
          <h1 className="text-4xl md:text-6xl font-bold uppercase tracking-tight leading-none">
            Can you beat<br />
            <span className="text-accent">the AI?</span>
          </h1>
          <p className="text-base md:text-lg opacity-70 max-w-2xl font-mono leading-relaxed">
            Ten rounds. Real iNaturalist photos. You pick a species — then watch how the vision model that runs the WALKING MAN PRO scored on the same image.
          </p>
        </header>

        <section>
          <Typography variant="h3" className="uppercase tracking-tight mb-6 text-accent">Pick_your_domain</Typography>
          <DomainPicker />
        </section>

        <section>
          <Typography variant="h3" className="uppercase tracking-tight mb-6 text-accent">What&apos;s_inside</Typography>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FEATURES.map(f => (
              <BrutalistBlock key={f.label}>
                <div className="flex items-start gap-3">
                  <f.icon size={20} className="text-accent shrink-0 mt-1" />
                  <div>
                    <p className="font-mono font-bold uppercase text-sm mb-1">{f.label}</p>
                    <p className="text-xs font-mono opacity-60 leading-relaxed">{f.sub}</p>
                  </div>
                </div>
              </BrutalistBlock>
            ))}
          </div>
        </section>

        <section>
          <Typography variant="h3" className="uppercase tracking-tight mb-6 text-accent">FAQ</Typography>
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

        <section>
          <BrutalistBlock variant="accent">
            <div className="text-center space-y-3 py-2">
              <Typography variant="h3" className="uppercase tracking-tight">The_real_device</Typography>
              <p className="text-sm font-mono opacity-80 max-w-md mx-auto leading-relaxed">
                You just played against the brain. The body is WALKING MAN PRO — a 5&quot; field tool that runs the same model in your pocket, offline, at 187 ms per scan.
              </p>
              <Button variant="secondary" size="lg" href="/shop/wlk-mn-pro/">
                See WALKING MAN PRO <ArrowRight size={18} className="ml-2" />
              </Button>
            </div>
          </BrutalistBlock>
        </section>

        <section className="border-t-2 border-foreground-primary/20 pt-6">
          <p className="text-[10px] font-mono opacity-50 uppercase tracking-widest leading-relaxed">
            Safety: This game is educational. Wild mushroom and plant identification carries fatal risk. Model output should not be acted on without independent verification by a qualified expert. Amatoxin poisoning has no reliable field antidote.
          </p>
        </section>

      </div>
    </FieldStationLayout>
  );
}
