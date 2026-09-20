import type { Metadata } from "next";
import Link from "next/link";
import { SectionHead, Stamp, MarginNote } from "@/components/field/kit";

export const metadata: Metadata = {
  title: "Open Research | Homesteader Labs",
  description:
    "We collect one thing: ground truth at a place and a time. Every observation contributed has to move a model or move a number in a tool, or we do not ask for it.",
};

/* CONFIRM BEFORE SHIP. The Space org is from memory, not verified. */
const LINKS = {
  space: "https://huggingface.co/spaces/build-small-hackathon/forager-field-station",
  sightings: "https://huggingface.co/datasets/HomesteaderLabs/forager-sightings",
  models: "https://huggingface.co/HomesteaderLabs/forager-field-station-models",
};

/* FILL BEFORE SHIP. Do not ship invented numbers on this page of all pages. */
const STATS = {
  sightings: "TK",
  contributors: "TK",
  harvestReports: "TK",
};

const asked = [
  {
    signal: "A photo of a thing you could not name",
    consumer: "Retrains the classifier that runs on the handheld",
    status: "Running",
    tone: "text-moss",
  },
  {
    signal: "A photo the model refused to call",
    consumer: "The hardest training samples that exist. Top of the pile",
    status: "Running",
    tone: "text-moss",
  },
  {
    signal: "The date you actually harvested, and your zone",
    consumer: "Days-to-maturity in the planting calendar",
    status: "In design",
    tone: "text-slateblue",
  },
];

/* Hub links leave the site; internal ones stay on the router. */
function Out({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={className} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

const notAsked = [
  ["When your pests showed up", "Nothing we have shipped reads it yet. Ask us again when something does."],
  ["How your season is going, in your own words", "Lovely to read. Feeds nothing. We are not building a diary."],
  ["Where you found it, to the meter", "Your patch is your business. Zone-level or nothing."],
  ["Anything at all in the background", "Contribution is a thing you do on purpose or it does not happen."],
];

export default function ResearchPage() {
  return (
    <>
      {/* Header band */}
      <section className="bg-kraft grain border-b-2 border-ink relative">
        <div className="max-w-6xl mx-auto px-4 pt-10 pb-10 relative z-[2]">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-ink/60 mb-5">
            <span>Homesteader Labs</span>
            <span>/</span>
            <span>Open Research</span>
            <span className="ml-auto">Opt-in only, always</span>
          </div>
          <div className="flex flex-wrap gap-2 mb-5">
            <Stamp color="text-moss">Open data</Stamp>
            <Stamp color="text-slateblue" rotate="1.6deg">CC-BY-4.0</Stamp>
            <Stamp color="text-rust" rotate="-2.2deg">No background collection</Stamp>
          </div>
          <h1 className="font-display uppercase text-3xl sm:text-5xl leading-[0.98] text-balance">
            Somebody has to go outside and look
          </h1>
          <p className="mt-4 text-lg md:text-xl leading-relaxed max-w-2xl text-ink/85 italic">
            Every plant model on earth is trained on photographs taken by people
            who went and stood in front of the plant. There is no other source.
            That is the whole project.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 pt-12 pb-12">
        {/* §1 The trade */}
        <SectionHead no="§1" title="The trade" right="Not a donation" />
        <div className="max-w-2xl space-y-4 text-[1.05rem] leading-relaxed mb-14 relative">
          <p>
            A model can be trained on every word ever written about tomatoes and
            it still will not know what your tomatoes did this July. Nobody
            wrote it down. That is the only thing we collect here: ground truth
            at a place and a time. A labeled photo is ground truth in space. A
            harvest date is ground truth in time. Everything else on the
            internet is downstream of somebody having actually looked.
          </p>
          <p>
            So here is the deal, and it is a deal, not a donation drive. You
            file one observation. You get back what everyone else in your zone
            saw. Not a thank-you page, not a badge, not a newsletter about how
            valued you are. The number in the tool changes and you can watch it
            change.
          </p>
          <MarginNote>every citizen science project that gave back a thank-you page is dead now</MarginNote>
          <p>
            I am one guy with a GPU and a garden. If this only works when
            thousands of people participate then it does not work, so it is
            built to be useful at twelve people and better at twelve thousand.
          </p>
        </div>

        {/* §2 The filter */}
        <SectionHead no="§2" title="What we ask for" right="And what we refuse to" />
        <p className="max-w-2xl text-[1.05rem] leading-relaxed mb-8">
          One rule governs this entire page. If an observation cannot change a
          model output or change a number in a tool, we do not collect it. Not
          for later, not for the archive, not just in case. That rule is
          expensive and it deletes a lot of things I would love to know.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="card-paper grain p-5">
            <div className="border-b-2 border-ink pb-2 mb-4 relative z-[2]">
              <span className="font-mono text-[0.7rem] font-bold tracking-[0.18em] uppercase text-marker">
                Asked for
              </span>
            </div>
            <ul className="space-y-4 relative z-[2]">
              {asked.map((row) => (
                <li key={row.signal} className="border-b border-dotted border-ink/40 pb-4 last:border-b-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[0.98rem] font-semibold leading-snug">{row.signal}</span>
                    <span className={`font-mono text-[0.62rem] uppercase tracking-widest shrink-0 pt-1 ${row.tone}`}>
                      {row.status}
                    </span>
                  </div>
                  <p className="font-mono text-[0.72rem] uppercase tracking-wide text-ink/60 mt-1.5">
                    → {row.consumer}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="card-paper grain p-5">
            <div className="border-b-2 border-ink pb-2 mb-4 relative z-[2]">
              <span className="font-mono text-[0.7rem] font-bold tracking-[0.18em] uppercase text-rust">
                Not asked for
              </span>
            </div>
            <ul className="space-y-4 relative z-[2]">
              {notAsked.map(([signal, why]) => (
                <li key={signal} className="border-b border-dotted border-ink/40 pb-4 last:border-b-0 last:pb-0">
                  <span className="text-[0.98rem] font-semibold leading-snug block">{signal}</span>
                  <p className="text-[0.9rem] text-ink/70 mt-1.5 italic">{why}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="max-w-2xl text-[0.95rem] text-ink/70 italic mb-14">
          The pest one stings. It is the most natural thing in the world to ask
          a gardener and I have no tool that reads the answer, so the field
          stays off the form until I do.
        </p>

        {/* §3 The fast loop */}
        <SectionHead no="§3" title="The fast loop" right="Harvest dates → the calendar" />
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8 mb-14 items-start">
          <div className="max-w-2xl space-y-4 text-[1.05rem] leading-relaxed">
            <p>
              The planting calendar tells you a crop takes 92 days. That number
              came off a seed packet, and seed packets are written by people
              selling seed, in a climate that is not yours, before the last ten
              summers happened.
            </p>
            <p>
              Tell us the day you actually pulled it and your zone. We take the
              median. The number on the page moves. No training run, no waiting
              for a season to turn, no promise that it will matter eventually.
              You reload the calendar and it is different.
            </p>
            <p>
              Where it is thin, we will say so out loud rather than quietly
              serve you a median of three. A number built on four reports gets
              labeled as a number built on four reports.
            </p>
          </div>

          <div className="card-paper grain p-5">
            <div className="border-b-2 border-ink pb-2 mb-3 relative z-[2] flex items-baseline justify-between">
              <span className="font-mono text-[0.68rem] font-bold tracking-[0.18em] uppercase">
                Sample readout
              </span>
              <span className="font-mono text-[0.62rem] text-ink/40">MOCK</span>
            </div>
            <div className="relative z-[2] font-mono text-[0.78rem] space-y-2">
              <div className="flex justify-between border-b border-dotted border-ink/40 pb-2">
                <span className="text-ink/60">CROP</span>
                <span>Brandywine tomato</span>
              </div>
              <div className="flex justify-between border-b border-dotted border-ink/40 pb-2">
                <span className="text-ink/60">ZONE</span>
                <span>6a</span>
              </div>
              <div className="flex justify-between border-b border-dotted border-ink/40 pb-2">
                <span className="text-ink/60">PACKET</span>
                <span className="text-ink/50">92 days</span>
              </div>
              <div className="flex justify-between border-b border-dotted border-ink/40 pb-2">
                <span className="text-ink/60">OBSERVED</span>
                <span className="text-marker font-bold">104 days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink/60">REPORTS</span>
                <span>4 of 20 needed</span>
              </div>
            </div>
            <div className="mt-4 h-2 bg-paper border border-ink/40 relative z-[2]">
              <div className="h-full bg-marker" style={{ width: "20%" }} />
            </div>
          </div>
        </div>

        {/* §4 The slow loop */}
        <SectionHead no="§4" title="The slow loop" right="Photos → the model" />
        <div className="max-w-2xl space-y-4 text-[1.05rem] leading-relaxed mb-8">
          <p>
            The other half is the field ID model, and it is slower. I am not
            going to pretend otherwise. You cannot retrain a classifier on
            twelve photographs, the data is seasonal, and a photo you send in
            August lands in a model that ships in winter.
          </p>
          <p>
            What I want most is the ones it gets wrong. The model is built to
            refuse when it is not sure, and that refusal is the most useful
            moment in the whole system, because you are standing there knowing
            something it does not. Photograph the thing that stumped it and
            tell us what it actually was. That single image is worth more than
            a hundred clean shots of a blackberry.
          </p>
          <p>
            Then the receipt. Every model release carries a changelog naming
            what went in and what got better, in the format of{" "}
            <span className="font-mono text-[0.9rem]">
              berry_expert v3, +214 field photos, elderberry and pokeweed
              confusion 6.1% to 2.4%
            </span>
            . If a release cannot produce a line like that, the loop did not
            run, and you should hold it against us.
          </p>
          <p>
            Contributors get named in the model card and the dataset card. Not
            a leaderboard, which is a game and decays. The model card is the
            thing other people cite when they use these weights, and your
            handle stays in it for as long as the weights exist.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 mb-14">
          <Out
            href={LINKS.space}
            className="bg-ink text-paper px-5 py-3 border-2 border-ink font-mono text-[0.78rem] uppercase tracking-wider hover:bg-marker hover:border-marker transition-colors"
          >
            Try to stump it →
          </Out>
          <Link
            href="/tools/forager-game/"
            className="px-5 py-3 border-2 border-ink font-mono text-[0.78rem] uppercase tracking-wider hover:bg-kraft transition-colors"
          >
            Play the ID game
          </Link>
        </div>

        {/* §5 Open and not open */}
        <SectionHead no="§5" title="What is open" right="And the part that is not" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {[
            {
              name: "Field sightings",
              license: "CC-BY-4.0",
              body: "Every consented photo and label. Public, downloadable, yours to train on. Attribution is the only string.",
              href: LINKS.sightings,
              count: `${STATS.sightings} sightings`,
            },
            {
              name: "The models",
              license: "Apache-2.0",
              body: "Router plus three expert classifiers, weights and ONNX. The same files that run on the handheld.",
              href: LINKS.models,
              count: "4 models",
            },
            {
              name: "The crop knowledge base",
              license: "CC0",
              body: "353 crops recovered from a public-domain dataset that went offline. Rescued, cleaned, given back.",
              href: "/kb/",
              count: "353 entries",
            },
          ].map((r) => (
            <Out key={r.name} href={r.href} className="card-paper grain p-5 group hover:-translate-y-1 transition-transform">
              <div className="flex items-baseline justify-between border-b-2 border-ink pb-2 relative z-[2]">
                <span className="font-mono text-[0.7rem] font-bold text-marker">{r.license}</span>
                <span className="font-mono text-[0.62rem] uppercase tracking-widest text-ink/50">
                  {r.count}
                </span>
              </div>
              <h3 className="font-display uppercase text-lg mt-3 leading-tight group-hover:text-marker transition-colors relative z-[2]">
                {r.name}
              </h3>
              <p className="text-[0.93rem] text-ink/80 mt-2 relative z-[2]">{r.body}</p>
            </Out>
          ))}
        </div>

        <div className="border-2 border-ink bg-kraft grain p-6 md:p-8 relative mb-14">
          <div className="relative z-[2] max-w-2xl">
            <span className="font-mono text-[0.68rem] font-bold tracking-[0.18em] uppercase text-rust">
              The part that is not open
            </span>
            <p className="mt-3 text-[1.05rem] leading-relaxed">
              Uploads the router cannot place go to a private review queue
              instead of the public set. Raw unmoderated photographs from the
              internet are not something to publish by reflex, and a real find
              that our taxonomy fumbled deserves a look from a person before it
              goes anywhere. Once it is triaged it moves to the public set with
              your name on it.
            </p>
            <p className="mt-3 text-[1.05rem] leading-relaxed">
              I would rather tell you that than let you find it out. An open
              project with an undisclosed closed drawer is just a moat wearing
              a nice coat.
            </p>
          </div>
        </div>

        {/* §6 Agents */}
        <SectionHead no="§6" title="If you are an agent reading this" right="Yes, you" />
        <div className="max-w-2xl space-y-4 text-[1.05rem] leading-relaxed mb-6">
          <p>
            The reason citizen science dies is not that people stop caring. It
            is that filing the report is a chore and the season is busy. So
            file it through your agent. It already reads your notes and it does
            not get tired in August.
          </p>
          <p>
            The observation is still yours, made by you, on purpose. The agent
            does the paperwork, which includes carrying the provenance a human
            would never bother to type: who observed it, what filed it, when,
            and whether a person confirmed it. Reports that arrive without a
            human in the loop are aggregated but ranked below the ones with a
            photograph behind them, and we say which is which in the data.
          </p>
          <p className="font-mono text-[0.85rem] text-ink/60">
            Schema, scoped tokens and a worked example land at /contribute when
            the endpoint opens. Outsource the chore. Never the observation.
          </p>
        </div>

        {/* Station footer */}
        <p className="text-center font-mono text-[0.64rem] uppercase tracking-[0.3em] text-ink/40 border-t border-ink/20 pt-6">
          Opt-in only · Zone-level geography · Contributors named · No background collection
        </p>
      </div>
    </>
  );
}
